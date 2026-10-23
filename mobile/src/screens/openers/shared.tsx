import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, type } from '../../theme';

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
        <ActivityIndicator size="small" color={colors.onPrimary} />
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
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    flexGrow: 1,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  title: { ...type.title },
  subtitle: { ...type.caption, marginTop: spacing.xs },
  input: {
    ...type.body,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderGlow,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    textAlignVertical: 'top',
  },
  inputFocused: { borderColor: colors.textMuted },
  error: { ...type.caption, color: colors.error, marginTop: spacing.sm },
  // Section header: a hairline rule with a small uppercase label, no card around the content
  sectionLabel: {
    ...type.label,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  list: {},
  placeholderBox: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  placeholderText: { ...type.caption, color: colors.textMuted },
});

export const placeholderTextColor = colors.textMuted;

const styles = StyleSheet.create({
  button: {
    marginTop: spacing.sm,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: colors.surfaceVariant },
  pressed: { opacity: 0.85 },
  buttonText: { color: colors.onPrimary, fontWeight: '500', fontSize: 14 },
  buttonTextDisabled: { color: colors.textMuted },
});
