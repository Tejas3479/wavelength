import Phaser from 'phaser';

/**
 * UpgradeSystem
 * 
 * Manages the Roguelite Upgrade Terminal.
 * Renders 3 cards containing hardware modifications on the Phaser canvas.
 * Handles hovering, highlights, and selection logic, modifying dial, band,
 * and jammer parameters dynamically.
 */
export class UpgradeSystem {
  constructor(scene) {
    this.scene = scene;
    
    // Core upgrade deck definitions
    this.allUpgrades = [
      {
        id: 'flywheel',
        title: 'DECOUPLED FLYWHEEL',
        type: 'PASSIVE MODULE',
        description: 'Reduces dial needle inertia slide.\nIncreases rotation speed & stopping\npower when keys are released.',
        color: '#00f0ff',
        action: (s) => {
          s.dialController.speed = 52.0; // increase base speed
          s.dialController.friction = 0.05; // lower decays velocity instantly (stops slide)
          s.logTerminal('FIRMWARE INSTALLED: Decoupled Flywheel. Precision needle damping active.');
        }
      },
      {
        id: 'stabilizer',
        title: 'RESONANCE STABILIZER',
        type: 'PASSIVE MODULE',
        description: 'Modulates signal band aperture.\nIncreases target signal band width\nby +25% permanently.',
        color: '#00f0ff',
        action: (s) => {
          s.signalBand.width *= 1.25;
          s.logTerminal('FIRMWARE INSTALLED: Resonance Stabilizer. Tuner aperture widened.');
        }
      },
      {
        id: 'decoy',
        title: 'SPECTRAL DECOY',
        type: 'PASSIVE MODULE',
        description: 'Blinds Jammer telemetry trackers.\nDampens AI telemetry read-rate\nby 40% over attempts.',
        color: '#00f0ff',
        action: (s) => {
          s.jammer.telemetryDampening = 0.6; // reads only 60% of real bias/speed
          s.logTerminal('FIRMWARE INSTALLED: Spectral Decoy. Jammer database spoofed.');
        }
      },
      {
        id: 'shield',
        title: 'STATIC SHIELDING',
        type: 'CONSUMABLE UNIT',
        description: 'Deploys localized circuit fuse.\nAbsorbs one lock miss strike\n(Max: 2 active shields).',
        color: '#ffaa00',
        action: (s) => {
          s.shields = Math.min(2, (s.shields || 0) + 1);
          s.logTerminal(`FIRMWARE INSTALLED: Static Shielding. Core integrity = ${s.shields}/2.`);
        }
      },
      {
        id: 'overclock',
        title: 'OVERCLOCK GRID',
        type: 'CLI SCRIPT',
        description: 'Enables system command:\n  /overclock\nYields temporary +50% dial speed\nbut doubles jammer speed for 3s.',
        color: '#ff007f',
        action: (s) => {
          s.hasOverclock = true;
          s.logTerminal('FIRMWARE INSTALLED: /overclock command script injected.');
        }
      },
      {
        id: 'emp',
        title: 'EMP CAPACITOR',
        type: 'CLI SCRIPT',
        description: 'Enables system command:\n  /emp\nDisables Jammer wave oscillations\ncompletely for 2.0 seconds.',
        color: '#ff007f',
        action: (s) => {
          s.hasEMP = true;
          s.logTerminal('FIRMWARE INSTALLED: /emp command script injected.');
        }
      }
    ];

    this.visible = false;
    this.graphics = this.scene.add.graphics();
    this.activeCards = [];
    this.hoverIndex = -1;
    this.inputZones = [];
    this.textObjects = [];

    // Layout configuration
    this.cardWidth = 190;
    this.cardHeight = 270;
    this.cardY = 350;
    this.cardXs = [200, 400, 600];
  }

  /**
   * Triggers the upgrade overlay screen
   */
  showUpgrades() {
    this.visible = true;
    this.hoverIndex = -1;
    
    // Clear any existing elements just in case
    this.cleanUp();

    // Randomize deck and select 3 options
    const shuffled = [...this.allUpgrades].sort(() => 0.5 - Math.random());
    this.activeCards = shuffled.slice(0, 3);

    // Create Title Texts
    const titleText = this.scene.add.text(400, 80, 'FIRMWARE UPGRADE TERMINAL', {
      fontFamily: 'Orbitron',
      fontSize: '28px',
      color: '#00f0ff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const subTitleText = this.scene.add.text(400, 125, '[ SECTOR INTEGRITY CLEARED - NEW NODES RECOVERED ]', {
      fontFamily: 'Space Mono',
      fontSize: '13px',
      color: '#8f9aa6'
    }).setOrigin(0.5);

    const instructText = this.scene.add.text(400, 160, 'SELECT ONE HARDWARE MODULE TO INSTALL IN CORE MEMORY', {
      fontFamily: 'Space Mono',
      fontSize: '12px',
      color: '#39ff14'
    }).setOrigin(0.5);

    this.textObjects.push(titleText, subTitleText, instructText);

    // Create cards and text representations
    this.activeCards.forEach((card, idx) => {
      const cx = this.cardXs[idx];
      const cy = this.cardY;
      
      // Card Title Text
      const cardTitleText = this.scene.add.text(cx, cy - 105, card.title, {
        fontFamily: 'Space Mono',
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: this.cardWidth - 20 }
      }).setOrigin(0.5);

      // Card Type Text
      const cardTypeText = this.scene.add.text(cx, cy - 65, card.type, {
        fontFamily: 'Space Mono',
        fontSize: '10px',
        fontWeight: 'bold',
        color: card.color
      }).setOrigin(0.5);

      // Card Description Text
      const cardDescText = this.scene.add.text(cx, cy - 10, card.description, {
        fontFamily: 'Space Mono',
        fontSize: '11px',
        color: '#8f9aa6',
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: this.cardWidth - 24 }
      }).setOrigin(0.5);

      // Select prompt button at the bottom of card
      const cardPromptText = this.scene.add.text(cx, cy + 95, '[ INSTALL MODULE ]', {
        fontFamily: 'Space Mono',
        fontSize: '11px',
        color: '#39ff14'
      }).setOrigin(0.5);

      this.textObjects.push(cardTitleText, cardTypeText, cardDescText, cardPromptText);

      // Card interactive zone
      const zone = this.scene.add.zone(cx, cy, this.cardWidth, this.cardHeight);
      zone.setInteractive();
      
      zone.on('pointerdown', () => this.handleSelect(idx));
      
      zone.on('pointerover', () => {
        this.hoverIndex = idx;
        cardPromptText.setColor('#ffffff');
        if (this.scene.audioManager && this.scene.audioManager.playKeyClick) {
          this.scene.audioManager.playKeyClick();
        }
      });
      
      zone.on('pointerout', () => {
        if (this.hoverIndex === idx) {
          this.hoverIndex = -1;
          cardPromptText.setColor('#39ff14');
        }
      });

      this.inputZones.push(zone);
    });

    this.render();
  }

  handleSelect(idx) {
    if (!this.visible) return;

    const selectedCard = this.activeCards[idx];
    
    // Play success lock beep
    if (this.scene.audioManager && this.scene.audioManager.playLock) {
      this.scene.audioManager.playLock();
    }

    // Install firmwares
    selectedCard.action(this.scene);

    // Hide shop & return to play
    this.hide();
    this.scene.resumeAfterUpgrade();
  }

  hide() {
    this.visible = false;
    this.graphics.clear();
    this.cleanUp();
  }

  cleanUp() {
    // Destroy interactive zones
    if (this.inputZones) {
      this.inputZones.forEach(z => z.destroy());
      this.inputZones = [];
    }

    // Destroy text game objects to prevent memory leak
    if (this.textObjects) {
      this.textObjects.forEach(t => t.destroy());
      this.textObjects = [];
    }
  }

  update(delta) {
    if (!this.visible) return;
    this.render();
  }

  render() {
    this.graphics.clear();

    if (!this.visible) return;

    // Draw background overlay dim wash
    this.graphics.fillStyle(0x0a0c10, 0.9);
    this.graphics.fillRect(0, 0, 800, 600);

    // Draw card borders and shapes
    this.activeCards.forEach((card, idx) => {
      const cx = this.cardXs[idx];
      const cy = this.cardY;
      const hw = this.cardWidth / 2;
      const hh = this.cardHeight / 2;

      const isHovered = this.hoverIndex === idx;
      
      // Compute sizing details
      const w = this.cardWidth;
      const h = this.cardHeight;
      const lx = cx - hw;
      const ty = cy - hh;

      // Card backing
      this.graphics.fillStyle(0x161a22, 0.95);
      this.graphics.fillRect(lx, ty, w, h);

      // Card outline (glow cyan on hover)
      const strokeColor = isHovered ? 0x00f0ff : 0x242a34;
      const strokeThickness = isHovered ? 3 : 1;
      this.graphics.lineStyle(strokeThickness, strokeColor, 0.9);
      this.graphics.strokeRect(lx, ty, w, h);

      // Divider line underneath title
      this.graphics.lineStyle(1, 0x242a34, 0.85);
      this.graphics.lineBetween(cx - 75, cy - 50, cx + 75, cy - 50);

      // Extra visual corner marks on hover
      if (isHovered) {
        this.graphics.lineStyle(2, 0x00f0ff, 0.5);
        this.graphics.lineBetween(lx, ty + 12, lx + 12, ty);
        this.graphics.lineBetween(lx + w - 12, ty, lx + w, ty + 12);
        this.graphics.lineBetween(lx, ty + h - 12, lx + 12, ty + h);
        this.graphics.lineBetween(lx + w - 12, ty + h, lx + w, ty + h - 12);
      }
    });
  }
}
