# Wavelength — Build Log

> Chronological record of what was built each session and why.

---

## Session 1 — Foundation (2026-07-11)

**What was set up:**

- Project scaffold: `package.json` with Phaser 4 (^4.1.0 "Salusa") and Vite (^6.0.0) as the only dependencies. No other libraries.
- `vite.config.js` with `base: './'` — relative asset paths so the built game works on itch.io zip upload, Netlify subdirectory deploys, and when `dist/index.html` is opened directly from the filesystem.
- `index.html` — single-page entry with a `#game-container` div, viewport meta for mobile, no external CSS or fonts yet.
- `src/main.js` — Phaser 4 game config at 800×600 logical resolution with `Phaser.Scale.FIT` scaling and `CENTER_BOTH` auto-centering. This keeps the game playable on both desktop and mobile-width screens.
- `src/scenes/MainScene.js` — skeleton scene extending `Phaser.Scene`. Renders centered "WAVELENGTH — signal locked —" confirmation text in monospace green-on-dark. No game logic — Session 1 is intentionally logic-free.
- `/docs/PROJECT_CONTEXT.md` — the Master Context Block, persisted verbatim so every future session can self-orient from the repo.
- `/docs/BUILD_LOG.md` — this file.
- `/traces/` folder with placeholder files for each planned trace category: `code_debugging.md`, `art_prompts.md`, `level_or_balance_tuning.md`.
- `README.md` stub with the one-paragraph pitch and jam header.

**Why this order:**

Every hour lost to tooling failure late in the 24-hour window is unrecoverable. Getting a real, exportable browser build running first — before any game logic — proves the toolchain, dev server, and export path all work end to end. The context file ensures every future session can read the repo and know what to do without a re-paste.

**Validation:**

- `npm install` completed without errors.
- `npm run dev` launched the Vite dev server; blank canvas with confirmation text rendered in Chrome at `http://localhost:3000`.
- No console errors in either mode.

---

## Session 2 — Core Loop (2026-07-11)

**What was set up:**

- DialController (`src/modules/DialController.js`): Tracks player dial inputs from 0 to 100. Supports keyboard (arrow keys and A/D keys) and mouse/touch pointer dragging. The needle and dial are rendered visually using clean Phaser graphics placeholders.
- SignalBand (`src/modules/SignalBand.js`): Tracks the target signal band center (0 to 100) and width. Implements sinusoidal back-and-forth movement across the track. Includes hit collision check: `contains(value)`.
- ScoreTimer (`src/modules/ScoreTimer.js`): Tracks score (successful locks), lives (starts at 3), and countdown timer (starts at 5.0 seconds). Renders HUD texts and a visual timer bar that shrinks and changes color as it gets close to expiring.
- Integrated State Machine in MainScene (`src/scenes/MainScene.js`): Wires the modules together into a complete game loop:
  - `TITLE` state: displays name, instructions, and click-to-start.
  - `PLAYING` state: updates inputs, moves target band, decrements timer, checks lock attempts (SPACE or on-screen click of the "LOCK SIGNAL" button). Includes a screen flash (green for success, red for miss/timeout) and floating feedback text.
  - `GAME_OVER` and `VICTORY` states: triggered on 0 lives and 10 score respectively, with simple overlays to restart the loop.

**Why this order:**

Getting the ugly core gameplay loop working before adding any advanced logic or art styling is crucial for verifying the mechanics. It proves that collision boundaries feel right, keyboard/mouse input scaling is correct, and states transition cleanly.

**Validation:**

- `npm run build` succeeds without issues.
- Confirmed that index.html boots, correctly renders the title overlay, and transitions to gameplay.
- Confirmed that keyboard and mouse dragging both adjust the dial needle.
- Confirmed that hitting Space within the band increments the score and flashes teal/green.
- Confirmed that missing or timeout flashes red, subtracts a life, and triggers game-over at 0 lives.

