import Phaser from 'phaser';

/**
 * SignalBand
 * 
 * Manages the moving target signal band.
 * Renders background grid overlay and a dynamic green sine wave track that flattens out
 * inside the target band center, visually representing signal interference/tuning.
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
    
    this.waveShape = 'SINE';     // Oscillation pattern: SINE, SQUARE, SAWTOOTH, JITTER
    this.jitterOffset = 0.0;

    this.movementTime = 0.0;
    this.wavePhase = 0.0;        // Phase offset for animating the track wave

    // Limits to keep band fully on screen
    this.minCenter = this.width / 2 + 5;
    this.maxCenter = 100 - (this.width / 2 + 5);

    // Track visual start/end matching DialController
    this.trackStart = this.x - this.trackWidth / 2;

    this.hazards = [];
    this.graphics = this.scene.add.graphics();
    this.reset();
  }

  /**
   * Resets the band movement phase. Base values will be overwritten by Jammer parameters.
   */
  reset() {
    this.movementTime = Math.random() * 100; // Random starting phase
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.generateHazards();
  }

  generateHazards() {
    this.hazards = [];
    const numHazards = this.scene.jammer.phase >= 3 ? 2 : (this.scene.jammer.phase >= 2 ? 1 : 0);
    
    for (let i = 0; i < numHazards; i++) {
      let hCenter = 0;
      let attempts = 0;
      do {
        hCenter = Math.random() * 80 + 10;
        attempts++;
      } while (Math.abs(hCenter - this.center) < 18 && attempts < 10);
      
      const hWidth = 8.0;
      this.hazards.push({
        min: hCenter - hWidth / 2,
        max: hCenter + hWidth / 2
      });
    }
  }

  isNeedleInHazard(needleValue) {
    for (let h of this.hazards) {
      if (needleValue >= h.min && needleValue <= h.max) {
        return true;
      }
    }
    return false;
  }

  /**
   * Apply dynamic parameters calculated by Jammer AI
   * @param {object} params Jammer-calculated parameters
   */
  applyJammerParams(params) {
    this.baselineCenter = params.baselineCenter;
    this.speed = params.speed;
    this.amplitude = params.amplitude;
    this.waveShape = params.waveShape || 'SINE';
    this.reset(); // Reset starting phase
  }

  /**
   * Update the band position and track wave phase over time
   * @param {number} delta time step in milliseconds
   */
  update(delta) {
    const dt = delta / 1000;
    this.movementTime += dt * this.speed * this.direction;

    // Increment wave phase to animate track ripples (speed based on jammer's frequency)
    this.wavePhase += dt * this.speed * 8.0;

    // Core movement calculation based on active wave shape
    let oscVal = 0.0;
    
    switch (this.waveShape) {
      case 'SINE':
        oscVal = Math.sin(this.movementTime) * this.amplitude;
        break;
      case 'SQUARE':
        oscVal = Math.sign(Math.sin(this.movementTime)) * this.amplitude;
        break;
      case 'SAWTOOTH':
        // Linear drift in one direction, then sudden snap back
        const sawProgress = (this.movementTime % (Math.PI * 2)) / (Math.PI * 2); // 0 to 1
        oscVal = (sawProgress * 2.0 - 1.0) * this.amplitude;
        break;
      case 'JITTER':
        // Base sine wave + sudden random displacement offsets
        if (Math.random() < 0.08) {
          this.jitterOffset = (Math.random() * 2.0 - 1.0) * 8.0;
        }
        oscVal = Math.sin(this.movementTime) * this.amplitude + (this.jitterOffset || 0.0);
        break;
      case 'MORPH':
        // Morph transitions oscillating between Sine and Square shapes over time
        const morphFactor = (Math.sin(this.movementTime * 1.5) + 1.0) / 2.0; // 0 to 1
        const sineVal = Math.sin(this.movementTime) * this.amplitude;
        const squareVal = Math.sign(Math.sin(this.movementTime)) * this.amplitude;
        oscVal = (1.0 - morphFactor) * sineVal + morphFactor * squareVal;
        break;
      default:
        oscVal = Math.sin(this.movementTime) * this.amplitude;
    }

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

    // 1. Draw faint background coordinate grids
    this.graphics.lineStyle(1, 0x00ffff, 0.04);
    
    // Vertical grid lines (every 40px)
    for (let gx = 0; gx <= 800; gx += 40) {
      this.graphics.lineBetween(gx, 0, gx, 600);
    }
    // Horizontal grid lines (every 40px)
    for (let gy = 0; gy <= 600; gy += 40) {
      this.graphics.lineBetween(0, gy, 800, gy);
    }

    // 2. Draw the animated green/teal interference wave along the track
    this.graphics.lineStyle(3, 0x00ffaa, 0.65);
    
    let pathPoints = [];
    const step = 4; // draw line segments every 4 pixels for efficiency
    
    for (let px = this.trackStart; px <= this.trackStart + this.trackWidth; px += step) {
      const pct = ((px - this.trackStart) / this.trackWidth) * 100;
      
      // Calculate distance from this point to the target band center
      const dist = Math.abs(pct - this.center);
      
      // Dampening factor: Gaussian curve that goes to 0 near center
      // If close to band center, wave goes flat (signal is clear)
      const dampening = Math.min(1.0, Math.pow(dist / 14.0, 2.0));
      
      // Standard wave oscillation, scale down inside the band
      const yOffset = Math.sin(px * 0.05 - this.wavePhase) * 16.0 * dampening;
      
      pathPoints.push({ x: px, y: this.y + yOffset });
    }

    // Draw the continuous path
    if (pathPoints.length > 0) {
      this.graphics.beginPath();
      this.graphics.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) {
        this.graphics.lineTo(pathPoints[i].x, pathPoints[i].y);
      }
      this.graphics.strokePath();
    }

    // 3. Draw the target band boundary overlay
    const halfWidthPct = this.width / 2;
    const bandStartPct = this.center - halfWidthPct;
    
    // Map percentages to pixels on track
    const bandX = this.trackStart + (bandStartPct / 100) * this.trackWidth;
    const bandWidthPx = (this.width / 100) * this.trackWidth;

    // Draw the target band as a semi-transparent cyan/green target zone
    this.graphics.fillStyle(0x00ffaa, 0.12);
    this.graphics.lineStyle(2, 0x00ffaa, 0.7);
    
    this.graphics.fillRect(bandX, this.y - 25, bandWidthPx, 50);
    this.graphics.strokeRect(bandX, this.y - 25, bandWidthPx, 50);
    // 4. Draw static-heavy interference Hazard Zones (red blocks) on the track
    if (this.hazards && this.hazards.length > 0) {
      this.hazards.forEach(h => {
        const hX = this.trackStart + (h.min / 100) * this.trackWidth;
        const hW = ((h.max - h.min) / 100) * this.trackWidth;

        // Draw warning hazard background (red)
        this.graphics.fillStyle(0xff3366, 0.28);
        this.graphics.fillRect(hX, this.y - 12, hW, 24);

        // Draw hazard bracket strokes
        this.graphics.lineStyle(1.5, 0xff3366, 0.85);
        this.graphics.strokeRect(hX, this.y - 12, hW, 24);

        // Add warning tick labels inside the blocks
        this.graphics.lineStyle(1.0, 0xff3366, 0.5);
        for (let lx = hX + 4; lx < hX + hW; lx += 6) {
          this.graphics.lineBetween(lx, this.y - 8, lx - 4, this.y + 8);
        }
      });
    }
  }

  destroy() {
    this.graphics.destroy();
  }
}


