const { raceTexts } = require('../../../shared/race-texts');

const ROOM_CAPACITY = 5;

function mismatchCount(source, typed) {
  let mismatches = 0;
  for (let i = 0; i < typed.length; i += 1) {
    if (source[i] !== typed[i]) mismatches += 1;
  }
  return mismatches;
}

class CompetitionManager {
  constructor() {
    this.players = new Map();
    this.started = false;
    this.text = '';
    this.startedAt = null;
    this.winner = null;
  }

  get count() {
    return this.players.size;
  }

  canJoin() {
    return this.count < ROOM_CAPACITY && !this.started;
  }

  join(sessionId, name) {
    if (this.players.has(sessionId)) return { ok: true };
    if (!this.canJoin()) return { ok: false };

    this.players.set(sessionId, {
      sessionId,
      name,
      typed: '',
      errors: 0,
      finishedAt: null,
      validFinish: false,
    });

    return { ok: true };
  }

  startRace(sessionId) {
    if (this.started || !this.players.has(sessionId) || this.count === 0) return false;
    this.started = true;
    this.startedAt = Date.now();
    this.text = raceTexts[Math.floor(Math.random() * raceTexts.length)];
    return true;
  }

  leave(sessionId) {
    this.players.delete(sessionId);
    if (this.count === 0) this.resetRound();
  }

  updateInput(sessionId, typed) {
    const player = this.players.get(sessionId);
    if (!player || !this.started || player.finishedAt) return null;

    const safeTyped = typeof typed === 'string' ? typed.slice(0, this.text.length) : '';
    player.typed = safeTyped;
    player.errors = mismatchCount(this.text, player.typed);

    if (player.typed.length === this.text.length) {
      player.finishedAt = Date.now();
      player.validFinish = player.errors === 0;
      if (!this.winner && player.validFinish) {
        this.winner = {
          sessionId: player.sessionId,
          name: player.name,
          elapsedMs: player.finishedAt - this.startedAt,
        };
      }
    }
    return this.getState();
  }

  getState() {
    return {
      capacity: ROOM_CAPACITY,
      count: this.count,
      started: this.started,
      text: this.started ? this.text : '',
      winner: this.winner,
      players: [...this.players.values()].map((player) => ({
        sessionId: player.sessionId,
        name: player.name,
        progress: this.started && this.text.length
          ? Number(((player.typed.length / this.text.length) * 100).toFixed(2))
          : 0,
        errors: player.errors,
        finished: Boolean(player.finishedAt),
        validFinish: player.validFinish,
      })),
    };
  }

  resetRound() {
    this.started = false;
    this.text = '';
    this.startedAt = null;
    this.winner = null;
  }
}

module.exports = { CompetitionManager, ROOM_CAPACITY };
