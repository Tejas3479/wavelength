import Phaser from 'phaser';
import { DialController } from '../modules/DialController.js';
import { SignalBand } from '../modules/SignalBand.js';
import { ScoreTimer } from '../modules/ScoreTimer.js';

const STATES = {
  TITLE: 'TITLE',
  PLAYING: 'PLAYING',
  GAMEOVER: 'GAMEOVER',
  VICTORY: 'VICTORY'
};

/**
 * MainScene — the primary gameplay scene.
 * 
 * Handles game states, coordinates input and gameplay modules,
 * and manages lock/miss transitions with visual screen flashes.
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
    
    const subTitleText = this.add.text(0, -30, '— signal tuning reflex arcade —', {
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
      } else {
        this.transitionToState(STATES.PLAYING);
      }
    });

    // Pointer down on non-playing screens to start
    this.input.on('pointerdown', () => {
      if (this.gameState !== STATES.PLAYING) {
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
    this.dialController.graphics.setVisible(isPlaying);
    this.signalBand.graphics.setVisible(isPlaying);
    this.scoreTimer.setVisible(isPlaying);
    this.lockButton.setVisible(isPlaying);

    if (isPlaying) {
      this.scoreTimer.resetGame();
      this.startNewRound();
    } else {
      this.scoreTimer.stopTimer();
      this.feedbackText.setVisible(false);
    }
  }

  startNewRound() {
    this.dialController.value = 50.0; // Reset needle to center
    this.signalBand.reset();          // Randomize band speed/starting point
    this.scoreTimer.startRound();     // Reset countdown timer
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
      this.startNewRound();
    }
  }

  handleLockMiss() {
    const isAlive = this.scoreTimer.decrementLife();
    this.cameras.main.flash(200, 255, 51, 102); // Flash Red
    this.showFeedback('MISS! -1 LIFE', '#ff3366');

    if (!isAlive) {
      this.transitionToState(STATES.GAMEOVER);
    } else {
      this.startNewRound();
    }
  }

  handleTimeout() {
    const isAlive = this.scoreTimer.decrementLife();
    this.cameras.main.flash(250, 255, 51, 102); // Flash Red longer for timeout
    this.showFeedback('TIMEOUT! -1 LIFE', '#ff3366');

    if (!isAlive) {
      this.transitionToState(STATES.GAMEOVER);
    } else {
      this.startNewRound();
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
    if (this.gameState !== STATES.PLAYING) return;

    this.dialController.update(delta);
    this.signalBand.update(delta);
    
    // Pass callback for timeouts
    this.scoreTimer.update(delta, () => this.handleTimeout());
  }
}

