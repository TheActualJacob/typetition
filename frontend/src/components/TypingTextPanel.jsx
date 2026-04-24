export function TypingTextPanel({ target, typed }) {
  const cursorIndex = typed.length;

  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 22,
        lineHeight: 1.75,
        letterSpacing: '0.01em',
        wordBreak: 'break-word',
        padding: '0 2px',
      }}
    >
      {target.split('').map((char, index) => {
        const isCorrect = index < typed.length && typed[index] === char;
        const isWrong = index < typed.length && typed[index] !== char;
        const isCursor = index === cursorIndex;

        let color;
        if (isCorrect) color = 'var(--color-correct)';
        else if (isWrong) color = 'var(--color-wrong)';
        else color = 'var(--color-untyped)';

        return (
          <span
            key={`${char}-${index}`}
            style={{
              position: 'relative',
              color,
              transition: 'color 0.1s ease',
            }}
          >
            {isCursor && (
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '12%',
                  bottom: '8%',
                  width: 2,
                  borderRadius: 1,
                  background: 'var(--color-cursor)',
                  animation: 'cursor-blink 1s ease-in-out infinite',
                  boxShadow: '0 0 6px var(--color-cursor)',
                }}
              />
            )}
            {char === ' ' ? '\u00A0' : char}
          </span>
        );
      })}
      {cursorIndex === target.length && (
        <span
          style={{
            display: 'inline-block',
            position: 'relative',
            width: 2,
            verticalAlign: 'text-bottom',
            height: '1.1em',
          }}
        >
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 1,
              background: 'var(--color-cursor)',
              animation: 'cursor-blink 1s ease-in-out infinite',
              boxShadow: '0 0 6px var(--color-cursor)',
            }}
          />
        </span>
      )}
    </div>
  );
}
