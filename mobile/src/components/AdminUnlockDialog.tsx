import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ApiError } from '../api/client';
import { useSettings } from '../state/SettingsContext';
import { makeStyles, radius, spacing, useColors } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called after the server accepted the code */
  onUnlocked: () => void;
}

function unlockErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return "That code didn't work.";
    if (e.status === 429) return 'Too many attempts. Try again tomorrow.';
    if (e.status === 503) return "Admin access isn't set up on the server.";
  }
  return e instanceof Error && e.message ? e.message : 'Something went wrong.';
}

export default function AdminUnlockDialog({ visible, onClose, onUnlocked }: Props) {
  const styles = useStyles();
  const c = useColors();
  const { unlockAdmin } = useSettings();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start clean every time it opens
  useEffect(() => {
    if (visible) {
      setCode('');
      setError(null);
      setBusy(false);
    }
  }, [visible]);

  const submit = async () => {
    const trimmed = code.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      await unlockAdmin(trimmed);
      setBusy(false);
      onUnlocked();
    } catch (e) {
      setBusy(false);
      setError(unlockErrorMessage(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.root} behavior="padding">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.dialog}>
          <Text style={styles.title}>Enter code</Text>
          <TextInput
            value={code}
            onChangeText={(t) => {
              setCode(t);
              if (error) setError(null);
            }}
            onSubmitEditing={submit}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            autoFocus
            returnKeyType="done"
            placeholder="Code"
            placeholderTextColor={c.textMuted}
            accessibilityLabel="Code"
            style={[styles.input, error ? styles.inputError : null]}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={busy || !code.trim()}
              style={({ pressed }) => [
                styles.primary,
                (pressed || busy) && styles.pressed,
                !code.trim() && styles.disabled,
              ]}
              accessibilityRole="button"
            >
              {busy ? (
                <ActivityIndicator size="small" color={c.onPrimary} />
              ) : (
                <Text style={styles.primaryText}>Unlock</Text>
              )}
            </Pressable>
          </View>
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
    maxWidth: 360,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: { ...t.title, marginBottom: spacing.md },
  input: {
    ...t.body,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.borderGlow,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    height: 38,
    backgroundColor: c.surface,
  },
  inputError: { borderColor: c.error },
  error: { color: c.error, fontSize: 13, marginTop: spacing.sm },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  cancel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.borderGlow,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    height: 32,
    justifyContent: 'center',
  },
  cancelText: { color: c.text, fontWeight: '500', fontSize: 14 },
  primary: {
    backgroundColor: c.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    height: 32,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: c.onPrimary, fontWeight: '600', fontSize: 14 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
}));
