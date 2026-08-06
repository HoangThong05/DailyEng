// Bộ icon SVG inline (24x24, stroke theo currentColor) — không cần cài thư viện icon.
type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20a1 1 0 0 0 1 1H10v-5.5h4V21h3.5a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}

export function CardsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="6" y="3.5" width="14" height="12" rx="2.5" />
      <path d="M16 18.5a2.5 2.5 0 0 1-2.5 2.5H6.5A2.5 2.5 0 0 1 4 18.5V8" />
    </svg>
  );
}

export function QuizIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M8.5 12.2l2.4 2.4 4.6-5" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 20v-5" />
      <path d="M13 20V9" />
      <path d="M18 20v-8" />
    </svg>
  );
}

export function MicIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
      <path d="M12 18v3.5" />
    </svg>
  );
}

export function FlameIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 2.5c.7 3 3.2 4.1 4.6 6.4A6.8 6.8 0 0 1 12 21.5 6.8 6.8 0 0 1 7.4 8.9c.6 1 1.4 1.6 2.2 1.9-.4-3 1-6.4 2.4-8.3Z" />
      <path d="M12 21.5a2.9 2.9 0 0 0 2.2-4.8c-.7-.9-1.9-1.4-2.2-2.7-.6.8-1.6 1.3-2.1 2.4A2.9 2.9 0 0 0 12 21.5Z" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  );
}

export function ShareIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 15.5V3.5" />
      <path d="M8.5 7 12 3.5 15.5 7" />
      <path d="M6 12H5a1.5 1.5 0 0 0-1.5 1.5V19A1.5 1.5 0 0 0 5 20.5h14A1.5 1.5 0 0 0 20.5 19v-5.5A1.5 1.5 0 0 0 19 12h-1" />
    </svg>
  );
}
