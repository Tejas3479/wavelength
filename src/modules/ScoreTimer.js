import Phaser from 'phaser';

/**
 * ScoreTimer
 * 
 * Manages player score, lives, and the active countdown timer.
 * Renders simple text elements on screen for HUD display.
 */
export class ScoreTimer {
  /**
   * @param {Phaser.Scene} scene The parent Phaser scene
   */
  constructor(scene) {
    this.scene = scene;

    this.score = 0;
    this.lives = 3;
    this.maxTime = 5.0; // Time per round in seconds
    this.timeLeft = this.maxTime;

    this.isTimerActive = false;

    // HUD Text objects
    this.scoreText = this.scene.add.text(20, 20, 'SCORE: 0', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff'
    });

    this.livesText = this.scene.add.text(20, 50, 'LIVES: ❤️❤️❤️', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ff3366'
    });

    this.timerText = this.scene.add.text(780, 20, 'TIME: 5.00s', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#00ffaa',
      align: 'right'
    }).setOrigin(1, 0);

    // Visual timer progress bar
    this.barGraphics = this.scene.add.graphics();
    this.barX = 200;
    this.barY = 25;
    this.barWidth = 400;
    this.barHeight = 15;
  }

  /**
   * Start the timer for a new round
   */
  startRound(customTime = null) {
    this.timeLeft = customTime !== null ? customTime : this.maxTime;
    this.isTimerActive = true;
    this.updateHUD();
  }

  /**
   * Stop the timer (e.g. game over or victory)
   */
  stopTimer() {
    this.isTimerActive = false;
    this.barGraphics.clear();
  }

  /**
   * Increment score by 1
   */
  incrementScore() {
    this.score += 1;
    this.updateHUD();
  }

  /**
   * Decrement lives by 1
   * @returns {boolean} True if player is still alive, false if dead
   */
  decrementLife() {
    this.lives = Math.max(0, this.lives - 1);
    this.updateHUD();
    return this.lives > 0;
  }

  /**
   * Reset stats for a new game
   */
  resetGame() {
    this.score = 0;
    this.lives = 3;
    this.timeLeft = this.maxTime;
    this.isTimerActive = false;
    this.updateHUD();
  }

  /**
   * Update countdown timer
   * @param {number} delta time step in milliseconds
   * @param {function} onTimeout Callback function when time runs out
   */
  update(delta, onTimeout) {
    if (!this.isTimerActive) return;

    this.timeLeft -= delta / 1000;

    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.isTimerActive = false;
      this.updateHUD();
      if (onTimeout) onTimeout();
    } else {
      this.updateHUD();
    }
  }

  updateHUD() {
    // Update texts
    this.scoreText.setText(`SCORE: ${this.score}`);
    
    let hearts = '';
    for (let i = 0; i < 3; i++) {
      hearts += i < this.lives ? '❤️' : '🖤';
    }
    this.livesText.setText(`LIVES: ${hearts}`);
    
    this.timerText.setText(`TIME: ${this.timeLeft.toFixed(2)}s`);

    // Draw timer bar
    this.barGraphics.clear();
    if (this.isTimerActive) {
      const pct = Phaser.Math.Clamp(this.timeLeft / this.maxTime, 0, 1);
      
      // Background bar slot
      this.barGraphics.fillStyle(0x222233);
      this.barGraphics.fillRect(this.barX, this.barY, this.barWidth, this.barHeight);

      // Active bar color changes from green -> yellow -> red
      let color = 0x00ffaa;
      if (pct < 0.25) {
        color = 0xff3366; // Red
      } else if (pct < 0.5) {
        color = 0xffaa00; // Yellow
      }

      this.barGraphics.fillStyle(color);
      this.barGraphics.fillRect(this.barX, this.barY, this.barWidth * pct, this.barHeight);
    }
  }

  setVisible(visible) {
    this.scoreText.setVisible(visible);
    this.livesText.setVisible(visible);
    this.timerText.setVisible(visible);
    this.barGraphics.setVisible(visible);
  }

  destroy() {
    this.scoreText.destroy();
    this.livesText.destroy();
    this.timerText.destroy();
    this.barGraphics.destroy();
  }
}
