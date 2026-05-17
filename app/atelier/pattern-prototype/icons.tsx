/**
 * app/atelier/pattern-prototype/icons.tsx — Inline SVG icons for the
 * pattern-prototype chamber.
 *
 * Extracted from pattern-prototype-client.tsx. The site doesn't
 * install lucide-react globally; the chamber inlines the handful of
 * icons it uses as raw SVG path strings + a single <Icon /> wrapper
 * at 14-20px stroke=2 line-cap=round.
 */

export function Icon({
  d,
  size = 14,
}: {
  d: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export const ICON_WAND =
  "M15 4V2 M15 16v-2 M8 9h2 M20 9h2 M17.8 11.8 19 13 M15 9h0 M17.8 6.2 19 5 M3 21l9-9 M12.2 6.2 11 5";
export const ICON_SHIRT =
  "M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z";
export const ICON_RULER =
  "M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z M14.5 12.5 12 15 M11 9.5 8.5 12 M7.5 6.5 5 9 M18 16l-2 2";
export const ICON_ARCHIVE =
  "M20 9v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9 M22 5H2v4h20V5 M10 13h4";
export const ICON_SPARKLES =
  "M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z";
export const ICON_PRINTER =
  "M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z";
export const ICON_PALETTE =
  "M12 22a1 1 0 0 1-1-1v-3a1 1 0 0 0-2 0v3a1 1 0 0 1-1 1 9 9 0 1 1 9-9 4 4 0 0 1-4 4h-2.5a.5.5 0 0 0-.5.5v.5a2 2 0 0 1-2 2z M13.5 6.5h.01 M17.5 10.5h.01 M6.5 12.5h.01 M8.5 7.5h.01";
export const ICON_LAYERS =
  "m12 2 8 4-8 4-8-4 8-4z m-8 10 8 4 8-4 m-16 4 8 4 8-4";
export const ICON_CHAT =
  "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z";
export const ICON_X = "M18 6 6 18 M6 6l12 12";
export const ICON_SEND =
  "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z M22 2 11 13";
export const ICON_HEART =
  "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z";
