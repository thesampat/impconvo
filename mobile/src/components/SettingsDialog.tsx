import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AVAILABLE_MODELS, useSettings } from '../state/SettingsContext';
import { colors, radius, spacing } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ visible, onClose }: Props) {
  const { modelName, isConnected, isTesting, testConnection, updateModelName } = useSettings();
  const [selected, setSelected] = useState(modelName);
  const [saving, setSaving] = useState(false);

  // Reset the draft selection each time the dialog opens
  useEffect(() => {
    if (visible) setSelected(modelName);
  }, [visible, modelName]);

  const statusColor = isConnected ? colors.success : colors.error;
  const models: readonly string[] = AVAILABLE_MODELS.includes(modelName as (typeof AVAILABLE_MODELS)[number])
    ? AVAILABLE_MODELS
    : [...AVAILABLE_MODELS, modelName];

  const save = async () => {
    setSaving(true);
    await updateModelName(selected);
    setSaving(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close settings" />
        <View style={styles.dialog}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>⚙️ Settings</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.statusCard}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {isConnected ? 'API Server Connected' : 'API Server Disconnected'}
            </Text>
            <Pressable
              onPress={testConnection}
              disabled={isTesting}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Test connection"
            >
              {isTesting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.refresh}>⟳</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.label}>Gemini Model Selection</Text>
          <View style={styles.options}>
            {models.map((m) => {
              const active = m === selected;
              return (
                <Pressable
                  key={m}
                  onPress={() => setSelected(m)}
                  style={[styles.option, active && styles.optionActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{m}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.cancel} accessibilityRole="button">
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={saving}
              style={({ pressed }) => [styles.save, (pressed || saving) && styles.pressed]}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.saveText}>Save Config</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    padding: spacing.xl,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  close: { color: colors.textMuted, fontSize: 18, padding: 4 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  statusText: { flex: 1, fontSize: 14, fontWeight: '500' },
  refresh: { color: colors.primary, fontSize: 20, fontWeight: '700', width: 22, textAlign: 'center' },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '500', marginTop: spacing.xl, marginBottom: 6 },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: 'rgba(56,189,248,0.08)' },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  optionText: { color: colors.text, fontSize: 15 },
  optionTextActive: { color: colors.primary, fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  cancel: { paddingHorizontal: spacing.md, paddingVertical: 10 },
  cancelText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  save: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  pressed: { opacity: 0.8 },
  saveText: { color: '#000000', fontWeight: '700', fontSize: 14 },
});
