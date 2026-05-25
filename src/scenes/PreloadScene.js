/**
 * scenes/PreloadScene.js
 * Carga assets y genera texturas procedurales si no existen archivos.
 * NUEVO: carga key_item, door_closed, door_open, hud_key.
 */
import GraphicsFactory from '../managers/GraphicsFactory.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  preload() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(W/2, H/2, W, H, 0x000510);

    const title = this.add.text(W/2, H*0.3, 'MEGA X', {
      fontFamily: 'Courier New',
      fontSize: Math.floor(W*0.1)+'px',
      color: '#00ccff',
      stroke: '#003366', strokeThickness: 6
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title, scaleX: 1.04, scaleY: 1.04,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    const sub = this.add.text(W/2, H*0.5, 'CARGANDO...', {
      fontFamily: 'Courier New', fontSize: Math.floor(W*0.028)+'px', color: '#556677'
    }).setOrigin(0.5);

    this.tweens.add({ targets: sub, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

    const bw = W * 0.6;
    this.add.rectangle(W/2, H*0.63, bw, 10, 0x112244).setStrokeStyle(1, 0x0055aa);
    this.barFill = this.add.rectangle(W/2 - bw/2, H*0.63, 1, 8, 0x00ccff).setOrigin(0, 0.5);

    this.load.on('progress', v => { this.barFill.width = bw * v; });

    // Intentar cargar assets — si no existen se generan proceduralmente
    const A = 'assets';
    const imgs = [
      'player_idle','player_run','player_jump','player_dash','player_hurt',
      'enemy_ground','enemy_ground2','enemy_fly','boss',
      'tile','tile_wall','tile_spike','platform','platform_sm','platform_boss',
      'bullet','bullet_charged','enemy_bullet','boss_bullet',
      'powerup_life','powerup_energy',
      'checkpoint','checkpoint_active',
      'key_item','door_closed','door_open','hud_key',
      'dash_trail'
    ];
    imgs.forEach(k => this.load.image(k, `${A}/${k}.png`));

    for (let i = 0; i < 5; i++) {
      this.load.image(`exp${i}`, `${A}/exp${i}.png`);
    }
  }

  create() {
    // Siempre generar texturas procedurales (sobrescriben las fallidas)
    GraphicsFactory.createAll(this);

    this.time.delayedCall(200, () => {
      this.scene.start('MenuScene');
    });
  }
}
