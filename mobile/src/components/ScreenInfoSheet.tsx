import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ScreenId } from '../screens/types';
import { colors, radius, spacing } from '../theme';
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
            contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <Text style={styles.title}>
                {guide.icon} {guide.title}
              </Text>
              <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.subtitle}>{guide.subtitle}</Text>

            <Section title="🎯 What is this screen for?">
              <Text style={styles.body}>{guide.purpose}</Text>
            </Section>

            <Section title="📥 What Input to Provide">
              <Text style={styles.body}>{guide.whatToInput}</Text>
              <View style={styles.exampleBox}>
                <Text style={styles.exampleLabel}>Example Input:</Text>
                <Text style={styles.exampleText}>{guide.inputExample}</Text>
              </View>
            </Section>

            <Section title="📤 What Output You Get">
              <Text style={styles.body}>{guide.whatYouGet}</Text>
            </Section>

            <Section title="🚀 Step-by-Step Guide">
              {guide.steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.body, styles.flex]}>{step}</Text>
                </View>
              ))}
            </Section>

            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>💡 Coach Pro-Tip</Text>
              <Text style={styles.tipText}>{guide.proTip}</Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Got It!</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderGlow,
    marginTop: 10,
    marginBottom: 6,
  },
  content: { paddingHorizontal: spacing.xl, gap: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  title: { flex: 1, color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  close: { color: colors.textMuted, fontSize: 18, padding: 4 },
  subtitle: { color: colors.primary, fontSize: 14, fontWeight: '500', marginTop: -spacing.sm, marginBottom: spacing.xs },
  card: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    gap: 6,
  },
  cardTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  body: { color: colors.text, fontSize: 14, lineHeight: 20 },
  flex: { flex: 1 },
  exampleBox: {
    marginTop: spacing.xs,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.25)',
    borderRadius: radius.sm,
    padding: 10,
    gap: 2,
  },
  exampleLabel: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  exampleText: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 3 },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(56,189,248,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  tipCard: {
    backgroundColor: 'rgba(56,189,248,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
    borderRadius: radius.md,
    padding: 14,
    gap: 2,
  },
  tipTitle: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  tipText: { color: colors.text, fontSize: 12, lineHeight: 18 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  pressed: { opacity: 0.8 },
  buttonText: { color: '#000000', fontWeight: '700', fontSize: 15 },
});
