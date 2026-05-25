/**
 * audio/AudioManager.js
 * Sintetiza música chiptune y efectos de sonido con Web Audio API.
 * No requiere archivos de audio externos.
 */

import StorageManager from '../managers/StorageManager.js';

class AudioManager {
  constructor() {
    this.ctx     = null;
    this.muted   = false;
    this.volume  = 0.6;
    this.bgGain  = null;
    this._bgTimer = null;
    this._init();
  }

  _init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const cfg = StorageManager.getAudioConfig();
      this.muted  = cfg.muted;
      this.volume = cfg.volume;
    } catch (e) {
      console.warn('Web Audio API no disponible');
    }
  }

  // ── Música de fondo (chiptune procedural) ──────────────
  playBGM(track = 'stage') {
    if (!this.ctx || this.bgGain) return;
    this._resumeCtx();

    const patterns = {
      menu:  [262, 330, 392, 523, 392, 330, 262, 196],
      stage: [392, 440, 494, 523, 494, 440, 392, 330,
              349, 392, 440, 494, 440, 392, 349, 294],
      boss:  [220, 246, 262, 294, 330, 370, 392, 440,
              466, 440, 392, 370, 330, 294, 262, 246]
    };

    const notes   = patterns[track] || patterns.stage;
    const bpm     = track === 'boss' ? 180 : 138;
    const beatDur = 60 / bpm;
    const ctx     = this.ctx;

    this.bgGain = ctx.createGain();
    this.bgGain.gain.value = this.muted ? 0 : this.volume * 0.15;
    this.bgGain.connect(ctx.destination);

    const schedule = () => {
      if (!this.bgGain) return;
      const t0 = ctx.currentTime;
      notes.forEach((freq, i) => {
        const t   = t0 + i * beatDur;
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.type  = 'square';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + beatDur * 0.8);
        osc.connect(g);
        g.connect(this.bgGain);
        osc.start(t);
        osc.stop(t + beatDur * 0.85);
      });
      this._bgTimer = setTimeout(schedule, notes.length * beatDur * 1000 - 60);
    };

    schedule();
  }

  stopBGM() {
    clearTimeout(this._bgTimer);
    if (this.bgGain) {
      try {
        this.bgGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      } catch (_) {}
      setTimeout(() => { this.bgGain = null; }, 350);
    }
  }

  // ── Efectos de sonido ──────────────────────────────────
  playSFXShoot() {
    this._sfx(f => {
      f.setValueAtTime(900, 0);
      f.exponentialRampToValueAtTime(220, 0.14);
    }, 'sawtooth', 0.14, 0.10);
  }

  playSFXJump() {
    this._sfx(f => {
      f.setValueAtTime(280, 0);
      f.exponentialRampToValueAtTime(700, 0.11);
    }, 'square', 0.11, 0.08);
  }

  playSFXDash() {
    this._sfx(f => {
      f.setValueAtTime(620, 0);
      f.linearRampToValueAtTime(180, 0.10);
    }, 'sawtooth', 0.10, 0.13);
  }

  playSFXExplosion() {
    this._sfx(f => {
      f.setValueAtTime(160, 0);
      f.exponentialRampToValueAtTime(28, 0.42);
    }, 'sawtooth', 0.42, 0.22);
  }

  playSFXHurt() {
    this._sfx(f => {
      f.setValueAtTime(420, 0);
      f.linearRampToValueAtTime(90, 0.28);
    }, 'square', 0.28, 0.18);
  }

  playSFXPickup() {
    this._sfx(f => {
      f.setValueAtTime(523, 0);
      f.setValueAtTime(784, 0.06);
      f.setValueAtTime(1047, 0.12);
    }, 'square', 0.20, 0.10);
  }

  playSFXCheckpoint() {
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => {
        this._sfx(f => f.setValueAtTime(freq, 0), 'square', 0.18, 0.12);
      }, i * 100);
    });
  }

  playSFXVictory() {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => {
      setTimeout(() => this._sfx(fr => fr.setValueAtTime(f, 0), 'square', 0.2, 0.13), i * 130);
    });
  }

  // ── Helpers ────────────────────────────────────────────
  _sfx(freqFn, type, duration, vol = 0.13) {
    if (!this.ctx || this.muted) return;
    this._resumeCtx();
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type  = type;
    freqFn(osc.frequency);
    g.gain.setValueAtTime(vol * this.volume, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.05);
  }

  _resumeCtx() {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.bgGain) this.bgGain.gain.value = this.muted ? 0 : this.volume * 0.15;
    StorageManager.saveAudioConfig(this.muted, this.volume);
    return this.muted;
  }

  isMuted() { return this.muted; }
}

// Singleton
export default new AudioManager();
