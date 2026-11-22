// Create / edit a note.

import { useState } from 'react';
import { uid } from '../lib/storage';

export default function NoteModal({ initial, onClose, onSave, onDelete }) {
  const editing = !!initial;
  const [title, setTitle] = useState(initial?.title || '');
  const [content, setContent] = useState(initial?.content || '');

  const save = () => {
    const t = title.trim() || content.trim().split('\n')[0]?.slice(0, 60) || 'Untitled note';
    onSave({
      ...(initial || {}),
      id: initial?.id || uid(),
      title: t,
      content: content.trim(),
      createdAt: initial?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{editing ? 'Edit note' : 'New note'}</h2>
        <label className="field">
          <span>Title</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            maxLength={120}
          />
        </label>
        <label className="field">
          <span>Note</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write anything… ideas, lists, thoughts."
            rows={9}
          />
        </label>
        <div className="modal-actions">
          {editing && (
            <button className="btn danger" onClick={() => onDelete(initial)}>Delete</button>
          )}
          <div className="spacer" />
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save}>
            {editing ? 'Save changes' : 'Add note'}
          </button>
        </div>
      </div>
    </div>
  );
}
