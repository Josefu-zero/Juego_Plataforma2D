/**
 * scenes/BootScene.js
 * Primera escena: inicializa el registro global de datos del juego.
 */

import StorageManager from '../managers/StorageManager.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create() {
    this.registry.set('score',   0);
    this.registry.set('lives',   3);
    this.registry.set('level',   1);
    this.registry.set('energy',  100);
    this.registry.set('hiScore', StorageManager.getHighScore());
    this.registry.set('showBossBar',   false);
    this.registry.set('bossHealth',    0);
    this.registry.set('bossMaxHealth', 1);

    this.scene.start('PreloadScene');
  }
}
