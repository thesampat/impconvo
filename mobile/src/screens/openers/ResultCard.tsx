import { Pressable, StyleSheet, Text, View } from 'react-native';

import { makeStyles, radius, spacing } from '../../theme';

interface Props {
  badge: string;
  text: string;
  explanation: string;
  onCopy: (text: string) => void;
}

/** Result row shared by Openers and Misinterpret: tap the card or Copy to copy the line. */
export default function ResultCard({ badge, text, explanation, onCopy }: Props) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={() => onCopy(text)}
      accessibilityRole="button"
      accessibilityHint="Copies this line to the clipboard"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.badgeText} numberOfLines={1}>
          {badge}
        </Text>
        <Pressable
          onPress={() => onCopy(text)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Copy"
          style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}
        >
          <Text style={styles.copyText}>Copy</Text>
        </Pressable>
      </View>
      <Text style={styles.text} selectable>
        {text}
      </Text>
      {explanation ? <Text style={styles.explanation}>{explanation}</Text> : null}
    </Pressable>
  );
}

const useStyles = makeStyles((c, t) => ({
  // Flat list row: sits on the page background, separated by a hairline
  card: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.divider,
  },
  pressed: { opacity: 0.7 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badgeText: { ...t.label, fontSize: 12, flexShrink: 1 },
  copyButton: {
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.borderGlow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  copyText: { color: c.textSecondary, fontSize: 12, fontWeight: '500' },
  text: { ...t.body, fontWeight: '500', marginTop: spacing.xs },
  explanation: { ...t.caption, color: c.textMuted, marginTop: 2 },
}));
