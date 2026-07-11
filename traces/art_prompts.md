# Trace Log — Art Prompts

---

## Procedural Synth Audio Design (Session 4)

Rather than loading external mp3/wav files (which can cause loading latency, pathing bugs, or CORS blockages on itch.io/Netlify), we implemented **procedural synth generation** via the native browser **Web Audio API**.

### 1. Dial Detuning Static (Continuous Ambient)
- **Concept:** Simulate radio tuning static that resolves into a clear carrier frequency when close to the target channel.
- **Node Setup:**
  - **White Noise Generator:** Generated an in-memory buffer filled with random values between -1 and +1. Passed through a Biquad Bandpass Filter (resonance `Q = 1.0`, base frequency `1000Hz`) to give it a hollow "terminal static" feel.
  - **Tuning Hum (Oscillator):** A pure sine wave oscillator detuning left and right around 440Hz ($A_4$).
- **Mix Logic:**
  - When distance $d \ge 25$: Static is set to full volume (`gain = 0.18`), Tuning Hum is muted.
  - When distance $d < 25$: Proximity scales linearly. Static volume drops towards `0.02` (gentle background hiss), while the clear hum oscillator fades up to `0.15` and shifts frequency to $440 + (\text{dial} - \text{band}) \times 6$ Hz.

### 2. Lock Beep (SFX)
- **Concept:** Upward-sliding clear chime beep confirming synchronization.
- **Oscillator Type:** `triangle` (warm tone).
- **Pitch Sweep:** Instantly sets pitch at $523.25\text{Hz}$ ($C_5$), shifts to $659.25\text{Hz}$ ($E_5$) at 0.08s, and then to $783.99\text{Hz}$ ($G_5$) at 0.16s, decaying volume exponentially over 0.35 seconds.

### 3. Miss / Timeout Buzz (SFX)
- **Concept:** Descending buzz representing terminal malfunction.
- **Oscillator Type:** `sawtooth` (aggressive, raspy).
- **Pitch Sweep:** Slides frequency from $180\text{Hz}$ down to $60\text{Hz}$ linearly over 0.25 seconds, decaying gain node exponentially to 0.0.

---

## Procedural Visual Assets (Session 4)

We opted for terminal-like vectors using **Phaser 4 Render Graphics** to guarantee fluid 60fps renders and absolute pixel scalability on mobile/desktop.

### 1. CRT Matrix Coordinate Grid
- Background renders a grid of crossing vertical and horizontal lines every 40px with a low-opacity cyan tint (`0x00ffff`, `0.04` alpha).

### 2. Dynamic Wave Interference Track
- Replaced the solid bar with a series of connected line segments drawing:
  $$y = \text{trackY} + \sin(x \times 0.05 - \phi) \times 16.0 \times \text{dampening}$$
- Dampening uses a power curve of the distance from the point to the target center: $\text{dampening} = \text{Clamp}((\frac{d}{14.0})^2, 0.0, 1.0)$. This causes the green/teal track wave to flatten out completely exactly where the target band sits, visualizing signal resolution.

