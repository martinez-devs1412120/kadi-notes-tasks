// Notes: searchable card grid with create / edit / delete.

import { useMemo, useState } from 'react';
import { fmtDateShort } from '../lib/datetime';
import Icon from './icons';

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return fmtDateShort(new Date(iso).toISOString().slice(0, 10));
}

export default function NotesView({ notes, onEdit, onCreate }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();

  const shown = useMemo(
    () =>
      notes
        .filter(
          (n) =>
            !query ||
            n.title.toLowerCase().includes(query) ||
            (n.content || '').toLowerCase().includes(query)
        )
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')),
    [notes, query]
  );

  return (
    <div className="view">
      <div className="view-head">
        <h1>Notes</h1>
        <button className="btn" onClick={onCreate}>
          <Icon name="plus" size={13} /> New note
        </button>
      </div>
      <input
        className="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search notes"
        aria-label="Search notes"
      />
      {shown.length === 0 ? (
        <div className="empty">
          <Icon name="note" size={22} />
          <p>{notes.length === 0 ? 'No notes yet.' : `No notes matching "${q}".`}</p>
        </div>
      ) : (
        <div className="note-grid" style={{ marginTop: 12 }}>
          {shown.map((n) => (
            <div key={n.id} className="note-card" onClick={() => onEdit(n)} role="button" tabIndex={0}>
              <div className="note-title">{n.title}</div>
              <div className="note-excerpt">{n.content || '(empty)'}</div>
              <div className="note-time">edited {timeAgo(n.updatedAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
