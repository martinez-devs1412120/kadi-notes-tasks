// Per-task accent palette (HabitKit-style: each task owns a color that
// identifies it across checks, rows and calendars).

export const COLORS = [
  { id: 'violet', hex: '#8b7cf6' },
  { id: 'blue', hex: '#5ea2f7' },
  { id: 'cyan', hex: '#4cc9e8' },
  { id: 'green', hex: '#4fae7d' },
  { id: 'lime', hex: '#9dcf4e' },
  { id: 'amber', hex: '#e8a53d' },
  { id: 'orange', hex: '#e0794a' },
  { id: 'rose', hex: '#e56a8a' },
];

export function colorHex(id) {
  return (COLORS.find((c) => c.id === id) || COLORS[0]).hex;
}

// Deterministic color from any string (task id), so tasks without an
// explicit color still get a stable one.
export function autoColor(id = '') {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length].id;
}
