import { useEffect, useMemo, useRef, useState } from 'react';
import { ProgressBar } from './components/ProgressBar';
import { TypingTextPanel } from './components/TypingTextPanel';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { KeyboardHeatmap } from './components/KeyboardHeatmap';
import { SessionStats } from './components/SessionStats';
import { createSocketClient } from './ws/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const DEFAULT_BACKEND_ORIGIN = isLocalhost ? 'http://localhost:3001' : window.location.origin;
const DEFAULT_WS_URL = isLocalhost
  ? 'ws://localhost:3001'
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://typetition-ws.trex.gr`;
const BACKEND_HTTP_URL = import.meta.env.VITE_BACKEND_ORIGIN || DEFAULT_BACKEND_ORIGIN;
const WS_URL = import.meta.env.VITE_WS_URL || DEFAULT_WS_URL;

function calcWpm(typed, startTime) {
  if (!startTime || !typed) return 0;
  const minutes = (Date.now() - startTime) / 60000;
  if (minutes < 0.01) return 0;
  return Math.round(typed.trim().split(/\s+/).filter(Boolean).length / minutes);
}

function calcAccuracy(target, typed) {
  if (!typed.length) return 100;
  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) correct++;
  }
  return Math.round((correct / typed.length) * 100);
}

function calcBurstWpm(wordTimestamps, windowMs = 5000) {
  if (!wordTimestamps.length) return 0;
  let max = 0;
  for (const { t } of wordTimestamps) {
    const count = wordTimestamps.filter((w) => w.t > t - windowMs && w.t <= t).length;
    const wpm = Math.round((count / windowMs) * 60000);
    if (wpm > max) max = wpm;
  }
  return max;
}

function buildWpmTimeSeries(wordTimestamps, typingStartTime) {
  if (!typingStartTime || !wordTimestamps.length) return [];
  const lastT = wordTimestamps[wordTimestamps.length - 1].t;
  const elapsedSec = Math.ceil((lastT - typingStartTime) / 1000);
  return Array.from({ length: elapsedSec }, (_, i) => {
    const t = typingStartTime + (i + 1) * 1000;
    const wordsDone = wordTimestamps.filter((w) => w.t <= t).length;
    return { t: i + 1, wpm: wordsDone > 0 ? Math.round(wordsDone / ((i + 1) / 60)) : 0 };
  });
}

function buildWpmPerWord(wordTimestamps, typingStartTime) {
  if (!typingStartTime || !wordTimestamps.length) return [];
  return wordTimestamps.map(({ word, t }, i) => ({
    word: i + 1,
    label: word,
    wpm: Math.round((i + 1) / ((t - typingStartTime) / 60000)),
  }));
}

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
  const [keyErrorMap, setKeyErrorMap] = useState({});
  const [typed, setTyped] = useState('');
  const [typingStartTime, setTypingStartTime] = useState(null);
  const [wordTimestamps, setWordTimestamps] = useState([]);
  const socketRef = useRef(null);
  const isActiveTypingRef = useRef(false);
  const activeTargetRef = useRef('');
  const typingModeRef = useRef(null);

  const activeTarget = useMemo(() => {
    if (mode === 'training' && training) return training.text ?? '';
    if (mode === 'competition' && competitionState?.started) return competitionState.text ?? '';
    return '';
  }, [mode, training, competitionState]);

  const wpm = useMemo(() => calcWpm(typed, typingStartTime), [typed, typingStartTime]);
  const accuracy = useMemo(() => calcAccuracy(activeTarget, typed), [activeTarget, typed]);
  const burstWpm = useMemo(() => calcBurstWpm(wordTimestamps), [wordTimestamps]);
  const wpmTimeSeries = useMemo(
    () => buildWpmTimeSeries(wordTimestamps, typingStartTime),
    [wordTimestamps, typingStartTime],
  );
  const wpmPerWord = useMemo(
    () => buildWpmPerWord(wordTimestamps, typingStartTime),
    [wordTimestamps, typingStartTime],
  );
  const elapsedMs = useMemo(() => {
    if (!typingStartTime || !wordTimestamps.length) return 0;
    return wordTimestamps[wordTimestamps.length - 1].t - typingStartTime;
  }, [typingStartTime, wordTimestamps]);
  const totalErrors = useMemo(
    () => Object.values(keyErrorMap).reduce((s, v) => s + v, 0),
    [keyErrorMap],
  );

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

      if (!isActiveTypingRef.current) return;
      // Don't interfere with browser shortcuts
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === 'Backspace') {
        event.preventDefault();
        setTyped((prev) => {
          const next = prev.slice(0, -1);
          const m = typingModeRef.current;
          if (m === 'training') socketRef.current?.send('training_input', { typed: next });
          if (m === 'competition') socketRef.current?.send('competition_input', { typed: next });
          return next;
        });
      } else if (event.key.length === 1) {
        event.preventDefault();
        const now = Date.now();
        const char = event.key;
        const target = activeTargetRef.current;
        const m = typingModeRef.current;

        setTyped((prev) => {
          const next = prev + char;
          const idx = prev.length; // index of the new character

          if (prev.length === 0) setTypingStartTime(now);

          const expected = target[idx];
          if (expected && char !== expected) {
            const k = expected.toLowerCase();
            setKeyErrorMap((em) => ({ ...em, [k]: (em[k] ?? 0) + 1 }));
          }
          if (char === ' ' && idx > 0) {
            const wordsBefore = next.slice(0, idx).trim().split(/\s+/).filter(Boolean);
            const completedWord = wordsBefore[wordsBefore.length - 1] ?? '';
            setWordTimestamps((wt) => [
              ...wt,
              { wordIdx: wordsBefore.length - 1, word: completedWord, t: now },
            ]);
          }

          if (m === 'training') socketRef.current?.send('training_input', { typed: next });
          if (m === 'competition') socketRef.current?.send('competition_input', { typed: next });
          return next;
        });
      }
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
    if (!name.trim()) return;
    socketRef.current?.send('join', { name });
  }

  function startLesson(lessonId) {
    setTyped('');
    setLessonResult(null);
    setTypingStartTime(null);
    setKeyErrorMap({});
    socketRef.current?.send('start_training', { lessonId });
  }

  function startRandomTraining(wordCount = 30) {
    setTyped('');
    setLessonResult(null);
    setTypingStartTime(null);
    setKeyErrorMap({});
    setWordTimestamps([]);
    socketRef.current?.send('start_random_training', { wordCount });
  }

  function joinCompetition() {
    setCompMessage('');
    setTyped('');
    setTypingStartTime(null);
    setKeyErrorMap({});
    setWordTimestamps([]);
    socketRef.current?.send('join_competition');
  }

  function startCompetition() {
    socketRef.current?.send('start_competition');
  }

  function startTargetedTraining(weakKeys) {
    setTyped('');
    setLessonResult(null);
    setTypingStartTime(null);
    setKeyErrorMap({});
    setWordTimestamps([]);
    setMode('training');
    socketRef.current?.send('start_targeted_training', { targetChars: weakKeys, wordCount: 30 });
  }


  const isActiveTyping =
    (mode === 'training' && !!training) ||
    (mode === 'competition' && !!competitionState?.started);

  // Keep refs in sync so keydown handler always has current values
  useEffect(() => { isActiveTypingRef.current = isActiveTyping; }, [isActiveTyping]);
  useEffect(() => { activeTargetRef.current = activeTarget; }, [activeTarget]);
  useEffect(() => { typingModeRef.current = mode; }, [mode]);

  const isAfterView =
    (mode === 'training' && !!lessonResult) ||
    (mode === 'competition' && isActiveTyping && !!compMessage);

  const weakKeys = Object.entries(keyErrorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 32px',
          borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 17,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: '-0.02em',
            }}
          >
            typetition
          </span>
        </div>
        <Badge>
          <span
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: onlineCount > 0 ? 'oklch(0.72 0.14 160)' : 'rgba(255,255,255,0.2)',
              marginRight: 6,
            }}
          />
          {onlineCount} online
        </Badge>
      </header>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 24px 40px',
          maxWidth: 960,
          width: '100%',
          margin: '0 auto',
          gap: 0,
        }}
      >
        {/* Join card */}
        {!joined && (
          <Card
            className="animate-fade-in"
            style={{ width: '100%', maxWidth: 480, marginBottom: 24 }}
          >
            <CardHeader>
              <CardTitle>Enter your name to join</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  maxLength={24}
                  placeholder="Player name"
                />
                <Button onClick={handleJoin} disabled={!name.trim()}>
                  Join
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mode selection */}
        {joined && !mode && (
          <Card
            className="animate-fade-in"
            style={{ width: '100%', maxWidth: 480, marginBottom: 24 }}
          >
            <CardHeader>
              <CardTitle>Choose a mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  style={{ flex: 1 }}
                  onClick={() => setMode('training')}
                >
                  Practice
                </Button>
                <Button
                  variant="outline"
                  style={{ flex: 1 }}
                  onClick={() => setMode('competition')}
                >
                  Compete
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Training lesson list */}
        {mode === 'training' && !training && (
          <div className="animate-fade-in" style={{ width: '100%', marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.45)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Practice
              </span>
              <Button variant="ghost" size="sm" onClick={() => setMode(null)}>
                Back
              </Button>
            </div>

            {/* Random text section */}
            <div
              style={{
                marginBottom: 20,
                padding: '16px 18px',
                borderRadius: 12,
                background: 'rgba(80,160,255,0.06)',
                border: '0.5px solid rgba(80,160,255,0.18)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 3 }}>
                    Random words
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                    Fresh random text every time
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  {[15, 30, 50, 75].map((n) => (
                    <button
                      key={n}
                      onClick={() => startRandomTraining(n)}
                      style={{
                        background: 'rgba(80,160,255,0.12)',
                        border: '0.5px solid rgba(80,160,255,0.3)',
                        borderRadius: 8,
                        padding: '6px 14px',
                        color: 'rgba(160,200,255,0.9)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(80,160,255,0.22)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(80,160,255,0.12)'; }}
                    >
                      {n}w
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Structured lessons */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 10,
              }}
            >
              Lessons
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 8,
              }}
            >
              {lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => startLesson(lesson.id)}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '0.5px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    textAlign: 'left',
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease, border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {String(lesson.id).padStart(2, '0')}
                  </span>
                  <div style={{ marginTop: 4 }}>{lesson.title}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Competition lobby */}
        {mode === 'competition' && !competitionState?.started && (() => {
          const isInRoom = competitionState?.players?.some((p) => p.name === name);
          return (
            <Card
              className="animate-fade-in"
              style={{ width: '100%', maxWidth: 480, marginBottom: 24 }}
            >
              <CardHeader>
                <CardTitle>Competition Room</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                    Players: {competitionState?.count ?? 0} / {competitionState?.capacity ?? 5}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setMode(null)}>
                    Back
                  </Button>
                </div>
                {!isInRoom ? (
                  <Button style={{ width: '100%' }} onClick={joinCompetition}>
                    Join Race
                  </Button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      style={{ flex: 1 }}
                      onClick={startCompetition}
                      disabled={!competitionState?.count}
                    >
                      Start Race
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        socketRef.current?.send('leave_competition');
                      }}
                    >
                      Leave
                    </Button>
                  </div>
                )}
                {compMessage && (
                  <p
                    style={{
                      marginTop: 12,
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.5)',
                      textAlign: 'center',
                    }}
                  >
                    {compMessage}
                  </p>
                )}
                {!!competitionState?.players?.length && (
                  <ul style={{ marginTop: 16, listStyle: 'none', padding: 0, margin: '16px 0 0' }}>
                    {competitionState.players.map((player, i) => (
                      <li
                        key={player.sessionId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 0',
                          borderTop: i > 0 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
                          fontSize: 13,
                          color: player.name === name ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
                        }}
                      >
                        <span>{player.name}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {player.progress}%{player.finished ? ' ✓' : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* Active typing area */}
        {isActiveTyping && (
          <div
            className="animate-fade-in"
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            {/* Header row: live stats (while typing) or action buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                marginBottom: isAfterView ? 16 : 28,
                paddingLeft: 2,
              }}
            >
              {!isAfterView && (
                <>
                  <StatItem label="WPM" value={wpm} mono />
                  <StatItem label="Accuracy" value={`${accuracy}%`} mono />
                  {mode === 'training' && training && (
                    <StatItem label="Time left" value={`${training.remainingSec}s`} mono />
                  )}
                  {mode === 'training' && training && training.errors > 0 && (
                    <StatItem label="Errors" value={training.errors} />
                  )}
                </>
              )}
              <div style={{ flex: 1 }} />
              {isAfterView && mode === 'training' && training?.lessonId === 'random' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startRandomTraining(training.text.split(' ').length)}
                >
                  Retry
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMode(null);
                  setTraining(null);
                  setTyped('');
                  setTypingStartTime(null);
                  setLessonResult(null);
                  setWordTimestamps([]);
                }}
              >
                Back
              </Button>
            </div>

            {/* Post-race keyboard heatmap */}
            {isAfterView && Object.keys(keyErrorMap).length > 0 && (
              <KeyboardHeatmap
                errorMap={keyErrorMap}
                target={activeTarget}
                typed={typed}
              />
            )}

            {/* Post-session stats dashboard */}
            {isAfterView && (
              <SessionStats
                wpm={wpm}
                burstWpm={burstWpm}
                accuracy={accuracy}
                elapsedMs={elapsedMs}
                errors={lessonResult ? lessonResult.errors : totalErrors}
                success={lessonResult?.success}
                winner={compMessage && mode === 'competition' ? compMessage : undefined}
                wpmTimeSeries={wpmTimeSeries}
                wpmPerWord={wpmPerWord}
                mode={mode}
              />
            )}

            {/* Typing text */}
            <div style={{ marginBottom: 20, minHeight: 80 }}>
              <TypingTextPanel target={activeTarget} typed={typed} />
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 32 }}>
              <ProgressBar value={selectedProgress} />
            </div>

            {/* Tailored practice recommendation */}
            {isAfterView && weakKeys.length > 0 && (
              <div
                style={{
                  marginTop: 28,
                  padding: '18px 20px',
                  borderRadius: 14,
                  background: 'rgba(120,80,255,0.07)',
                  border: '0.5px solid rgba(120,80,255,0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: 6,
                      }}
                    >
                      Tailored Practice
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                        Focus on:
                      </span>
                      {weakKeys.map((k) => (
                        <span
                          key={k}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            background: 'rgba(255,80,40,0.15)',
                            border: '0.5px solid rgba(255,80,40,0.35)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'rgba(255,180,160,0.95)',
                          }}
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => startTargetedTraining(weakKeys)}
                    style={{
                      background: 'rgba(120,80,255,0.18)',
                      border: '0.5px solid rgba(120,80,255,0.4)',
                      color: 'rgba(200,180,255,0.95)',
                      flexShrink: 0,
                    }}
                  >
                    Practice weak keys →
                  </Button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Keyboard — visible while actively typing, hidden in after-view */}
        {joined && !isAfterView && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              marginTop: isActiveTyping ? 0 : 32,
            }}
          >
            {!isActiveTyping && (
              <div style={{ marginBottom: 20 }}>
                <ProgressBar value={selectedProgress} />
              </div>
            )}
            <VirtualKeyboard pressedKeys={pressedKeys} />
          </div>
        )}
      </main>
    </div>
  );
}

function StatItem({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.3)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 20,
          fontWeight: 600,
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
          color: 'rgba(255,255,255,0.85)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default App;
