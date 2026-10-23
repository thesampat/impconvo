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
import { IS_ADMIN_BUILD } from '../appVariant';
import { useSettings } from '../state/SettingsContext';
import { useTheme } from '../state/ThemeContext';
import { type AdminSection } from './SettingsDialog';
import { THEMES, makeStyles, radius, spacing, useColors } from '../theme';

const DRAWER_WIDTH = 310;
const logo = require('../../assets/images/app_logo_mark.png');

interface Props {
  open: boolean;
  current: ScreenId;
  onClose: () => void;
  onSelect: (id: ScreenId) => void;
  onGuide: () => void;
  onAdmin: (section: AdminSection) => void;
  /** Called once the close animation has finished and the Modal is gone */
  onClosed?: () => void;
}

export default function Drawer({ open, current, onClose, onSelect, onGuide, onAdmin, onClosed }: Props) {
  const styles = useStyles();
  const c = useColors();
  const { theme, setTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isConnected, isTesting, testConnection, isAdmin } = useSettings();
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
  const statusColor = isConnected ? c.success : c.error;

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
            <Image source={logo} style={styles.logo} accessibilityLabel="App Logo" />
            <View>
              <Text style={styles.brand}>ProovCon</Text>
              <Text style={styles.tagline}>AI Texting Coach</Text>
            </View>
          </View>

          {isAdmin && (
            <Pressable
              onPress={testConnection}
              disabled={isTesting}
              accessibilityRole="button"
              accessibilityLabel="Re-test API connection"
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color={c.textSecondary} style={styles.chipSpinner} />
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

        {/* Only the owner's "ProovCon Admin" app has this section; the public app has no admin UI */}
        {IS_ADMIN_BUILD && (
          <>
            <Text style={styles.sectionLabel}>Admin</Text>
            <View style={styles.nav}>
              {/* One entry: the admin popup has its own tabs for Usage, Model, Limits and Device */}
              <Pressable
                onPress={() => onAdmin('usage')}
                accessibilityRole="button"
                style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
              >
                <View style={styles.activeBar} />
                <Text style={[styles.navText, styles.flex]}>Admin panel</Text>
                {!isAdmin ? <Text style={styles.navHint}>Enter code</Text> : null}
              </Pressable>
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.nav}>
          {/* Themes apply instantly and the menu stays open, so they can be compared */}
          {THEMES.map((t) => {
            const selected = t.id === theme.id;
            const p = t.colors;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTheme(t.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${t.name} theme`}
                style={({ pressed }) => [styles.navItem, selected && styles.navItemActive, pressed && !selected && styles.pressed]}
              >
                <View style={[styles.activeBar, selected && styles.activeBarOn]} />
                <View style={styles.swatches}>
                  <View style={[styles.swatch, { backgroundColor: p.background, borderWidth: StyleSheet.hairlineWidth, borderColor: p.borderGlow }]} />
                  <View style={[styles.swatch, { backgroundColor: p.primary }]} />
                  <View style={[styles.swatch, { backgroundColor: p.accent }]} />
                </View>
                <Text style={[styles.navText, styles.flex, selected && styles.navTextActive]}>{t.name}</Text>
                {selected ? <Text style={styles.check}>✓</Text> : null}
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
            <Text style={styles.footerText}>Screen Guide & Tips</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const useStyles = makeStyles((c, t) => ({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: c.scrim },
  sheet: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    maxWidth: '85%',
    backgroundColor: c.surface,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.sm },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logo: { width: 32, height: 32 },
  brand: { ...t.heading, fontSize: 16 },
  tagline: { color: c.textMuted, fontSize: 12, marginTop: 1 },
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
  chipText: { color: c.textSecondary, fontSize: 12, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.divider },
  sectionLabel: {
    ...t.label,
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
  navItemActive: { backgroundColor: c.surfaceVariant },
  activeBar: { width: 2, height: 16, borderRadius: 1, marginRight: 10, backgroundColor: 'transparent' },
  activeBarOn: { backgroundColor: c.accent },
  navText: { color: c.textSecondary, fontSize: 14, fontWeight: '400' },
  navTextActive: { color: c.text, fontWeight: '500' },
  swatches: { flexDirection: 'row', gap: 3, marginRight: spacing.md },
  swatch: { width: 12, height: 12, borderRadius: radius.sm },
  check: { color: c.accent, fontSize: 14, fontWeight: '600' },
  flex: { flex: 1 },
  navHint: { color: c.textMuted, fontSize: 13 },
  pressed: { backgroundColor: c.surfaceVariant },
  spacer: { flex: 1 },
  footer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.divider,
    gap: 1,
  },
  footerItem: {
    paddingHorizontal: spacing.md,
    height: 36,
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  footerText: { color: c.textSecondary, fontSize: 14 },
}));
