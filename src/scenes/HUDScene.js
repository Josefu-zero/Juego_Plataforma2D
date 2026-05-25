/**
 * scenes/HUDScene.js
 * Escena de HUD que corre en paralelo a Stage1Scene y BossScene.
 * Instancia el componente ui/HUD y lo actualiza cada 50ms.
 */

import HUD from '../ui/HUD.js';

export default class HUDScene extends Phaser.Scene {
  constructor() { super({ key: 'HUDScene' }); }

  create() {
    this.hud = new HUD(this);

    // Tick de actualización cada 50ms
    this.time.addEvent({
      delay: 50, loop: true,
      callback: () => {
        // Buscar la escena de juego activa
        const gameScene = this.scene.get('Stage1Scene')?.sys.isActive()
          ? this.scene.get('Stage1Scene')
          : this.scene.get('BossScene')?.sys.isActive()
            ? this.scene.get('BossScene')
            : null;

        this.hud.update(this.registry, gameScene);
      }
    });
  }
}
