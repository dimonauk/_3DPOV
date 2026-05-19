// AxisIndicator — small XYZ axis widget. Three lines from a shared
// origin with a labelled tip on each. The convention is the same as
// every 3D viewport ever: X horizontal, Y vertical, Z towards viewer.
// Colours pulled into the studio palette so it doesn't shout the
// usual eye-watering red/green/blue.
//
// Pure SVG, server-component-safe, no JS. Aria-hidden — it's chrome.

export type AxisIndicatorProps = {
  /** Box size, px. Default 80. */
  size?: number;
  /** Draw the X/Y/Z tip labels. Default true. */
  showLabels?: boolean;
  /** Extra classes. */
  className?: string;
};

// Studio-palette axis colours — desaturated from the usual primaries
// so the widget reads as part of the chrome rather than a children's
// 3D-modeller tutorial.
const AXIS_COLORS = {
  x: "var(--color-pink-300)",
  y: "var(--color-mint-300)",
  z: "var(--color-lavender-300)",
} as const;

export function AxisIndicator({
  size = 80,
  showLabels = true,
  className,
}: AxisIndicatorProps) {
  const cx = size / 2;
  const cy = size / 2;
  // Axis arm length sits inside the box with room for the label.
  const arm = size * 0.34;
  // Z goes diagonally up-right at ~30° to fake perspective on a flat
  // SVG. Standard isometric widget convention.
  const zX = cx + arm * Math.cos((-30 * Math.PI) / 180);
  const zY = cy + arm * Math.sin((-30 * Math.PI) / 180);

  const labelOffset = 8;

  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ pointerEvents: "none", overflow: "visible" }}
    >
      {/* Origin marker. */}
      <circle
        cx={cx}
        cy={cy}
        r={1.5}
        fill="var(--color-chrome-200)"
      />

      {/* X — horizontal right. */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + arm}
        y2={cy}
        stroke={AXIS_COLORS.x}
        strokeWidth={1}
      />
      {/* Y — vertical up. SVG Y grows downward, so this is -arm. */}
      <line
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - arm}
        stroke={AXIS_COLORS.y}
        strokeWidth={1}
      />
      {/* Z — isometric up-right diagonal. */}
      <line
        x1={cx}
        y1={cy}
        x2={zX}
        y2={zY}
        stroke={AXIS_COLORS.z}
        strokeWidth={1}
      />

      {showLabels ? (
        <g
          fontFamily="var(--font-mono)"
          fontSize="9"
          letterSpacing="0.12em"
        >
          <text
            x={cx + arm + labelOffset / 2}
            y={cy + 3}
            fill={AXIS_COLORS.x}
            textAnchor="start"
          >
            X
          </text>
          <text
            x={cx}
            y={cy - arm - labelOffset / 2}
            fill={AXIS_COLORS.y}
            textAnchor="middle"
          >
            Y
          </text>
          <text
            x={zX + labelOffset / 2}
            y={zY - labelOffset / 2}
            fill={AXIS_COLORS.z}
            textAnchor="start"
          >
            Z
          </text>
        </g>
      ) : null}
    </svg>
  );
}

export default AxisIndicator;
