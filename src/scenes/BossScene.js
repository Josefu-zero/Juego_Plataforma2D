/**
 * scenes/BossScene.js
 * Stage final exclusivo para el Boss.
 * Escenario diferente (fondo rojo/oscuro), arena cerrada,
 * plataformas especiales y transición a VictoryScene al vencer.
 */

import Player          from '../objects/Player.js';
import { Boss }        from '../objects/Enemy.js';
import CollisionHelper from '../physics/CollisionHelper.js';
import StorageManager  from '../managers/StorageManager.js';
import AudioManager    from '../audio/AudioManager.js';

const TILE = 32;

export default class BossScene extends Phaser.Scene {
  constructor() { super({ key: 'BossScene' }); }

  init(data) {
    // Recibe estado del Stage1Scene
    this._initLives  = data.lives  ?? 3;
    this._initScore  = data.score  ?? 0;
    this._initEnergy = data.energy ?? 100;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W; this.H = H;

    // Restaurar estado
    this.registry.set('lives',       this._initLives);
    this.registry.set('score',       this._initScore);
    this.registry.set('energy',      this._initEnergy);
    this.registry.set('level',       2);
    this.registry.set('showBossBar', false);

    this.gameState    = 'intro';
    this._mobileState = {};
    this._prevMobile  = {};

    const ARENA_W = W;  // Arena del mismo ancho que la pantalla (sin scroll horizontal)
    this.physics.world.setBounds(0, 0, ARENA_W, H + 100);

    // ── Fondo de la arena del boss ────────────────────────
    this._buildBackground(W, H);

    // ── Plataformas de la arena ───────────────────────────
    this.platforms = this.physics.add.staticGroup();
    this._buildArena(W, H);

    // ── Jugador — aparece en el lado izquierdo ────────────
    this.player = new Player(this, 80, H - 120);

    // ── Power-ups en arena ────────────────────────────────
    this.powerups = this.physics.add.staticGroup();
    this._placeArenaPowerups(W, H);

    // ── Cámara fija (no sigue al jugador, la arena cabe) ──
    this.cameras.main.setBounds(0, 0, ARENA_W, H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // ── Input ─────────────────────────────────────────────
    this._setupInput();
    this._setupMobileControls();

    // ── Colisiones base (boss se añade después del intro) ─
    CollisionHelper.playerVsPlatforms(this, this.player, this.platforms);

    CollisionHelper.playerVsPowerups(this, this.player, this.powerups,
      (pl, pu) => this._collectPowerup(pu)
    );

    // ── Eventos ───────────────────────────────────────────
    this.events.on('playerDied',   this._onPlayerDied,   this);
    this.events.on('bossDefeated', this._onBossDefeated, this);

    // ── Secuencia de intro ────────────────────────────────
    this._runIntro();
  }

  // ─── Fondo rojo oscuro ───────────────────────────────────
  _buildBackground(W, H) {
    const g = this.add.graphics().setDepth(-10);
    g.fillGradientStyle(0x0a0000, 0x0a0000, 0x1a0505, 0x1a0505, 1);
    g.fillRect(0, 0, W, H);

    // Columnas decorativas
    [W*0.2, W*0.5, W*0.8].forEach(x => {
      const gc = this.add.graphics().setDepth(-8);
      gc.fillStyle(0x1a0505);
      gc.fillRect(x - 12, 0, 24, H);
      gc.fillStyle(0x660000);
      gc.fillRect(x - 12, 0, 24, 3);
    });

    // Partículas de advertencia (cuadraditos rojos que caen)
    for (let i = 0; i < 20; i++) {
      const px = Phaser.Math.Between(20, W - 20);
      const py = Phaser.Math.Between(0, H - 20);
      const rect = this.add.rectangle(px, py, 2, 2, 0xff2200, 0.6).setDepth(-7);
      this.tweens.add({
        targets: rect, y: py + Phaser.Math.Between(60, 160), alpha: 0,
        duration: Phaser.Math.Between(1200, 3000),
        repeat: -1, delay: Phaser.Math.Between(0, 2000)
      });
    }

    // Letrero "BOSS ARENA"
    this.add.text(W/2, 14, '— BOSS ARENA —', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#660000',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(5);
  }

  // ─── Arena cerrada ────────────────────────────────────────
  _buildArena(W, H) {
    // Suelo completo (sin huecos)
    for (let x = 0; x < W; x += TILE) {
      for (let layer = 0; layer < 2; layer++) {
        this.platforms.create(
          x + TILE/2, H - layer * TILE - TILE/2, 'tile'
        ).setDisplaySize(TILE, TILE).refreshBody();
      }
    }

    // Paredes laterales
    for (let y = 0; y < H; y += TILE) {
      this.platforms.create(TILE/2,       y, 'tile_wall').setDisplaySize(TILE, TILE).refreshBody();
      this.platforms.create(W - TILE/2,   y, 'tile_wall').setDisplaySize(TILE, TILE).refreshBody();
    }

    // 3 plataformas a distintas alturas para que el jugador tenga movilidad
    const platDefs = [
      { x: W*0.25, y: H-170, tex: 'platform_boss' },
      { x: W*0.5,  y: H-240, tex: 'platform_boss' },
      { x: W*0.75, y: H-170, tex: 'platform_boss' },
    ];
    platDefs.forEach(p => {
      this.platforms.create(p.x, p.y, p.tex)
        .setDisplaySize(128, 16).refreshBody();
    });
  }

  // ─── Power-ups en la arena ────────────────────────────────
  _placeArenaPowerups(W, H) {
    const defs = [
      { x: W*0.25, y: H-200, type: 'life'   },
      { x: W*0.75, y: H-200, type: 'energy' },
    ];
    defs.forEach(p => {
      const pu = this.powerups.create(p.x, p.y, `powerup_${p.type}`)
        .setDisplaySize(24, 24).refreshBody();
      pu.puType = p.type;
      this.tweens.add({
        targets: pu, y: p.y - 8,
        duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    });
  }

  // ─── Secuencia de intro ───────────────────────────────────
  _runIntro() {
    const W = this.W; const H = this.H;

    // Flash de entrada
    this.cameras.main.flash(400, 150, 0, 0);
    this._showMessage('¡ BOSS STAGE !', '#ff4444', 1600);

    AudioManager.playBGM('boss');

    this.time.delayedCall(1800, () => {
      // Texto de advertencia
      this._showMessage('¡ BOSS ALERT !', '#ff0000', 1200);
      this.cameras.main.shake(300, 0.018);

      this.time.delayedCall(1300, () => {
        // Spawn del boss en el centro-derecho
        this.boss = new Boss(this, W * 0.72, H - 220);
        this.registry.set('bossHealth',    this.boss.health);
        this.registry.set('bossMaxHealth', this.boss.maxHealth);
        this.registry.set('showBossBar',   true);

        // Colisiones del boss
        this._setupBossCollisions();

        this.gameState = 'playing';
      });
    });
  }

  // ─── Colisiones del boss ──────────────────────────────────
  _setupBossCollisions() {
    const P = this.player;
    const B = this.boss;

    // ✅ Balas del jugador → boss (con daño correcto)
    CollisionHelper.playerBulletsVsEnemy(this, P, B, (bullet, boss, dmg) => {
      boss.takeDamage(dmg);
      this.registry.set('bossHealth', boss.health);
    });

    // Contacto cuerpo boss → jugador
    CollisionHelper.playerVsEnemy(this, P, B, () => {
      if (!B.isAlive) return;
      P.takeDamage(2);
    });

    // Balas del boss → jugador
    CollisionHelper.enemyBulletsVsPlayer(this, B, P, () => P.takeDamage(1));

    // Boss plataformas (no colisiona — flota)
  }

  // ─── Input ───────────────────────────────────────────────
  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys    = this.input.keyboard.addKeys({
      A:'A', D:'D', W:'W', Z:'Z', X:'X', C:'C', J:'J', K:'K',
      SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT
    });
    this.input.keyboard.on('keydown-P',   () => this._togglePause());
    this.input.keyboard.on('keydown-ESC', () => this._togglePause());
  }

  _setupMobileControls() {
    const map = {
      'btn-left':'left', 'btn-right':'right',
      'btn-up':'jump',   'btn-jump':'jump',
      'btn-shoot':'shoot','btn-dash':'dash'
    };
    Object.entries(map).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', e => { e.preventDefault(); this._mobileState[key] = true;  }, { passive: false });
      el.addEventListener('touchend',   e => { e.preventDefault(); this._mobileState[key] = false; }, { passive: false });
    });
  }

  // ─── Pausa ───────────────────────────────────────────────
  _togglePause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      this.physics.pause();
      AudioManager.stopBGM();
      this.scene.launch('PauseScene');
    } else if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.physics.resume();
      AudioManager.playBGM('boss');
      this.scene.stop('PauseScene');
    }
  }

  // ─── Update ──────────────────────────────────────────────
  update(time, delta) {
    if (this.gameState !== 'playing') return;

    const ms   = this._mobileState;
    const prev = this._prevMobile;

    this.cursors.left.isDown  = !!ms.left;
    this.cursors.right.isDown = !!ms.right;
    if (ms.jump  && !prev.jump)  this.keys.Z.isDown = true;
    if (ms.shoot && !prev.shoot) this.keys.X.isDown = true;
    if (ms.dash  && !prev.dash)  this.keys.C.isDown = true;
    this._prevMobile = { ...ms };

    this.player.update(this.cursors, this.keys, delta);

    if (this.boss?.isAlive) this.boss.update(this.player, delta);

    if (this.player.y > this.H + 60) this.player.die();

    // Recarga energía
    const e = this.registry.get('energy');
    if (e < 100) this.registry.set('energy', Math.min(100, e + delta * 0.008));

    if (!ms.jump)  this.keys.Z.isDown = false;
    if (!ms.shoot) this.keys.X.isDown = false;
    if (!ms.dash)  this.keys.C.isDown = false;
  }

  // ─── Eventos ─────────────────────────────────────────────
  _onPlayerDied() {
    const lives = this.registry.get('lives') - 1;
    this.registry.set('lives', lives);

    if (lives <= 0) {
      AudioManager.stopBGM();
      StorageManager.saveHighScore(this.registry.get('score'));
      this.registry.set('showBossBar', false);
      this.time.delayedCall(700, () => {
        this.scene.stop('HUDScene');
        this.scene.start('GameOverScene', { score: this.registry.get('score') });
      });
    } else {
      // Respawn en la izquierda de la arena
      this.time.delayedCall(700, () => {
        const P = this.player;
        P.resetDamageState();
        P.setPosition(80, this.H - 120);
        P.health = P.maxHealth;
        P.body.setVelocity(0, 0);
        this.registry.set('energy', 100);
      });
    }
  }

  _onBossDefeated() {
    this.gameState = 'ending';
    this.registry.set('showBossBar', false);

    const score = this.registry.get('score');
    StorageManager.saveHighScore(score);
    StorageManager.saveLevel(2);
    AudioManager.stopBGM();

    this.cameras.main.flash(500, 255, 200, 0);
    this._showMessage('¡ VICTORIA !', '#ffcc00', 2200);

    this.time.delayedCall(2400, () => {
      this.scene.stop('HUDScene');
      this.scene.start('VictoryScene', { score });
      this.scene.stop('BossScene');
    });
  }

  _collectPowerup(pu) {
    AudioManager.playSFXPickup();
    if (pu.puType === 'life') {
      this.player.health = Math.min(this.player.maxHealth, this.player.health + 2);
      this._showMessage('VIDA +2', '#ff4466');
    } else {
      this.registry.set('energy', Math.min(100, this.registry.get('energy') + 30));
      this._showMessage('ENERGÍA +30', '#00ffcc');
    }
    pu.destroy();
  }

  _showMessage(text, color = '#ffffff', duration = 1600) {
    const msg = this.add.text(this.W/2, this.H * 0.28, text, {
      fontFamily: 'Courier New',
      fontSize:   Math.floor(this.W * 0.048) + 'px',
      color, stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: msg, y: this.H * 0.16, alpha: 0,
      duration, ease: 'Power2',
      onComplete: () => msg.destroy()
    });
  }
}
