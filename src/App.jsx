import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStored, uid } from './lib/storage';
import { todayStr, fmtDate, fmtTime12, timeUntil, dateToISO } from './lib/datetime';
import { toggleInstance, countOverdue, instancesOn, MIN } from './lib/tasks';
import { checkAlarms, playChime, initAudio } from './lib/alarms';
import Icon from './components/icons';
import TodayView from './components/TodayView';
import TasksView from './components/TasksView';
import NotesView from './components/NotesView';
import MonitorView from './components/MonitorView';
import TaskModal from './components/TaskModal';
import NoteModal from './components/NoteModal';
import SettingsModal from './components/SettingsModal';
import Toasts, { toastFromAlert } from './components/Toasts';

const TABS = [
  { id: 'today', label: 'Today', icon: 'sun' },
  { id: 'tasks', label: 'Tasks', icon: 'tasks' },
  { id: 'notes', label: 'Notes', icon: 'note' },
  { id: 'monitor', label: 'Monitor', icon: 'chart' },
];

const ALERT_TITLE = { upcoming: 'Coming up', due: 'Time', overdue: 'Overdue' };

export default function App() {
  const [tasks, setTasks] = useStored('tasks', []);
  const [notes, setNotes] = useStored('notes', []);
  const [settings, setSettings] = useStored('settings', { sound: true });
  const [alertLog, setAlertLog] = useStored('alerts', {});
  const [snoozes, setSnoozes] = useStored('snoozes', {});

  const [tab, setTab] = useState('today');
  const [taskModal, setTaskModal] = useState(null); // null | { editing?: task }
  const [noteModal, setNoteModal] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [notifPerm, setNotifPerm] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [installEvt, setInstallEvt] = useState(null);
  const [tick, setTick] = useState(0); // re-render clock every 20s
  const seenAlerts = useRef(new Set());

  const sound = settings.sound !== false;

  // Keep relative times ("in 5 min", "overdue") fresh.
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 20000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => initAudio(), []);

  // PWA install prompt.
  useEffect(() => {
    const h = (e) => {
      e.preventDefault();
      setInstallEvt(e);
    };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  const enableNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const p = await Notification.requestPermission();
      setNotifPerm(p);
    } catch {
      /* ignore */
    }
  };

  // Fire alerts -> toast + OS notification + chime.
  const handleFired = useCallback(
    (fired) => {
      const fresh = fired.filter((f) => !seenAlerts.current.has(f.key));
      if (!fresh.length) return;
      for (const f of fresh) seenAlerts.current.add(f.key);
      const now = new Date();
      const toasts = fresh.map((f) => {
        const t = toastFromAlert(f);
        const due = dateToISO(f.date, f.task.time);
        if (f.stage === 'upcoming') t.sub = `${timeUntil(due, now)} — ${fmtTime12(f.task.time)}`;
        return t;
      });
      setToasts((ts) => [...ts, ...toasts]);
      for (const f of fresh) {
        try {
          if (notifPerm === 'granted') {
            const n = new Notification(`${ALERT_TITLE[f.stage]}: ${f.task.title}`, {
              body:
                f.stage === 'overdue'
                  ? `Was due at ${fmtTime12(f.task.time)} — still not done.`
                  : `Scheduled for ${fmtTime12(f.task.time)}${f.task.repeat === 'daily' ? ' (daily)' : ''}.`,
              tag: f.key,
            });
            n.onclick = () => {
              window.focus();
              n.close();
            };
          }
        } catch {
          /* ignore */
        }
        playChime(f.stage, sound);
      }
    },
    [notifPerm, sound]
  );

  // Alarm loop: on state changes and on every clock tick.
  useEffect(() => {
    const next = checkAlarms(tasks, { alertLog, snoozes }, handleFired);
    if (next !== alertLog) setAlertLog(next);
  }, [tasks, alertLog, snoozes, tick, handleFired]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismissToast = useCallback((id) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const completeFromToast = useCallback(
    (t) => {
      setTasks((ts) => ts.map((x) => (x.id === t.taskId ? toggleInstance(x, t.date) : x)));
      dismissToast(t.id);
    },
    [setTasks, dismissToast]
  );

  const snoozeFromToast = useCallback(
    (t) => {
      setSnoozes((s) => ({
        ...s,
        [`${t.taskId}|${t.date}`]: new Date(Date.now() + 5 * MIN).toISOString(),
      }));
      // Re-arm the "due" alarm so it fires again after the snooze.
      setAlertLog((log) => {
        const c = { ...log };
        delete c[`${t.taskId}|${t.date}|due`];
        return c;
      });
      dismissToast(t.id);
    },
    [setSnoozes, setAlertLog, dismissToast]
  );

  // --- Task & note CRUD ---
  const saveTask = (task) => {
    setTasks((ts) => {
      const i = ts.findIndex((x) => x.id === task.id);
      if (i >= 0) {
        const c = [...ts];
        c[i] = task;
        return c;
      }
      return [...ts, task];
    });
    setTaskModal(null);
  };

  const deleteTask = (task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    setTasks((ts) => ts.filter((x) => x.id !== task.id));
    setTaskModal(null);
  };

  const toggleTask = useCallback(
    (task, date) => {
      setTasks((ts) => ts.map((x) => (x.id === task.id ? toggleInstance(x, date) : x)));
    },
    [setTasks]
  );

  const saveNote = (note) => {
    setNotes((ns) => {
      const i = ns.findIndex((x) => x.id === note.id);
      if (i >= 0) {
        const c = [...ns];
        c[i] = note;
        return c;
      }
      return [note, ...ns];
    });
    setNoteModal(null);
  };

  const deleteNote = (note) => {
    if (!confirm(`Delete note "${note.title}"?`)) return;
    setNotes((ns) => ns.filter((x) => x.id !== note.id));
    setNoteModal(null);
  };

  const importBackup = (data) => {
    setTasks(data.tasks);
    setNotes(data.notes);
    if (data.settings) setSettings(data.settings);
    setShowSettings(false);
  };

  const overdueCount = useMemo(() => countOverdue(tasks), [tasks]);
  const badges = { tasks: overdueCount };

  const openFab = () => {
    if (tab === 'notes') setNoteModal({});
    else setTaskModal({});
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="mark"><Icon name="check" size={14} /></div>
          <div>
            <div className="brand-name">Kadi</div>
            <div className="brand-sub">{fmtDate(todayStr())}</div>
          </div>
        </div>
        <div className="header-actions">
          {installEvt && (
            <button className="btn tiny" onClick={() => { installEvt.prompt(); setInstallEvt(null); }}>
              <Icon name="download" size={13} /> Install app
            </button>
          )}
          <button
            className={`icon-btn ${notifPerm === 'denied' ? 'warn' : ''}`}
            onClick={enableNotifications}
            title={
              notifPerm === 'granted'
                ? 'Notifications enabled'
                : notifPerm === 'denied'
                  ? 'Notifications blocked in browser settings'
                  : 'Enable notifications'
            }
            aria-label="Notifications"
          >
            <Icon name={notifPerm === 'granted' ? 'bell' : 'bellOff'} size={17} />
          </button>
          <button className="icon-btn" onClick={() => setShowSettings(true)} title="Settings" aria-label="Settings">
            <Icon name="sliders" size={17} />
          </button>
        </div>
      </header>

      <nav className="nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-item ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
            {badges[t.id] > 0 && <span className="nav-count tnum">{badges[t.id]}</span>}
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === 'today' && (
          <TodayView tasks={tasks} onToggle={toggleTask} onEdit={(t) => setTaskModal({ editing: t })} goTasks={() => setTab('tasks')} />
        )}
        {tab === 'tasks' && (
          <TasksView
            tasks={tasks}
            onToggle={toggleTask}
            onEdit={(t) => setTaskModal({ editing: t })}
            onDelete={deleteTask}
          />
        )}
        {tab === 'notes' && (
          <NotesView notes={notes} onEdit={(n) => setNoteModal({ editing: n })} onCreate={() => setNoteModal({})} />
        )}
        {tab === 'monitor' && <MonitorView tasks={tasks} />}
      </main>

      <button className="fab" onClick={openFab} aria-label="Add">
        <Icon name="plus" size={20} />
      </button>

      {taskModal && (
        <TaskModal
          initial={taskModal.editing}
          onClose={() => setTaskModal(null)}
          onSave={saveTask}
          onDelete={deleteTask}
        />
      )}
      {noteModal && (
        <NoteModal
          initial={noteModal.editing}
          onClose={() => setNoteModal(null)}
          onSave={saveNote}
          onDelete={deleteNote}
        />
      )}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          notifPerm={notifPerm}
          onEnableNotifications={enableNotifications}
          sound={sound}
          onToggleSound={() => setSettings((s) => ({ ...s, sound: !s.sound }))}
          tasks={tasks}
          notes={notes}
          settings={settings}
          onImport={importBackup}
        />
      )}
      <Toasts toasts={toasts} onDismiss={dismissToast} onDone={completeFromToast} onSnooze={snoozeFromToast} />
    </div>
  );
}
