import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ScreenId } from '../screens/types';
import { colors, radius, spacing, type } from '../theme';
import { SCREEN_GUIDES } from './screenGuides';

interface Props {
  visible: boolean;
  screen: ScreenId;
  onClose: () => void;
}

export default function ScreenInfoSheet({ visible, screen, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const guide = SCREEN_GUIDES[screen];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close guide" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: spacing.lg + insets.bottom }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <Text style={styles.title}>{guide.title}</Text>
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
            <Text style={styles.subtitle}>{guide.subtitle}</Text>

            <Section title="Purpose">
              <Text style={styles.body}>{guide.purpose}</Text>
            </Section>

            <Section title="What to provide">
              <Text style={styles.body}>{guide.whatToInput}</Text>
              <View style={styles.exampleBox}>
                <Text style={styles.exampleLabel}>Example</Text>
                <Text style={styles.exampleText}>{guide.inputExample}</Text>
              </View>
            </Section>

            <Section title="What you get">
              <Text style={styles.body}>{guide.whatYouGet}</Text>
            </Section>

            <Section title="Steps">
              {guide.steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <Text style={styles.stepNum}>{i + 1}</Text>
                  <Text style={[styles.body, styles.flex]}>{step}</Text>
                </View>
              ))}
            </Section>

            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>Tip</Text>
              <Text style={styles.tipText}>{guide.proTip}</Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Got it</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  sheet: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderGlow,
    marginTop: spacing.sm,
  },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  title: { ...type.title, flex: 1 },
  closeBtn: { width: 28, height: 28, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  closePressed: { backgroundColor: colors.surfaceVariant },
  close: { color: colors.textMuted, fontSize: 14 },
  subtitle: { ...type.caption, marginTop: -spacing.sm },
  // Sections split by a hairline and a small label, not boxed
  section: {
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  sectionTitle: type.label,
  body: { color: colors.text, fontSize: 14, lineHeight: 21 },
  flex: { flex: 1 },
  exampleBox: {
    marginTop: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  exampleLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
  exampleText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  stepNum: {
    width: 16,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 21,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  tipCard: {
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
    paddingLeft: spacing.md,
    paddingVertical: 2,
    gap: 2,
  },
  tipTitle: { color: colors.text, fontSize: 13, fontWeight: '600' },
  tipText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
  buttonText: { color: colors.onPrimary, fontWeight: '600', fontSize: 15 },
});
