import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type } from '../../theme';

interface Props {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

const DEFAULT_MESSAGE =
  'Are you sure you want to reset the current session? All chat messages and review feedback will be cleared.';

export default function ResetDialog({
  visible,
  onConfirm,
  onCancel,
  title = 'Reset this chat?',
  message = DEFAULT_MESSAGE,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        {/* Swallow taps on the card so they don't dismiss the dialog */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [styles.button, styles.confirmButton, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.confirm}>Reset</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: { ...type.title, fontSize: 16, marginBottom: spacing.xs },
  body: { ...type.caption, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.lg, gap: spacing.sm },
  button: {
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderGlow },
  confirmButton: { backgroundColor: colors.primary },
  pressed: { opacity: 0.8 },
  cancel: { color: colors.text, fontSize: 14, fontWeight: '500' },
  confirm: { color: colors.onPrimary, fontSize: 14, fontWeight: '600' },
});
