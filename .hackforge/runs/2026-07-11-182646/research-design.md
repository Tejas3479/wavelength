<!-- Source: hackforge-analyze | Confidence: STRONG | Version: v1 | Checkpoint: research-design -->
# Research Findings: Retro Hacking UI & Visual Design References (2026-07-11)

This document establishes the visual design direction, typography choices, color applications, and gaming references for **Wavelength**. It outlines recommendations for achieving a retro-futuristic arcade aesthetic utilizing cyan, magenta, and green cyber themes.

---

## 1. Key Design Concept: Cassette Futurism & Vector Arcade

To create a high-fidelity visual experience, the game should employ a mix of **Cassette Futurism** (analog computer tech, CRT scanlines, chunky interfaces) and **Vector Arcade** (glowing wireframe geometry, high contrast lines, dark voids) aesthetics.

| Design Element | Retro-Futuristic Arcade Style | Web/Canvas Implementation |
| :--- | :--- | :--- |
| **CRT Effects** | Raster scanlines, screen curvature (fish-eye), phosphor glow, and soft analog flicker. | Phaser 4 built-in CRT filter overlay or dual CSS scanline gradients with custom CSS flicker animation. |
| **Glow & Bloom** | Glowing wireframe shapes mimicking 1980s vector cabinets (e.g., *Battlezone*, *Tempest*). | WebGL Canvas additive blending (`context.globalCompositeOperation = 'screen'`) and double-pass stroke overlays. |
| **Glitch & Aberration** | Sudden signal disruption, horizontal line-slicing, and cyan/magenta chromatic channel shifts. | SVG displacement filters or temporary canvas scale-jittering and red/blue offset rendering during high-intensity events. |
| **Skeuomorphic CLI** | Interactive terminal prompts, tactile text-logs, and mechanical keyboard acoustics. | HTML/CSS text inputs layered over the Phaser canvas with customized, authentic typewriter key click triggers. |

---

## 2. Recommended Font Pairings

For a cyberpunk, terminal-centric look, the typography must balance **technical readability** (for logs and codes) with **stylized sci-fi displays** (for warning headers and dials).

### Monospace / UI Fonts (Main Body, Code, Telemetry)
*   **Space Mono (Google Font)**
    *   *Type*: Monospace
    *   *Why it fits*: Combines geometric precision with a classic terminal feel. It is highly readable at small scales, making it perfect for status feeds, CLI outputs, and data numbers.
*   **JetBrains Mono**
    *   *Type*: Monospace
    *   *Why it fits*: Outstanding layout consistency and clear character differentiation (e.g., zero with dot/slash, distinct l/1/I), essential for reading hacking indicators rapidly.

### Display / Sci-Fi Fonts (Headers, Titles, Phase Warnings)
*   **Orbitron (Google Font)**
    *   *Type*: Geometric Sans-Serif
    *   *Why it fits*: Mimics corporate cyber-branding, cockpit displays, and futuristic console readouts. It is clean but has a heavy, angular presence that feels metallic.
*   **Share Tech Mono**
    *   *Type*: Monospace Display
    *   *Why it fits*: Slightly stylized monospace that has a futuristic, industrial texture. Perfect for sub-headings, target locks, and large count-down timers.

### Recommended Pairing Strategy
*   **Primary Pairing**: **Orbitron** (for Titles/Phase Warnings) + **Space Mono** (for UI Labels/CLI Inputs).
*   **Alternative Pairing**: **Share Tech Mono** (for Headers/Timers) + **JetBrains Mono** (for Data Grids/Logs).

---

## 3. Cyber Theme Color Palette Application

To avoid a messy "rainbow" layout, we adopt a disciplined, role-based application of the classic cyan, magenta, and green cyber colors against a deep navy/carbon background.

| Color | Hex Code | Visual Role | UX/Gameplay Context |
| :--- | :--- | :--- | :--- |
| **Deep Carbon** | `#0D0F12` | Screen Background | Base canvas and window background fills; keeps neon colors legible. |
| **Navy Shadow** | `#0A0C10` | Bounding Containers | Panel backgrounds, inactive cards, window boundaries. |
| **Neon Cyan** | `#00F0FF` | Primary Interactive | Default active states, system diagnostics, standard menus, signal waves. |
| **Neon Magenta** | `#FF007F` | Warnings & Adversaries | Active Jammer signals, threat counters, timers, detection triggers, critical damage. |
| **Neon Green** | `#39FF14` | Safe Status & Success | Calibration matches, network connection, program compilations, node capture success. |
| **Desaturated Gray**| `#8F9AA6` | Secondary Text | Regular body text, instructions, and non-essential logs to reduce visual fatigue. |

---

## 4. Specific Visual References (3-5 Products)

The following products serve as the primary visual benchmarks for Wavelength's interface architecture:

### 1. Hacknet (Orphan / Team Fractal Alligator)
*   **Visual Style**: Desktop UNIX operating system simulation. Clean, rectangular pane layouts containing active terminal, RAM bars, directory trees, and network maps.
*   **Key Design Assets**:
    *   *Dynamic RAM Grid*: Visual representation of RAM blocks using segmented green/cyan vertical meters.
    *   *Tracer Threat Indicator*: Prominent red-glow timers that trigger full-screen analog noise sweeps when detection reaches 100%.
*   **Relevance to Wavelength**: Shows how to construct a multi-window hacking dashboard using clean flat blocks, maintaining visibility while multitasking under high tension.

### 2. Duskers (Misfits Attic)
*   **Visual Style**: High-tension, lo-fi Cassette Futurism. Dark monochrome CRT screen layouts, low-res lines, and grid interfaces.
*   **Key Design Assets**:
    *   *Vector Map Lines*: Clean, un-aliased wireframe layouts showing retro ship schema.
    *   *Typing CLI Mechanics*: Forceful keyboard inputs (`navigate 1 r2`, `open d3`) with immediate character-by-character render echo and line-feed audio ticks.
*   **Relevance to Wavelength**: Serves as a reference for creating claustrophobic tension using minimal line art, scanlines, and a heavy command-line interface focus.

### 3. Deus Ex: Human Revolution / Mankind Divided (Eidos Montréal)
*   **Visual Style**: "Cyber-Renaissance" gold/black clean node-based network virtualization overlays.
*   **Key Design Assets**:
    *   *Node Interconnection*: Clear geometric link lines connecting diagnostic modules, firewalls, and CPU registers.
    *   *Interactive Software Hotbars*: Flat boxes along the screen border showing utility icons (Nuke, Stop, Reveal) with keyboard short-cuts.
*   **Relevance to Wavelength**: Provides a visual blueprint for clean data routing interfaces, network grid overlays, and interactive nodes for hacking/tuning.

### 4. TIS-100 (Zachtronics)
*   **Visual Style**: Brutalist retro-computer emulator interface. Monospace grey-on-black text, ASCII block-drawing borders, and segment registers.
*   **Key Design Assets**:
    *   *ASCII-Art Visualizer*: Graphing output panels using ASCII characters (`|`, `-`, `#`) to visualize signals.
    *   *Brutalist Readouts*: Dry, technical data readouts that emphasize raw functional clarity.
*   **Relevance to Wavelength**: Excellent study on how to style low-level diagnostics, program inputs, and data flow visualizations using simple monospaced blocks without complex graphic sprites.

### 5. Quadrilateral Cowboy (Blendo Games)
*   **Visual Style**: Chunky retro-future 1980s hacking deck. Interactive CLI deck ("Deckette") used to script environmental interactions (cameras, doors, traps).
*   **Key Design Assets**:
    *   *Script Editor HUD*: Monospaced text input, line-by-line executing indicator, and blocky pastel vectors.
    *   *Interactive Manuals*: Physical, game-world documentation to lookup functions.
*   **Relevance to Wavelength**: Demonstrates how script writing and text commands can feel like mechanical, satisfying physical actions when supported by tactile sounds.

---

## 5. Visual Polish Implementation Guidelines

1.  **Additive Compositing for Neon**: Use Canvas `globalCompositeOperation = 'screen'` or CSS filters `filter: drop-shadow(0 0 4px color)` to ensure neon accents overlap with bright, high-contrast glow values.
2.  **Scanline Gradients**: Implement scanlines as a repeating background gradient on a top-level overlay element, utilizing `pointer-events: none` to keep interactive components clickable.
3.  **Horizontal Jitter**: Apply a randomized, sub-pixel CSS translation keyframe animation to the screen container to simulate analog CRT cathode-ray sync stability issues during intense jamming events.
4.  **Monospace Alignment**: Align all text columns using exact character counts (e.g. `20` characters wide) to ensure standard developer layouts are maintained across panels.
