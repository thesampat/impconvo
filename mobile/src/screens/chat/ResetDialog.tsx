import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../../theme';

interface Props {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ResetDialog({ visible, onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        {/* Swallow taps on the card so they don't dismiss the dialog */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Reset Chat Scenario?</Text>
          <Text style={styles.body}>
            Are you sure you want to reset the current session? All chat messages and review feedback will be
            cleared.
          </Text>
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.button} accessibilityRole="button">
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.button} accessibilityRole="button">
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
  },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  body: { color: colors.text, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 8 },
  button: { paddingHorizontal: 12, paddingVertical: 8 },
  cancel: { color: colors.textMuted, fontSize: 14, fontWeight: '500' },
  confirm: { color: colors.error, fontSize: 14, fontWeight: '700' },
});
