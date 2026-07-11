<!-- Source: hackforge-design | Confidence: STRONG | Version: v1 | Checkpoint: design-complete | Dependencies: analyze-complete -->
# Design System: Wavelength Hacking Terminal

A comprehensive visual, interactive, and structural guide for styling and layout implementation in *Wavelength*.

---

## 1. Design Philosophy
A skeuomorphic, high-fidelity retro terminal. Interaction should feel physical and tactile, blending Cassette Futurism monitor anomalies with precise mechanical controls. Sound, visuals, and inputs form a unified cybernetic feedback loop.

---

## 2. Visual References
- **Hacknet**: Dark panes, green terminal outputs, and bright red threat timers.
- **Duskers**: Gritty monochrome CRT monitors and command-line code execution.
- **TIS-100**: Brutalist developer diagnostics and monospaced layout blocks.

---

## 3. Color Palette
All layout borders, texts, and canvas components must strictly use these CSS variable tokens:

```css
:root {
  /* Fills & Backgrounds */
  --color-bg-primary: #0d0f12;    /* Deep carbon black for screen background */
  --color-bg-secondary: #0a0c10;  /* Navy shadow for window panels */
  --color-bg-elevated: #161a22;   /* Bright panel background for cards and overlays */

  /* Typography Colors */
  --color-text-primary: #f0f4f8;  /* Crisp light blue-gray for general text */
  --color-text-secondary: #8f9aa6;/* Desaturated gray for descriptions and labels */
  --color-text-muted: #536271;     /* Dark gray for gridmarks and timestamps */

  /* Accent Neon Themes */
  --color-accent-primary: #00f0ff;/* Neon Cyan for interface controls, menus, and CLI commands */
  --color-accent-secondary:#ff007f;/* Neon Magenta for warning panels, timers, and Jammer waves */
  
  /* Semantic Status Indicators */
  --color-success: #39ff14;       /* Neon Green for successful signal locking and connections */
  --color-warning: #ffaa00;       /* Neon Orange for near-misses and parameter overrides */
  --color-error: #ff3366;         /* Bright Red for lock strikes and hardware failure */
  --color-info: #0088ff;          /* Electric Blue for firmware diagnostics */
}
```

---

## 4. Typography
- **Primary Display Font**: `'Orbitron', 'Courier New', monospace;`
- **Tuning Data & Console Font**: `'Space Mono', 'JetBrains Mono', 'Courier New', monospace;`

### Sizes and Weights:
- **Display (Game Title, Phase Alerts)**: `48px` / Bold (`700`) / Orbitron
- **H1 (Screen Headers, Round Overlays)**: `32px` / Semi-Bold (`600`) / Orbitron
- **H2 (Card Headers, Stat Titles)**: `20px` / Semi-Bold (`600`) / Orbitron
- **Body Text (HUD Stats, CLI Output)**: `14px` / Regular (`400`) / Space Mono
- **Data Readout (Numbers, Coordinates)**: `12px` / Regular (`400`) / Space Mono

---

## 5. Spacing Scale
A `4px` grid system forms the foundation of all layout margins and paddings:
- **xs**: `4px`
- **sm**: `8px`
- **md**: `12px`
- **lg**: `16px`
- **xl**: `24px`
- **xxl**: `32px`
- **layout-inner**: `48px`
- **layout-outer**: `64px`

---

## 6. Border Radius
- **sm**: `2px` (Brutalist panel corners)
- **md**: `4px` (CLI boxes, Upgrade Cards)
- **lg**: `8px` (Main terminal container)
- **full**: `9999px` (Dial knobs and warning light icons)

---

## 7. Component Patterns

### Interactive Console CLI:
- **Position**: Pinned to the bottom.
- **Height**: `40px`
- **Padding**: `8px 16px`
- **Border**: `1px solid var(--color-accent-primary)`
- **Background**: `var(--color-bg-secondary)`
- **Focus Ring**: `box-shadow: 0 0 10px var(--color-accent-primary)`

### Upgrade Cards:
- **Width**: `180px`
- **Height**: `240px`
- **Padding**: `16px`
- **Border**: `1px solid var(--color-text-muted)`
- **Hover Action**: Scale up (`1.05x`) + border shift to `var(--color-accent-primary)`.

### Menu Buttons:
- **Height**: `36px`
- **Padding**: `8px 24px`
- **Border**: `1px solid var(--color-accent-primary)`
- **Text Color**: `var(--color-accent-primary)`
- **Hover State**: Background swaps to `var(--color-accent-primary)` and text color to `var(--color-bg-primary)`.

---

## 8. Animation Rules
- **Micro Interactions (CLI, Buttons)**: `100ms ease-out` (Transitions hover states instantly).
- **Menu Panel Transitions**: `250ms cubic-bezier(0.16, 1, 0.3, 1)` (Slide-out panels smoothly).
- **Glitch Trigger (On strike / sweep)**: `150ms step-end` (Un-interpolated flashing hold).
- **Maximum Concurrent Animations**: `2` (Prevents overlay visual noise from blocking reading metrics).

---

## 9. Anti-Patterns (NEVER DO)
1.  **NEVER** use soft gradients on terminal boxes — keep all borders flat and high contrast.
2.  **NEVER** use rounded fonts like Arial or Comic Sans. Monospace or Orbitron must be used.
3.  **NEVER** allow the CLI keyboard input to leak into Phaser scene movement listeners.
4.  **NEVER** auto-play background generative synth pad before user clicks start.
5.  **NEVER** render raw browser dialogue popups (`alert()` or `confirm()`) — use terminal console lines.
6.  **NEVER** use standard colors (like raw red or dark blue) — use designated CSS variables.
7.  **NEVER** use image files for icons or cards — render them programmatically using Phaser's vector drawing or styled CSS blocks.

---

## 10. Accessibility Rules
- **Font Legibility**: High contrast (`7:1` minimum ratio for active details).
- **Reduced Motion Support**: Skip CSS CRT screen flickers and scanline holds if `@media (prefers-reduced-motion)` is active.
- **Keyboard Traps**: Ensure pressing `Escape` or `Enter` reliably closes the CLI console and restores dial control focus.
- **Interactive Targets**: Mouse targets must be at least `44x44px` (particularly dial knobs and menu buttons).

---

## 11. Content State Rules
- **Booting State**: Display a scrolling mock kernel log (e.g. `LOADING CORE SYNTH... CONFIRMING SECURITY SECTORS...`) before showing the Title screen.
- **Overdrive State**: When the Jammer reaches Phase 3, trigger a soft red CRT pulse vignette to notify the player of high threat.
- **Lock Feedback State**: Flashes green for Clean Lock, orange for Standard Lock, and glitched gray/red for strike miss.

---

## 12. Data Visualization Rules
- **Signal Track Wave**: Render a glowing sine/square/sawtooth path. The wave thickness decreases and changes color from green to cyan as the dial alignment error gets closer to zero.
- **Interactive Equalizer**: Render 16 vertical spectrum columns along the console border that bounce dynamically in sync with the Web Audio step sequencer chords.
