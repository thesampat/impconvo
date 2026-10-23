import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PartnerPersona } from '../../api/types';
import { colors, radius } from '../../theme';
import { PARTNER_PERSONAS } from './types';

interface Props {
  scenario: string;
  persona: PartnerPersona;
  onSelectPersona: (persona: PartnerPersona) => void;
  onCyclePersona: () => void;
  onReport: () => void;
  onReset: () => void;
}

const HIT_SLOP = { top: 8, bottom: 8, left: 6, right: 6 };

export default function ScenarioBanner({
  scenario,
  persona,
  onSelectPersona,
  onCyclePersona,
  onReport,
  onReset,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const personaShort = PARTNER_PERSONAS.find((p) => p.id === persona)?.short ?? persona;

  if (!expanded) {
    return (
      <Pressable style={[styles.container, styles.collapsedRow]} onPress={() => setExpanded(true)}>
        <View style={styles.chevron}>
          <Text style={styles.chevronText} accessibilityLabel="Expand scenario">
            ▾
          </Text>
        </View>
        <Text style={styles.vibeLabel}>Vibe: </Text>
        <Text style={styles.scenarioLine} numberOfLines={1}>
          {scenario}
        </Text>
        <Pressable onPress={onReport} hitSlop={HIT_SLOP} style={styles.iconButton} accessibilityLabel="Vibe Review Report">
          <Text style={styles.reportIcon}>📊</Text>
        </Pressable>
        <Pressable onPress={onCyclePersona} style={styles.personaPill} accessibilityLabel="Change partner persona">
          <Text style={styles.personaPillText}>⚡ {personaShort}</Text>
        </Pressable>
        <Pressable onPress={onReset} hitSlop={HIT_SLOP} style={styles.iconButton} accessibilityLabel="Reset scenario">
          <Text style={styles.resetIcon}>↻</Text>
        </Pressable>
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, styles.expanded]}>
      <View style={styles.expandedHeader}>
        <Pressable style={styles.expandedTitleRow} onPress={() => setExpanded(false)}>
          <View style={styles.chevron}>
            <Text style={styles.chevronText} accessibilityLabel="Collapse scenario">
              ▴
            </Text>
          </View>
          <Text style={styles.expandedTitle}>Active Scenario Context</Text>
        </Pressable>
        <View style={styles.actions}>
          <Pressable onPress={onReport} style={[styles.actionChip, styles.reportChip]} accessibilityRole="button">
            <Text style={[styles.actionText, { color: colors.accentPurple }]}>📊 Report</Text>
          </Pressable>
          <Pressable onPress={onReset} style={[styles.actionChip, styles.resetChip]} accessibilityRole="button">
            <Text style={[styles.actionText, { color: colors.error }]}>✕ Reset</Text>
          </Pressable>
        </View>
      </View>

      <Pressable onPress={() => setExpanded(false)}>
        <Text style={styles.scenarioFull}>{scenario}</Text>
      </Pressable>

      <View style={styles.personaRow}>
        <Text style={styles.personaLabel}>Persona:</Text>
        {PARTNER_PERSONAS.map((p) => {
          const selected = p.id === persona;
          return (
            <Pressable
              key={p.id}
              onPress={() => onSelectPersona(p.id)}
              style={[styles.personaChip, selected && styles.personaChipSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.personaChipText, selected && styles.personaChipTextSelected]}>{p.short}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(22,22,34,0.85)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  collapsedRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(56,189,248,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  chevronText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  vibeLabel: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  scenarioLine: { flex: 1, color: colors.text, fontSize: 12, marginRight: 6 },
  iconButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  reportIcon: { fontSize: 15 },
  resetIcon: { color: colors.textMuted, fontSize: 18, fontWeight: '700' },
  personaPill: {
    marginHorizontal: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
  },
  personaPillText: { color: colors.accentPurple, fontSize: 11, fontWeight: '700' },
  expanded: { padding: 14 },
  expandedHeader: { flexDirection: 'row', alignItems: 'center' },
  expandedTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  expandedTitle: { color: colors.primary, fontSize: 14, fontWeight: '700', flexShrink: 1 },
  actions: { flexDirection: 'row', gap: 6 },
  actionChip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.md, borderWidth: 1 },
  reportChip: { backgroundColor: 'rgba(158,122,255,0.15)', borderColor: 'rgba(158,122,255,0.3)' },
  resetChip: { backgroundColor: 'rgba(251,113,133,0.15)', borderColor: 'rgba(251,113,133,0.3)' },
  actionText: { fontSize: 11, fontWeight: '700' },
  scenarioFull: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 8 },
  personaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  personaLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginRight: 2 },
  personaChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
  },
  personaChipSelected: { backgroundColor: 'rgba(56,189,248,0.2)', borderColor: colors.primary },
  personaChipText: { color: colors.textMuted, fontSize: 11 },
  personaChipTextSelected: { color: colors.primary, fontWeight: '700' },
});
