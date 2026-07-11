<!-- Source: hackforge-audit | Version: v1 | Checkpoint: audit-complete | Dependencies: none -->
# Audit Report: Wavelength - Adaptive Hacking Terminal

## Summary
- **Files scanned:** 15
- **Issues:** 2 critical, 2 high, 2 medium, 2 low
- **Design compliance:** 92%
- **Test coverage:** Missing (no unit/integration tests configured)
- **Security issues:** 0 (clean static scan, no exposed keys, no innerHTML/eval use)

---

## Critical Issues

| # | File | Issue | Severity | Impact | Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | [MainScene.js](file:///c:/Users/tejas/Downloads/wavelength/src/scenes/MainScene.js) | Run-to-Run State Leak in Upgrades | **CRITICAL** | Upgrades bought in previous runs (e.g. flywheel brakes, widened aperture) persist into new games, making consecutive runs trivial. | Add a reset block under the `STATES.TITLE` transition in `MainScene.js` to reset `dialController.speed`, `dialController.friction`, `signalBand.width`, and `jammer.telemetryDampening`. |
| 2 | [MainScene.js](file:///c:/Users/tejas/Downloads/wavelength/src/scenes/MainScene.js) | Run-to-Run State Leak in Jammer Phase | **CRITICAL** | Jammer phase and confidence are not reset to default values on game restart, causing Phase 3 hazards to spawn immediately in round 1 of a new game. | Explicitly reset `jammer.phase = 1` and `jammer.confidence = 20` inside the `STATES.TITLE` transition block in `MainScene.js`. |

---

## High-Priority Issues

| # | File | Issue | Severity | Impact | Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 3 | [TerminalCLI.js](file:///c:/Users/tejas/Downloads/wavelength/src/modules/TerminalCLI.js) | CLI Focus Bypass in Menus | **HIGH** | Pressing `~` or `/` in menus (Title, GameOver, Victory) enables and focuses the CLI, allowing commands to run out-of-order. | Restrict the Phaser keyboard listeners for backtick/slash in `TerminalCLI.js` to only execute `focus()` when `scene.gameState === 'PLAYING'`. |
| 4 | [index.html](file:///c:/Users/tejas/Downloads/wavelength/index.html) | Fixed Shell Size (Non-responsive Layout) | **HIGH** | The `.terminal-shell` uses fixed dimensions (`800px` x `650px`) with body `overflow: hidden`, causing clipping and rendering the game unplayable on smaller/mobile viewports. | Add a responsive scale rule using CSS transforms or container queries to scale `.terminal-shell` down proportionally on smaller screens. |

---

## Medium-Priority Issues

| # | File | Issue | Severity | Impact | Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 5 | [MainScene.js](file:///c:/Users/tejas/Downloads/wavelength/src/scenes/MainScene.js) | Overclock / EMP State Overwrites | **MEDIUM** | If a round transitions to `ANALYSIS` while overclock or EMP is active, the Jammer overrides wave speeds, causing incorrect restorations when the timers expire. | Save the newly calculated speed in `savedBandSpeed` during round transitions if overclock or EMP is active. |
| 6 | [MainScene.js](file:///c:/Users/tejas/Downloads/wavelength/src/scenes/MainScene.js) | Typewriter Stuck State on Game End | **MEDIUM** | If a terminal typewriter is typing when the game ends, `isLoggingTypewriter` remains `true` forever, freezing console logs in all subsequent games. | Reset `isLoggingTypewriter = false` and empty the log queue in the `STATES.TITLE` transition block and when the typewriter timer is aborted. |

---

## Low-Priority & Code Quality Issues

| # | File | Issue | Severity | Impact | Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 7 | [AudioManager.js](file:///c:/Users/tejas/Downloads/wavelength/src/modules/AudioManager.js) | Unused parameter `insideBand` | **LOW** | Code cleanliness issue. Unused parameters degrade readability. | Remove `insideBand` parameter from `updateTuning()` function signature and references. |
| 8 | [.gitignore](file:///c:/Users/tejas/Downloads/wavelength/.gitignore) | Missing environment variable pattern | **LOW** | Security warning: local environment configurations (.env) could accidentally be committed. | Add `.env*` to the `.gitignore` patterns. |

---

## Design Drift & UX Upgrades

| Component | Target / Expected | Actual | Upgrade / Fix |
| :--- | :--- | :--- | :--- |
| **Audio Engine** | Skeuomorphic immersive chiptunes. | Music stays bright and unfiltered even in menu lists. | **Muffled Music in Menus:** Smoothly low-pass the bass sequencer to 220Hz when tuning is stopped (menus/upgrades), opening it back up when playing. |
| **Bouncing EQ** | Vector feedback matching chiptunes. | EQ is static Cyan regardless of threat phase. | **Phase-Dynamic EQ Colors:** Change EQ color to warning Orange in Phase 2, and warning Magenta/Red in Phase 3. |
| **Visual Styling** | Phosphor scanning grid. | Scanlines are always active. | **Scanlines Toggle CLI:** Add a command `/scanlines` to toggle scanning grid opacity, aiding accessibility for sensitive users. |

---

## Repair Prompts

### Fix 1: State Reset & Typewriter Fix in MainScene.js
> Fix run-to-run state leaks by resetting upgrades, jammer variables, and typewriter flags in `MainScene.js` transitions under `STATES.TITLE`:
```javascript
      // Reset upgraded parameters to defaults
      if (this.dialController) {
        this.dialController.speed = 40.0;
        this.dialController.friction = 0.82;
      }
      if (this.signalBand) {
        this.signalBand.width = 12.0;
      }
      if (this.jammer) {
        this.jammer.telemetryDampening = 1.0;
        this.jammer.phase = 1;
        this.jammer.confidence = 20;
      }
      this.isLoggingTypewriter = false;
      if (this.logQueue) this.logQueue = [];
```

### Fix 2: CLI Menu Focus Restriction in TerminalCLI.js
> Restrict CLI focus hooks to playing state inside `TerminalCLI.js`:
```javascript
    this.scene.input.keyboard.on('keydown-BACKTICK', (event) => {
      if (this.scene.gameState === 'PLAYING') {
        event.preventDefault();
        this.focus();
      }
    });
    this.scene.input.keyboard.on('keydown-SLASH', (event) => {
      if (this.scene.gameState === 'PLAYING') {
        event.preventDefault();
        this.focus();
      }
    });
```
