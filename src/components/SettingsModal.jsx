// Settings: notification permission, sound toggle, data backup/restore.

import { useRef } from 'react';
import { todayStr } from '../lib/datetime';
import Icon from './icons';

export default function SettingsModal({
  onClose, notifPerm, onEnableNotifications, sound, onToggleSound,
  tasks, notes, settings, onImport,
}) {
  const fileRef = useRef(null);

  const exportData = () => {
    const data = {
      version: 1,
      app: 'Kadi',
      exportedAt: new Date().toISOString(),
      tasks,
      notes,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kadi-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.tasks) || !Array.isArray(data.notes)) {
          alert('That file does not look like a Kadi backup.');
          return;
        }
        if (confirm(`Restore backup from ${data.exportedAt || 'unknown date'}?\nCurrent data will be replaced.`)) {
          onImport(data);
        }
      } catch {
        alert('Could not read that file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const permText = {
    granted: 'Notifications are enabled on this device.',
    default: 'Not enabled yet. Allow them to receive alarms outside the page.',
    denied: 'Blocked in your browser settings. In-app popups and sound still work.',
    unsupported: 'This browser does not support notifications. In-app popups and sound still work.',
  }[notifPerm];

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Settings</h2>

        <div className="set-block">
          <h3>Notifications</h3>
          <p className="muted small">{permText}</p>
          {notifPerm === 'default' && (
            <button className="btn primary" onClick={onEnableNotifications}>
              Enable notifications
            </button>
          )}
          <p className="muted small">
            Alarms fire while Kadi is open, or installed and running. Install it on
            desktop or add it to the home screen on mobile for the app experience.
          </p>
          <label className="field switch-field">
            <span>Alarm sound</span>
            <button
              type="button"
              className={`switch ${sound ? 'on' : ''}`}
              onClick={onToggleSound}
              aria-pressed={sound}
            >
              <span className="knob" />
            </button>
          </label>
        </div>

        <div className="set-block">
          <h3>Data</h3>
          <p className="muted small">
            Stored on this device — {tasks.length} tasks, {notes.length} notes.
          </p>
          <div className="btn-row">
            <button className="btn" onClick={exportData}>
              <Icon name="download" size={13} /> Export backup
            </button>
            <button className="btn" onClick={() => fileRef.current?.click()}>
              <Icon name="upload" size={13} /> Import backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={importData}
            />
          </div>
        </div>

        <div className="modal-actions">
          <div className="spacer" />
          <button className="btn primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
