import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

const GRID_COLOR = 'rgba(255,255,255,0.05)';
const TICK_COLOR = 'rgba(255,255,255,0.25)';
const AXIS_STYLE = {
  fontSize: 11,
  fontFamily: 'var(--font-mono)',
  fill: TICK_COLOR,
};

function WpmTooltip({ active, payload, labelKey, labelSuffix = '' }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  const label = payload[0]?.payload?.[labelKey];
  return (
    <div
      style={{
        background: 'rgba(18,18,22,0.95)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: '8px 12px',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        pointerEvents: 'none',
      }}
    >
      {label !== undefined && (
        <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>
          {label}{labelSuffix}
        </div>
      )}
      <span style={{ color: 'rgba(140,200,255,0.95)', fontWeight: 700 }}>{val}</span>
      <span style={{ color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>wpm</span>
    </div>
  );
}

/** WPM over time — smooth area chart */
export function WpmTimeChart({ data }) {
  if (!data?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{ width: '100%', height: 180 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="wpmTimeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgba(100,160,255,0.35)" />
              <stop offset="95%" stopColor="rgba(100,160,255,0)" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="t"
            tickLine={false}
            axisLine={false}
            tick={AXIS_STYLE}
            tickFormatter={(v) => `${v}s`}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={AXIS_STYLE}
            width={40}
            domain={[0, 'auto']}
          />
          <Tooltip
            content={<WpmTooltip labelKey="t" labelSuffix="s" />}
            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="wpm"
            stroke="rgba(100,160,255,0.85)"
            strokeWidth={2}
            fill="url(#wpmTimeGrad)"
            dot={false}
            activeDot={{ r: 4, fill: 'rgba(100,160,255,1)', stroke: 'none' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

/** WPM per word — bar chart, with slower words tinted red */
export function WpmWordChart({ data }) {
  if (!data?.length) return null;
  const maxWpm = Math.max(...data.map((d) => d.wpm));
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
      style={{ width: '100%', height: 180 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="word"
            tickLine={false}
            axisLine={false}
            tick={AXIS_STYLE}
            label={{ value: 'word #', position: 'insideBottomRight', offset: -4, style: { ...AXIS_STYLE, fontSize: 10 } }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={AXIS_STYLE}
            width={40}
            domain={[0, 'auto']}
          />
          <Tooltip
            content={<WpmTooltip labelKey="label" />}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar dataKey="wpm" radius={[3, 3, 0, 0]}>
            {data.map((entry) => {
              const ratio = maxWpm > 0 ? entry.wpm / maxWpm : 1;
              const color =
                ratio >= 0.8
                  ? 'rgba(100,200,140,0.75)'
                  : ratio >= 0.55
                  ? 'rgba(100,160,255,0.75)'
                  : 'rgba(255,100,80,0.75)';
              return <Cell key={entry.word} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
