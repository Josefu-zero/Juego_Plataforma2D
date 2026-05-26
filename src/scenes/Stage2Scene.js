import Player          from '../objects/Player.js';
import { EnemyFlying } from '../objects/Enemy.js'; 
import CollisionHelper from '../physics/CollisionHelper.js';
import AudioManager    from '../audio/AudioManager.js';
import StorageManager  from '../managers/StorageManager.js'; 

const TILE = 32; //

export default class Stage2Scene extends Phaser.Scene {
  constructor() { super({ key: 'Stage2Scene' }); } //

  create() {
    this.gameState = 'playing'; //

    const W = this.scale.width; //
    const H = this.scale.height; //

    this.W = W; //
    this.H = H; //

    // Estado de la puerta
    this.doorOpen = false; //

    const LEVEL_W = W * 2.5; //
    this.LEVEL_W = LEVEL_W; //

    this.physics.world.setBounds(0, 0, LEVEL_W, H + 200); //

    this._buildBackground(LEVEL_W, H);

    this.platforms = this.physics.add.staticGroup(); //
    this.spikes    = this.physics.add.staticGroup(); //
    this._buildLevel(LEVEL_W, H);

    // Ajustada la posición inicial para que el jugador aparezca sobre el piso firme
    this.player = new Player(this, 96, H - 96); //
    this.checkpointX = 96; //
    this.checkpointY = H - 96; //

    this.checkpoints = this.physics.add.staticGroup(); //
    this._buildCheckpoints(H);

    this.enemies = []; //
    this._spawnEnemies();

    // ── Puerta (Ajustada pegada a la pared final) ──────
    this._buildDoor(LEVEL_W, H);

    // FIX: Zona de transición desplazada a la izquierda de la pared para que sea alcanzable al cruzar la puerta
    this.bossZone = this.add.zone(LEVEL_W - 90, H / 2, 50, H);
    this.physics.world.enable(this.bossZone);
    this.bossZone.body.setAllowGravity(false);
    this.bossZone.body.immovable = true;

    // NUEVO: Temporizador cíclico que genera un enemigo volador cada 3 segundos (3000 ms)
    this.flyingSpawnerTimer = this.time.addEvent({
      delay: 3000,
      callback: this._spawnFlyingEnemyDynamic,
      callbackScope: this,
      loop: true
    });

    this.cameras.main.setBounds(0, 0, LEVEL_W, H); //
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1); //
    this.cameras.main.setDeadzone(W * 0.18, H * 0.28); //

    this._mobileState = {}; //
    this._prevMobile  = {}; //

    this._setupCollisions();
    this._setupInput();
    this._setupMobileControls();

    this.events.on('playerDied', this._onPlayerDied, this); //

    AudioManager.playBGM('stage'); //
    this._showMessage('STAGE 2 — THE ABYSS', '#00ffcc', 2000); //
    
    this.cameras.main.fadeIn(600, 0, 0, 0); //
  }

  _buildBackground(LW, H) {
    const g = this.add.graphics().setScrollFactor(0).setDepth(-10); //
    g.fillGradientStyle(0x00020a, 0x00020a, 0x020510, 0x020510, 1); //
    g.fillRect(0, 0, this.W, H); //

    for (let i = 0; i < 100; i++) {
      this.add.rectangle(
        Phaser.Math.Between(0, LW), Phaser.Math.Between(0, H),
        1, 1, 0xffffff, Phaser.Math.FloatBetween(0.1, 0.8)
      ).setScrollFactor(0.05).setDepth(-9); //
    }
  }

  _buildLevel(LW, H) {
    // Muro de contención al INICIO izquierdo para evitar que el jugador retroceda
    for (let y = 0; y < H; y += TILE) {
      this.platforms.create(TILE / 2, y, 'tile_wall')
        .setDisplaySize(TILE, TILE).refreshBody(); //
    }

    // Piso firme al inicio del nivel para que aparezca el jugador (primeros 256 píxeles)
    for (let x = TILE; x < 256; x += TILE) {
      for (let layer = 0; layer < 2; layer++) {
        this.platforms.create(
          x + TILE / 2, H - layer * TILE - TILE / 2, 'tile'
        ).setDisplaySize(TILE, TILE).refreshBody(); //
      }
    }

    // Generamos pinchos en el abismo
    for (let x = 256; x < LW; x += TILE) {
      if (x < LW - 320) {
        this.spikes.create(x + TILE/2, H - TILE/2, 'tile_spike')
          .setDisplaySize(TILE, 16).refreshBody(); //
      }
    }

    // Creamos un piso firme al final del nivel (últimos 320 píxeles)
    for (let x = LW - 320; x < LW; x += TILE) {
      for (let layer = 0; layer < 2; layer++) {
        this.platforms.create(
          x + TILE/2, H - layer * TILE - TILE/2, 'tile'
        ).setDisplaySize(TILE, TILE).refreshBody(); //
      }
    }

    // Muro de contención al final absoluto del mapa
    for (let y = 0; y < H; y += TILE) {
      this.platforms.create(LW - TILE/2, y, 'tile_wall')
        .setDisplaySize(TILE, TILE).refreshBody(); //
    }

    // Plataformas flotantes intermedias
    const platDefs = [
      { x: 350,  y: H - 220, tex: 'platform_sm' }, //
      { x: 550,  y: H - 180, tex: 'platform' },    //
      { x: 750,  y: H - 260, tex: 'platform_sm' }, //
      { x: 950,  y: H - 140, tex: 'platform' }, //
      { x: 1200, y: H - 280, tex: 'platform' },    //
      { x: 1450, y: H - 200, tex: 'platform_sm' }, //
      { x: 1700, y: H - 160, tex: 'platform' } //
    ];

    platDefs.forEach(p => {
      const w = p.tex === 'platform' ? 96 : 64; //
      this.platforms.create(p.x, p.y, p.tex)
        .setDisplaySize(w, 20).refreshBody(); //
    });
  }

  // MODIFICADO: Colocada la puerta completamente pegada al muro final
  _buildDoor(LW, H) {
    // TILE es 32, así que LW - 48 la deja justo al borde del muro de contención final
    const doorX = LW - 48; 
    const doorY = H - 96; //

    this.door = this.physics.add.staticImage(doorX, doorY, 'door_closed'); //
    this.door.setDisplaySize(40, 64).refreshBody(); //
    this.door.setDepth(5); //
    this.door.isOpen = false; //

    this.tweens.add({
      targets: this.door,
      alpha: 0.85,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    }); //
  }

  _tryOpenDoor() {
    if (this.doorOpen) return; //
    this.doorOpen    = true; //
    this.door.isOpen = true; //

    this.door.setTexture('door_open').setDisplaySize(40, 64).refreshBody(); //
    this.tweens.killTweensOf(this.door); //
    this.door.setAlpha(1); //

    // CORRECCIÓN: Usar el método correcto de Phaser para desactivar el cuerpo físico
    // manteniendo la imagen visible en el mapa
    this.door.disableBody(false, false); 

    AudioManager.playSFXCheckpoint(); //
    this._showMessage('¡PUERTA ABIERTA!', '#00ff88', 1800); //

    this.cameras.main.flash(200, 0, 255, 100); //
  }

  _buildCheckpoints(H) {
    const cpDefs = [
      { x: 550,  y: H - 180 }, //
      { x: 1200, y: H - 280 }  //
    ];

    cpDefs.forEach(cpDef => {
      const cp = this.checkpoints.create(cpDef.x, cpDef.y - 28, 'checkpoint')
        .setDisplaySize(20, 36).refreshBody(); //
      cp.activated = false; //
      cp.cpX = cpDef.x; //
      cp.cpY = cpDef.y - 50; //
    });
  }

  _spawnEnemies() {
    const defs = [
      [400, this.H - 220], //
      [600, this.H - 180], //
      [900, this.H - 250], //
      [1100, this.H - 160], //
      [1350, this.H - 240], //
      [1600, this.H - 200]  //
    ];
    
    defs.forEach(([x, y]) => {
      this.enemies.push(new EnemyFlying(this, x, y)); //
    });
  }

  // NUEVO: Genera dinámicamente un enemigo volador adelante del jugador cada 3 segundos
  _spawnFlyingEnemyDynamic() {
    if (this.gameState !== 'playing' || !this.player || this.player.isDead) return;

    // Aparece 400 píxeles por delante del jugador, controlando que no exceda los límites del mapa
    const spawnX = Math.min(this.player.x + 400, this.LEVEL_W - 350);
    
    // Altura aleatoria por encima del abismo para dar dinamismo
    const spawnY = Phaser.Math.Between(this.H - 260, this.H - 140);

    // Evitar que sigan spawneando enemigos si el jugador ya está en la zona segura final
    if (this.player.x > this.LEVEL_W - 360) return;

    const newEnemy = new EnemyFlying(this, spawnX, spawnY);
    this.enemies.push(newEnemy);

    // Enlazar dinámicamente las colisiones para el nuevo enemigo generado
    CollisionHelper.playerBulletsVsEnemy(this, this.player, newEnemy, (bullet, enemy, dmg) => {
      enemy.takeDamage(dmg); //
    });
    CollisionHelper.playerVsEnemy(this, this.player, newEnemy, () => {
      if (!newEnemy.isAlive) return; //
      this.player.takeDamage(1); //
    });
    CollisionHelper.enemyBulletsVsPlayer(this, newEnemy, this.player, () => {
      this.player.takeDamage(1); //
    });
  }

  _setupCollisions() {
    const P = this.player; //

    CollisionHelper.playerVsPlatforms(this, P, this.platforms); //
    CollisionHelper.playerVsSpikes(this, P, this.spikes, () => P.takeDamage(2)); //

    CollisionHelper.playerVsCheckpoints(this, P, this.checkpoints,
      (pl, cp) => {
        if (cp.activated) return; //
        cp.activated = true; //
        cp.setTexture('checkpoint_active').setDisplaySize(20, 36).refreshBody(); //
        this.checkpointX = cp.cpX; //
        this.checkpointY = cp.cpY; //
        this._showMessage('CHECKPOINT!', '#ff4466'); //
        AudioManager.playSFXCheckpoint(); //
        StorageManager.saveLevel(this.registry.get('level')); //
      }
    );

    // NUEVO: Quitamos el collider sólido para que no bloquee al jugador,
    // y hacemos que apenas la toque (overlap), cambie la textura y pase al Boss.
    this.physics.add.overlap(P, this.door, () => {
      if (this.gameState !== 'playing') return; //
      
      // Efecto visual instantáneo de apertura
      this.doorOpen = true;
      this.door.isOpen = true;
      this.door.setTexture('door_open').setDisplaySize(40, 64).refreshBody();
      this.door.disableBody(true, false); // Elimina cualquier física remanente

      // Ir directamente a la escena del jefe
      this._goToBoss(); //
    });

    // Puedes mantener o quitar la bossZone anterior, ya que la puerta ahora hace el trabajo directo
    this.physics.add.overlap(P, this.bossZone, () => {
      if (this.gameState !== 'playing') return; //
      if (!this.doorOpen) return; //
      this._goToBoss(); //
    });

    this.enemies.forEach(e => {
      CollisionHelper.playerBulletsVsEnemy(this, P, e, (bullet, enemy, dmg) => {
        enemy.takeDamage(dmg); //
      });
      CollisionHelper.playerVsEnemy(this, P, e, () => {
        if (!e.isAlive) return; //
        P.takeDamage(1); //
      });
      CollisionHelper.enemyBulletsVsPlayer(this, e, P, () => {
        P.takeDamage(1); //
      });
    });
  }

  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys(); //
    this.keys    = this.input.keyboard.addKeys({
      A:'A', D:'D', W:'W', Z:'Z', X:'X', C:'C', J:'J', K:'K',
      SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT
    }); //

    this.input.keyboard.on('keydown-P',   () => this._togglePause()); //
    this.input.keyboard.on('keydown-ESC', () => this._togglePause()); //
  }

  _setupMobileControls() {
    const map = {
      'btn-left':  'left',  'btn-right': 'right',
      'btn-up':    'jump',  'btn-jump':  'jump',
      'btn-shoot': 'shoot', 'btn-dash':  'dash'
    }; //
    Object.entries(map).forEach(([id, key]) => {
      const el = document.getElementById(id); //
      if (!el) return; //
      el.addEventListener('touchstart', e => { e.preventDefault(); this._mobileState[key] = true;  }, { passive: false }); //
      el.addEventListener('touchend',   e => { e.preventDefault(); this._mobileState[key] = false; }, { passive: false }); //
    });
  }

  _togglePause() {
    if (this.gameState === 'playing') { //
      this.gameState = 'paused'; //
      this.physics.pause(); //
      AudioManager.stopBGM(); //
      this.scene.launch('PauseScene'); //
    } else if (this.gameState === 'paused') { //
      this.gameState = 'playing'; //
      this.physics.resume(); //
      AudioManager.playBGM('stage'); //
      this.scene.stop('PauseScene'); //
    }
  }

  update(time, delta) {
    if (this.gameState === 'paused' || this.gameState === 'transitioning') return; //

    const ms = this._mobileState; //
    this.cursors.left.isDown  = this.cursors.left.isDown || !!ms.left; //
    this.cursors.right.isDown = this.cursors.right.isDown || !!ms.right; //

    const prev = this._prevMobile; //
    if (ms.jump  && !prev.jump)  this.keys.Z.isDown = true; //
    if (ms.shoot && !prev.shoot) this.keys.X.isDown = true; //
    if (ms.dash  && !prev.dash)  this.keys.C.isDown = true; //
    this._prevMobile = { ...ms }; //

    this.player.update(this.cursors, this.keys, delta); //
    this.enemies.forEach(e => { if (e.isAlive) e.update(this.player, delta); }); //

    if (this.player.y > this.H + 60 && !this.player.isDead) { //
      this.player.die(); //
    }

    const e = this.registry.get('energy'); //
    if (e < 100) this.registry.set('energy', Math.min(100, e + delta * 0.012)); //

    if (!ms.jump)  this.keys.Z.isDown = false; //
    if (!ms.shoot) this.keys.X.isDown = false; //
    if (!ms.dash)  this.keys.C.isDown = false; //
  }

  _goToBoss() {
    this.gameState = 'transitioning'; //
    AudioManager.stopBGM(); //
    this.cameras.main.fade(600, 0, 0, 0); //
    this.time.delayedCall(700, () => {
      this.scene.stop('HUDScene'); //
      this.scene.start('BossScene', {
        lives:  this.registry.get('lives'),
        score:  this.registry.get('score'),
        energy: this.registry.get('energy')
      }); //
      this.scene.launch('HUDScene'); //
      this.scene.stop('Stage2Scene'); //
    });
  }

  _onPlayerDied() {
    const lives = this.registry.get('lives') - 1; //
    this.registry.set('lives', lives); //

    if (lives <= 0) {
      AudioManager.stopBGM(); //
      this.time.delayedCall(700, () => {
        this.scene.stop('HUDScene'); //
        this.scene.start('GameOverScene', { score: this.registry.get('score') }); //
      });
    } else {
      this.time.delayedCall(700, () => {
        const P = this.player; //
        P.resetDamageState(); //
        P.setPosition(this.checkpointX, this.checkpointY); //
        P.health = P.maxHealth; //
        P.body.setVelocity(0, 0); //
        this.registry.set('energy', 100); //
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
    ).setOrigin(0.5).setDepth(20); //

    this.tweens.add({
      targets: msg, y: this.H * 0.18, alpha: 0,
      duration, ease: 'Power2',
      onComplete: () => msg.destroy()
    }); //
  }
}