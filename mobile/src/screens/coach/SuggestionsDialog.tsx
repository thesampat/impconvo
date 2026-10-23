import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { makeStyles, radius, spacing, useColors } from '../../theme';
import type { SuggestionsDialogProps } from './types';

const BADGES = ['Humor', 'Banter', 'Smooth'];

export default function SuggestionsDialog({
  visible,
  loading,
  suggestions,
  error,
  onSelect,
  onRegenerate,
  onClose,
}: SuggestionsDialogProps) {
  const styles = useStyles();
  const c = useColors();
  const options = suggestions.slice(0, 3);

  let body: ReactNode;
  if (loading) {
    body = (
      <View style={styles.centerBlock}>
        <ActivityIndicator color={c.textSecondary} size="small" />
        <Text style={styles.mutedText}>Drafting rewrites…</Text>
      </View>
    );
  } else if (options.length === 0) {
    body = (
      <View style={styles.centerBlock}>
        <Text style={[styles.mutedText, error ? styles.errorText : null]}>
          {error || 'No rewrites yet. Ask the coach for a fresh batch.'}
        </Text>
        <Pressable
          onPress={onRegenerate}
          style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  } else {
    body = (
      <View style={styles.list}>
        {options.map((text, index) => {
          const badge = BADGES[index] ?? 'Option';
          return (
            <Pressable
              key={`${index}-${text}`}
              onPress={() => onSelect(text)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`${badge}: ${text}`}
            >
              <Text style={styles.badgeText}>{badge}</Text>
              <Text style={styles.suggestionText}>{text}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close suggestions" />
        <View style={styles.dialog}>
          <View style={styles.header}>
            <Text style={styles.title}>Rewrites</Text>
            <Pressable
              onPress={onRegenerate}
              disabled={loading}
              hitSlop={8}
              style={({ pressed }) => [styles.iconButton, (pressed || loading) && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Regenerate suggestions"
            >
              <Text style={styles.iconText}>↻</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.iconText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.subtitle}>Tap a suggestion to use it.</Text>

          {body}
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((c, t) => ({
  backdrop: {
    flex: 1,
    backgroundColor: c.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  dialog: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...t.title,
    fontSize: 16,
    flex: 1,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  iconText: {
    color: c.textMuted,
    fontSize: 16,
  },
  subtitle: {
    ...t.caption,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  centerBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  mutedText: {
    ...t.caption,
    fontSize: 14,
    color: c.textMuted,
    textAlign: 'center',
  },
  errorText: {
    color: c.error,
  },
  retryButton: {
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.borderGlow,
  },
  retryText: {
    color: c.text,
    fontWeight: '500',
    fontSize: 14,
  },
  list: {},
  // Divided rows instead of bordered cards
  card: {
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.divider,
  },
  badgeText: {
    ...t.label,
    fontSize: 12,
    marginBottom: 2,
  },
  suggestionText: {
    ...t.body,
  },
  pressed: {
    opacity: 0.6,
  },
}));
