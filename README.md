# Wavelength

> Hack the signal before the Jammer adapts.

**Built during Parsewave Game Jam 2026** — Completed 2026-07-11T18:37:00+05:30.

---

## 🎮 What Is This?

**Wavelength** is a retro-analog hacking terminal arcade game built in HTML5 and synthesized in real-time. You are an operator attempting to lock a sliding signal frequency into an oscillating target band. 

But there's a catch: the **AI Jammer** is watching you. It tracks your needle rotation speed, reaction delay, and target overshoots over attempts. It classifies your playstyle signature:
- **Jitterer** (frantic tapping) → Counters with quick, chaotic **Jitter waves**.
- **Sniper** (slow calibration) → Counters with wide, sliding **Sawtooth waves**.
- **Panicked Tuner** (time-pressured swipes) → Counters with sudden, instant **Square wave jumps**.
- **Standard Operator** → Counters with smooth **Sine wave oscillations**.

To survive, you must steer the dial, type bypass scripts in the command-line console, and install hardware firmwares in a roguelite upgrade shop!

---

## ⌨️ How To Play

### 1. Analog Dial Tuning
- **Needle Steering**: Use `←` / `→` or `A` / `D` to rotate the dial needle.
- *Physics Note*: The needle has physical mass inertia. It will coast and slide unless upgraded with brakes!
- **Lock Signal**: Press `SPACE` (or click the green HUD button) when aligned in the target band.
  - **Clean Lock** (aligned inside inner 22%): Awards **+2 Points**.
  - **Standard Lock** (aligned inside 50%): Awards **+1 Point**.
  - **Near Miss** (aligned just outside): Awards **+1.5 seconds** time extension.

### 2. Tactical Command CLI Console
Press `~` (backtick) or `/` at any time to focus the console at the bottom of the screen. Focus suspends dial keys so you can type system scripts:
- `/help` → Lists all available terminal commands.
- `/diagnose` → Prints active AI Jammer status variables (Phase, Confidence, Signature).
- `/spoof <val>` → Spoofs the Jammer tracking database by injecting fake coordinate offsets.
- `/overclock` → Triggers temporary +50% dial speed (requires *Overclock Grid* upgrade).
- `/emp` → Discharges capacitor to freeze target oscillations for 2.0 seconds (requires *EMP Capacitor* upgrade).
- `/shield` → Queries active hardware shields status.
- `/endless` → Toggles survival mode (score threshold bypassed).
- `/scan` → Initiates a sub-carrier frequency scan sweep to locate target center.
- `/decrypt` → Spawns a cryptographic puzzle that awards a static Shield on solve.
- `/submit <key>` → Submits the correct solution key to bypass the grid lock.

### 3. Roguelite Upgrade Terminal
Every **3 successful locks**, the terminal pauses for a firmware upgrade choice. Pick one card:
- **Decoupled Flywheel**: Installs instant needle brakes, neutralizing rotation inertia slide.
- **Resonance Stabilizer**: Permanently widens the target signal aperture by +25%.
- **Spectral Decoy**: Spoofs database tracking, reducing Jammer reading accuracy by 40%.
- **Static Shielding**: Deploys a grid fuse that absorbs one Strike or Timeout (Max 2).
- **Overclock Grid**: Unlocks the `/overclock` active CLI command.
- **EMP Capacitor**: Unlocks the `/emp` active CLI command.

---

## 🎹 Technology Stack

- **Graphics Core**: [Phaser 4](https://phaser.io/) (v4.2.1 "Giedi") — HTML5 2D WebGL game engine utilizing node-based Beam render layers, vector drawing, camera chromatisms, and glitch blocks.
- **Audio Synthesizer**: Native Browser Web Audio API. 
  - Generates a **real-time eighth-note synth bassline** + kick + snare step loop code-side.
  - Modulates low-pass filters dynamically based on dial proximity (music gets clearer/brighter as you align!).
  - Increases drum tempo BPM as Jammer adapting Phase escalates.
  - Exposes an `AnalyserNode` to draw a 16-column bouncing visualizer spectrum on the HUD.
  - Synthesizes tactile typewriter key clicks on console typings.
- **Vite & Javascript**: Vanilla ES6 modules bundled via Vite v6.0.0.
- **CSS Effects**: HTML scanlines overlays, phosphor radial vignette, CRT curved borders, and Hold flickering keyframes.

---

## 🛠️ Build & Dev

```bash
# Install dependencies
npm install

# Run hot-reloading development server
npm run dev

# Bundle production build (files output to dist/)
npm run build

# Preview production build locally
npm run preview
```

---

## 🤖 AI Assistant Workflow Disclosure

This project was upgraded using the Google DeepMind **Antigravity AI pair programming assistant** running Gemini.
- **AI Planning & Design**: Used the `HackForge` agent system to compile a comprehensive tech scout blueprint, skeuomorphic hacking styling preferences, and competitor evaluations.
- **AI Coding**: Wrote modular Javascript CLI commands interpreter (`TerminalCLI.js`), upgrade shops (`UpgradeSystem.js`), Web Audio scheduling loops (`AudioManager.js`), and integrated state overrides (`MainScene.js`).
- **AI Debugging**: Automated bundler checks (`npm run build`) to ensure 100% clean compilation.

---

## 🏆 Credits, Disclosures & Prior Work

- **Tuner Engine Core**: Upgraded from an experimental analog dial tuning codebase built with Phaser 4. 
- **Sound Libraries & Synthesis**: Built code-side utilizing native Browser Web Audio API node grids (Oscillators, BiquadFilters, GainNodes, AnalyserNode).
- **Competitors & Research**: Inspired by the dial matching mechanics in *Wavelength* (the board game) and the terminal console overrides in *Deus Ex* / *Hacknet*.
- **24-Hour Window Achievements**:
  - Implemented the adaptive opponent AI engine (`Jammer.js`) that analyzes player drift velocity and overshoot behaviors to change wave styles in real-time.
  - Built the active command console interpreter (`TerminalCLI.js`) and shop system (`UpgradeSystem.js`).
  - Added full skeuomorphic filters to procedural synthesizer beats (`AudioManager.js`).
  - Implemented mobile responsive CSS screen transforms and CRT phosphor animations.

---

## 📄 License

MIT

