import Phaser from 'phaser';

/**
 * Jammer
 * 
 * Local rule-based AI opponent. Tracks player telemetry (drift bias and adjusting speed)
 * over a rolling history. Computes countering signal band movement parameters
 * and renders a scanning sweep "reading you..." tell overlay between rounds.
 */
export class Jammer {
  /**
   * @param {Phaser.Scene} scene The parent Phaser scene
   * @param {number} trackY The y coordinate of the tuning track
   */
  constructor(scene, trackY = 250) {
    this.scene = scene;
    this.trackY = trackY;

    // Rolling history of attempts (max length N = 3)
    this.history = [];
    this.maxHistoryLength = 3;

    // Analysis/Tell state
    this.isAnalyzing = false;
    this.analysisTimer = 0.0;
    this.analysisDuration = 1.5; // seconds for the "reading you..." pause

    // Scanning sweep line coordinates
    this.scanY = 0;
    this.scanStartY = trackY - 50;  // 200
    this.scanEndY = trackY + 210;    // 460 (covers dial knob too)

    // Jammer UI Elements
    this.graphics = this.scene.add.graphics();
    
    // Main status text
    this.statusText = this.scene.add.text(400, 80, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ff3366',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5).setVisible(false);

    // Live data readout
    this.readoutText = this.scene.add.text(400, 110, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ff88aa',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5).setVisible(false);

    // Initial default parameters
    this.currentParams = {
      baselineCenter: 50.0,
      speed: 1.5,
      amplitude: 20.0
    };
  }

  /**
   * Record a player attempt telemetry
   * @param {number} bias Mean(dialValue - bandCenter) during the round
   * @param {number} speed Mean(|dialValue_t - dialValue_t-1| / dt) during the round
   */
  recordAttempt(bias, speed) {
    this.history.push({ bias, speed });
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }

  /**
   * Run the Jammer AI rules to compute the next round parameters
   * 
   * Rule in one sentence:
   * "The Jammer shifts the target's movement range to the opposite side of the player's tuning bias,
   * and increases oscillation speed if the player is adjusting too rapidly."
   */
  calculateNextParams() {
    if (this.history.length === 0) {
      return this.currentParams;
    }

    // 1. Calculate average telemetry metrics
    let sumBias = 0;
    let sumSpeed = 0;
    this.history.forEach(attempt => {
      sumBias += attempt.bias;
      sumSpeed += attempt.speed;
    });

    const avgBias = sumBias / this.history.length;
    const avgSpeed = sumSpeed / this.history.length;

    // 2. Apply rule formulas
    // Bias: shift center to counter drift. (If player drifts right, shift baseline left)
    // Clamp baselineCenter between 25 and 75 so the band doesn't run off the screen edges
    const baselineCenter = Phaser.Math.Clamp(50.0 - avgBias * 0.85, 25, 75);

    // Speed: speed is proportional to player speed. (If player tunes fast, oscillate faster)
    // Map average input speed to frequency. Normal keyboard adjustment speed is 40.
    const speed = Phaser.Math.Clamp(1.0 + (avgSpeed / 12.0), 0.8, 3.8);

    // Amplitude: increase size/swings slightly with high speed to disrupt player targeting
    const amplitude = Phaser.Math.Clamp(12.0 + (avgSpeed * 0.2), 10.0, 30.0);

    this.currentParams = { baselineCenter, speed, amplitude, avgBias, avgSpeed };
    return this.currentParams;
  }

  /**
   * Triggers the visual "reading you..." analysis scanning sequence
   * @param {function} onComplete Called when analysis ends
   */
  startAnalysis(onComplete) {
    this.isAnalyzing = true;
    this.analysisTimer = 0.0;
    this.scanY = this.scanStartY;

    // Calculate next params so we have the telemetry readouts ready
    const params = this.calculateNextParams();

    // Prepare text readouts
    const driftStr = params.avgBias > 5 ? 'DRIFT RIGHT' : (params.avgBias < -5 ? 'DRIFT LEFT' : 'BALANCED');
    const speedStr = params.avgSpeed > 25 ? 'AGGRESSIVE' : (params.avgSpeed < 10 ? 'CAUTIOUS' : 'STEADY');
    
    this.statusText.setText('⚡ [!] JAMMER ANALYSIS: INTERCEPTING PLAYER PATTERNS...');
    this.readoutText.setText(`DRIFT: ${driftStr} (${params.avgBias.toFixed(1)}) | SPEED: ${speedStr} (${params.avgSpeed.toFixed(1)})\nADAPTING FREQUENCY BIAS TO ${(100 - params.baselineCenter).toFixed(0)}%`);

    this.statusText.setVisible(true);
    this.readoutText.setVisible(true);

    this.onAnalysisComplete = onComplete;
  }

  /**
   * Updates scanning animation
   * @param {number} delta time step in milliseconds
   */
  update(delta) {
    if (!this.isAnalyzing) return;

    const dt = delta / 1000;
    this.analysisTimer += dt;

    // Sweep scan line down the track and dial area
    const progress = this.analysisTimer / this.analysisDuration;
    this.scanY = this.scanStartY + progress * (this.scanEndY - this.scanStartY);

    // Flash status texts
    const flashFreq = 4; // Hz
    const visible = Math.floor(this.analysisTimer * flashFreq * 2) % 2 === 0;
    this.statusText.setColor(visible ? '#ff3366' : '#ffffff');

    this.render();

    if (this.analysisTimer >= this.analysisDuration) {
      this.isAnalyzing = false;
      this.statusText.setVisible(false);
      this.readoutText.setVisible(false);
      this.graphics.clear();
      if (this.onAnalysisComplete) {
        this.onAnalysisComplete(this.currentParams);
      }
    }
  }

  render() {
    this.graphics.clear();

    if (!this.isAnalyzing) return;

    // Draw horizontal scanning line with a vertical glow
    const lineXStart = 100;
    const lineXEnd = 700;

    // Sweep line fill
    this.graphics.fillStyle(0xff1144, 0.15);
    this.graphics.fillRect(lineXStart, this.trackY - 50, 600, this.scanY - (this.trackY - 50));

    // Core scanner beam
    this.graphics.lineStyle(4, 0xff3366, 0.9);
    this.graphics.lineBetween(lineXStart, this.scanY, lineXEnd, this.scanY);

    // Scan line indicator glow
    this.graphics.fillStyle(0xff3366, 0.4);
    this.graphics.fillRect(lineXStart, this.scanY - 4, 600, 8);
  }

  setVisible(visible) {
    if (!visible) {
      this.statusText.setVisible(false);
      this.readoutText.setVisible(false);
      this.graphics.setVisible(false);
      this.isAnalyzing = false;
    } else {
      this.graphics.setVisible(true);
    }
  }

  destroy() {
    this.graphics.destroy();
    this.statusText.destroy();
    this.readoutText.destroy();
  }
}
