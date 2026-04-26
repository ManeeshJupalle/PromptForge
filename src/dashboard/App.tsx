import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { Layout } from './components/Layout.js';

const Runs = lazy(() => import('./pages/Runs.js').then((m) => ({ default: m.Runs })));
const RunDetail = lazy(() =>
  import('./pages/RunDetail.js').then((m) => ({ default: m.RunDetail })),
);
const Compare = lazy(() => import('./pages/Compare.js').then((m) => ({ default: m.Compare })));
const Trends = lazy(() => import('./pages/Trends.js').then((m) => ({ default: m.Trends })));
const TestExplorer = lazy(() =>
  import('./pages/TestExplorer.js').then((m) => ({ default: m.TestExplorer })),
);

export function App() {
  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
        <Switch>
          <Route path="/" component={Runs} />
          <Route path="/runs/:id" component={RunDetail} />
          <Route path="/compare" component={Compare} />
          <Route path="/trends" component={Trends} />
          <Route path="/tests" component={TestExplorer} />
          <Route>
            <div className="rounded-md border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)]/50 p-10 text-center">
              <div
                className="mb-1 text-[15px] font-medium text-[color:var(--color-text)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Nothing here
              </div>
              <p className="text-[13px] text-[color:var(--color-text-dim)]">
                Try the nav above - Runs, Tests, or Trends.
              </p>
            </div>
          </Route>
        </Switch>
      </Suspense>
    </Layout>
  );
}

function PageFallback() {
  return (
    <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-10 text-center text-[13px] font-mono text-[color:var(--color-text-muted)]">
      loading...
    </div>
  );
}
