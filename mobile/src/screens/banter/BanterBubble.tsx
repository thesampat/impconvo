import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { makeStyles, radius, useColors } from '../../theme';
import { withAlpha } from './presets';

function bubbleCorners(isMine: boolean) {
  return {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomLeftRadius: isMine ? radius.lg : radius.sm,
    borderBottomRightRadius: isMine ? radius.sm : radius.lg,
  };
}

export function BanterChatBubble({ speaker, text, isMine }: { speaker: string; text: string; isMine: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.row, isMine && styles.rowEnd]}>
      <View style={[styles.column, isMine && styles.columnEnd]}>
        <Text style={styles.speaker} numberOfLines={1}>
          {speaker}
        </Text>
        <View style={[styles.bubble, bubbleCorners(isMine), isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.text, isMine ? styles.textMine : styles.textTheirs]}>{text}</Text>
        </View>
      </View>
    </View>
  );
}

export function BanterTypingBubble({ speaker, isMine }: { speaker: string; isMine: boolean }) {
  const styles = useStyles();
  const c = useColors();
  return (
    <View style={[styles.row, isMine && styles.rowEnd]}>
      <View style={[styles.typing, bubbleCorners(isMine)]}>
        <Text style={styles.typingText}>{speaker} is typing</Text>
        <ActivityIndicator size="small" color={c.textMuted} style={styles.typingSpinner} />
      </View>
    </View>
  );
}

export function SystemErrorBubble({ text }: { text: string }) {
  const styles = useStyles();
  return (
    <View style={styles.error}>
      <Text style={styles.errorText}>{text}</Text>
    </View>
  );
}

const useStyles = makeStyles((c, t) => ({
  row: { flexDirection: 'row', justifyContent: 'flex-start' },
  rowEnd: { justifyContent: 'flex-end' },
  column: { maxWidth: '80%', alignItems: 'flex-start' },
  columnEnd: { alignItems: 'flex-end' },
  speaker: { color: c.textMuted, fontSize: 12, fontWeight: '500', marginBottom: 2, marginHorizontal: 2 },
  bubble: { paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: c.bubbleOutgoing },
  bubbleTheirs: {
    backgroundColor: c.bubbleIncoming,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.borderGlow,
  },
  text: { fontSize: 15, lineHeight: 21 },
  textMine: { color: c.onBubbleOutgoing },
  textTheirs: { color: c.onBubbleIncoming },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.bubbleIncoming,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.borderGlow,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typingText: { color: c.textMuted, fontSize: 13 },
  typingSpinner: { marginLeft: 6, transform: [{ scale: 0.6 }] },
  error: {
    borderRadius: radius.sm,
    backgroundColor: withAlpha(c.error, 0.06),
    borderLeftWidth: 2,
    borderColor: c.error,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: { color: c.error, fontSize: 13, lineHeight: 18 },
}));
