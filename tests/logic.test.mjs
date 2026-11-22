// Logic audit tests for the pure engines: datetime, tasks, alarms.
// Run: node tests/logic.test.mjs

import assert from 'node:assert/strict';
import {
  todayStr, addDays, dateToISO, fmtTime12, relativeDay, timeUntil, isPast, pad,
} from '../src/lib/datetime.js';
import {
  instancesOn, isInstanceDone, toggleInstance, countOverdue, dayInfo,
  weekInfo, currentStreak, bestStreak, MIN, normalizeImport,
} from '../src/lib/tasks.js';
import { checkAlarms, pruneTaskAlerts } from '../src/lib/alarms.js';

let passed = 0;
const failures = [];
const findings = [];
function t(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push({ name, msg: e.message });
  }
}

// ---------- datetime ----------
t('addDays: month boundary', () => {
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
});
t('addDays: year boundary', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});
t('addDays: leap year Feb 28 -> 29 (2024)', () => {
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
});
t('addDays: non-leap Feb 28 -> Mar 1 (2026)', () => {
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
});
t('addDays: negative across month', () => {
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});
t('dateToISO: invalid date returns null', () => {
  assert.equal(dateToISO('2026-02-30', '10:00'), null); // would roll to Mar 2
});
t('dateToISO: garbage formats return null', () => {
  assert.equal(dateToISO('2026-6-15', '10:00'), null);
  assert.equal(dateToISO('2026-06-15', '9:00'), null);
  assert.equal(dateToISO('2026-06-15T10:00', '10:00'), null);
});
t('dateToISO: valid date parses', () => {
  assert.equal(dateToISO('2026-06-15', '10:30').getHours(), 10);
});
t('dateToISO: missing parts return null', () => {
  assert.equal(dateToISO('', '10:00'), null);
  assert.equal(dateToISO('2026-01-01', ''), null);
});
t('fmtTime12: midnight is 12:00 AM', () => {
  assert.equal(fmtTime12('00:00'), '12:00 AM');
});
t('fmtTime12: noon is 12:00 PM', () => {
  assert.equal(fmtTime12('12:00'), '12:00 PM');
});
t('fmtTime12: 23:59 is 11:59 PM', () => {
  assert.equal(fmtTime12('23:59'), '11:59 PM');
});
t('isPast: future time false, past true', () => {
  const base = new Date('2026-06-15T12:00:00');
  assert.equal(isPast('2026-06-15', '11:00', base), true);
  assert.equal(isPast('2026-06-15', '13:00', base), false);
});

// ---------- tasks: instances & toggling ----------
const D = '2026-06-15'; // Monday
const mk = (o) => ({
  completions: {}, done: false, doneAt: null, desc: '', remindBefore: 10,
  repeat: 'none', priority: 'medium', color: 'blue',
  id: 'x', title: 't', date: D, time: '12:00', ...o,
});
const NOW = new Date('2026-06-15T15:00:00');

t('instancesOn: one-time task on its date only', () => {
  const tasks = [mk({}), mk({ id: 'y', date: '2026-06-16' })];
  assert.equal(instancesOn(tasks, D).length, 1);
  assert.equal(instancesOn(tasks, '2026-06-16').length, 1);
});
t('instancesOn: daily before start date absent', () => {
  const tasks = [mk({ repeat: 'daily', date: '2026-06-20' })];
  assert.equal(instancesOn(tasks, D).length, 0);
});
t('instancesOn: daily present every day from start', () => {
  const tasks = [mk({ repeat: 'daily', date: '2026-06-10' })];
  assert.equal(instancesOn(tasks, D).length, 1);
});
t('toggleInstance: daily adds then removes completion', () => {
  const t0 = mk({ repeat: 'daily' });
  const t1 = toggleInstance(t0, D);
  assert.ok(isInstanceDone(t1, D));
  const t2 = toggleInstance(t1, D);
  assert.ok(!isInstanceDone(t2, D));
});
t('toggleInstance: one-time done/undone', () => {
  const t1 = toggleInstance(mk({}), D);
  assert.ok(t1.done && t1.doneAt);
  const t2 = toggleInstance(t1, D);
  assert.ok(!t2.done && !t2.doneAt);
});
t('countOverdue: past one-time undone counts', () => {
  const tasks = [mk({ date: '2026-06-14', time: '09:00' })];
  assert.equal(countOverdue(tasks, NOW), 1);
});
t('countOverdue: daily today, time passed, not done counts', () => {
  const tasks = [mk({ repeat: 'daily', date: '2026-06-01', time: '09:00' })];
  assert.equal(countOverdue(tasks, NOW), 1);
});
t('countOverdue: daily today, time not passed yet, no', () => {
  const tasks = [mk({ repeat: 'daily', date: '2026-06-01', time: '23:00' })];
  assert.equal(countOverdue(tasks, NOW), 0);
});
t('countOverdue: done task never overdue', () => {
  const tasks = [mk({ date: '2026-06-14', time: '09:00', done: true })];
  assert.equal(countOverdue(tasks, NOW), 0);
});

// ---------- aggregates ----------
const WEEK = [
  mk({ id: 'a', repeat: 'daily', date: '2026-06-08', time: '07:00' }), // daily all week
];
function setWeek(tasks, doneDays, refDay = D) {
  for (const t of tasks) if (t.repeat === 'daily') t.completions = {};
  for (const ds of doneDays) tasks[0].completions[ds] = new Date().toISOString();
  return refDay;
}
t('weekInfo: Mon-start week contains Mon..Sun only', () => {
  // 2026-06-15 is Monday; week = 15..21
  setWeek(WEEK, ['2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20', '2026-06-21']);
  // future days after 2026-06-17 excluded (fixed "now" = 15th 15:00 -> only 15th counted)
  const info = weekInfo(WEEK, '2026-06-21', new Date('2026-06-17T23:00:00'));
  assert.equal(info.total, 3); // 15,16,17 (up to "now")
});
t('dayInfo: future daily dates count as scheduled', () => {
  assert.equal(dayInfo(WEEK, '2026-06-30').total, 1);
});
t('currentStreak: full week up to today counts', () => {
  const done = ['2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13', '2026-06-14', D];
  const ref = setWeek(WEEK, done);
  assert.equal(currentStreak(WEEK, ref), 7);
});
t('currentStreak: missed day breaks streak', () => {
  const done = ['2026-06-12', '2026-06-13', '2026-06-14', D];
  const ref = setWeek(WEEK, done);
  assert.equal(currentStreak(WEEK, ref), 4);
});
t('currentStreak: incomplete today still counts yesterday chain', () => {
  const done = ['2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13', '2026-06-14'];
  const ref = setWeek(WEEK, done);
  assert.equal(currentStreak(WEEK, ref), 5);
});
t('bestStreak: finds max run in window', () => {
  const done = ['2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13', '2026-06-14', D];
  const ref = setWeek(WEEK, done);
  assert.equal(bestStreak(WEEK, ref), 7);
});

// ---------- alarms ----------
const FAKE_NOW = new Date('2026-06-15T12:00:00');
function fire(tasks, opts = {}) {
  const out = [];
  const log = checkAlarms(
    tasks,
    { alertLog: {}, snoozes: {}, ...opts, now: opts.now || FAKE_NOW },
    (f) => out.push(...f)
  );
  return { out, log };
}

t('alarms: upcoming fires inside remind window', () => {
  // due 12:05, remind 10 min, now 12:00 -> inside window
  const tasks = [mk({ time: '12:05', remindBefore: 10 })];
  const { out } = fire(tasks);
  assert.ok(out.some((f) => f.stage === 'upcoming'), 'expected upcoming');
});
t('alarms: no upcoming when remindBefore = 0', () => {
  const tasks = [mk({ time: '12:05', remindBefore: 0 })];
  const { out } = fire(tasks);
  assert.ok(!out.some((f) => f.stage === 'upcoming'));
});
t('alarms: due fires at due time', () => {
  const tasks = [mk({ time: '12:00' })];
  const { out } = fire(tasks);
  assert.ok(out.some((f) => f.stage === 'due'));
});
t('alarms: overdue fires after 3 min grace', () => {
  const tasks = [mk({ time: '11:50' })];
  const { out } = fire(tasks);
  assert.ok(out.some((f) => f.stage === 'overdue'));
});
t('alarms: one-time 8 days old is NOT overdue', () => {
  const tasks = [mk({ date: '2026-06-07', time: '09:00' })];
  const { out } = fire(tasks);
  assert.ok(!out.some((f) => f.stage === 'overdue'));
});
t('alarms: one-time 3 days old IS overdue', () => {
  const tasks = [mk({ date: '2026-06-12', time: '09:00' })];
  const { out } = fire(tasks);
  assert.ok(out.some((f) => f.stage === 'overdue'));
});
t('alarms: missed PAST days of daily never alarm', () => {
  const tasks = [mk({ repeat: 'daily', date: '2026-06-01', time: '09:00' })];
  const { out } = fire(tasks);
  assert.ok(out.every((f) => f.date === todayStr(FAKE_NOW)));
});
t('alarms: done instance never alarms', () => {
  const tasks = [mk({ time: '11:00', done: true, doneAt: 'x' })];
  const { out } = fire(tasks);
  assert.equal(out.length, 0);
});
t('alarms: each stage fires exactly once', () => {
  const tasks = [mk({ time: '11:50' })];
  const first = fire(tasks);
  const second = fire(tasks, { alertLog: first.log });
  assert.equal(second.out.length, 0);
});
t('alarms: stale alertLog entries are pruned after 14 days', () => {
  const tasks = [mk({ time: '23:00' })]; // no alerts due at 12:00
  const stale = { 'old|2026-06-01|overdue': '2026-05-01T00:00:00Z' };
  const next = checkAlarms(tasks, { alertLog: stale, snoozes: {}, now: FAKE_NOW }, () => {});
  assert.equal(Object.keys(next).length, 0, 'stale entry should be pruned');
});
t('alarms: fresh alertLog entries survive pruning', () => {
  const tasks = [mk({ time: '23:00' })];
  const fresh = { 'k|2026-06-15|due': '2026-06-14T00:00:00Z' };
  const next = checkAlarms(tasks, { alertLog: fresh, snoozes: {}, now: FAKE_NOW }, () => {});
  assert.deepEqual(next, fresh);
});
t('alarms: snooze re-arm (key deleted + snooze set) fires again', () => {
  const tasks = [mk({ time: '11:58' })];
  const first = fire(tasks);
  const dueFire = first.out.find((f) => f.stage === 'due');
  const key = dueFire.key;
  // Snoozed effective time in the past-but-inside-grace: [11:59, 12:02) contains now=12:00
  const snoozes = { [key.split('|').slice(0, 2).join('|')]: new Date('2026-06-15T11:59:00').toISOString() };
  const log2 = { ...first.log };
  delete log2[key];
  const out2 = [];
  checkAlarms(tasks, { alertLog: log2, snoozes, now: FAKE_NOW }, (f) => out2.push(...f));
  assert.ok(out2.some((f) => f.stage === 'due'), 'snoozed due should re-fire in new window');
});
t('alarms: snooze to the future delays the alarm (no fire until then)', () => {
  const tasks = [mk({ time: '11:58' })];
  const first = fire(tasks);
  const key = first.out.find((f) => f.stage === 'due').key;
  const snoozes = { [key.split('|').slice(0, 2).join('|')]: new Date('2026-06-15T12:05:00').toISOString() };
  const log2 = { ...first.log };
  delete log2[key];
  const out2 = [];
  checkAlarms(tasks, { alertLog: log2, snoozes, now: FAKE_NOW }, (f) => out2.push(...f));
  assert.ok(!out2.some((f) => f.stage === 'due'), 'future snooze must not fire early');
});
t('alarms: overdue flood capped at 5 per cycle', () => {
  const tasks = [];
  for (let i = 0; i < 10; i++) tasks.push(mk({ id: `o${i}`, date: '2026-06-14', time: '09:00' }));
  const { out } = fire(tasks);
  assert.ok(out.length <= 5, `expected <=5 fired, got ${out.length}`);
});
t('alarms: capped overdue tasks still get logged (banner shows them)', () => {
  const tasks = [];
  for (let i = 0; i < 10; i++) tasks.push(mk({ id: `o${i}`, date: '2026-06-14', time: '09:00' }));
  const { out, log } = fire(tasks);
  assert.equal(Object.keys(log).length, 10);
  assert.ok(out.length <= 5);
});
t('alarms: pruneTaskAlerts removes only that task\'s keys', () => {
  const log = { 'a|2026-06-15|due': 'x', 'b|2026-06-15|due': 'y' };
  const snoozes = { 'a|2026-06-15': 'z' };
  const pruned = pruneTaskAlerts(log, snoozes, 'a');
  assert.deepEqual(pruned.log, { 'b|2026-06-15|due': 'y' });
  assert.deepEqual(pruned.snoozes, {});
});
t('alarms: pruneTaskAlerts returns same refs when nothing matches', () => {
  const log = { 'b|2026-06-15|due': 'y' };
  const snoozes = { 'b|2026-06-15': 'z' };
  const pruned = pruneTaskAlerts(log, snoozes, 'a');
  assert.equal(pruned.log, log);
  assert.equal(pruned.snoozes, snoozes);
});

// ---------- import validation ----------
t('import validation: drops invalid tasks, keeps and coerces valid', () => {
  const data = {
    tasks: [
      { id: 'ok', title: 'Real', date: '2026-06-15', time: '09:00' },
      { title: 'no id', date: '2026-06-15', time: '09:00' },
      { id: 'nodate' },
      { id: 'badtime', title: 'x', date: '2026-06-15', time: '25:99' },
      null,
      'garbage',
    ],
    notes: [{ id: 'n', title: 'Note' }, 'garbage', null, {}],
  };
  const clean = normalizeImport(data);
  assert.equal(clean.tasks.length, 1);
  assert.equal(clean.notes.length, 1);
  assert.equal(clean.tasks[0].priority, 'medium');
  assert.equal(clean.tasks[0].remindBefore, 10);
});
t('import validation: caps runaway data (2000 tasks max)', () => {
  const tasks = Array.from({ length: 3000 }, (_, i) => ({
    id: `t${i}`, title: `T${i}`, date: '2026-06-15', time: '09:00',
  }));
  const clean = normalizeImport({ tasks });
  assert.equal(clean.tasks.length, 2000);
});
t('import validation: completions filtered to valid dates', () => {
  const clean = normalizeImport({
    tasks: [{
      id: 'c', title: 'C', date: '2026-06-15', time: '09:00', repeat: 'daily',
      completions: { '2026-06-15': 'ok', '__proto__': 'evil', nope: 1, '2026-13-40': 'bad' },
    }],
  });
  assert.deepEqual(Object.keys(clean.tasks[0].completions), ['2026-06-15']);
});
t('import validation: prototype-poisoning shape rejected safely', () => {
  const raw = JSON.parse('{"__proto__":{"injected":true},"tasks":[{"id":"p","title":"P","date":"2026-06-15","time":"09:00"}]}');
  const clean = normalizeImport(raw);
  assert.equal(({}).injected, undefined);
  assert.equal(clean.tasks.length, 1);
});
t('import validation: non-object backup returns empty', () => {
  assert.deepEqual(normalizeImport(null), { tasks: [], notes: [], settings: null });
  assert.deepEqual(normalizeImport('string'), { tasks: [], notes: [], settings: null });
  assert.deepEqual(normalizeImport([1, 2]), { tasks: [], notes: [], settings: null });
});

// ---------- report ----------
console.log(`\n=== RESULTS: ${passed} passed, ${failures.length} failed ===`);
for (const f of failures) console.log(`FAIL: ${f.name}\n      ${f.msg.split('\n')[0]}`);
process.exitCode = failures.length ? 1 : 0;
