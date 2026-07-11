<!-- Source: hackforge-analyze | Confidence: STRONG | Version: v1 | Checkpoint: analyze-complete | Dependencies: none -->
# Blueprint: Wavelength - Adaptive Hacking Terminal

An upgraded, high-fidelity browser game that elevates the core tuning mechanic of *Wavelength* into a premium, tactile hacking arcade experience. Players must calibrate their signal dial, hack system protocols via a terminal console, buy firmware upgrades in a roguelite loop, and survive a highly adaptive local AI Jammer.

---

## 1. Problem Statement
The Parsewave Game Jam 2026 demands browser-playable web games built using AI-assisted pipelines. The submission must excel in game quality, polish, technical execution, and original contribution. A simple "match the dial" prototype is insufficient; the game must be a highly engaging, polished product that players want to play repeatedly.

---

## 2. Target Users
- **Arcade & Reflex Game Players**: Players who enjoy high-speed, mechanical gameplay, precision timing, and audio-visual feedback loops.
- **Synthwave/Cyberpunk Fans**: Users drawn to dark-neon, analog CRT terminal visual styles, and generative synthesizer chiptunes.
- **Hackathon Judges**: Tech-savvy evaluators assessing mechanical depth, code structure, procedural audio synthesis, and the sophistication of the adaptive AI.

---

## 3. Architecture

### System Design
```mermaid
graph TD
    subgraph Browser / HTML UI
        C[CRT Overlay & HUD Elements]
        CLI[Interactive Command Console]
    end

    subgraph Phaser Game Loop (MainScene)
        State[State Machine: TITLE, PLAYING, UPGRADE, ANALYSIS, GAMEOVER]
        Dial[DialController]
        Band[SignalBand]
        Timer[ScoreTimer]
    end

    subgraph local AI Opponent (Jammer Module)
        Profile[Neural Signature Tracker]
        Rules[Phase Heuristics Generator]
    end

    subgraph Audio Engine (AudioManager)
        Noise[Filtered White Noise Static]
        Synth[Procedural Synth Loop Sequencer]
    end

    %% Interactions
    CLI -->|Injects Spoofs/EMP| State
    Dial -->|Tuning Proximity| Noise
    Dial -->|Movement Coordinates| Profile
    Profile -->|Player Playstyle Signature| Rules
    Rules -->|Modulates Center/Speed/Amp| Band
    State -->|Triggers Card UI| UpgradeTerminal[Upgrade System]
    UpgradeTerminal -->|Modifies Properties| Dial
    UpgradeTerminal -->|Modifies Properties| Band
    State -->|Triggers SFX & Music Phase| Synth
    State -->|Visual Glitch Sweeps| C
```

### Component Breakdown

1.  **MainScene (`src/scenes/MainScene.js`)**:
    - Coordinates states: `TITLE`, `PLAYING`, `UPGRADE`, `ANALYSIS`, `GAMEOVER`, `VICTORY`.
    - Captures high-frequency player dial telemetry (overshoot ticks, dial movement velocity, locking delay).
    - Triggers camera shaking, chromatic flash effects, and digital glitch overlay sweeps.
2.  **DialController (`src/modules/DialController.js`)**:
    - Manages player needle value (0-100) via keyboard (arrows/AD), pointer drag, and console commands.
    - Implements inertia, damping, and custom firmware overrides (e.g. instant stopping, custom precision limits).
3.  **SignalBand (`src/modules/SignalBand.js`)**:
    - Handles target band movement, drawing a gorgeous glowing green canvas wave that flattens out when the dial aligns.
    - Incorporates wave shapes (Sine, Square, Sawtooth, Jitter) governed by the Jammer.
4.  **Jammer (`src/modules/Jammer.js`)**:
    - Tracks rolling telemetry averages.
    - Classifies the player's profile signature:
        - **Jitterer** (rapid, erratic key taps) -> responds with high-frequency micro-jitters.
        - **Sniper** (patient, slow calibration) -> responds with wide, sweeping sinusoidal movements.
        - **Panicked** (time-pressured, inaccurate) -> responds with reduced lock timers.
5.  **CLI Console (`src/modules/TerminalCLI.js` - [NEW])**:
    - HTML input element pinned underneath the canvas.
    - Accepts console actions like `/diagnose`, `/spoof <val>`, `/overclock`, `/shield`, `/emp`.
6.  **Upgrade System (`src/modules/UpgradeSystem.js` - [NEW])**:
    - Intercepts player progress every 3 locks.
    - Displays three cards utilizing neon styling to inject firmware modifications.
7.  **AudioManager (`src/modules/AudioManager.js`)**:
    - Generates a real-time, procedural synth background loop (a low sawtooth bassline + synthetic kick/snare step sequencer) using browser Web Audio API.
    - Dynamically opens low-pass filters and speeds up the tempo as the Jammer's phase rises.

### Data Flow
1.  **Tuning State**: As the needle rotates, `AudioManager` calculates $|\text{Dial} - \text{BandCenter}|$, blending static white noise out and clear harmonic tones in.
2.  **Telemetry Collection**: Every update frame, `MainScene` logs dial inputs and position variables into a telemetry array.
3.  **Jammer Analysis**: On a Lock request, `MainScene` transfers the telemetry data to the `Jammer`. The `Jammer` calculates the new target band center, speed, amplitude, and wave shape to counteract the player's profile.
4.  **CLI Intervention**: Opening the console intercepts keyboard inputs. Entering `/spoof 25` pushes false entries into the telemetry queue, tricking the Jammer into counteracting the wrong offset.

---

## 4. Tech Stack
- **Game Engine**: Phaser `v4.2.1` (WebGL-based Beam renderer, built-in vector graphics, high-performance camera effects).
- **Audio Core**: Native browser Web Audio API (highly optimized procedural oscillators, custom buffers, gains, biquad filter nodes).
- **Vite & JavaScript**: Vite `v6.0.0` with vanilla ES Modules.
- **Styling Overlay**: Vanilla CSS + custom HTML5 canvas overlays (for scanline grids and retro vignetting).

---

## 5. Innovation Differentiators
1.  **Multi-Round AI Behavioral Profiling**: The Jammer doesn't just scale linearly. It analyzes player stability and speed, naming the player's signature (Jitterer, Sniper, Panicked) and modifying the wave pattern to exploit specific weaknesses.
2.  **Tactile Hacking Console CLI**: The player can switch from steering the dial to typing system spoofs and overclock sequences, merging analog precision with digital terminal syntax.
3.  **Roguelite Upgrade Terminal**: Introduces strategic choices (firmware card options) after lock sequences, allowing players to build custom hardware modifications (Decoys, Resonance Stabilizers, Inertia Dampeners).
4.  **Procedural Synth-Track Generator**: The game generates its entire audio-scape (music, bass rhythms, drum kicks, static filters) code-side in real-time. No external audio files are loaded.

---

## 6. Competitive Landscape
- **BioShock/Cyberpunk**: Standard static puzzle locks. *Wavelength* outperforms them by introducing a reactive adversary that studies user habits.
- **Oxenfree**: Rich narrative, but passive dial puzzles. *Wavelength* focuses on high-stakes, fast-paced arcade action.
- **Zachlikes (TIS-100)**: Complex and academic. *Wavelength* targets accessible reflex mechanics wrapped in a similarly satisfying hacking-terminal aesthetic.

---

## 7. Build Order (Sequenced)
1.  **Phase 1: Generative Audio & Soundtrack (AudioManager)**
    - Implement the procedural step-sequencer in `AudioManager.js`.
    - Synthesize background basslines, kick/snare percussion, and phase-scaled filter sweeps.
2.  **Phase 2: Terminal Console CLI Overlay (TerminalCLI)**
    - Build the HTML CLI console interface.
    - Integrate command parsers, lock-out logic for keys, and execution bindings.
3.  **Phase 3: Upgrade System & State Machine (UpgradeSystem)**
    - Add `STATES.UPGRADE` to the state machine.
    - Design and render interactive firmware cards, applying properties to the dial, band, and jammer.
4.  **Phase 4: Jammer Behavioral Profiles (Jammer)**
    - Enhance `Jammer.js` to calculate standard deviations of speed, overshoot rates, and delay logs.
    - Connect player classification to target band behavior (Square, Sine, Jitter wave offsets).
5.  **Phase 5: High-Fidelity Retro Polish**
    - Implement SVG filters, scanline hold flicker, and canvas glitching.
    - Clean up HUD styling, adding terminal boot scripts and dynamic telemetry monitors.

---

## 8. Risk Assessment
- **Web Audio Context Autoplay Blocks**:
  *Mitigation*: Keep audio suspended until the player clicks start or presses Space on the title screen.
- **Phaser 4 Context Loss**:
  *Mitigation*: Use Phaser 4's built-in canvas sizing hooks and standard vector rendering nodes to prevent buffer crashes.
- **DOM CLI vs Canvas Input Conflict**:
  *Mitigation*: Ensure the CLI console input element disables all Phaser keyboard listener handlers on focus, and re-enables them on blur or command submission.

---

## 9. Time Allocation (24-Hour Jam Window)
| Phase | Duration | Focus |
| :--- | :--- | :--- |
| **Research & Spec** | 2 Hours | Architecture, tech analysis, design planning. |
| **Generative Audio** | 4 Hours | Step sequencer, synth loop, tuning filters. |
| **Console & Upgrades** | 5 Hours | CLI parsing, card upgrades, state integrations. |
| **Behavioral AI** | 5 Hours | Telemetry, profiling rules, wave adaptations. |
| **Polish & Shaders** | 4 Hours | Glitch sweeps, scanlines, visual assets, text bootups. |
| **Audit & Deploy** | 4 Hours | Bug checking, build validation, deployment, README write. |
