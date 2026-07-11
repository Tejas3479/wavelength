import Phaser from 'phaser';

/**
 * DialController
 * 
 * Manages player tuning input. Controls a normalized value from 0 to 100.
 * Supports keyboard (Arrow keys, A/D) and pointer (mouse/touch dragging).
 */
export class DialController {
  /**
   * @param {Phaser.Scene} scene The parent Phaser scene
   * @param {number} x The center x of the track
   * @param {number} y The center y of the track
   * @param {number} width The pixel width of the tuning track
   */
  constructor(scene, x, y, width = 600) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;

    this.value = 50.0; // Current tuning value (0 to 100)
    this.speed = 40.0; // Units per second moved by keys

    // Inertia physics values
    this.velocity = 0.0;
    this.acceleration = 250.0; // acceleration in units/s^2
    this.friction = 0.82;      // friction decay (smaller = slides more)
    this.enabled = true;       // suspended during CLI console focus

    // Visual dimensions
    this.trackStart = this.x - this.width / 2;
    this.trackEnd = this.x + this.width / 2;

    // Dial Knob settings
    this.dialX = x;
    this.dialY = y + 150; // Dial placed below the track
    this.dialRadius = 60;

    // Create graphics object for rendering
    this.graphics = this.scene.add.graphics();

    // Input state
    this.isDraggingNeedle = false;
    this.isDraggingDial = false;

    this.setupInputs();
  }

  setupInputs() {
    // Keyboard inputs
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.keyA = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // Mouse/Touch pointer input
    this.scene.input.on('pointerdown', (pointer) => {
      // Check if clicking near the dial knob
      const distToDial = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.dialX, this.dialY);
      if (distToDial <= this.dialRadius) {
        this.isDraggingDial = true;
      }
      // Check if clicking near the track/needle
      else if (
        pointer.x >= this.trackStart - 10 &&
        pointer.x <= this.trackEnd + 10 &&
        Math.abs(pointer.y - this.y) <= 30
      ) {
        this.isDraggingNeedle = true;
        this.updateValueFromPointer(pointer.x);
      }
    });

    this.scene.input.on('pointermove', (pointer) => {
      if (this.isDraggingNeedle) {
        this.updateValueFromPointer(pointer.x);
      } else if (this.isDraggingDial) {
        // Calculate angle from dial center to pointer
        const angle = Phaser.Math.Angle.Between(this.dialX, this.dialY, pointer.x, pointer.y);
        // Map angle (-PI to PI) to value (0 to 100)
        // Convert -PI..PI to 0..2PI
        let normalizedAngle = angle + Math.PI; // 0 is left, PI is right
        // Map 0..2PI to 0..100
        const newValue = (normalizedAngle / (Math.PI * 2)) * 100;
        this.value = Phaser.Math.Clamp(newValue, 0, 100);
      }
    });

    this.scene.input.on('pointerup', () => {
      this.isDraggingNeedle = false;
      this.isDraggingDial = false;
    });
  }

  /**
   * Update the dial value based on absolute X coordinate of pointer
   * @param {number} pointerX 
   */
  updateValueFromPointer(pointerX) {
    const pct = (pointerX - this.trackStart) / this.width;
    this.value = Phaser.Math.Clamp(pct * 100, 0, 100);
  }

  /**
   * Update inputs on update tick
   * @param {number} delta time step in milliseconds
   */
  update(delta) {
    const dt = delta / 1000; // seconds

    if (this.enabled) {
      // Keyboard input adjusts velocity instead of setting value directly
      if (this.cursors.left.isDown || this.keyA.isDown) {
        this.velocity -= this.acceleration * dt;
      }
      if (this.cursors.right.isDown || this.keyD.isDown) {
        this.velocity += this.acceleration * dt;
      }
    }

    // Apply friction decay (frame-rate independent based on 60fps)
    this.velocity *= Math.pow(this.friction, dt * 60);

    // Clamp speed limits
    const maxSpeed = this.speed * 2.0;
    this.velocity = Phaser.Math.Clamp(this.velocity, -maxSpeed, maxSpeed);

    // Apply velocity to value if not dragging
    if (!this.isDraggingNeedle && !this.isDraggingDial) {
      this.value = Phaser.Math.Clamp(this.value + this.velocity * dt, 0, 100);
    } else {
      this.velocity = 0.0; // clamp velocity on direct user drags
    }

    this.render();
  }

  render() {
    this.graphics.clear();

    // 1. Draw track line
    this.graphics.lineStyle(4, 0x333344);
    this.graphics.lineBetween(this.trackStart, this.y, this.trackEnd, this.y);
    
    // Draw track tick marks at 0, 25, 50, 75, 100
    this.graphics.lineStyle(2, 0x444455);
    for (let i = 0; i <= 100; i += 25) {
      const tickX = this.trackStart + (i / 100) * this.width;
      this.graphics.lineBetween(tickX, this.y - 10, tickX, this.y + 10);
    }

    // 2. Draw tuning needle
    const needleX = this.trackStart + (this.value / 100) * this.width;
    this.graphics.fillStyle(0xffaa00);
    this.graphics.lineStyle(3, 0xffaa00);
    // Needle line
    this.graphics.lineBetween(needleX, this.y - 20, needleX, this.y + 20);
    // Needle cap (triangle)
    this.graphics.fillTriangle(
      needleX, this.y - 20,
      needleX - 6, this.y - 30,
      needleX + 6, this.y - 30
    );

    // 3. Draw dial knob (bottom center)
    // Outer dial body
    this.graphics.lineStyle(4, 0x555566);
    this.graphics.fillStyle(0x1a1a24);
    this.graphics.fillCircle(this.dialX, this.dialY, this.dialRadius);
    this.graphics.strokeCircle(this.dialX, this.dialY, this.dialRadius);

    // Inner dial indicator dot/line rotating based on value
    // value 0..100 maps to angle -PI to PI
    const dialAngle = (this.value / 100) * (Math.PI * 2) - Math.PI;
    const indX = this.dialX + Math.cos(dialAngle) * (this.dialRadius - 15);
    const indY = this.dialY + Math.sin(dialAngle) * (this.dialRadius - 15);

    this.graphics.fillStyle(0xffaa00);
    this.graphics.fillCircle(indX, indY, 6);

    // Dial label text (rendered by text game objects, or just a small marker line here)
    this.graphics.lineStyle(2, 0xffaa00, 0.4);
    this.graphics.lineBetween(this.dialX, this.dialY, indX, indY);
  }

  destroy() {
    this.graphics.destroy();
  }
}
