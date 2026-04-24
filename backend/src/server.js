const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const { lessons } = require('../../shared/lessons');
const { TrainingManager } = require('./training/trainingManager');
const { CompetitionManager } = require('./competition/competitionManager');
const { ClientEvent, ServerEvent } = require('./protocol/messages');

const PORT = Number(process.env.PORT || 3001);

const app = express();
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/lessons', (_req, res) => {
  res.json({ lessons });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Map();
const trainingManager = new TrainingManager();
const competitionManager = new CompetitionManager();

function send(ws, type, payload = {}) {
  ws.send(JSON.stringify({ type, payload }));
}

function broadcast(type, payload = {}) {
  for (const ws of clients.keys()) {
    if (ws.readyState === ws.OPEN) send(ws, type, payload);
  }
}

function broadcastOnlineCount() {
  broadcast(ServerEvent.ONLINE_COUNT, { count: clients.size });
}

function broadcastCompetitionState() {
  broadcast(ServerEvent.COMPETITION_STATE, competitionManager.getState());
}

wss.on('connection', (ws) => {
  clients.set(ws, { sessionId: crypto.randomUUID(), name: null });
  broadcastOnlineCount();
  broadcastCompetitionState();

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch (_err) {
      send(ws, ServerEvent.ERROR, { message: 'Invalid JSON message.' });
      return;
    }

    const client = clients.get(ws);
    if (!client) return;

    if (msg.type === ClientEvent.JOIN) {
      const name = String(msg.payload?.name || '').trim().slice(0, 24);
      if (!name) {
        send(ws, ServerEvent.ERROR, { message: 'Name is required.' });
        return;
      }
      client.name = name;
      send(ws, ServerEvent.JOINED, { sessionId: client.sessionId, name });
      broadcastOnlineCount();
      return;
    }

    if (!client.name) {
      send(ws, ServerEvent.ERROR, { message: 'Join first.' });
      return;
    }

    if (msg.type === ClientEvent.START_TRAINING) {
      const lessonId = Number(msg.payload?.lessonId);
      const snapshot = trainingManager.start(client.sessionId, lessonId);
      if (!snapshot) {
        send(ws, ServerEvent.ERROR, { message: 'Unknown lesson.' });
        return;
      }
      send(ws, ServerEvent.TRAINING_STATE, snapshot);
      return;
    }

    if (msg.type === ClientEvent.START_RANDOM_TRAINING) {
      const wordCount = Math.min(100, Math.max(10, Number(msg.payload?.wordCount ?? 30)));
      const snapshot = trainingManager.startRandom(client.sessionId, wordCount);
      send(ws, ServerEvent.TRAINING_STATE, snapshot);
      return;
    }

    if (msg.type === ClientEvent.START_TARGETED_TRAINING) {
      const targetChars = msg.payload?.targetChars ?? [];
      const wordCount = Math.min(100, Math.max(10, Number(msg.payload?.wordCount ?? 30)));
      const snapshot = trainingManager.startTargeted(client.sessionId, targetChars, wordCount);
      send(ws, ServerEvent.TRAINING_STATE, snapshot);
      return;
    }

    if (msg.type === ClientEvent.TRAINING_INPUT) {
      const typed = String(msg.payload?.typed || '');
      const output = trainingManager.updateInput(client.sessionId, typed);
      if (!output) return;
      send(ws, ServerEvent.TRAINING_STATE, output.snapshot);
      if (output.result) send(ws, ServerEvent.LESSON_RESULT, output.result);
      return;
    }

    if (msg.type === ClientEvent.JOIN_COMPETITION) {
      const result = competitionManager.join(client.sessionId, client.name);
      if (!result.ok) {
        send(ws, ServerEvent.COMPETITION_FULL, { message: 'Competition room is full or already started.' });
        return;
      }
      broadcastCompetitionState();
      return;
    }

    if (msg.type === ClientEvent.START_COMPETITION) {
      const started = competitionManager.startRace(client.sessionId);
      if (started) broadcastCompetitionState();
      return;
    }

    if (msg.type === ClientEvent.LEAVE_COMPETITION) {
      competitionManager.leave(client.sessionId);
      broadcastCompetitionState();
      return;
    }

    if (msg.type === ClientEvent.COMPETITION_INPUT) {
      const typed = String(msg.payload?.typed || '');
      const state = competitionManager.updateInput(client.sessionId, typed);
      if (!state) return;
      broadcastCompetitionState();
      if (state.winner) {
        broadcast(ServerEvent.COMPETITION_RESULT, state.winner);
      }
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      trainingManager.clear(client.sessionId);
      competitionManager.leave(client.sessionId);
    }
    clients.delete(ws);
    broadcastOnlineCount();
    broadcastCompetitionState();
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Typetition backend listening on http://localhost:${PORT}`);
});
