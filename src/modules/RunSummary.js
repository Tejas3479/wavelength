/**
 * RunSummary
 * 
 * Analyzes terminal statistics at the end of a run and generates
 * a data-driven narrative flavor classification string to display on the game-over/victory screen.
 */
export class RunSummary {
  /**
   * Generates a narrative classification based on final statistics
   * @param {object} stats Terminal statistics
   * @param {number} stats.score Score achieved (number of locks)
   * @param {number} stats.cleanLocks Clean (perfect) locks
   * @param {number} stats.standardLocks Standard locks
   * @param {number} stats.nearMisses Near-misses triggers
   * @param {number} stats.totalMisses Miss triggers
   * @param {number} stats.timeouts Countdown timeouts
   * @param {number} stats.avgSpeed Average dial adjustment speed across the run
   * @param {boolean} stats.victory Whether the terminal won the game
   * @returns {string}
   */
  static generate(stats) {
    const totalAttempts = stats.cleanLocks + stats.standardLocks + stats.nearMisses + stats.totalMisses + stats.timeouts;
    const totalLocks = stats.cleanLocks + stats.standardLocks;
    
    // Safety check for empty or short games
    if (totalLocks === 0) {
      return "CLASSIFICATION: SIGNAL DEADBAND\nNo locks achieved. The Jammer easily blanked your frequency.";
    }

    const cleanRatio = stats.cleanLocks / totalLocks;

    // 1. Victory summaries
    if (stats.victory) {
      if (cleanRatio >= 0.6) {
        return "CLASSIFICATION: SPECTRAL SPECTER\nFlawless precision. You out-tuned the Jammer with surgical, micro-dial adjustments before it could adapt.";
      }
      if (stats.nearMisses >= 3) {
        return "CLASSIFICATION: GLITCH MASTER\nYou survived on raw reflexes, constantly slipping out of the Jammer's lockdown via split-second near-miss grace extensions.";
      }
      if (stats.avgSpeed >= 20) {
        return "CLASSIFICATION: NOISE FLOODER\nFrantic tuning velocity saturated the Jammer's buffer, bypassing the lock filters through brute speed.";
      }
      return "CLASSIFICATION: FREQUENCY VANGUARD\nSteady, deliberate tuning successfully established terminal connection against escalating phases.";
    }

    // 2. Failure summaries
    if (cleanRatio >= 0.5) {
      return "CLASSIFICATION: HIGH-FIDELITY CASUALTY\nHigh accuracy tuning, but sudden Jammer phase escalation caught you off guard at the finish line.";
    }
    if (stats.nearMisses >= 4) {
      return "CLASSIFICATION: GLITCH ACCUMULATOR\nYou rode the boundary of the signal band, eventually succumbing to cumulative static bleed.";
    }
    if (stats.timeouts >= 2) {
      return "CLASSIFICATION: COGNITIVE LOCKOUT\nHesitancy detected. You waited too long to lock, allowing the Jammer to freeze out your signals.";
    }
    if (stats.avgSpeed >= 22) {
      return "CLASSIFICATION: JITTER OPERATOR\nWild dial adjustments. The Jammer predicted your drift habits and forced the band away from your frantic pointer.";
    }

    return "CLASSIFICATION: SPECTRUM DECAY\nStandard operator profiles. The Jammer logged your drift patterns and shut down the connection.";
  }
}
