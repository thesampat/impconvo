import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppShell from './src/components/AppShell';
import { SettingsProvider } from './src/state/SettingsContext';
import { ThemeProvider, useTheme } from './src/state/ThemeContext';

// Web only: swap the browser's default (orange/blue) focus ring for the theme's accent border
function useWebFocusStyle(accent: string) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.textContent = `input:focus, textarea:focus { outline: none; border-color: ${accent} !important; }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, [accent]);
}

function Root() {
  const { theme } = useTheme();
  useWebFocusStyle(theme.colors.accent);
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppShell />
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SettingsProvider>
          <Root />
        </SettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
