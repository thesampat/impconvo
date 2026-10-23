import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, gradients, radius, spacing } from '../../theme';
import { copyReport, exportReportPdf, shareReport } from './report';
import type { ChatReportData, VibeReviewSheetProps } from './types';

type Toast = { text: string; tone: 'ok' | 'error' };

export default function VibeReviewSheet({ visible, loading, error, report, onClose }: VibeReviewSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [toast, setToast] = useState<Toast | null>(null);
  const [busy, setBusy] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = (next: Toast) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(next);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const run = async (action: (data: ChatReportData) => Promise<unknown>, success?: string, failure = 'Something went wrong') => {
    if (!report || busy) return;
    setBusy(true);
    try {
      await action(report);
      if (success) showToast({ text: success, tone: 'ok' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast({ text: `${failure}: ${msg}`, tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  let content;
  if (loading) {
    content = (
      <View style={styles.stateBlock}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.mutedText}>Analyzing conversation vibe...</Text>
      </View>
    );
  } else if (error || !report) {
    content = (
      <View style={styles.stateBlock}>
        <Text style={[styles.mutedText, styles.errorText]}>{error || 'No vibe review available yet.'}</Text>
      </View>
    );
  } else {
    const { review } = report;
    content = (
      <>
        <View style={styles.scoreBanner}>
          <View style={styles.scoreTextCol}>
            <Text style={styles.scoreLabel}>Engagement Vibe Rating</Text>
            <Text style={styles.feedback}>{review.overall_feedback}</Text>
          </View>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scoreCircle}
          >
            <Text style={styles.scoreValue}>{review.score}</Text>
            <Text style={styles.scoreCaption}>VIBE SCORE</Text>
          </LinearGradient>
        </View>

        <View style={styles.actionRow}>
          <ActionButton
            label="📄 PDF"
            disabled={busy}
            onPress={() => run(exportReportPdf, undefined, 'Error exporting PDF')}
          />
          <ActionButton label="📤 Share" disabled={busy} onPress={() => run(shareReport, undefined, 'Error sharing report')} />
          <ActionButton
            label="📋 Copy"
            disabled={busy}
            onPress={() => run(copyReport, 'Report copied to clipboard! 📋', 'Copy failed')}
          />
        </View>

        <Text style={styles.sectionTitle}>Line-by-Line Coaching Analysis</Text>

        {review.comparisons.length === 0 ? (
          <Text style={styles.mutedText}>No detailed rewrites required. Excellent conversational flow!</Text>
        ) : (
          review.comparisons.map((item, index) => (
            <View key={index} style={styles.card}>
              <Text style={[styles.cardLabel, { color: colors.error }]}>Your Input Message</Text>
              <Text style={styles.cardBody}>{item.original_message}</Text>

              <Text style={[styles.cardLabel, styles.cardLabelSpaced, { color: colors.success }]}>
                Coach Suggested Alternative
              </Text>
              <Text style={[styles.cardBody, styles.cardBodyStrong]}>{item.improved_message}</Text>

              <View style={styles.divider} />

              <Text style={[styles.cardLabel, { color: colors.primary }]}>Why this works better:</Text>
              <Text style={styles.explanation}>{item.explanation}</Text>
            </View>
          ))
        )}
      </>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close vibe review" />
        <View style={[styles.sheet, { maxHeight: height * 0.9, paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>🌟 Vibe Review Report</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          {toast && (
            <View style={[styles.toast, toast.tone === 'error' && styles.toastError]}>
              <Text style={[styles.toastText, toast.tone === 'error' && styles.errorText]}>{toast.text}</Text>
            </View>
          )}

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ActionButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.actionButton, (pressed || disabled) && styles.pressed]}
      accessibilityRole="button"
    >
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: spacing.lg,
    paddingBottom: spacing.sm,
  },
  stateBlock: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
  },
  scoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  scoreTextCol: {
    flex: 1,
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  feedback: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  scoreCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  scoreCaption: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    backgroundColor: colors.surfaceElevated,
  },
  actionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  toast: {
    alignSelf: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.4)',
  },
  toastError: {
    backgroundColor: 'rgba(251,113,133,0.15)',
    borderColor: 'rgba(251,113,133,0.4)',
  },
  toastText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardLabelSpaced: {
    marginTop: 10,
  },
  cardBody: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  cardBodyStrong: {
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  explanation: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.6,
  },
});
