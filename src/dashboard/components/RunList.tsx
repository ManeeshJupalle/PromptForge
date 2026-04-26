import { Link } from 'wouter';
import type { RunRow } from '../lib/types.js';
import { formatCost, formatDateTime, formatRelative } from '../lib/format.js';
import { ChevronRight, GitCommit } from './Icons.js';

/**
 * The list of runs. Each row reads like a hot-stamped serial number —
 * vertical heat bar on the left (status), large mono ID, git commit chip,
 * right-aligned metrics that column-align via `font-variant-numeric: tabular-nums`.
 *
 * Unfinished runs (finished_at IS NULL) are filtered server-side by default,
 * but any that slip through render with an amber bar + `incomplete` chip to
 * prevent a crashed run from reading as a green clean one.
 */
export function RunList({ runs }: { runs: RunRow[] }) {
  if (runs.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)]/50 p-10 text-center">
        <div
          className="mb-1 text-[15px] font-medium text-[color:var(--color-text)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          No runs yet
        </div>
        <p className="text-[13px] text-[color:var(--color-text-dim)]">
          Invoke{' '}
          <code className="font-mono text-[color:var(--color-ember-hot)]">promptforge-cli run</code>{' '}
          to record your first one.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
      <div className="hidden border-b border-[color:var(--color-border)] bg-[color:var(--color-bg-tint)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-text-muted)] sm:flex">
        <span className="flex-1 pl-5">run serial</span>
        <span className="w-24 text-right">tests</span>
        <span className="w-20 text-right">cost</span>
        <span className="w-16 text-right">time</span>
        <span className="w-8" />
      </div>
      {runs.map((r, i) => (
        <RunRowView key={r.id} run={r} isFirst={i === 0} isLast={i === runs.length - 1} />
      ))}
    </div>
  );
}

function RunRowView({ run, isFirst, isLast }: { run: RunRow; isFirst: boolean; isLast: boolean }) {
  const passed = run.passed ?? 0;
  const failed = run.failed ?? 0;
  const total = run.total_tests ?? passed + failed;
  const unfinished = run.finished_at === null;
  const duration =
    run.finished_at === null ? null : (run.finished_at - run.started_at) / 1000;

  const barKind: 'pass' | 'fail' | 'warn' | 'muted' = unfinished
    ? 'warn'
    : total === 0
      ? 'muted'
      : failed === 0
        ? 'pass'
        : 'fail';

  return (
    <Link
      href={`/runs/${run.id}`}
      className={
        'group flex flex-wrap items-center gap-x-4 gap-y-2 border-[color:var(--color-border)] px-0 transition-colors duration-150 hover:bg-[color:var(--color-surface-hi)] sm:flex-nowrap ' +
        (isFirst ? '' : 'border-t ') +
        (isLast ? '' : '')
      }
    >
      {/* Vertical heat bar — 3px wide, full row height, glows on fail */}
      <span className={`pf-heatbar pf-heatbar--${barKind} my-3 ml-3 self-stretch`} aria-hidden />

      {/* ID + metadata column */}
      <div className="flex min-w-[13rem] flex-1 flex-col justify-center py-3.5">
        <div className="flex items-center gap-2.5">
          <span
            className="font-mono text-[14px] font-medium tracking-[0.02em] text-[color:var(--color-text)] transition-colors duration-150 group-hover:text-[color:var(--color-ember-hot)]"
          >
            {run.id}
          </span>
          {run.git_commit && (
            <span className="pf-chip">
              <GitCommit size={11} className="text-[color:var(--color-text-muted)]" />
              {run.git_commit.slice(0, 7)}
            </span>
          )}
          {unfinished && (
            <span
              className="rounded-sm px-1.5 py-[1px] text-[9.5px] font-mono font-semibold uppercase tracking-[0.1em]"
              style={{
                background: 'color-mix(in srgb, var(--color-warn) 18%, transparent)',
                color: 'var(--color-warn)',
                border: '1px solid color-mix(in srgb, var(--color-warn) 45%, transparent)',
              }}
              title="Run row inserted but never finalized — likely crashed or interrupted."
            >
              incomplete
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[color:var(--color-text-muted)]">
          <span className="font-mono tabular-nums">{formatDateTime(run.started_at)}</span>
          <span className="text-[color:var(--color-border-hi)]">·</span>
          <span>{formatRelative(run.started_at)}</span>
        </div>
      </div>

      {/* Pass/fail compact display */}
      <div className="flex items-center gap-3 self-center pr-1 font-mono text-[12.5px] tabular-nums">
        <div className="flex items-baseline gap-[2px]">
          <span className="text-[color:var(--color-pass)]">{passed}</span>
          <span className="text-[color:var(--color-border-hi)]">/</span>
          <span className={failed > 0 ? 'text-[color:var(--color-ember)]' : 'text-[color:var(--color-text-muted)]'}>
            {failed}
          </span>
          <span className="text-[color:var(--color-border-hi)]">/</span>
          <span className="text-[color:var(--color-text-dim)]">{total}</span>
        </div>
      </div>

      {/* Cost */}
      <div className="hidden w-20 items-center justify-end self-center pr-1 font-mono text-[12px] tabular-nums text-[color:var(--color-text-dim)] sm:flex">
        {formatCost(run.total_cost)}
      </div>

      {/* Duration */}
      <div className="hidden w-16 items-center justify-end self-center pr-1 font-mono text-[12px] tabular-nums text-[color:var(--color-text-dim)] sm:flex">
        {duration === null ? '—' : `${duration.toFixed(2)}s`}
      </div>

      {/* Chevron — appears on hover */}
      <div className="flex w-8 items-center justify-center self-center pr-3 text-[color:var(--color-text-muted)] transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-[color:var(--color-ember-hot)]">
        <ChevronRight size={16} />
      </div>
    </Link>
  );
}
