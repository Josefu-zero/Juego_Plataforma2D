/**
 * ui/HUD.js
 * Componente de HUD reutilizable.
 * HUDScene lo instancia y llama a update() cada tick.
 */

import AudioManager from '../audio/AudioManager.js';

export default class HUD {
  /**
   * @param {Phaser.Scene} scene  — La HUDScene que lo contiene
   */
  constructor(scene) {
    this.scene   = scene;
    this.W       = scene.scale.width;
    this.H       = scene.scale.height;
    this._build();
  }

  _build() {
    const { W, H } = this;

    // ── HP (cajitas 1-bit) ────────────────────────────────
    this.scene.add.text(8, 8, 'HP', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#1e90ff'
    }).setDepth(20);

    this.hpBoxes = [];
    for (let i = 0; i < 8; i++) {
      const box = this.scene.add.rectangle(28 + i * 14, 14, 10, 10, 0x112244)
        .setStrokeStyle(1, 0x0055aa).setDepth(20);
      this.hpBoxes.push(box);
    }

    // ── Barra de energía del arma ─────────────────────────
    this.scene.add.text(8, 26, 'WE', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#00ffcc'
    }).setDepth(20);

    this.energyBg = this.scene.add.rectangle(28 + 112 / 2, 32, 112, 7, 0x003322)
      .setStrokeStyle(1, 0x00aa77).setDepth(20);
    this.energyFill = this.scene.add.rectangle(28, 32, 112, 5, 0x00ffcc)
      .setOrigin(0, 0.5).setDepth(21);

    // ── Score ──────────────────────────────────────────────
    this.hiTxt = this.scene.add.text(W - 8, 8,
      `HI ${String(0).padStart(7,'0')}`, {
        fontFamily: 'Courier New', fontSize: '10px', color: '#ffcc00'
      }).setOrigin(1, 0).setDepth(20);

    this.scoreTxt = this.scene.add.text(W - 8, 20, '00000000', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#ffffff'
    }).setOrigin(1, 0).setDepth(20);

    // ── Vidas ─────────────────────────────────────────────
    this.livesTxt = this.scene.add.text(W - 8, 36, '♥ ♥ ♥', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#ff4466'
    }).setOrigin(1, 0).setDepth(20);

    // ── Indicador de llave ────────────────────────────────
    this.keyIcon = this.scene.add.text(W - 8, 54, '🔑', {
      fontFamily: 'Courier New', fontSize: '14px', color: '#ffcc00'
    }).setOrigin(1, 0).setDepth(20).setVisible(false).setAlpha(0.3);

    this.keyTxt = this.scene.add.text(W - 26, 57, 'LLAVE', {
      fontFamily: 'Courier New', fontSize: '9px', color: '#ffcc00'
    }).setOrigin(1, 0).setDepth(20).setVisible(false).setAlpha(0.3);

    // ── Barra del Boss (oculta por defecto) ───────────────
    this.bossGroup = this.scene.add.group();
    const bBarW = W * 0.65;

    this.bossLabel = this.scene.add.text(W / 2, H - 44, '— BOSS —', {
      fontFamily: 'Courier New', fontSize: '10px', color: '#cc0000'
    }).setOrigin(0.5).setDepth(20).setVisible(false);

    this.bossBg = this.scene.add.rectangle(W / 2, H - 32, bBarW, 16, 0x110000)
      .setStrokeStyle(1, 0x880000).setDepth(20).setVisible(false);

    this.bossFill = this.scene.add.rectangle(W / 2 - bBarW / 2 + 1, H - 32, 0, 12, 0xcc0000)
      .setOrigin(0, 0.5).setDepth(21).setVisible(false);

    this._bBarMaxW = bBarW - 2;

    // ── Botones de pantalla ───────────────────────────────
    const muteBtn = this.scene.add.text(W / 2 - 22, 6,
      AudioManager.isMuted() ? '🔇' : '🔊', {
        fontFamily: 'Courier New', fontSize: '14px', color: '#aabbcc'
      }).setDepth(20).setInteractive({ useHandCursor: true });

    muteBtn.on('pointerdown', () => {
      const m = AudioManager.toggleMute();
      muteBtn.setText(m ? '🔇' : '🔊');
    });

    const pauseBtn = this.scene.add.text(W / 2 + 8, 6, '⏸', {
      fontFamily: 'Courier New', fontSize: '14px', color: '#aabbcc'
    }).setDepth(20).setInteractive({ useHandCursor: true });

    pauseBtn.on('pointerdown', () => {
      const active = this.scene.scene.manager.getScenes(true)
        .find(s => s.scene.key === 'Stage1Scene' || s.scene.key === 'BossScene');
      if (active) active._togglePause();
    });

    // ── Instrucciones (parte inferior) ───────────────────
    this.scene.add.text(W / 2, H - 6,
      'P=PAUSA  ←→=MOVER  Z=SALTAR  X=DISPARAR  C=DASH', {
        fontFamily: 'Courier New', fontSize: '9px', color: '#2a3a4a'
      }).setOrigin(0.5, 1).setDepth(20);
  }

  /**
   * Llamado cada ~50ms por HUDScene.
   * Lee el estado del registro global y actualiza los elementos.
   */
  update(registry, gameScene) {
    if (!gameScene?.player) return;

    // HP
    const hp = gameScene.player.health;
    this.hpBoxes.forEach((box, i) => {
      box.setFillStyle(i < hp ? 0x1e90ff : 0x112244);
    });

    // Energía
    const energy = Math.max(0, registry.get('energy') || 0);
    this.energyFill.width = Math.max(1, (energy / 100) * 112);

    // Score / Hi
    const score = registry.get('score') || 0;
    const hi    = Math.max(registry.get('hiScore') || 0, score);
    this.scoreTxt.setText(String(score).padStart(8, '0'));
    this.hiTxt.setText(`HI ${String(hi).padStart(7, '0')}`);

    // Vidas
    const lives = Math.max(0, registry.get('lives') || 0);
    this.livesTxt.setText('♥ '.repeat(lives).trim());

    // Llave
    const hasKey = !!registry.get('hasKey');
    this.keyIcon.setVisible(hasKey).setAlpha(hasKey ? 1 : 0.3);
    this.keyTxt.setVisible(hasKey).setAlpha(hasKey ? 1 : 0.3);
    if (hasKey) {
      const blink = Math.floor(Date.now() / 400) % 2;
      this.keyIcon.setAlpha(blink ? 1 : 0.5);
    }

    // Boss bar
    const showBoss = !!registry.get('showBossBar');
    this.bossLabel.setVisible(showBoss);
    this.bossBg.setVisible(showBoss);
    this.bossFill.setVisible(showBoss);

    if (showBoss) {
      const bHP  = registry.get('bossHealth')    || 0;
      const bMax = registry.get('bossMaxHealth') || 1;
      this.bossFill.width = Math.max(1, (bHP / bMax) * this._bBarMaxW);
      const pct   = bHP / bMax;
      const color = pct > 0.66 ? 0xcc0000 : pct > 0.33 ? 0xff4400 : 0xff8800;
      this.bossFill.setFillStyle(color);
    }
  }
}
