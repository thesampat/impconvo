import { useCallback, useRef } from 'react';

const DOUBLE_TAP_MS = 300;

// Returns a press handler that fires `onDoubleTap` when two presses land within 300 ms.
export function useDoubleTap(onDoubleTap: () => void) {
  const lastTap = useRef(0);
  return useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      onDoubleTap();
    } else {
      lastTap.current = now;
    }
  }, [onDoubleTap]);
}
