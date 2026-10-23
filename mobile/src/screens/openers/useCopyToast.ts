import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useRef, useState } from 'react';

const TOAST_MS = 1600;

/** Copies text to the clipboard and exposes a short-lived "Copied!" flag for CopyToast. */
export function useCopyToast() {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    if (timer.current) clearTimeout(timer.current);
    setVisible(true);
    timer.current = setTimeout(() => setVisible(false), TOAST_MS);
  }, []);

  return { toastVisible: visible, copy };
}
