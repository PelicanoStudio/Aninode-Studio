// @ts-nocheck - Touch-specific hook, not priority for desktop-first MVP
import { useCallback, useRef } from 'react';

export const useLongPress = (
  callback: (e: React.MouseEvent | React.TouchEvent) => void,
  ms: number = 500
) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const start = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    timerRef.current = setTimeout(() => {
      callback(e);
    }, ms);
  }, [callback, ms]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
};
