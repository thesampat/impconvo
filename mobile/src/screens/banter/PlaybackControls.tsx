import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '../../theme';
import { withAlpha } from './presets';

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
  const playAccent = isPlaying ? colors.accentAmber : colors.primary;
  const canSkip = queueSize > 0;

  return (
    <View style={[styles.bar, { marginBottom: 8 + insets.bottom }]}>
      <Pressable
        onPress={onTogglePlay}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: withAlpha(playAccent, 0.18) },
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.buttonText, { color: playAccent }]} numberOfLines={1}>
          {isPlaying ? '❚❚ Pause' : '▶ Resume'}
        </Text>
      </Pressable>

      <Pressable
        onPress={onNext}
        disabled={!canSkip}
        accessibilityRole="button"
        accessibilityLabel="Skip turn"
        style={({ pressed }) => [styles.button, styles.outlined, pressed && styles.pressed]}
      >
        <Text style={[styles.nextText, { color: canSkip ? colors.text : colors.textMuted }]} numberOfLines={1}>
          ⏭ Next ({queueSize})
        </Text>
      </Pressable>

      <Pressable
        onPress={onContinue}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel="Continue banter"
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: withAlpha(colors.accentPurple, 0.18) },
          isLoading && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.buttonText, styles.small, { color: colors.accentPurple }]} numberOfLines={1}>
          +6 Turns
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    backgroundColor: withAlpha(colors.surface, 0.95),
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  button: {
    height: 34,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlined: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8 },
  buttonText: { fontSize: 12, fontWeight: '700' },
  small: { fontSize: 11 },
  nextText: { fontSize: 11, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.45 },
});
