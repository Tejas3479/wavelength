# Wavelength — Master Context Block

> This file is the persistent project context. Every future session reads it first.
> Last updated: 2026-07-11T17:48:40+05:30 (Session 1 — Foundation)

---

## 1. Project Identity

**Name:** Wavelength
**Event:** Parsewave Game Jam 2026
**Developer:** Solo
**Build window:** One 24-hour window, browser-only, no backend, no login
**Deployment target:** itch.io (primary), Netlify/Vercel (secondary)

---

## 2. Judging Criteria

Judged on four things:

1. **Finished game quality** — does it feel complete and polished?
2. **Technical execution** — is the code clean, the architecture sound?
3. **Genuine AI-assisted workflow** — real collaboration across planning/building/debugging/improving, not one miracle prompt. Judges cross-reference the deployed game, the repo/commit history, the README, and a separate trace log against each other.
4. **Original design and engineering inside the 24-hour window** — how much actually happened during the jam?

All four artifacts (game, repo, README, traces) must tell one honest, consistent story.

---

## 3. Game Concept

A single-screen, single-mechanic reflex/precision arcade game. The player controls a tuning dial. A target signal band moves along a track; the player adjusts the dial to lock the signal into the band before a timer runs out, scoring on each lock.

**The Jammer:** A small local AI system that watches the player's last several attempts — how fast they correct, which direction they tend to drift — and shifts its interference pattern to counter whatever has been working. This adaptation must be visibly legible during play via a small "reading you..." tell.

**Why this concept:** No backend, no API keys, no live model call — the Jammer is local, rule-based logic, not a chatbot. Removes an entire class of judging-day failure. A legible, systemic adaptive opponent is the differentiator from dialogue-only AI features.

---

## 4. Tech Stack (Locked)

- **Engine:** Phaser 4 ("Caladan" v4.0.0 / "Salusa" v4.1.0)
- **Language:** Vanilla JavaScript (ES modules)
- **Bundler:** Vite
- **Build:** Single-page browser build
- **Constraints:** No SharedArrayBuffer, no multi-threaded WASM, no build-step dependency beyond Vite + Phaser

---

## 5. Scope (Locked)

### MVP (build first, in this order)
1. One screen
2. Dial control via keyboard and mouse/touch
3. One moving target band
4. Lock/miss detection
5. Timer
6. Score
7. The Jammer's one adaptive rule
8. The "reading you..." tell
9. Win/lose state
10. Sound + screen feedback on lock/miss
11. Title screen
12. Game-over screen

### Stretch (only after MVP is fully playable, in this exact order)
1. A second band type requiring a different correction strategy
2. A short difficulty-tier progression
3. An on-screen readout of what the Jammer just "learned"

### Explicitly Out of Scope (do not build even with spare time)
- Settings menu
- Accounts
- Leaderboards
- Any backend
- Any live LLM call
- Multi-level content

---

## 6. Process Rules

- **Commit frequently** in small, honest, descriptively-labeled increments spread across the real build window — never one large end-of-window commit.
- **Re-export a real working browser build after every session**, not just at the end.
- **Keep the Jammer's rule simple and inspectable** — it must be explainable in one plain sentence in the README.
- **When a real bug or design problem comes up**, keep the actual error/symptom and the reasoning that led to the fix as part of the record — it's a deliverable, not just a means to an end.
- **Treat any AI-generated art or audio as a first draft** requiring a human curation pass, never final output.

---

## 7. Session Plan

| Session | Focus | Key Deliverable |
|---------|-------|-----------------|
| 1 | Foundation | Blank booting build, context file |
| 2 | Core loop | Dial/band/lock/score/timer, no art, no AI layer |
| 3 | Adaptive Jammer | AI-in-gameplay feature and legibility tell |
| 4 | Polish and feel | Sound, feedback, title/game-over screens, final art |
| 5 | Deployment | Real live URL on itch.io |
| 6 | README/traces/disclosures | The evidence package |
| 7 | Final audit | Consistency check across all artifacts |

---

## 8. Backup Plan

**Trigger:** If Session 3's playtesting shows the Jammer's adaptation is genuinely unnoticeable or unconvincing even after tuning.

**Pivot:** "Echoes of the Void" (blind echolocation navigation) — last resort only, and only with an explicit README disclosure of that mechanic's existing shipped precedent plus a real, non-cosmetic twist.

**Do not pivot for any other reason.**
