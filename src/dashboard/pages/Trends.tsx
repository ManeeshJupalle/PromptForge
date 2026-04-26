import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getTrends } from '../lib/api.js';
import type { TrendsPayload } from '../lib/types.js';
import { SparkIcon } from '../components/Icons.js';

/**
 * Trends page. Three charts answer three different questions:
 *
 *   1. Cost per day (USD)  — "is my prompt pipeline getting expensive?"
 *   2. Pass/fail per day    — "is my suite healthy over time?"
 *   3. Latency p50/p95      — "are my real-provider calls getting slower?"
 *
 * Empty-state handling is first-class: a flat-$0 cost chart looks broken, so
 * when sum is zero across the window we show an explanatory card instead of
 * the chart. Latency chart excludes mock server-side and labels that fact.
 */

// Custom tooltip styled to match the PromptForge CLI theme — steel card, hairline
// border, mono values. Recharts' default tooltip is white-on-grey which looks
// out of place on this dark base.
interface TooltipPayload {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}
interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  formatter?: (value: number, name: string) => string;
}
function PFChartTooltip({ active, payload, label, formatter }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="overflow-hidden rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]"
      style={{ boxShadow: '0 8px 32px -12px rgba(0,0,0,0.6)' }}
    >
      <div className="border-b border-[color:var(--color-border)] px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
        {label}
      </div>
      <div className="space-y-1 px-3 py-2">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-[12px]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: p.color, boxShadow: `0 0 8px ${p.color}60` }}
              aria-hidden
            />
            <span className="text-[color:var(--color-text-dim)]">{p.name}</span>
            <span className="ml-auto font-mono tabular-nums text-[color:var(--color-text)]">
              {formatter ? formatter(p.value, p.name) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Trends() {
  const [data, setData] = useState<TrendsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTrends()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  // Hero stats — daily-aggregate summaries that sit above the charts.
  const stats = useMemo(() => {
    if (!data) return null;
    const totalRuns = data.byDay.reduce((s, d) => s + d.run_count, 0);
    const totalCost = data.byDay.reduce((s, d) => s + (d.total_cost ?? 0), 0);
    const totalPassed = data.byDay.reduce((s, d) => s + (d.passed ?? 0), 0);
    const totalFailed = data.byDay.reduce((s, d) => s + (d.failed ?? 0), 0);
    const overallRate =
      totalPassed + totalFailed === 0 ? null : totalPassed / (totalPassed + totalFailed);
    const p95s = data.latency.map((l) => l.p95).filter((n) => n > 0);
    const avgP95 = p95s.length === 0 ? null : p95s.reduce((a, b) => a + b, 0) / p95s.length;
    return {
      days: data.byDay.length,
      totalRuns,
      totalCost,
      overallRate,
      avgP95,
    };
  }, [data]);

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

  const hasAnyData = data.byDay.length > 0 || data.latency.length > 0;
  const totalCost = data.byDay.reduce((s, d) => s + (d.total_cost ?? 0), 0);
  const hasCost = totalCost > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-[28px] font-semibold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Trends
        </h1>
        <p className="mt-0.5 text-[13px] text-[color:var(--color-text-dim)]">
          Per-day aggregates across every run in{' '}
          <code className="font-mono text-[color:var(--color-ember-hot)]">
            .promptforge/db.sqlite
          </code>
          .
        </p>
      </div>

      {/* Hero stats */}
      {stats && stats.days > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TrendStat
            label="Days recorded"
            value={String(stats.days)}
            foot={stats.totalRuns === 0 ? '—' : `${stats.totalRuns} runs total`}
          />
          <TrendStat
            label="Overall pass rate"
            value={stats.overallRate === null ? '—' : `${Math.round(stats.overallRate * 100)}%`}
            tone={
              stats.overallRate === null
                ? 'neutral'
                : stats.overallRate >= 0.9
                  ? 'pass'
                  : stats.overallRate >= 0.5
                    ? 'warn'
                    : 'fail'
            }
          />
          <TrendStat
            label="Total cost"
            value={`$${stats.totalCost.toFixed(4)}`}
            foot={stats.totalCost === 0 ? 'free providers only' : undefined}
          />
          <TrendStat
            label="Avg p95 latency"
            value={stats.avgP95 === null ? '—' : `${Math.round(stats.avgP95)}ms`}
            foot={stats.avgP95 === null ? 'no real-provider calls' : 'mock excluded'}
          />
        </div>
      )}

      {!hasAnyData && (
        <div className="rounded-md border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)]/50 p-10 text-center">
          <SparkIcon
            size={28}
            className="mx-auto mb-2 text-[color:var(--color-text-muted)]"
          />
          <div
            className="mb-1 text-[15px] font-medium"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            No recorded runs yet
          </div>
          <p className="text-[13px] text-[color:var(--color-text-dim)]">
            Trend data comes from{' '}
            <code className="font-mono text-[color:var(--color-ember-hot)]">promptforge-cli run</code>{' '}
            (excluding <code className="font-mono">--no-record</code>).
          </p>
        </div>
      )}

      {/* Cost chart — only render if there's non-zero cost. */}
      {data.byDay.length > 0 && (
        <ChartCard
          title="Cost per day"
          subtitle="USD, summed across every provider call"
        >
          {hasCost ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.byDay} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid
                  stroke="var(--color-chart-grid)"
                  strokeDasharray="2 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  stroke="var(--color-chart-axis)"
                  tick={{ fontSize: 10.5, fontFamily: 'var(--font-mono)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-border)' }}
                />
                <YAxis
                  stroke="var(--color-chart-axis)"
                  tick={{ fontSize: 10.5, fontFamily: 'var(--font-mono)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                />
                <Tooltip
                  content={
                    <PFChartTooltip
                      formatter={(v) => `$${v.toFixed(4)}`}
                    />
                  }
                  cursor={{ stroke: 'var(--color-border-hi)', strokeDasharray: '3 3' }}
                />
                <Line
                  type="monotone"
                  dataKey="total_cost"
                  name="cost"
                  stroke="var(--color-ember)"
                  strokeWidth={2}
                  dot={{
                    r: 3,
                    fill: 'var(--color-ember)',
                    stroke: 'var(--color-bg)',
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 5,
                    fill: 'var(--color-ember-hot)',
                    stroke: 'var(--color-bg)',
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex min-h-[200px] flex-col items-center justify-center py-8 text-center">
              <div className="mb-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg-tint)] p-2.5">
                <SparkIcon size={18} className="text-[color:var(--color-text-muted)]" />
              </div>
              <div
                className="mb-1 text-[14px] font-medium text-[color:var(--color-text)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                No paid-provider runs yet
              </div>
              <p className="max-w-md text-[12.5px] text-[color:var(--color-text-dim)]">
                Cost tracking kicks in once you add{' '}
                <code className="font-mono text-[color:var(--color-ember-hot)]">anthropic/*</code>,{' '}
                <code className="font-mono text-[color:var(--color-ember-hot)]">openai/*</code>, or{' '}
                <code className="font-mono text-[color:var(--color-ember-hot)]">gemini/*</code>{' '}
                providers. Local{' '}
                <code className="font-mono">ollama/*</code> and the{' '}
                <code className="font-mono">mock</code> provider are free.
              </p>
            </div>
          )}
        </ChartCard>
      )}

      {/* Pass/fail chart */}
      {data.byDay.length > 0 && (
        <ChartCard
          title="Pass / fail per day"
          subtitle="stacked — hover for daily breakdown"
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.byDay} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid
                stroke="var(--color-chart-grid)"
                strokeDasharray="2 4"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                stroke="var(--color-chart-axis)"
                tick={{ fontSize: 10.5, fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-border)' }}
              />
              <YAxis
                stroke="var(--color-chart-axis)"
                tick={{ fontSize: 10.5, fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<PFChartTooltip />}
                cursor={{ fill: 'var(--color-ember-faint)' }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-dim)',
                  paddingTop: 8,
                }}
                iconType="square"
                iconSize={8}
              />
              <Bar
                dataKey="passed"
                stackId="a"
                name="passed"
                fill="var(--color-pass)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="failed"
                stackId="a"
                name="failed"
                fill="var(--color-ember)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Latency chart — mock excluded server-side. */}
      {data.latency.length > 0 ? (
        <ChartCard
          title="Latency p50 / p95 per day"
          subtitle={
            data.latencyExcludesMock
              ? 'milliseconds, real providers only (mock excluded — it\'s instant)'
              : 'milliseconds, all providers'
          }
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.latency} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid
                stroke="var(--color-chart-grid)"
                strokeDasharray="2 4"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                stroke="var(--color-chart-axis)"
                tick={{ fontSize: 10.5, fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-border)' }}
              />
              <YAxis
                stroke="var(--color-chart-axis)"
                tick={{ fontSize: 10.5, fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}ms`}
              />
              <Tooltip
                content={<PFChartTooltip formatter={(v) => `${Math.round(v)}ms`} />}
                cursor={{ stroke: 'var(--color-border-hi)', strokeDasharray: '3 3' }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-dim)',
                  paddingTop: 8,
                }}
                iconType="circle"
                iconSize={7}
              />
              <Line
                type="monotone"
                dataKey="p50"
                name="p50"
                stroke="var(--color-chart-cool)"
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: 'var(--color-chart-cool)',
                  stroke: 'var(--color-bg)',
                  strokeWidth: 2,
                }}
              />
              <Line
                type="monotone"
                dataKey="p95"
                name="p95"
                stroke="var(--color-ember)"
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: 'var(--color-ember)',
                  stroke: 'var(--color-bg)',
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        data.byDay.length > 0 && (
          <ChartCard
            title="Latency p50 / p95 per day"
            subtitle="milliseconds — real providers only"
          >
            <div className="flex min-h-[200px] flex-col items-center justify-center py-8 text-center">
              <div className="mb-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg-tint)] p-2.5">
                <SparkIcon size={18} className="text-[color:var(--color-text-muted)]" />
              </div>
              <div
                className="mb-1 text-[14px] font-medium text-[color:var(--color-text)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                No real-provider latency data
              </div>
              <p className="max-w-md text-[12.5px] text-[color:var(--color-text-dim)]">
                Mock provider is instant (0ms), so it's excluded from latency
                aggregation — otherwise p50 would sit at 0 and the chart would
                read as a bug. Run against{' '}
                <code className="font-mono text-[color:var(--color-ember-hot)]">ollama/*</code> or a
                paid provider to populate this.
              </p>
            </div>
          </ChartCard>
        )
      )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pf-card overflow-hidden">
      <div className="flex flex-col gap-1 border-b border-[color:var(--color-border)] px-5 py-3 sm:flex-row sm:items-baseline sm:justify-between">
        <h2
          className="text-[14px] font-semibold tracking-tight text-[color:var(--color-text)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h2>
        {subtitle && (
          <span className="font-mono text-[10.5px] text-[color:var(--color-text-muted)]">
            {subtitle}
          </span>
        )}
      </div>
      <div className="px-3 py-4">{children}</div>
    </div>
  );
}

function TrendStat({
  label,
  value,
  foot,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  foot?: string;
  tone?: 'neutral' | 'pass' | 'warn' | 'fail';
}) {
  const toneColor: Record<NonNullable<typeof tone>, string> = {
    neutral: 'var(--color-text)',
    pass: 'var(--color-pass)',
    warn: 'var(--color-warn)',
    fail: 'var(--color-ember)',
  };
  return (
    <div className="pf-card relative overflow-hidden px-4 py-3.5">
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
