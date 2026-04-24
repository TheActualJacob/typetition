export function ProgressBar({ value }) {
  return (
    <div className="h-4 w-full rounded bg-slate-900">
      <div
        className="h-4 rounded bg-indigo-500 transition-all duration-150"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
