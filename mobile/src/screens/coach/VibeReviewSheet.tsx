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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, type } from '../../theme';
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
        <ActivityIndicator color={colors.textSecondary} size="small" />
        <Text style={styles.mutedText}>Reviewing the conversation…</Text>
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
    const pct = Math.max(0, Math.min(100, review.score));
    content = (
      <>
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreLabel}>Vibe score</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{review.score}</Text>
            <Text style={styles.scoreOutOf}>/ 100</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.feedback}>{review.overall_feedback}</Text>
        </View>

        <View style={styles.actionRow}>
          <ActionButton
            label="PDF"
            disabled={busy}
            onPress={() => run(exportReportPdf, undefined, 'Error exporting PDF')}
          />
          <ActionButton label="Share" disabled={busy} onPress={() => run(shareReport, undefined, 'Error sharing report')} />
          <ActionButton
            label="Copy"
            disabled={busy}
            onPress={() => run(copyReport, 'Report copied', 'Copy failed')}
          />
        </View>

        <Text style={styles.sectionTitle}>Line by line</Text>

        {review.comparisons.length === 0 ? (
          <Text style={[styles.mutedText, styles.emptyText]}>No rewrites needed. The conversation flowed well.</Text>
        ) : (
          review.comparisons.map((item, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardLabel}>You wrote</Text>
              <Text style={[styles.cardBody, styles.cardBodyMuted]}>{item.original_message}</Text>

              <Text style={[styles.cardLabel, styles.cardLabelSpaced]}>Try instead</Text>
              <Text style={[styles.cardBody, styles.cardBodyStrong]}>{item.improved_message}</Text>

              <View style={styles.divider} />

              <Text style={styles.cardLabel}>Why it works</Text>
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
            <Text style={styles.title}>Vibe review</Text>
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
    backgroundColor: colors.scrim,
  },
  sheet: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  handle: {
    alignSelf: 'center',
    width: 32,
    height: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.borderGlow,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...type.title,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: colors.textMuted,
    fontSize: 16,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: spacing.sm,
  },
  stateBlock: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  mutedText: {
    ...type.caption,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
  },
  emptyText: {
    textAlign: 'left',
    paddingVertical: spacing.sm,
  },
  scoreBlock: {
    paddingBottom: spacing.md,
  },
  scoreLabel: {
    ...type.label,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
  },
  scoreValue: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: -1,
    lineHeight: 40,
  },
  scoreOutOf: {
    color: colors.textMuted,
    fontSize: 15,
    marginLeft: spacing.sm,
  },
  progressTrack: {
    height: 2,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: 2,
    backgroundColor: colors.text,
  },
  feedback: {
    ...type.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  actionButton: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderGlow,
  },
  actionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  toast: {
    alignSelf: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderGlow,
  },
  toastError: {
    borderColor: colors.error,
  },
  toastText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Section header: hairline rule plus small uppercase label
  sectionTitle: {
    ...type.label,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  // Each comparison is a divided row, not a bordered card
  card: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  cardLabel: {
    ...type.label,
    fontSize: 12,
    marginBottom: 2,
  },
  cardLabelSpaced: {
    marginTop: spacing.sm,
  },
  cardBody: {
    ...type.body,
  },
  cardBodyMuted: {
    color: colors.textSecondary,
  },
  cardBodyStrong: {
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  explanation: {
    ...type.caption,
  },
  pressed: {
    opacity: 0.6,
  },
});
