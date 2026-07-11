import Phaser from 'phaser';

/**
 * Jammer
 * 
 * Local rule-based AI opponent. Tracks player telemetry (drift bias and adjusting speed)
 * over a rolling history. Computes countering signal band movement parameters, escalates
 * difficulty across 3 distinct phases based on score, and renders a scanning sweep overlay.
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
    this.telemetryDampening = 1.0; // modified by spectral decoy upgrade

    // AI Cognitive State
    this.phase = 1;
    this.confidence = 20; // Confidence percent (20% to 99%)

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
    this.statusText = this.scene.add.text(400, 75, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ff3366',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5).setVisible(false);

    // Live data readout
    this.readoutText = this.scene.add.text(400, 115, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ff88aa',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5).setVisible(false);

    // Initial default parameters
    this.currentParams = {
      baselineCenter: 50.0,
      speed: 1.5,
      amplitude: 20.0,
      waveShape: 'SINE'
    };
  }

  /**
   * Record a player attempt telemetry
   * @param {number} bias Mean(dialValue - bandCenter) during the round
   * @param {number} speed Mean(|dialValue_t - dialValue_t-1| / dt) during the round
   * @param {number} overshoots Number of times player crossed signal band without locking
   * @param {number} delay Time elapsed before locking occurred
   */
  recordAttempt(bias, speed, overshoots = 0, delay = 0) {
    const damp = this.telemetryDampening || 1.0;
    this.history.push({
      bias: bias * damp,
      speed: speed * damp,
      overshoots: Math.round(overshoots * damp),
      delay: delay * damp
    });
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }

  /**
   * Retrieves player playstyle behavior profile signature
   * @returns {string} One of OBSERVER, JITTERER, SNIPER, PANICKED, STANDARD
   */
  getProfileName() {
    if (this.history.length === 0) return 'OBSERVER';

    let avgSpeed = 0;
    let avgOvershoots = 0;
    this.history.forEach(h => {
      avgSpeed += h.speed;
      avgOvershoots += (h.overshoots || 0);
    });
    avgSpeed /= this.history.length;
    avgOvershoots /= this.history.length;

    if (avgSpeed > 22.0 && avgOvershoots >= 1.5) {
      return 'JITTERER';
    } else if (avgSpeed < 14.0 && avgOvershoots <= 0.8) {
      return 'SNIPER';
    } else if (avgSpeed > 16.0) {
      return 'PANICKED';
    }
    return 'STANDARD';
  }

  /**
   * Run the Jammer AI rules to compute the next round parameters
   * 
   * @param {number} playerScore Current player locks score
   */
  calculateNextParams(playerScore = 0) {
    // 1. Determine active Jammer Phase
    if (playerScore < 3) {
      this.phase = 1; // Observe
    } else if (playerScore < 7) {
      this.phase = 2; // Engage
    } else {
      this.phase = 3; // Cognitive Overdrive
    }

    // Determine cognitive confidence
    this.confidence = Math.min(99, 20 + playerScore * 8);

    const profile = this.getProfileName();
    let waveShape = 'SINE';
    if (profile === 'JITTERER') {
      waveShape = 'JITTER';
    } else if (profile === 'SNIPER') {
      waveShape = 'SAWTOOTH';
    } else if (profile === 'PANICKED') {
      waveShape = 'SQUARE';
    }

    if (this.history.length === 0) {
      this.currentParams = {
        baselineCenter: 50.0,
        speed: this.phase === 1 ? 1.4 : (this.phase === 2 ? 2.0 : 2.8),
        amplitude: this.phase === 1 ? 15.0 : (this.phase === 2 ? 22.0 : 28.0),
        waveShape
      };
      return this.currentParams;
    }

    // 2. Calculate average telemetry metrics from history
    let sumBias = 0;
    let sumSpeed = 0;
    this.history.forEach(attempt => {
      sumBias += attempt.bias;
      sumSpeed += attempt.speed;
    });

    const avgBias = sumBias / this.history.length;
    const avgSpeed = sumSpeed / this.history.length;

    // 3. Apply phase-scaled AI rules
    // Higher phases make bias adjustments more aggressive
    const biasScaling = 0.5 + this.phase * 0.18; // phase 1 = 0.68, phase 2 = 0.86, phase 3 = 1.04
    const baselineCenter = Phaser.Math.Clamp(50.0 - avgBias * biasScaling, 20, 80);

    // Higher phases have higher base oscillation speeds
    let baseSpeed = this.phase === 1 ? 1.0 : (this.phase === 2 ? 1.8 : 2.5);
    let speedLimit = this.phase === 1 ? 2.5 : (this.phase === 2 ? 3.5 : 4.5);

    if (profile === 'JITTERER') {
      baseSpeed += 0.5; // speed up wave oscillation to force accuracy issues
      speedLimit += 0.8;
    } else if (profile === 'PANICKED') {
      baseSpeed += 0.3;
      speedLimit += 0.5;
    }

    const speedScale = 14.0 - this.phase * 1.5; // phase 1 = 12.5, phase 2 = 11.0, phase 3 = 9.5
    const speed = Phaser.Math.Clamp(baseSpeed + (avgSpeed / speedScale), 0.8, speedLimit);

    // Amplitude adjustments
    let baseAmp = this.phase === 1 ? 14.0 : (this.phase === 2 ? 20.0 : 25.0);
    let maxAmp = 32.0;

    if (profile === 'JITTERER') {
      baseAmp -= 4.0; // small tight jumps
      maxAmp = 18.0;
    } else if (profile === 'SNIPER') {
      baseAmp += 5.0; // wide sweeps
      maxAmp = 36.0;
    }

    const amplitude = Phaser.Math.Clamp(baseAmp + (avgSpeed * 0.15), 10.0, maxAmp);

    this.currentParams = { baselineCenter, speed, amplitude, waveShape, avgBias, avgSpeed };
    return this.currentParams;
  }

  /**
   * Triggers the visual "reading you..." analysis scanning sequence
   * @param {number} playerScore Current player locks score
   * @param {function} onComplete Called when analysis ends
   */
  startAnalysis(playerScore, onComplete) {
    this.isAnalyzing = true;
    this.analysisTimer = 0.0;
    this.scanY = this.scanStartY;

    // Calculate next params based on new score
    const params = this.calculateNextParams(playerScore);

    // Prepare text readouts
    const driftStr = params.avgBias > 5 ? 'DRIFT RIGHT' : (params.avgBias < -5 ? 'DRIFT LEFT' : 'BALANCED');
    const speedStr = params.avgSpeed > 25 ? 'AGGRESSIVE' : (params.avgSpeed < 10 ? 'CAUTIOUS' : 'STEADY');
    const phaseNames = { 1: 'OBSERVE', 2: 'ACTIVE ENGAGE', 3: 'COGNITIVE OVERDRIVE' };
    const phaseName = phaseNames[this.phase] || 'OBSERVE';
    
    this.statusText.setText(`⚡ [!] JAMMER ANALYSIS: PHASE ${this.phase} (${phaseName})`);
    this.readoutText.setText(
      `DRIFT: ${driftStr} (${params.avgBias.toFixed(1)}) | SPEED: ${speedStr} (${params.avgSpeed.toFixed(1)})\n` + 
      `AI COGNITIVE CONFIDENCE: ${this.confidence}% | ADAPTING BAND CENTER TO ${(100 - params.baselineCenter).toFixed(0)}%`
    );

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

    // 1. Draw horizontal scanning line with a vertical glow
    const lineXStart = 100;
    const lineXEnd = 700;
    const trackWidth = 600;

    // Sweep line fill
    this.graphics.fillStyle(0xff1144, 0.15);
    this.graphics.fillRect(lineXStart, this.trackY - 50, 600, this.scanY - (this.trackY - 50));

    // Core scanner beam
    this.graphics.lineStyle(4, 0xff3366, 0.9);
    this.graphics.lineBetween(lineXStart, this.scanY, lineXEnd, this.scanY);

    // Scan line indicator glow
    this.graphics.fillStyle(0xff3366, 0.4);
    this.graphics.fillRect(lineXStart, this.scanY - 4, 600, 8);

    // 2. Draw telemetry tracking ray vectors shooting from Jammer Eye center (400, 100)
    const eyeX = 400;
    const eyeY = 100;
    const targets = [];

    if (this.scene.dialController) {
      targets.push(this.scene.dialController.value);
    }
    if (this.scene.signalBand) {
      targets.push(this.scene.signalBand.center);
    }
    
    // Animate search sweep ticks along the line
    targets.push(Phaser.Math.Clamp(50.0 + Math.sin(this.analysisTimer * 16.0) * 40.0, 10, 90));
    targets.push(Phaser.Math.Clamp(this.currentParams.baselineCenter + Math.cos(this.analysisTimer * 12.0) * 20.0, 10, 90));

    targets.forEach((pct, idx) => {
      const targetX = lineXStart + (pct / 100) * trackWidth;
      const targetY = this.trackY;

      // Draw neon laser line
      const pulseAlpha = 0.3 + 0.3 * Math.sin(this.analysisTimer * 30.0 + idx);
      this.graphics.lineStyle(1.5, 0xff1144, pulseAlpha);
      this.graphics.lineBetween(eyeX, eyeY, targetX, targetY);

      // Draw telemetry coordinate impact point
      this.graphics.fillStyle(0xff3366, 0.7);
      this.graphics.fillCircle(targetX, targetY, 4.5);
    });
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

  /**
   * Returns current telemetry averages from rolling history for radar maps
   */
  getTelemetryAverages() {
    if (this.history.length === 0) {
      return { speed: 0.0, overshoots: 0.0, delay: 0.0 };
    }
    let speed = 0.0;
    let overshoots = 0.0;
    let delay = 0.0;
    this.history.forEach(h => {
      speed += h.speed;
      overshoots += (h.overshoots || 0);
      delay += (h.delay || 0);
    });
    const len = this.history.length;
    return {
      speed: speed / len,
      overshoots: overshoots / len,
      delay: delay / len
    };
  }
}

