// Today: charcoal hero with big date + progress ring, range pills
// (Today / Tomorrow / All), overdue notice and color-block schedule cards.

import { useState } from 'react';
import { todayStr, addDays, dateToISO, timeUntil } from '../lib/datetime';
import { instancesOn, isInstanceDone, countOverdue } from '../lib/tasks';
import TaskRow from './TaskRow';
import Icon from './icons';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'all', label: 'All' },
];

function ProgressRing({ pct }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <svg className="ring" width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
      <circle className="ring-track" cx="30" cy="30" r={r} />
      <circle
        className="ring-fill"
        cx="30"
        cy="30"
        r={r}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        transform="rotate(-90 30 30)"
      />
      <text x="30" y="35" textAnchor="middle" className="ring-text tnum">
        {pct}%
      </text>
    </svg>
  );
}

export default function TodayView({ tasks, onToggle, onEdit, goTasks }) {
  const [range, setRange] = useState('today');
  const today = todayStr();
  const tomorrow = addDays(today, 1);
  const now = new Date();
  const inst = instancesOn(tasks, today);
  const doneCount = inst.filter(({ task }) => isInstanceDone(task, today)).length;
  const pct = inst.length ? Math.round((doneCount / inst.length) * 100) : 0;
  const overdueTotal = countOverdue(tasks, now);
  const upcoming = inst
    .filter(({ task, date }) => !isInstanceDone(task, date) && (dateToISO(date, task.time) || 0) > now)
    .slice(0, 1)[0];

  const h = now.getHours();
  const greeting = h < 12 ? 'Good morning.' : h < 18 ? 'Good afternoon.' : 'Good evening.';
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });

  let list;
  if (range === 'today') list = inst;
  else if (range === 'tomorrow') list = instancesOn(tasks, tomorrow);
  else {
    const later = tasks
      .filter((t) => t.repeat !== 'daily' && t.date > tomorrow)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .map((t) => ({ task: t, date: t.date }));
    list = [...inst, ...instancesOn(tasks, tomorrow), ...later];
  }

  return (
    <div className="view">
      <div className="today-hero">
        <div>
          <p className="hero-hi">{greeting}</p>
          <div className="hero-date">
            <span className="hero-day tnum">{now.getDate()}</span>
            <span className="hero-month">{MONTHS[now.getMonth()]}</span>
          </div>
          <p className="hero-sub">
            <span className="tnum">{doneCount} of {inst.length}</span> done · {weekday}
          </p>
        </div>
        {inst.length > 0 && <ProgressRing pct={pct} />}
      </div>

      <div className="range-pills">
        {RANGES.map((r) => (
          <button
            key={r.id}
            className={`range-pill ${range === r.id ? 'on' : ''}`}
            onClick={() => setRange(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {overdueTotal > 0 && (
        <button className="notice" onClick={goTasks}>
          <Icon name="alert" size={14} />
          {overdueTotal} overdue task{overdueTotal > 1 ? 's' : ''} — review
        </button>
      )}

      {upcoming && range !== 'tomorrow' && (
        <div className="next-card">
          <span className="next-label">Next up</span>
          <div className="next-title">{upcoming.task.title}</div>
          <div className="next-time">
            {timeUntil(dateToISO(upcoming.date, upcoming.task.time), now)} · {upcoming.task.time}
          </div>
        </div>
      )}

      <h2 className="section-label">Schedule — {range === 'all' ? 'upcoming' : range}</h2>
      {list.length === 0 ? (
        <div className="empty">
          <Icon name="calendar" size={22} />
          <p>
            {range === 'today' && 'No tasks scheduled today.'}
            {range === 'tomorrow' && 'Nothing scheduled for tomorrow yet.'}
            {range === 'all' && 'No upcoming tasks.'}
          </p>
        </div>
      ) : (
        <div className="list">
          {list.map(({ task, date }) => (
            <TaskRow
              key={`${task.id}|${date}`}
              task={task}
              date={date}
              onToggle={onToggle}
              onEdit={onEdit}
              showDate={range !== 'today'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
