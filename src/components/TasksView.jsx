// All tasks with filters (Today / Upcoming / Overdue / Done / All) + search.

import { useMemo, useState } from 'react';
import { todayStr, isPast } from '../lib/datetime';
import { instancesOn, isInstanceDone } from '../lib/tasks';
import TaskRow from './TaskRow';
import Icon from './icons';

const FILTERS = [
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'done', label: 'Done' },
  { id: 'all', label: 'All' },
];

const matches = (t, q) =>
  !q || t.title.toLowerCase().includes(q) || (t.desc || '').toLowerCase().includes(q);

export default function TasksView({ tasks, onToggle, onEdit }) {
  const today = todayStr();
  const [filter, setFilter] = useState('today');
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();

  const content = useMemo(() => {
    if (filter === 'today') {
      return instancesOn(tasks, today)
        .filter(({ task }) => matches(task, query))
        .map(({ task, date }) => ({ task, date }));
    }
    if (filter === 'upcoming') {
      return tasks
        .filter((t) => (t.repeat === 'daily' || t.date > today) && matches(t, query))
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .map((task) => ({ task, date: today }));
    }
    if (filter === 'overdue') {
      return tasks
        .filter(
          (t) =>
            !isInstanceDone(t, t.repeat === 'daily' ? today : t.date) &&
            matches(t, query) &&
            (t.repeat === 'daily'
              ? t.date <= today && isPast(today, t.time)
              : isPast(t.date, t.time))
        )
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .map((task) => ({ task, date: task.repeat === 'daily' ? today : task.date }));
    }
    if (filter === 'done') {
      return tasks
        .filter((t) => matches(t, query) && (t.repeat === 'daily' ? Object.keys(t.completions || {}).length : t.done))
        .sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || ''))
        .map((task) => ({ task, date: today }));
    }
    return tasks
      .filter((t) => matches(t, query))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .map((task) => ({ task, date: today }));
  }, [tasks, filter, query, today]);

  return (
    <div className="view">
      <h1>Tasks</h1>
      <input
        className="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search tasks"
        aria-label="Search tasks"
      />
      <div className="chips">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`chip ${filter === f.id ? 'chip-on' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {content.length === 0 ? (
        <div className="empty">
          <Icon name="tasks" size={22} />
          <p>
            {filter === 'today' && !q ? 'Nothing scheduled today.' : `No ${filter} tasks${q ? ` matching "${q}"` : ''}.`}
          </p>
        </div>
      ) : (
        <div className="list">
          {content.map(({ task, date }) => (
            <TaskRow
              key={task.id}
              task={task}
              date={date}
              onToggle={onToggle}
              onEdit={onEdit}
              showDate={filter !== 'today'}
              statusChip={
                filter === 'done' && task.repeat === 'daily' ? (
                  <span className="tag ok tnum">{Object.keys(task.completions || {}).length} days</span>
                ) : null
              }
            />
          ))}
        </div>
      )}
      <p className="muted small">Tap a task to edit it. The circle marks it done.</p>
    </div>
  );
}
