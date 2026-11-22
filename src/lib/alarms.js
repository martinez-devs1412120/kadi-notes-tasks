// Alarm engine: watches task instances and fires stage-based alerts.
//   upcoming -> "coming up soon" (remindBefore minutes before due)
//   due      -> it's time (within 3 min of due)
//   overdue  -> not done and past due
// Each alert fires once per task/day/stage (tracked in alertLog),
// except "due" which can be re-armed by snoozing.

import { dateToISO, todayStr } from './datetime.js';
import { isInstanceDone, MIN } from './tasks.js';

const PRUNE_AFTER_MS = 14 * 24 * 60 * MIN; // alertLog entries older than 14d
const OVERDUE_CAP_PER_CYCLE = 5;           // max overdue toasts per check

function pruneStale(log, now) {
  let changed = false;
  const out = {};
  for (const [key, iso] of Object.entries(log)) {
    const ts = new Date(iso).getTime();
    if (!isNaN(ts) && now.getTime() - ts <= PRUNE_AFTER_MS) out[key] = iso;
    else changed = true;
  }
  return { log: changed ? out : log, changed };
}

export function checkAlarms(tasks, { alertLog = {}, snoozes = {}, now = new Date() }, onAlert) {
  const today = todayStr(now);
  const { log: base, changed: pruned } = pruneStale(alertLog, now);
  const fired = [];

  for (const t of tasks) {
    // Daily tasks: check today's instance. One-time tasks: their single date.
    const dates = t.repeat === 'daily' ? [today] : [t.date];
    for (const date of dates) {
      const due = dateToISO(date, t.time);
      if (!due) continue;
      if (isInstanceDone(t, date)) continue;

      // A snooze pushes the effective due time later.
      const sk = `${t.id}|${date}`;
      const snoozed = snoozes[sk];
      const eff = snoozed && new Date(snoozed) > due ? new Date(snoozed) : due;

      const remindMs = (t.remindBefore ?? 10) * MIN;
      const stages = [];
      if (now >= new Date(eff.getTime() - remindMs) && now < eff) stages.push('upcoming');
      if (now >= eff && now < new Date(eff.getTime() + 3 * MIN)) stages.push('due');
      // Missed daily days show up in Monitor, not as alarms; one-time past
      // tasks keep warning (once) for up to 7 days.
      const overdueEligible =
        t.repeat === 'daily'
          ? date === today
          : now.getTime() - eff.getTime() < 7 * 24 * 60 * MIN;
      if (now >= new Date(eff.getTime() + 3 * MIN) && overdueEligible) stages.push('overdue');

      for (const stage of stages) {
        const key = `${sk}|${stage}`;
        if (base[key] || alertLog[key]) continue;
        fired.push({ key, stage, task: t, date, dueAt: eff });
      }
    }
  }

  // Cap overdue toasts per cycle (oldest due first); capped ones are still
  // logged so they surface in the overdue banner instead of spamming toasts.
  let toastable = fired;
  const overdue = fired.filter((f) => f.stage === 'overdue');
  if (overdue.length > OVERDUE_CAP_PER_CYCLE) {
    const dropped = [...overdue]
      .sort((a, b) => a.dueAt - b.dueAt)
      .slice(0, overdue.length - OVERDUE_CAP_PER_CYCLE);
    const droppedKeys = new Set(dropped.map((f) => f.key));
    toastable = fired.filter((f) => !droppedKeys.has(f.key));
  }

  const next = { ...base };
  const stamp = now.toISOString();
  for (const f of fired) next[f.key] = stamp;

  if (fired.length) onAlert(toastable);
  if (!fired.length && !pruned) return alertLog;
  return next;
}

// Drop all alert/snooze state for one task -- used when its schedule is
// edited, so changed times re-alarm instead of staying silent.
export function pruneTaskAlerts(alertLog, snoozes, taskId) {
  const log = {};
  let logChanged = false;
  for (const [key, val] of Object.entries(alertLog)) {
    if (key.startsWith(`${taskId}|`)) { logChanged = true; continue; }
    log[key] = val;
  }
  const sn = {};
  let snChanged = false;
  for (const [key, val] of Object.entries(snoozes)) {
    if (key.startsWith(`${taskId}|`)) { snChanged = true; continue; }
    sn[key] = val;
  }
  return {
    log: logChanged ? log : alertLog,
    snoozes: snChanged ? sn : snoozes,
  };
}

// --- Sound ---

let audioCtx = null;

// Call once on the first user gesture so the browser allows later sounds.
export function initAudio() {
  const unlock = () => {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch {
      /* ignore */
    }
  };
  document.addEventListener('pointerdown', unlock, { once: true });
}

export function playChime(level, enabled = true) {
  if (!enabled) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t0 = audioCtx.currentTime;
    const seq =
      level === 'due'
        ? [[0, 880], [0.18, 1108], [0.36, 1318]]
        : level === 'overdue'
          ? [[0, 440], [0.25, 330], [0.5, 247]]
          : [[0, 659], [0.16, 880]];
    for (const [off, freq] of seq) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + off);
      gain.gain.exponentialRampToValueAtTime(0.22, t0 + off + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + off + 0.34);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t0 + off);
      osc.stop(t0 + off + 0.4);
    }
  } catch {
    /* audio unavailable -- ignore */
  }
}
