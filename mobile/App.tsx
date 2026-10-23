import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppShell from './src/components/AppShell';
import { SettingsProvider } from './src/state/SettingsContext';
import { colors } from './src/theme';

// Web only: swap the browser's default (orange/blue) focus ring for the palette's accent border
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `input:focus, textarea:focus { outline: none; border-color: ${colors.accent} !important; }`;
  document.head.appendChild(style);
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <View style={styles.root}>
          <AppShell />
          <StatusBar style="dark" />
        </View>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
