<!-- Source: hackforge-analyze | Confidence: STRONG | Version: v1 | Checkpoint: research-competitors -->
# Competitor & Architectural Research: Signal Tuning, Hacking, & Reflex Games

This document compiles market research on games featuring signal-tuning, hacking, and precision reflex mechanics, including similar commercial products, open-source alternatives, game jam benchmarks, common web architectures, and strategic gaps.

---

## 1. Similar Products & Competitor Landscape

### Category A: Signal Tuning & Calibration Games

#### 1. Oxenfree
- **URL**: [Night School Studio](https://www.nightschoolstudio.com/oxenfree)
- **Core Approach**: Narrative-driven supernatural mystery where tuning a hand-held radio to specific frequencies is the primary mechanic for interacting with anomalies, opening rifts, and unlocking dialogue.
- **Weaknesses & Gaps**: The tuning is purely a narrative key-and-lock puzzle. It lacks reflex pressure, timing challenges, or any active adversary trying to jam the signal.

#### 2. Wave Combinator
- **URL**: [Field Day Lab](https://fielddaylab.wisc.edu/)
- **Core Approach**: Educational physics game focusing on adjusting wavelength, amplitude, and frequency parameters to match target waves.
- **Weaknesses & Gaps**: Lacks arcade-style pacing, high-stakes feedback loops, or reactive adversarial mechanics; it is designed for slow-paced classroom learning.

#### 3. Rough Justice: '84
- **URL**: [Steam Store](https://store.steampowered.com/app/1291860/Rough_Justice_84/)
- **Core Approach**: Retro-styled detective simulator featuring skeuomorphic minigames, including a signal scanner where the player rotates knobs to align amplitude and frequency.
- **Weaknesses & Gaps**: The minigame is isolated, static, and behaves as a simple binary pass/fail blocker rather than a dynamic, evolving gameplay system.

---

### Category B: Assembly & Hacking Programming Puzzles (Zachlikes)

#### 1. TIS-100
- **URL**: [Zachtronics](https://www.zachtronics.com/tis-100/)
- **Core Approach**: Minimalist, multicore-inspired terminal programming game. Players write low-level assembly-like code across a grid of independent, communicating nodes to solve complex data processing tasks.
- **Weaknesses & Gaps**: Extremely steep learning curve; dry presentation that appeals almost exclusively to programmers; lacks real-time action, reflex pressure, or an active adversary.

#### 2. Shenzhen I/O
- **URL**: [Zachtronics](https://www.zachtronics.com/shenzhen-io/)
- **Core Approach**: Hardware design simulation where players place microcontrollers, logic gates, and screens on a circuit board and write assembly code to route and process signals.
- **Weaknesses & Gaps**: Complex interface with high friction; requires reading a physical PDF manual; lack of real-time adaptation or reflex pacing.

#### 3. EXAPUNKS
- **URL**: [Zachtronics](https://www.zachtronics.com/exapunks/)
- **Core Approach**: Cyberpunk hacking game where players write code for autonomous agents ("EXAs") that replicate, traverse networks, and manipulate files.
- **Weaknesses & Gaps**: High complexity; limited appeal to general players looking for arcade-style speed or direct reflex-based controls.

---

### Category C: Hacking Minigames & Precision Clones

#### 1. Cyberpunk 2077: Breach Protocol
- **URL**: [CD Projekt Red](https://www.cyberpunk.net/)
- **Core Approach**: Grid-based sequence matching minigame. Players select hexadecimal values from alternating rows and columns to match predetermined hacking matrices under a timer.
- **Weaknesses & Gaps**: The minigame is highly repetitive, has no real-time movement, and can be easily solved using external solver scripts.

#### 2. BioShock Hacking
- **URL**: [2K Games](https://2games.com/)
- **Core Approach**: Classic pipe-routing puzzle under time pressure, representing a fluid (signal) moving through a system.
- **Weaknesses & Gaps**: Very old mechanic that doesn't feel like "tuning"; lacks retro-terminal styling or modern adaptive feedback loops.

---

## 2. Open-Source Alternatives & Benchmarks

*   **Taajuus (Hamatti/taajuus)**
    - **URL**: [https://github.com/Hamatti/taajuus](https://github.com/Hamatti/taajuus)
    - **Approach**: A web adaptation of the social board game *Wavelength*, built for multiplayer screen-sharing during video calls.
    - **Gaps**: It is a social party game rather than an arcade/reflex puzzle. It relies entirely on human interaction rather than local heuristics or game loops.
*   **TIS-100 FPGA Implementation (axlan/tis100-fpga)**
    - **URL**: [https://github.com/axlan/tis100-fpga](https://github.com/axlan/tis100-fpga)
    - **Approach**: Cycle-accurate replication of the TIS-100 processor architecture in VHDL for execution on FPGAs.
    - **Gaps**: Highly technical, low-level academic project; not a playable web game.
*   **Cyberpunk Hacking Minigame (diegocbarboza/cyberpunk-hacking-minigame)**
    - **URL**: [https://github.com/diegocbarboza/Cyberpunk-2077-hacking-minigame-implemented-in-Unity](https://github.com/diegocbarboza/Cyberpunk-2077-hacking-minigame-implemented-in-Unity)
    - **Approach**: A faithful replica of the Breach Protocol minigame built in Unity.
    - **Gaps**: Tied to desktop builds; lacks browser accessibility or unique mechanical twists.
*   **Cyberpwned (nicolas-siplis/cyberpwned)**
    - **URL**: [https://github.com/nicolas-siplis/cyberpwned](https://github.com/nicolas-siplis/cyberpwned)
    - **Approach**: Open-source auto-solver implementing pathfinding algorithms to optimal paths in matrix minigames.
    - **Gaps**: A utility tool rather than a game, though it highlights the predictability of current hacking minigames.

---

## 3. Game Jam Reflex & Precision Benchmarks

*   **Punch Forever (Ludum Dare 54 Winner - Fun)**
    - **URL**: [https://itch.io/](https://itch.io/) (Ludum Dare submission page)
    - **Approach**: Fast-paced reflex battler built around rapid response keys and short reaction windows.
    - **Gaps**: Focuses on pure speed rather than precise calibration or signal alignment.
*   **The Sun and Moon (Ludum Dare 29 Winner)**
    - **URL**: [https://itch.io/](https://itch.io/) (Ludum Dare submission page)
    - **Approach**: Highly acclaimed precision platformer where momentum and timing are critical.
    - **Gaps**: Platformer physics rather than UI/dial precision mechanics.
*   **Mixed Signals (Ludum Dare 59 Jam Entry)**
    - **URL**: [https://itch.io/](https://itch.io/) (Ludum Dare submission page)
    - **Approach**: Short browser puzzle focused on calibrating dials and matching audio/visual frequencies under time pressure.
    - **Gaps**: The wave pattern shifts are hardcoded or randomized; the game does not adapt its difficulty dynamically based on player behavior.

---

## 4. Common Architectural Approaches

### 1. Signal-Tuning & Wave Matching
- **Web Audio API Engine**: Dynamic synthesis of carrier waves (e.g., `OscillatorNode`) mixed with noise (using a custom `AudioBufferSourceNode` filled with white noise). The player's dial scales the oscillator frequency, and high-frequency gain nodes are modulated by similarity values.
- **Mathematical Similarity Calculations**: Most browser wave-matching games use basic mathematical differences:
  $$\text{Error} = w_1 |A_{\text{player}} - A_{\text{target}}| + w_2 |f_{\text{player}} - f_{\text{target}}|$$
  This error rate determines the visibility of overlays or the volume of the clear signal.
- **Canvas Rendering**: Draw standard trigonometric waves ($y = A \sin(Bx + C)$) mapped directly to canvas coordinates inside a 2D rendering loop (`requestAnimationFrame`).

### 2. Assembly-Grid Programming Engines
- **Lightweight Virtual Machines**: Custom ES6 tokenizers and parsers that compile user-written strings into AST or instruction bytecode.
- **Cycle-Accurate Schedulers**: Central broker classes execution loop that tick all active node engines simultaneously. Communication channels use synchronous, blocking read/write queues to model micro-architectural constraints.

### 3. Reflex Arcade & State Machines
- **Phaser / PixiJS Loops**: Standard game engines utilizing frame-rate-independent physics loops ($dt$-based movement scaling) to ensure consistent difficulty across monitors (60Hz vs 144Hz).
- **LocalStorage State Manager**: Persisting levels, player high scores, unlocked upgrades, and behavioral logs locally in JSON format.

---

## 5. Synthesis: Commonly Built vs. What is Missing

| Dimension | Commonly Built | What is Missing (The Opportunity) |
| :--- | :--- | :--- |
| **Adversary Behavior** | Static random parameters or linear difficulty ramping (faster speeds, shorter timers). | **Adaptive Adversarial Heuristics:** A local tracker that logs overshoot metrics, reaction latency, and correction biases to adapt *its* movement pattern to counter player playstyles. |
| **Mechanic Integration** | Isolated mini-games that pause main gameplay or simple, slow-paced educational toys. | **High-Speed Arcade Reflex Hacking:** Melding precise analog-style dial controls with retro-cyberpunk terminal commands, creating a hectic multitasking environment. |
| **Audio Design** | Standard static background loop MP3s and generic click sound effects. | **Interactive Web Audio Soundscapes:** A procedural, code-side synth engine where music filters open/close and tempo scales dynamically in sync with tuning accuracy. |
| **Accessibility** | Visual-only alignment overlays that are inaccessible to visually impaired players. | **Auditory Resonance Feedback:** Using binaural beats and frequency modulation to allow signal alignment by sound alone. |
