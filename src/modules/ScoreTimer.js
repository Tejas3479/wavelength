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

    // HUD graphic frames
    this.hudBorderGraphics = this.scene.add.graphics();

    // HUD Text objects aligned to cockpit boxes
    this.scoreText = this.scene.add.text(25, 20, 'BYPASS GRIDS: 0', {
      fontFamily: 'Space Mono',
      fontSize: '14px',
      color: '#00ffaa'
    });

    this.livesText = this.scene.add.text(25, 42, 'INTEGRITY:    ❤️❤️❤️', {
      fontFamily: 'Space Mono',
      fontSize: '14px',
      color: '#ff3366'
    });

    this.timerText = this.scene.add.text(775, 22, 'WARP TIME: 5.00s', {
      fontFamily: 'Space Mono',
      fontSize: '14px',
      color: '#00f0ff',
      align: 'right'
    }).setOrigin(1, 0);

    // Visual timer progress bar
    this.barGraphics = this.scene.add.graphics();
    this.barX = 250;
    this.barY = 24;
    this.barWidth = 300;
    this.barHeight = 12;
  }

  drawBracketBox(graphics, x, y, w, h, color) {
    graphics.lineStyle(1.5, color, 0.45);
    const len = 8;
    // Top-left
    graphics.lineBetween(x, y, x + len, y);
    graphics.lineBetween(x, y, x, y + len);
    // Top-right
    graphics.lineBetween(x + w, y, x + w - len, y);
    graphics.lineBetween(x + w, y, x + w, y + len);
    // Bottom-left
    graphics.lineBetween(x, y + h, x + len, y + h);
    graphics.lineBetween(x, y + h, x, y + h - len);
    // Bottom-right
    graphics.lineBetween(x + w, y + h, x + w - len, y + h);
    graphics.lineBetween(x + w, y + h, x + w, y + h - len);

    // Dark semi-transparent dashboard panel backing
    graphics.fillStyle(0x07090e, 0.65);
    graphics.fillRect(x, y, w, h);
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
    this.scoreText.setText(`BYPASS GRIDS: ${this.score}`);
    
    let hearts = '';
    for (let i = 0; i < 3; i++) {
      hearts += i < this.lives ? '❤️' : '🖤';
    }
    this.livesText.setText(`INTEGRITY:    ${hearts}`);
    this.timerText.setText(`WARP TIME: ${this.timeLeft.toFixed(2)}s`);

    // Redraw HUD dashboard graphics frames
    this.hudBorderGraphics.clear();
    
    // Left Cockpit Panel (Score & Lives status)
    const leftColor = this.lives <= 1 ? 0xff3366 : 0x00ffaa;
    this.drawBracketBox(this.hudBorderGraphics, 15, 12, 195, 52, leftColor);

    // Right Cockpit Panel (Time countdown status)
    const pct = Phaser.Math.Clamp(this.timeLeft / this.maxTime, 0, 1);
    const rightColor = pct < 0.25 ? 0xff3366 : (pct < 0.5 ? 0xffaa00 : 0x00f0ff);
    this.drawBracketBox(this.hudBorderGraphics, 605, 12, 180, 28, rightColor);

    // Draw timer bar brackets
    this.drawBracketBox(this.hudBorderGraphics, this.barX - 8, this.barY - 6, this.barWidth + 16, this.barHeight + 12, rightColor);

    // Draw timer bar
    this.barGraphics.clear();
    if (this.isTimerActive) {
      // Background bar slot backing
      this.barGraphics.fillStyle(0x0a0f1d, 0.7);
      this.barGraphics.fillRect(this.barX, this.barY, this.barWidth, this.barHeight);

      this.barGraphics.fillStyle(rightColor);
      this.barGraphics.fillRect(this.barX, this.barY, this.barWidth * pct, this.barHeight);

      // Draw vertical tick lines inside the bar slot
      this.barGraphics.lineStyle(1.0, 0x07090e, 0.4);
      for (let tx = 0.2; tx < 1.0; tx += 0.2) {
        const tickX = this.barX + this.barWidth * tx;
        this.barGraphics.lineBetween(tickX, this.barY, tickX, this.barY + this.barHeight);
      }
    }
  }

  setVisible(visible) {
    this.scoreText.setVisible(visible);
    this.livesText.setVisible(visible);
    this.timerText.setVisible(visible);
    this.barGraphics.setVisible(visible);
    this.hudBorderGraphics.setVisible(visible);
  }

  destroy() {
    this.scoreText.destroy();
    this.livesText.destroy();
    this.timerText.destroy();
    this.barGraphics.destroy();
    this.hudBorderGraphics.destroy();
  }
}
