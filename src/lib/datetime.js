// Date & time helpers. All dates are local-time strings: "YYYY-MM-DD" / "HH:MM".

export const pad = (n) => String(n).padStart(2, '0');

export function todayStr(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function nowTime(d = new Date()) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Combine "YYYY-MM-DD" + "HH:MM" into a local Date, or null when invalid.
// Strict: rejects impossible dates like 2026-02-30 (JS would silently roll
// them over to the next month).
export function dateToISO(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  const tm = /^(\d{2}):(\d{2})$/.exec(timeStr);
  if (!dm || !tm) return null;
  const d = new Date(`${dateStr}T${timeStr}`);
  if (isNaN(d.getTime())) return null;
  // Round-trip the calendar parts; time parts are not compared so DST
  // shifts don't reject legitimate times.
  if (
    d.getFullYear() !== Number(dm[1]) ||
    d.getMonth() + 1 !== Number(dm[2]) ||
    d.getDate() !== Number(dm[3])
  ) return null;
  return d;
}

export function isPast(dateStr, timeStr, now = new Date()) {
  const d = dateToISO(dateStr, timeStr);
  return d ? d < now : false;
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return todayStr(new Date(y, m - 1, d + n));
}

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${WD[dt.getDay()]}, ${MO[m - 1]} ${d}, ${y}`;
}

export function fmtDateShort(dateStr) {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-').map(Number);
  return `${MO[m - 1]} ${d}`;
}

export function fmtTime12(timeStr) {
  if (!timeStr) return '';
  let [h, m] = timeStr.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${pad(m)} ${ap}`;
}

export function relativeDay(dateStr) {
  const t = todayStr();
  if (dateStr === t) return 'Today';
  if (dateStr === addDays(t, 1)) return 'Tomorrow';
  if (dateStr === addDays(t, -1)) return 'Yesterday';
  return fmtDate(dateStr);
}

export function timeUntil(due, now = new Date()) {
  const mins = Math.round((due - now) / 60000);
  if (mins < 1) return 'in <1 min';
  if (mins < 60) return `in ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `in ${hrs}h ${mins % 60}m`;
  return `in ${Math.floor(hrs / 24)}d`;
}
