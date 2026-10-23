import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppShell from './src/components/AppShell';
import { SettingsProvider } from './src/state/SettingsContext';
import { colors } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <View style={styles.root}>
          {/* Faint purple glow behind everything */}
          <LinearGradient
            colors={['rgba(158,122,255,0.14)', 'rgba(56,189,248,0.04)', 'transparent']}
            locations={[0, 0.35, 0.7]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <AppShell />
          <StatusBar style="light" />
        </View>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
