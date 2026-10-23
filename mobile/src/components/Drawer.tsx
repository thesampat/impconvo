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
import { ADMIN_SECTIONS, type AdminSection } from './SettingsDialog';
import { colors, radius, spacing, type } from '../theme';

const DRAWER_WIDTH = 310;
const SECRET_TAP_COUNT = 5;
const SECRET_TAP_WINDOW_MS = 3000;
const logo = require('../../assets/images/app_logo_mark.png');

interface Props {
  open: boolean;
  current: ScreenId;
  onClose: () => void;
  onSelect: (id: ScreenId) => void;
  onGuide: () => void;
  onAdmin: (section: AdminSection) => void;
  /** Hidden admin gesture: 5 quick taps on the logo/brand block */
  onBrandSecretTap: () => void;
  /** Called once the close animation has finished and the Modal is gone */
  onClosed?: () => void;
}

export default function Drawer({ open, current, onClose, onSelect, onGuide, onAdmin, onBrandSecretTap, onClosed }: Props) {
  const insets = useSafeAreaInsets();
  const { isConnected, isTesting, testConnection, isAdmin } = useSettings();
  const progress = useRef(new Animated.Value(0)).current;
  // Hidden admin entry: 5 quick taps on the logo
  const taps = useRef<number[]>([]);
  const onBrandTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < SECRET_TAP_WINDOW_MS), now];
    if (taps.current.length >= SECRET_TAP_COUNT) {
      taps.current = [];
      onBrandSecretTap();
    }
  };
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
          {/* No press feedback or a11y hint on purpose: the 5 taps are a hidden admin entry point */}
          <Pressable onPress={onBrandTap} style={styles.brandRow}>
            <Image source={logo} style={styles.logo} accessibilityLabel="App Logo" />
            <View>
              <Text style={styles.brand}>ProovCon</Text>
              <Text style={styles.tagline}>AI Texting Coach</Text>
            </View>
          </Pressable>

          {isAdmin && (
            <Pressable
              onPress={testConnection}
              disabled={isTesting}
              accessibilityRole="button"
              accessibilityLabel="Re-test API connection"
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color={colors.textSecondary} style={styles.chipSpinner} />
              ) : (
                <View style={[styles.chipDot, { backgroundColor: statusColor }]} />
              )}
              <Text style={styles.chipText}>{isConnected ? 'API Server Ready' : 'API Disconnected'}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Practice</Text>
        <View style={styles.nav}>
          {SCREENS.map((s) => {
            const selected = s.id === current;
            return (
              <Pressable
                key={s.id}
                onPress={() => onSelect(s.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.navItem,
                  selected && styles.navItemActive,
                  pressed && !selected && styles.pressed,
                ]}
              >
                <View style={[styles.activeBar, selected && styles.activeBarOn]} />
                <Text style={[styles.navText, selected && styles.navTextActive]}>{s.title}</Text>
              </Pressable>
            );
          })}
        </View>

        {isAdmin && (
          <>
            <Text style={styles.sectionLabel}>Admin</Text>
            <View style={styles.nav}>
              {ADMIN_SECTIONS.map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => onAdmin(a.id)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
                >
                  <View style={styles.activeBar} />
                  <Text style={styles.navText}>{a.title}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <View style={styles.spacer} />

        <View style={styles.footer}>
          <Pressable
            onPress={onGuide}
            accessibilityRole="button"
            style={({ pressed }) => [styles.footerItem, pressed && styles.pressed]}
          >
            <Text style={styles.footerText}>Screen Guide & Tips</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    maxWidth: '85%',
    backgroundColor: colors.surface,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.sm },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logo: { width: 32, height: 32 },
  brand: { ...type.heading, fontSize: 16 },
  tagline: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  // Plain status text with a dot; no pill
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipSpinner: { transform: [{ scale: 0.6 }], width: 10, height: 10 },
  chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  sectionLabel: {
    ...type.label,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  nav: { gap: 1, paddingHorizontal: spacing.sm },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
    height: 36,
    borderRadius: radius.sm,
  },
  navItemActive: { backgroundColor: colors.surfaceVariant },
  activeBar: { width: 2, height: 16, borderRadius: 1, marginRight: 10, backgroundColor: 'transparent' },
  activeBarOn: { backgroundColor: colors.accent },
  navText: { color: colors.textSecondary, fontSize: 14, fontWeight: '400' },
  navTextActive: { color: colors.text, fontWeight: '500' },
  pressed: { backgroundColor: colors.surfaceVariant },
  spacer: { flex: 1 },
  footer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    gap: 1,
  },
  footerItem: {
    paddingHorizontal: spacing.md,
    height: 36,
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  footerText: { color: colors.textSecondary, fontSize: 14 },
});
