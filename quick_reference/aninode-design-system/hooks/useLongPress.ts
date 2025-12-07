import React, { useState, useRef, useCallback } from 'react';

export const useLongPress = (
  callback: (e: React.MouseEvent | React.TouchEvent) => void,
  ms: number = 500
) => {
  const [startLongPress, setStartLongPress] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const start = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setStartLongPress(true);
    timerRef.current = setTimeout(() => {
      callback(e);
    }, ms);
  }, [callback, ms]);

  const stop = useCallback(() => {
    setStartLongPress(false);
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
