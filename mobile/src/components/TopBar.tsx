import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../theme';

interface Props {
  title: string;
  isConnected: boolean;
  onMenu: () => void;
  onRetest: () => void;
  onInfo: () => void;
  onSettings: () => void;
}

export default function TopBar({ title, isConnected, onMenu, onRetest, onInfo, onSettings }: Props) {
  return (
    <View style={styles.bar}>
      <IconButton label="☰" onPress={onMenu} a11y="Open menu" />
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Pressable onPress={onRetest} hitSlop={12} accessibilityRole="button" accessibilityLabel="Re-test API connection">
          <View style={[styles.dot, { backgroundColor: isConnected ? colors.success : colors.error }]} />
        </Pressable>
      </View>
      <IconButton label="ⓘ" onPress={onInfo} a11y="Screen guide" color={colors.primary} />
      <IconButton label="⚙" onPress={onSettings} a11y="Settings" />
    </View>
  );
}

function IconButton({
  label,
  onPress,
  a11y,
  color = colors.text,
}: {
  label: string;
  onPress: () => void;
  a11y: string;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}
    >
      <Text style={[styles.icon, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xs },
  title: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  iconPressed: { backgroundColor: 'rgba(255,255,255,0.08)' },
  icon: { fontSize: 22 },
});
