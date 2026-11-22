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

// useState that persists to localStorage on every change, quarantines
// corrupted entries instead of silently wiping them, and syncs across tabs.
export function useStored(key, initial) {
  const [val, setVal] = useState(() => {
    let raw;
    try {
      raw = localStorage.getItem(PREFIX + key);
    } catch {
      return initial;
    }
    if (raw == null) return initial;
    try {
      return JSON.parse(raw);
    } catch {
      // Keep the broken payload for recovery instead of letting the next
      // save silently destroy it.
      try {
        localStorage.setItem(`${PREFIX}${key}.corrupt-${Date.now()}`, raw);
        localStorage.removeItem(PREFIX + key);
      } catch {
        /* ignore */
      }
      console.warn(`KADI: corrupted data in "${key}" was quarantined; key reset.`);
      return initial;
    }
  });

  useEffect(() => {
    saveRaw(key, val);
  }, [key, val]);

  // Another tab changed this key -> adopt its value (prevents two open tabs
  // from silently overwriting each other's work).
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== PREFIX + key || e.newValue == null) return;
      try {
        const next = JSON.parse(e.newValue);
        setVal((cur) => (JSON.stringify(cur) === e.newValue ? cur : next));
      } catch {
        /* ignore malformed cross-tab writes */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  return [val, setVal];
}

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
