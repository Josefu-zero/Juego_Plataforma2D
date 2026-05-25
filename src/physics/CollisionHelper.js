/**
 * physics/CollisionHelper.js
 * Centraliza la configuración de colisiones y overlaps de Phaser Arcade Physics.
 * Separa la lógica de física de las escenas para mayor modularidad.
 */

const CollisionHelper = {

  /**
   * Configura colisiones del jugador con plataformas/suelo.
   */
  playerVsPlatforms(scene, player, platforms) {
    scene.physics.add.collider(player, platforms);
  },

  /**
   * Configura colisiones de enemigos con plataformas.
   */
  enemiesVsPlatforms(scene, enemies, platforms) {
    enemies.forEach(e => {
      if (e?.body) scene.physics.add.collider(e, platforms);
    });
  },

/**
   * Balas del jugador vs un enemigo individual.
   * onHit(bullet, enemy) — callback cuando impacta.
   */
  playerBulletsVsEnemy(scene, player, enemy, onHit) {
    // Ponemos (en, bullet) para que coincida con lo que envía Phaser (Sprite, Grupo)
    scene.physics.add.overlap(enemy, player.bullets, (en, bullet) => {
      if (!bullet.active || !en.isAlive) return;
      
      bullet.setActive(false).setVisible(false);
      bullet.body.enable = false; // <-- Mira el "Consejo Extra" más abajo
      
      onHit(bullet, en, 1);
    });

    scene.physics.add.overlap(enemy, player.chargedBullets, (en, bullet) => {
      if (!bullet.active || !en.isAlive) return;
      
      bullet.setActive(false).setVisible(false);
      bullet.body.enable = false; 
      
      onHit(bullet, en, bullet._damage || 3);
    });
  },

  /**
   * Balas enemigas vs jugador.
   */
  enemyBulletsVsPlayer(scene, enemy, player, onHit) {
    if (!enemy.bullets) return;

    scene.physics.add.overlap(player, enemy.bullets, (pl, bullet) => {
      if (!bullet.active) return;
      bullet.setActive(false).setVisible(false);
      onHit(pl, bullet);
    });

    // Balas enemigas se destruyen contra plataformas
    scene.physics.add.collider(enemy.bullets, scene.platforms, (bullet) => {
      bullet.setActive(false).setVisible(false);
    });
  },

  /**
   * Contacto cuerpo a cuerpo: jugador toca enemigo.
   */
  playerVsEnemy(scene, player, enemy, onContact) {
    scene.physics.add.overlap(player, enemy, () => {
      if (!enemy.isAlive) return;
      onContact(player, enemy);
    });
  },

  /**
   * Jugador vs checkpoints.
   */
  playerVsCheckpoints(scene, player, checkpoints, onActivate) {
    scene.physics.add.overlap(player, checkpoints, (pl, cp) => {
      if (cp.activated) return;
      onActivate(pl, cp);
    });
  },

  /**
   * Jugador vs power-ups.
   */
  playerVsPowerups(scene, player, powerups, onCollect) {
    scene.physics.add.overlap(player, powerups, (pl, pu) => {
      if (!pu.active) return;
      onCollect(pl, pu);
    });
  },

  /**
   * Jugador vs spikes (kills inmediato).
   */
  playerVsSpikes(scene, player, spikes, onHit) {
    scene.physics.add.overlap(player, spikes, () => onHit(player));
  }
};

export default CollisionHelper;
