<!-- Source: hackforge-analyze | Confidence: STRONG | Version: v1 | Checkpoint: research-tech -->
# Research Findings: Tech Stack Recommendations (2026-07-11)

This document evaluates the most suitable technologies for web game development under a Phaser 4 engine, incorporating audio synthesis, retro-futuristic aesthetics, and local adaptive behaviors.

---

## 1. Summary Comparison Table

| Category | Recommended Tool | Version | Confidence | Alternative | Version |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Web Game Engine** | **Phaser** | v4.2.1 | **[STRONG]** | PixiJS | v8.19.0 |
| **Audio Synthesis** | **Tone.js** | v15.5.26 | **[STRONG]** | Elementary Audio | v4.0.1 (Core) |
| **Retro Rendering/FX** | **Phaser 4 Filter System** | Built-in | **[STRONG]** | Custom WebGL Shaders | N/A |
| **Retro UI Overlay** | **Cybercore CSS** | v0.3.0 | **[MEDIUM]** | NES.css | v2.3.0 |
| **Local Game AI** | **Yuka.js** | v0.7.8 | **[STRONG]** | Behavior3JS | v0.1.0 |
| **Local Machine Learning**| **Brain.js** | v2.0.0-beta.24 | **[MEDIUM]** | TensorFlow.js | v4.22.0 |

---

## 2. Detailed Recommendations

### A. Web Game Development
*   **Recommended Technology:** **Phaser 4**
*   **Current Stable Version:** `v4.2.1` ("Giedi", released July 9, 2026)
*   **Why it fits:** Phaser 4 is the largest release in the framework's history, featuring a ground-up rebuild of the WebGL rendering system with a node-based architecture ("Beam" renderer). It introduces powerful performance optimizations like `SpriteGPULayer` and `TilemapGPULayer` (up to 100x faster), native WebGL context restoration, and a unified filter system. This is the optimal core framework for complex, high-performance 2D arcade games on the web.
*   **Alternative:** **PixiJS (v8.19.0)**. PixiJS is a superb 2D rendering engine but lacks game-specific built-ins like physics, tilemap parsers, and sound managers, requiring more custom scaffolding.
*   **Confidence Tag:** **[STRONG]**
*   **Source URL:** [Phaser GitHub](https://github.com/photonstorm/phaser) / [Phaser Official Website](https://phaser.io)

### B. Audio Synthesis (Web Audio API)
*   **Recommended Technology:** **Tone.js**
*   **Current Stable Version:** `v15.5.26`
*   **Why it fits:** Tone.js is the premier library for interactive music and sound design in the browser. It abstracts Web Audio API's complex routing into intuitive components: synths (FM, AM, Polyphonic), sampler instruments, effects (chorus, pitch-shift, bitcrushers, delay), and a global scheduler ("Transport") that handles millisecond-precise timing for musical synchronization. It is ideal for retro procedural chiptune synth sounds and dynamic game state music.
*   **Alternative:** **Elementary Audio (`@elemaudio/core` v4.0.1)**. A functional, declarative node-graph audio framework that is extremely fast for real-time DSP, but has a steep learning curve and lacks the high-level synth abstractions provided by Tone.js.
*   **Confidence Tag:** **[STRONG]**
*   **Source URL:** [Tone.js GitHub](https://github.com/Tonejs/Tone.js)

### C. Retro-Futuristic Arcade Aesthetics (Rendering & Shaders)
*   **Recommended Technology:** **Phaser 4 Built-in Filter System (Beam Renderer)**
*   **Current Stable Version:** Built-in with Phaser `v4.2.1`
*   **Why it fits:** Phaser 4 replaced its split preFX/postFX pipeline with a unified Filter system. Out of the box, it contains high-performance shaders tailored for retro-arcade gaming, including:
    *   **CRT Filter:** Simulation of raster scanlines, phosphor glow, and screen curvature.
    *   **Glow:** Perfect for neon borders, lasers, and gridlines.
    *   **Vignette & Pixelate:** Vintage resolution downscaling and darkened edges.
    *   **Barrel/Fish-Eye Distortion:** Screen bending replicating convex CRT glass.
    These run on the high-performance GPU layers without additional dependency.
*   **Alternative:** Custom GLSL shaders written manually and compiled via WebGL.
*   **Confidence Tag:** **[STRONG]**
*   **Source URL:** [Phaser 4 Shader Guide](https://phaser.io/tutorials/phaser-4-shader-guide)

### D. Retro-Futuristic Arcade Aesthetics (Overlay UI CSS)
*   **Recommended Technology:** **Cybercore CSS**
*   **Current Stable Version:** `v0.3.0`
*   **Why it fits:** While the main game canvas is rendered in WebGL, overlays, menus, settings, and HUD modules are best implemented using standard HTML/CSS. Cybercore CSS is a specialized styling framework that provides a dark-themed cyberpunk/retro-futuristic look: neon-border boxes, animated digital glitch effects, scanlines, high-contrast cyan/magenta color palettes, and retro SVG icons.
*   **Alternative:** **NES.css (v2.3.0)** (Provides an excellent 8-bit aesthetic but is too Nintendo-centric/low-res for retro-futuristic cyberpunk settings) or **98.css (v0.1.1)** (Windows 98 aesthetic).
*   **Confidence Tag:** **[MEDIUM]**
*   **Source URL:** [Cybercore CSS GitHub](https://github.com/sebyx07/cybercore-css)

### E. Local Adaptive Algorithms (Deterministic Game AI)
*   **Recommended Technology:** **Yuka.js**
*   **Current Stable Version:** `v0.7.8`
*   **Why it fits:** Yuka is an engine-agnostic game AI library written in JS. It provides highly reliable, local, deterministic rule-based algorithms for game entities. Features include steering behaviors (seek, flee, arrive, wander, obstacle avoidance), Finite State Machines (FSMs), pathfinding with NavMesh support, and a target memory/perception system. Ideal for setting up retro-arcade enemy behavior patterns and path navigation.
*   **Alternative:** **Behavior3JS (v0.1.0)** (Behavior trees library, but hasn't seen updates in several years).
*   **Confidence Tag:** **[STRONG]**
*   **Source URL:** [Yuka.js GitHub](https://github.com/Mugen87/yuka)

### F. Local Adaptive Algorithms (Dynamic Difficulty / Machine Learning)
*   **Recommended Technology:** **Brain.js**
*   **Current Stable Version:** `v2.0.0-beta.24` (or stable `v1.4.0`)
*   **Why it fits:** If you want non-deterministic adaptive algorithms that learn player habits (e.g. adapting enemy patterns, dynamic difficulty adjustment based on player accuracy), Brain.js offers lightweight, fast neural network architectures that can be trained directly in the browser. It supports feedforward networks and Recurrent Neural Networks (LSTM) with a simplified API that does not require massive array manipulation or mathematical pipelines.
*   **Alternative:** **TensorFlow.js (`@tensorflow/tfjs` v4.22.0)**. Highly optimized and supports GPU acceleration, but brings significant overhead and bundle size, which is generally overkill for local arcade adaptation.
*   **Confidence Tag:** **[MEDIUM]**
*   **Source URL:** [Brain.js GitHub](https://github.com/BrainJS/brain.js)
