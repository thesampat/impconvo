import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../../theme';

interface Props {
  badge: string;
  text: string;
  explanation: string;
  onCopy: (text: string) => void;
}

/** Result card shared by Openers and Misinterpret: tap the card or 📋 to copy the line. */
export default function ResultCard({ badge, text, explanation, onCopy }: Props) {
  return (
    <Pressable
      onPress={() => onCopy(text)}
      accessibilityRole="button"
      accessibilityHint="Copies this line to the clipboard"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge.toUpperCase()}</Text>
        </View>
        <Pressable
          onPress={() => onCopy(text)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Copy"
          style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}
        >
          <Text style={styles.copyText}>📋 Copy</Text>
        </Pressable>
      </View>
      <Text style={styles.text} selectable>
        {text}
      </Text>
      {explanation ? <Text style={styles.explanation}>{explanation}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(32,32,48,0.35)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pressed: { opacity: 0.7 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    backgroundColor: 'rgba(56,189,248,0.15)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexShrink: 1,
  },
  badgeText: { color: colors.primary, fontWeight: '700', fontSize: 10 },
  copyButton: {
    borderRadius: radius.sm - 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
  },
  copyText: { color: colors.textMuted, fontSize: 11 },
  text: { color: '#FFFFFF', fontWeight: '600', fontSize: 14, lineHeight: 20, marginTop: 6 },
  explanation: { color: colors.textMuted, fontSize: 12, lineHeight: 16, marginTop: 4 },
});
