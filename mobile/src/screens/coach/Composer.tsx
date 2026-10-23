import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing } from '../../theme';
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
    <View style={[styles.wrapper, { paddingBottom: spacing.md + bottomInset }]}>
      <View style={styles.capsule}>
        <Pressable
          onPress={onSuggest}
          style={({ pressed }) => [styles.suggestButton, pressed && styles.pressed]}
          accessibilityLabel="Rewrite suggestions"
        >
          <Text style={styles.suggestText}>Rewrite</Text>
        </Pressable>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          onPressIn={onInputPress}
          placeholder="Type a response"
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
          <View
            style={[
              styles.sendButton,
              hasText ? styles.sendActive : styles.sendInactive,
              isLoading && hasText && styles.sendBusy,
            ]}
          >
            <Text style={[styles.sendIcon, !hasText && styles.sendIconDisabled]}>↑</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    backgroundColor: colors.background,
  },
  // Flat row on the page background; only the text field keeps a hairline border
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestButton: {
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  pressed: { opacity: 0.7 },
  input: {
    flex: 1,
    marginHorizontal: spacing.sm,
    minHeight: 32,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    maxHeight: 84,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderGlow,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
  },
  sendButton: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  sendActive: { backgroundColor: colors.primary },
  sendInactive: { backgroundColor: colors.surfaceVariant },
  sendBusy: { opacity: 0.5 },
  sendIcon: { color: colors.onPrimary, fontSize: 17, fontWeight: '600' },
  sendIconDisabled: { color: colors.textMuted },
});
