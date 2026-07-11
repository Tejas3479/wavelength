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
- Confirmed that missing or timeout flashes red, subtracts a life, and triggers game-over at 0 lives.

---

## Session 3 — Adaptive Jammer Layer (2026-07-11)

**What was set up:**

- Jammer module (`src/modules/Jammer.js`): Tracks player tuning telemetry (bias error and correction velocity) in a rolling 3-attempt buffer. Implements the countering equations for the next signal band (center shift, oscillation frequency, oscillation amplitude).
- Renders the visual "reading you..." tell: pauses the gameplay loop for 1.5 seconds between rounds, plays a red laser sweep animation down the screen, and displays flashing status text with the parsed user telemetry metrics.
- Modified SignalBand (`src/modules/SignalBand.js`): Replaced random/fixed movement values with configurable properties (`baselineCenter`, `speed`, `amplitude`) dynamically set by the Jammer module via `applyJammerParams()`.
- Wired telemetry collection in MainScene (`src/scenes/MainScene.js`): Records player dial positions and target band positions on every update frame. Computes average drift and adjustment speed at the end of each round. Transitions from `PLAYING` to `ANALYSIS` state, triggering the Jammer scanning sequence before resetting the dial and starting the next round.

**Why this order:**

The Jammer AI adaptive opponent is Wavelength's key design differentiator. Building it next ensures that the gameplay is functional, fun, and legible, allowing us to tuning parameters and verify the adaptive rules before spending time on audio and final visual assets in Session 4.

**Validation:**

- `npm run build` succeeds without issues.
- Verified that the 1.5-second scan freeze functions correctly, visual scan sweep paints properly, and text readouts flash during calibration.

---

## Session 4 — Polish and Feel (2026-07-11)

**What was set up:**

- AudioManager (`src/modules/AudioManager.js`): Dynamic sound generator using Web Audio API nodes. Playback of static crackle and detuned hum oscillators, mixing gain channels dynamically based on dial accuracy to guide the player. Triggers warm triangle beeps on lock success and aggressive sawtooth sliding buzzes on misses/timeouts.
- Implemented user interaction lock release in MainScene: Resumes/starts `AudioContext` immediately on the player's first Space or Click interaction on the Title screen.
- Screen Shake & Camera Flash feedback: Triggers camera shake (`shake(150, 0.012)`) and red camera flash on misses/timeouts; flashes camera teal/green on successful signal lock.
- Visual track redesign: Replaced the flat lines in SignalBand (`src/modules/SignalBand.js`) with an animated green sine wave track that flattens out into a clear line inside the target band. Added a retro CRT grid overlay in the background.
- UI Overlays Polish: Reformatted text sizes, alignments, and labels for Title, Game Over, and Victory screens.

**Why this order:**

Adding tactile visual/audio feedback directly links user action to gameplay response. Using Web Audio synthesizer elements guarantees absolute cross-platform sound loading reliability, bypassing CORS/header failures on the jam target hosts.

**Validation:**

- `npm run build` succeeds cleanly.
- Playtested on multiple screen resolutions: scale system auto-centers and fits perfectly.
- Confirmed audio activates on click/space and correctly crossfades between terminal static and carrier tone during tuning.
- Verified screen shake adds tactile "malfunction" weight on incorrect lock triggers.



