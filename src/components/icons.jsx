// Icon system: 24px stroke icons (Lucide-style path data), rendered at
// any size via currentColor. No emoji in the interface.

const ICONS = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </>
  ),
  tasks: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="m8.3 12.2 2.7 2.7 5-5.6" />
    </>
  ),
  note: (
    <>
      <path d="M14.5 2.5H6a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.5l-5.5-6z" />
      <path d="M14 2.5v6h6" />
      <path d="M8.5 13.5h7M8.5 17h5" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M18 17V9M13 17V5M8 17v-3" />
    </>
  ),
  bell: (
    <>
      <path d="M6.3 8.5a5.7 5.7 0 0 1 11.4 0c0 6.3 2.3 8 2.3 8H4s2.3-1.7 2.3-8" />
      <path d="M10.4 20.5a1.8 1.8 0 0 0 3.2 0" />
    </>
  ),
  bellOff: (
    <>
      <path d="M8.7 5.9A5.7 5.7 0 0 1 17.7 8.5c0 6.3 2.3 8 2.3 8H7" />
      <path d="M4 4l16 16" />
      <path d="M10.4 20.5a1.8 1.8 0 0 0 3.2 0" />
      <path d="M4 16.5s2.3-1.7 2.3-8" />
    </>
  ),
  sliders: (
    <>
      <path d="M3 6h6M15 6h6M3 12h10M19 12h2M3 18h4M13 18h8" />
      <circle cx="11.5" cy="6" r="2" />
      <circle cx="15.5" cy="12" r="2" />
      <circle cx="9.5" cy="18" r="2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  x: <path d="M18 6 6 18M6 6l12 12" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  pen: <path d="M17.2 3.2a2.6 2.6 0 0 1 3.6 3.6L7.5 20.1 2.5 21.5l1.4-5L17.2 3.2z" />,
  trash: (
    <>
      <path d="M3.5 6h17" />
      <path d="M18.5 6v13a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V6" />
      <path d="M8.5 6V4.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  repeat: (
    <>
      <path d="m17 2.5 3.5 3.5L17 9.5" />
      <path d="M3.5 11.5v-1.5a4 4 0 0 1 4-4h13" />
      <path d="m7 21.5-3.5-3.5L7 14.5" />
      <path d="M20.5 12.5V14a4 4 0 0 1-4 4h-13" />
    </>
  ),
  alert: (
    <>
      <path d="m10.6 3.9 1-1.7a.47.47 0 0 1 .8 0l8 13.8a.47.47 0 0 1-.4.7H4a.47.47 0 0 1-.4-.7l5.6-9.7" />
      <path d="M12 9v4.5" />
      <path d="M12 17h.01" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="4.5" width="17" height="16.5" rx="2.5" />
      <path d="M16 2.5v4M8 2.5v4M3.5 10.5h17" />
    </>
  ),
  zap: <path d="M13 2.5 4.5 13.5H12l-1 8L19.5 10.5H12l1-8z" />,
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </>
  ),
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 8 5-5 5 5" />
      <path d="M12 3v12" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  moon: <path d="M20.4 14.2A8.5 8.5 0 1 1 9.8 3.6a7 7 0 0 0 10.6 10.6z" />,
};

export default function Icon({ name, size = 16, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}
