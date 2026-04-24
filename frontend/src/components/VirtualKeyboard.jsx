import { motion } from 'framer-motion';

const ROWS = [
  { keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], indent: 0 },
  { keys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], indent: 0.5 },
  { keys: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'], indent: 1 },
  { keys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'], indent: 1.5 },
];

const KEY_SIZE = 44;
const KEY_GAP = 6;
const UNIT = KEY_SIZE + KEY_GAP;
const PANEL_PADDING = 20;

const totalWidth = 10 * KEY_SIZE + 9 * KEY_GAP;
const maxIndent = 1.5;
const panelWidth = totalWidth + maxIndent * UNIT + PANEL_PADDING * 2;
const panelHeight = 4 * KEY_SIZE + 3 * KEY_GAP + PANEL_PADDING * 2;

export function VirtualKeyboard({ pressedKeys }) {
  const normalized = new Set(pressedKeys.map((k) => k.toLowerCase()));
  if (normalized.has(' ')) normalized.add('space');

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: panelWidth,
          height: panelHeight,
          borderRadius: 18,
          backdropFilter: 'blur(28px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
          background: 'linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
          border: '0.5px solid rgba(255,255,255,0.12)',
          boxShadow:
            '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.2)',
          padding: PANEL_PADDING,
        }}
      >
        {ROWS.map(({ keys, indent }, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: 'flex',
              gap: KEY_GAP,
              marginBottom: rowIndex < ROWS.length - 1 ? KEY_GAP : 0,
              paddingLeft: indent * UNIT,
            }}
          >
            {keys.map((key) => {
              const isPressed = normalized.has(key.toLowerCase());
              return (
                <Key key={key} label={key} isPressed={isPressed} />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function Key({ label, isPressed }) {
  return (
    <motion.div
      animate={
        isPressed
          ? {
              background: 'linear-gradient(160deg, rgba(80,160,255,0.42) 0%, rgba(40,100,255,0.2) 100%)',
              boxShadow: '0 0 16px rgba(80,160,255,0.4), inset 0 1px 0 rgba(255,255,255,0.35)',
              borderColor: 'rgba(100,170,255,0.45)',
              scale: 0.92,
            }
          : {
              background: 'linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.04) 100%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
              borderColor: 'rgba(255,255,255,0.15)',
              scale: 1,
            }
      }
      transition={{ duration: 0.08, ease: 'easeOut' }}
      style={{
        width: KEY_SIZE,
        height: KEY_SIZE,
        borderRadius: 8,
        border: '0.5px solid rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        cursor: 'default',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          fontWeight: 500,
          color: isPressed ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)',
          letterSpacing: '0.01em',
          lineHeight: 1,
          transition: 'color 0.08s ease',
          pointerEvents: 'none',
        }}
      >
        {label}
      </span>
    </motion.div>
  );
}
