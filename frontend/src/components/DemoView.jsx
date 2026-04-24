import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const WS_URL = import.meta.env.VITE_WS_URL ?? (
  isLocalhost
    ? 'ws://localhost:3001'
    : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://typetition-ws.trex.gr`
);

const RACE_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

const LANE_COLORS = [
  { bar: 'oklch(0.65 0.18 240)',  glow: 'rgba(80,160,255,0.35)',  text: 'rgba(160,200,255,0.9)' },
  { bar: 'oklch(0.72 0.18 160)',  glow: 'rgba(60,200,120,0.35)',  text: 'rgba(140,220,170,0.9)' },
  { bar: 'oklch(0.72 0.20 55)',   glow: 'rgba(240,160,50,0.35)',  text: 'rgba(255,210,130,0.9)' },
  { bar: 'oklch(0.68 0.20 310)',  glow: 'rgba(200,80,220,0.35)',  text: 'rgba(230,170,255,0.9)' },
  { bar: 'oklch(0.68 0.22 25)',   glow: 'rgba(240,80,60,0.35)',   text: 'rgba(255,170,155,0.9)' },
];

function getColor(index) {
  return LANE_COLORS[index % LANE_COLORS.length];
}

export function DemoView() {
  const [compState, setCompState] = useState(null);
  const [phase, setPhase] = useState('waiting'); // waiting | racing | results
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const raceStartedAtRef = useRef(null);
  const timeoutRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'competition_state') {
        const state = msg.payload;
        setCompState(state);

        if (state.started && !raceStartedAtRef.current) {
          raceStartedAtRef.current = state.startedAt ?? Date.now();
          setPhase('racing');

          // Start timeout countdown
          clearTimeout(timeoutRef.current);
          clearInterval(countdownRef.current);

          const deadline = raceStartedAtRef.current + RACE_TIMEOUT_MS;

          countdownRef.current = setInterval(() => {
            const remaining = Math.max(0, deadline - Date.now());
            setCountdown(Math.ceil(remaining / 1000));
            if (remaining <= 0) {
              clearInterval(countdownRef.current);
              setTimeoutReached(true);
              setPhase('results');
            }
          }, 500);
        }

        // All players finished → go to results
        if (state.started && state.players?.length > 0) {
          const allDone = state.players.every((p) => p.finished);
          if (allDone) {
            clearTimeout(timeoutRef.current);
            clearInterval(countdownRef.current);
            setPhase('results');
          }
        }

        if (!state.started && raceStartedAtRef.current) {
          // Race was reset
          raceStartedAtRef.current = null;
          setPhase('waiting');
          setTimeoutReached(false);
          setCountdown(null);
          clearInterval(countdownRef.current);
        }
      }
    };

    return () => {
      ws.close();
      clearTimeout(timeoutRef.current);
      clearInterval(countdownRef.current);
    };
  }, []);

  const players = compState?.players ?? [];
  const sortedForResults = [...players].sort((a, b) => {
    if (a.finished && b.finished) return (a.elapsedMs ?? Infinity) - (b.elapsedMs ?? Infinity);
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.progress - a.progress;
  });
  const racingPlayers = [...players].sort((a, b) => b.progress - a.progress);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#08080f',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 48px 20px',
          borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 22,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '-0.03em',
          }}
        >
          typetition
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {phase === 'racing' && countdown !== null && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                color: countdown < 30 ? 'oklch(0.65 0.22 25)' : 'rgba(255,255,255,0.3)',
              }}
            >
              {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
            </span>
          )}
          <PhaseBadge phase={phase} timeoutReached={timeoutReached} playerCount={players.length} />
        </div>
      </header>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '40px 64px',
          maxWidth: 1100,
          width: '100%',
          margin: '0 auto',
        }}
      >
        <AnimatePresence mode="wait">
          {phase === 'waiting' && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ textAlign: 'center' }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.25)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: 20,
                }}
              >
                Waiting for race to start
              </div>
              {players.length > 0 && (
                <div style={{ marginTop: 32 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.2)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginBottom: 16,
                    }}
                  >
                    In lobby
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {players.map((p, i) => (
                      <div
                        key={p.sessionId}
                        style={{
                          padding: '8px 18px',
                          borderRadius: 999,
                          border: `0.5px solid ${getColor(i).bar}55`,
                          background: `${getColor(i).bar}12`,
                          color: getColor(i).text,
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                      >
                        {p.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <PulsingDots />
            </motion.div>
          )}

          {phase === 'racing' && (
            <motion.div
              key="racing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.25)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: 36,
                }}
              >
                Race in progress · {players.filter(p => p.finished).length}/{players.length} finished
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {racingPlayers.map((player, i) => {
                  const originalIndex = players.findIndex(p => p.sessionId === player.sessionId);
                  const color = getColor(originalIndex);
                  return (
                    <RacerLane
                      key={player.sessionId}
                      player={player}
                      color={color}
                      rank={i + 1}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}

          {phase === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.25)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 8,
                  }}
                >
                  {timeoutReached ? 'Time expired · Final results' : 'Race complete'}
                </div>
                {compState?.winner && (
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.9)',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    🏆 {compState.winner.name}
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 400,
                        color: 'rgba(255,255,255,0.35)',
                        marginLeft: 12,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {(compState.winner.elapsedMs / 1000).toFixed(2)}s
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sortedForResults.map((player, i) => {
                  const originalIndex = players.findIndex(p => p.sessionId === player.sessionId);
                  const color = getColor(originalIndex);
                  const medals = ['🥇', '🥈', '🥉'];
                  const medal = medals[i] ?? `${i + 1}.`;
                  return (
                    <motion.div
                      key={player.sessionId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.35, ease: 'easeOut' }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                        padding: '18px 28px',
                        borderRadius: 14,
                        border: `0.5px solid ${i === 0 ? color.bar + '50' : 'rgba(255,255,255,0.06)'}`,
                        background: i === 0 ? `${color.bar}0d` : 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <span style={{ fontSize: 26, minWidth: 36 }}>{medal}</span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 20,
                          fontWeight: 600,
                          color: color.text,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {player.name}
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        {player.finished && player.elapsedMs ? (
                          <>
                            <div
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 22,
                                fontWeight: 700,
                                color: player.validFinish ? color.text : 'rgba(255,255,255,0.2)',
                                letterSpacing: '-0.02em',
                              }}
                            >
                              {(player.elapsedMs / 1000).toFixed(2)}s
                            </div>
                            {!player.validFinish && (
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>
                                invalid finish
                              </div>
                            )}
                          </>
                        ) : (
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 18,
                              color: 'rgba(255,255,255,0.2)',
                            }}
                          >
                            {player.progress}%
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function RacerLane({ player, color, rank }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {/* Rank */}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'rgba(255,255,255,0.2)',
          minWidth: 20,
          textAlign: 'right',
        }}
      >
        {rank}
      </span>

      {/* Name */}
      <span
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: player.finished ? color.text : 'rgba(255,255,255,0.7)',
          minWidth: 140,
          maxWidth: 140,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {player.name}
      </span>

      {/* Progress track */}
      <div
        style={{
          flex: 1,
          height: 18,
          borderRadius: 9,
          background: 'rgba(255,255,255,0.05)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <motion.div
          animate={{ width: `${player.progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            borderRadius: 9,
            background: player.finished
              ? `linear-gradient(90deg, ${color.bar}, ${color.bar}cc)`
              : `linear-gradient(90deg, ${color.bar}99, ${color.bar}dd)`,
            boxShadow: player.finished ? `0 0 16px ${color.glow}` : 'none',
          }}
        />
      </div>

      {/* Status */}
      <div
        style={{
          minWidth: 72,
          textAlign: 'right',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
        }}
      >
        {player.finished ? (
          <span style={{ color: color.text, fontWeight: 700 }}>
            {player.elapsedMs ? `${(player.elapsedMs / 1000).toFixed(2)}s` : '✓'}
          </span>
        ) : (
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>
            {player.progress}%
          </span>
        )}
      </div>
    </div>
  );
}

function PhaseBadge({ phase, timeoutReached, playerCount }) {
  if (phase === 'waiting') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          borderRadius: 999,
          border: '0.5px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.05)',
          fontSize: 12,
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        <span
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
          }}
        />
        Waiting · {playerCount} in lobby
      </span>
    );
  }
  if (phase === 'racing') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          borderRadius: 999,
          border: '0.5px solid rgba(255,80,80,0.35)',
          background: 'rgba(255,80,80,0.1)',
          fontSize: 12,
          color: 'rgba(255,160,160,0.9)',
        }}
      >
        <span
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'rgba(255,80,80,0.9)',
            animation: 'cursor-blink 1s ease-in-out infinite',
          }}
        />
        Live
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        borderRadius: 999,
        border: '0.5px solid rgba(255,200,50,0.35)',
        background: 'rgba(255,200,50,0.08)',
        fontSize: 12,
        color: 'rgba(255,220,120,0.9)',
      }}
    >
      {timeoutReached ? 'Time expired' : 'Finished'}
    </span>
  );
}

function PulsingDots() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        justifyContent: 'center',
        marginTop: 48,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            animation: `cursor-blink 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
