// Per-task pastel palette: each task owns a color used as its FULL CARD
// fill (color-block style) -- black text sits on every fill.

export const COLORS = [
  { id: 'violet', hex: '#c7c2f4' },
  { id: 'blue', hex: '#a9c7f5' },
  { id: 'cyan', hex: '#9ed9e6' },
  { id: 'green', hex: '#a8d9b4' },
  { id: 'lime', hex: '#d6ec9c' },
  { id: 'amber', hex: '#f6d389' },
  { id: 'orange', hex: '#f4ae8a' },
  { id: 'rose', hex: '#f0b9c8' },
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
