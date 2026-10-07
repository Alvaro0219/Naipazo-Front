// Presentación de cartas y cantos. El front NO implementa reglas: solo traduce lo que manda el servidor.

export const SUIT_LABELS = { espada: 'espada', basto: 'basto', oro: 'oro', copa: 'copa' };

export function parseCardId(cardId) {
  const [number, suit] = String(cardId).split('-');
  return { number: Number(number), suit };
}

/** Imagen de la carta (public/cartas/{número}-{palo}.png, con el mismo id que manda el servidor). */
export function cardImageUrl(cardId) {
  const { number, suit } = parseCardId(cardId);
  return `${import.meta.env.BASE_URL}cartas/${number}-${suit}.png`;
}

export function cardLabel(cardId) {
  const { number, suit } = parseCardId(cardId);
  return `${number} de ${SUIT_LABELS[suit] || suit}`;
}

export const CALL_LABELS = {
  TRUCO: 'Truco',
  RETRUCO: 'Quiero retruco',
  VALE_CUATRO: 'Quiero vale cuatro',
  ENVIDO: 'Envido',
  REAL_ENVIDO: 'Real envido',
  FALTA_ENVIDO: 'Falta envido'
};

export const ACTION_LABELS = {
  CALL_TRUCO: 'Truco',
  CALL_RETRUCO: 'Quiero retruco',
  CALL_VALE_CUATRO: 'Quiero vale cuatro',
  CALL_ENVIDO: 'Envido',
  CALL_REAL_ENVIDO: 'Real envido',
  CALL_FALTA_ENVIDO: 'Falta envido',
  ACCEPT: 'Quiero',
  REJECT: 'No quiero',
  GO_TO_DECK: 'Me voy al mazo'
};
