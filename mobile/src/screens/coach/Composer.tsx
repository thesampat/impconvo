import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { makeStyles, radius, spacing, useColors } from '../../theme';
import { useDoubleTap } from './useDoubleTap';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onSuggest: () => void;
  isLoading: boolean;
  bottomInset: number;
  /** Rendered under the header (while typing) instead of at the bottom */
  atTop?: boolean;
  /** Set while the draft will replace an already-sent message */
  onCancelEdit?: () => void;
}

export default function Composer({ value, onChangeText, onSend, onSuggest, isLoading, bottomInset, atTop, onCancelEdit }: Props) {
  const styles = useStyles();
  const c = useColors();
  const hasText = value.trim().length > 0;
  const canSend = hasText && !isLoading;

  const suggestIfText = useCallback(() => {
    if (hasText) onSuggest();
  }, [hasText, onSuggest]);
  const onInputPress = useDoubleTap(suggestIfText);

  return (
    <View style={[styles.wrapper, atTop && styles.wrapperTop, { paddingBottom: (atTop ? spacing.sm : spacing.md) + bottomInset }]}>
      {onCancelEdit ? (
        <View style={styles.editBar}>
          <Text style={styles.editText}>Editing your message · replies after it will be redone</Text>
          <Pressable onPress={onCancelEdit} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cancel editing">
            <Text style={styles.editCancel}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}
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
          placeholderTextColor={c.textMuted}
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

const useStyles = makeStyles((c, t) => ({
  wrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.divider,
    backgroundColor: c.background,
  },
  editBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  editText: { flex: 1, color: c.accent, fontSize: 12 },
  editCancel: { color: c.textSecondary, fontSize: 13, fontWeight: '500' },
  wrapperTop: {
    borderTopWidth: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.divider,
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
    borderColor: c.borderGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestText: { color: c.textSecondary, fontSize: 13, fontWeight: '500' },
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
    borderColor: c.borderGlow,
    backgroundColor: c.surface,
    color: c.text,
    fontSize: 15,
  },
  sendButton: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  sendActive: { backgroundColor: c.primary },
  sendInactive: { backgroundColor: c.surfaceVariant },
  sendBusy: { opacity: 0.5 },
  sendIcon: { color: c.onPrimary, fontSize: 17, fontWeight: '600' },
  sendIconDisabled: { color: c.textMuted },
}));
