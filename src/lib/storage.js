// Tiny localStorage-backed state hook + helpers.

import { useEffect, useState } from 'react';

const PREFIX = 'kadi.';

export function loadRaw(key, fallback) {
  try {
    const v = localStorage.getItem(PREFIX + key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function saveRaw(key, val) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(val));
  } catch {
    /* storage full / unavailable -- ignore */
  }
}

// useState that persists to localStorage on every change.
export function useStored(key, initial) {
  const [val, setVal] = useState(() => loadRaw(key, initial));
  useEffect(() => {
    saveRaw(key, val);
  }, [key, val]);
  return [val, setVal];
}

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
