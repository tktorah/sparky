import type { IconName } from "./data";

const paths: Record<IconName, React.ReactNode> = {
  binary: (
    <>
      <rect x="14" y="14" width="4" height="6" rx="2" />
      <rect x="6" y="4" width="4" height="6" rx="2" />
      <path d="M6 20h4M14 10h4M6 14h2v6M14 4h2v6" />
    </>
  ),
  braces: (
    <>
      <path d="M8 7a2 2 0 0 0-2 2v1a2 2 0 0 1-2 2 2 2 0 0 1 2 2v1a2 2 0 0 0 2 2" />
      <path d="M16 17a2 2 0 0 0 2-2v-1a2 2 0 0 1 2-2 2 2 0 0 1-2-2V9a2 2 0 0 0-2-2" />
    </>
  ),
  case: (
    <>
      <path d="m3 16 4-10 4 10M4.5 13h5M22 9v7" />
      <circle cx="18" cy="13" r="3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  code: <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />,
  database: (
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" />
      <path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </>
  ),
  fingerprint: (
    <>
      <path d="M12 10a2 2 0 0 0-2 2c0 1-.1 2.5-.3 4M14 13c0 2.4 0 6.4-1 9M2 12a10 10 0 0 1 18-6M5 19.5c.5-1.5 1-4.5 1-7.5a6 6 0 0 1 12 0v2" />
    </>
  ),
  hash: <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />,
  home: (
    <>
      <path d="M15 21v-8H9v8" />
      <path d="M3 10 12 2l9 8v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </>
  ),
  key: (
    <>
      <path d="M21 2 11 12" />
      <circle cx="7.5" cy="16.5" r="5.5" />
      <path d="m15 8 3 3 3-3" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  palette: (
    <>
      <path d="M12 22a10 9 0 1 1 10-9 5 5 0 0 1-5 5h-2.2a1.8 1.8 0 0 0-1.4 2.8l.3.4a1.8 1.8 0 0 1-1.7.8Z" />
      <circle cx="13.5" cy="6.5" r=".5" />
      <circle cx="17.5" cy="10.5" r=".5" />
      <circle cx="6.5" cy="12.5" r=".5" />
      <circle cx="8.5" cy="7.5" r=".5" />
    </>
  ),
  qr: <path d="M4 4h6v6H4ZM14 4h6v6h-6ZM4 14h6v6H4ZM14 14h2v2h-2ZM18 14h2v6h-4v-2h2ZM14 18h2v2h-2Z" />,
  searchCode: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3M9 8.5 7 11l2 2.5M13 8.5l2 2.5-2 2.5" />
    </>
  ),
  split: <path d="M16 3h5v5M8 3H3v5M12 22v-8a4 4 0 0 0-1.2-2.8L3 3M15 9l6-6" />,
  type: <path d="M12 4v16M4 7V5h16v2M9 20h6" />,
};

type IconProps = {
  name: IconName;
  className?: string;
};

export function Icon({ name, className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}
