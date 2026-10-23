import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radius, spacing } from '../../theme';
import type { SuggestionsDialogProps } from './types';

const BADGES: { label: string; color: string }[] = [
  { label: '🔥 Humor', color: colors.badgeHumor },
  { label: '⚡ Banter', color: colors.badgeBanter },
  { label: '✨ Smooth', color: colors.badgeSmooth },
];

export default function SuggestionsDialog({
  visible,
  loading,
  suggestions,
  error,
  onSelect,
  onRegenerate,
  onClose,
}: SuggestionsDialogProps) {
  const options = suggestions.slice(0, 3);

  let body: ReactNode;
  if (loading) {
    body = (
      <View style={styles.centerBlock}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={styles.mutedText}>Coach is drafting high-vibe rewrites...</Text>
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
          <Text style={styles.retryText}>↻ Try again</Text>
        </Pressable>
      </View>
    );
  } else {
    body = (
      <View style={styles.list}>
        {options.map((text, index) => {
          const badge = BADGES[index] ?? { label: '✨ Option', color: colors.primary };
          return (
            <Pressable
              key={`${index}-${text}`}
              onPress={() => onSelect(text)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`${badge.label}: ${text}`}
            >
              <View style={[styles.badge, { backgroundColor: `${badge.color}26` }]}>
                <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
              </View>
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
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>💡 AI Coaching Rewrites</Text>
            <Pressable
              onPress={onRegenerate}
              disabled={loading}
              hitSlop={8}
              style={({ pressed }) => [styles.iconButton, (pressed || loading) && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Regenerate suggestions"
            >
              <Text style={styles.regenIcon}>↻</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.subtitle}>Tap a suggestion to use it:</Text>

          {body}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'rgba(22,22,34,0.97)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    padding: 20,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  regenIcon: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  closeIcon: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    marginBottom: 14,
  },
  centerBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: spacing.md,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  suggestionText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.6,
  },
});
