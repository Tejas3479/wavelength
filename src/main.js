import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene.js';

/**
 * Wavelength — Parsewave Game Jam 2026
 *
 * Game config: fixed logical resolution of 800×600, scaled to fit the
 * viewport via Phaser's RESIZE scale mode. This keeps the game playable
 * on both desktop and mobile-width screens without letter-boxing issues.
 */
const config = {
  type: Phaser.AUTO,         // WebGL with Canvas fallback
  parent: 'game-container',
  width: 800,
  height: 600,
  backgroundColor: '#0a0a0f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainScene],
};

const game = new Phaser.Game(config);
