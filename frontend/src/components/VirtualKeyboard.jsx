import { motion } from 'framer-motion';

const rows = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  ['Space'],
];

export function VirtualKeyboard({ pressedKeys }) {
  const normalized = new Set(pressedKeys.map((key) => key.toLowerCase()));
  if (normalized.has(' ')) normalized.add('space');

  return (
    <svg viewBox="0 0 920 270" className="w-full rounded bg-slate-900 p-2">
      {rows.map((row, rowIndex) =>
        row.map((key, keyIndex) => {
          const keyWidth = key === 'Space' ? 560 : 70;
          const x = key === 'Space' ? 180 : 20 + keyIndex * 85;
          const y = 20 + rowIndex * 60;
          const isPressed = normalized.has(key.toLowerCase());
          return (
            <g key={`${rowIndex}-${key}`}>
              <motion.rect
                x={x}
                y={y}
                rx="8"
                ry="8"
                width={keyWidth}
                height="48"
                animate={{
                  fill: isPressed ? '#6366f1' : '#334155',
                  opacity: isPressed ? 0.95 : 1,
                }}
              />
              <text x={x + keyWidth / 2} y={y + 30} textAnchor="middle" fill="#e2e8f0" fontSize="18">
                {key}
              </text>
            </g>
          );
        }),
      )}
    </svg>
  );
}
