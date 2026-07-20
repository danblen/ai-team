export function LogoIcon() {
  return (
    <svg
      className="brand-logo"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3L21 12L12 21L3 12Z" />
      <path d="M12 8L16 12L12 16L8 12Z" strokeDasharray="1 2.5" strokeOpacity="0.6" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.15" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}
