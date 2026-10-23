import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type } from '../theme';

interface Props {
  title: string;
  isConnected: boolean;
  /** Connection dot and settings icon are admin-only */
  isAdmin: boolean;
  onMenu: () => void;
  onRetest: () => void;
  onInfo: () => void;
  onSettings: () => void;
}

export default function TopBar({ title, isConnected, isAdmin, onMenu, onRetest, onInfo, onSettings }: Props) {
  return (
    <View style={styles.bar}>
      <IconButton onPress={onMenu} a11y="Open menu">
        <MenuGlyph />
      </IconButton>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {isAdmin && (
          <Pressable onPress={onRetest} hitSlop={12} accessibilityRole="button" accessibilityLabel="Re-test API connection">
            <View style={[styles.dot, { backgroundColor: isConnected ? colors.success : colors.error }]} />
          </Pressable>
        )}
      </View>
      <IconButton onPress={onInfo} a11y="Screen guide">
        <InfoGlyph />
      </IconButton>
      {isAdmin && (
        <IconButton onPress={onSettings} a11y="Admin settings">
          <SlidersGlyph />
        </IconButton>
      )}
    </View>
  );
}

function IconButton({ onPress, a11y, children }: { onPress: () => void; a11y: string; children: ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}
    >
      {children}
    </Pressable>
  );
}

// Simple line glyphs drawn with Views so they render identically on web, iOS and Android (no emoji fallback)
function MenuGlyph() {
  return (
    <View style={styles.menuGlyph}>
      <View style={styles.line} />
      <View style={[styles.line, styles.lineShort]} />
    </View>
  );
}

function InfoGlyph() {
  return (
    <View style={styles.infoGlyph}>
      <Text style={styles.infoText}>i</Text>
    </View>
  );
}

function SlidersGlyph() {
  return (
    <View style={styles.slidersGlyph}>
      <View style={styles.sliderRow}>
        <View style={styles.line} />
        <View style={[styles.knob, { left: 3 }]} />
      </View>
      <View style={styles.sliderRow}>
        <View style={styles.line} />
        <View style={[styles.knob, { right: 3 }]} />
      </View>
    </View>
  );
}

const GLYPH_COLOR = colors.textSecondary;

const styles = StyleSheet.create({
  bar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xs },
  title: { ...type.heading, flexShrink: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  iconBtn: { width: 38, height: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  iconPressed: { backgroundColor: colors.surfaceVariant },
  line: { height: 1.5, width: 16, borderRadius: 1, backgroundColor: GLYPH_COLOR },
  lineShort: { width: 10 },
  menuGlyph: { width: 16, gap: 5 },
  infoGlyph: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: GLYPH_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { color: GLYPH_COLOR, fontSize: 10, fontWeight: '700', lineHeight: 12 },
  slidersGlyph: { width: 16, gap: 6 },
  sliderRow: { justifyContent: 'center' },
  knob: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: GLYPH_COLOR,
  },
});
