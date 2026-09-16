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

/** Logo Google chính chủ — bốn màu, không tô theo currentColor. */
export function GoogleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function GamepadIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 12h4M8 10v4M15 11h.01M18 13h.01" />
      <path d="M7.5 6h9a5 5 0 0 1 5 5.2l-.6 5.3a2.5 2.5 0 0 1-4.4 1.3L14.8 15H9.2l-1.7 2.8a2.5 2.5 0 0 1-4.4-1.3L2.5 11.2A5 5 0 0 1 7.5 6Z" />
    </svg>
  );
}

export function CloudRainIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7 15a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 18 7.5a3.75 3.75 0 0 1-.5 7.5" />
      <path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3" />
    </svg>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
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

export function SpeakerIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 9.5h3L11.5 5.5v13L7 14.5H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" />
      <path d="M15.5 9a4 4 0 0 1 0 6" />
      <path d="M18.5 6.5a8 8 0 0 1 0 11" />
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

export function EyeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1A8.9 8.9 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.8 3.5" />
      <path d="M6.3 8.5A16 16 0 0 0 2.5 12S6 18 12 18a8.7 8.7 0 0 0 3.4-.7" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
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

export function SunIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function ImageIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m20 16-4.5-4.5L8 19" />
    </svg>
  );
}

export function TrophyIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5.5a1 1 0 0 0-1 1c0 2.2 1.6 3.5 3.5 3.8M16 6h2.5a1 1 0 0 1 1 1c0 2.2-1.6 3.5-3.5 3.8" />
      <path d="M12 13v3.5M9 20h6M10 17h4l.5 3h-5l.5-3Z" />
    </svg>
  );
}

export function FolderIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4.2l2 2H19a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5v-10Z" />
    </svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H10" />
      <path d="M14 8l4 4-4 4M18 12H9.5" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5H4.5L6 16.5Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function GiftIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 11.5h16v9H4z" />
      <path d="M3 7.5h18v4H3zM12 7.5v13" />
      <path d="M12 7.5c-1.5-3.5-5.5-3.5-5.5-1.5S9.5 7.5 12 7.5Zm0 0c1.5-3.5 5.5-3.5 5.5-1.5S14.5 7.5 12 7.5Z" />
    </svg>
  );
}

export function SparkleIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.5 14 9l5.5 2-5.5 2-2 5.5-2-5.5L4.5 11 10 9l2-5.5Z" />
      <path d="M19 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </svg>
  );
}
