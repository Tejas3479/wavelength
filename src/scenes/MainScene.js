import Phaser from 'phaser';
import { DialController } from '../modules/DialController.js';
import { SignalBand } from '../modules/SignalBand.js';
import { ScoreTimer } from '../modules/ScoreTimer.js';
import { Jammer } from '../modules/Jammer.js';
import { AudioManager } from '../modules/AudioManager.js';
import { JammerPresence } from '../modules/JammerPresence.js';
import { RunSummary } from '../modules/RunSummary.js';

const STATES = {
  TITLE: 'TITLE',
  PLAYING: 'PLAYING',
  ANALYSIS: 'ANALYSIS',
  GAMEOVER: 'GAMEOVER',
  VICTORY: 'VICTORY'
};

/**
 * MainScene — the primary gameplay scene.
 * 
 * Coordinates gameplay states, tracks real-time player telemetry,
 * triggers audio/visual polish (shakes, flashes, synth tones),
 * and delegates to the Jammer AI to adjust game difficulty dynamically.
 */
export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    this.gameState = STATES.TITLE;

    // Initialize synthesized audio manager
    this.audioManager = new AudioManager();

    // 1. Initialize core game modules (placed centrally)
    // Track at y = 250, dial knob sits below at y = 400
    this.dialController = new DialController(this, 400, 250, 600);
    this.signalBand = new SignalBand(this, 400, 250, 600);
    this.scoreTimer = new ScoreTimer(this);
    this.jammer = new Jammer(this, 250);
    
    // Glowing vector AI Jammer Eye
    this.jammerPresence = new JammerPresence(this, 400, 110);

    // Telemetry variables for the current round
    this.roundDialValues = [];
    this.roundBandCenters = [];
    this.totalDialMovement = 0.0;
    this.roundTimeElapsed = 0.0;
    this.lastDialValue = 50.0;

    // Granular run stats across attempts
    this.runCleanLocks = 0;
    this.runStandardLocks = 0;
    this.runNearMisses = 0;
    this.runTotalMisses = 0;
    this.runTimeouts = 0;
    this.speedSamples = [];

    // 2. Setup HUD Feedback
    this.feedbackText = this.add.text(400, 180, '', {
      fontFamily: 'monospace',
      fontSize: '28px',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setVisible(false);

    // 3. Setup Screen overlays (Title, Game Over, Victory)
    this.setupScreenOverlays();

    // 4. Setup input events
    this.setupInputEvents();

    // Start at Title
    this.transitionToState(STATES.TITLE);
  }

  setupScreenOverlays() {
    // Title Overlay
    this.titleContainer = this.add.container(400, 300);
    const titleText = this.add.text(0, -110, 'WAVELENGTH', {
      fontFamily: 'monospace',
      fontSize: '52px',
      color: '#00ffaa',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);
    
    const subTitleText = this.add.text(0, -40, '— adaptive-AI signal tuner terminal —', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#8888aa'
    }).setOrigin(0.5);

    const instructText = this.add.text(0, 50, 'CONTROLS:\n← / → or A / D to rotate dial\nOr click & drag dial knob directly\n\nPRESS SPACE or CLICK HERE TO START\n(Enables Terminal Synthesizer Audio)', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    this.titleContainer.add([titleText, subTitleText, instructText]);

    // Game Over Overlay
    this.gameOverContainer = this.add.container(400, 300);
    const goTitle = this.add.text(0, -90, 'SIGNAL LOST', {
      fontFamily: 'monospace',
      fontSize: '52px',
      color: '#ff3366',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.goInstruct = this.add.text(0, 40, 'The Jammer has completely blocked you.\n\nPRESS SPACE TO REBOOT TERMINAL', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5);

    this.gameOverContainer.add([goTitle, this.goInstruct]);

    // Victory Overlay
    this.victoryContainer = this.add.container(400, 300);
    const vicTitle = this.add.text(0, -90, 'SIGNAL RESTORED', {
      fontFamily: 'monospace',
      fontSize: '52px',
      color: '#00ffaa',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.vicInstruct = this.add.text(0, 40, 'You successfully bypassed the Jammer!\n\nPRESS SPACE TO SURVIVE AGAIN', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5);

    this.victoryContainer.add([vicTitle, this.vicInstruct]);

    // Interactive LOCK button for playing screen
    this.lockButton = this.add.text(400, 550, 'LOCK SIGNAL [SPACE]', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#00ffaa',
      backgroundColor: '#161622',
      padding: { x: 25, y: 12 },
      stroke: '#00ffaa',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive();

    // Stylize Lock Button Hover
    this.lockButton.on('pointerover', () => this.lockButton.setStyle({ backgroundColor: '#222233', color: '#ffffff' }));
    this.lockButton.on('pointerout', () => this.lockButton.setStyle({ backgroundColor: '#161622', color: '#00ffaa' }));

    this.lockButton.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation();
      if (this.gameState === STATES.PLAYING) {
        this.attemptLock();
      }
    });
  }

  setupInputEvents() {
    // Keyboard Space to lock or progress screens
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.gameState === STATES.PLAYING) {
        this.attemptLock();
      } else if (this.gameState !== STATES.ANALYSIS) {
        // Initialize AudioContext on user interaction
        this.audioManager.start();
        this.transitionToState(STATES.PLAYING);
      }
    });

    // Pointer down on non-playing screens to start
    this.input.on('pointerdown', () => {
      if (this.gameState !== STATES.PLAYING && this.gameState !== STATES.ANALYSIS) {
        // Initialize AudioContext on user interaction
        this.audioManager.start();
        this.transitionToState(STATES.PLAYING);
      }
    });
  }

  transitionToState(newState) {
    this.gameState = newState;

    // Toggle container visibilities
    this.titleContainer.setVisible(newState === STATES.TITLE);
    this.gameOverContainer.setVisible(newState === STATES.GAMEOVER);
    this.victoryContainer.setVisible(newState === STATES.VICTORY);

    // Toggle gameplay modules HUD
    const isPlaying = newState === STATES.PLAYING;
    const isAnalysis = newState === STATES.ANALYSIS;

    this.dialController.graphics.setVisible(isPlaying || isAnalysis);
    this.signalBand.graphics.setVisible(isPlaying || isAnalysis);
    this.scoreTimer.setVisible(isPlaying || isAnalysis);
    this.lockButton.setVisible(isPlaying);
    this.jammer.setVisible(isAnalysis);
    
    // Jammer Eye is visible on all screens as an AI presence
    this.jammerPresence.setVisible(true);

    if (newState === STATES.TITLE) {
      this.jammer.history = []; // Clear history on reset to title
      if (this.audioManager) {
        this.audioManager.stopTuning();
      }
    }

    if (isPlaying) {
      this.scoreTimer.resetGame();
      
      // Reset run statistics
      this.runCleanLocks = 0;
      this.runStandardLocks = 0;
      this.runNearMisses = 0;
      this.runTotalMisses = 0;
      this.runTimeouts = 0;
      this.speedSamples = [];

      this.startNewRound(false);
    } else if (isAnalysis) {
      this.scoreTimer.stopTimer();
      this.feedbackText.setVisible(false);
      if (this.audioManager) {
        this.audioManager.stopTuning();
      }
      this.runJammerAnalysis();
    } else {
      this.scoreTimer.stopTimer();
      this.feedbackText.setVisible(false);
      if (this.audioManager) {
        this.audioManager.stopTuning();
      }

      // Generate Run Summary when game completes (GameOver or Victory)
      if (newState === STATES.GAMEOVER || newState === STATES.VICTORY) {
        let avgSpeedOfRun = 0.0;
        if (this.speedSamples.length > 0) {
          let sum = 0;
          this.speedSamples.forEach(v => sum += v);
          avgSpeedOfRun = sum / this.speedSamples.length;
        }

        const stats = {
          score: this.scoreTimer.score,
          cleanLocks: this.runCleanLocks,
          standardLocks: this.runStandardLocks,
          nearMisses: this.runNearMisses,
          totalMisses: this.runTotalMisses,
          timeouts: this.runTimeouts,
          avgSpeed: avgSpeedOfRun,
          victory: newState === STATES.VICTORY
        };

        const summary = RunSummary.generate(stats);

        if (newState === STATES.GAMEOVER) {
          this.goInstruct.setText(`The Jammer has completely blocked you.\n\n${summary}\n\nPRESS SPACE TO REBOOT TERMINAL`);
        } else {
          this.vicInstruct.setText(`You successfully bypassed the Jammer!\n\n${summary}\n\nPRESS SPACE TO SURVIVE AGAIN`);
        }
      }
    }
  }

  startNewRound(keepCurrentBand = false) {
    this.dialController.value = 50.0; // Reset needle to center
    this.scoreTimer.startRound();     // Reset countdown timer
    
    if (!keepCurrentBand) {
      this.signalBand.reset();        // Randomize base parameters
    }

    // Reset telemetry trackers for this round
    this.roundDialValues = [];
    this.roundBandCenters = [];
    this.totalDialMovement = 0.0;
    this.roundTimeElapsed = 0.0;
    this.lastDialValue = 50.0;
  }

  runJammerAnalysis() {
    // 1. Calculate metrics for the round that just ended
    let avgBias = 0.0;
    if (this.roundDialValues.length > 0) {
      let sumBias = 0.0;
      for (let i = 0; i < this.roundDialValues.length; i++) {
        sumBias += (this.roundDialValues[i] - this.roundBandCenters[i]);
      }
      avgBias = sumBias / this.roundDialValues.length;
    }

    const avgSpeed = this.roundTimeElapsed > 0 ? this.totalDialMovement / this.roundTimeElapsed : 0;
    
    // Save round speed to running list
    this.speedSamples.push(avgSpeed);

    // 2. Feed metrics to the Jammer AI
    this.jammer.recordAttempt(avgBias, avgSpeed);

    // 3. Trigger analysis scanning sweep ("reading you..." tell)
    this.jammer.startAnalysis(this.scoreTimer.score, (newParams) => {
      // Callback triggered when 1.5s scan complete
      this.signalBand.applyJammerParams(newParams);
      // Resume gameplay
      this.gameState = STATES.PLAYING;
      this.lockButton.setVisible(true);
      this.jammer.setVisible(false);
      this.startNewRound(true);
    });
  }

  attemptLock() {
    const diff = Math.abs(this.dialController.value - this.signalBand.center);
    const bandWidth = this.signalBand.width;

    // Three-tier lock zones
    const cleanZone = bandWidth * 0.22;    // Inner ~22% center of the band (2.6 units)
    const standardZone = bandWidth * 0.50; // Total band containment (6 units from center)
    const nearMissZone = standardZone + 4.5; // Glitch boundary (+4.5 units outside)

    if (diff <= cleanZone) {
      this.handleCleanLockSuccess();
    } else if (diff <= standardZone) {
      this.handleStandardLockSuccess();
    } else if (diff <= nearMissZone) {
      this.handleNearMissGrace();
    } else {
      this.handleLockMiss();
    }
  }

  handleCleanLockSuccess() {
    // Clean lock awards double score
    this.scoreTimer.score += 2;
    this.scoreTimer.updateHUD();

    this.cameras.main.flash(200, 0, 255, 120); // Bright Green
    this.showFeedback('CLEAN LOCK! +2', '#00ffaa');
    this.audioManager.playCleanLock();

    this.runCleanLocks++;

    if (this.scoreTimer.score >= 10) {
      this.transitionToState(STATES.VICTORY);
    } else {
      this.transitionToState(STATES.ANALYSIS);
    }
  }

  handleStandardLockSuccess() {
    this.scoreTimer.incrementScore();
    this.cameras.main.flash(200, 0, 220, 180); // Faint Green
    this.showFeedback('SIGNAL LOCKED! +1', '#00eeaa');
    this.audioManager.playLock();

    this.runStandardLocks++;

    if (this.scoreTimer.score >= 10) {
      this.transitionToState(STATES.VICTORY);
    } else {
      this.transitionToState(STATES.ANALYSIS);
    }
  }

  handleNearMissGrace() {
    // Extend round timer by 1.5 seconds (Near-Miss Grace Call)
    this.scoreTimer.timeLeft = Math.min(this.scoreTimer.maxTime, this.scoreTimer.timeLeft + 1.5);
    this.scoreTimer.updateHUD();

    this.cameras.main.flash(150, 255, 170, 0); // Warning Amber
    this.showFeedback('NEAR MISS! GRACE +1.5s', '#ffaa00');
    this.audioManager.playNearMiss();

    this.runNearMisses++;
    // Near Miss does NOT trigger a round transition, giving player a second chance!
  }

  handleLockMiss() {
    const isAlive = this.scoreTimer.decrementLife();
    this.cameras.main.flash(200, 255, 51, 102); // Flash Red
    this.cameras.main.shake(150, 0.012);        // Juice Screen Shake
    this.showFeedback('TOTAL MISS! -1 LIFE', '#ff3366');
    this.audioManager.playMiss();

    this.runTotalMisses++;

    if (!isAlive) {
      this.transitionToState(STATES.GAMEOVER);
    } else {
      this.transitionToState(STATES.ANALYSIS);
    }
  }

  handleTimeout() {
    const isAlive = this.scoreTimer.decrementLife();
    this.cameras.main.flash(250, 255, 51, 102); // Flash Red longer for timeout
    this.cameras.main.shake(200, 0.015);        // Stronger Screen Shake
    this.showFeedback('TIMEOUT! -1 LIFE', '#ff3366');
    this.audioManager.playMiss();

    this.runTimeouts++;

    if (!isAlive) {
      this.transitionToState(STATES.GAMEOVER);
    } else {
      this.transitionToState(STATES.ANALYSIS);
    }
  }

  showFeedback(message, colorCode) {
    this.feedbackText.setText(message);
    this.feedbackText.setColor(colorCode);
    this.feedbackText.setPosition(400, 185);
    this.feedbackText.setAlpha(1);
    this.feedbackText.setScale(1);
    this.feedbackText.setVisible(true);

    if (this.feedbackTween) {
      this.feedbackTween.stop();
    }

    // Scale up & fade out feedback text
    this.feedbackTween = this.tweens.add({
      targets: this.feedbackText,
      y: 135,
      alpha: 0,
      scale: 1.3,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.feedbackText.setVisible(false);
      }
    });
  }

  update(time, delta) {
    // Always update Jammer Presence vector drawing (even in menus/overlays)
    let dialPosForEye = 50.0;
    if (this.gameState === STATES.PLAYING || this.gameState === STATES.ANALYSIS) {
      dialPosForEye = this.dialController.value;
    }
    this.jammerPresence.update(
      delta, 
      dialPosForEye, 
      this.jammer.phase, 
      this.gameState === STATES.ANALYSIS
    );

    if (this.gameState === STATES.PLAYING) {
      const dt = delta / 1000;
      this.roundTimeElapsed += dt;

      // Track dial differences for speed metric
      const currentDial = this.dialController.value;
      const dialDiff = Math.abs(currentDial - this.lastDialValue);
      this.totalDialMovement += dialDiff;
      this.lastDialValue = currentDial;

      // Sample data
      this.roundDialValues.push(currentDial);
      this.roundBandCenters.push(this.signalBand.center);

      this.dialController.update(delta);
      this.signalBand.update(delta);
      this.scoreTimer.update(delta, () => this.handleTimeout());

      // Update real-time detuning audio mix
      if (this.audioManager) {
        this.audioManager.updateTuning(
          currentDial, 
          this.signalBand.center, 
          this.signalBand.contains(currentDial)
        );
      }
    } 
    else if (this.gameState === STATES.ANALYSIS) {
      this.jammer.update(delta);
    }
  }
}




