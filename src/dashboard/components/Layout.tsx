import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { FlameMark } from './Icons.js';

const TABS: Array<{
  href: string;
  label: string;
  code: string;
  detail: string;
  matches: (path: string) => boolean;
}> = [
  {
    href: '/',
    label: 'Runs',
    code: 'RN',
    detail: 'Execution ledger',
    matches: (p) => p === '/' || p.startsWith('/runs') || p.startsWith('/compare'),
  },
  { href: '/tests', label: 'Tests', code: 'TS', detail: 'Prompt matrix', matches: (p) => p.startsWith('/tests') },
  { href: '/trends', label: 'Trends', code: 'TR', detail: 'Signal history', matches: (p) => p.startsWith('/trends') },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const active = TABS.find((tab) => tab.matches(location)) ?? TABS[0];

  return (
    <div className="pf-shell min-h-full lg:grid lg:grid-cols-[88px_minmax(0,1fr)]">
      <aside className="pf-rail hidden min-h-screen flex-col items-center border-r border-[color:var(--color-border)] lg:flex">
        <Link href="/" className="group mt-5 flex flex-col items-center gap-2">
          <span className="pf-mark-plate">
            <FlameMark size={28} className="transition-transform duration-300 group-hover:scale-110" />
          </span>
          <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[color:var(--color-text-muted)]">
            PF
          </span>
        </Link>

        <nav className="mt-10 flex w-full flex-col gap-2 px-3">
          {TABS.map((tab) => {
            const isActive = tab.matches(location);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                title={`${tab.label}: ${tab.detail}`}
                className={'pf-rail-link ' + (isActive ? 'is-active' : '')}
              >
                <span className="font-mono text-[11px] font-semibold tracking-[0.08em]">
                  {tab.code}
                </span>
                <span className="text-[10px]">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-3 pb-6">
          <span className="pf-rail-meter" aria-hidden />
          <span className="writing-mode-vertical font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
            local
          </span>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/88 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 sm:px-6 lg:py-4">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="group flex items-center gap-2.5 lg:hidden">
                <FlameMark size={22} className="transition-transform duration-300 group-hover:scale-110" />
                <span
                  className="text-[17px] font-semibold tracking-tight text-[color:var(--color-text)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  PromptForge CLI
                </span>
              </Link>

              <div className="hidden min-w-0 items-baseline gap-3 lg:flex">
                <span className="pf-stat-label text-[color:var(--color-ember-hot)]">
                  Forge Workbench
                </span>
                <span className="text-[13px] text-[color:var(--color-text-dim)]">
                  {active.label}
                </span>
                <span className="font-mono text-[11px] text-[color:var(--color-text-muted)]">
                  {active.detail}
                </span>
              </div>

              <div className="hidden items-center gap-2 lg:flex">
                <span className="pf-chip">.promptforge/db.sqlite</span>
                <span className="pf-chip pf-chip--ember">local-first</span>
              </div>

              <span className="font-mono text-[10px] tracking-wider text-[color:var(--color-text-muted)] lg:hidden">
                v0.1.0
              </span>
            </div>

            <nav className="flex w-full items-center gap-0.5 overflow-x-auto text-[13px] lg:hidden">
              {TABS.map((tab) => {
                const isActive = tab.matches(location);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={'pf-mobile-tab ' + (isActive ? 'is-active' : '')}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 pf-enter sm:px-6 sm:py-10" key={location}>
          {children}
        </main>

        <footer className="mx-auto max-w-7xl px-4 pb-8 pt-4 sm:px-6">
          <div className="flex flex-col gap-2 border-t border-[color:var(--color-border)] pt-4 text-[11px] text-[color:var(--color-text-muted)] sm:flex-row sm:items-center sm:justify-between">
            <span className="font-mono tracking-wide">
              PromptForge CLI Workbench / no telemetry / project-local state
            </span>
            <span className="font-mono">
              127.0.0.1 <span className="text-[color:var(--color-border-hi)]">/</span>{' '}
              <span className="text-[color:var(--color-text-dim)]">online</span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
