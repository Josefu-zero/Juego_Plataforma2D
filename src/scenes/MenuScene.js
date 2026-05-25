/**
 * scenes/MenuScene.js
 * Menú principal: título, hi-score, instrucciones, mute.
 */

import StorageManager from '../managers/StorageManager.js';
import AudioManager   from '../audio/AudioManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.registry.set('score',  0);
    this.registry.set('lives',  3);
    this.registry.set('energy', 100);
    this.registry.set('hiScore', StorageManager.getHighScore());

    AudioManager.playBGM('menu');

    // ── Fondo degradado ──────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x000510, 0x000510, 0x050a20, 0x050a20, 1);
    bg.fillRect(0, 0, W, H);

    // Scanlines decorativas
    for (let y = 0; y < H; y += 4) {
      this.add.rectangle(W/2, y, W, 1, 0x000000, 0.12);
    }

    // Estrellas
    for (let i = 0; i < 60; i++) {
      const star = this.add.rectangle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, H*0.7),
        1, 1, 0xffffff, Phaser.Math.FloatBetween(0.2, 0.8)
      );
      this.tweens.add({
        targets: star, alpha: 0.1,
        duration: Phaser.Math.Between(800, 2000),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 1500)
      });
    }

    // ── Título ───────────────────────────────────────────
    this.add.text(W/2, H*0.17, 'MEGA', {
      fontFamily: 'Courier New',
      fontSize: Math.floor(W*0.1)+'px',
      color: '#ffffff',
      stroke: '#0055aa', strokeThickness: 7
    }).setOrigin(0.5);

    const xTxt = this.add.text(W/2, H*0.31, 'X', {
      fontFamily: 'Courier New',
      fontSize: Math.floor(W*0.14)+'px',
      color: '#00aaff',
      stroke: '#003366', strokeThickness: 9
    }).setOrigin(0.5);

    this.tweens.add({
      targets: xTxt, scaleX: 1.06, scaleY: 1.06,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // ── Hi-score ─────────────────────────────────────────
    const hi = StorageManager.getHighScore();
    this.add.text(W/2, H*0.46, `HI-SCORE: ${String(hi).padStart(8,'0')}`, {
      fontFamily: 'Courier New',
      fontSize: Math.floor(W*0.03)+'px', color: '#ffcc00'
    }).setOrigin(0.5);

    // ── Play button ───────────────────────────────────────
    const playBtn = this.add.text(W/2, H*0.57,
      '[ PRESIONA ENTER O TOCA ]', {
        fontFamily: 'Courier New',
        fontSize: Math.floor(W*0.03)+'px', color: '#00ffcc'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: playBtn, alpha: 0.1, duration: 500, yoyo: true, repeat: -1 });

    // ── Controles ─────────────────────────────────────────
    this.add.text(W/2, H*0.72, [
      '← → : MOVER    Z/↑ : SALTAR (DOBLE)',
      'X : DISPARAR   MANTÉN X : CARGADO',
      'C / SHIFT : DASH    P / ESC : PAUSA'
    ].join('\n'), {
      fontFamily: 'Courier New',
      fontSize: Math.floor(W*0.021)+'px',
      color: '#445566', align: 'center', lineSpacing: 4
    }).setOrigin(0.5);

    // ── Mute ─────────────────────────────────────────────
    const muteBtn = this.add.text(W - 10, 8,
      AudioManager.isMuted() ? '🔇' : '🔊', {
        fontFamily: 'Courier New', fontSize: '18px', color: '#aabbcc'
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    muteBtn.on('pointerdown', () => {
      muteBtn.setText(AudioManager.toggleMute() ? '🔇' : '🔊');
    });

    // ── Créditos ──────────────────────────────────────────
    this.add.text(W/2, H - 8,
      'EPN · Aplicaciones Web · Phaser.js 3 · Assets: Kenney (CC0)', {
        fontFamily: 'Courier New',
        fontSize: Math.floor(W*0.016)+'px', color: '#1a2a3a'
      }).setOrigin(0.5, 1);

    // ── Input ─────────────────────────────────────────────
    const startGame = () => {
      AudioManager.stopBGM();
      this.scene.start('Stage1Scene');
      this.scene.launch('HUDScene');
    };

    playBtn.on('pointerdown', startGame);
    this.input.keyboard.once('keydown-ENTER', startGame);
    this.input.keyboard.once('keydown-SPACE', startGame);

    // Toque en zona inferior (evita click en mute)
    this.input.once('pointerdown', p => {
      if (p.y > H * 0.45) startGame();
    });
  }
}
