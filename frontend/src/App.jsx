import { useEffect, useMemo, useRef, useState } from 'react';
import { ProgressBar } from './components/ProgressBar';
import { TypingTextPanel } from './components/TypingTextPanel';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { createSocketClient } from './ws/client';

const DEFAULT_BACKEND_ORIGIN = window.location.origin;
const DEFAULT_WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://typetition-ws.trex.gr`;
const BACKEND_HTTP_URL = import.meta.env.VITE_BACKEND_ORIGIN || DEFAULT_BACKEND_ORIGIN;
const WS_URL = import.meta.env.VITE_WS_URL || DEFAULT_WS_URL;

function App() {
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [mode, setMode] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [lessons, setLessons] = useState([]);
  const [training, setTraining] = useState(null);
  const [lessonResult, setLessonResult] = useState(null);
  const [competitionState, setCompetitionState] = useState(null);
  const [compMessage, setCompMessage] = useState('');
  const [pressedKeys, setPressedKeys] = useState([]);
  const [typed, setTyped] = useState('');
  const socketRef = useRef(null);

  const selectedProgress = useMemo(() => {
    if (mode === 'training') return training?.progress ?? 0;
    if (mode === 'competition') {
      const me = competitionState?.players?.find((p) => p.name === name);
      return me?.progress ?? 0;
    }
    return 0;
  }, [mode, training, competitionState, name]);

  useEffect(() => {
    fetch(`${BACKEND_HTTP_URL}/lessons`)
      .then((res) => res.json())
      .then((data) => setLessons(data.lessons || []))
      .catch(() => setLessons([]));

    const client = createSocketClient(WS_URL, {
      onOnlineCount: (payload) => setOnlineCount(Number(payload?.count ?? 0)),
      onTrainingState: setTraining,
      onLessonResult: setLessonResult,
      onCompetitionState: setCompetitionState,
      onCompetitionFull: () => setCompMessage('Competition is full (max 5 users).'),
      onJoined: () => setJoined(true),
      onCompetitionResult: (winner) =>
        setCompMessage(`Winner: ${winner.name} (${(winner.elapsedMs / 1000).toFixed(2)}s)`),
    });
    socketRef.current = client;

    return () => client.close();
  }, []);

  useEffect(() => {
    function onDown(event) {
      setPressedKeys((prev) => [...new Set([...prev, event.key])]);
    }
    function onUp(event) {
      setPressedKeys((prev) => prev.filter((key) => key !== event.key));
    }
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  function handleJoin() {
    socketRef.current?.send('join', { name });
  }

  function startLesson(lessonId) {
    setTyped('');
    setLessonResult(null);
    socketRef.current?.send('start_training', { lessonId });
  }

  function joinCompetition() {
    setCompMessage('');
    setTyped('');
    socketRef.current?.send('join_competition');
  }

  function handleTyping(value) {
    setTyped(value);
    if (mode === 'training') socketRef.current?.send('training_input', { typed: value });
    if (mode === 'competition') socketRef.current?.send('competition_input', { typed: value });
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-6">
      <h1 className="mb-4 text-3xl font-bold">Typetition</h1>
      <div className="mb-4 rounded-lg bg-slate-800 p-3 text-sm">
        Online users: <b>{onlineCount}</b>
      </div>

      {!joined && (
        <section className="mb-4 rounded-lg bg-slate-800 p-4">
          <h2 className="mb-2 text-xl font-semibold">Enter your name</h2>
          <div className="flex gap-2">
            <input
              className="w-full rounded bg-slate-900 p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="Player name"
            />
            <button className="rounded bg-indigo-500 px-4 py-2" type="button" onClick={handleJoin}>
              Join
            </button>
          </div>
        </section>
      )}

      {joined && !mode && (
        <section className="mb-4 rounded-lg bg-slate-800 p-4">
          <h2 className="mb-2 text-xl font-semibold">Choose mode</h2>
          <div className="flex gap-2">
            <button className="rounded bg-emerald-600 px-4 py-2" type="button" onClick={() => setMode('training')}>
              Start Training
            </button>
            <button className="rounded bg-amber-600 px-4 py-2" type="button" onClick={() => setMode('competition')}>
              Compete
            </button>
          </div>
        </section>
      )}

      {mode === 'training' && (
        <section className="mb-4 rounded-lg bg-slate-800 p-4">
          <h2 className="mb-2 text-xl font-semibold">Training Lessons</h2>
          <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-5">
            {lessons.map((lesson) => (
              <button
                key={lesson.id}
                className="rounded bg-slate-700 px-3 py-2 text-left hover:bg-slate-600"
                type="button"
                onClick={() => startLesson(lesson.id)}
              >
                {lesson.id}. {lesson.title}
              </button>
            ))}
          </div>
          {training && (
            <>
              <p className="mb-2 text-sm">Time left: {training.remainingSec}s | Errors: {training.errors}</p>
              <TypingTextPanel target={training.text} typed={typed} />
              <textarea
                className="mt-3 h-32 w-full rounded bg-slate-900 p-2"
                value={typed}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder="Start typing here..."
              />
              {lessonResult && (
                <p className="mt-2 text-sm">
                  {lessonResult.success ? 'Success!' : 'Failed'} | in time: {String(lessonResult.inTime)} | errors:{' '}
                  {lessonResult.errors}
                </p>
              )}
            </>
          )}
          <button className="mt-3 rounded bg-slate-700 px-3 py-2" type="button" onClick={() => setMode(null)}>
            Back
          </button>
        </section>
      )}

      {mode === 'competition' && (
        <section className="mb-4 rounded-lg bg-slate-800 p-4">
          <h2 className="mb-2 text-xl font-semibold">Competition</h2>
          <p className="mb-2 text-sm">
            Players in room: {competitionState?.count ?? 0}/{competitionState?.capacity ?? 5}
          </p>
          <button className="mb-3 rounded bg-amber-600 px-4 py-2" type="button" onClick={joinCompetition}>
            Join Competition
          </button>
          {compMessage && <p className="mb-2 text-sm">{compMessage}</p>}
          {competitionState?.started && (
            <>
              <TypingTextPanel target={competitionState.text} typed={typed} />
              <textarea
                className="mt-3 h-32 w-full rounded bg-slate-900 p-2"
                value={typed}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder="Race text here..."
              />
            </>
          )}
          {!!competitionState?.players?.length && (
            <ul className="mt-3 space-y-1 text-sm">
              {competitionState.players.map((player) => (
                <li key={player.sessionId} className="rounded bg-slate-900 p-2">
                  {player.name}: {player.progress}% {player.finished ? '(finished)' : ''}
                </li>
              ))}
            </ul>
          )}
          <button className="mt-3 rounded bg-slate-700 px-3 py-2" type="button" onClick={() => setMode(null)}>
            Back
          </button>
        </section>
      )}

      <section className="mb-4 rounded-lg bg-slate-800 p-4">
        <h3 className="mb-2 text-lg font-semibold">Your Progress</h3>
        <ProgressBar value={selectedProgress} />
      </section>

      <section className="rounded-lg bg-slate-800 p-4">
        <h3 className="mb-2 text-lg font-semibold">Keyboard</h3>
        <VirtualKeyboard pressedKeys={pressedKeys} />
      </section>
    </main>
  );
}

export default App;
