import { useId } from 'react';

/**
 * Pass/fail history sparkline. Bigger squares than the Day-5 version, with a
 * small gap between them and an internal gradient that gives a subtle sense
 * of "depth" — like hot-stamped indicators rather than flat swatches.
 *
 * Each square is tooltip-able via the native `title` attribute (free, works
 * in every browser without a JS tooltip library).
 */
interface Point {
  passed: number;
  run_id?: string;
}

interface Props {
  history: Point[];
  width?: number;
  height?: number;
  max?: number; // cap the number of squares rendered
}

export function Sparkline({ history, width = 150, height = 18, max = 20 }: Props) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  if (history.length === 0) {
    return (
      <span className="inline-block rounded border border-dashed border-[color:var(--color-border)] px-2 py-0.5 text-[10px] font-mono text-[color:var(--color-text-muted)]">
        no history
      </span>
    );
  }
  // Show the most recent `max` entries, oldest-to-newest so the rightmost
  // square is the latest run — matches conventional sparkline reading.
  const visible = history.slice(-max);
  const gap = 2;
  const barW = Math.max((width - gap * (visible.length - 1)) / visible.length, 3);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-label={`pass/fail history: ${visible.map((h) => (h.passed ? 'P' : 'F')).join('')}`}
      className="inline-block"
    >
      {visible.map((h, i) => {
        const passed = h.passed === 1;
        const x = i * (barW + gap);
        const fillTop = passed ? '#5fe48c' : '#ff8a40';
        const fillBot = passed ? '#2ea357' : '#d94d0a';
        const gradId = `pf-spark-${reactId}-${passed ? 'p' : 'f'}-${i}`;
        return (
          <g key={i}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillTop} />
                <stop offset="100%" stopColor={fillBot} />
              </linearGradient>
            </defs>
            <rect
              x={x}
              y={1}
              width={barW}
              height={height - 2}
              rx={1.5}
              fill={`url(#${gradId})`}
            >
              {h.run_id && (
                <title>
                  {passed ? 'PASS' : 'FAIL'} · {h.run_id}
                </title>
              )}
            </rect>
          </g>
        );
      })}
    </svg>
  );
}
