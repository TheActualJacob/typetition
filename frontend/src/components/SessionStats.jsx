import { motion } from 'framer-motion';
import { WpmTimeChart, WpmWordChart } from './SpeedChart';

function StatCard({ label, value, unit, accent, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      style={{
        flex: '1 1 0',
        minWidth: 90,
        padding: '14px 16px',
        borderRadius: 12,
        background: accent
          ? `rgba(${accent},0.07)`
          : 'rgba(255,255,255,0.04)',
        border: `0.5px solid ${accent ? `rgba(${accent},0.2)` : 'rgba(255,255,255,0.08)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.3)',
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: accent ? `rgba(${accent},0.95)` : 'rgba(255,255,255,0.9)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.3)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {unit}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function ChartBlock({ title, subtitle, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      style={{
        width: '100%',
        padding: '16px 18px 12px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.025)',
        border: '0.5px solid rgba(255,255,255,0.07)',
        marginBottom: 12,
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.7)',
            marginBottom: 2,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{subtitle}</div>
        )}
      </div>
      {children}
    </motion.div>
  );
}

export function SessionStats({ wpm, burstWpm, accuracy, elapsedMs, errors, success, wpmTimeSeries, wpmPerWord, mode, winner }) {
  const elapsedSec = elapsedMs > 0 ? (elapsedMs / 1000).toFixed(1) : '—';
  const hasChartData = wpmTimeSeries?.length > 1 || wpmPerWord?.length > 1;

  return (
    <div style={{ width: '100%', marginBottom: 28 }}>

      {/* Result banner */}
      {(success !== undefined || winner) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            marginBottom: 20,
            padding: '10px 16px',
            borderRadius: 10,
            background: success === false
              ? 'rgba(220,80,60,0.1)'
              : winner
              ? 'rgba(80,160,255,0.1)'
              : 'rgba(50,200,120,0.1)',
            border: `0.5px solid ${
              success === false
                ? 'rgba(220,80,60,0.25)'
                : winner
                ? 'rgba(80,160,255,0.25)'
                : 'rgba(50,200,120,0.25)'
            }`,
            fontSize: 13,
            color: success === false
              ? 'oklch(0.65 0.22 25)'
              : winner
              ? 'rgba(160,200,255,0.9)'
              : 'oklch(0.72 0.14 160)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {winner ? (
            <span>{winner}</span>
          ) : (
            <>
              <span>{success ? 'Lesson complete' : 'Time up'}</span>
              {errors > 0 && (
                <span style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  errors: {errors}
                </span>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Stat cards */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <StatCard label="WPM" value={wpm} delay={0} accent="100,160,255" />
        {burstWpm > 0 && (
          <StatCard label="Burst" value={burstWpm} unit="peak" delay={0.05} accent="180,120,255" />
        )}
        <StatCard
          label="Accuracy"
          value={`${accuracy}%`}
          delay={0.1}
          accent={accuracy >= 95 ? '80,200,140' : accuracy >= 80 ? '100,160,255' : '255,100,80'}
        />
        {elapsedMs > 0 && (
          <StatCard label="Time" value={elapsedSec} unit="s" delay={0.15} />
        )}
        {errors > 0 && (
          <StatCard label="Errors" value={errors} delay={0.2} accent="255,100,80" />
        )}
      </div>

      {/* Charts */}
      {hasChartData && (
        <>
          {wpmTimeSeries?.length > 1 && (
            <ChartBlock
              title="Speed over time"
              subtitle="Words per minute sampled each second"
              delay={0.25}
            >
              <WpmTimeChart data={wpmTimeSeries} />
            </ChartBlock>
          )}
          {wpmPerWord?.length > 1 && (
            <ChartBlock
              title="Speed per word"
              subtitle="Cumulative WPM at each word — green: fast · blue: normal · red: slow"
              delay={0.35}
            >
              <WpmWordChart data={wpmPerWord} />
            </ChartBlock>
          )}
        </>
      )}
    </div>
  );
}
