import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { getTests } from '../lib/api.js';
import type { TestSummary } from '../lib/types.js';
import { Sparkline } from '../components/Sparkline.js';
import { ArrowRight, FolderMono, SearchIcon } from '../components/Icons.js';

/**
 * Tests page — every (test × provider) pair grouped by suite file. The
 * sparkline on each row is the hero element: 20 squares of pass/fail history
 * that you can scan at a glance to spot flaky or regressing tests.
 */
export function TestExplorer() {
  const [tests, setTests] = useState<TestSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getTests()
      .then((d) => setTests(d.tests))
      .catch((e: Error) => setError(e.message));
  }, []);

  const grouped = useMemo(() => {
    if (!tests) return null;
    const ft = filter.trim().toLowerCase();
    const matched = ft
      ? tests.filter(
          (t) =>
            t.test_name.toLowerCase().includes(ft) ||
            t.test_file.toLowerCase().includes(ft) ||
            t.provider.toLowerCase().includes(ft),
        )
      : tests;
    const byFile = new Map<string, TestSummary[]>();
    for (const t of matched) {
      const list = byFile.get(t.test_file) ?? [];
      list.push(t);
      byFile.set(t.test_file, list);
    }
    return byFile;
  }, [tests, filter]);

  if (error) {
    return (
      <div className="rounded-md border border-[color:var(--color-fail)]/50 bg-[color:var(--color-fail)]/10 p-3 text-sm text-[color:var(--color-fail)]">
        {error}
      </div>
    );
  }
  if (!tests || !grouped) {
    return (
      <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-10 text-center text-[13px] font-mono text-[color:var(--color-text-muted)]">
        loading…
      </div>
    );
  }

  const totalTests = tests.length;
  const flaky = tests.filter((t) => {
    const h = t.history;
    if (h.length < 3) return false;
    const passCount = h.filter((p) => p.passed === 1).length;
    return passCount > 0 && passCount < h.length;
  }).length;
  const latestFailures = tests.filter((t) => {
    const last = t.history[t.history.length - 1];
    return last?.passed === 0;
  }).length;
  const providers = new Set(tests.map((t) => t.provider)).size;

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-[28px] font-semibold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Tests
        </h1>
        <p className="mt-0.5 text-[13px] text-[color:var(--color-text-dim)]">
          Every{' '}
          <span className="font-mono text-[color:var(--color-ember-hot)]">
            (test × provider)
          </span>{' '}
          pair seen across runs. Sparklines show up to 20 runs — oldest left,
          newest right.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MatrixTile label="tracked pairs" value={String(totalTests)} detail="test x provider" />
        <MatrixTile
          label="latest failures"
          value={String(latestFailures)}
          detail="right edge of each sparkline"
          tone={latestFailures > 0 ? 'fail' : 'pass'}
        />
        <MatrixTile
          label="providers"
          value={String(providers)}
          detail={flaky > 0 ? `${flaky} flaky histories` : 'no mixed histories'}
          tone={flaky > 0 ? 'warn' : 'neutral'}
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex w-full flex-1 items-center">
          <SearchIcon
            size={14}
            className="pointer-events-none absolute left-3 text-[color:var(--color-text-muted)]"
          />
          <input
            type="text"
            placeholder="filter by test name / file / provider…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pf-input w-full max-w-md pl-9 font-mono text-[12.5px]"
            spellCheck={false}
          />
        </label>
        <span className="font-mono text-[11px] text-[color:var(--color-text-muted)] sm:ml-auto">
          {totalTests} test{totalTests === 1 ? '' : 's'}
          {flaky > 0 && (
            <>
              {' · '}
              <span className="text-[color:var(--color-warn)]">{flaky} flaky</span>
            </>
          )}
        </span>
      </div>

      {/* Grouped test rows */}
      {Array.from(grouped.entries()).length === 0 ? (
        <div className="rounded-md border border-dashed border-[color:var(--color-border)] p-8 text-center text-[13px] text-[color:var(--color-text-dim)]">
          No tests match that filter.
        </div>
      ) : (
        <div className="space-y-5">
          {Array.from(grouped.entries()).map(([file, rows]) => (
            <section key={file} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <FolderMono
                  size={13}
                  className="text-[color:var(--color-ember-hot)]"
                />
                <h2 className="font-mono text-[11px] tracking-[0.01em] text-[color:var(--color-text-dim)]">
                  {file}
                </h2>
                <span className="h-[1px] flex-1 bg-[color:var(--color-border)]" />
                <span className="font-mono text-[10.5px] text-[color:var(--color-text-muted)]">
                  {rows.length}
                </span>
              </div>
              <div className="overflow-hidden rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                {rows.map((t, i) => (
                  <TestRow
                    key={`${t.test_name}|${t.provider}`}
                    test={t}
                    isFirst={i === 0}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function MatrixTile({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'neutral' | 'pass' | 'warn' | 'fail';
}) {
  const toneColor: Record<NonNullable<typeof tone>, string> = {
    neutral: 'var(--color-text)',
    pass: 'var(--color-pass)',
    warn: 'var(--color-warn)',
    fail: 'var(--color-ember)',
  };
  return (
    <div className="pf-summary-tile relative overflow-hidden">
      <span
        className="absolute bottom-0 left-0 top-0 w-[3px]"
        style={{ background: toneColor[tone], opacity: tone === 'neutral' ? 0.35 : 0.9 }}
        aria-hidden
      />
      <div className="pf-stat-label">{label}</div>
      <div className="mt-1 pf-stat-value" style={{ color: toneColor[tone] }}>
        {value}
      </div>
      <div className="mt-1 text-[11px] text-[color:var(--color-text-muted)]">{detail}</div>
    </div>
  );
}

function TestRow({ test, isFirst }: { test: TestSummary; isFirst: boolean }) {
  const last = test.history[test.history.length - 1];
  const latestPass = last ? last.passed === 1 : null;
  const passCount = test.history.filter((h) => h.passed === 1).length;
  const passRate = test.history.length > 0 ? passCount / test.history.length : null;
  const latestRunId = last?.run_id;

  const barKind: 'pass' | 'fail' | 'muted' =
    latestPass === null ? 'muted' : latestPass ? 'pass' : 'fail';
  const passRateTone =
    passRate === null
      ? 'var(--color-text-muted)'
      : passRate >= 0.9
        ? 'var(--color-pass)'
        : passRate >= 0.5
          ? 'var(--color-warn)'
          : 'var(--color-ember)';

  return (
    <div
      className={
        'flex flex-wrap items-center gap-x-4 gap-y-2 px-0 transition-colors duration-150 hover:bg-[color:var(--color-surface-hi)] sm:flex-nowrap ' +
        (isFirst ? '' : 'border-t border-[color:var(--color-border)]')
      }
    >
      <span className={`pf-heatbar pf-heatbar--${barKind} my-2.5 ml-3 self-stretch`} aria-hidden />
      <div className="flex min-w-[12rem] flex-1 flex-col justify-center py-2.5">
        <div className="truncate text-[13px] text-[color:var(--color-text)]">
          {test.test_name}
        </div>
        <div className="mt-0.5 font-mono text-[10.5px] text-[color:var(--color-text-muted)]">
          {test.provider}
        </div>
      </div>
      <div className="order-last flex w-full items-center pb-2 pl-10 pr-3 sm:order-none sm:w-auto sm:self-center sm:p-0 sm:pr-2">
        <Sparkline
          history={test.history.map((h) => ({ passed: h.passed, run_id: h.run_id }))}
        />
      </div>
      <div className="flex w-auto items-center justify-end self-center pr-2 sm:w-14">
        {passRate !== null && (
          <span
            className="font-mono text-[12px] font-medium tabular-nums"
            style={{ color: passRateTone }}
          >
            {Math.round(passRate * 100)}%
          </span>
        )}
      </div>
      <div className="flex w-auto items-center justify-end self-center pr-2 sm:w-12">
        <span
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{
            color:
              latestPass === null
                ? 'var(--color-text-muted)'
                : latestPass
                  ? 'var(--color-pass)'
                  : 'var(--color-ember)',
          }}
        >
          {latestPass === null ? 'n/a' : latestPass ? 'pass' : 'fail'}
        </span>
      </div>
      <div className="flex w-auto items-center justify-end self-center pb-2 pr-3 sm:w-28 sm:pb-0">
        {latestRunId ? (
          <Link
            href={`/runs/${latestRunId}`}
            className="group inline-flex items-center gap-1 font-mono text-[10.5px] text-[color:var(--color-text-dim)] transition-colors duration-150 hover:text-[color:var(--color-ember-hot)]"
          >
            latest run
            <ArrowRight
              size={11}
              className="transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
