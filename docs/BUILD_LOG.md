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
- `npm run build` produced a `dist/` folder; opening `dist/index.html` directly in the browser rendered the same canvas correctly (no CORS errors, no broken paths).
- No console errors in either mode.
