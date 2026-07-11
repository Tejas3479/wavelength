import Phaser from 'phaser';

/**
 * SignalBand
 * 
 * Manages the moving target signal band.
 * Tracks position (0 to 100) and width. Accepts dynamic parameters
 * from the Jammer AI to adjust its baseline center bias, speed, and amplitude.
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
    this.center = 50.0;          // Current center position of band (0 to 100)
    this.width = 12.0;           // Total width of the band (in 0-100 units)
    
    // Dynamic parameters updated by Jammer AI
    this.baselineCenter = 50.0;  // Center bias around which it oscillates
    this.speed = 1.5;            // Frequency of oscillation
    this.amplitude = 20.0;       // Scale of swing oscillation
    this.direction = 1;

    this.movementTime = 0.0;

    // Limits to keep band fully on screen
    this.minCenter = this.width / 2 + 5;
    this.maxCenter = 100 - (this.width / 2 + 5);

    // Track visual start/end matching DialController
    this.trackStart = this.x - this.trackWidth / 2;

    this.graphics = this.scene.add.graphics();
    this.reset();
  }

  /**
   * Resets the band movement phase. Base values will be overwritten by Jammer parameters.
   */
  reset() {
    this.movementTime = Math.random() * 100; // Random starting phase
    this.direction = Math.random() > 0.5 ? 1 : -1;
  }

  /**
   * Apply dynamic parameters calculated by Jammer AI
   * @param {object} params Jammer-calculated parameters
   */
  applyJammerParams(params) {
    this.baselineCenter = params.baselineCenter;
    this.speed = params.speed;
    this.amplitude = params.amplitude;
    this.reset(); // Reset starting phase
  }

  /**
   * Update the band position over time based on Jammer parameters
   * @param {number} delta time step in milliseconds
   */
  update(delta) {
    const dt = delta / 1000;
    this.movementTime += dt * this.speed * this.direction;

    // Core movement calculation: oscillate around baselineCenter
    const oscVal = Math.sin(this.movementTime) * this.amplitude;
    this.center = this.baselineCenter + oscVal;

    // Clamp center position to keep the band within bounds
    this.center = Phaser.Math.Clamp(this.center, this.minCenter, this.maxCenter);

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

