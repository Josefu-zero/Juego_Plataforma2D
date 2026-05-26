/**
 * scenes/PauseScene.js — Pantalla de pausa.
 */

import AudioManager from '../audio/AudioManager.js';

export default class PauseScene extends Phaser.Scene {
  constructor() { super({ key: 'PauseScene' }); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.78);

    this.add.text(W/2, H*0.2, '— PAUSA —', {
      fontFamily: 'Courier New',
      fontSize: Math.floor(W*0.08)+'px',
      color: '#00aaff', stroke: '#003366', strokeThickness: 5
    }).setOrigin(0.5);

    // Controles
    this.add.text(W/2, H*0.42, [
      '← → : MOVER       Z/↑ : SALTAR (DOBLE)',
      'X     : DISPARAR    MANTÉN X : CARGADO',
      'C/SHIFT : DASH      P/ESC : PAUSA'
    ].join('\n'), {
      fontFamily: 'Courier New',
      fontSize: Math.floor(W*0.021)+'px',
      color: '#445566', align: 'center', lineSpacing: 6
    }).setOrigin(0.5);

    // Botones
    const resumeBtn = this._btn(W/2, H*0.62, '[ CONTINUAR ]',   '#00ffcc');
    const muteBtn   = this._btn(W/2, H*0.73,
      AudioManager.isMuted() ? '🔇 ACTIVAR SONIDO' : '🔊 SILENCIAR', '#aabbcc');
    const menuBtn   = this._btn(W/2, H*0.83, '[ MENÚ PRINCIPAL ]', '#cc6666');

    this.tweens.add({ targets: resumeBtn, alpha: 0.4, duration: 650, yoyo: true, repeat: -1 });

    const resume = () => {
      const s1 = this.scene.get('Stage1Scene');
      const s2 = this.scene.get('Stage2Scene'); // <-- AÑADIR
      const bs = this.scene.get('BossScene');
      
      if (s1?.sys.isActive()) s1._togglePause();
      else if (s2?.sys.isActive()) s2._togglePause(); // <-- AÑADIR
      else if (bs?.sys.isActive()) bs._togglePause();
    };

    resumeBtn.on('pointerdown', resume);
    muteBtn.on('pointerdown', () => {
      muteBtn.setText(AudioManager.toggleMute() ? '🔇 ACTIVAR SONIDO' : '🔊 SILENCIAR');
    });
    menuBtn.on('pointerdown', () => {
      AudioManager.stopBGM();
      // <-- Añadir 'Stage2Scene' al array
      ['HUDScene','Stage1Scene','Stage2Scene','BossScene','PauseScene'].forEach(k => {
        const s = this.scene.get(k);
        if (s?.sys.isActive()) this.scene.stop(k);
      });
      this.scene.start('MenuScene');
    });

    this.input.keyboard.on('keydown-P',   resume);
    this.input.keyboard.on('keydown-ESC', resume);
  }

  _btn(x, y, label, color) {
    const btn = this.add.text(x, y, label, {
      fontFamily: 'Courier New',
      fontSize: Math.floor(this.scale.width * 0.034)+'px', color
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setAlpha(0.65));
    btn.on('pointerout',  () => btn.setAlpha(1));
    return btn;
  }
}
