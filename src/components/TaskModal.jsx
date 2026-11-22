// Create / edit a task: title, description, date, time, priority,
// reminder lead time and optional daily repeat.

import { useState } from 'react';
import { PRIORITIES } from '../lib/tasks';
import { COLORS, autoColor } from '../lib/palette';
import { todayStr } from '../lib/datetime';
import { uid } from '../lib/storage';

const REMIND_OPTIONS = [
  { v: 0, label: 'At exact time' },
  { v: 5, label: '5 min before' },
  { v: 10, label: '10 min before' },
  { v: 15, label: '15 min before' },
  { v: 30, label: '30 min before' },
  { v: 60, label: '1 hour before' },
];

function defaultTime() {
  const d = new Date(Date.now() + 60 * 60000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function TaskModal({ initial, onClose, onSave, onDelete }) {
  const editing = !!initial;
  const [form, setForm] = useState(() => ({
    title: initial?.title || '',
    desc: initial?.desc || '',
    date: initial?.date || todayStr(),
    time: initial?.time || defaultTime(),
    priority: initial?.priority || 'medium',
    remindBefore: initial?.remindBefore ?? 10,
    daily: initial?.repeat === 'daily',
    color: initial?.color || autoColor(initial?.id || uid()),
  }));
  const [err, setErr] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = () => {
    if (!form.title.trim()) return setErr('Give the task a title.');
    if (!form.date) return setErr('Pick a date.');
    if (!form.time) return setErr('Pick a time.');
    onSave({
      ...(initial || {}),
      id: initial?.id || uid(),
      title: form.title.trim(),
      desc: form.desc.trim(),
      date: form.date,
      time: form.time,
      priority: form.priority,
      remindBefore: Number(form.remindBefore),
      repeat: form.daily ? 'daily' : 'none',
      color: form.color,
      createdAt: initial?.createdAt || new Date().toISOString(),
      done: initial?.done || false,
      doneAt: initial?.doneAt || null,
      completions: initial?.completions || {},
    });
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{editing ? 'Edit task' : 'New task'}</h2>

        <label className="field">
          <span>Task</span>
          <input
            autoFocus
            value={form.title}
            onChange={set('title')}
            placeholder="e.g. Take vitamins"
            maxLength={120}
          />
        </label>

        <label className="field">
          <span>Details (optional)</span>
          <textarea
            value={form.desc}
            onChange={set('desc')}
            placeholder="Any extra info…"
            rows={2}
            maxLength={500}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Date</span>
            <input type="date" value={form.date} onChange={set('date')} />
          </label>
          <label className="field">
            <span>Time</span>
            <input type="time" value={form.time} onChange={set('time')} />
          </label>
        </div>

        <div className="field">
          <span>Priority</span>
          <div className="prio-picker">
            {Object.entries(PRIORITIES).map(([key, p]) => (
              <button
                key={key}
                type="button"
                className={`chip ${form.priority === key ? 'chip-on' : ''}`}
                style={form.priority === key ? { '--p': p.color } : undefined}
                onClick={() => setForm((f) => ({ ...f, priority: key }))}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>Color</span>
          <div className="swatches">
            {COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`swatch ${form.color === c.id ? 'on' : ''}`}
                style={{ '--sc': c.hex }}
                onClick={() => setForm((f) => ({ ...f, color: c.id }))}
                aria-label={`Color: ${c.id}`}
                title={c.id}
              />
            ))}
          </div>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Alarm</span>
            <select value={form.remindBefore} onChange={set('remindBefore')}>
              {REMIND_OPTIONS.map((o) => (
                <option key={o.v} value={o.v}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="field switch-field">
            <span>Repeat daily</span>
            <button
              type="button"
              className={`switch ${form.daily ? 'on' : ''}`}
              onClick={() => setForm((f) => ({ ...f, daily: !f.daily }))}
              aria-pressed={form.daily}
            >
              <span className="knob" />
            </button>
          </label>
        </div>

        {err && <div className="form-error">{err}</div>}

        <div className="modal-actions">
          {editing && (
            <button className="btn danger" onClick={() => onDelete(initial)}>
              Delete
            </button>
          )}
          <div className="spacer" />
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save}>
            {editing ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </div>
    </div>
  );
}
