/**
 * managers/GraphicsFactory.js
 * Genera todas las texturas del juego proceduralmente con Canvas 2D.
 * Assets completamente rediseñados (jugador, boss, tiles, powerups, items).
 */

const W1 = '#ffffff';
const B1 = '#000000';
const A1 = '#00ccff';   // azul cian (jugador)
const A2 = '#ff3333';   // rojo (enemigos)
const GR = '#888888';

const GF = {

  createAll(scene) {
    this.s = scene;
    this._player();
    this._bullets();
    this._enemies();
    this._boss();
    this._tiles();
    this._backgrounds();
    this._powerups();
    this._fx();
    this._ui();
    this._items();  // llave, puerta, ruby
  },

  _t(key, w, h, fn) {
    if (this.s.textures.exists(key)) return;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    fn(c.getContext('2d'));
    this.s.textures.addCanvas(key, c);
  },

  _bitmap(ctx, grid, x0, y0, px, fg = W1, bg = null) {
    grid.forEach((row, r) => {
      [...row].forEach((ch, c) => {
        if (ch === '1') {
          ctx.fillStyle = fg;
          ctx.fillRect(x0 + c * px, y0 + r * px, px, px);
        } else if (bg && ch === '0') {
          ctx.fillStyle = bg;
          ctx.fillRect(x0 + c * px, y0 + r * px, px, px);
        }
      });
    });
  },

  // ─── JUGADOR — suit futurista verde neón ─────────────────
  _player() {
    const drawPlayer = (ctx, legFlip, color, helmetColor) => {
      ctx.fillStyle = B1;
      ctx.fillRect(0, 0, 32, 32);
      // Cabeza
      ctx.fillStyle = helmetColor || '#00cc88';
      ctx.fillRect(10, 2, 12, 10);
      // Visera
      ctx.fillStyle = '#aaffee';
      ctx.fillRect(11, 4, 10, 5);
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(12, 5, 8, 3);
      // Cuello
      ctx.fillStyle = '#008855';
      ctx.fillRect(13, 12, 6, 2);
      // Torso
      ctx.fillStyle = color || '#00aa66';
      ctx.fillRect(8, 14, 16, 10);
      // Pecho detalle
      ctx.fillStyle = '#00ffaa';
      ctx.fillRect(11, 15, 3, 3);
      ctx.fillRect(18, 15, 3, 3);
      ctx.fillStyle = '#004433';
      ctx.fillRect(14, 15, 4, 4);
      // Brazo izquierdo
      ctx.fillStyle = '#008855';
      ctx.fillRect(4, 14, 4, 8);
      ctx.fillStyle = '#00ccaa';
      ctx.fillRect(4, 20, 5, 3); // cañón
      ctx.fillStyle = '#00ffee';
      ctx.fillRect(3, 21, 2, 2);
      // Brazo derecho
      ctx.fillStyle = '#008855';
      ctx.fillRect(24, 14, 4, 8);
      // Cintura
      ctx.fillStyle = '#005533';
      ctx.fillRect(9, 24, 14, 3);
      // Piernas
      if (!legFlip) {
        ctx.fillStyle = '#00aa66';
        ctx.fillRect(10, 27, 5, 4);
        ctx.fillRect(17, 27, 5, 4);
        ctx.fillStyle = '#005533';
        ctx.fillRect(10, 30, 5, 2);
        ctx.fillRect(17, 30, 5, 2);
      } else {
        ctx.fillStyle = '#00aa66';
        ctx.fillRect(9, 27, 5, 4);
        ctx.fillRect(18, 27, 5, 4);
        ctx.fillStyle = '#005533';
        ctx.fillRect(9, 30, 5, 2);
        ctx.fillRect(18, 30, 5, 2);
      }
    };

    this._t('player_idle', 32, 32, ctx => drawPlayer(ctx, false, '#00aa66', '#00cc88'));
    this._t('player_run', 32, 32, ctx => drawPlayer(ctx, true, '#00aa66', '#00cc88'));
    this._t('player_jump', 32, 32, ctx => {
      drawPlayer(ctx, false, '#00aa66', '#00cc88');
      // Efecto de salto — pequeño aura
      ctx.fillStyle = 'rgba(0,255,180,0.15)';
      ctx.fillRect(4, 24, 24, 8);
    });
    this._t('player_dash', 36, 28, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0, 0, 36, 28);
      ctx.fillStyle = 'rgba(0,200,150,0.25)';
      ctx.fillRect(0, 2, 12, 24);
      drawPlayer(ctx, false, '#00cc88', '#00ffaa');
    });
    this._t('player_hurt', 32, 32, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0, 0, 32, 32);
      // igual pero rojo
      ctx.fillStyle = '#cc2200';
      ctx.fillRect(10, 2, 12, 10);
      ctx.fillStyle = '#ff6644';
      ctx.fillRect(11, 4, 10, 5);
      ctx.fillStyle = '#882200';
      ctx.fillRect(8, 14, 16, 10);
      ctx.fillStyle = '#882200';
      ctx.fillRect(4, 14, 4, 8);
      ctx.fillRect(24, 14, 4, 8);
      ctx.fillRect(9, 24, 14, 3);
      ctx.fillRect(10, 27, 5, 4);
      ctx.fillRect(17, 27, 5, 4);
    });
  },

  // ─── BALAS ───────────────────────────────────────────────
  _bullets() {
    this._t('bullet', 14, 6, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0, 0, 14, 6);
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(1, 2, 10, 2);
      ctx.fillStyle = '#00aaff';
      ctx.fillRect(2, 1, 8, 4);
      ctx.fillStyle = W1;
      ctx.fillRect(10, 2, 3, 2);
    });

    this._t('bullet_charged', 22, 22, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0, 0, 22, 22);
      // Bola de energía verde
      ctx.fillStyle = '#00ffaa';
      ctx.beginPath(); ctx.arc(11, 11, 9, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#00ccff';
      ctx.beginPath(); ctx.arc(11, 11, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = W1;
      ctx.beginPath(); ctx.arc(9, 8, 3, 0, Math.PI*2); ctx.fill();
    });

    this._t('enemy_bullet', 10, 6, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0, 0, 10, 6);
      ctx.fillStyle = A2;
      ctx.fillRect(1, 2, 7, 2);
      ctx.fillStyle = '#ff8866';
      ctx.fillRect(2, 1, 5, 4);
    });

    this._t('boss_bullet', 16, 16, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#ff6600';
      ctx.beginPath(); ctx.arc(8, 8, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath(); ctx.arc(8, 8, 3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = W1;
      ctx.fillRect(7, 7, 2, 2);
    });

    // Bala enemigo key-holder (naranja especial)
    this._t('key_bullet', 10, 6, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0, 0, 10, 6);
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(1, 2, 7, 2);
      ctx.fillStyle = '#ffee44';
      ctx.fillRect(2, 1, 5, 4);
    });
  },

  // ─── ENEMIGOS (terrestre y volador mejorados) ─────────────
  _enemies() {
    // Enemigo terrestre — oso mecánico (sin cambios de comportamiento)
    const drawBear = (ctx, walkFrame) => {
      ctx.fillStyle = B1; ctx.fillRect(0,0,32,32);
      // Cabeza
      ctx.fillStyle = '#cc2200';
      ctx.fillRect(8, 2, 16, 14);
      // Orejas
      ctx.fillStyle = '#aa1100';
      ctx.fillRect(6, 2, 4, 4);
      ctx.fillRect(22, 2, 4, 4);
      // Interior orejas
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(7, 3, 2, 2);
      ctx.fillRect(23, 3, 2, 2);
      // Ojos mecánicos
      ctx.fillStyle = '#ffee00';
      ctx.fillRect(10, 6, 4, 4);
      ctx.fillRect(18, 6, 4, 4);
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(11, 7, 2, 2);
      ctx.fillRect(19, 7, 2, 2);
      // Hocico
      ctx.fillStyle = '#881100';
      ctx.fillRect(12, 12, 8, 4);
      ctx.fillStyle = '#ff6666';
      ctx.fillRect(13, 13, 2, 2);
      ctx.fillRect(17, 13, 2, 2);
      // Cuerpo
      ctx.fillStyle = '#aa1100';
      ctx.fillRect(6, 16, 20, 10);
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(12, 17, 8, 4);
      ctx.fillStyle = '#660000';
      ctx.fillRect(7, 17, 4, 8);
      ctx.fillRect(21, 17, 4, 8);
      // Piernas
      if (!walkFrame) {
        ctx.fillStyle = '#881100';
        ctx.fillRect(8, 26, 6, 6);
        ctx.fillRect(18, 26, 6, 6);
        ctx.fillStyle = '#440000';
        ctx.fillRect(8, 30, 6, 2);
        ctx.fillRect(18, 30, 6, 2);
      } else {
        ctx.fillStyle = '#881100';
        ctx.fillRect(7, 26, 6, 6);
        ctx.fillRect(19, 26, 6, 6);
        ctx.fillStyle = '#440000';
        ctx.fillRect(7, 30, 6, 2);
        ctx.fillRect(19, 30, 6, 2);
      }
    };
    this._t('enemy_ground', 32, 32, ctx => drawBear(ctx, false));
    this._t('enemy_ground2', 32, 32, ctx => drawBear(ctx, true));

    // Enemigo volador — abeja mecánica
    this._t('enemy_fly', 34, 30, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0,0,34,30);
      // Alas
      ctx.fillStyle = 'rgba(100,200,255,0.6)';
      ctx.fillRect(2, 6, 10, 6);
      ctx.fillRect(22, 6, 10, 6);
      ctx.fillStyle = 'rgba(100,200,255,0.3)';
      ctx.fillRect(2, 10, 12, 4);
      ctx.fillRect(20, 10, 12, 4);
      // Cuerpo (rayas)
      const stripeColors = ['#ff8800','#111111','#ff8800','#111111','#ff8800'];
      stripeColors.forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.fillRect(10, 8 + i * 3, 14, 3);
      });
      // Cabeza
      ctx.fillStyle = '#333333';
      ctx.fillRect(12, 4, 10, 8);
      // Ojos
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(13, 6, 3, 3);
      ctx.fillRect(18, 6, 3, 3);
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(14, 7, 1, 1);
      ctx.fillRect(19, 7, 1, 1);
      // Aguijón
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(15, 23, 4, 3);
      ctx.fillRect(16, 26, 2, 2);
    });
  },

  // ─── BOSS — Araña mecánica gigante ───────────────────────
  _boss() {
    this._t('boss', 96, 96, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0, 0, 96, 96);

      // Patas (4 pares)
      const legColor = '#441155';
      const legHighlight = '#8833aa';
      // Patas izquierdas
      ctx.fillStyle = legColor;
      ctx.fillRect(4, 30, 20, 5);  ctx.fillRect(4, 30, 5, 14);
      ctx.fillRect(2, 42, 20, 5);  ctx.fillRect(2, 42, 5, 14);
      ctx.fillRect(4, 54, 18, 5);  ctx.fillRect(4, 54, 5, 12);
      ctx.fillRect(6, 64, 16, 4);  ctx.fillRect(6, 64, 4, 10);
      ctx.fillStyle = legHighlight;
      ctx.fillRect(4, 30, 20, 2);
      ctx.fillRect(2, 42, 20, 2);
      ctx.fillRect(4, 54, 18, 2);
      // Patas derechas
      ctx.fillStyle = legColor;
      ctx.fillRect(72, 30, 20, 5); ctx.fillRect(87, 30, 5, 14);
      ctx.fillRect(74, 42, 20, 5); ctx.fillRect(89, 42, 5, 14);
      ctx.fillRect(74, 54, 18, 5); ctx.fillRect(87, 54, 5, 12);
      ctx.fillRect(74, 64, 16, 4); ctx.fillRect(86, 64, 4, 10);
      ctx.fillStyle = legHighlight;
      ctx.fillRect(72, 30, 20, 2);
      ctx.fillRect(74, 42, 20, 2);
      ctx.fillRect(74, 54, 18, 2);

      // Abdomen (cola trasera)
      ctx.fillStyle = '#330044';
      ctx.fillRect(28, 52, 40, 36);
      ctx.fillStyle = '#6600aa';
      ctx.fillRect(30, 54, 36, 4);
      ctx.fillRect(30, 62, 36, 4);
      ctx.fillRect(30, 70, 36, 4);
      ctx.fillStyle = '#9933cc';
      ctx.fillRect(32, 78, 32, 8);

      // Cuerpo principal
      ctx.fillStyle = '#220033';
      ctx.fillRect(18, 24, 60, 36);

      // Detalle caparazón
      ctx.fillStyle = '#440066';
      ctx.fillRect(22, 28, 52, 6);
      ctx.fillRect(22, 38, 52, 6);
      ctx.fillRect(22, 48, 52, 6);

      // Brillo caparazón
      ctx.fillStyle = '#aa55ff';
      ctx.fillRect(20, 25, 4, 2);
      ctx.fillRect(22, 26, 2, 2);

      // Cabeza
      ctx.fillStyle = '#330055';
      ctx.fillRect(22, 6, 52, 22);
      ctx.fillStyle = '#550088';
      ctx.fillRect(24, 8, 48, 6);

      // Ojos múltiples (8 ojos de araña)
      const eyePositions = [
        [26,10],[34,8],[44,8],[54,8],[62,10],
        [30,16],[44,16],[58,16]
      ];
      eyePositions.forEach(([ex, ey], i) => {
        ctx.fillStyle = i < 2 || i > 4 ? '#ff0000' : '#ff6600';
        ctx.fillRect(ex, ey, 6, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ex+1, ey+1, 2, 2);
      });

      // Colmillos
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(32, 26, 5, 6);
      ctx.fillRect(59, 26, 5, 6);
      ctx.fillStyle = '#00ffaa';
      ctx.fillRect(33, 30, 3, 3); // veneno
      ctx.fillRect(60, 30, 3, 3);

      // Cañones en el cuerpo
      ctx.fillStyle = '#114422';
      ctx.fillRect(20, 36, 10, 7);
      ctx.fillRect(66, 36, 10, 7);
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(18, 38, 4, 3);
      ctx.fillRect(74, 38, 4, 3);
    });
  },

  // ─── TILES — corregidos visualmente ──────────────────────
  _tiles() {
    // Tile de suelo — azul oscuro con bordes nítidos
    this._t('tile', 32, 32, ctx => {
      // Fondo del tile
      ctx.fillStyle = '#0a1428';
      ctx.fillRect(0, 0, 32, 32);
      // Borde superior brillante
      ctx.fillStyle = '#4488ff';
      ctx.fillRect(0, 0, 32, 3);
      // Borde inferior oscuro
      ctx.fillStyle = '#050a14';
      ctx.fillRect(0, 29, 32, 3);
      // Bordes laterales
      ctx.fillStyle = '#1133aa';
      ctx.fillRect(0, 3, 2, 26);
      ctx.fillRect(30, 3, 2, 26);
      // Interior — patrón de circuito
      ctx.fillStyle = '#0d1e3a';
      ctx.fillRect(2, 3, 28, 26);
      // Líneas de circuito
      ctx.fillStyle = '#1144cc';
      ctx.fillRect(4, 10, 24, 1);
      ctx.fillRect(4, 20, 24, 1);
      ctx.fillRect(10, 4, 1, 24);
      ctx.fillRect(22, 4, 1, 24);
      // Nodos
      ctx.fillStyle = '#3366ff';
      ctx.fillRect(9, 9, 3, 3);
      ctx.fillRect(20, 9, 3, 3);
      ctx.fillRect(9, 19, 3, 3);
      ctx.fillRect(20, 19, 3, 3);
    });

    this._t('tile_wall', 32, 32, ctx => {
      ctx.fillStyle = '#0a1428';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#4488ff';
      ctx.fillRect(0, 0, 3, 32); // borde izquierdo
      ctx.fillStyle = '#050a14';
      ctx.fillRect(29, 0, 3, 32);
      ctx.fillStyle = '#0d1e3a';
      ctx.fillRect(3, 0, 26, 32);
      ctx.fillStyle = '#1144cc';
      ctx.fillRect(8, 2, 1, 28);
      ctx.fillRect(20, 2, 1, 28);
      ctx.fillRect(4, 10, 24, 1);
      ctx.fillRect(4, 22, 24, 1);
      ctx.fillStyle = '#3366ff';
      ctx.fillRect(7, 9, 3, 3);
      ctx.fillRect(7, 21, 3, 3);
    });

    this._t('tile_spike', 32, 16, ctx => {
      ctx.fillStyle = '#050a14';
      ctx.fillRect(0, 0, 32, 16);
      // Base
      ctx.fillStyle = '#1133aa';
      ctx.fillRect(0, 12, 32, 4);
      // Picos (triángulos nítidos)
      ctx.fillStyle = '#ff2200';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i*8, 13);
        ctx.lineTo(i*8+4, 1);
        ctx.lineTo(i*8+8, 13);
        ctx.closePath(); ctx.fill();
      }
      // Brillo punta
      ctx.fillStyle = '#ff8866';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(i*8+3, 3, 2, 3);
      }
    });

    // Plataforma flotante — bien definida con grosor visual
    this._t('platform', 96, 20, ctx => {
      ctx.fillStyle = '#050a14';
      ctx.fillRect(0, 0, 96, 20);
      // Cuerpo de la plataforma
      ctx.fillStyle = '#0d1e3a';
      ctx.fillRect(0, 4, 96, 16);
      // Superficie superior (brillante)
      ctx.fillStyle = '#66aaff';
      ctx.fillRect(0, 0, 96, 4);
      // Borde inferior
      ctx.fillStyle = '#050a14';
      ctx.fillRect(0, 18, 96, 2);
      // Detalles en la superficie
      ctx.fillStyle = '#3366cc';
      [12, 28, 44, 60, 76].forEach(x => {
        ctx.fillRect(x, 6, 4, 10);
      });
      ctx.fillStyle = '#1144aa';
      ctx.fillRect(2, 10, 92, 2);
      // Luces en la superficie
      ctx.fillStyle = '#aaddff';
      [6, 22, 38, 54, 70, 86].forEach(x => ctx.fillRect(x, 1, 4, 2));
    });

    this._t('platform_sm', 64, 20, ctx => {
      ctx.fillStyle = '#050a14';
      ctx.fillRect(0, 0, 64, 20);
      ctx.fillStyle = '#0d1e3a';
      ctx.fillRect(0, 4, 64, 16);
      ctx.fillStyle = '#66aaff';
      ctx.fillRect(0, 0, 64, 4);
      ctx.fillStyle = '#050a14';
      ctx.fillRect(0, 18, 64, 2);
      ctx.fillStyle = '#3366cc';
      [10, 26, 42].forEach(x => ctx.fillRect(x, 6, 4, 10));
      ctx.fillStyle = '#1144aa';
      ctx.fillRect(2, 10, 60, 2);
      ctx.fillStyle = '#aaddff';
      [4, 20, 36, 52].forEach(x => ctx.fillRect(x, 1, 4, 2));
    });

    this._t('platform_boss', 128, 20, ctx => {
      ctx.fillStyle = '#1a0000';
      ctx.fillRect(0, 0, 128, 20);
      ctx.fillStyle = '#220808';
      ctx.fillRect(0, 4, 128, 16);
      // Borde rojo para boss
      ctx.fillStyle = '#ff3300';
      ctx.fillRect(0, 0, 128, 4);
      ctx.fillStyle = '#1a0000';
      ctx.fillRect(0, 18, 128, 2);
      ctx.fillStyle = '#660000';
      [12, 28, 44, 60, 76, 92, 108].forEach(x => ctx.fillRect(x, 6, 4, 10));
      ctx.fillStyle = '#440000';
      ctx.fillRect(2, 10, 124, 2);
      ctx.fillStyle = '#ff6644';
      [4, 20, 36, 52, 68, 84, 100, 116].forEach(x => ctx.fillRect(x, 1, 4, 2));
    });
  },

  // ─── FONDOS ──────────────────────────────────────────────
  _backgrounds() {
    this._t('bg_stage1', 800, 480, ctx => {
      const sky = ctx.createLinearGradient(0,0,0,480);
      sky.addColorStop(0, '#000510');
      sky.addColorStop(0.6, '#050a20');
      sky.addColorStop(1, '#0a0a1a');
      ctx.fillStyle = sky; ctx.fillRect(0,0,800,480);
      const bs = [
        [0,60,200],[70,80,280],[160,50,180],[220,90,320],[320,70,240],
        [400,100,350],[510,60,200],[580,80,290],[670,70,260],[750,50,180]
      ];
      bs.forEach(([x,w,h]) => {
        ctx.fillStyle = '#0d0d25'; ctx.fillRect(x, 480-h, w, h);
        ctx.fillStyle = '#003366'; ctx.fillRect(x, 480-h, w, 2);
        for (let wy = 480-h+10; wy < 470; wy += 18) {
          for (let wx = x+4; wx < x+w-4; wx += 12) {
            if (Math.random() > 0.45) {
              ctx.fillStyle = Math.random()>0.7 ? '#1a3a6a' : '#0d1a3a';
              ctx.fillRect(wx, wy, 6, 8);
            }
          }
        }
      });
    });

    this._t('bg_boss', 800, 480, ctx => {
      const sky = ctx.createLinearGradient(0,0,0,480);
      sky.addColorStop(0, '#0a0000');
      sky.addColorStop(0.5, '#150010');
      sky.addColorStop(1, '#0a0005');
      ctx.fillStyle = sky; ctx.fillRect(0,0,800,480);
      const bs = [
        [0,60,200],[80,90,300],[180,50,160],[260,100,340],[370,70,220],
        [450,110,380],[570,60,180],[640,80,270]
      ];
      bs.forEach(([x,w,h]) => {
        ctx.fillStyle = '#1a0515'; ctx.fillRect(x, 480-h, w, h);
        ctx.fillStyle = '#550044'; ctx.fillRect(x, 480-h, w, 2);
        for (let wy = 480-h+10; wy < 470; wy += 18) {
          for (let wx = x+4; wx < x+w-4; wx += 12) {
            if (Math.random() > 0.5) {
              ctx.fillStyle = Math.random()>0.6 ? '#3a0a1a' : '#220515';
              ctx.fillRect(wx, wy, 6, 8);
            }
          }
        }
      });
    });

    this._t('bg_mid', 800, 480, ctx => {
      ctx.clearRect(0,0,800,480);
      ctx.fillStyle = 'rgba(10,20,50,0.5)'; ctx.fillRect(0,300,800,180);
      ctx.fillStyle = '#00aaff'; ctx.fillRect(0,300,800,2);
    });
  },

  // ─── POWER-UPS — corazón, diamante ───────────────────────
  _powerups() {
    // Vida — corazón (3er corazón del HUD)
    this._t('powerup_life', 20, 20, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0,0,20,20);
      // Forma de corazón pixel art
      const heart = [
        '00110011000',
        '01111111100',
        '11111111110',
        '11111111110',
        '11111111110',
        '01111111100',
        '00111111000',
        '00011110000',
        '00001100000',
        '00000000000',
      ];
      this._bitmap(ctx, heart, 1, 3, 2, '#ff3366');
      // Brillo
      ctx.fillStyle = '#ff88aa';
      ctx.fillRect(4, 5, 3, 2);
    });

    // Energía — diamante azul
    this._t('powerup_energy', 20, 20, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0,0,20,20);
      // Diamante pixel art
      const diamond = [
        '00011100000',
        '01111111000',
        '11111111100',
        '11111111110',
        '01111111100',
        '00111111000',
        '00011110000',
        '00001100000',
        '00000000000',
      ];
      this._bitmap(ctx, diamond, 0, 2, 2, '#00aaff');
      // Brillo
      ctx.fillStyle = '#aaeeff';
      ctx.fillRect(5, 5, 3, 2);
      ctx.fillRect(3, 8, 2, 2);
      // Borde interno
      ctx.fillStyle = '#0055ff';
      ctx.fillRect(7, 12, 6, 2);
    });
  },

  // ─── EFECTOS VISUALES ────────────────────────────────────
  _fx() {
    ['exp0','exp1','exp2','exp3','exp4'].forEach((key, i) => {
      this._t(key, 32, 32, ctx => {
        ctx.fillStyle = B1; ctx.fillRect(0,0,32,32);
        const sizes  = [4,8,12,10,6];
        const s = sizes[i];
        const colors = ['#ffffff','#ffff00','#ff8800','#ff4400','#ff0000'];
        ctx.fillStyle = colors[i];
        ctx.fillRect(16-s, 16-2, s*2, 4);
        ctx.fillRect(16-2, 16-s, 4, s*2);
        for (let d = 2; d < s; d+=2) {
          ctx.fillRect(16+d-1, 16+d-1, 2, 2);
          ctx.fillRect(16-d-1, 16+d-1, 2, 2);
          ctx.fillRect(16+d-1, 16-d-1, 2, 2);
          ctx.fillRect(16-d-1, 16-d-1, 2, 2);
        }
        ctx.fillStyle = W1; ctx.fillRect(15,15,2,2);
      });
    });

    // Checkpoint — ruby (gema roja)
    this._t('checkpoint', 20, 36, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0,0,20,36);
      // Poste
      ctx.fillStyle = '#555566';
      ctx.fillRect(9, 14, 3, 22);
      // Ruby inactivo (gris)
      const gem = [
        '00111000',
        '01111100',
        '11111110',
        '11111110',
        '01111100',
        '00111000',
        '00010000',
      ];
      this._bitmap(ctx, gem, 2, 2, 2, '#664455');
      ctx.fillStyle = '#998899';
      ctx.fillRect(6, 4, 3, 2);
    });

    this._t('checkpoint_active', 20, 36, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0,0,20,36);
      // Poste brillante
      ctx.fillStyle = '#aabbff';
      ctx.fillRect(9, 14, 3, 22);
      // Ruby activo (rojo brillante)
      const gem = [
        '00111000',
        '01111100',
        '11111110',
        '11111110',
        '01111100',
        '00111000',
        '00010000',
      ];
      this._bitmap(ctx, gem, 2, 2, 2, '#cc0033');
      // Brillo rojo
      ctx.fillStyle = '#ff4466';
      ctx.fillRect(6, 4, 3, 2);
      ctx.fillRect(4, 7, 2, 2);
      // Brillo blanco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(5, 4, 2, 2);
      // Aura parpadeante (estática)
      ctx.fillStyle = 'rgba(255,0,80,0.2)';
      ctx.fillRect(0, 0, 20, 14);
    });

    this._t('dash_trail', 20, 16, ctx => {
      const g = ctx.createLinearGradient(0,0,20,0);
      g.addColorStop(0, 'transparent');
      g.addColorStop(1, 'rgba(0,200,150,0.45)');
      ctx.fillStyle = g;
      ctx.fillRect(0,2,20,12);
    });
  },

  // ─── UI ──────────────────────────────────────────────────
  _ui() {
    this._t('icon_heart', 12, 12, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0,0,12,12);
      const h = ['011011','111111','111111','011110','001100','000000'];
      this._bitmap(ctx, h, 0, 2, 2, '#ff3355');
    });

    this._t('icon_energy', 10, 12, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0,0,10,12);
      const b = ['01110','01110','11111','11111','01110','01110'];
      this._bitmap(ctx, b, 0, 0, 2, A1);
    });
  },

  // ─── ÍTEMS — llave y puerta ───────────────────────────────
  _items() {
    // Llave dorada
    this._t('key_item', 20, 20, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0,0,20,20);
      // Cabeza de llave (círculo)
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(3, 3, 10, 10);
      ctx.fillStyle = '#ffee66';
      ctx.fillRect(5, 4, 6, 4);
      // Agujero
      ctx.fillStyle = B1;
      ctx.fillRect(6, 6, 4, 4);
      ctx.fillRect(7, 7, 2, 2);
      ctx.fillStyle = '#aa8800';
      ctx.fillRect(6, 6, 4, 1);
      // Cuerpo de llave
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(11, 8, 8, 3);
      // Dientes
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(14, 11, 3, 3);
      ctx.fillRect(18, 11, 2, 2);
      // Sombra/borde
      ctx.fillStyle = '#aa8800';
      ctx.fillRect(3, 12, 10, 2);
      ctx.fillRect(12, 10, 8, 1);
    });

    // Puerta (azul tecnológica)
    this._t('door_closed', 40, 64, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0,0,40,64);
      // Marco
      ctx.fillStyle = '#224466';
      ctx.fillRect(0, 0, 40, 64);
      ctx.fillStyle = '#3366aa';
      ctx.fillRect(2, 2, 36, 60);
      // Panel principal
      ctx.fillStyle = '#0a1a2a';
      ctx.fillRect(4, 4, 32, 56);
      // Líneas de panel
      ctx.fillStyle = '#1144aa';
      ctx.fillRect(4, 30, 32, 2);
      ctx.fillRect(20, 4, 2, 56);
      // Luz de acceso (rojo = cerrada)
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(16, 8, 8, 8);
      ctx.fillStyle = '#ff6666';
      ctx.fillRect(18, 10, 4, 4);
      // Detalles
      ctx.fillStyle = '#3366aa';
      ctx.fillRect(6, 34, 12, 24);
      ctx.fillRect(22, 34, 12, 24);
      // Cerradura
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(17, 28, 6, 6);
      ctx.fillStyle = '#ffee66';
      ctx.fillRect(19, 29, 2, 3);
      // Marco exterior
      ctx.fillStyle = '#4488ff';
      ctx.fillRect(0, 0, 40, 3);
      ctx.fillRect(0, 61, 40, 3);
      ctx.fillRect(0, 0, 3, 64);
      ctx.fillRect(37, 0, 3, 64);
    });

    this._t('door_open', 40, 64, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0,0,40,64);
      // Marco
      ctx.fillStyle = '#224466';
      ctx.fillRect(0, 0, 40, 64);
      ctx.fillStyle = '#00aaff';
      ctx.fillRect(2, 2, 36, 60);
      // Hueco interior (paso libre)
      ctx.fillStyle = '#001133';
      ctx.fillRect(4, 4, 32, 56);
      // Efecto de portal
      ctx.fillStyle = 'rgba(0,150,255,0.15)';
      ctx.fillRect(6, 6, 28, 52);
      ctx.fillStyle = '#0044aa';
      ctx.fillRect(4, 30, 32, 2);
      // Luz verde = abierta
      ctx.fillStyle = '#00ff44';
      ctx.fillRect(16, 8, 8, 8);
      ctx.fillStyle = '#aaffcc';
      ctx.fillRect(18, 10, 4, 4);
      // Marco exterior
      ctx.fillStyle = '#00ffaa';
      ctx.fillRect(0, 0, 40, 3);
      ctx.fillRect(0, 61, 40, 3);
      ctx.fillRect(0, 0, 3, 64);
      ctx.fillRect(37, 0, 3, 64);
    });

    // HUD — icono de llave pequeño
    this._t('hud_key', 16, 16, ctx => {
      ctx.fillStyle = B1; ctx.fillRect(0,0,16,16);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(2, 3, 7, 7);
      ctx.fillStyle = B1;
      ctx.fillRect(4, 5, 3, 3);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(8, 6, 6, 2);
      ctx.fillRect(11, 8, 3, 2);
      ctx.fillRect(13, 8, 2, 3);
    });
  }
};

export default GF;
