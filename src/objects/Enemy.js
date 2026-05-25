/**
 * objects/Enemy.js
 * Enemigos con IA básica.
 * NUEVO: EnemyKeyHolder — oso que suelta llave al morir.
 * NUEVO: Boss — araña mecánica gigante.
 * FIX: takeDamage funciona correctamente.
 */

import AudioManager from '../audio/AudioManager.js';

// ─── Clase base ──────────────────────────────────────────────
class BaseEnemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, health, scoreValue) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.health     = health;
    this.maxHealth  = health;
    this.scoreValue = scoreValue;
    this.isAlive    = true;
    this.isHurt     = false;
    this.gameScene  = scene;

    this.setDepth(4);
  }

  takeDamage(amount = 1) {
    if (!this.isAlive || this.isHurt) return;

    this.health -= amount;
    this.isHurt  = true;

    this.setTint(0xffffff);
    this.gameScene.cameras.main.shake(35, 0.004);

    this.gameScene.time.delayedCall(120, () => {
      if (!this.active) return;
      this.clearTint();
      this.isHurt = false;
    });

    if (this.health <= 0) this._die();
  }

  _die() {
    if (!this.isAlive) return;
    this.isAlive = false;
    AudioManager.playSFXExplosion();

    const s = this.gameScene.registry.get('score');
    this.gameScene.registry.set('score', s + this.scoreValue);

    const frames = ['exp0','exp1','exp2','exp3','exp4'];
    let fi = 0;
    this.gameScene.time.addEvent({
      delay: 55, repeat: 4,
      callback: () => {
        if (!this.gameScene) return;
        this.gameScene.add.image(
          this.x + Phaser.Math.Between(-10,10),
          this.y + Phaser.Math.Between(-10,10),
          frames[fi++]
        ).setDepth(10).setScale(1.1);
      }
    });

    // Drop de power-up (25%)
    if (Math.random() < 0.25) {
      this.gameScene.events.emit('spawnPowerup', this.x, this.y);
    }

    this.setActive(false).setVisible(false);
    if (this.body) this.body.enable = false;
  }
}

// ─── Enemigo Terrestre ───────────────────────────────────────
export class EnemyGround extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy_ground', 3, 200);

    this.body.setSize(28, 30);
    this.body.setOffset(2, 2);

    this.speed      = 70;
    this.facing     = -1;
    this.startX     = x;
    this.patrolDist = 110;
    this.shootTimer = 0;
    this.shootDelay = Phaser.Math.Between(1800, 3200);
    this.alertRange = 260;
    this.alerted    = false;

    this.bullets = scene.physics.add.group({
      defaultKey: 'enemy_bullet', maxSize: 3
    });
  }

  update(player, delta) {
    if (!this.isAlive || !this.active || !this.body) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    this.alerted = dist < this.alertRange;

    if (this.alerted) {
      this.facing = player.x < this.x ? -1 : 1;
      this.setFlipX(this.facing === 1);

      if (dist > 80) this.body.setVelocityX(this.facing * this.speed);
      else           this.body.setVelocityX(0);

      this.shootTimer += delta;
      if (this.shootTimer >= this.shootDelay) {
        this.shootTimer = 0;
        this.shootDelay = Phaser.Math.Between(1500, 3000);
        this._shoot(player);
      }
    } else {
      this.body.setVelocityX(this.facing * this.speed * 0.5);
      if (this.x > this.startX + this.patrolDist) this.facing = -1;
      if (this.x < this.startX - this.patrolDist) this.facing =  1;
      this.setFlipX(this.facing === 1);
    }

    const tick = Math.floor(this.gameScene.time.now / 200) % 2;
    if (this.isAlive) this.setTexture(tick === 0 ? 'enemy_ground' : 'enemy_ground2');

    this.bullets.getChildren().forEach(b => {
      if (!b.active) return;
      b._life = (b._life || 0) + delta;
      if (b.x < -100 || b.x > this.gameScene.scale.width + 600 || b._life > 2200) {
        b.setActive(false).setVisible(false);
      }
    });
  }

  _shoot(player) {
    if (!this.isAlive) return;
    const b = this.bullets.get(this.x, this.y - 8, 'enemy_bullet');
    if (!b) return;
    b.setActive(true).setVisible(true).setDepth(6);
    b.body.reset(this.x, this.y - 8);
    b.body.setAllowGravity(false);
    const ang = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    b.body.setVelocityX(Math.cos(ang) * 190);
    b.body.setVelocityY(Math.sin(ang) * 130);
    b._life = 0;
  }
}

// ─── Enemigo KeyHolder (terrestre que suelta llave) ──────────
// Igual al terrestre pero es más grande, tiene más vida y cuando
// muere emite el evento 'dropKey' para crear la llave en el nivel.
export class EnemyKeyHolder extends EnemyGround {
  constructor(scene, x, y) {
    super(scene, x, y);
    // Sobreescribir stats: más fuerte, vale más puntos
    this.health    = 5;
    this.maxHealth = 5;
    this.scoreValue = 500;
    this.speed = 55;
    // Efecto visual: más grande
    this.setScale(1.25);
    this.setTint(0xffcc00); // tinte dorado para diferenciar
  }

  _die() {
    if (!this.isAlive) return;
    this.isAlive = false;
    AudioManager.playSFXExplosion();

    const s = this.gameScene.registry.get('score');
    this.gameScene.registry.set('score', s + this.scoreValue);

    const frames = ['exp0','exp1','exp2','exp3','exp4'];
    let fi = 0;
    this.gameScene.time.addEvent({
      delay: 55, repeat: 4,
      callback: () => {
        if (!this.gameScene) return;
        this.gameScene.add.image(
          this.x + Phaser.Math.Between(-12, 12),
          this.y + Phaser.Math.Between(-12, 12),
          frames[fi++]
        ).setDepth(10).setScale(1.3);
      }
    });

    // ★ Siempre suelta la llave
    this.gameScene.events.emit('dropKey', this.x, this.y - 10);

    this.setActive(false).setVisible(false);
    if (this.body) this.body.enable = false;
  }
}

// ─── Enemigo Volador ─────────────────────────────────────────
export class EnemyFlying extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy_fly', 2, 300);

    this.body.setSize(28, 22);
    this.body.setOffset(3, 4);
    this.body.setAllowGravity(false);

    this.baseY     = y;
    this.speed     = 95;
    this.facing    = -1;
    this.phase     = 'hover';
    this.hoverT    = 0;
    this.diveTimer = Phaser.Math.Between(2200, 4500);
    this.diveAcc   = 0;
  }

  update(player, delta) {
    if (!this.isAlive || !this.active || !this.body) return;

    this.hoverT += delta;

    switch (this.phase) {
      case 'hover':
        this.body.setVelocityX(this.facing * this.speed);
        this.y = this.baseY + Math.sin(this.hoverT * 0.002) * 22;

        if (this.x > player.x + 280) this.facing = -1;
        if (this.x < player.x - 280) this.facing =  1;
        this.setFlipX(this.facing === 1);

        this.diveTimer -= delta;
        if (this.diveTimer <= 0) {
          this.phase = 'dive';
          this.diveTimer = Phaser.Math.Between(2500, 5000);
          const ang = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
          this.body.setVelocityX(Math.cos(ang) * 310);
          this.body.setVelocityY(Math.sin(ang) * 310);
        }
        break;

      case 'dive':
        this.diveAcc = (this.diveAcc || 0) + delta;
        if (this.diveAcc > 550) { this.diveAcc = 0; this.phase = 'return'; }
        break;

      case 'return':
        const dy = this.baseY - this.y;
        this.body.setVelocityY(dy * 3.5);
        this.body.setVelocityX(this.body.velocity.x * 0.9);
        if (Math.abs(dy) < 6) {
          this.phase = 'hover';
          this.body.setVelocityY(0);
        }
        break;
    }
  }
}

// ─── Boss — Araña Mecánica Gigante ────────────────────────────
export class Boss extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'boss', 30, 5000);

    this.body.setSize(60, 70);
    this.body.setOffset(18, 14);
    this.body.setAllowGravity(false);
    this.setDepth(5);
    this.setScale(1.0);

    this.phase        = 1;
    this.attackTimer  = 0;
    this.attackDelay  = 1400;
    this.startX       = x;
    this.startY       = y;
    this.shakeT       = 0;
    this.legAnimT     = 0;

    this.bullets = scene.physics.add.group({
      defaultKey: 'boss_bullet', maxSize: 14
    });
  }

  update(player, delta) {
    if (!this.isAlive || !this.active || !this.body) return;

    this.shakeT      += delta;
    this.attackTimer += delta;
    this.legAnimT    += delta;

    // Movimiento de araña: balanceo y descenso
    this.x = this.startX + Math.sin(this.shakeT * 0.0008 * this.phase) * 100;
    this.y = this.startY + Math.cos(this.shakeT * 0.0011) * 28
            + Math.sin(this.legAnimT * 0.003) * 10;

    const pct = this.health / this.maxHealth;
    if      (pct < 0.33) this.phase = 3;
    else if (pct < 0.66) this.phase = 2;
    else                  this.phase = 1;

    const delays = [1400, 900, 500];
    if (this.attackTimer >= delays[this.phase - 1]) {
      this.attackTimer = 0;
      this._attack(player);
    }

    // Parpadeo de color según fase
    if (this.phase === 3) {
      const blink = Math.floor(this.shakeT / 200) % 2 === 0;
      this.setTint(blink ? 0xff6600 : 0xff0000);
    } else if (this.phase === 2) {
      this.setTint(0xaa44ff);
    } else {
      this.clearTint();
    }

    this.setFlipX(player.x > this.x);

    this.bullets.getChildren().forEach(b => {
      if (!b.active) return;
      b._life = (b._life || 0) + delta;
      if (b.x < -100 || b.x > this.gameScene.scale.width + 600
          || b.y > this.gameScene.scale.height + 150 || b._life > 3500) {
        b.setActive(false).setVisible(false);
      }
    });
  }

  _attack(player) {
    if (!this.isAlive) return;

    if (this.phase === 1) {
      // Fase 1: disparo en abanico de 3
      for (let i = -1; i <= 1; i++) {
        this.gameScene.time.delayedCall(i * 120 + 120, () => {
          this._spawnBullet(player, 280, i * 0.25);
        });
      }
    } else if (this.phase === 2) {
      // Fase 2: ráfaga de 5 + bala descendente
      for (let i = 0; i < 5; i++) {
        this.gameScene.time.delayedCall(i * 100, () => {
          this._spawnBullet(player, 320, (i-2) * 0.18);
        });
      }
      // Tela de araña (bala lenta descendente)
      this.gameScene.time.delayedCall(200, () => {
        this._spawnWebBullet();
      });
    } else {
      // Fase 3: lluvia de 8 balas en círculo + ráfaga direccional
      for (let i = 0; i < 8; i++) {
        this.gameScene.time.delayedCall(i * 60, () => {
          const ang = (i / 8) * Math.PI * 2;
          const b = this.bullets.get(this.x, this.y, 'boss_bullet');
          if (!b) return;
          b.setActive(true).setVisible(true).setDepth(6);
          b.body.reset(this.x, this.y);
          b.body.setAllowGravity(false);
          b.body.setVelocityX(Math.cos(ang) * 250);
          b.body.setVelocityY(Math.sin(ang) * 250);
          b._life = 0;
        });
      }
      // También ataque dirigido al jugador
      this.gameScene.time.delayedCall(300, () => {
        this._spawnBullet(player, 380, 0);
        this._spawnBullet(player, 380, 0.15);
        this._spawnBullet(player, 380, -0.15);
      });
    }
  }

  _spawnBullet(player, speed, angleOffset = 0) {
    const b = this.bullets.get(this.x, this.y + 20, 'boss_bullet');
    if (!b) return;
    b.setActive(true).setVisible(true).setDepth(6);
    b.body.reset(this.x, this.y + 20);
    b.body.setAllowGravity(false);
    const ang = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y) + angleOffset;
    b.body.setVelocityX(Math.cos(ang) * speed);
    b.body.setVelocityY(Math.sin(ang) * speed);
    b._life = 0;
  }

  _spawnWebBullet() {
    // Bala que cae verticalmente (tela de araña)
    const b = this.bullets.get(this.x, this.y + 10, 'boss_bullet');
    if (!b) return;
    b.setActive(true).setVisible(true).setDepth(6);
    b.body.reset(this.x, this.y + 10);
    b.body.setAllowGravity(false);
    b.body.setVelocityX(0);
    b.body.setVelocityY(160); // cae lento
    b.setTint(0xaaaaff);
    b._life = 0;
  }

  _die() {
    if (!this.isAlive) return;
    this.isAlive = false;
    AudioManager.playSFXExplosion();

    const s = this.gameScene.registry.get('score');
    this.gameScene.registry.set('score', s + this.scoreValue);

    for (let i = 0; i < 12; i++) {
      this.gameScene.time.delayedCall(i * 110, () => {
        if (!this.gameScene) return;
        const frames = ['exp0','exp1','exp2','exp3','exp4'];
        let fi = 0;
        this.gameScene.time.addEvent({
          delay: 55, repeat: 4,
          callback: () => {
            this.gameScene.add.image(
              this.x + Phaser.Math.Between(-55, 55),
              this.y + Phaser.Math.Between(-55, 55),
              frames[fi++ % 5]
            ).setDepth(12).setScale(2.2);
          }
        });
      });
    }

    AudioManager.playSFXVictory();

    this.gameScene.time.delayedCall(1600, () => {
      this.setActive(false).setVisible(false);
      if (this.body) this.body.enable = false;
      this.gameScene.events.emit('bossDefeated');
    });
  }
}
