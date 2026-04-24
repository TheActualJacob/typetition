const { lessons } = require('../../../shared/lessons');
const { generateRandomText } = require('../../../shared/word-pool');

function mismatchCount(source, typed) {
  let mismatches = 0;
  for (let i = 0; i < typed.length; i += 1) {
    if (source[i] !== typed[i]) mismatches += 1;
  }
  return mismatches;
}

class TrainingManager {
  constructor() {
    this.sessions = new Map();
  }

  start(sessionId, lessonId) {
    const lesson = lessons.find((item) => item.id === lessonId);
    if (!lesson) return null;

    const state = {
      lessonId: lesson.id,
      text: lesson.prompt,
      timeLimitSec: lesson.timeLimitSec,
      startedAt: Date.now(),
      typed: '',
      finished: false,
    };
    this.sessions.set(sessionId, state);
    return this.getSnapshot(sessionId);
  }

  startRandom(sessionId, wordCount = 30) {
    const text = generateRandomText(wordCount);
    const timeLimitSec = Math.max(60, wordCount * 3);
    const state = {
      lessonId: 'random',
      text,
      timeLimitSec,
      startedAt: Date.now(),
      typed: '',
      finished: false,
    };
    this.sessions.set(sessionId, state);
    return this.getSnapshot(sessionId);
  }

  updateInput(sessionId, typed) {
    const state = this.sessions.get(sessionId);
    if (!state || state.finished) return null;

    const safeTyped = typeof typed === 'string' ? typed.slice(0, state.text.length) : '';
    state.typed = safeTyped;

    const elapsedSec = (Date.now() - state.startedAt) / 1000;
    const mismatches = mismatchCount(state.text, state.typed);
    const isComplete = state.typed.length === state.text.length;
    const inTime = elapsedSec <= state.timeLimitSec;
    const success = isComplete && inTime && mismatches === 0;

    if (isComplete || !inTime) {
      state.finished = true;
      return {
        snapshot: this.getSnapshot(sessionId),
        result: {
          success,
          inTime,
          errors: mismatches,
          elapsedMs: Date.now() - state.startedAt,
        },
      };
    }

    return { snapshot: this.getSnapshot(sessionId), result: null };
  }

  getSnapshot(sessionId) {
    const state = this.sessions.get(sessionId);
    if (!state) return null;
    const elapsedSec = (Date.now() - state.startedAt) / 1000;
    const mismatches = mismatchCount(state.text, state.typed);

    return {
      lessonId: state.lessonId,
      text: state.text,
      typed: state.typed,
      timeLimitSec: state.timeLimitSec,
      remainingSec: Math.max(0, Math.ceil(state.timeLimitSec - elapsedSec)),
      errors: mismatches,
      progress: Number(((state.typed.length / state.text.length) * 100).toFixed(2)),
      finished: state.finished,
    };
  }

  clear(sessionId) {
    this.sessions.delete(sessionId);
  }
}

module.exports = { TrainingManager };
