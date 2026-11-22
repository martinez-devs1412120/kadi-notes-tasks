// Task data model + instance helpers.
//
// A task with repeat === 'daily' re-occurs every day starting at its `date`;
// completion is tracked per-day in `completions` (date -> ISO timestamp).
// A one-time task is completed via `done` / `doneAt`.

import { addDays, dateToISO, isPast, todayStr } from './datetime.js';

export const PRIORITIES = {
  high: { label: 'High', color: '#f87171' },
  medium: { label: 'Medium', color: '#fbbf24' },
  low: { label: 'Low', color: '#4ade80' },
};

export const MIN = 60000;

// All task instances scheduled on a given day, sorted by time.
export function instancesOn(tasks, dateStr) {
  return tasks
    .filter((t) => (t.repeat === 'daily' ? t.date <= dateStr : t.date === dateStr))
    .map((task) => ({ task, date: dateStr }))
    .sort((a, b) => (a.task.time || '').localeCompare(b.task.time || ''));
}

export function isInstanceDone(task, date) {
  if (task.repeat === 'daily') return !!(task.completions && task.completions[date]);
  return !!task.done;
}

// Toggle completion for a specific day's instance; returns the updated task.
export function toggleInstance(task, date) {
  if (task.repeat === 'daily') {
    const completions = { ...(task.completions || {}) };
    if (completions[date]) delete completions[date];
    else completions[date] = new Date().toISOString();
    return { ...task, completions };
  }
  return task.done
    ? { ...task, done: false, doneAt: null }
    : { ...task, done: true, doneAt: new Date().toISOString() };
}

// Number of tasks that are past their time and not done (for the nav badge).
export function countOverdue(tasks, now = new Date()) {
  const today = todayStr(now);
  let n = 0;
  for (const t of tasks) {
    if (t.repeat === 'daily') {
      if (t.date <= today && !isInstanceDone(t, today) && isPast(today, t.time, now)) n++;
    } else if (!t.done && t.date && isPast(t.date, t.time, now)) {
      n++;
    }
  }
  return n;
}

export function dueDateOf(task, date) {
  return dateToISO(date, task.time);
}

// --- Day & week aggregates (used by Monitor) ---

// done/total across all instances scheduled on a given day.
export function dayInfo(tasks, dateStr) {
  const inst = instancesOn(tasks, dateStr);
  const done = inst.filter(({ task }) => isInstanceDone(task, dateStr)).length;
  return { total: inst.length, done };
}

// Consecutive fully-completed days ending today (days with no tasks don't
// break the streak; today may still be in progress).
export function currentStreak(tasks, today) {
  let streak = 0;
  for (let i = 0; i < 366; i++) {
    const d = addDays(today, -i);
    const { total, done } = dayInfo(tasks, d);
    if (total === 0) continue;
    if (done === total) streak++;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}

// Longest run of fully-completed days in the last year.
export function bestStreak(tasks, today) {
  let best = 0, run = 0;
  for (let i = 365; i >= 0; i--) {
    const d = addDays(today, -i);
    const { total, done } = dayInfo(tasks, d);
    if (total > 0 && done === total) {
      run++;
      if (run > best) best = run;
    } else run = 0;
  }
  return best;
}

// done/total for the Mon-Sun week containing refDate (only days up to today).
export function weekInfo(tasks, refDate, now = new Date()) {
  const today = todayStr(now);
  const [y, m, d] = refDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = (dt.getDay() + 6) % 7; // 0 = Monday
  let total = 0, done = 0;
  for (let i = 0; i < 7; i++) {
    const ds = todayStr(new Date(y, m - 1, d - dow + i));
    if (ds > today) continue;
    const info = dayInfo(tasks, ds);
    total += info.total;
    done += info.done;
  }
  return { total, done };
}

// --- Import sanitization ---
// Backup files are untrusted: shape-validate and coerce everything before it
// reaches state, so a malformed file can't crash the UI or poison rendering.

const PRIORITIES_OK = ['high', 'medium', 'low'];
const REMIND_OK = [0, 5, 10, 15, 30, 60];
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_TIME = /^(\d{2}):(\d{2})$/;
const MAX_TASKS = 2000;
const MAX_NOTES = 1000;

// Range-checked (not just shape-checked): 2026-13-40 must be rejected.
function isValidDateStr(s) {
  const m = ISO_DATE.exec(s);
  if (!m) return false;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() + 1 === mo && dt.getDate() === d;
}

function isValidTimeStr(s) {
  const m = ISO_TIME.exec(s);
  return !!m && Number(m[1]) <= 23 && Number(m[2]) <= 59;
}

function cleanCompletions(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (isValidDateStr(k) && typeof v === 'string') out[k] = v;
  }
  return out;
}

export function normalizeImport(data) {
  const out = { tasks: [], notes: [], settings: null };
  if (!data || typeof data !== 'object' || Array.isArray(data)) return out;

  if (Array.isArray(data.tasks)) {
    for (const t of data.tasks) {
      if (out.tasks.length >= MAX_TASKS) break;
      if (!t || typeof t !== 'object') continue;
      if (typeof t.id !== 'string' || !t.id) continue;
      if (typeof t.title !== 'string' || !t.title.trim()) continue;
      if (!isValidDateStr(t.date || '') || !isValidTimeStr(t.time || '')) continue;
      out.tasks.push({
        id: t.id.slice(0, 64),
        title: t.title.trim().slice(0, 200),
        desc: typeof t.desc === 'string' ? t.desc.slice(0, 2000) : '',
        date: t.date,
        time: t.time,
        priority: PRIORITIES_OK.includes(t.priority) ? t.priority : 'medium',
        remindBefore: REMIND_OK.includes(Number(t.remindBefore)) ? Number(t.remindBefore) : 10,
        repeat: t.repeat === 'daily' ? 'daily' : 'none',
        color: typeof t.color === 'string' ? t.color : 'blue',
        createdAt: typeof t.createdAt === 'string' ? t.createdAt : new Date().toISOString(),
        done: !!t.done,
        doneAt: typeof t.doneAt === 'string' ? t.doneAt : null,
        completions: cleanCompletions(t.completions),
      });
    }
  }

  if (Array.isArray(data.notes)) {
    for (const n of data.notes) {
      if (out.notes.length >= MAX_NOTES) break;
      if (!n || typeof n !== 'object') continue;
      if (typeof n.id !== 'string' || !n.id) continue;
      out.notes.push({
        id: n.id.slice(0, 64),
        title: typeof n.title === 'string' && n.title.trim() ? n.title.trim().slice(0, 200) : 'Untitled note',
        content: typeof n.content === 'string' ? n.content.slice(0, 20000) : '',
        createdAt: typeof n.createdAt === 'string' ? n.createdAt : new Date().toISOString(),
        updatedAt: typeof n.updatedAt === 'string' ? n.updatedAt : new Date().toISOString(),
      });
    }
  }

  if (data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)) {
    out.settings = { sound: data.settings.sound !== false };
  }
  return out;
}
