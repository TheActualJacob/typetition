import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ROWS, KEY_SIZE, KEY_GAP, UNIT, PANEL_PADDING } from './VirtualKeyboard';

const totalWidth = 10 * KEY_SIZE + 9 * KEY_GAP;
const maxIndent = 1.5;
const panelWidth = totalWidth + maxIndent * UNIT + PANEL_PADDING * 2;
const panelHeight = 4 * KEY_SIZE + 3 * KEY_GAP + PANEL_PADDING * 2;

function heatColor(intensity) {
  if (intensity <= 0) return null;
  if (intensity < 0.4) {
    // cool → amber
    const t = intensity / 0.4;
    return {
      background: `linear-gradient(160deg, rgba(255,${Math.round(180 - t * 60)},${Math.round(60 - t * 60)},${0.15 + t * 0.2}) 0%, rgba(255,${Math.round(160 - t * 60)},0,${0.08 + t * 0.1}) 100%)`,
      boxShadow: `0 0 ${Math.round(8 + t * 8)}px rgba(255,${Math.round(180 - t * 60)},0,${0.15 + t * 0.2})`,
      borderColor: `rgba(255,${Math.round(180 - t * 60)},0,${0.25 + t * 0.15})`,
    };
  }
  if (intensity < 0.7) {
    // amber → orange
    const t = (intensity - 0.4) / 0.3;
    return {
      background: `linear-gradient(160deg, rgba(255,${Math.round(120 - t * 60)},0,${0.35 + t * 0.1}) 0%, rgba(255,${Math.round(100 - t * 50)},0,${0.18 + t * 0.07}) 100%)`,
      boxShadow: `0 0 ${Math.round(16 + t * 10)}px rgba(255,${Math.round(120 - t * 60)},0,${0.3 + t * 0.15})`,
      borderColor: `rgba(255,${Math.round(100 - t * 60)},0,${0.4 + t * 0.15})`,
    };
  }
  // orange → red (hot)
  const t = (intensity - 0.7) / 0.3;
  return {
    background: `linear-gradient(160deg, rgba(255,${Math.round(60 - t * 60)},${Math.round(t * 20)},${0.45 + t * 0.2}) 0%, rgba(220,${Math.round(30 - t * 30)},0,${0.25 + t * 0.1}) 100%)`,
    boxShadow: `0 0 ${Math.round(26 + t * 14)}px rgba(255,${Math.round(40 - t * 40)},0,${0.45 + t * 0.2})`,
    borderColor: `rgba(255,${Math.round(40 - t * 40)},0,${0.55 + t * 0.2})`,
  };
}

function HeatKey({ label, count, intensity }) {
  const heat = heatColor(intensity);
  const hasError = count > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        width: KEY_SIZE,
        height: KEY_SIZE,
        borderRadius: 8,
        border: `0.5px solid ${heat?.borderColor ?? 'rgba(255,255,255,0.15)'}`,
        background: heat?.background ?? 'linear-gradient(160deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)',
        boxShadow: heat?.boxShadow ?? '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        cursor: 'default',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          fontWeight: 500,
          color: hasError ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
          letterSpacing: '0.01em',
          lineHeight: 1,
          pointerEvents: 'none',
        }}
      >
        {label}
      </span>
      {count > 0 && (
        <span
          style={{
            position: 'absolute',
            top: 3,
            right: 4,
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.8)',
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          {count}
        </span>
      )}
    </motion.div>
  );
}

function computeWordErrors(target, typed) {
  if (!target || !typed) return [];
  const targetWords = target.split(' ');
  const typedWords = typed.split(' ');
  const errorMap = new Map();

  let charIdx = 0;
  for (let wi = 0; wi < targetWords.length; wi++) {
    const tw = targetWords[wi];
    const uw = typedWords[wi] ?? '';
    let wordErrors = 0;
    for (let ci = 0; ci < tw.length; ci++) {
      if (uw[ci] !== tw[ci]) wordErrors++;
    }
    if (wordErrors > 0) {
      errorMap.set(tw, (errorMap.get(tw) ?? 0) + wordErrors);
    }
    charIdx += tw.length + 1;
  }

  return Array.from(errorMap.entries())
    .map(([word, errors]) => ({ word, errors }))
    .sort((a, b) => b.errors - a.errors);
}

export function KeyboardHeatmap({ errorMap, target, typed }) {
  const maxErrors = useMemo(() => {
    const vals = Object.values(errorMap);
    return vals.length ? Math.max(...vals) : 1;
  }, [errorMap]);

  const wordsWithErrors = useMemo(
    () => computeWordErrors(target, typed),
    [target, typed]
  );

  const totalErrors = useMemo(
    () => Object.values(errorMap).reduce((s, v) => s + v, 0),
    [errorMap]
  );

  if (totalErrors === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ width: '100%', marginTop: 28 }}
    >
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Error Heatmap
        </span>
        <span
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'rgba(255,80,60,0.7)',
          }}
        >
          {totalErrors} mistake{totalErrors !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Keyboard */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div
          style={{
            position: 'relative',
            width: panelWidth,
            height: panelHeight,
            borderRadius: 18,
            backdropFilter: 'blur(28px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
            background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
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
                const k = key.toLowerCase();
                const count = errorMap[k] ?? 0;
                const intensity = count / maxErrors;
                return (
                  <HeatKey key={key} label={key} count={count} intensity={intensity} />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
          marginTop: 12,
          marginBottom: wordsWithErrors.length ? 24 : 0,
        }}
      >
        {[
          { label: 'No errors', color: 'rgba(255,255,255,0.15)' },
          { label: 'Few', color: 'rgba(255,160,0,0.5)' },
          { label: 'Some', color: 'rgba(255,90,0,0.6)' },
          { label: 'Many', color: 'rgba(255,30,0,0.75)' },
        ].map(({ label, color }) => (
          <div
            key={label}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: color,
              }}
            />
            <span
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.3)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Missed words */}
      {wordsWithErrors.length > 0 && (
        <div>
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
            Missed words
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {wordsWithErrors.slice(0, 20).map(({ word, errors }) => (
              <motion.div
                key={word}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: 'rgba(255,60,40,0.1)',
                  border: '0.5px solid rgba(255,60,40,0.22)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'rgba(255,200,190,0.85)',
                  }}
                >
                  {word}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'rgba(255,100,80,0.8)',
                    fontWeight: 700,
                  }}
                >
                  ×{errors}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
