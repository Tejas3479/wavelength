import Phaser from 'phaser';

/**
 * MainScene — the primary gameplay scene.
 *
 * Session 1: renders only a solid background colour + a centered confirmation
 * text to prove the canvas mounts and the build pipeline works end-to-end.
 *
 * Session 2 will add: dial, target band, lock/miss detection, timer, score.
 * Session 3 will add: Jammer AI layer and "reading you..." tell.
 * Session 4 will add: polish, sound, title/game-over screens.
 */
export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // No assets to load in Session 1
  }

  create() {
    // Confirmation text — proves the scene booted correctly
    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'WAVELENGTH\n— signal locked —',
      {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#00ffaa',
        align: 'center',
      }
    ).setOrigin(0.5);
  }

  update(time, delta) {
    // No game logic in Session 1
  }
}
