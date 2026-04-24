const EVENT_MAP = {
  online_count: 'onOnlineCount',
  training_state: 'onTrainingState',
  lesson_result: 'onLessonResult',
  competition_state: 'onCompetitionState',
  competition_full: 'onCompetitionFull',
  joined: 'onJoined',
  competition_result: 'onCompetitionResult',
};

export function createSocketClient(url, handlers) {
  const ws = new WebSocket(url);

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const handlerName = EVENT_MAP[message.type];
    const handler = handlers[handlerName];
    if (handler) handler(message.payload);
  };

  return {
    send(type, payload = {}) {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type, payload }));
    },
    close() {
      ws.close();
    },
  };
}
