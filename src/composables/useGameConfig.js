import { ref } from 'vue';
import { fetchGameConfig } from '../services/api.js';

// Parámetros del juego que define el backend (apuesta mínima/máxima, tiempos). Se piden una vez.
const DEFAULTS = { minBet: 10, maxBet: 10000, houseRate: 0, turnTimeoutSeconds: 30, reconnectGraceSeconds: 60 };
const config = ref({ ...DEFAULTS });
let loading = null;

export function useGameConfig() {
  if (!loading) {
    loading = fetchGameConfig()
      .then((data) => { config.value = { ...DEFAULTS, ...data }; })
      .catch(() => { loading = null; }); // se reintenta en el próximo uso
  }
  return { config };
}
