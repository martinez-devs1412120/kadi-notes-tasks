// Today: hero panel with progress ring, overdue notice and today's schedule.

import { todayStr, dateToISO, fmtDate, timeUntil } from '../lib/datetime';
import { instancesOn, isInstanceDone, countOverdue } from '../lib/tasks';
import TaskRow from './TaskRow';
import Icon from './icons';

function ProgressRing({ pct }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <svg className="ring" width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-soft)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
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
      <text x="30" y="34.5" textAnchor="middle" className="ring-text tnum">
        {pct}%
      </text>
    </svg>
  );
}

export default function TodayView({ tasks, onToggle, onEdit, goTasks }) {
  const today = todayStr();
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

  return (
    <div className="view">
      <div className="today-hero">
        <div>
          <h1>{greeting}</h1>
          <p className="dateline">{fmtDate(today)}</p>
          {inst.length > 0 && (
            <p className="hero-count">
              <span className="tnum">{doneCount} of {inst.length}</span> tasks done
            </p>
          )}
        </div>
        {inst.length > 0 && <ProgressRing pct={pct} />}
      </div>

      {overdueTotal > 0 && (
        <button className="notice" onClick={goTasks}>
          <Icon name="alert" size={14} />
          {overdueTotal} overdue task{overdueTotal > 1 ? 's' : ''} — review
        </button>
      )}

      {upcoming && (
        <div className="next-card">
          <span className="next-label">Next up</span>
          <div className="next-title">{upcoming.task.title}</div>
          <div className="next-time">
            {timeUntil(dateToISO(upcoming.date, upcoming.task.time), now)} · {upcoming.task.time}
          </div>
        </div>
      )}

      <h2 className="section-label">Schedule — today</h2>
      {inst.length === 0 ? (
        <div className="empty">
          <Icon name="calendar" size={22} />
          <p>No tasks scheduled today.</p>
        </div>
      ) : (
        <div className="list">
          {inst.map(({ task, date }) => (
            <TaskRow key={task.id} task={task} date={date} onToggle={onToggle} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}
