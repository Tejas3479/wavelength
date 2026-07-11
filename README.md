# Wavelength

> Lock the signal before the Jammer adapts.

**Built during Parsewave Game Jam 2026** — started 2026-07-11T17:48:40+05:30

---

## What Is This?

Wavelength is a single-screen, single-mechanic reflex/precision arcade game. You control a tuning dial. A target signal band moves along a track — adjust the dial to lock the signal into the band before the timer runs out. Score on each lock.

But there's a catch: the **Jammer** is watching you. It tracks your last several attempts — how fast you correct, which direction you tend to drift — and shifts its interference pattern to counter whatever has been working. You can see it thinking in real time via the "reading you..." tell on screen.

The Jammer is local, rule-based logic — no API calls, no chatbot, no live model. It runs entirely in the browser.

---

## Tech Stack

- [Phaser 4](https://phaser.io/) ("Salusa" v4.1.0) — HTML5 game framework
- Vanilla JavaScript (ES modules)
- [Vite](https://vitejs.dev/) — build tool
- No backend, no login, no SharedArrayBuffer

---

## Development

```bash
npm install
npm run dev      # Dev server at localhost:3000
npm run build    # Production build → dist/
```

---

## Status

🟢 Session 1 complete — project scaffold boots, blank canvas renders.

---

## License

MIT
