import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { makeStyles, radius, spacing } from '../../theme';

interface Props {
  visible: boolean;
  message?: string;
}

export default function CopyToast({ visible, message = 'Copied' }: Props) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.toast, { bottom: insets.bottom + spacing.xl, opacity }]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const useStyles = makeStyles((c, t) => ({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: c.surfaceElevated,
    borderColor: c.borderGlow,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: { color: c.text, fontSize: 13, fontWeight: '500' },
}));
