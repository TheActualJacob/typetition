export function TypingTextPanel({ target, typed }) {
  return (
    <p className="rounded bg-slate-900 p-3 text-lg leading-relaxed">
      {target.split('').map((char, index) => {
        let cls = 'text-slate-400';
        if (index < typed.length) cls = typed[index] === char ? 'text-emerald-400' : 'text-red-400';
        return (
          <span key={`${char}-${index}`} className={cls}>
            {char}
          </span>
        );
      })}
    </p>
  );
}
