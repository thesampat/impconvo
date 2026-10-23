// Settings + connection state shared by every screen.
// Ported from the settings part of android/app/.../ui/viewmodel/AppViewModel.kt.
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api } from '../api/client';

const MODEL_KEY = 'model_name';
const DEFAULT_MODEL = 'gemini-3.5-flash';

export const AVAILABLE_MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash'] as const;

interface SettingsState {
  modelName: string;
  isConnected: boolean;
  isTesting: boolean;
  testConnection: () => Promise<void>;
  updateModelName: (model: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [modelName, setModelName] = useState(DEFAULT_MODEL);
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const testConnection = useCallback(async () => {
    setIsTesting(true);
    try {
      const config = await api.getConfig();
      setIsConnected(true);
      setModelName(config.model_name);
    } catch {
      setIsConnected(false);
    } finally {
      setIsTesting(false);
    }
  }, []);

  const updateModelName = useCallback(async (model: string) => {
    try {
      await api.saveConfig({ model_name: model });
    } catch {
      // Keep the local choice even if the backend could not be updated
    }
    setModelName(model);
    try {
      await AsyncStorage.setItem(MODEL_KEY, model);
    } catch {
      // storage unavailable; the in-memory value still applies
    }
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(MODEL_KEY)
      .then((saved) => saved && setModelName(saved))
      .catch(() => {});
    testConnection();
  }, [testConnection]);

  const value = useMemo(
    () => ({ modelName, isConnected, isTesting, testConnection, updateModelName }),
    [modelName, isConnected, isTesting, testConnection, updateModelName],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
