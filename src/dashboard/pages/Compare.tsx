import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { getCompare } from '../lib/api.js';
import type {
  RunComparison,
  RunRow,
  StatusChange,
  TestComparison,
} from '../lib/types.js';
import { DiffViewer } from '../components/DiffViewer.js';
import { formatCost, formatDateTime, formatLatency } from '../lib/format.js';
import { ArrowRight, ChevronDown, ChevronRight } from '../components/Icons.js';

/**
 * Compare page. Sections are ordered by what the user most wants to see
 * first: regressions above improvements above unchanged-fails above
 * unchanged-passes above added/removed. Regression cards auto-open.
 */

const SECTION_ORDER: StatusChange[] = [
  'regression',
  'improvement',
  'same-fail',
  'same-pass',
  'added',
  'removed',
];

const SECTION_LABEL: Record<StatusChange, string> = {
  regression: 'Regressions',
  improvement: 'Improvements',
  'same-fail': 'Unchanged (fail)',
  'same-pass': 'Unchanged (pass)',
  added: 'New tests',
  removed: 'Removed tests',
};

const SECTION_COLOR: Record<StatusChange, string> = {
  regression: 'var(--color-ember)',
  improvement: 'var(--color-pass)',
  'same-fail': 'var(--color-warn)',
  'same-pass': 'var(--color-text-muted)',
  added: 'var(--color-chart-cool)',
  removed: 'var(--color-text-dim)',
};

const SECTION_ICON: Record<StatusChange, string> = {
  regression: '✗',
  improvement: '✓',
  'same-fail': '·',
  'same-pass': '·',
  added: '+',
  removed: '−',
};

export function Compare() {
  const params = new URLSearchParams(window.location.search);
  const a = params.get('a') ?? 'previous';
  const b = params.get('b') ?? 'latest';

  const [cmp, setCmp] = useState<RunComparison | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCmp(null);
    setError(null);
    getCompare(a, b)
      .then(setCmp)
      .catch((e: Error) => setError(e.message));
  }, [a, b]);

  const grouped = useMemo(() => {
    if (!cmp) return null;
    const map = new Map<StatusChange, TestComparison[]>();
    for (const t of cmp.tests) {
      const list = map.get(t.statusChange) ?? [];
      list.push(t);
      map.set(t.statusChange, list);
    }
    return map;
  }, [cmp]);

  if (error) {
    return (
      <div className="rounded-md border border-[color:var(--color-fail)]/50 bg-[color:var(--color-fail)]/10 p-3 text-sm text-[color:var(--color-fail)]">
        {error}
      </div>
    );
  }
  if (!cmp || !grouped) {
    return (
      <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-10 text-center text-[13px] font-mono text-[color:var(--color-text-muted)]">
        loading…
      </div>
    );
  }
  const counts = SECTION_ORDER.reduce(
    (acc, key) => {
      acc[key] = grouped.get(key)?.length ?? 0;
      return acc;
    },
    {} as Record<StatusChange, number>,
  );
  const totalChanged =
    counts.regression + counts.improvement + counts.added + counts.removed + counts['same-fail'];

  return (
    <div className="space-y-8">
      <div>
        <span className="pf-stat-label text-[color:var(--color-text-muted)]">DIFF</span>
        <h1
          className="mt-1 text-[28px] font-semibold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Compare runs
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px]">
          <RunChip run={cmp.runA} label="previous" />
          <ArrowRight size={14} className="text-[color:var(--color-ember-hot)]" />
          <RunChip run={cmp.runB} label="current" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <DiffTile
          label="regressions"
          value={String(counts.regression)}
          tone={counts.regression > 0 ? 'fail' : 'neutral'}
        />
        <DiffTile label="improvements" value={String(counts.improvement)} tone="pass" />
        <DiffTile
          label="unchanged fail"
          value={String(counts['same-fail'])}
          tone={counts['same-fail'] > 0 ? 'warn' : 'neutral'}
        />
        <DiffTile label="new tests" value={String(counts.added)} tone="cool" />
        <DiffTile label="changed surface" value={String(totalChanged)} tone="ember" />
      </div>

      {SECTION_ORDER.map((s) => {
        const rows = grouped.get(s);
        if (!rows || rows.length === 0) return null;
        return (
          <section key={s} className="space-y-2.5">
            <div className="flex items-center gap-2.5 px-1">
              <span
                className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: SECTION_COLOR[s] }}
              >
                {SECTION_LABEL[s]}
              </span>
              <span
                className="font-mono text-[11px]"
                style={{ color: SECTION_COLOR[s], opacity: 0.75 }}
              >
                {rows.length}
              </span>
              <span className="h-[1px] flex-1 bg-[color:var(--color-border)]" />
            </div>
            <div className="space-y-2">
              {rows.map((t) => (
                <ComparisonCard key={t.key} test={t} sectionColor={SECTION_COLOR[s]} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function DiffTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'neutral' | 'pass' | 'warn' | 'fail' | 'cool' | 'ember';
}) {
  const color: Record<typeof tone, string> = {
    neutral: 'var(--color-text)',
    pass: 'var(--color-pass)',
    warn: 'var(--color-warn)',
    fail: 'var(--color-ember)',
    cool: 'var(--color-chart-cool)',
    ember: 'var(--color-ember-hot)',
  };
  return (
    <div className="pf-summary-tile">
      <div className="pf-stat-label">{label}</div>
      <div className="mt-1 pf-stat-value" style={{ color: color[tone] }}>
        {value}
      </div>
    </div>
  );
}

function RunChip({ run, label }: { run: RunRow; label: string }) {
  return (
    <Link
      href={`/runs/${run.id}`}
      className="group inline-flex max-w-full flex-wrap items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 transition-colors duration-150 hover:border-[color:var(--color-border-hi)]"
    >
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-text-muted)]">
        {label}
      </span>
      <span className="min-w-0 truncate font-mono text-[12px] font-medium text-[color:var(--color-text)] transition-colors duration-150 group-hover:text-[color:var(--color-ember-hot)]">
        {run.id}
      </span>
      <span className="font-mono text-[10.5px] text-[color:var(--color-text-muted)]">
        {formatDateTime(run.started_at)}
      </span>
    </Link>
  );
}

function ComparisonCard({
  test,
  sectionColor,
}: {
  test: TestComparison;
  sectionColor: string;
}) {
  const [open, setOpen] = useState(test.statusChange === 'regression');
  const showDiff = open && test.a && test.b && test.a.output !== test.b.output;
  const barKind: 'pass' | 'fail' | 'warn' | 'muted' =
    test.statusChange === 'regression' || test.statusChange === 'same-fail'
      ? 'fail'
      : test.statusChange === 'improvement' || test.statusChange === 'same-pass'
        ? 'pass'
        : test.statusChange === 'added' || test.statusChange === 'removed'
          ? 'muted'
          : 'warn';
  return (
    <div className="overflow-hidden rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] transition-colors duration-150 hover:border-[color:var(--color-border-hi)]">
      <button
        onClick={() => setOpen(!open)}
        className="group flex w-full flex-wrap items-center gap-x-3 gap-y-2 text-left sm:flex-nowrap sm:items-stretch"
      >
        <span className={`pf-heatbar pf-heatbar--${barKind} my-3 ml-3 self-stretch`} aria-hidden />
        <span
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center self-center rounded-full font-mono text-[12px] font-semibold"
          style={{
            color: sectionColor,
            background: `color-mix(in srgb, ${sectionColor} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${sectionColor} 40%, transparent)`,
          }}
          aria-hidden
        >
          {SECTION_ICON[test.statusChange]}
        </span>
        <span className="min-w-[12rem] flex-1 py-3 text-[13px] text-[color:var(--color-text)]">
          {test.testName}
        </span>
        <span className="hidden items-center gap-2 self-center pr-2 text-[10.5px] font-mono sm:flex">
          <span className="text-[color:var(--color-text-muted)]">{test.provider}</span>
          {test.costDelta !== null && Math.abs(test.costDelta) > 1e-7 && (
            <DeltaChip
              label="cost"
              value={test.costDelta}
              format={(v) => formatCost(v)}
              worseIfPositive
            />
          )}
          {test.latencyDelta !== null && test.latencyDelta !== 0 && (
            <DeltaChip
              label="latency"
              value={test.latencyDelta}
              format={(v) => formatLatency(v)}
              worseIfPositive
            />
          )}
        </span>
        <span className="flex w-8 items-center justify-center self-center pr-2 text-[color:var(--color-text-muted)] transition-colors duration-150 group-hover:text-[color:var(--color-ember-hot)]">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>
      {showDiff && (
        <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-bg-tint)] p-3">
          <DiffViewer
            oldValue={test.a?.output ?? ''}
            newValue={test.b?.output ?? ''}
            leftTitle="previous"
            rightTitle="current"
          />
        </div>
      )}
      {open && !showDiff && test.b && (
        <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-bg-tint)] p-3">
          <pre className="overflow-auto whitespace-pre-wrap rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 font-mono text-[11.5px] leading-[1.6] text-[color:var(--color-text)]">
            {test.b.output || '(empty)'}
          </pre>
        </div>
      )}
    </div>
  );
}

function DeltaChip({
  label,
  value,
  format,
  worseIfPositive,
}: {
  label: string;
  value: number;
  format: (v: number) => string;
  worseIfPositive: boolean;
}) {
  const worse = worseIfPositive ? value > 0 : value < 0;
  const color = worse ? 'var(--color-ember)' : 'var(--color-pass)';
  const sign = value > 0 ? '+' : '';
  return (
    <span className="font-mono text-[10.5px]" style={{ color }}>
      <span className="text-[color:var(--color-text-muted)]">{label}</span> {sign}
      {format(value)}
    </span>
  );
}
