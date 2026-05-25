/**
 * scenes/VictoryScene.js — Pantalla de Victoria / Stage Clear.
 */

import StorageManager from '../managers/StorageManager.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() { super({ key: 'VictoryScene' }); }

  init(data) { this.finalScore = data.score || 0; }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    const g = this.add.graphics();
    g.fillGradientStyle(0x000510, 0x000510, 0x050a20, 0x050a20, 1);
    g.fillRect(0, 0, W, H);

    for (let y = 0; y < H; y += 4) this.add.rectangle(W/2, y, W, 1, 0x000000, 0.12);

    // Confeti / partículas
    for (let i = 0; i < 45; i++) {
      const px  = Phaser.Math.Between(10, W-10);
      const py  = Phaser.Math.Between(-30, H-10);
      const col = [0xffcc00, 0x00aaff, 0xff4466, 0x00ffcc][i % 4];
      const r   = this.add.rectangle(px, py, Phaser.Math.Between(3,6), Phaser.Math.Between(3,6), col);
      this.tweens.add({
        targets: r, y: py + Phaser.Math.Between(90,260), alpha: 0,
        duration: Phaser.Math.Between(1000,2600),
        delay: Phaser.Math.Between(0,1200), repeat: -1,
        repeatDelay: Phaser.Math.Between(0,800)
      });
    }

    this.add.text(W/2, H*0.13, 'STAGE', {
      fontFamily: 'Courier New', fontSize: Math.floor(W*0.066)+'px',
      color: '#ffffff', stroke: '#003366', strokeThickness: 5
    }).setOrigin(0.5);

    const clearTxt = this.add.text(W/2, H*0.27, 'CLEAR!', {
      fontFamily: 'Courier New', fontSize: Math.floor(W*0.12)+'px',
      color: '#ffcc00', stroke: '#886600', strokeThickness: 8
    }).setOrigin(0.5);

    this.tweens.add({
      targets: clearTxt, scaleX: 1.06, scaleY: 1.06,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    this.add.text(W/2, H*0.44, 'PUNTAJE FINAL', {
      fontFamily: 'Courier New', fontSize: Math.floor(W*0.024)+'px', color: '#556677'
    }).setOrigin(0.5);

    this.add.text(W/2, H*0.52, String(this.finalScore).padStart(8,'0'), {
      fontFamily: 'Courier New', fontSize: Math.floor(W*0.05)+'px', color: '#ffffff'
    }).setOrigin(0.5);

    const hi    = StorageManager.getHighScore();
    const isNew = this.finalScore >= hi && this.finalScore > 0;

    if (isNew) {
      const newRec = this.add.text(W/2, H*0.63, '★ NUEVO RÉCORD ★', {
        fontFamily: 'Courier New', fontSize: Math.floor(W*0.034)+'px', color: '#ff9900'
      }).setOrigin(0.5);
      this.tweens.add({ targets: newRec, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
    } else {
      this.add.text(W/2, H*0.63, `RÉCORD: ${String(hi).padStart(8,'0')}`, {
        fontFamily: 'Courier New', fontSize: Math.floor(W*0.026)+'px', color: '#444455'
      }).setOrigin(0.5);
    }

    const menuBtn = this.add.text(W/2, H*0.79, '[ VOLVER AL MENÚ ]', {
      fontFamily: 'Courier New', fontSize: Math.floor(W*0.036)+'px', color: '#00ffcc'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: menuBtn, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 });
    menuBtn.on('pointerover', () => menuBtn.setAlpha(1));
    menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    this.add.text(W/2, H*0.92,
      'EPN · Aplicaciones Web · Assets: Kenney.nl (CC0)', {
        fontFamily: 'Courier New', fontSize: Math.floor(W*0.016)+'px', color: '#1a2a3a'
      }).setOrigin(0.5);

    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('MenuScene'));
  }
}
