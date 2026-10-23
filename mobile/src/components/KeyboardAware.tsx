import { useCallback, useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, View, type StyleProp, type ViewStyle } from 'react-native';

/**
 * KeyboardAvoidingView that knows where it sits on screen.
 * KeyboardAvoidingView measures itself relative to its parent, so under the status bar and
 * top bar it underestimates how much the keyboard covers and the bottom input stays hidden
 * (Android draws edge-to-edge, so the window no longer resizes for the keyboard either).
 * Measuring the real screen position and passing it as keyboardVerticalOffset fixes both.
 */
export default function KeyboardAware({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [offset, setOffset] = useState(0);

  const measure = useCallback(() => {
    ref.current?.measureInWindow((_x: number, y: number) => {
      if (Number.isFinite(y)) setOffset((prev) => (Math.abs(prev - y) > 0.5 ? y : prev));
    });
  }, []);

  return (
    <View ref={ref} style={style} onLayout={measure} collapsable={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={offset}>
        {children}
      </KeyboardAvoidingView>
    </View>
  );
}

/**
 * True while the on-screen keyboard is up. The keyboard already covers the bottom safe area
 * (home indicator / Android navigation bar), so bottom bars should drop their safe-area padding
 * while it is shown or they float above the keyboard by that amount.
 */
export function useKeyboardShown(): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subs = [Keyboard.addListener(show, () => setShown(true)), Keyboard.addListener(hide, () => setShown(false))];
    return () => subs.forEach((sub) => sub.remove());
  }, []);
  return shown;
}
