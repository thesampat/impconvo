import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, gradients, radius } from '../../theme';
import { withAlpha } from './presets';

function bubbleCorners(isPersonaB: boolean) {
  return {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: isPersonaB ? 18 : 4,
    borderBottomRightRadius: isPersonaB ? 4 : 18,
  };
}

export function BanterChatBubble({ speaker, text, isPersonaB }: { speaker: string; text: string; isPersonaB: boolean }) {
  return (
    <View style={[styles.row, isPersonaB && styles.rowEnd]}>
      <LinearGradient
        colors={isPersonaB ? gradients.outgoingBubble : gradients.incomingBubble}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.bubble,
          bubbleCorners(isPersonaB),
          { borderColor: isPersonaB ? colors.borderGlow : colors.border },
        ]}
      >
        <View
          style={[
            styles.badge,
            { backgroundColor: isPersonaB ? withAlpha(colors.accentPurple, 0.25) : withAlpha(colors.primary, 0.2) },
          ]}
        >
          <Text style={[styles.badgeText, { color: isPersonaB ? '#FFFFFF' : colors.primary }]}>
            {isPersonaB ? `🔥 ${speaker}` : `⚡ ${speaker}`}
          </Text>
        </View>
        <Text style={[styles.text, isPersonaB && styles.textB]}>{text}</Text>
      </LinearGradient>
    </View>
  );
}

export function BanterTypingBubble({ speaker, isPersonaB }: { speaker: string; isPersonaB: boolean }) {
  const accent = isPersonaB ? colors.accentPurple : colors.primary;
  return (
    <View style={[styles.row, isPersonaB && styles.rowEnd]}>
      <LinearGradient
        colors={gradients.incomingBubble}
        style={[styles.typing, bubbleCorners(isPersonaB), { borderColor: withAlpha(accent, 0.4) }]}
      >
        <Text style={[styles.typingText, { color: accent }]}>{speaker} is typing</Text>
        <ActivityIndicator size="small" color={accent} style={styles.typingSpinner} />
      </LinearGradient>
    </View>
  );
}

export function SystemErrorBubble({ text }: { text: string }) {
  return (
    <View style={styles.error}>
      <Text style={styles.errorText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'flex-start' },
  rowEnd: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '82%',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  text: { color: colors.text, fontSize: 14, lineHeight: 20 },
  textB: { color: '#FFFFFF' },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  typingText: { fontSize: 12, fontWeight: '500' },
  typingSpinner: { marginLeft: 8, transform: [{ scale: 0.6 }] },
  error: {
    borderRadius: radius.md,
    backgroundColor: withAlpha(colors.error, 0.15),
    borderWidth: 1,
    borderColor: withAlpha(colors.error, 0.3),
    padding: 12,
  },
  errorText: { color: colors.error, fontSize: 12, textAlign: 'center' },
});
