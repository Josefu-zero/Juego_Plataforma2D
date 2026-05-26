# 🎮 Juego Plataforma 2D (Estilo Megaman)

Un dinámico juego de acción y plataformas en 2D desarrollado con **Phaser 3** y empaquetado mediante **Vite**. El proyecto destaca por su enfoque modular, implementando mecánicas robustas de disparo (normal y cargado), habilidades de desplazamiento rápido (*dash*), sistemas de reciclaje de proyectiles (*object pooling*), e Inteligencia Artificial variada para enemigos terrestres, voladores y jefes mecánicos gigantes.

---

## 🚀 Guía de Ejecución

Para ejecutar el proyecto en tu entorno local, asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 16 o superior recomendada).

### 1. Clonar el repositorio e instalar dependencias
Abre tu terminal en la carpeta raíz del proyecto e instala los módulos necesarios de Node:
` ` `bash
npm install
` ` `

### 2. Ejecutar el servidor de desarrollo
Inicia el entorno local con recarga en vivo de Vite:
` ` `bash
npm run dev
` ` `
Una vez iniciado, abre tu navegador web en la dirección local provista (usualmente `http://localhost:5173`).

### 3. Construir para producción
Para compilar y optimizar el juego para su distribución en producción:
` ` `bash
npm run build
` ` `
Los archivos optimizados se generarán dentro del directorio `dist/`.

---

## 🕹️ Controles del Juego

El sistema soporta tanto controles por teclado (PC) como botones táctiles en pantalla para dispositivos móviles.

### Teclado (PC)

| Acción | Teclas Soportadas | Descripción |
| :--- | :--- | :--- |
| **Moverse a la Izquierda** | `⬅️ Flecha Izquierda` / `A` | Desplaza al jugador hacia la izquierda. |
| **Moverse a la Derecha** | `➡️ Flecha Derecha` / `D` | Desplaza al jugador hacia la derecha. |
| **Saltar / Doble Salto** | `⬆️ Flecha Arriba` / `W` / `Z` | Permite realizar hasta dos saltos consecutivos en el aire. |
| **Desplazamiento (*Dash*)** | `C` / `SHIFT` | Impulso rápido horizontal en la dirección actual. |
| **Disparar Normal** | Presión rápida en `X` o `J` | Lanza un proyectil estándar (gasta 2 de energía). |
| **Disparo Cargado** | Mantener presionado `X` o `J` (>800ms) | Desata un mega proyectil de alto impacto (gasta 14 de energía). |
| **Pausar Juego** | `P` / `ESC` | Pausa las físicas y el tiempo del juego; abre el menú de pausa. |

### Controles Móviles (Táctiles)
El juego mapea automáticamente eventos `touchstart` y `touchend` en los siguientes contenedores de la interfaz web:
* `btn-left` / `btn-right`: Movimiento lateral.
* `btn-up` / `btn-jump`: Salto y doble salto.
* `btn-shoot`: Control de disparo (detecta pulsación y ráfaga).
* `btn-dash`: Activación del impulso rápido.

---

## 📁 Estructura del Proyecto

El código fuente está diseñado bajo un enfoque modular y orientado a objetos, separando las entidades físicas, los managers globales y el ciclo de vida de las escenas de Phaser:

```
juego_plataforma2d/
├── public/
│   └── assets/               # Spritesheets, fondos, tiles de plataformas y FX de explosión
├── src/
│   ├── audio/
│   │   └── AudioManager.js   # Administrador central de efectos de sonido (SFX) y música de fondo (BGM)
│   ├── managers/
│   │   ├── GraphicsFactory.js# Generación y manipulación dinámica de texturas
│   │   └── StorageManager.js # Persistencia local de puntuaciones altas (Highscores) y progreso
│   ├── objects/
│   │   ├── Player.js         # Clase del jugador: físicas, estados de daño, invencibilidad y armas
│   │   └── Enemy.js          # Clases de IA enemiga (EnemyGround, EnemyFlying, EnemyKeyHolder, Boss)
│   ├── physics/
│   │   └── CollisionHelper.js# Desacoplamiento de colisiones y solapamientos (overlaps) de Phaser
│   ├── scenes/
│   │   ├── BootScene.js      # Inicialización inicial del motor
│   │   ├── PreloadScene.js   # Carga optimizada de recursos gráficos y de audio
│   │   ├── MenuScene.js      # Pantalla principal de inicio
│   │   ├── Stage1Scene.js    # Nivel 1: Mecánica de llave, puertas bloqueadas y enemigos terrestres
│   │   ├── Stage2Scene.js    # Nivel 2 (Abismo): Enfoque aéreo, plataformas flotantes y vacío mortal
│   │   ├── BossScene.js      # Arena de combate final contra el jefe mecánico
│   │   ├── HUDScene.js       # Capa superior de interfaz de usuario en tiempo real (vida, energía, score)
│   │   ├── PauseScene.js     # Menú de interrupción del juego
│   │   ├── GameOverScene.js  # Pantalla de derrota y reinicio
│   │   └── VictoryScene.js   # Pantalla de éxito tras derrotar al jefe
│   ├── ui/
│   │   └── HUD.js            # Lógica de renderizado y actualización de barras de estado
│   └── main.js               # Archivo de entrada de Vite y configuración del objeto Phaser.Game
├── index.html                # Contenedor HTML principal del lienzo de juego y los controles móviles
└── vite.config.js            # Configuración del empaquetador Vite
```

---

## 🛠️ Características Técnicas Destacadas

1. **Object Pooling para Proyectiles:** Las balas normales y cargadas se gestionan mediante grupos estricto-máximos de Phaser, reutilizando los cuerpos físicos desactivados en lugar de instanciar nuevos objetos continuamente, optimizando el rendimiento de memoria.
2. **Modularidad en Físicas:** El archivo `CollisionHelper.js` centraliza las interacciones mutuas del juego. Esto resolvió problemas críticos como la inversión de parámetros en callbacks de Phaser y permitió aislar a los enemigos voladores para que no se atasquen con las plataformas del escenario.
3. **Mecánica de Progreso Integrada:** El flujo del mapa requiere derrotar a enemigos específicos (`EnemyKeyHolder`) para obtener llaves físicas, procesar colisiones en zonas de transición y guardar checkpoints interactivos mediante el almacenamiento del navegador.

---

## 👥 Créditos

Desarrollado con pasión por: 

*Agradecimientos especiales a la comunidad de desarrollo independiente por los assets base e inspiración tomados de las mecánicas clásicas de la era de los 16 bits.*
