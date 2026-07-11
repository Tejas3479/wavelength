# Trace Log — Level / Balance Tuning

---

## Jammer AI Parameter Setup (Session 3)

The local Jammer AI adjusts the target band's movement formula after each round based on the player's performance:
- **Baseline Center (`baselineCenter`):** Shifts opposite to the player's average drift bias:
  $$baselineCenter = \text{Clamp}(50 - \text{averageBias} \times 0.85, 25, 75)$$
  If the player tends to tune too high (right), the next target band baseline is shifted left.
- **Oscillation Frequency (`speed`):** Increases proportional to the player's tuning velocity:
  $$speed = \text{Clamp}(1.0 + \frac{\text{averageSpeed}}{12.0}, 0.8, 3.8)$$
  If the player moves the dial frantically, the target band oscillates much faster.
- **Oscillation Amplitude (`amplitude`):** Increases slightly with high input speed to widen the swings:
  $$amplitude = \text{Clamp}(12.0 + \text{averageSpeed} \times 0.2, 10.0, 30.0)$$

---

## Wrong Turn & Legibility Tuning (2026-07-11)

### Symptom / Problem
Initially, the Jammer's adaptation was computed instantly and applied directly between rounds. Playtesting revealed two key issues:
1. **Invisibility:** The player had no idea why the band was suddenly moving faster or shifted. It felt like standard random difficulty scaling rather than an adaptive opponent reading their inputs.
2. **Clipping:** A raw linear offset formula ($baselineCenter = 50 - \text{averageBias}$) caused the target band center to push past 90 or below 10 when the player performed extreme overshoots, clipping the band visually off the track bounds.

### Reasoning & Fix
To solve the legibility and stability issues, we made the following changes:
- **The "Reading You..." Scan Tell:** Introduced a 1.5-second gameplay freeze state (`ANALYSIS`) between rounds. A red horizontal scanning laser sweeps down the track, and flashing text outputs the player's metrics: e.g., `DRIFT: RIGHT (+12.4) | SPEED: HIGH (28.3)`. This explicitly teaches the player that their input is being evaluated.
- **Clamping and scaling:** Scaled the bias multiplier to $0.85$ and strictly clamped $baselineCenter$ to $[25, 75]$ and amplitude to $[10, 30]$. This ensures the band always stays safely within the visible 800px track width.

