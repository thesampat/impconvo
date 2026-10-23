import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { makeStyles, radius, spacing, useColors } from '../../theme';
import { BANTER_PRESETS, CUSTOM_PRESET_INDEX, withAlpha } from './presets';
import type { BotConfig } from './useBanter';

interface Props {
  label: string;
  accentColor: string;
  config: BotConfig;
  onChange: (config: BotConfig) => void;
}

const CHIPS = [
  ...BANTER_PRESETS.map((p, idx) => ({ idx, label: p.title.split(' &')[0] })),
  { idx: CUSTOM_PRESET_INDEX, label: 'Custom' },
];
const CHIP_ROWS = [CHIPS.slice(0, 3), CHIPS.slice(3)];

export default function PersonaConfigCard({ label, accentColor, config, onChange }: Props) {
  const styles = useStyles();
  const c = useColors();
  const update = (patch: Partial<BotConfig>) => onChange({ ...config, ...patch });

  return (
    <View>
      <View style={styles.headerRow}>
        <View style={[styles.dot, { backgroundColor: accentColor }]} />
        <Text style={styles.label}>{label}</Text>
      </View>

      <TextInput
        value={config.name}
        onChangeText={(name) => update({ name })}
        placeholder="Name (e.g. Rohan)"
        placeholderTextColor={c.textMuted}
        style={styles.input}
        selectionColor={c.accent}
        autoCorrect={false}
        returnKeyType="done"
      />

      <Text style={styles.styleLabel}>Personality</Text>
      <View style={styles.chipGrid}>
        {CHIP_ROWS.map((row, r) => (
          <View key={r} style={styles.chipRow}>
            {row.map(({ idx, label: chipLabel }) => {
              const selected = config.presetIndex === idx;
              return (
                <Pressable
                  key={idx}
                  onPress={() => update({ presetIndex: idx })}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
                    {chipLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {config.presetIndex === CUSTOM_PRESET_INDEX && (
        <TextInput
          value={config.customStyle}
          onChangeText={(customStyle) => update({ customStyle })}
          placeholder="e.g. passive-aggressive sommelier who despises cheap wine"
          placeholderTextColor={c.textMuted}
          style={[styles.input, styles.customInput]}
          selectionColor={c.accent}
          returnKeyType="done"
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((c, t) => ({
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: spacing.sm },
  label: { ...t.label },
  input: {
    minHeight: 38,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.borderGlow,
    backgroundColor: c.surface,
    color: c.text,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  customInput: { marginTop: spacing.sm, fontSize: 14 },
  styleLabel: { ...t.caption, marginTop: spacing.md, marginBottom: spacing.xs },
  chipGrid: { gap: spacing.xs },
  chipRow: { flexDirection: 'row', gap: spacing.xs },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.borderGlow,
  },
  chipSelected: { borderColor: c.accent, backgroundColor: withAlpha(c.accent, 0.08) },
  chipText: { color: c.textSecondary, fontSize: 13 },
  chipTextSelected: { color: c.accent, fontWeight: '500' },
}));
