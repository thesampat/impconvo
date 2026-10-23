import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius } from '../../theme';
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
  const update = (patch: Partial<BotConfig>) => onChange({ ...config, ...patch });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.dot, { backgroundColor: accentColor }]} />
        <Text style={[styles.label, { color: accentColor }]}>{label}</Text>
      </View>

      <TextInput
        value={config.name}
        onChangeText={(name) => update({ name })}
        placeholder="Name (e.g. Alex)"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        selectionColor={accentColor}
        autoCorrect={false}
        returnKeyType="done"
      />

      <Text style={styles.styleLabel}>Personality Style:</Text>
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
                  style={[
                    styles.chip,
                    selected && { backgroundColor: withAlpha(accentColor, 0.22), borderColor: accentColor },
                  ]}
                >
                  <Text
                    style={[styles.chipText, selected && { color: accentColor, fontWeight: '700' }]}
                    numberOfLines={1}
                  >
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
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.customInput]}
          selectionColor={accentColor}
          returnKeyType="done"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: withAlpha(colors.surfaceVariant, 0.35),
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  label: { fontSize: 13, fontWeight: '700' },
  input: {
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: withAlpha(colors.surface, 0.5),
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  customInput: { marginTop: 10, fontSize: 12, borderRadius: radius.sm },
  styleLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '500', marginTop: 10, marginBottom: 6 },
  chipGrid: { gap: 6 },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: withAlpha(colors.surface, 0.5),
  },
  chipText: { color: colors.textMuted, fontSize: 11 },
});
