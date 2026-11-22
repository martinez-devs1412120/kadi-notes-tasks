// In-app alert popups (work even without OS notification permission).

import { useEffect } from 'react';
import { fmtTime12 } from '../lib/datetime';
import { isInstanceDone } from '../lib/tasks';
import Icon from './icons';

const LEVEL = {
  upcoming: { icon: 'clock', cls: 'toast--upcoming', label: 'Coming up' },
  due: { icon: 'bell', cls: 'toast--due', label: 'Time' },
  overdue: { icon: 'alert', cls: 'toast--overdue', label: 'Overdue' },
};

function Toast({ t, onDismiss, onDone, onSnooze }) {
  useEffect(() => {
    const id = setTimeout(() => onDismiss(t.id), 15000);
    return () => clearTimeout(id);
  }, [t.id, onDismiss]);

  const lv = LEVEL[t.level] || LEVEL.due;
  return (
    <div className={`toast ${lv.cls}`}>
      <span className="toast-icon"><Icon name={lv.icon} size={16} /></span>
      <div className="toast-body">
        <div className="toast-label">{lv.label}</div>
        <div className="toast-title">{t.title}</div>
        <div className="toast-sub">{t.sub}</div>
        {!t.done && (
          <div className="toast-actions">
            <button className="btn tiny" onClick={() => onDone(t)}>Done</button>
            <button className="btn tiny" onClick={() => onSnooze(t)}>Snooze 5m</button>
          </div>
        )}
      </div>
      <button className="toast-x" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}

// Builds the alert list from fired alarm events.
export function toastFromAlert(f) {
  const done = isInstanceDone(f.task, f.date);
  const sub = `${fmtTime12(f.task.time)}${f.task.repeat === 'daily' ? ' · daily' : ''}`;
  return {
    id: f.key,
    level: f.stage,
    title: f.task.title,
    sub,
    taskId: f.task.id,
    date: f.date,
    done,
  };
}

export default function Toasts({ toasts, onDismiss, onDone, onSnooze }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" role="alert" aria-live="assertive">
      {toasts.map((t) => (
        <Toast key={t.id} t={t} onDismiss={onDismiss} onDone={onDone} onSnooze={onSnooze} />
      ))}
    </div>
  );
}
