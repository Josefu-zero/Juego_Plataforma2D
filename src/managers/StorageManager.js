/**
 * managers/StorageManager.js
 * Persiste datos del juego con localStorage:
 *   - High Score
 *   - Nivel alcanzado
 *   - Configuración de audio (mute, volumen)
 */

const KEYS = {
  HIGH_SCORE:  'megax_highscore',
  LEVEL:       'megax_level',
  MUTED:       'megax_muted',
  VOLUME:      'megax_volume'
};

const StorageManager = {

  saveHighScore(score) {
    const prev = this.getHighScore();
    if (score > prev) {
      localStorage.setItem(KEYS.HIGH_SCORE, String(score));
      return true;
    }
    return false;
  },

  getHighScore() {
    return parseInt(localStorage.getItem(KEYS.HIGH_SCORE) || '0', 10);
  },

  saveLevel(level) {
    const prev = this.getLevel();
    if (level > prev) localStorage.setItem(KEYS.LEVEL, String(level));
  },

  getLevel() {
    return parseInt(localStorage.getItem(KEYS.LEVEL) || '1', 10);
  },

  saveAudioConfig(muted, volume) {
    localStorage.setItem(KEYS.MUTED,  String(muted));
    localStorage.setItem(KEYS.VOLUME, String(volume));
  },

  getAudioConfig() {
    return {
      muted:  localStorage.getItem(KEYS.MUTED) === 'true',
      volume: parseFloat(localStorage.getItem(KEYS.VOLUME) || '0.6')
    };
  },

  clearAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  }
};

export default StorageManager;
