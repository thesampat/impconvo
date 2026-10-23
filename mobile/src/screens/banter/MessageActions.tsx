import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { makeStyles, radius, spacing } from '../../theme';

interface Props {
  /** The sent line the menu is for; null hides the menu */
  text: string | null;
  onEdit: () => void;
  onImprove: () => void;
  onClose: () => void;
}

/** Menu for a line the user already sent: edit it, or get better versions of it */
export default function MessageActions({ text, onEdit, onImprove, onClose }: Props) {
  const styles = useStyles();
  return (
    <Modal visible={text !== null} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Swallow taps on the card so they don't dismiss the menu */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.label}>Your message</Text>
          <Text style={styles.quote} numberOfLines={4}>
            {text}
          </Text>
          <Row label="Edit" note="Change it and send again" onPress={onEdit} />
          <Row label="Better versions" note="Get suggestions for this line" onPress={onImprove} />
          <Row label="Cancel" onPress={onClose} muted />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({ label, note, onPress, muted }: { label: string; note?: string; onPress: () => void; muted?: boolean }) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View>
        <Text style={[styles.rowLabel, muted && styles.rowMuted]}>{label}</Text>
        {note ? <Text style={styles.rowNote}>{note}</Text> : null}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((c, t) => ({
  backdrop: {
    flex: 1,
    backgroundColor: c.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  label: { ...t.label, marginBottom: spacing.xs },
  quote: { ...t.body, color: c.textSecondary, marginBottom: spacing.md },
  row: {
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.divider,
  },
  pressed: { opacity: 0.6 },
  rowLabel: { color: c.text, fontSize: 15, fontWeight: '500' },
  rowMuted: { color: c.textMuted, fontWeight: '400' },
  rowNote: { color: c.textMuted, fontSize: 13, marginTop: 2 },
}));
