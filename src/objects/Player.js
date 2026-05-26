/**
 * objects/Player.js
 * FIX DAÑO: sistema de invencibilidad robusto con flag _invincible
 * que se limpia correctamente al respawn.
 */

import AudioManager from '../audio/AudioManager.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {

  constructor(scene, x, y) {
    super(scene, x, y, 'player_idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(24, 26);
    this.body.setOffset(4, 4);
    this.setDepth(5);

    this.facing       = 1;
    this.jumpsLeft    = 2;
    this.isDashing    = false;
    this.dashCooldown = false;
    this.isHurt       = false;
    this.isDead       = false;
    this.isCharging   = false;
    this.chargeTime   = 0;
    this._shootCD     = false;
    this._invincible  = false;
    this._hurtTimer   = null;
    this._invTimer    = null;

    this.maxHealth = 8;
    this.health    = 8;
    this.speed     = 215;
    this.jumpForce = -510;
    this.dashSpeed = 490;

    this.bullets = scene.physics.add.group({
      defaultKey: 'bullet', maxSize: 8, runChildUpdate: false
    });
    this.chargedBullets = scene.physics.add.group({
      defaultKey: 'bullet_charged', maxSize: 2, runChildUpdate: false
    });

    this.gameScene = scene;
  }

  update(cursors, keys, delta) {
    if (this.isDead) return;
    if (this.isHurt) {
      this.body.setVelocityX(this.body.velocity.x * 0.7);
      this._updateSprite();
      this._tickBullets(delta);
      return;
    }

    this._move(cursors, keys);
    this._jump(cursors, keys);
    this._dash(keys);
    this._shoot(keys, delta);
    this._updateSprite();
    this._tickBullets(delta);
  }

  _move(cursors, keys) {
    if (this.isDashing) return;
    if (cursors.left.isDown || keys.A.isDown) {
      this.body.setVelocityX(-this.speed);
      this.facing = -1;
      this.setFlipX(true);
    } else if (cursors.right.isDown || keys.D.isDown) {
      this.body.setVelocityX(this.speed);
      this.facing = 1;
      this.setFlipX(false);
    } else {
      this.body.setVelocityX(this.body.velocity.x * 0.72);
      if (Math.abs(this.body.velocity.x) < 8) this.body.setVelocityX(0);
    }
  }

  _jump(cursors, keys) {
    const pressed = Phaser.Input.Keyboard.JustDown(cursors.up)
      || Phaser.Input.Keyboard.JustDown(keys.Z)
      || Phaser.Input.Keyboard.JustDown(keys.K)
      || Phaser.Input.Keyboard.JustDown(keys.W);

    if (this.body.blocked.down) this.jumpsLeft = 2;

    if (pressed && this.jumpsLeft > 0) {
      this.body.setVelocityY(this.jumpForce);
      this.jumpsLeft--;
      AudioManager.playSFXJump();
    }

    if (!cursors.up.isDown && !keys.Z.isDown && !keys.W.isDown) {
      if (this.body.velocity.y < 0) this.body.setVelocityY(this.body.velocity.y + 35);
    }
  }

  _dash(keys) {
    const pressed = Phaser.Input.Keyboard.JustDown(keys.C)
      || Phaser.Input.Keyboard.JustDown(keys.SHIFT);

    if (!pressed || this.dashCooldown || this.isDashing) return;

    this.isDashing    = true;
    this.dashCooldown = true;
    AudioManager.playSFXDash();

    this.body.setVelocityX(this.facing * this.dashSpeed);
    this.body.setVelocityY(-60);

    this._spawnDashTrail();

    this.gameScene.time.delayedCall(200, () => { this.isDashing = false; });
    this.gameScene.time.delayedCall(750, () => { this.dashCooldown = false; });
  }

  _spawnDashTrail() {
    for (let i = 0; i < 3; i++) {
      this.gameScene.time.delayedCall(i * 45, () => {
        if (!this.scene) return;
        const ghost = this.gameScene.add.image(this.x, this.y, 'dash_trail')
          .setFlipX(this.flipX)
          .setAlpha(0.45 - i * 0.12)
          .setTint(0x00ffaa)
          .setDepth(4);
        this.gameScene.tweens.add({
          targets: ghost, alpha: 0, duration: 180,
          onComplete: () => ghost.destroy()
        });
      });
    }
  }

  _shoot(keys, delta) {
    const held = keys.X.isDown || keys.J.isDown;

    if (held) {
      this.chargeTime += delta;
      this.isCharging  = this.chargeTime > 800;
    }

    const released = Phaser.Input.Keyboard.JustUp(keys.X)
      || Phaser.Input.Keyboard.JustUp(keys.J);

    if (released && this.chargeTime > 0 && !this._shootCD) {
      if (this.chargeTime > 800) {
        this._fireCharged();
      } else {
        this._fireNormal();
      }
      this.chargeTime  = 0;
      this.isCharging  = false;
      this._shootCD    = true;
      this.gameScene.time.delayedCall(160, () => { this._shootCD = false; });
    }

    if (!held) {
      this.chargeTime = 0;
      this.isCharging = false;
    }

    if ((Phaser.Input.Keyboard.JustDown(keys.X) || Phaser.Input.Keyboard.JustDown(keys.J))
        && !this._shootCD) {
      this._fireNormal();
      this.chargeTime = 0;
      this._shootCD   = true;
      this.gameScene.time.delayedCall(160, () => { this._shootCD = false; });
    }
  }

  _fireNormal() {
    if ((this.gameScene.registry.get('energy') || 0) < 2) return;
    const bx = this.x + this.facing * 22;
    const by = this.y - 4;
    const b  = this.bullets.get(bx, by, 'bullet');
    if (!b) return;

    b.setActive(true).setVisible(true).setDepth(6);
    
    // 👇 ESTA ES LA LÍNEA QUE REACTIVA LA FÍSICA PARA QUE VUELVA A MOVERSE
    b.body.enable = true; 
    
    b.body.reset(bx, by);
    b.body.setAllowGravity(false);
    b.body.setVelocityX(this.facing * 640);
    b.body.setVelocityY(0);
    b.setFlipX(this.facing === -1);
    b._life = 0;

    AudioManager.playSFXShoot();

    const e = this.gameScene.registry.get('energy');
    this.gameScene.registry.set('energy', Math.max(0, e - 2));
  }

  _fireCharged() {
    if ((this.gameScene.registry.get('energy') || 0) < 14) return;
    const bx = this.x + this.facing * 24;
    const by = this.y - 4;
    const b  = this.chargedBullets.get(bx, by, 'bullet_charged');
    if (!b) return;

    b.setActive(true).setVisible(true).setDepth(6);
    
    // 👇 REACTIVAR LA FÍSICA AQUÍ TAMBIÉN
    b.body.enable = true; 
    
    b.body.reset(bx, by);
    b.body.setAllowGravity(false);
    b.body.setVelocityX(this.facing * 500);
    b.body.setVelocityY(0);
    b._life   = 0;
    b._damage = 3;

    this.gameScene.cameras.main.flash(80, 0, 200, 120);
    AudioManager.playSFXShoot();

    const e = this.gameScene.registry.get('energy');
    this.gameScene.registry.set('energy', Math.max(0, e - 14));
  }

  // ── FIX DAÑO ─────────────────────────────────────────────
  // Se asegura de que _invincible se limpie correctamente
  // y que los timers anteriores se cancelen antes de crear nuevos.
  takeDamage(amount = 1) {
    if (this._invincible || this.isDead || this.isHurt) return;

    this.health -= amount;
    this.isHurt  = true;
    AudioManager.playSFXHurt();

    this.body.setVelocityY(-180);
    this.body.setVelocityX(-this.facing * 100);
    this.setTexture('player_hurt');
    this.gameScene.cameras.main.shake(120, 0.012);

    if (this.health <= 0) {
      this.health = 0;
      this.die();
      return;
    }

    // ── Hurt: 300ms sin control ───
    if (this._hurtTimer) this._hurtTimer.remove(false);
    this._hurtTimer = this.gameScene.time.delayedCall(300, () => {
      this.isHurt = false;
    });

    // ── Invencibilidad 2s con parpadeo ───
    this._invincible = true;
    if (this._invTimer) this._invTimer.remove(false);
    let tick = 0;
    const BLINKS = 22;
    const blinkEv = this.gameScene.time.addEvent({
      delay: 85,
      repeat: BLINKS - 1,
      callback: () => {
        if (!this.active) return;
        this.setVisible(!this.visible);
        tick++;
        if (tick >= BLINKS - 1) {
          this.setVisible(true);
          this.clearTint();
          this._invincible = false;
        }
      }
    });
    this._invTimer = blinkEv;
  }

  // Limpieza manual al respawn (llamado desde la escena)
  resetDamageState() {
    this.isHurt      = false;
    this.isDead      = false;
    this._invincible = false;
    if (this._hurtTimer) { this._hurtTimer.remove(false); this._hurtTimer = null; }
    if (this._invTimer)  { this._invTimer.remove(false);  this._invTimer  = null; }
    this.setVisible(true);
    this.clearTint();
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.isHurt = false;
    this.setTint(0xff2222);
    this.body.setVelocity(-this.facing * 50, -300);
    this._spawnDeathFX();
    this.gameScene.time.delayedCall(1000, () => {
      this.gameScene.events.emit('playerDied');
    });
  }

  _spawnDeathFX() {
    const frames = ['exp0','exp1','exp2','exp3','exp4'];
    for (let i = 0; i < 5; i++) {
      this.gameScene.time.delayedCall(i * 90, () => {
        if (!this.gameScene) return;
        this.gameScene.add.image(
          this.x + Phaser.Math.Between(-18, 18),
          this.y + Phaser.Math.Between(-18, 18),
          frames[i]
        ).setScale(1.4).setDepth(10);
      });
    }
  }

  _updateSprite() {
    if (this.isDashing) { this.setTexture('player_dash'); return; }
    if (this.isHurt)    { return; }
    if (!this.body.blocked.down) { this.setTexture('player_jump'); return; }
    const moving = Math.abs(this.body.velocity.x) > 20;
    if (moving) {
      const tick = Math.floor(this.gameScene.time.now / 130) % 2;
      this.setTexture(tick === 0 ? 'player_idle' : 'player_run');
    } else {
      this.setTexture('player_idle');
    }
  }

  _tickBullets(delta) {
    const maxX = this.gameScene.physics.world.bounds.width + 200;
    [this.bullets, this.chargedBullets].forEach(group => {
      group.getChildren().forEach(b => {
        if (!b.active) return;
        b._life = (b._life || 0) + delta;
        if (b.x < -100 || b.x > maxX || b._life > 1400) {
          b.setActive(false).setVisible(false);
        }
      });
    });
  }
}
