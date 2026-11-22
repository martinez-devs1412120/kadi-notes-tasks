// Shared task instance row used by Today and Tasks views.

import { PRIORITIES, isInstanceDone } from '../lib/tasks';
import { colorHex, autoColor } from '../lib/palette';
import { fmtTime12, isPast, relativeDay } from '../lib/datetime';
import Icon from './icons';

export default function TaskRow({ task, date, onToggle, onEdit, showDate = false, statusChip = null }) {
  const done = isInstanceDone(task, date);
  const past = isPast(date, task.time);
  const prio = PRIORITIES[task.priority] || PRIORITIES.medium;
  const tc = colorHex(task.color || autoColor(task.id));

  return (
    <div className={`trow ${done ? 'is-done' : past ? 'is-overdue' : ''}`} style={{ '--tc': tc }}>
      <button
        className={`check ${done ? 'checked' : ''}`}
        onClick={() => onToggle(task, date)}
        aria-label={done ? 'Mark as not done' : 'Mark as done'}
        title={done ? 'Mark as not done' : 'Mark as done'}
      >
        {done && <Icon name="check" size={11} />}
      </button>
      <div className="trow-main" onClick={() => onEdit(task)} role="button" tabIndex={0}>
        <div className="trow-top">
          <span className="trow-time">{fmtTime12(task.time)}</span>
          {showDate && <span className="trow-date">{relativeDay(date)}</span>}
          <span className="prio">
            <span className="prio-dot" style={{ '--p': prio.color }} />
            {prio.label}
          </span>
          {task.repeat === 'daily' && (
            <span className="tag info"><Icon name="repeat" size={11} /> daily</span>
          )}
          {statusChip}
        </div>
        <div className="trow-title">{task.title}</div>
        {task.desc && <div className="trow-desc">{task.desc}</div>}
      </div>
    </div>
  );
}
