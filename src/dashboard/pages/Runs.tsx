import { useEffect, useMemo, useState } from 'react';
import { getRuns } from '../lib/api.js';
import type { RunRow } from '../lib/types.js';
import { RunList } from '../components/RunList.js';
import { SearchIcon } from '../components/Icons.js';
import { formatCost } from '../lib/format.js';

/**
 * Runs page. A stats strip gives the at-a-glance numbers (count, pass rate,
 * cost total, median duration) — then a filter bar, then the list.
 *
 * The stats strip isn't just decoration: it's *the* way a user answers
 * "is my prompt suite healthy today?" without scanning 20 rows.
 */
export function Runs() {
  const [runs, setRuns] = useState<RunRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState('');
  const [status, setStatus] = useState<'any' | 'pass' | 'fail'>('any');

  useEffect(() => {
    setRuns(null);
    setError(null);
    getRuns({
      provider: provider || undefined,
      status: status === 'any' ? undefined : status,
      limit: 100,
    })
      .then((r) => setRuns(r.runs))
      .catch((e: Error) => setError(e.message));
  }, [provider, status]);

  const stats = useMemo(() => {
    if (!runs) return null;
    const finished = runs.filter((r) => r.finished_at !== null);
    const passed = runs.filter((r) => (r.failed ?? 0) === 0 && r.finished_at !== null).length;
    const failed = finished.length - passed;
    const totalCost = runs.reduce((s, r) => s + (r.total_cost ?? 0), 0);
    const durations = finished
      .map((r) => ((r.finished_at ?? 0) - r.started_at) / 1000)
      .filter((d) => d > 0)
      .sort((a, b) => a - b);
    const median =
      durations.length === 0
        ? 0
        : durations[Math.floor(durations.length / 2)];
    return {
      total: runs.length,
      passed,
      failed,
      passRate: finished.length === 0 ? null : passed / finished.length,
      totalCost,
      medianDuration: median,
    };
  }, [runs]);
  const latestRun = runs?.[0] ?? null;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-[28px] font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Runs
          </h1>
          <p className="mt-0.5 text-[13px] text-[color:var(--color-text-dim)]">
            Every{' '}
            <code className="font-mono text-[color:var(--color-ember-hot)]">promptforge-cli run</code>,
            newest first. Click a row to drill in.
          </p>
        </div>
      </div>

      {stats && <CommandDeck stats={stats} latestRun={latestRun} />}

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total runs" value={String(stats.total)} />
          <StatCard
            label="Pass rate"
            value={stats.passRate === null ? '—' : `${Math.round(stats.passRate * 100)}%`}
            tone={
              stats.passRate === null
                ? 'neutral'
                : stats.passRate >= 0.9
                  ? 'pass'
                  : stats.passRate >= 0.5
                    ? 'warn'
                    : 'fail'
            }
            foot={
              stats.passRate === null
                ? '—'
                : `${stats.passed} clean · ${stats.failed} with failures`
            }
          />
          <StatCard
            label="Total cost"
            value={formatCost(stats.totalCost)}
            foot={stats.totalCost === 0 ? 'mock / free providers only' : 'across all runs shown'}
          />
          <StatCard
            label="Median duration"
            value={stats.medianDuration === 0 ? '—' : `${stats.medianDuration.toFixed(2)}s`}
            foot="p50 across finished runs"
          />
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex w-full items-center sm:w-auto">
          <SearchIcon
            size={14}
            className="pointer-events-none absolute left-3 text-[color:var(--color-text-muted)]"
          />
          <input
            type="text"
            placeholder="filter by provider…"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="pf-input w-full pl-9 font-mono text-[12.5px] sm:w-72"
            spellCheck={false}
          />
        </label>
        <div className="inline-flex self-start" role="group" aria-label="status filter">
          {[
            ['any', 'any'],
            ['pass', 'clean'],
            ['fail', 'failures'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value as typeof status)}
              className={'pf-segment ' + (status === value ? 'is-active' : '')}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-[11px] font-mono text-[color:var(--color-text-muted)] sm:ml-auto">
          {runs === null ? '…' : `${runs.length} ${runs.length === 1 ? 'result' : 'results'}`}
        </span>
      </div>

      {error && (
        <div className="rounded-md border border-[color:var(--color-fail)]/50 bg-[color:var(--color-fail)]/10 p-3 text-sm text-[color:var(--color-fail)]">
          {error}
        </div>
      )}

      {runs === null ? (
        <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-10">
          <div className="animate-pulse text-center text-[13px] font-mono text-[color:var(--color-text-muted)]">
            loading…
          </div>
        </div>
      ) : (
        <RunList runs={runs} />
      )}
    </div>
  );
}

type RunsStats = {
  total: number;
  passed: number;
  failed: number;
  passRate: number | null;
  totalCost: number;
  medianDuration: number;
};

function CommandDeck({ stats, latestRun }: { stats: RunsStats; latestRun: RunRow | null }) {
  const pct = stats.passRate === null ? 0 : Math.round(stats.passRate * 100);
  const tone =
    stats.passRate === null
      ? 'var(--color-text-muted)'
      : stats.passRate >= 0.9
        ? 'var(--color-pass)'
        : stats.passRate >= 0.5
          ? 'var(--color-warn)'
          : 'var(--color-ember)';
  const title =
    stats.passRate === null
      ? 'No completed signal yet'
      : stats.failed === 0
        ? 'Suite heat is stable'
        : 'Failures need inspection';
  const latestStatus =
    latestRun === null
      ? 'no latest run'
      : latestRun.finished_at === null
        ? 'incomplete'
        : (latestRun.failed ?? 0) === 0
          ? 'clean'
          : `${latestRun.failed ?? 0} failing`;

  return (
    <section className="pf-command-deck overflow-hidden px-5 py-5 sm:px-6">
      <div className="pf-command-inner">
        <div className="min-w-0">
          <div className="pf-stat-label text-[color:var(--color-ember-hot)]">Command deck</div>
          <h2
            className="mt-1 text-[30px] font-semibold leading-tight tracking-tight text-[color:var(--color-text)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[color:var(--color-text-dim)]">
            Latest run status is{' '}
            <span className="font-mono text-[color:var(--color-ember-hot)]">{latestStatus}</span>.
            The workbench is tuned for quick regression scanning, then drill-down into output,
            assertion evidence, and run-to-run comparison.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="pf-chip pf-chip--ember">runs {stats.total}</span>
            <span className="pf-chip">clean {stats.passed}</span>
            <span className="pf-chip">failing {stats.failed}</span>
            {latestRun?.git_commit && (
              <span className="pf-chip">commit {latestRun.git_commit.slice(0, 7)}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="pf-heat-dial relative"
            style={{
              background: `conic-gradient(${tone} ${pct * 3.6}deg, var(--color-border) 0deg)`,
            }}
            aria-label={`pass rate ${pct}%`}
          >
            <div className="pf-heat-dial-core">
              <span
                className="text-[28px] font-semibold leading-none"
                style={{ color: tone, fontFamily: 'var(--font-display)' }}
              >
                {stats.passRate === null ? '--' : pct}
              </span>
              <span className="-mt-4 font-mono text-[10px] text-[color:var(--color-text-muted)]">
                percent
              </span>
            </div>
          </div>
          <div className="hidden border-l border-[color:var(--color-border)] pl-4 sm:block">
            <div className="pf-stat-label">p50 duration</div>
            <div className="mt-1 font-mono text-[18px] text-[color:var(--color-text)]">
              {stats.medianDuration === 0 ? '--' : `${stats.medianDuration.toFixed(2)}s`}
            </div>
            <div className="mt-3 pf-stat-label">cost</div>
            <div className="mt-1 font-mono text-[13px] text-[color:var(--color-text-dim)]">
              {formatCost(stats.totalCost)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  foot,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  foot?: string;
  tone?: 'neutral' | 'pass' | 'warn' | 'fail' | 'ember';
}) {
  const toneColor: Record<NonNullable<typeof tone>, string> = {
    neutral: 'var(--color-text)',
    pass: 'var(--color-pass)',
    warn: 'var(--color-warn)',
    fail: 'var(--color-ember)',
    ember: 'var(--color-ember-hot)',
  };
  return (
    <div className="pf-card relative overflow-hidden px-4 py-3.5">
      {/* Subtle corner accent — tiny ember square in the top-left */}
      <span
        className="absolute left-0 top-0 h-[2px] w-6"
        style={{
          background: `linear-gradient(90deg, ${toneColor[tone]}, transparent)`,
          opacity: tone === 'neutral' ? 0.3 : 0.9,
        }}
        aria-hidden
      />
      <div className="pf-stat-label">{label}</div>
      <div className="mt-1 pf-stat-value" style={{ color: toneColor[tone] }}>
        {value}
      </div>
      {foot && (
        <div className="mt-1 text-[11px] text-[color:var(--color-text-muted)]">{foot}</div>
      )}
    </div>
  );
}
