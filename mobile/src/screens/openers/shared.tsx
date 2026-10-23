import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { makeStyles, radius, spacing, useColors } from '../../theme';

interface GenerateButtonProps {
  label: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}

export function GenerateButton({ label, loading, disabled, onPress }: GenerateButtonProps) {
  const styles = useStyles();
  const c = useColors();
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
        <ActivityIndicator size="small" color={c.onPrimary} />
      ) : (
        <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function errorMessage(e: unknown): string {
  return e instanceof Error && e.message ? e.message : 'Network error';
}

export const useScreenStyles = makeStyles((c, t) => ({
  flex: { flex: 1, backgroundColor: c.background },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    flexGrow: 1,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  title: { ...t.title },
  subtitle: { ...t.caption, marginTop: spacing.xs },
  input: {
    ...t.body,
    marginTop: spacing.md,
    backgroundColor: c.surface,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.borderGlow,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    textAlignVertical: 'top',
  },
  inputFocused: { borderColor: c.textMuted },
  error: { ...t.caption, color: c.error, marginTop: spacing.sm },
  // Section header: a hairline rule with a small uppercase label, no card around the content
  sectionLabel: {
    ...t.label,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.divider,
  },
  list: {},
  placeholderBox: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.divider,
  },
  placeholderText: { ...t.caption, color: c.textMuted },
}));

/** Placeholder colour for the screen inputs (the active theme's muted text) */
export function usePlaceholderTextColor(): string {
  return useColors().textMuted;
}

const useStyles = makeStyles((c, t) => ({
  button: {
    marginTop: spacing.sm,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: c.surfaceVariant },
  pressed: { opacity: 0.85 },
  buttonText: { color: c.onPrimary, fontWeight: '500', fontSize: 14 },
  buttonTextDisabled: { color: c.textMuted },
}));
