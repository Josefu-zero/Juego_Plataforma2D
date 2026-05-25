/**
 * scenes/GameOverScene.js — Pantalla de Game Over.
 */

import StorageManager from '../managers/StorageManager.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  init(data) { this.finalScore = data.score || 0; }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    const g = this.add.graphics();
    g.fillGradientStyle(0x220000, 0x220000, 0x0a0000, 0x0a0000, 1);
    g.fillRect(0, 0, W, H);

    for (let y = 0; y < H; y += 4) this.add.rectangle(W/2, y, W, 1, 0x000000, 0.18);

    const gt = this.add.text(W/2, H*0.18, 'GAME', {
      fontFamily: 'Courier New', fontSize: Math.floor(W*0.11)+'px',
      color: '#ff2222', stroke: '#660000', strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0);

    const ot = this.add.text(W/2, H*0.34, 'OVER', {
      fontFamily: 'Courier New', fontSize: Math.floor(W*0.11)+'px',
      color: '#ff4444', stroke: '#660000', strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: gt, alpha: 1, duration: 400 });
    this.tweens.add({ targets: ot, alpha: 1, duration: 400, delay: 280 });

    this.time.delayedCall(700, () => {
      this.tweens.add({ targets: [gt, ot], alpha: 0.55, duration: 750, yoyo: true, repeat: -1 });
    });

    this.add.text(W/2, H*0.52, `PUNTAJE: ${String(this.finalScore).padStart(8,'0')}`, {
      fontFamily: 'Courier New', fontSize: Math.floor(W*0.035)+'px', color: '#ffcc00'
    }).setOrigin(0.5);

    const hi = StorageManager.getHighScore();
    this.add.text(W/2, H*0.62, `RÉCORD: ${String(hi).padStart(8,'0')}`, {
      fontFamily: 'Courier New', fontSize: Math.floor(W*0.026)+'px', color: '#555555'
    }).setOrigin(0.5);

    const retryBtn = this._btn(W/2, H*0.75, '[ REINTENTAR ]',     '#00ffcc');
    const menuBtn  = this._btn(W/2, H*0.86, '[ MENÚ PRINCIPAL ]', '#aaaaaa');

    this.tweens.add({ targets: retryBtn, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

    retryBtn.on('pointerdown', () => {
      this.scene.start('Stage1Scene');
      this.scene.launch('HUDScene');
    });
    menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    this.input.keyboard.once('keydown-ENTER', () => {
      this.scene.start('Stage1Scene'); this.scene.launch('HUDScene');
    });
    this.input.keyboard.once('keydown-ESC', () => this.scene.start('MenuScene'));
  }

  _btn(x, y, label, color) {
    return this.add.text(x, y, label, {
      fontFamily: 'Courier New', fontSize: Math.floor(this.scale.width*0.034)+'px', color
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
  }
}
