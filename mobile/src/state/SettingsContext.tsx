// Settings + connection state shared by every screen.
// Ported from the settings part of android/app/.../ui/viewmodel/AppViewModel.kt.
// The model and usage limits live on the server; only the admin (owner) can see or change them.
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { IS_ADMIN_BUILD } from '../appVariant';
import { api, ApiError, setAdminCode, setDeviceId, verifyAdminCode } from '../api/client';
import type { AdminSettings, AdminSettingsPatch, AdminUsage } from '../api/types';

export type { AdminSettings, AdminSettingsPatch, AdminUsage, UsageRow } from '../api/types';

const DEVICE_ID_KEY = 'device_id';
// expo-secure-store would be better on native, but we avoid adding a dependency for this.
const ADMIN_CODE_KEY = 'admin_code';

// Labels for the admin model picker; the list itself comes from adminSettings.available_models
export const MODEL_NOTES: Record<string, string> = {
  'gemini-3.8-flash': 'Newest, recommended',
  'gemini-3.5-flash': 'Fast',
  'gemini-3.5-flash-lite': 'Fastest, lightest',
  'gemini-3.1-pro-preview': 'Strongest, slower',
};

// 32-char lowercase hex, without adding a dependency
function generateDeviceId(): string {
  const bytes = new Uint8Array(16);
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c?.getRandomValues) {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function loadDeviceId(): Promise<string> {
  let id: string | null = null;
  try {
    id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  } catch {
    // storage unavailable; fall through and use a fresh id for this session
  }
  if (id && /^[0-9a-f]{32}$/.test(id)) return id;
  id = generateDeviceId();
  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    // storage unavailable; the in-memory id still applies
  }
  return id;
}

interface SettingsState {
  isConnected: boolean;
  isTesting: boolean;
  testConnection: () => Promise<void>;
  isAdmin: boolean;
  unlockAdmin: (code: string) => Promise<void>;
  lockAdmin: () => Promise<void>;
  adminSettings: AdminSettings | null;
  refreshAdminSettings: () => Promise<void>;
  saveAdminSettings: (patch: AdminSettingsPatch) => Promise<void>;
  adminUsage: AdminUsage | null;
  refreshAdminUsage: () => Promise<void>;
}

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [adminUsage, setAdminUsage] = useState<AdminUsage | null>(null);
  // Bumped on every unlock/lock so a slow verify can't override a newer lock/unlock
  const adminEpoch = useRef(0);

  const testConnection = useCallback(async () => {
    setIsTesting(true);
    try {
      await api.getConfig();
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    } finally {
      setIsTesting(false);
    }
  }, []);

  const clearAdmin = useCallback(async () => {
    adminEpoch.current++;
    setAdminCode('');
    setIsAdmin(false);
    setAdminSettings(null);
    setAdminUsage(null);
    try {
      await AsyncStorage.removeItem(ADMIN_CODE_KEY);
    } catch {
      // storage unavailable; the in-memory state is already cleared
    }
  }, []);

  const unlockAdmin = useCallback(async (code: string) => {
    const trimmed = code.trim();
    const epoch = ++adminEpoch.current;
    // Throws ApiError (401 wrong code, 429 locked out, 503 not configured) before anything is stored
    const settings = await verifyAdminCode(trimmed);
    if (epoch !== adminEpoch.current) return;
    setAdminCode(trimmed);
    setAdminSettings(settings);
    setIsAdmin(true);
    try {
      await AsyncStorage.setItem(ADMIN_CODE_KEY, trimmed);
    } catch {
      // storage unavailable; admin stays unlocked for this session
    }
  }, []);

  const lockAdmin = useCallback(() => clearAdmin(), [clearAdmin]);

  // A 401 on an admin call means the stored code is no longer valid
  const handleAdminError = useCallback(
    async (e: unknown) => {
      if (e instanceof ApiError && e.status === 401) await clearAdmin();
      throw e;
    },
    [clearAdmin],
  );

  const refreshAdminSettings = useCallback(async () => {
    try {
      setAdminSettings(await api.getAdminSettings());
    } catch (e) {
      await handleAdminError(e);
    }
  }, [handleAdminError]);

  const saveAdminSettings = useCallback(
    async (patch: AdminSettingsPatch) => {
      try {
        setAdminSettings(await api.saveAdminSettings(patch));
      } catch (e) {
        await handleAdminError(e);
      }
    },
    [handleAdminError],
  );

  const refreshAdminUsage = useCallback(async () => {
    try {
      setAdminUsage(await api.getAdminUsage());
    } catch (e) {
      await handleAdminError(e);
    }
  }, [handleAdminError]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Device id first so every request (including the connection check) carries it
      const id = await loadDeviceId();
      if (cancelled) return;
      setDeviceId(id);
      testConnection();

      // The public app never uses admin mode, so it never looks for or sends an admin code
      if (!IS_ADMIN_BUILD) return;
      let stored: string | null = null;
      try {
        stored = await AsyncStorage.getItem(ADMIN_CODE_KEY);
      } catch {
        // storage unavailable; stay non-admin
      }
      if (!stored || cancelled) return;
      const epoch = ++adminEpoch.current;
      try {
        const settings = await verifyAdminCode(stored);
        if (cancelled || epoch !== adminEpoch.current) return;
        setAdminCode(stored);
        setAdminSettings(settings);
        setIsAdmin(true);
      } catch (e) {
        if (cancelled || epoch !== adminEpoch.current) return;
        // Stale code: forget it. Other failures (offline etc.) keep it for next launch,
        // but admin stays locked until a verify succeeds.
        if (e instanceof ApiError && e.status === 401) await clearAdmin();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [testConnection, clearAdmin]);

  const value = useMemo<SettingsState>(
    () => ({
      isConnected,
      isTesting,
      testConnection,
      isAdmin,
      unlockAdmin,
      lockAdmin,
      adminSettings,
      refreshAdminSettings,
      saveAdminSettings,
      adminUsage,
      refreshAdminUsage,
    }),
    [
      isConnected,
      isTesting,
      testConnection,
      isAdmin,
      unlockAdmin,
      lockAdmin,
      adminSettings,
      refreshAdminSettings,
      saveAdminSettings,
      adminUsage,
      refreshAdminUsage,
    ],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
