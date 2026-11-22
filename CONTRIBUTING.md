# Contributing to KADI

Thanks for contributing! KADI is a personal notes + tasks PWA (React + Vite)
with scheduled alarms and daily habit-style tracking.

## Setup

```bash
npm install     # once
npm run dev     # dev server -> http://localhost:5173
```

## Workflow

1. Branch from `main`: `git checkout -b feat/my-change`
2. Make your change, keep commits small and written in the imperative mood
   (e.g. `Add snooze re-arm to due alarms`, not `added stuff`).
3. Verify before pushing:
   ```bash
   npm run build    # must pass
   ```
4. Open a pull request against `main` with a short description of what changed and why.

## Rules of the codebase

- **Design tokens only** — use the CSS variables in `src/styles.css`
  (`--accent`, `--ink-2`, `--line`, …). Never hardcode hex values outside
  `:root` / the dark-theme block.
- **No emoji in the UI** — icons come from `src/components/icons.jsx` (inline
  stroke SVGs). Add new icons there.
- **Every color maps to a state** — priority, done, overdue, calendar
  completion ratio. Don't introduce decorative color.
- **Data model** lives in `src/lib/tasks.js`; all persistence goes through
  `src/lib/storage.js` (localStorage, `kadi.*` keys). Keep it that way so
  backup/export keeps working.
- **Dates are local-time strings** (`YYYY-MM-DD`, `HH:MM`) — use the helpers
  in `src/lib/datetime.js`, never parse dates ad hoc.
- The alarm engine (`src/lib/alarms.js`) must stay pure and side-effect-free:
  it returns new alert state; the caller does notifications/sound.

## Deployment

Production deploys go to ZCode Sites (see README). Redeploy:

```bash
npm run build
rm -rf .zcode-site/stage/dist && cp -r dist .zcode-site/stage/dist
zcode-site deploy .zcode-site/stage
```
