import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../../theme';

interface Props {
  isPlaying: boolean;
  isLoading: boolean;
  queueSize: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onContinue: () => void;
}

export default function PlaybackControls({ isPlaying, isLoading, queueSize, onTogglePlay, onNext, onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const canSkip = queueSize > 0;

  return (
    <View style={[styles.bar, { paddingBottom: spacing.sm + insets.bottom }]}>
      <Pressable
        onPress={onTogglePlay}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}
      >
        <Text style={[styles.buttonText, styles.primaryText]} numberOfLines={1}>
          {isPlaying ? 'Pause' : 'Resume'}
        </Text>
      </Pressable>

      <Pressable
        onPress={onNext}
        disabled={!canSkip}
        accessibilityRole="button"
        accessibilityLabel="Skip turn"
        style={({ pressed }) => [styles.button, styles.secondary, !canSkip && styles.disabled, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText} numberOfLines={1}>
          Next ({queueSize})
        </Text>
      </Pressable>

      <Pressable
        onPress={onContinue}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel="Continue banter"
        style={({ pressed }) => [styles.button, styles.secondary, isLoading && styles.disabled, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText} numberOfLines={1}>
          +6 turns
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  button: {
    flex: 1,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderGlow },
  buttonText: { color: colors.text, fontSize: 13, fontWeight: '500' },
  primaryText: { color: colors.onPrimary, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
