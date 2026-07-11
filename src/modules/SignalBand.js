import Phaser from 'phaser';

/**
 * SignalBand
 * 
 * Manages the moving target signal band.
 * Tracks position (0 to 100) and width, handles simple movement patterns
 * for the core loop, and performs containment checks for lock attempts.
 */
export class SignalBand {
  /**
   * @param {Phaser.Scene} scene The parent Phaser scene
   * @param {number} x The center x of the track
   * @param {number} y The center y of the track
   * @param {number} trackWidth The pixel width of the track
   */
  constructor(scene, x, y, trackWidth = 600) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.trackWidth = trackWidth;

    // Target band configuration
    this.center = 50.0;     // Center position of band (0 to 100)
    this.width = 12.0;      // Total width of the band (in 0-100 units)
    this.speed = 1.5;       // Movement speed multiplier
    this.movementTime = 0.0;

    // Movement limits to keep band fully on track
    this.minCenter = this.width / 2 + 5;
    this.maxCenter = 100 - (this.width / 2 + 5);

    // Track visual start/end matching DialController
    this.trackStart = this.x - this.trackWidth / 2;

    this.graphics = this.scene.add.graphics();
    this.reset();
  }

  /**
   * Resets and randomizes the band properties for a new round
   */
  reset() {
    this.movementTime = Math.random() * 100; // Random offset for starting position
    // Random speed between 1.0 and 2.5
    this.speed = 1.0 + Math.random() * 1.5;
    // Alternate direction/patterns
    this.direction = Math.random() > 0.5 ? 1 : -1;
    // Set random starting position within limits
    this.center = this.minCenter + Math.random() * (this.maxCenter - this.minCenter);
  }

  /**
   * Update the band position over time
   * @param {number} delta time step in milliseconds
   */
  update(delta) {
    const dt = delta / 1000;
    this.movementTime += dt * this.speed * this.direction;

    // Calculate new center using a clean sine wave oscillation
    // Map -1..1 of sine wave to minCenter..maxCenter
    const sinVal = Math.sin(this.movementTime);
    this.center = this.minCenter + ((sinVal + 1) / 2) * (this.maxCenter - this.minCenter);

    this.render();
  }

  /**
   * Check if a player's dial value is inside the target band
   * @param {number} value The player's dial value
   * @returns {boolean}
   */
  contains(value) {
    const halfWidth = this.width / 2;
    return value >= (this.center - halfWidth) && value <= (this.center + halfWidth);
  }

  render() {
    this.graphics.clear();

    const halfWidthPct = this.width / 2;
    const bandStartPct = this.center - halfWidthPct;
    
    // Map percentages to pixels on track
    const bandX = this.trackStart + (bandStartPct / 100) * this.trackWidth;
    const bandWidthPx = (this.width / 100) * this.trackWidth;

    // Draw the target band as a semi-transparent teal/green rectangle
    this.graphics.fillStyle(0x00ffaa, 0.25);
    this.graphics.lineStyle(2, 0x00ffaa, 0.8);
    
    // Fill band region (box height centered on track y)
    this.graphics.fillRect(bandX, this.y - 20, bandWidthPx, 40);
    this.graphics.strokeRect(bandX, this.y - 20, bandWidthPx, 40);
  }

  destroy() {
    this.graphics.destroy();
  }
}
