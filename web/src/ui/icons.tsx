import type { JSX } from "preact";

/* Hand-built line icons. No icon library, no external font. */
const stroke = {
  viewBox: "0 0 24 24",
  width: 24,
  height: 24,
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 1.8,
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  "aria-hidden": "true",
  focusable: "false",
} as const;

export function LeafIcon(): JSX.Element {
  return (
    <svg {...stroke}>
      <path d="M12 21c0-6 3-10 8-11 0 6-3 10-8 11Z" />
      <path d="M12 21C7 20 4 16 4 10c5 1 8 5 8 11Z" />
      <path d="M12 21v-6" />
    </svg>
  );
}

export function HomeIcon(): JSX.Element {
  return (
    <svg {...stroke}>
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1Z" />
    </svg>
  );
}

export function MoodIcon(): JSX.Element {
  return (
    <svg {...stroke}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </svg>
  );
}

export function JournalIcon(): JSX.Element {
  return (
    <svg {...stroke}>
      <path d="M6 3.5h9.5A2.5 2.5 0 0 1 18 6v14.5H8.5A2.5 2.5 0 0 1 6 18Z" />
      <path d="M6 18a2.5 2.5 0 0 1 2.5-2.5H18" />
      <path d="M10 7.5h4.5" />
    </svg>
  );
}

export function ConsultationIcon(): JSX.Element {
  return (
    <svg {...stroke}>
      <path d="M20 12.6c0 3.8-3.6 6.9-8 6.9-.9 0-1.8-.1-2.6-.4L5 21l1.1-3.4A6.6 6.6 0 0 1 4 12.6C4 8.8 7.6 5.7 12 5.7s8 3.1 8 6.9Z" />
      <path d="M12 10.2c1.4-1.3 3.4.3 2.3 1.7-.6.8-2.3 2.2-2.3 2.2s-1.7-1.4-2.3-2.2c-1.1-1.4.9-3 2.3-1.7Z" />
    </svg>
  );
}

export function ProfileIcon(): JSX.Element {
  return (
    <svg {...stroke}>
      <circle cx="12" cy="9" r="3.6" />
      <path d="M5 20c0-3.5 3.1-5.6 7-5.6s7 2.1 7 5.6" />
    </svg>
  );
}

export function PencilIcon(): JSX.Element {
  return (
    <svg {...stroke}>
      <path d="M4 20h4l10-10a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5Z" />
      <path d="M14 7.5 16.5 10" />
    </svg>
  );
}

export function ChartIcon(): JSX.Element {
  return (
    <svg {...stroke}>
      <path d="M4 19.5V5" />
      <path d="M4 19.5h16" />
      <path d="M7.5 15.5l3.5-4 3 2.5 4-6" />
    </svg>
  );
}

export function BreathIcon(): JSX.Element {
  return (
    <svg {...stroke}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2" />
    </svg>
  );
}

export function CalendarIcon(): JSX.Element {
  return (
    <svg {...stroke}>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" />
      <path d="M4 10h16M9 3.5v4M15 3.5v4" />
    </svg>
  );
}

export function StarIcon({ filled = false }: { filled?: boolean }): JSX.Element {
  return (
    <svg {...stroke} fill={filled ? "currentColor" : "none"}>
      <path d="m12 4.8 2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 10l5-.7Z" />
    </svg>
  );
}

export function SearchIcon(): JSX.Element {
  return (
    <svg {...stroke}>
      <circle cx="11" cy="11" r="6" />
      <path d="m15.5 15.5 4 4" />
    </svg>
  );
}

export function InstallIcon(): JSX.Element {
  return (
    <svg {...stroke}>
      <path d="M12 4v10" />
      <path d="m8 10.5 4 3.5 4-3.5" />
      <path d="M5 18.5h14" />
    </svg>
  );
}

export function LogoutIcon(): JSX.Element {
  return (
    <svg {...stroke}>
      <path d="M14 5.5H7.5A2.5 2.5 0 0 0 5 8v8a2.5 2.5 0 0 0 2.5 2.5H14" />
      <path d="M16.5 12H9.5M14 9l3 3-3 3" />
    </svg>
  );
}
