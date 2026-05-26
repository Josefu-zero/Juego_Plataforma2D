import Player          from '../objects/Player.js';
import { EnemyFlying } from '../objects/Enemy.js'; // Solo importamos el volador
import CollisionHelper from '../physics/CollisionHelper.js';
import AudioManager    from '../audio/AudioManager.js';

export default class Stage2Scene extends Phaser.Scene {
  constructor() { super({ key: 'Stage2Scene' }); }

  create() {
    // 1. Establecer el estado inicial para que el update() funcione correctamente
    this.gameState = 'playing'; 

    const W = this.scale.width;
    const H = this.scale.height;

    // Puedes hacer que este nivel sea más corto o más largo ajustando LEVEL_W
    const LEVEL_W = W * 2.5; 
    this.LEVEL_W = LEVEL_W;

    // Limites del mundo (el +200 abajo permite que el jugador caiga antes de morir)
    this.physics.world.setBounds(0, 0, LEVEL_W, H + 200);

    this._buildBackground(LEVEL_W, H);

    this.platforms = this.physics.add.staticGroup();
    this.spikes    = this.physics.add.staticGroup(); // Por si quieres añadir pinchos flotantes
    this._buildLevel(LEVEL_W, H);

    // Aparecemos al jugador sobre la primera plataforma
    this.player = new Player(this, 100, H - 200);
    this.checkpointX = 100; // Checkpoint inicial

    this.enemies = [];
    this._spawnEnemies();

    this.cameras.main.setBounds(0, 0, LEVEL_W, H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(W * 0.18, H * 0.28);

    this._mobileState = {};
    this._prevMobile  = {};

    this._setupCollisions();
    this._setupInput();
    this._setupMobileControls();

    this.events.on('playerDied', this._onPlayerDied, this);

    AudioManager.playBGM('stage');
    this._showMessage('STAGE 2 — THE ABYSS', '#00ffcc', 2000);
    // 2. Hacer que la cámara aparezca progresivamente desde el negro
    this.cameras.main.fadeIn(600, 0, 0, 0); 
  
  }

  _buildBackground(LW, H) {
    // Fondo oscuro
    const g = this.add.graphics().setScrollFactor(0).setDepth(-10);
    g.fillGradientStyle(0x00020a, 0x00020a, 0x020510, 0x020510, 1);
    g.fillRect(0, 0, this.W, H);

    // Estrellas/partículas de fondo
    for (let i = 0; i < 100; i++) {
      this.add.rectangle(
        Phaser.Math.Between(0, LW), Phaser.Math.Between(0, H),
        1, 1, 0xffffff, Phaser.Math.FloatBetween(0.1, 0.8)
      ).setScrollFactor(0.05).setDepth(-9);
    }
  }

  _buildLevel(LW, H) {
    // ⚠️ AQUÍ ESTÁ LA MAGIA: No hay ciclo "for" creando suelo.
    // Solo definimos posiciones específicas (x, y) para plataformas flotantes.
    const platDefs = [
      { x: 100,  y: H - 150, tex: 'platform' },
      { x: 300,  y: H - 220, tex: 'platform_sm' },
      { x: 500,  y: H - 180, tex: 'platform' },
      { x: 750,  y: H - 260, tex: 'platform_sm' },
      { x: 950,  y: H - 140, tex: 'platform' },
      { x: 1200, y: H - 280, tex: 'platform' },
      { x: 1450, y: H - 200, tex: 'platform_sm' },
      { x: 1700, y: H - 160, tex: 'platform' },
    ];

    platDefs.forEach(p => {
      const w = p.tex === 'platform' ? 96 : 64;
      this.platforms.create(p.x, p.y, p.tex)
        .setDisplaySize(w, 20).refreshBody();
    });
  }

  _spawnEnemies() {
    // Coordenadas Y ajustadas para que siempre aparezcan dentro de la pantalla
    const defs = [
      [400, this.H - 220], 
      [600, this.H - 180], 
      [900, this.H - 250],
      [1100, this.H - 160],
      [1350, this.H - 240],
      [1600, this.H - 200]
    ];
    
    defs.forEach(([x, y]) => {
      this.enemies.push(new EnemyFlying(this, x, y));
    });
  }

  _setupCollisions() {
    const P = this.player;

    // Solo el jugador choca con las plataformas
    CollisionHelper.playerVsPlatforms(this, P, this.platforms);
    // NOTA: No llamamos a enemiesVsPlatforms porque los voladores deben atravesar el escenario

    this.enemies.forEach(e => {
      CollisionHelper.playerBulletsVsEnemy(this, P, e, (bullet, enemy, dmg) => {
        enemy.takeDamage(dmg);
      });
      CollisionHelper.playerVsEnemy(this, P, e, () => {
        if (!e.isAlive) return;
        P.takeDamage(1);
      });
      CollisionHelper.enemyBulletsVsPlayer(this, e, P, () => {
        P.takeDamage(1);
      });
    });
  }

  // ─── Input y Update (iguales a tu Stage1) ───────────────
  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys    = this.input.keyboard.addKeys({
      A:'A', D:'D', W:'W', Z:'Z', X:'X', C:'C', J:'J', K:'K', // <-- AÑADIDA LA 'K'
      SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT
    });

    // Añadir controles de pausa para mantener consistencia
    this.input.keyboard.on('keydown-P',   () => this._togglePause());
    this.input.keyboard.on('keydown-ESC', () => this._togglePause());
  }

  _setupMobileControls() {
    // Igual a Stage1
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

  update(time, delta) {
    if (this.gameState === 'paused' || this.gameState === 'transitioning') return;

    const ms = this._mobileState;
    this.cursors.left.isDown  = this.cursors.left.isDown || !!ms.left;
    this.cursors.right.isDown = this.cursors.right.isDown || !!ms.right;

    const prev = this._prevMobile;
    if (ms.jump  && !prev.jump)  this.keys.Z.isDown = true;
    if (ms.shoot && !prev.shoot) this.keys.X.isDown = true;
    if (ms.dash  && !prev.dash)  this.keys.C.isDown = true;
    this._prevMobile = { ...ms };

    this.player.update(this.cursors, this.keys, delta);
    this.enemies.forEach(e => { if (e.isAlive) e.update(this.player, delta); });

    // ⚠️ LA MECÁNICA DEL ABISMO: Si el jugador cae por debajo de la pantalla, muere.
    if (this.player.y > this.H + 60 && !this.player.isDead) {
      this.player.health = 0; // <-- Forzar vida a 0 para que el HUD reaccione
      this.player.die();
    }

    const e = this.registry.get('energy');
    if (e < 100) this.registry.set('energy', Math.min(100, e + delta * 0.012));

    if (!ms.jump)  this.keys.Z.isDown = false;
    if (!ms.shoot) this.keys.X.isDown = false;
    if (!ms.dash)  this.keys.C.isDown = false;
  }

  _onPlayerDied() {
    const lives = this.registry.get('lives') - 1;
    this.registry.set('lives', lives);

    if (lives <= 0) {
      AudioManager.stopBGM();
      this.time.delayedCall(700, () => {
        this.scene.stop('HUDScene');
        this.scene.start('GameOverScene', { score: this.registry.get('score') });
      });
    } else {
      this.time.delayedCall(700, () => {
        const P = this.player;
        P.resetDamageState();
        // Reaparece en la altura de la plataforma inicial
        P.setPosition(this.checkpointX, this.H - 200); 
        P.health = P.maxHealth;
        P.body.setVelocity(0, 0);
        this.registry.set('energy', 100);
      });
    }
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