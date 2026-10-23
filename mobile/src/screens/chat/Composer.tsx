import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, gradients } from '../../theme';
import { useDoubleTap } from './useDoubleTap';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onSuggest: () => void;
  isLoading: boolean;
  bottomInset: number;
}

export default function Composer({ value, onChangeText, onSend, onSuggest, isLoading, bottomInset }: Props) {
  const hasText = value.trim().length > 0;
  const canSend = hasText && !isLoading;

  const suggestIfText = useCallback(() => {
    if (hasText) onSuggest();
  }, [hasText, onSuggest]);
  const onInputPress = useDoubleTap(suggestIfText);

  return (
    <View style={[styles.wrapper, { paddingBottom: 10 + bottomInset }]}>
      <View style={styles.capsule}>
        <Pressable onPress={onSuggest} style={styles.suggestButton} accessibilityLabel="Rewrite suggestions">
          <Text style={styles.suggestIcon}>✨</Text>
        </Pressable>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          onPressIn={onInputPress}
          placeholder="Type response..."
          placeholderTextColor={colors.textMuted}
          multiline
          style={styles.input}
        />

        <Pressable
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send"
          accessibilityState={{ disabled: !canSend }}
        >
          <LinearGradient
            colors={hasText ? gradients.primary : [colors.surfaceVariant, colors.surfaceVariant]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.sendButton, isLoading && hasText && styles.sendBusy]}
          >
            <Text style={[styles.sendIcon, !hasText && styles.sendIconDisabled]}>➤</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 12, paddingTop: 10 },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.35)',
    backgroundColor: 'rgba(22,22,34,0.95)',
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  suggestButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56,189,248,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestIcon: { fontSize: 17 },
  input: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 8,
    maxHeight: 84,
    color: colors.text,
    fontSize: 14,
  },
  sendButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sendBusy: { opacity: 0.5 },
  sendIcon: { color: '#FFFFFF', fontSize: 16 },
  sendIconDisabled: { color: colors.textMuted },
});
