import Phaser from 'phaser';

/**
 * JammerPresence
 * 
 * Renders an animated retro vector "Jammer Eye" at the top center of the screen.
 * Tracks the player's dial needle in real-time, changes colors based on the active
 * AI Phase, and pulses dynamically to showcase the Jammer's cognitive intensity.
 */
export class JammerPresence {
  /**
   * @param {Phaser.Scene} scene The parent Phaser scene
   * @param {number} x Center X coordinate
   * @param {number} y Center Y coordinate
   */
  constructor(scene, x = 400, y = 100) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    this.graphics = this.scene.add.graphics();

    // Eye settings
    this.outerRadius = 45;
    this.innerRadius = 25;
    this.pupilRadius = 10;
    this.pupilX = x;
    this.pupilY = y;

    // Animation variables
    this.pulsePhase = 0;
    this.rotationPhase = 0;

    // Color schemes for phases
    this.phaseColors = {
      1: 0x00ffaa, // Teal (Observe)
      2: 0xffaa00, // Yellow (Engage)
      3: 0xff3366  // Red (Overdrive)
    };
  }

  /**
   * Update and redraw the Jammer Eye
   * @param {number} delta time step in milliseconds
   * @param {number} playerDialValue The player's dial needle value (0 to 100)
   * @param {number} phase Active Jammer phase (1, 2, or 3)
   * @param {boolean} isAnalyzing Whether the Jammer is currently in the scan sweep state
   */
  update(delta, playerDialValue = 50, phase = 1, isAnalyzing = false, bossActive = false) {
    const dt = delta / 1000;
    
    // 1. Calculate active color
    let baseColor = bossActive ? 0xff003c : (this.phaseColors[phase] || 0x00ffaa);

    // 2. Pulse rate escalates with phase
    const pulseSpeed = phase === 1 ? 2.5 : (phase === 2 ? 5.0 : 9.0);
    this.pulsePhase += dt * pulseSpeed;
    this.rotationPhase += dt * (isAnalyzing ? 12.0 : 1.2);

    const pulseScale = 1.0 + Math.sin(this.pulsePhase) * (phase === 1 ? 0.05 : (phase === 2 ? 0.1 : 0.18));

    // 3. Pupil tracking: pupil moves to look at the player's tuner position (0..100 maps to -15px..+15px)
    const maxOffset = 14;
    const targetOffset = ((playerDialValue - 50.0) / 50.0) * maxOffset;
    
    // Smooth pupil look movement
    const currentOffset = this.pupilX - this.x;
    this.pupilX += (targetOffset - currentOffset) * 0.15; // lerp

    // 4. Render
    this.graphics.clear();

    if (isAnalyzing) {
      // Analysis state: draw glitch flares
      this.graphics.lineStyle(2, 0xff1144, 0.4);
      this.graphics.strokeCircle(this.x, this.y, this.outerRadius * 1.5 * pulseScale);
    }

    // Bezel border
    this.graphics.lineStyle(3, 0x333344, 0.8);
    this.graphics.strokeCircle(this.x, this.y, this.outerRadius);

    // Bezel outer markings
    const markings = 8;
    this.graphics.lineStyle(2, baseColor, 0.3);
    for (let i = 0; i < markings; i++) {
      const angle = (i / markings) * Math.PI * 2 + this.rotationPhase;
      const xStart = this.x + Math.cos(angle) * (this.outerRadius - 4);
      const yStart = this.y + Math.sin(angle) * (this.outerRadius - 4);
      const xEnd = this.x + Math.cos(angle) * (this.outerRadius + 4);
      const yEnd = this.y + Math.sin(angle) * (this.outerRadius + 4);
      this.graphics.lineBetween(xStart, yStart, xEnd, yEnd);
    }

    // Iris (glowing circle)
    this.graphics.fillStyle(baseColor, isAnalyzing ? 0.25 : 0.08);
    this.graphics.lineStyle(2, baseColor, 0.7);
    this.graphics.fillCircle(this.x, this.y, this.innerRadius * pulseScale);
    this.graphics.strokeCircle(this.x, this.y, this.innerRadius * pulseScale);

    // Iris scan lines (spinning vector dashes)
    this.graphics.lineStyle(1.5, baseColor, 0.4);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + this.rotationPhase;
      const x1 = this.x + Math.cos(angle) * (this.innerRadius * pulseScale - 6);
      const y1 = this.y + Math.sin(angle) * (this.innerRadius * pulseScale - 6);
      const x2 = this.x + Math.cos(angle) * (this.innerRadius * pulseScale);
      const y2 = this.y + Math.sin(angle) * (this.innerRadius * pulseScale);
      this.graphics.lineBetween(x1, y1, x2, y2);
    }

    // Pupil (solid tracking center)
    const activePupilRadius = this.pupilRadius * (isAnalyzing ? 1.4 : 1.0);
    this.graphics.fillStyle(isAnalyzing ? 0xffffff : baseColor, 0.95);
    this.graphics.fillCircle(this.pupilX, this.pupilY, activePupilRadius);

    // Pupil glare dot
    this.graphics.fillStyle(0xffffff, 0.8);
    this.graphics.fillCircle(this.pupilX - 3, this.pupilY - 3, 2);
  }

  setVisible(visible) {
    this.graphics.setVisible(visible);
  }

  destroy() {
    this.graphics.destroy();
  }
}
