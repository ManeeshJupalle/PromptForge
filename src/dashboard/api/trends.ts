import { Hono } from 'hono';
import {
  listDailyLatencies,
  listDailyRunAggregates,
  type DailyRunAggregate,
} from '../../core/storage/queries.js';
import type { Database } from '../../core/storage/types.js';

export interface LatencyDay {
  day: string;
  p50: number;
  p95: number;
  count: number;
}

export interface TrendsPayload {
  byDay: DailyRunAggregate[];
  latency: LatencyDay[];
  // Whether the server filtered mock providers out of the latency aggregation.
  // Used by the UI to annotate the latency chart — otherwise a p50 of 0ms
  // (because mock is instant) reads as a bug.
  latencyExcludesMock: boolean;
}

// Mock provider is always 0ms, which pins p50 to 0 across every run that
// uses it and makes the latency chart meaningless as a real-world
// performance signal. Filter it out at the API layer so the chart reflects
// what a production user actually experiences.
function isMockProvider(p: string): boolean {
  return p === 'mock' || p.startsWith('mock/');
}

export function trendsRoute(db: Database): Hono {
  const app = new Hono();

  app.get('/', (c) => {
    const byDay = listDailyRunAggregates(db);

    // Group raw latency samples by day, then compute p50/p95. SQLite has no
    // percentile function, so we do this in JS — sample counts are tiny
    // (hundreds per day at most) so the overhead is trivial.
    const bucketed = new Map<string, number[]>();
    for (const row of listDailyLatencies(db)) {
      if (isMockProvider(row.provider)) continue;
      const list = bucketed.get(row.day) ?? [];
      list.push(row.latency_ms);
      bucketed.set(row.day, list);
    }
    const latency: LatencyDay[] = [];
    for (const [day, samples] of bucketed) {
      samples.sort((a, b) => a - b);
      latency.push({
        day,
        p50: quantile(samples, 0.5),
        p95: quantile(samples, 0.95),
        count: samples.length,
      });
    }
    latency.sort((a, b) => a.day.localeCompare(b.day));

    const payload: TrendsPayload = { byDay, latency, latencyExcludesMock: true };
    return c.json(payload);
  });

  return app;
}

function quantile(sortedSamples: number[], q: number): number {
  if (sortedSamples.length === 0) return 0;
  const pos = (sortedSamples.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sortedSamples[lo];
  const frac = pos - lo;
  return sortedSamples[lo] * (1 - frac) + sortedSamples[hi] * frac;
}
