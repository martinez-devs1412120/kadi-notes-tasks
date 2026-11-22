// Monitor: figures, dot-grid consistency heatmap, HabitKit-style month
// calendar (Monday-first, completion dots) and a per-day drill-down.

import { useMemo, useState } from 'react';
import { addDays, fmtDate, pad, todayStr } from '../lib/datetime';
import { instancesOn, isInstanceDone, dueDateOf, dayInfo, currentStreak, bestStreak, weekInfo } from '../lib/tasks';
import { colorHex, autoColor } from '../lib/palette';
import DotGrid from './DotGrid';
import Icon from './icons';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MonitorView({ tasks }) {
  const today = todayStr();
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [sel, setSel] = useState(today);

  const stats = useMemo(() => {
    let total30 = 0, done30 = 0, totalDone = 0;
    for (let i = 0; i < 30; i++) {
      const { total, done } = dayInfo(tasks, addDays(today, -i));
      total30 += total;
      done30 += done;
    }
    for (const t of tasks) {
      totalDone += t.repeat === 'daily'
        ? Object.keys(t.completions || {}).length
        : t.done ? 1 : 0;
    }
    return {
      streak: currentStreak(tasks, today),
      best: bestStreak(tasks, today),
      week: weekInfo(tasks, today),
      rate30: total30 ? Math.round((done30 / total30) * 100) : null,
      totalDone,
    };
  }, [tasks, today]);

  // Monday-first calendar grid for the viewed month.
  const grid = useMemo(() => {
    const blanks = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
    const days = new Date(view.y, view.m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < blanks; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(`${view.y}-${pad(view.m + 1)}-${pad(d)}`);
    return cells;
  }, [view]);

  const shiftMonth = (n) => {
    setView((v) => {
      const d = new Date(v.y, v.m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const pickDate = (dateStr) => {
    setSel(dateStr);
    const [y, m] = dateStr.split('-').map(Number);
    setView({ y, m: m - 1 });
  };

  const selInst = instancesOn(tasks, sel);

  return (
    <div className="view">
      <h1>Monitor</h1>

      <div className="figures">
        <div className="figure">
          <div className="figure-value">
            <span className="accent tnum">{stats.streak}</span>
            <span className="unit"> day{stats.streak === 1 ? '' : 's'}</span>
          </div>
          <div className="figure-label">Current streak</div>
        </div>
        <div className="figure">
          <div className="figure-value tnum">{stats.best}</div>
          <div className="figure-label">Best streak, 1y</div>
        </div>
        <div className="figure">
          <div className="figure-value tnum">{stats.rate30 == null ? '—' : `${stats.rate30}%`}</div>
          <div className="figure-label">Completed, 30d</div>
        </div>
        <div className="figure">
          <div className="figure-value tnum">{stats.totalDone}</div>
          <div className="figure-label">Total done</div>
        </div>
      </div>

      <h2 className="section-label">Consistency — last 18 weeks</h2>
      <div className="panel">
        <DotGrid tasks={tasks} weeks={18} onPick={pickDate} />
        <div className="chip-row">
          <span className="chip-stat">
            <Icon name="zap" size={12} />
            <b className="tnum">{stats.streak}</b> day streak
          </span>
          <span className="chip-stat">
            <Icon name="check" size={12} />
            <b className="tnum">{stats.week.done}</b> of {stats.week.total} this week
          </span>
        </div>
      </div>

      <h2 className="section-label">{MONTHS[view.m]} {view.y}</h2>
      <div className="panel">
        <div className="cal-head">
          <span className="cal-title">{MONTHS[view.m]} {view.y}</span>
          <div className="cal-nav">
            <button className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <Icon name="chevronLeft" size={15} />
            </button>
            <button className="icon-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
              <Icon name="chevronRight" size={15} />
            </button>
          </div>
        </div>
        <div className="cal-grid">
          {WD.map((w, i) => <div key={`w${i}`} className="cal-wd">{w}</div>)}
          {grid.map((dateStr, i) =>
            dateStr == null ? (
              <div key={`b${i}`} className="cal-cell cal-blank" aria-hidden="true" />
            ) : (
              (() => {
                const { total, done } = dayInfo(tasks, dateStr);
                const cls =
                  total === 0 ? 'cal-none'
                    : done === total ? 'cal-full'
                      : done > 0 ? 'cal-part'
                        : dateStr < today ? 'cal-miss' : 'cal-todo';
                return (
                  <button
                    key={dateStr}
                    className={`cal-cell ${cls} ${dateStr === today ? 'cal-today' : ''} ${dateStr === sel ? 'cal-sel' : ''}`}
                    onClick={() => setSel(dateStr)}
                    title={`${dateStr} — ${done}/${total} done`}
                  >
                    <span className="cal-num">{Number(dateStr.slice(8))}</span>
                    {total > 0 && <span className="cal-dot" />}
                  </button>
                );
              })()
            )
          )}
        </div>
        <div className="cal-legend">
          <span><i className="lg lg-full" /> all done</span>
          <span><i className="lg lg-part" /> partial</span>
          <span><i className="lg lg-miss" /> missed</span>
        </div>
      </div>

      <h2 className="section-label">{fmtDate(sel)}{sel === today ? ' — today' : ''}</h2>
      {selInst.length === 0 ? (
        <div className="empty">
          <Icon name="calendar" size={22} />
          <p>No tasks were scheduled this day.</p>
        </div>
      ) : (
        <div className="list">
          {selInst.map(({ task, date }) => {
            const done = isInstanceDone(task, date);
            const due = dueDateOf(task, date);
            const chip = done
              ? <span className="tag ok">done</span>
              : due < now
                ? <span className="tag bad">{date === today ? 'late' : 'missed'}</span>
                : date === today
                  ? <span className="tag info">pending</span>
                  : <span className="tag info">upcoming</span>;
            return (
              <div key={task.id} className="hist-row" style={{ '--tc': colorHex(task.color || autoColor(task.id)) }}>
                <div>
                  <div className="hist-title">
                    {task.title} {task.repeat === 'daily' && <Icon name="repeat" size={11} />}
                  </div>
                  <div className="hist-sub">{task.time}</div>
                </div>
                {chip}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
