/**
 * main.js — Punto de entrada del juego MEGA X.
 * Configura Phaser.Game y registra todas las escenas en orden.
 *
 * Flujo de escenas:
 *   BootScene → PreloadScene → MenuScene
 *   MenuScene → Stage1Scene + HUDScene
 *   Stage1Scene → BossScene + HUDScene
 *   BossScene → VictoryScene
 *   Cualquier escena → GameOverScene / PauseScene
 */

import Phaser from 'phaser';

// Exponer Phaser globalmente (las clases hijas lo usan sin re-importar)
window.Phaser = Phaser;

import BootScene     from './scenes/BootScene.js';
import PreloadScene  from './scenes/PreloadScene.js';
import MenuScene     from './scenes/MenuScene.js';
import Stage1Scene   from './scenes/Stage1Scene.js';
import Stage2Scene   from './scenes/Stage2Scene.js';
import BossScene     from './scenes/BossScene.js';
import HUDScene      from './scenes/HUDScene.js';
import PauseScene    from './scenes/PauseScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene  from './scenes/VictoryScene.js';

const isMobile = window.innerWidth <= 820;
const GAME_W   = isMobile ? Math.min(window.innerWidth,  480) : 800;
const GAME_H   = isMobile ? Math.min(window.innerHeight - 130, 380) : 480;

const config = {
  type: Phaser.AUTO,
  width:  GAME_W,
  height: GAME_H,
  parent: 'game-container',
  backgroundColor: '#0a0a1a',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 900 },
      debug: false
    }
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    Stage1Scene,
    Stage2Scene,
    BossScene,
    HUDScene,
    PauseScene,
    GameOverScene,
    VictoryScene
  ]
};

window.game = new Phaser.Game(config);
