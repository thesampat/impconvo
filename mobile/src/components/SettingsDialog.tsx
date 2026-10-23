import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { MODEL_NOTES, useSettings, type AdminSettings, type AdminSettingsPatch } from '../state/SettingsContext';
import { makeStyles, radius, spacing, useColors } from '../theme';
import AdminUsageSection, { AdminTrafficSection } from './AdminUsageSection';

export type AdminSection = 'usage' | 'model' | 'limits' | 'device';

export const ADMIN_SECTIONS: { id: AdminSection; title: string }[] = [
  { id: 'usage', title: 'Usage' },
  { id: 'model', title: 'Model' },
  { id: 'limits', title: 'Limits' },
  { id: 'device', title: 'Device' },
];

interface Props {
  visible: boolean;
  section: AdminSection;
  onClose: () => void;
}

type LimitKey = 'device_daily_limit' | 'ip_daily_limit' | 'global_daily_limit';

const LIMIT_FIELDS: { key: LimitKey; label: string; caption: string }[] = [
  { key: 'device_daily_limit', label: 'Per device', caption: 'Each install' },
  { key: 'ip_daily_limit', label: 'Per network (IP)', caption: 'Shared Wi-Fi counts once' },
  { key: 'global_daily_limit', label: 'All users total', caption: 'Hard cap on your Gemini spend' },
];

type Draft = { model: string } & Record<LimitKey, string>;

function draftFrom(s: AdminSettings): Draft {
  return {
    model: s.default_model,
    device_daily_limit: String(s.device_daily_limit),
    ip_daily_limit: String(s.ip_daily_limit),
    global_daily_limit: String(s.global_daily_limit),
  };
}

/** Whole number >= 0, or null if the text isn't one */
function parseLimit(text: string): number | null {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return Number.isSafeInteger(n) ? n : null;
}

export default function SettingsDialog({ visible, section, onClose }: Props) {
  const styles = useStyles();
  const c = useColors();
  const {
    isConnected,
    isTesting,
    testConnection,
    adminSettings,
    refreshAdminSettings,
    saveAdminSettings,
    adminUsage,
    refreshAdminUsage,
    lockAdmin,
  } = useSettings();
  const [draft, setDraft] = useState<Draft | null>(null);
  // Once the admin edits something, server refreshes no longer overwrite the form
  const dirty = useRef(false);
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [refreshingUsage, setRefreshingUsage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fresh data and a clean form every time the dialog opens
  useEffect(() => {
    if (!visible) return;
    dirty.current = false;
    setDraft(null);
    setError(null);
    setSaving(false);
    setLocking(false);
    refreshAdminSettings().catch(() => {});
    refreshAdminUsage().catch(() => {});
  }, [visible, refreshAdminSettings, refreshAdminUsage]);

  // Initialise (or re-sync, while untouched) the form from the server values
  useEffect(() => {
    if (visible && adminSettings && !dirty.current) setDraft(draftFrom(adminSettings));
  }, [visible, adminSettings]);

  const edit = (patch: Partial<Draft>) => {
    dirty.current = true;
    setError(null);
    setDraft((d) => (d ? { ...d, ...patch } : d));
  };

  const statusColor = isConnected ? c.success : c.error;
  const models = adminSettings?.available_models ?? [];
  const invalid = draft ? LIMIT_FIELDS.some((f) => parseLimit(draft[f.key]) === null) : false;
  const editable = section === 'model' || section === 'limits';
  const title = ADMIN_SECTIONS.find((x) => x.id === section)?.title ?? 'Admin';

  const save = async () => {
    if (!draft || !adminSettings || invalid) return;
    const patch: AdminSettingsPatch = {};
    if (draft.model !== adminSettings.default_model) patch.default_model = draft.model;
    for (const f of LIMIT_FIELDS) {
      const n = parseLimit(draft[f.key]);
      if (n !== null && n !== adminSettings[f.key]) patch[f.key] = n;
    }
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveAdminSettings(patch);
      setSaving(false);
      onClose();
    } catch (e) {
      setSaving(false);
      setError(e instanceof Error && e.message ? e.message : "Couldn't save settings.");
    }
  };

  const lock = async () => {
    setLocking(true);
    try {
      await lockAdmin();
      onClose();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't lock admin.");
    } finally {
      setLocking(false);
    }
  };

  const refreshUsage = async () => {
    setRefreshingUsage(true);
    try {
      await refreshAdminUsage();
    } catch {
      // keep showing the last numbers
    } finally {
      setRefreshingUsage(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.root} behavior="padding">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close admin settings" />
        <View style={styles.dialog}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            {section === 'usage' || section === 'limits' ? (
              <Pressable
                onPress={refreshUsage}
                disabled={refreshingUsage}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Refresh usage"
                style={({ pressed }) => [styles.textBtn, styles.headerRefresh, pressed && styles.closePressed]}
              >
                {refreshingUsage ? (
                  <ActivityIndicator size="small" color={c.textSecondary} />
                ) : (
                  <Text style={styles.testText}>Refresh</Text>
                )}
              </Pressable>
            ) : null}
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closePressed]}
            >
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {section === 'usage' ? <AdminUsageSection usage={adminUsage} /> : null}

            {editable && !draft ? (
              <View style={styles.loading}>
                <ActivityIndicator size="small" color={c.textSecondary} />
              </View>
            ) : null}

            {section === 'model' && draft ? (
              <>
                <Text style={styles.label}>Model for everyone</Text>
                <View>
                  {models.map((m, i) => {
                    const active = m === draft.model;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => edit({ model: m })}
                        style={({ pressed }) => [
                          styles.option,
                          i > 0 && styles.rowDivider,
                          pressed && styles.optionPressed,
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                      >
                        <View style={[styles.radio, active && styles.radioActive]}>
                          {active && <View style={styles.radioInner} />}
                        </View>
                        <View style={styles.optionBody}>
                          <Text style={[styles.optionText, active && styles.optionTextActive]}>{m}</Text>
                          {MODEL_NOTES[m] ? <Text style={styles.optionNote}>{MODEL_NOTES[m]}</Text> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

              </>
            ) : null}

            {section === 'limits' && draft ? (
              <>
                <Text style={styles.label}>Daily limits (tokens)</Text>
                <View>
                  {LIMIT_FIELDS.map((f, i) => {
                    const bad = parseLimit(draft[f.key]) === null;
                    return (
                      <View key={f.key} style={[styles.limitRow, i > 0 && styles.rowDivider]}>
                        <View style={styles.limitText}>
                          <Text style={styles.limitLabel}>{f.label}</Text>
                          <Text style={bad ? styles.limitError : styles.optionNote}>
                            {bad ? 'Enter a whole number, 0 or more' : f.caption}
                          </Text>
                        </View>
                        <TextInput
                          value={draft[f.key]}
                          onChangeText={(t) => edit({ [f.key]: t } as Partial<Draft>)}
                          keyboardType="number-pad"
                          inputMode="numeric"
                          autoCorrect={false}
                          accessibilityLabel={`${f.label} daily token limit`}
                          style={[styles.limitInput, bad && styles.limitInputError]}
                        />
                      </View>
                    );
                  })}
                </View>
                <View style={styles.trafficGap}>
                  <AdminTrafficSection usage={adminUsage} />
                </View>
              </>
            ) : null}

            {section === 'device' ? (
              <>
            <Text style={styles.label}>Connection</Text>
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: statusColor }]} />
              <Text style={styles.statusText}>{isConnected ? 'API Server Connected' : 'API Server Disconnected'}</Text>
              <Pressable
                onPress={testConnection}
                disabled={isTesting}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Test connection"
                style={({ pressed }) => [styles.testBtn, pressed && styles.closePressed]}
              >
                {isTesting ? (
                  <ActivityIndicator size="small" color={c.textSecondary} />
                ) : (
                  <Text style={styles.testText}>Test</Text>
                )}
              </Pressable>
            </View>
            {adminSettings ? (
              <View style={styles.deviceRow}>
                <Text style={styles.deviceTitle}>This device</Text>
                <Text style={styles.deviceId} selectable>
                  {adminSettings.your_device_id ?? 'Unknown'}
                </Text>
                <Text style={styles.deviceNote}>
                  {adminSettings.device_locked
                    ? 'Admin is locked to the devices in ADMIN_DEVICE_IDS.'
                    : 'Admin works on any device with the code. Add this id to ADMIN_DEVICE_IDS on the server to lock it to this phone.'}
                </Text>
              </View>
            ) : null}

                <View style={styles.section}>
                  <Pressable
                    onPress={lock}
                    disabled={locking}
                    hitSlop={8}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.lockBtn, pressed && styles.closePressed]}
                  >
                    <Text style={styles.lockText}>{locking ? 'Locking...' : 'Lock admin on this device'}</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </ScrollView>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {editable ? (
            <View style={styles.actions}>
              <View style={styles.actionsSpacer} />
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={save}
                disabled={saving || !draft || invalid}
                style={({ pressed }) => [
                  styles.save,
                  (pressed || saving) && styles.pressed,
                  (!draft || invalid) && styles.disabled,
                ]}
                accessibilityRole="button"
              >
                {saving ? (
                  <ActivityIndicator size="small" color={c.onPrimary} />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = makeStyles((c, t) => ({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: c.scrim,
  },
  dialog: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  headerRefresh: { marginRight: spacing.xs },
  scroll: { flexGrow: 0, flexShrink: 1 },
  scrollContent: { paddingBottom: spacing.xs },
  loading: { paddingVertical: spacing.md, alignItems: 'center' },
  title: { ...t.title, flex: 1 },
  closeBtn: { width: 28, height: 28, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  closePressed: { backgroundColor: c.surfaceVariant },
  close: { color: c.textMuted, fontSize: 14 },
  label: { ...t.label, marginBottom: spacing.xs },
  // Sections are split by one hairline and a small label, not boxed
  section: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.divider,
  },
  textBtn: { minWidth: 52, height: 26, paddingHorizontal: spacing.sm, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.divider },
  trafficGap: { marginTop: spacing.md },
  limitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  limitText: { flex: 1 },
  limitLabel: { color: c.text, fontSize: 14 },
  limitError: { color: c.error, fontSize: 12, marginTop: 2 },
  limitInput: {
    width: 120,
    height: 32,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.borderGlow,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    color: c.text,
    fontSize: 14,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  limitInputError: { borderColor: c.error },
  error: { color: c.error, fontSize: 13, marginTop: spacing.sm },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { flex: 1, color: c.text, fontSize: 14 },
  deviceRow: {
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.divider,
  },
  deviceTitle: { color: c.textMuted, fontSize: 12, fontWeight: '500' },
  deviceId: { color: c.text, fontSize: 13, marginTop: 2, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
  deviceNote: { color: c.textMuted, fontSize: 12, lineHeight: 17, marginTop: spacing.xs },
  testBtn: {
    minWidth: 52,
    height: 28,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testText: { color: c.textSecondary, fontSize: 13, fontWeight: '500' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionPressed: { backgroundColor: c.surfaceVariant },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: c.text },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.text },
  optionText: { color: c.textSecondary, fontSize: 14 },
  optionBody: { flex: 1 },
  optionNote: { color: c.textMuted, fontSize: 12, marginTop: 2 },
  optionTextActive: { color: c.text, fontWeight: '500' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.divider,
  },
  actionsSpacer: { flex: 1 },
  lockBtn: { height: 32, paddingHorizontal: spacing.xs, borderRadius: radius.sm, justifyContent: 'center' },
  lockText: { color: c.textMuted, fontSize: 13, fontWeight: '500' },
  cancel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.borderGlow,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    height: 32,
    justifyContent: 'center',
  },
  cancelText: { color: c.text, fontWeight: '500', fontSize: 14 },
  save: {
    backgroundColor: c.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    height: 32,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  saveText: { color: c.onPrimary, fontWeight: '600', fontSize: 14 },
}));
