import { useCallback, useEffect, useState } from 'react';

const KEY = 'tadoba_font_px';
const MIN = 14;
const MAX = 20;

export function useFontSize() {
  const [size, setSize] = useState(() => Number(localStorage.getItem(KEY)) || 16);

  useEffect(() => {
    document.documentElement.style.fontSize = `${size}px`;
    localStorage.setItem(KEY, String(size));
  }, [size]);

  const change = useCallback((step) => setSize((s) => Math.min(MAX, Math.max(MIN, s + step))), []);
  const reset = useCallback(() => setSize(16), []);
  return { size, change, reset };
}
