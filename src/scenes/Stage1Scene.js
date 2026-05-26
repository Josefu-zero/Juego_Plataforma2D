/**
 * scenes/Stage1Scene.js
 * Stage 1 — Nivel principal.
 * NUEVO: mecánica de llave/puerta — EnemyKeyHolder suelta llave,
 *        la puerta bloquea el avance al boss.
 * FIX: daño del jugador arreglado (invencibilidad + cooldown).
 */

import Player         from '../objects/Player.js';
import { EnemyGround, EnemyFlying, EnemyKeyHolder, EnemyFlyingKeyHolder } from '../objects/Enemy.js';
import CollisionHelper from '../physics/CollisionHelper.js';
import StorageManager  from '../managers/StorageManager.js';
import AudioManager    from '../audio/AudioManager.js';

const TILE = 32;

export default class Stage1Scene extends Phaser.Scene {
  constructor() { super({ key: 'Stage1Scene' }); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W; this.H = H;

    this.registry.set('score',        0);
    this.registry.set('lives',        3);
    this.registry.set('energy',       100);
    this.registry.set('level',        1);
    this.registry.set('showBossBar',  false);
    this.registry.set('hasKey',       false);  // mecánica de llave

    this.gameState      = 'playing';
    this.checkpointX    = 80;
    this._mobileState   = {};
    this._prevMobile    = {};
    this._doorMsgCD     = false;

    // Estado de llave/puerta
    this.playerHasKey = false;
    this.doorOpen     = false;

    const LEVEL_W = W * 3.2;
    this.LEVEL_W = LEVEL_W;

    this.physics.world.setBounds(0, 0, LEVEL_W, H + 200);

    this._buildBackground(LEVEL_W, H);

    this.platforms = this.physics.add.staticGroup();
    this.spikes    = this.physics.add.staticGroup();
    this._buildLevel(LEVEL_W, H);

    this.player = new Player(this, 80, H - 120);

    this.checkpoints = this.physics.add.staticGroup();
    this._buildCheckpoints(H);

    this.powerups = this.physics.add.staticGroup();
    this._placePowerups(H);

    this.enemies = [];
    this._spawnEnemies(LEVEL_W, H);

    // ── Puerta ──────────────────────────────────────────
    this._buildDoor(LEVEL_W, H);

    // ── Zona de transición al Boss (detrás de la puerta) ─
    this.bossZone = this.add.zone(LEVEL_W - 80, H/2, 60, H);
    this.physics.world.enable(this.bossZone);
    this.bossZone.body.setAllowGravity(false);
    this.bossZone.body.immovable = true;

    this.cameras.main.setBounds(0, 0, LEVEL_W, H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(W * 0.18, H * 0.28);

    this._setupCollisions();
    this._setupInput();
    this._setupMobileControls();

    this.events.on('playerDied',   this._onPlayerDied,   this);
    this.events.on('spawnPowerup', this._dropPowerup,    this);
    this.events.on('dropKey',      this._spawnKey,       this);  // ★ NUEVO

    AudioManager.playBGM('stage');
    this._showMessage('STAGE 1 — START!', '#00ffcc', 1400);
  }

  // ─── Fondo ──────────────────────────────────────────────
  _buildBackground(LW, H) {
    const g = this.add.graphics().setScrollFactor(0).setDepth(-10);
    g.fillGradientStyle(0x000510, 0x000510, 0x050a20, 0x050a20, 1);
    g.fillRect(0, 0, this.W, H);

    for (let i = 0; i < 80; i++) {
      this.add.rectangle(
        Phaser.Math.Between(0, LW), Phaser.Math.Between(0, H * 0.65),
        1, 1, 0xffffff, Phaser.Math.FloatBetween(0.1, 0.6)
      ).setScrollFactor(0.05).setDepth(-9);
    }

    const buildingData = [
      [0,70,200],[80,90,290],[180,55,175],[260,95,330],[370,75,245],
      [460,105,360],[575,65,195],[650,85,285],[740,75,260],[830,55,180],
      [920,90,310],[1020,70,240],[1120,100,350],[1240,60,200],[1340,80,270]
    ];
    buildingData.forEach(([bx, bw, bh]) => {
      const g2 = this.add.graphics().setScrollFactor(0.2).setDepth(-8);
      g2.fillStyle(0x0d0d25);
      g2.fillRect(bx, H - bh, bw, bh);
      g2.fillStyle(0x003366);
      g2.fillRect(bx, H - bh, bw, 2);
      for (let wy = H - bh + 10; wy < H - 10; wy += 18) {
        for (let wx = bx + 5; wx < bx + bw - 5; wx += 13) {
          if (Math.random() > 0.45) {
            g2.fillStyle(Math.random() > 0.6 ? 0x1a3a6a : 0x0d1a3a);
            g2.fillRect(wx, wy, 6, 8);
          }
        }
      }
    });
  }

  // ─── Nivel ──────────────────────────────────────────────
  _buildLevel(LW, H) {
    const fossas = [
      { start: 380, end: 450 },
      { start: 860, end: 960 },
      { start: 1500, end: 1620 },
      { start: 2100, end: 2200 }
    ];

    for (let x = 0; x < LW; x += TILE) {
      const inFossa = fossas.some(f => x >= f.start && x < f.end);
      if (!inFossa) {
        for (let layer = 0; layer < 2; layer++) {
          this.platforms.create(
            x + TILE/2, H - layer * TILE - TILE/2, 'tile'
          ).setDisplaySize(TILE, TILE).refreshBody();
        }
      } else {
        this.spikes.create(x + TILE/2, H - TILE/2, 'tile_spike')
          .setDisplaySize(TILE, 16).refreshBody();
      }
    }

    // Paredes
    for (let y = 0; y < H; y += TILE) {
      this.platforms.create(TILE/2, y, 'tile_wall').setDisplaySize(TILE, TILE).refreshBody();
    }
    for (let y = 0; y < H; y += TILE) {
      this.platforms.create(LW - TILE/2, y, 'tile_wall').setDisplaySize(TILE, TILE).refreshBody();
    }

    // Plataformas flotantes
    const platDefs = [
      { x: 240,  y: H-150, tex: 'platform' },
      { x: 360,  y: H-210, tex: 'platform_sm' },
      { x: 490,  y: H-160, tex: 'platform' },
      { x: 620,  y: H-230, tex: 'platform_sm' },
      { x: 750,  y: H-180, tex: 'platform' },
      { x: 880,  y: H-260, tex: 'platform_sm' },
      { x: 1030, y: H-170, tex: 'platform' },
      { x: 1180, y: H-240, tex: 'platform' },
      { x: 1330, y: H-185, tex: 'platform_sm' },
      { x: 1470, y: H-270, tex: 'platform' },
      { x: 1680, y: H-165, tex: 'platform_sm' },
      { x: 1820, y: H-230, tex: 'platform' },
      { x: 1980, y: H-185, tex: 'platform' },
      { x: 2130, y: H-255, tex: 'platform_sm' },
      { x: 2280, y: H-170, tex: 'platform' },
      { x: 2430, y: H-230, tex: 'platform_sm' },
    ];

    platDefs.forEach(p => {
      const w = p.tex === 'platform' ? 96 : 64;
      this.platforms.create(p.x, p.y, p.tex)
        .setDisplaySize(w, 20).refreshBody();
    });

    // Texto de aviso de puerta
    this.add.text(this.LEVEL_W - 320, this.H - 110, '🔑 NECESITAS LA LLAVE', {
      fontFamily: 'Courier New', fontSize: '11px',
      color: '#ffcc00', stroke: '#000000', strokeThickness: 3
    }).setDepth(5);
  }

  // ─── Puerta ─────────────────────────────────────────────
  _buildDoor(LW, H) {
    // La puerta bloquea el paso al boss (posición cerca del final)
    const doorX = LW - 220;
    const doorY = H - 96;

    // Sprite de puerta cerrada (colisionable)
    this.door = this.physics.add.staticImage(doorX, doorY, 'door_closed');
    this.door.setDisplaySize(40, 64).refreshBody();
    this.door.setDepth(5);
    this.door.isOpen = false;

    // Animación sutil de brillo en la puerta
    this.tweens.add({
      targets: this.door,
      alpha: 0.85,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    this.doorX = doorX;
  }

  // ─── Checkpoints ────────────────────────────────────────
  _buildCheckpoints(H) {
    [650, 1300, 1950].forEach(x => {
      const cp = this.checkpoints.create(x, H - 80, 'checkpoint')
        .setDisplaySize(20, 36).refreshBody();
      cp.activated = false;
      cp.cpX = x;
    });
  }

  // ─── Power-ups ──────────────────────────────────────────
  _placePowerups(H) {
    const defs = [
      { x: 240,  y: H-175, type: 'life'   },
      { x: 750,  y: H-205, type: 'energy' },
      { x: 1180, y: H-265, type: 'life'   },
      { x: 1820, y: H-255, type: 'energy' },
      { x: 2130, y: H-280, type: 'life'   },
    ];
    defs.forEach(p => {
      const pu = this.powerups.create(p.x, p.y, `powerup_${p.type}`)
        .setDisplaySize(20, 20).refreshBody();
      pu.puType = p.type;
      this.tweens.add({
        targets: pu, y: p.y - 8,
        duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    });
  }

  // ─── Enemigos ────────────────────────────────────────────
  _spawnEnemies(LW, H) {
    const defs = [
      ['g', 340,  H-100], ['g', 580,  H-100], ['f', 500,  H-210],
      ['g', 800,  H-100], ['f', 900,  H-230], ['g', 1080, H-100],
      ['g', 1240, H-100], ['f', 1200, H-210], ['g', 1430, H-100],
      ['f', 1520, H-240], ['g', 1720, H-100], ['g', 1860, H-100],
      ['f', 1850, H-220], ['g', 2030, H-100], ['f', 2140, H-210],
      ['g', 2300, H-100], ['g', 2420, H-100], ['f', 2380, H-230],
      
      // ELIMINAMOS AL TERRESTRE
      // ['k', 2150, H-100], 
      
      // ★ AÑADIMOS AL NUEVO VOLADOR (La 'Y' es más alta: H-250)
      ['kf', 2150, H-250],
    ];
    defs.forEach(([t, x, y]) => {
      let e;
      if (t === 'g')      e = new EnemyGround(this, x, y);
      else if (t === 'f') e = new EnemyFlying(this, x, y);
      else if (t === 'k') e = new EnemyKeyHolder(this, x, y);
      else if (t === 'kf') e = new EnemyFlyingKeyHolder(this, x, y); // <-- NUEVA LÍNEA
      this.enemies.push(e);
    });
    }

  // ─── Spawn de la llave ───────────────────────────────────
  _spawnKey(x, y) {
    if (this.keyItem) return; // Solo una llave
    this.keyItem = this.physics.add.staticImage(x, y, 'key_item');
    this.keyItem.setDisplaySize(20, 20).refreshBody();
    this.keyItem.setDepth(6);

    // Animación flotante
    this.tweens.add({
      targets: this.keyItem, y: y - 10,
      duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Brillo dorado
    this.tweens.add({
      targets: this.keyItem,
      alpha: 0.6,
      duration: 300, yoyo: true, repeat: -1
    });

    // Configurar overlap con el jugador
    this.physics.add.overlap(this.player, this.keyItem, () => {
      this._collectKey();
    });

    this._showMessage('¡LLAVE ENCONTRADA!', '#ffcc00', 1600);
  }

  _collectKey() {
    if (this.playerHasKey || !this.keyItem?.active) return;
    this.playerHasKey = true;
    this.registry.set('hasKey', true);
    AudioManager.playSFXPickup();
    this._showMessage('🔑 LLAVE RECOGIDA — Abre la puerta!', '#ffcc00', 2000);

    // Destruir sprite de llave
    this.keyItem.destroy();
    this.keyItem = null;

    // Indicador visual de que tienes la llave en el HUD
    this.events.emit('keyCollected');
  }

  // ─── Abrir puerta ───────────────────────────────────────
  _tryOpenDoor() {
    if (this.doorOpen || !this.playerHasKey) {
      if (!this.playerHasKey && !this._doorMsgCD) {
        this._doorMsgCD = true;
        this._showMessage('¡Necesitas la LLAVE!', '#ff4444', 1200);
        this.time.delayedCall(1400, () => { this._doorMsgCD = false; });
      }
      return;
    }
    this.doorOpen      = true;
    this.door.isOpen   = true;
    this.playerHasKey  = false;

    // Animar apertura
    this.door.setTexture('door_open').setDisplaySize(40, 64).refreshBody();
    this.tweens.killTweensOf(this.door);
    this.door.setAlpha(1);

    // Desactivar colisión de la puerta
    this.door.body.enable = false;
    if (this._doorCollider) {
      this.physics.world.removeCollider(this._doorCollider);
      this._doorCollider = null;
    }

    AudioManager.playSFXCheckpoint();
    this._showMessage('¡PUERTA ABIERTA!', '#00ff88', 1800);

    // Flash de entrada
    this.cameras.main.flash(200, 0, 255, 100);
  }

  // ─── Colisiones ─────────────────────────────────────────
  _setupCollisions() {
    const P = this.player;

    CollisionHelper.playerVsPlatforms(this, P, this.platforms);

    // 👇 MODIFICACIÓN AQUÍ: Filtramos para ignorar a los EnemyFlying
    // Los enememigos voladores no colisionan con el suelo, solo con el jugador y sus balas
    const groundEnemies = this.enemies.filter(e => !(e instanceof EnemyFlying));
    CollisionHelper.enemiesVsPlatforms(this, groundEnemies, this.platforms);
    
    this.enemies.forEach(e => {
      // ✅ FIX DAÑO: balas del jugador → enemigo
      CollisionHelper.playerBulletsVsEnemy(this, P, e, (bullet, enemy, dmg) => {
        enemy.takeDamage(dmg);
      });

      // Contacto cuerpo
      CollisionHelper.playerVsEnemy(this, P, e, () => {
        if (!e.isAlive) return;
        P.takeDamage(1);
      });

      // Balas enemigas → jugador
      CollisionHelper.enemyBulletsVsPlayer(this, e, P, () => {
        P.takeDamage(1);
      });
    });

    // Checkpoints
    CollisionHelper.playerVsCheckpoints(this, P, this.checkpoints,
      (pl, cp) => {
        cp.activated = true;
        cp.setTexture('checkpoint_active').setDisplaySize(20, 36).refreshBody();
        this.checkpointX = cp.cpX;
        this._showMessage('CHECKPOINT!', '#ff4466');
        AudioManager.playSFXCheckpoint();
        StorageManager.saveLevel(this.registry.get('level'));
      }
    );

    // Power-ups
    CollisionHelper.playerVsPowerups(this, P, this.powerups,
      (pl, pu) => this._collectPowerup(pu)
    );

    // Spikes
    CollisionHelper.playerVsSpikes(this, P, this.spikes, () => P.takeDamage(2));

    // Puerta — colisión física (bloquea) + overlap para abrir
    this._doorCollider = this.physics.add.collider(P, this.door);
    this.physics.add.overlap(P, this.door, () => {
      if (!this.door.isOpen && !this.doorOpen) {
        this._tryOpenDoor();
      }
    });

    // Zona de transición al Boss (solo si puerta abierta)
    this.physics.add.overlap(P, this.bossZone, () => {
      if (this.gameState !== 'playing') return;
      if (!this.doorOpen) {
        this._showMessage('¡La puerta sigue cerrada!', '#ff4444', 1000);
        return;
      }
      this._goToStage2();
    });
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
    this.input.keyboard.on('keydown-B', (event) => {
      if (!event.ctrlKey || this.gameState !== 'playing') return;
      event.preventDefault();
      this._goToBoss();
    });
  }

  _setupMobileControls() {
    const map = {
      'btn-left':  'left',  'btn-right': 'right',
      'btn-up':    'jump',  'btn-jump':  'jump',
      'btn-shoot': 'shoot', 'btn-dash':  'dash'
    };
    Object.entries(map).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', e => { e.preventDefault(); this._mobileState[key] = true;  }, { passive: false });
      el.addEventListener('touchend',   e => { e.preventDefault(); this._mobileState[key] = false; }, { passive: false });
    });
  }

  _togglePause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      this.physics.pause();
      AudioManager.stopBGM();
      this.scene.launch('PauseScene');
    } else if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.physics.resume();
      AudioManager.playBGM('stage');
      this.scene.stop('PauseScene');
    }
  }

  // ─── Update ──────────────────────────────────────────────
  update(time, delta) {
    if (this.gameState !== 'playing') return;

    const ms = this._mobileState;
    // MODIFICACIÓN AQUÍ: Combinar teclado y móvil de forma segura
    this.cursors.left.isDown  = this.cursors.left.isDown || !!ms.left;
    this.cursors.right.isDown = this.cursors.right.isDown || !!ms.right;

    const prev = this._prevMobile;
    if (ms.jump  && !prev.jump)  this.keys.Z.isDown = true;
    if (ms.shoot && !prev.shoot) this.keys.X.isDown = true;
    if (ms.dash  && !prev.dash)  this.keys.C.isDown = true;
    this._prevMobile = { ...ms };

    this.player.update(this.cursors, this.keys, delta);
    this.enemies.forEach(e => { if (e.isAlive) e.update(this.player, delta); });

    if (this.player.y > this.H + 60) this.player.die();

    const e = this.registry.get('energy');
    if (e < 100) this.registry.set('energy', Math.min(100, e + delta * 0.012));

    if (!ms.jump)  this.keys.Z.isDown = false;
    if (!ms.shoot) this.keys.X.isDown = false;
    if (!ms.dash)  this.keys.C.isDown = false;
  }

  _goToBoss() {
    this.gameState = 'transitioning';
    AudioManager.stopBGM();
    this.cameras.main.fade(600, 0, 0, 0);
    this.time.delayedCall(700, () => {
      this.scene.stop('HUDScene');
      this.scene.start('BossScene', {
        lives:  this.registry.get('lives'),
        score:  this.registry.get('score'),
        energy: this.registry.get('energy')
      });
      this.scene.launch('HUDScene');
      this.scene.stop('Stage1Scene');
    });
  }

    _goToStage2() {
    this.gameState = 'transitioning';
    AudioManager.stopBGM();
    this.cameras.main.fade(600, 0, 0, 0);
    this.time.delayedCall(700, () => {
      this.scene.stop('HUDScene');
      this.scene.start('Stage2Scene', {
        lives:  this.registry.get('lives'),
        score:  this.registry.get('score'),
        energy: this.registry.get('energy')
      });
      this.scene.launch('HUDScene');
      this.scene.stop('Stage1Scene');
    });
  }

  _onPlayerDied() {
    const lives = this.registry.get('lives') - 1;
    this.registry.set('lives', lives);

    if (lives <= 0) {
      AudioManager.stopBGM();
      StorageManager.saveHighScore(this.registry.get('score'));
      this.time.delayedCall(700, () => {
        this.scene.stop('HUDScene');
        this.scene.start('GameOverScene', { score: this.registry.get('score') });
      });
    } else {
      this.time.delayedCall(700, () => {
        const P = this.player;
        P.resetDamageState();
        P.setPosition(this.checkpointX, this.H - 120);
        P.health = P.maxHealth;
        P.body.setVelocity(0, 0);
        this.registry.set('energy', 100);
      });
    }
  }

  _collectPowerup(pu) {
    AudioManager.playSFXPickup();
    if (pu.puType === 'life') {
      this.player.health = Math.min(this.player.maxHealth, this.player.health + 2);
      this._showMessage('VIDA +2', '#ff4466');
    } else {
      this.registry.set('energy', Math.min(100, this.registry.get('energy') + 25));
      this._showMessage('ENERGÍA +25', '#00ffcc');
    }
    pu.destroy();
  }

  _dropPowerup(x, y) {
    if (Math.random() > 0.5) return;
    const type = Math.random() > 0.5 ? 'life' : 'energy';
    const pu = this.powerups.create(x, y - 16, `powerup_${type}`)
      .setDisplaySize(20, 20).refreshBody();
    pu.puType = type;
    this.time.delayedCall(5000, () => { if (pu?.active) pu.destroy(); });
  }

  _showMessage(text, color = '#ffffff', duration = 1600) {
    const msg = this.add.text(
      this.cameras.main.scrollX + this.W/2,
      this.H * 0.28, text, {
        fontFamily: 'Courier New',
        fontSize:   Math.floor(this.W * 0.038) + 'px',
        color, stroke: '#000000', strokeThickness: 4
      }
    ).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: msg, y: this.H * 0.18, alpha: 0,
      duration, ease: 'Power2',
      onComplete: () => msg.destroy()
    });
  }
}
