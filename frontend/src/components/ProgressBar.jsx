import { Progress } from '@/components/ui/progress';

export function ProgressBar({ value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Progress value={value} className="flex-1" />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'rgba(255,255,255,0.35)',
          minWidth: 36,
          textAlign: 'right',
        }}
      >
        {value}%
      </span>
    </div>
  );
}
