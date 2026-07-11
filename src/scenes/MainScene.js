import Phaser from 'phaser';
import { DialController } from '../modules/DialController.js';
import { SignalBand } from '../modules/SignalBand.js';
import { ScoreTimer } from '../modules/ScoreTimer.js';
import { Jammer } from '../modules/Jammer.js';

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
 * and delegates to the Jammer AI to adjust game difficulty dynamically.
 */
export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    this.gameState = STATES.TITLE;

    // 1. Initialize core game modules (placed centrally)
    // Track at y = 250, dial knob sits below at y = 400
    this.dialController = new DialController(this, 400, 250, 600);
    this.signalBand = new SignalBand(this, 400, 250, 600);
    this.scoreTimer = new ScoreTimer(this);
    this.jammer = new Jammer(this, 250);

    // Telemetry variables
    this.roundDialValues = [];
    this.roundBandCenters = [];
    this.totalDialMovement = 0.0;
    this.roundTimeElapsed = 0.0;
    this.lastDialValue = 50.0;

    // 2. Setup HUD Feedback
    this.feedbackText = this.add.text(400, 180, '', {
      fontFamily: 'monospace',
      fontSize: '32px',
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
    const titleText = this.add.text(0, -100, 'WAVELENGTH', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#00ffaa',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);
    
    const subTitleText = this.add.text(0, -30, '— adaptive-AI signal tuner —', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#8888aa'
    }).setOrigin(0.5);

    const instructText = this.add.text(0, 50, 'CONTROLS:\n← / → or A / D to rotate dial\nOr click & drag dial knob directly\n\nPRESS SPACE or CLICK HERE TO START', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    this.titleContainer.add([titleText, subTitleText, instructText]);

    // Game Over Overlay
    this.gameOverContainer = this.add.container(400, 300);
    const goTitle = this.add.text(0, -50, 'SIGNAL LOST', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#ff3366',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    const goInstruct = this.add.text(0, 50, 'The Jammer has completely blocked you.\n\nPRESS SPACE TO TRY AGAIN', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    this.gameOverContainer.add([goTitle, goInstruct]);

    // Victory Overlay
    this.victoryContainer = this.add.container(400, 300);
    const vicTitle = this.add.text(0, -50, 'SIGNAL RESTORED', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#00ffaa',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    const vicInstruct = this.add.text(0, 50, 'You successfully tuned past the interference!\n\nPRESS SPACE TO SURVIVE AGAIN', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    this.victoryContainer.add([vicTitle, vicInstruct]);

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
        this.transitionToState(STATES.PLAYING);
      }
    });

    // Pointer down on non-playing screens to start
    this.input.on('pointerdown', () => {
      if (this.gameState !== STATES.PLAYING && this.gameState !== STATES.ANALYSIS) {
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

    if (newState === STATES.TITLE) {
      this.jammer.history = []; // Clear history on reset to title
    }

    if (isPlaying) {
      this.scoreTimer.resetGame();
      this.startNewRound(false);
    } else if (isAnalysis) {
      this.scoreTimer.stopTimer();
      this.feedbackText.setVisible(false);
      this.runJammerAnalysis();
    } else {
      this.scoreTimer.stopTimer();
      this.feedbackText.setVisible(false);
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

    // 2. Feed metrics to the Jammer AI
    this.jammer.recordAttempt(avgBias, avgSpeed);

    // 3. Trigger analysis scanning sweep ("reading you..." tell)
    this.jammer.startAnalysis((newParams) => {
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
    const isLocked = this.signalBand.contains(this.dialController.value);

    if (isLocked) {
      this.handleLockSuccess();
    } else {
      this.handleLockMiss();
    }
  }

  handleLockSuccess() {
    this.scoreTimer.incrementScore();
    this.cameras.main.flash(200, 0, 255, 170); // Flash Teal/Green
    this.showFeedback('LOCKED!', '#00ffaa');

    if (this.scoreTimer.score >= 10) {
      this.transitionToState(STATES.VICTORY);
    } else {
      this.transitionToState(STATES.ANALYSIS);
    }
  }

  handleLockMiss() {
    const isAlive = this.scoreTimer.decrementLife();
    this.cameras.main.flash(200, 255, 51, 102); // Flash Red
    this.showFeedback('MISS! -1 LIFE', '#ff3366');

    if (!isAlive) {
      this.transitionToState(STATES.GAMEOVER);
    } else {
      this.transitionToState(STATES.ANALYSIS);
    }
  }

  handleTimeout() {
    const isAlive = this.scoreTimer.decrementLife();
    this.cameras.main.flash(250, 255, 51, 102); // Flash Red longer for timeout
    this.showFeedback('TIMEOUT! -1 LIFE', '#ff3366');

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
    } 
    else if (this.gameState === STATES.ANALYSIS) {
      this.jammer.update(delta);
    }
  }
}


