import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SCREENS, type ScreenId } from '../screens/types';
import { useSettings } from '../state/SettingsContext';
import { colors, gradients, radius, spacing } from '../theme';

const DRAWER_WIDTH = 310;
const logo = require('../../assets/images/app_logo.png');

interface Props {
  open: boolean;
  current: ScreenId;
  onClose: () => void;
  onSelect: (id: ScreenId) => void;
  onGuide: () => void;
  onSettings: () => void;
  /** Called once the close animation has finished and the Modal is gone */
  onClosed?: () => void;
}

export default function Drawer({ open, current, onClose, onSelect, onGuide, onSettings, onClosed }: Props) {
  const insets = useSafeAreaInsets();
  const { isConnected, isTesting, testConnection } = useSettings();
  const progress = useRef(new Animated.Value(0)).current;
  // Keep the Modal mounted until the close animation finishes
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) setMounted(true);
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? 240 : 200,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });
  }, [open, progress]);

  const wasMounted = useRef(mounted);
  useEffect(() => {
    if (wasMounted.current && !mounted) onClosed?.();
    wasMounted.current = mounted;
  }, [mounted, onClosed]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-DRAWER_WIDTH, 0] });
  const statusColor = isConnected ? colors.success : colors.error;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom, transform: [{ translateX }] },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoFrameBorder}
            >
              <View style={styles.logoFrame}>
                <Image source={logo} style={styles.logo} accessibilityLabel="App Logo" />
              </View>
            </LinearGradient>
            <View>
              <Text style={styles.brand}>ProovCon</Text>
              <Text style={styles.tagline}>AI Texting Coach</Text>
            </View>
          </View>

          <Pressable
            onPress={testConnection}
            disabled={isTesting}
            accessibilityRole="button"
            accessibilityLabel="Re-test API connection"
            style={[
              styles.chip,
              {
                backgroundColor: isConnected ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)',
                borderColor: isConnected ? 'rgba(52,211,153,0.3)' : 'rgba(251,113,133,0.3)',
              },
            ]}
          >
            {isTesting ? (
              <ActivityIndicator size="small" color={statusColor} style={styles.chipSpinner} />
            ) : (
              <View style={[styles.chipDot, { backgroundColor: statusColor }]} />
            )}
            <Text style={[styles.chipText, { color: statusColor }]}>
              {isConnected ? 'API Server Ready' : 'API Disconnected'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.nav}>
          {SCREENS.map((s) => {
            const selected = s.id === current;
            const row = (
              <>
                {selected && <View style={styles.activeBar} />}
                <Text style={styles.navIcon}>{s.icon}</Text>
                <Text style={[styles.navText, selected && styles.navTextActive]}>{s.title}</Text>
              </>
            );
            return (
              <Pressable
                key={s.id}
                onPress={() => onSelect(s.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={({ pressed }) => [styles.navItem, pressed && !selected && styles.pressed]}
              >
                {selected ? (
                  <LinearGradient
                    colors={['rgba(56,189,248,0.2)', 'rgba(158,122,255,0.15)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.navInner, styles.navInnerActive]}
                  >
                    {row}
                  </LinearGradient>
                ) : (
                  <View style={styles.navInner}>{row}</View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.spacer} />

        <View style={styles.footer}>
          <Pressable
            onPress={onGuide}
            accessibilityRole="button"
            style={({ pressed }) => [styles.footerItem, pressed && styles.pressed]}
          >
            <Text style={[styles.footerIcon, { color: colors.primary }]}>ⓘ</Text>
            <Text style={styles.footerText}>Screen Guide & Tips</Text>
          </Pressable>
          <View style={styles.footerDivider} />
          <Pressable
            onPress={onSettings}
            accessibilityRole="button"
            style={({ pressed }) => [styles.footerItem, pressed && styles.pressed]}
          >
            <Text style={[styles.footerIcon, { color: colors.textMuted }]}>⚙</Text>
            <Text style={styles.footerText}>Settings & Connection</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    maxWidth: '85%',
    backgroundColor: 'rgba(22,22,34,0.97)',
    borderTopRightRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  header: { paddingHorizontal: 20, paddingVertical: 20, gap: 14 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoFrameBorder: { width: 56, height: 56, borderRadius: radius.lg, padding: 1 },
  logoFrame: {
    flex: 1,
    borderRadius: radius.lg - 1,
    backgroundColor: '#1A1F33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 44, height: 44, borderRadius: radius.md },
  brand: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  tagline: { color: colors.textMuted, fontSize: 11 },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipSpinner: { transform: [{ scale: 0.6 }], width: 10, height: 10 },
  chipText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  nav: { gap: spacing.xs, paddingHorizontal: 14 },
  navItem: { borderRadius: 14, overflow: 'hidden' },
  navInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navInnerActive: { borderColor: 'rgba(56,189,248,0.4)' },
  activeBar: { width: 3, height: 18, borderRadius: 2, backgroundColor: colors.primary, marginRight: 10 },
  navIcon: { fontSize: 18, marginRight: spacing.md },
  navText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  navTextActive: { color: colors.primary, fontWeight: '800' },
  pressed: { backgroundColor: 'rgba(255,255,255,0.06)' },
  spacer: { flex: 1 },
  footer: {
    margin: 14,
    padding: spacing.xs,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(32,32,48,0.4)',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  footerIcon: { fontSize: 17, width: 18, textAlign: 'center' },
  footerText: { color: colors.text, fontSize: 13, fontWeight: '500' },
  footerDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.sm },
});
