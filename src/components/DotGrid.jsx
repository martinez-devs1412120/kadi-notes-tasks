// Dot-grid consistency heatmap (HabitKit-style): one cell per day,
// weeks as columns (Mon..Sun rows), intensity = completion ratio.

import { addDays, todayStr } from '../lib/datetime';
import { dayInfo } from '../lib/tasks';

export default function DotGrid({ tasks, weeks = 18, onPick }) {
  const today = todayStr();
  const rawStart = addDays(today, -(weeks * 7 - 1));
  // Align the first column to Monday.
  const startDow = (new Date(`${rawStart}T00:00`).getDay() + 6) % 7;
  const gridStart = addDays(rawStart, -startDow);

  const cols = [];
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const ds = addDays(gridStart, w * 7 + d);
      col.push(ds > today ? null : ds);
    }
    cols.push(col);
  }

  return (
    <div className="dotgrid" role="grid" aria-label="Daily completion heatmap">
      {cols.map((col, i) => (
        <div className="dotgrid-col" key={i}>
          {col.map((ds, j) =>
            ds == null ? (
              <span key={j} className="heat heat-future" aria-hidden="true" />
            ) : (
              (() => {
                const { total, done } = dayInfo(tasks, ds);
                const cls =
                  total === 0 ? 'heat-none'
                    : done === total ? 'heat-full'
                      : done > 0 ? 'heat-part'
                        : 'heat-miss';
                return (
                  <button
                    key={j}
                    className={`heat ${cls}`}
                    onClick={() => onPick(ds)}
                    title={`${ds} — ${done}/${total} done`}
                    aria-label={`${ds}: ${done} of ${total} tasks done`}
                  />
                );
              })()
            )
          )}
        </div>
      ))}
    </div>
  );
}
