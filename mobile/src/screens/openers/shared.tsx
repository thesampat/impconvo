import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius } from '../../theme';

interface GenerateButtonProps {
  label: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}

export function GenerateButton({ label, loading, disabled, onPress }: GenerateButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        disabled && !loading && styles.buttonDisabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#000000" />
      ) : (
        <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function errorMessage(e: unknown): string {
  return e instanceof Error && e.message ? e.message : 'Network error';
}

export const screenStyles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 14, flexGrow: 1 },
  title: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 17 },
  input: {
    marginTop: 14,
    backgroundColor: 'rgba(32,32,48,0.35)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  inputFocused: { borderColor: 'rgba(56,189,248,0.5)', backgroundColor: 'rgba(32,32,48,0.45)' },
  error: { color: colors.error, fontSize: 12, lineHeight: 17, marginTop: 8 },
  sectionLabel: { color: colors.text, fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  list: { gap: 10 },
  placeholderBox: { flex: 1, minHeight: 120, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: 'rgba(148,163,184,0.6)', fontSize: 12, textAlign: 'center' },
});

export const placeholderTextColor = 'rgba(148,163,184,0.6)';

const styles = StyleSheet.create({
  button: {
    marginTop: 10,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: 'rgba(32,32,48,0.5)' },
  pressed: { opacity: 0.8 },
  buttonText: { color: '#000000', fontWeight: '700', fontSize: 13 },
  buttonTextDisabled: { color: colors.textMuted },
});
