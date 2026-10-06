import { defineStore } from 'pinia';
import { Notify } from 'quasar';
import { socketDebug, useSocket } from '../composables/useSocket.js';
import { announcementFor, describeEvent } from '../utils/gameText.js';

const LOG_SIZE = 8;
const ANNOUNCEMENT_MS = 2200;
const SIGN_TOAST_MS = 3500;

let listenersBound = false;
let announcementTimer = null;
let signTimer = null;

// Estado de la mesa actual. Lo alimentan los eventos del socket; el servidor es la única autoridad:
// `view` es el estado proyectado para este jugador y `view.availableActions` dice qué botones mostrar.
function joinRoom(socket, roomId, origin) {
  socketDebug({ roomId, origin });
  socket.emit('room:join', { roomId });
}

export const useGameStore = defineStore('game', {
  state: () => ({
    roomId: null,
    room: null,
    view: null,
    log: [], // historial de la mano: se arma pero hoy no se muestra en la mesa (decisión de producto)
    announcement: null,
    finished: null,
    rematch: null, // { state: 'waiting' | 'requested' | 'declined' | 'expired' | 'started' | 'failed', by?, roomId?, message? }
    replaced: false,
    sending: false,
    signs: [], // 2 vs 2: señas que me hizo mi compañero en esta mano ({ from, sign, at })
    lastSign: null, // la última, para mostrarla unos segundos junto al compañero
    receivedAt: 0 // cuándo llegó el último game:state (los plazos vienen como "ms restantes")
  }),
  getters: {
    myId: (s) => s.view?.me?.id ?? null,
    myTeam: (s) => s.view?.me?.team ?? null,
    opponent: (s) => s.view?.players?.find((p) => p.id !== s.view.me.id) ?? null,
    is2v2: (s) => (s.view?.mode || s.room?.config?.mode) === '2v2',
    /** 2 vs 2: mi compañero y mis rivales (cada uno con su asiento) */
    partner: (s) => s.view?.players?.find((p) => p.team === s.view.me.team && p.id !== s.view.me.id) ?? null,
    rivals: (s) => s.view?.players?.filter((p) => p.team !== s.view.me.team) ?? [],
    nameOf: (s) => (playerId) => {
      if (playerId === s.view?.me?.id) return 'Vos';
      return s.view?.usernames?.[playerId] || s.room?.seats?.find((x) => x.userId === playerId)?.username || 'Rival';
    },
    canAct: (s) => (type) => Boolean(s.view?.availableActions?.includes(type)),
    /** Plazo del turno actual: { deadline, totalMs, mine } o null si no corre (pausa, entre manos). */
    turnClock: (s) => {
      const turn = s.view?.turn;
      if (!turn) return null;
      return {
        deadline: s.receivedAt + turn.remainingMs,
        totalMs: turn.totalMs,
        mine: turn.playerIds.includes(s.view.me.id)
      };
    },
    /** Si el rival está desconectado: hasta cuándo tiene para volver (o null). */
    opponentGraceDeadline: (s) => {
      const away = Object.entries(s.view?.disconnected || {}).find(([id]) => id !== s.view.me.id);
      return away ? s.receivedAt + away[1].remainingMs : null;
    },
    /** Otro jugador desconectado (en 2 vs 2 puede ser cualquiera de los tres): { id, deadline } o null */
    awayPlayer: (s) => {
      const away = Object.entries(s.view?.disconnected || {}).find(([id]) => id !== s.view.me.id);
      return away ? { id: away[0], deadline: s.receivedAt + away[1].remainingMs } : null;
    }
  },
  actions: {
    enterRoom(roomId) {
      this.$reset();
      this.roomId = roomId;
      const { socket, connect } = useSocket();
      this.bindListeners(socket);
      connect();
      if (socket.connected) joinRoom(socket, roomId, 'enterRoom');
    },
    leaveTable() {
      this.$reset();
    },
    bindListeners(socket) {
      if (listenersBound) return;
      listenersBound = true;

      // Al (re)conectar se vuelve a pedir la mesa: el servidor reenvía game:state
      socket.on('connect', () => {
        if (this.roomId) joinRoom(socket, this.roomId, 'connect');
      });
      socket.on('room:update', (room) => this.onRoomUpdate(room));
      socket.on('game:state', (view) => this.onState(view));
      socket.on('game:event', (event) => this.onEvent(event));
      socket.on('game:finished', (summary) => { if (summary.matchId === this.room?.matchId) this.finished = summary; });
      socket.on('game:error', (err) => this.onError(err));
      socket.on('game:rematch', (data) => this.onRematch(data));
      socket.on('game:sign', (data) => this.onSign(data));
      // Desconexiones del rival: el servidor reenvía game:state con `disconnected`, que es lo que se muestra
    },
    onRoomUpdate(room) {
      if (room.id !== this.roomId) return;
      const startedNow = room.status === 'playing' && this.room?.status === 'waiting';
      this.room = room;
      // Arrancó la partida mientras esperábamos: nos sumamos a la mesa
      if (startedNow) joinRoom(useSocket().socket, this.roomId, 'roomStarted');
    },
    onState(view) {
      if (this.room && view.roomId !== this.roomId) return;
      this.view = view;
      this.receivedAt = Date.now();
      this.sending = false;
      // El servidor manda las señas que recibí en la mano en curso (así se recuperan al reconectar)
      if (Array.isArray(view.signs)) this.signs = view.signs;
    },
    onSign(data) {
      if (!this.view || data.matchId !== this.view.matchId) return;
      this.signs = [...this.signs, { from: data.from, sign: data.sign, at: data.at }];
      this.lastSign = { ...data, key: Date.now() };
      clearTimeout(signTimer);
      signTimer = setTimeout(() => { this.lastSign = null; }, SIGN_TOAST_MS);
    },
    sendSign(sign) {
      if (!this.view) return;
      useSocket().socket.emit('game:sign', { matchId: this.view.matchId, sign });
    },
    onEvent(event) {
      if (!this.view) return;
      const text = describeEvent(event, {
        nameOf: (id) => this.nameOf(id),
        teamName: (team) => (team === this.myTeam ? 'Vos' : (this.is2v2 ? 'Ellos' : this.nameOf(this.opponent?.id)))
      });
      if (text) this.log = [{ id: `${Date.now()}-${Math.random()}`, text }, ...this.log].slice(0, LOG_SIZE);

      const big = announcementFor(event);
      if (big) {
        this.announcement = { text: big, mine: event.playerId === this.myId, key: Date.now() };
        clearTimeout(announcementTimer);
        announcementTimer = setTimeout(() => { this.announcement = null; }, ANNOUNCEMENT_MS);
      }
    },
    onRematch(data) {
      if (!this.finished || data.matchId !== this.finished.matchId) return;
      // Si ya la pedí o acepté, para mí es "esperando a los demás" (en 2 vs 2 tienen que aceptar los 4)
      const mine = data.state === 'requested' && (data.by === this.myId || data.accepted?.includes(this.myId));
      this.rematch = mine ? { ...data, state: 'waiting' } : data;
    },
    requestRematch() {
      if (!this.finished) return;
      this.rematch = { state: 'waiting' };
      useSocket().socket.emit('game:rematch', { matchId: this.finished.matchId });
    },
    declineRematch() {
      if (!this.finished) return;
      useSocket().socket.emit('game:rematch:decline', { matchId: this.finished.matchId });
    },
    onError(err) {
      this.sending = false;
      if (err.code?.startsWith('REMATCH')) {
        this.rematch = { state: 'failed', message: err.message };
        return;
      }
      if (err.code === 'SIGN_RATE_LIMITED') {
        Notify.create({ message: err.message, timeout: 1500 });
        return;
      }
      if (err.code === 'SESSION_REPLACED') {
        this.replaced = true;
        return;
      }
      Notify.create({ type: 'negative', message: err.message || 'No se pudo hacer esa jugada' });
    },
    sendAction(type, payload = {}) {
      if (!this.view || this.sending) return;
      this.sending = true;
      // Red de contención: si no llega respuesta (acción duplicada, corte de red), se libera
      setTimeout(() => { this.sending = false; }, 4000);
      useSocket().socket.emit('game:action', {
        matchId: this.view.matchId,
        actionId: crypto.randomUUID(),
        type,
        payload
      });
    },
    abandon() {
      if (!this.view) return;
      useSocket().socket.emit('game:abandon', { matchId: this.view.matchId });
    }
  }
});
