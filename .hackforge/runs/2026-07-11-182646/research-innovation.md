<!-- Source: hackforge-analyze | Confidence: STRONG | Version: v1 | Checkpoint: research-innovation -->
# Innovation Strategy: Wavelength Differentiators

This document details 5 unique innovation angles to differentiate the **Wavelength** terminal tuning game. Each concept is analyzed for feasibility, judge appeal, pros & cons, and concrete implementation within the game's existing Phaser 4 and Web Audio API architecture.

---

## 1. Interactive Command CLI (Tactile Hacking HUD)
*Enhance the terminal vibe by introducing a functional text command console overlay.*

- **Description**: Add a togglable retro console line at the bottom of the screen (triggered by pressing the backtick key `` ` `` or `/`). Opening this console pauses dial keyboard movement and allows the player to type specific tactical commands or diagnostic queries.
- **Feasibility**: **High**
- **Judge Appeal**: **High**
- **Key Mechanics**:
  - `/diagnose`: Outputs an ASCII-art read-out of the Jammer's current telemetry analysis parameters (e.g., active Phase, tracking bias limit, oscillation speed multiplier).
  - `/spoof <value>`: Injects false bias coordinates (e.g., forcing a fake left-drift into the Jammer's telemetry history) to trick the Jammer into adapting to the wrong side on the next round.
  - `/overclock`: Increases dial tuning precision/speed by 50% for 3 seconds, but doubles the Jammer's band movement frequency.
- **Implementation Strategy**: 
  - Build a standard HTML/CSS `div` input overlay pinned to the bottom of the Phaser game container.
  - Use simple JavaScript listeners to intercept keystrokes, suspend `DialController` keyboard polling while the terminal is focused, and trigger state overrides in `MainScene`.

---

## 2. Neural Signature Jammer Profiling (Adaptive Behavioral Tracking)
*Build a persistent, multi-round behavioral profile that categorizes the player's playstyle and adapts the Jammer specifically to counter it.*

- **Description**: Instead of resetting or using generic scaling rules, the Jammer tracks detailed behavioral telemetry (overshoot coefficient, reaction speed, tracking stability, lock accuracy) over multiple rounds and classifies the player. It shows this profile on screen in a dynamic "Neural Signature Diagnostics" layout.
- **Feasibility**: **Medium**
- **Judge Appeal**: **High**
- **Key Profiles**:
  - **The Jitterer** (high-speed, low-stability, frequent near-misses): Jammer responds by making the signal band jitter rapidly in small increments to exploit overcorrections.
  - **The Sniper** (low-speed, high-stability, clean locks): Jammer responds by moving the band in wide, slow sweeps, requiring the player to speed up.
  - **The Panicked Tuner** (high-speed, low-accuracy, time-pressured): Jammer responds by shrinking the grace-period timer and increasing baseline frequency deviations.
- **Implementation Strategy**:
  - Extend the data tracking in `MainScene.js` and `Jammer.js` to track standard deviations of dial speed and overshoot ticks over a 5-round rolling average.
  - Inject these classifications into `RunSummary.js` to render a detailed post-game psychological dossier of how the Jammer adapted.

---

## 3. Firmware Upgrade Terminal (Roguelite Progression)
*Introduce roguelite choice mechanics to add strategic depth and replayability.*

- **Description**: After every 3 locks, transition the game into an "Upgrade Terminal" where the player must choose one of three randomized firmware modules to install using recovered signal scraps.
- **Feasibility**: **Medium**
- **Judge Appeal**: **High**
- **Key Upgrade Cards**:
  - *Resonance Stabilizer (Active)*: Widens the target signal band by 25% but reduces the score gained per lock.
  - *Decoupled Flywheel (Passive)*: Decreases dial rotation inertia, providing instant stopping power when keys are released.
  - *Telemetric Decoy (Passive)*: Dampens the Jammer's ability to read player movement speed by 40%.
  - *Static Shielding (Consumable)*: Ignores one "Total Miss" penalty.
- **Implementation Strategy**:
  - Create a new state `STATES.UPGRADE` in `MainScene.js`.
  - Draw card containers using Phaser graphics or an HTML overlay. When selected, the upgrade directly adjusts properties on existing modules: `DialController` (inertia/friction), `SignalBand` (base width), `ScoreTimer` (max time), or `Jammer` (history tracking multiplier).

---

## 4. Procedural Web Audio Synthesizer Soundtrack (Algorithmic Retro-Wave)
*Construct a fully procedural synth soundtrack generated code-side in real-time, eliminating external audio files.*

- **Description**: Expand `AudioManager.js` from simple sound effects to a live step sequencer that creates a real-time synth soundtrack. The tempo, density, and filter cutoffs scale dynamically with the Jammer's active Phase.
- **Feasibility**: **Medium-Low**
- **Judge Appeal**: **Critical (Extremely High)**
- **Key Synthesizer Elements**:
  - *Pulse Bassline*: A low-passed sawtooth oscillator playing a steady 8th-note drone, shifting chords depending on tension levels.
  - *Percussion*: A sweep-based sine wave for a synthetic kick drum and a white-noise burst for snare hits.
  - *Dynamic Tempo*: 90 BPM during Phase 1 (Observe), accelerating to 110 BPM in Phase 2 (Engage), and reaching an intense 130 BPM in Phase 3 (Overdrive) with open filter cutoffs.
- **Implementation Strategy**:
  - Implement a simple step sequencer in `AudioManager.js` using `setInterval` or `AudioContext.currentTime` scheduling.
  - Synchronize note triggers with the main Phaser game loop. As the dial gets closer to the signal band, resolve the synth track's low-pass filter to sound "clearer", creating a unified audio-visual feedback loop.

---

## 5. Hybrid CSS/Canvas Retro CRT & Glitched Screen Overlays
*Create a highly polished, retro-analog hardware look with high performance and zero shader complexity.*

- **Description**: Simulate a physical screen terminal with scanlines, CRT curvature, screen flicker, and glitchy aberration effects.
- **Feasibility**: **High**
- **Judge Appeal**: **High**
- **Key Screen Effects**:
  - *CRT Curvature & Vignette*: A radial gradient overlay that simulates monitor glass bulge and edge shadowing.
  - *Scanlines & Screen Flicker*: Repeating CSS linear gradients overlaid with a low-opacity animation that jitters to simulate horizontal hold drift.
  - *Glitch Sweeps*: On "Total Miss", "Timeout", or during Jammer scanning sweeps, trigger sudden horizontal slices, canvas scale shifts, or color inversions.
- **Implementation Strategy**:
  - Avoid complex WebGL shaders which can cause bugs across browsers or between Phaser versions.
  - Instead, apply a parent CSS overlay onto `#game-container` using SVG filter displacement mapping (`<feDisplacementMap>`) and CSS animations. Trigger camera shakes and flashes using Phaser's built-in `this.cameras.main.shake()` and `this.cameras.main.flash()`.
