import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import type { MessageModel } from '../../api/types';
import { colors, gradients } from '../../theme';
import { SENDER_ERROR, SENDER_ME } from './useChat';
import { useDoubleTap } from './useDoubleTap';

interface Props {
  message: MessageModel;
  index: number;
  onDoubleTap: (index: number) => void;
}

function MessageBubble({ message, index, onDoubleTap }: Props) {
  const handleDoubleTap = useCallback(() => onDoubleTap(index), [onDoubleTap, index]);
  const onPress = useDoubleTap(handleDoubleTap);

  if (message.sender === SENDER_ERROR) {
    return (
      <View style={styles.errorRow}>
        <View style={styles.errorBubble}>
          <Text style={styles.errorText}>{message.body}</Text>
        </View>
      </View>
    );
  }

  if (message.sender === SENDER_ME) {
    return (
      <View style={styles.rowEnd}>
        <Pressable onPress={onPress} accessibilityHint="Double-tap to get rewrite suggestions">
          <LinearGradient
            colors={gradients.outgoingBubble}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.outgoing]}
          >
            <Text style={styles.body}>{message.body}</Text>
            <Text style={styles.hint}>Double-tap to rewrite ✨</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.rowStart}>
      <LinearGradient
        colors={gradients.incomingBubble}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.bubble, styles.incoming]}
      >
        <Text style={styles.body}>{message.body}</Text>
      </LinearGradient>
    </View>
  );
}

export default memo(MessageBubble);

export function TypingBubble() {
  const pulse = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.rowStart}>
      <LinearGradient colors={gradients.incomingBubble} style={[styles.typingBubble, styles.incoming]}>
        <Text style={styles.typingText}>typing</Text>
        <Animated.Text style={[styles.typingDots, { opacity: pulse }]}>•••</Animated.Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  rowStart: { flexDirection: 'row', justifyContent: 'flex-start' },
  rowEnd: { flexDirection: 'row', justifyContent: 'flex-end' },
  bubble: {
    maxWidth: 285,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
  },
  outgoing: { borderBottomLeftRadius: 20, borderBottomRightRadius: 4, borderColor: 'rgba(255,255,255,0.2)' },
  incoming: { borderBottomLeftRadius: 4, borderBottomRightRadius: 20, borderColor: colors.border },
  body: { color: colors.text, fontSize: 15, lineHeight: 21 },
  hint: {
    alignSelf: 'flex-end',
    marginTop: 2,
    color: 'rgba(241,245,249,0.65)',
    fontSize: 9,
    fontWeight: '500',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
  },
  typingText: { color: colors.textMuted, fontSize: 12 },
  typingDots: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  errorRow: { flexDirection: 'row', justifyContent: 'center' },
  errorBubble: {
    width: '90%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(251,113,133,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251,113,133,0.3)',
  },
  errorText: { color: colors.error, fontSize: 12, textAlign: 'center' },
});
