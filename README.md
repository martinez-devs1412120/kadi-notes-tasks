# KADI — Notes & Tasks

A personal notes + to-do app with scheduled alarms and daily completion tracking.
Built with React + Vite as a **PWA**, so it works as a desktop app (Windows/Mac/Linux)
and a mobile app (Android/iOS) from a single codebase. All data stays on your device.

**Live:** https://martinez-devs1412120.github.io/kadi-notes-tasks/
GitHub Pages auto-deploys on every push to `main` (see
`.github/workflows/deploy.yml`). The build uses base `/kadi-notes-tasks/`.

## Run it

```bash
npm install     # first time only
npm run dev     # development server -> http://localhost:5173
```

Production build:

```bash
npm run build   # outputs dist/
npm run preview # serves the built app
```

## Install as an app

- **Desktop:** open the app in Chrome/Edge → click **⬇️ Install app** in the header
  (or the install icon in the address bar).
- **Android:** open the app in Chrome → menu → **Add to Home screen**.
- **iOS:** open in Safari → Share → **Add to Home Screen**.

## Features

| Area | What it does |
|------|--------------|
| 📝 **Notes** | Create / edit / delete notes, with search. |
| ✅ **Tasks** | Title + details, pick a **date & time**, priority, reminder lead time, optional **daily repeat**. |
| ⏰ **Alarms** | "Coming up" (before), "Time!" (at), "Overdue" (after) — OS notification + sound + in-app popup with **Done** and **Snooze 5m**. |
| 📊 **Monitor** | HabitKit-style **dot-grid heatmap** (18 weeks of daily completion), Monday-first month calendar with completion dots, per-day drill-down, streaks, weekly progress. |
| 💾 **Data** | Stored in browser localStorage; export / import JSON backups from ⚙️ Settings. |

## How alarms work

- Click the 🔔 button (or enable in Settings) to allow OS notifications.
- Alarms fire **while the app is open or installed and running** — the alarm engine
  re-checks every 20 seconds. This is the standard web-app model; true background
  push would require a notification server and can be added later.
- If OS notifications are blocked, in-app popups + sound still work.

## Design system

The UI follows the "color block" style (v4) with deliberate constraints:

- **Palette**: cream light theme / charcoal dark theme, one **lime accent**
  (`#d7f35a`), plus a **per-task pastel palette** (8 hues, `src/lib/palette.js`)
  — each task's color is used as the **full card fill** with black text,
  HabitKit/schedule-app style.
- **Type**: Inter Variable only (self-hosted), bold tight-tracked numerals,
  uppercase micro-labels, tabular numerals for times/counts.
- **Icons**: inline stroke SVG set (`src/components/icons.jsx`) — no emoji in the UI.
- **Components**: charcoal stat panels with lime values, pill chips for filters
  and metadata, white meta-pills on colored cards, dot-grid heatmap.
- **Every color maps to a state** — task color, done, overdue, calendar
  completion ratio. No decorative color, no gradients.
- **Motion**: small and purposeful only (check pop, toast slide, hover lifts).
- **Themes**: light and dark from the same token set (`prefers-color-scheme`).

## Project layout

```
src/
  App.jsx              state hub, alarm loop, install prompt
  lib/
    datetime.js        date/time helpers (local time)
    storage.js         localStorage-backed useState + helpers
    tasks.js           task model, instances, completion toggling
    alarms.js          alarm engine (upcoming/due/overdue) + chimes
  components/
    TodayView.jsx      greeting, progress, overdue banner, next-up
    TasksView.jsx      filters (Today/Upcoming/Overdue/Done/All) + search
    NotesView.jsx      note cards + search
    MonitorView.jsx    calendar heatmap, stats, drill-down, chart
    TaskModal.jsx      add/edit task form
    NoteModal.jsx      add/edit note
    SettingsModal.jsx  notifications, sound, backup/restore
    Toasts.jsx         in-app alert popups
    TaskRow.jsx        shared task row
scripts/gen_icons.py  regenerates the PWA icons (pure-stdlib PNG writer)
```
