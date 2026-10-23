// Active colour theme, chosen by the user and remembered on the device.
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { DEFAULT_THEME_ID, getTheme, type Theme, type ThemeId } from '../theme';

const THEME_KEY = 'theme_id';

interface ThemeState {
  theme: Theme;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME_ID);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((saved) => saved && setThemeId(getTheme(saved).id))
      .catch(() => {});
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    AsyncStorage.setItem(THEME_KEY, id).catch(() => {
      // storage unavailable; the choice still applies for this session
    });
  }, []);

  const value = useMemo(() => ({ theme: getTheme(themeId), setTheme }), [themeId, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
