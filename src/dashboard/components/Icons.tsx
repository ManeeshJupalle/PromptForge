/**
 * Inline SVG icon set. Kept tiny and stroke-based so they take on the parent's
 * `color` — no per-icon style plumbing. Sized via the `size` prop (default 16).
 *
 * Intentionally NOT pulling in a 200KB icon library. These are hand-rolled to
 * match the industrial-precision aesthetic: sharp, 1.5-stroke, no rounded-cute.
 */
type IconProps = { size?: number; className?: string; strokeWidth?: number };

const base = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
  'aria-hidden': true,
});

export function FlameMark({ size = 18, className }: IconProps) {
  // The PromptForge CLI logomark — a stylized flame/ingot. Squared at the base
  // (forge vessel) and flared at the top. Shown in the nav next to the
  // wordmark.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="pf-flame-grad" x1="0" y1="24" x2="0" y2="0">
          <stop offset="0%" stopColor="#d94d0a" />
          <stop offset="55%" stopColor="#ff6a1a" />
          <stop offset="100%" stopColor="#ffb547" />
        </linearGradient>
      </defs>
      <path
        d="M12 3 C 14 7, 18 8, 18 13 A 6 6 0 0 1 6 13 C 6 10, 8 9, 9 7 C 10 9, 11 9, 12 8 C 12 6, 12 5, 12 3 Z"
        fill="url(#pf-flame-grad)"
      />
      <path
        d="M12 11 C 13 13, 14.5 13.5, 14.5 15.5 A 2.5 2.5 0 0 1 9.5 15.5 C 9.5 14, 10.5 13.5, 11 12.5 C 11.5 13, 12 13, 12 11 Z"
        fill="#ffcc77"
        opacity="0.85"
      />
    </svg>
  );
}

export function ChevronRight({ size = 16, className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

export function ChevronDown({ size = 16, className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function Check({ size = 14, className, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <polyline points="5 12 10 17 19 7" />
    </svg>
  );
}

export function Cross({ size = 14, className, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

export function ArrowRight({ size = 14, className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  );
}

export function FolderMono({ size = 14, className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <path d="M3 7 A2 2 0 0 1 5 5 H9 L11 7 H19 A2 2 0 0 1 21 9 V17 A2 2 0 0 1 19 19 H5 A2 2 0 0 1 3 17 Z" />
    </svg>
  );
}

export function GitCommit({ size = 13, className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="3" />
      <line x1="3" y1="12" x2="9" y2="12" />
      <line x1="15" y1="12" x2="21" y2="12" />
    </svg>
  );
}

export function ClockIcon({ size = 13, className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  );
}

export function HashIcon({ size = 13, className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

export function SparkIcon({ size = 16, className, strokeWidth = 1.5 }: IconProps) {
  // A 4-point "spark" — used in empty states and as a small accent.
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <path d="M12 3 L13 10 L20 12 L13 14 L12 21 L11 14 L4 12 L11 10 Z" />
    </svg>
  );
}

export function SearchIcon({ size = 14, className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  );
}
