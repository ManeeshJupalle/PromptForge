import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { getRun } from '../lib/api.js';
import type { RunDetail as RunDetailType, ResultDTO } from '../lib/types.js';
import { AssertionRow } from '../components/AssertionRow.js';
import { formatCost, formatDateTime, formatLatency } from '../lib/format.js';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  ClockIcon,
  Cross,
  FolderMono,
  GitCommit,
  HashIcon,
} from '../components/Icons.js';

/**
 * Run detail page. Reads as: big run ID header → metadata strip → file-grouped
 * result cards (collapsed by default, click to expand).
 *
 * Each result card gets a vertical heat-bar (pass/fail), monospace test name,
 * inline provider/latency/cost chips, and expandable sections for output,
 * input vars, and the per-assertion breakdown.
 */
export function RunDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const id = params?.id ?? '';
  const [data, setData] = useState<RunDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    getRun(id)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="rounded-md border border-[color:var(--color-fail)]/50 bg-[color:var(--color-fail)]/10 p-3 text-sm text-[color:var(--color-fail)]">
        {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-10 text-center text-[13px] font-mono text-[color:var(--color-text-muted)]">
        loading…
      </div>
    );
  }

  const { run, results } = data;
  const byFile = new Map<string, ResultDTO[]>();
  for (const r of results) {
    const list = byFile.get(r.test_file) ?? [];
    list.push(r);
    byFile.set(r.test_file, list);
  }

  const passed = run.passed ?? 0;
  const failed = run.failed ?? 0;
  const total = run.total_tests ?? passed + failed;
  const duration =
    run.finished_at === null ? null : (run.finished_at - run.started_at) / 1000;
  const passRate = total === 0 ? null : passed / total;
  const compareHref = `/compare?a=${encodeURIComponent(`previous:${run.id}`)}&b=${encodeURIComponent(run.id)}`;

  return (
    <div className="space-y-8">
      {/* Back link */}
      <button
        onClick={() => navigate('/')}
        className="group inline-flex items-center gap-1.5 text-[12px] text-[color:var(--color-text-muted)] transition-colors duration-150 hover:text-[color:var(--color-ember-hot)]"
      >
        <ArrowRight
          size={12}
          className="rotate-180 transition-transform duration-150 group-hover:-translate-x-0.5"
        />
        all runs
      </button>

      {/* Header block */}
      <div>
        <div className="flex items-center gap-3">
          <span
            className="pf-stat-label"
            style={{
              color: failed === 0 ? 'var(--color-pass)' : 'var(--color-ember)',
            }}
          >
            {failed === 0 ? '● clean' : '● failures'}
          </span>
          <span className="font-mono text-[11px] text-[color:var(--color-text-muted)]">
            RUN
          </span>
        </div>
        <h1
          className="mt-1 font-mono text-[34px] font-semibold tracking-[0.01em] text-[color:var(--color-text)]"
        >
          {run.id}
        </h1>

        {/* Metadata strip */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
          <MetaItem icon={<ClockIcon size={13} />} label="started" value={formatDateTime(run.started_at)} />
          {duration !== null && (
            <MetaItem
              icon={<ClockIcon size={13} />}
              label="duration"
              value={`${duration.toFixed(2)}s`}
            />
          )}
          <MetaItem
            icon={null}
            label="tests"
            value={
              <span className="font-mono tabular-nums">
                <span className="text-[color:var(--color-pass)]">{passed}</span>
                <span className="text-[color:var(--color-border-hi)]">/</span>
                <span className={failed > 0 ? 'text-[color:var(--color-ember)]' : 'text-[color:var(--color-text-muted)]'}>
                  {failed}
                </span>
                <span className="text-[color:var(--color-border-hi)]">/</span>
                <span className="text-[color:var(--color-text-dim)]">{total}</span>
                {passRate !== null && (
                  <span className="ml-1.5 text-[color:var(--color-text-muted)]">
                    ({Math.round(passRate * 100)}%)
                  </span>
                )}
              </span>
            }
          />
          <MetaItem
            icon={null}
            label="cost"
            value={<span className="font-mono">{formatCost(run.total_cost)}</span>}
          />
          {run.git_commit && (
            <MetaItem
              icon={<GitCommit size={12} />}
              label="commit"
              value={<span className="font-mono">{run.git_commit.slice(0, 7)}</span>}
            />
          )}
          {run.config_hash && (
            <MetaItem
              icon={<HashIcon size={12} />}
              label="config"
              value={<span className="font-mono">{run.config_hash.slice(0, 8)}</span>}
            />
          )}
          <Link
            href={compareHref}
            className="pf-btn-primary w-full justify-center sm:ml-auto sm:w-auto"
          >
            compare to previous
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* File-grouped result cards */}
      {Array.from(byFile.entries()).map(([file, rs]) => {
        const filePassed = rs.filter((r) => r.passed === 1).length;
        const fileFailed = rs.length - filePassed;
        return (
          <section key={file} className="space-y-2.5">
            <div className="flex items-center gap-2 px-1">
              <FolderMono size={13} className="text-[color:var(--color-ember-hot)]" />
              <h2 className="font-mono text-[11px] tracking-[0.01em] text-[color:var(--color-text-dim)]">
                {file}
              </h2>
              <span className="h-[1px] flex-1 bg-[color:var(--color-border)]" />
              <span className="font-mono text-[10.5px] text-[color:var(--color-text-muted)]">
                <span className="text-[color:var(--color-pass)]">{filePassed}</span>
                <span className="text-[color:var(--color-border-hi)]">/</span>
                {fileFailed > 0 ? (
                  <span className="text-[color:var(--color-ember)]">{fileFailed}</span>
                ) : (
                  <span>0</span>
                )}
              </span>
            </div>
            <div className="space-y-2">
              {rs.map((r) => (
                <ResultCard key={r.id} result={r} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon && <span className="text-[color:var(--color-text-muted)]">{icon}</span>}
      <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
        {label}
      </span>
      <span className="text-[color:var(--color-text)]">{value}</span>
    </div>
  );
}

function ResultCard({ result }: { result: ResultDTO }) {
  const [open, setOpen] = useState(false);
  const isPass = result.passed === 1;
  return (
    <div className="overflow-hidden rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] transition-colors duration-150 hover:border-[color:var(--color-border-hi)]">
      <button
        onClick={() => setOpen(!open)}
        className="group flex w-full flex-wrap items-center gap-x-3 gap-y-2 text-left sm:flex-nowrap sm:items-stretch"
      >
        <span
          className={`pf-heatbar pf-heatbar--${isPass ? 'pass' : 'fail'} my-3 ml-3 self-stretch`}
          aria-hidden
        />
        <span
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center self-center rounded-full"
          style={{
            background: isPass
              ? 'color-mix(in srgb, var(--color-pass) 14%, transparent)'
              : 'var(--color-ember-faint)',
            color: isPass ? 'var(--color-pass)' : 'var(--color-ember-hot)',
            border: `1px solid ${isPass ? 'color-mix(in srgb, var(--color-pass) 40%, transparent)' : 'var(--color-ember-border)'}`,
          }}
        >
          {isPass ? <Check size={11} /> : <Cross size={11} />}
        </span>
        <span className="min-w-[12rem] flex-1 py-3 text-[13.5px] text-[color:var(--color-text)]">
          {result.test_name}
        </span>
        <span className="hidden items-center self-center gap-2 pr-2 text-[10.5px] font-mono sm:flex">
          <span className="text-[color:var(--color-text-muted)]">{result.provider}</span>
          <span className="text-[color:var(--color-border-hi)]">·</span>
          <span className="text-[color:var(--color-text-dim)]">
            {formatLatency(result.latency_ms)}
          </span>
          {(result.cost ?? 0) > 0 && (
            <>
              <span className="text-[color:var(--color-border-hi)]">·</span>
              <span className="text-[color:var(--color-text-dim)]">
                {formatCost(result.cost)}
              </span>
            </>
          )}
        </span>
        <span className="flex w-8 items-center justify-center self-center pr-2 text-[color:var(--color-text-muted)] transition-colors duration-150 group-hover:text-[color:var(--color-ember-hot)]">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-[color:var(--color-border)] bg-[color:var(--color-bg-tint)] px-5 py-4">
          {result.error && (
            <div className="rounded-md border border-[color:var(--color-fail)]/40 bg-[color:var(--color-fail)]/8 p-3 font-mono text-[12px] text-[color:var(--color-fail)]">
              {result.error}
            </div>
          )}
          {result.input_vars != null &&
            Object.keys(result.input_vars as object).length > 0 && (
              <Section label="input vars">
                <pre className="overflow-auto rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 font-mono text-[11.5px] leading-[1.6] text-[color:var(--color-text-dim)]">
                  {JSON.stringify(result.input_vars, null, 2)}
                </pre>
              </Section>
            )}
          <Section label="output">
            <pre className="overflow-auto whitespace-pre-wrap break-words rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 font-mono text-[11.5px] leading-[1.6] text-[color:var(--color-text)]">
              {result.output || '(empty)'}
            </pre>
          </Section>
          {result.assertions.length > 0 && (
            <Section label="assertions">
              <div className="space-y-2">
                {result.assertions.map((a, i) => (
                  <AssertionRow key={i} assertion={a} />
                ))}
              </div>
            </Section>
          )}
          <Section label="usage">
            <div className="flex flex-wrap gap-5 font-mono text-[11px] text-[color:var(--color-text-dim)]">
              <span>
                <span className="text-[color:var(--color-text-muted)]">prompt:</span>{' '}
                {result.prompt_tokens ?? '—'}
              </span>
              <span>
                <span className="text-[color:var(--color-text-muted)]">completion:</span>{' '}
                {result.completion_tokens ?? '—'}
              </span>
              <span>
                <span className="text-[color:var(--color-text-muted)]">cost:</span>{' '}
                {formatCost(result.cost)}
              </span>
              <span>
                <span className="text-[color:var(--color-text-muted)]">latency:</span>{' '}
                {formatLatency(result.latency_ms)}
              </span>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
        {label}
      </div>
      {children}
    </div>
  );
}
