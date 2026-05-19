import type { CSSProperties } from "react";
import { AxisIndicator } from "./AxisIndicator";
import { BracketFrame } from "./BracketFrame";
import { RangeBar, type RangeBarProps } from "./RangeBar";
import { StageLabel, type StageLabelProps } from "./StageLabel";

// SpatialOverlay — the composite. Drop into any positioned container
// and it adds the full headset-HUD framing: corner brackets, a stage
// label top-left, an axis indicator top-right, and an optional range
// bar across the bottom. The overlay itself never eats clicks.
//
// Usage: parent must establish a positioning context (relative,
// absolute, fixed). Children of the parent render underneath; the
// overlay sits over them.

export type SpatialOverlayProps = {
  /** Top-left stage label. Pass `undefined` to omit. */
  stageLabel?: StageLabelProps;
  /** Top-right XYZ widget. Default true. */
  axis?: boolean;
  /** Corner brackets around the whole region. Default true. */
  brackets?: boolean;
  /** Bottom-edge range bar. Pass `undefined` to omit. */
  range?: RangeBarProps;
  /** Extra classes. */
  className?: string;
};

const FILL: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
};

export function SpatialOverlay({
  stageLabel,
  axis = true,
  brackets = true,
  range,
  className,
}: SpatialOverlayProps) {
  // BracketFrame wraps children, so we use it here purely for its
  // corner marks by passing an empty fill div. The wrapper covers
  // the whole container.
  return (
    <div
      aria-hidden
      style={FILL}
      className={className}
    >
      {brackets ? (
        <BracketFrame
          color="pink"
          length={24}
          inset={10}
          className="absolute inset-0"
        >
          {/* The bracket's "child" is just a transparent fill so the
              wrapper sizes correctly. */}
          <div style={{ width: "100%", height: "100%" }} />
        </BracketFrame>
      ) : null}

      {stageLabel ? (
        <div
          style={{
            position: "absolute",
            top: 18,
            left: 22,
          }}
        >
          <StageLabel {...stageLabel} />
        </div>
      ) : null}

      {axis ? (
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 18,
          }}
        >
          <AxisIndicator size={64} />
        </div>
      ) : null}

      {range ? (
        <div
          style={{
            position: "absolute",
            left: 22,
            right: 22,
            bottom: 18,
          }}
        >
          <RangeBar {...range} />
        </div>
      ) : null}
    </div>
  );
}

export default SpatialOverlay;
