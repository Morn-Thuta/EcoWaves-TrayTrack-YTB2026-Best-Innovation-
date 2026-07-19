// Tray Monitor brand mark — two short bars suggesting tray edges / fill levels.
// Used in both management and chef screens for visual continuity.
export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Left bar — fuller fill */}
      <rect x="3"  y="3"  width="4" height="14" rx="1.5" fill="oklch(0.70 0.18 160)" />
      {/* Right bar — half fill, hints at depletion */}
      <rect x="13" y="9"  width="4" height="8"  rx="1.5" fill="oklch(0.70 0.18 160)" opacity="0.55" />
    </svg>
  );
}
