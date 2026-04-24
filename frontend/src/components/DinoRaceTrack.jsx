/**
 * DinoRaceTrack — a horizontal race track with a running T-Rex per player.
 * Drop-in replacement for progress bar rows.
 */

const PLAYER_COLORS = [
  '#5aa0ff', // blue  (you / first)
  '#52d68a', // green
  '#fbbf45', // amber
  '#c084fc', // purple
  '#fb7185', // rose
];

export function getPlayerColor(index) {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

/** A single racer track */
export function DinoTrack({ name, progress, isMe, color, finished, compact = false }) {
  const trackHeight = compact ? 52 : 64;
  const dinoSize = compact ? 32 : 40;
  const labelSize = compact ? 11 : 12;

  // clamp so dino doesn't overflow container
  const clampedProgress = Math.min(98, Math.max(0, progress));

  return (
    <div style={{ width: '100%', marginBottom: compact ? 6 : 10 }}>
      {/* Name label */}
      <div style={{
        fontFamily: 'var(--font-sans)',
        fontSize: labelSize,
        fontWeight: isMe ? 700 : 400,
        color: isMe ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)',
        marginBottom: 2,
        letterSpacing: '0.01em',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>{isMe ? `${name} (you)` : name}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: labelSize - 1, color: 'rgba(255,255,255,0.25)' }}>
          {finished ? '✓ done' : `${progress}%`}
        </span>
      </div>

      {/* Track */}
      <div style={{
        position: 'relative',
        height: trackHeight,
        width: '100%',
      }}>
        {/* Ground line */}
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 0,
          right: 0,
          height: 2,
          borderRadius: 1,
          background: `${color}22`,
        }} />

        {/* Distance dots */}
        {[25, 50, 75].map(pct => (
          <div key={pct} style={{
            position: 'absolute',
            bottom: 9,
            left: `${pct}%`,
            width: 2,
            height: 4,
            borderRadius: 1,
            background: `${color}33`,
            transform: 'translateX(-50%)',
          }} />
        ))}

        {/* Finish flag */}
        <div style={{
          position: 'absolute',
          right: 0,
          bottom: 12,
          fontSize: compact ? 14 : 18,
          lineHeight: 1,
          filter: finished ? 'none' : 'opacity(0.35)',
        }}>
          🏁
        </div>

        {/* Dino */}
        <div
          style={{
            position: 'absolute',
            left: `${clampedProgress}%`,
            bottom: 10,
            transform: 'translateX(-50%)',
            width: dinoSize,
            height: dinoSize,
            animation: finished ? 'none' : 'dino-bob 0.32s ease-in-out infinite',
          }}
        >
          <DinoSvg
            color={color}
            size={dinoSize}
            running={!finished}
          />
        </div>
      </div>
    </div>
  );
}

/** All racers stacked */
export function DinoRaceList({ players, myName, compact = false }) {
  const sorted = [...players].sort((a, b) => b.progress - a.progress);
  return (
    <div>
      {sorted.map((player, i) => {
        const originalIndex = players.findIndex(p => p.sessionId === player.sessionId);
        const color = getPlayerColor(originalIndex);
        return (
          <DinoTrack
            key={player.sessionId}
            name={player.name}
            progress={player.progress}
            isMe={player.name === myName}
            color={color}
            finished={player.finished}
            compact={compact}
          />
        );
      })}
    </div>
  );
}

/** Simple pixel-art T-Rex SVG */
function DinoSvg({ color, size = 40, running = true }) {
  const s = size / 40; // scale factor

  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      style={{ overflow: 'visible', display: 'block' }}
    >
      {/* Tail */}
      <rect x={0} y={18} width={12} height={5} rx={2} fill={color} opacity={0.85} transform={`scale(${s})`} />

      {/* Body */}
      <rect x={8} y={15} width={22} height={13} rx={3} fill={color} transform={`scale(${s})`} />

      {/* Neck */}
      <rect x={22} y={9} width={7} height={9} rx={2} fill={color} transform={`scale(${s})`} />

      {/* Head */}
      <rect x={22} y={3} width={14} height={11} rx={3} fill={color} transform={`scale(${s})`} />

      {/* Eye */}
      <circle cx={32} cy={7} r={2} fill="#fff" opacity={0.9} transform={`scale(${s})`} />
      <circle cx={32.5} cy={7} r={1} fill="#111" transform={`scale(${s})`} />

      {/* Jaw / teeth hint */}
      <rect x={33} y={11} width={4} height={3} rx={1} fill={color} opacity={0.7} transform={`scale(${s})`} />

      {/* Tiny arm */}
      <rect x={25} y={17} width={5} height={3} rx={1} fill={color} opacity={0.6} transform={`scale(${s})`} />

      {/* Back leg */}
      <g
        style={{
          transformOrigin: `${16 * s}px ${28 * s}px`,
          animation: running ? 'leg-back 0.32s ease-in-out infinite' : 'none',
        }}
      >
        <rect x={14} y={28} width={6} height={5} rx={1} fill={color} transform={`scale(${s})`} />
        <rect x={13} y={32} width={7} height={4} rx={1} fill={color} transform={`scale(${s})`} />
      </g>

      {/* Front leg */}
      <g
        style={{
          transformOrigin: `${25 * s}px ${28 * s}px`,
          animation: running ? 'leg-front 0.32s ease-in-out infinite' : 'none',
        }}
      >
        <rect x={23} y={28} width={6} height={5} rx={1} fill={color} transform={`scale(${s})`} />
        <rect x={22} y={32} width={7} height={4} rx={1} fill={color} transform={`scale(${s})`} />
      </g>
    </svg>
  );
}
