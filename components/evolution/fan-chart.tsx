"use client";

/**
 * components/evolution/fan-chart.tsx — Concentric ancestor-ring fan
 * chart. Ring N carries up to 2^N wedges (parents = 2, grandparents = 4,
 * etc). Wedge arc-width is supplied by an injectable weight function so
 * the same component can later render real mixture-genome contributions
 * instead of generation-decay defaults.
 */

import type * as React from "react";
import { useMemo } from "react";

import type { Genome } from "lib/evolution/genome";

import { KINGDOM_COLOURS } from "./kingdom-palette";

export type AncestryWeight = (depth: number, slotIndex: number) => number;

export const generationDecayWeight: AncestryWeight = (depth) => {
  if (depth <= 0) return 1;
  return 1 / Math.pow(2, depth);
};

export type FanChartProps = {
  ego: Genome;
  ancestors: Map<string, Genome>;
  depth: number;
  onSelect: (id: string) => void;
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
  weightFn?: AncestryWeight;
  size?: number;
};

type Wedge = {
  id: string;
  depth: number;
  slotIndex: number;
  genome: Genome | null;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
};

const TWO_PI = Math.PI * 2;
const START_OFFSET = -Math.PI / 2;

function polar(cx: number, cy: number, r: number, theta: number): [number, number] {
  return [cx + r * Math.cos(theta), cy + r * Math.sin(theta)];
}

function wedgePath(
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  a0: number,
  a1: number,
): string {
  const [x0o, y0o] = polar(cx, cy, r1, a0);
  const [x1o, y1o] = polar(cx, cy, r1, a1);
  const [x0i, y0i] = polar(cx, cy, r0, a1);
  const [x1i, y1i] = polar(cx, cy, r0, a0);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  if (r0 <= 0.001) {
    return `M ${cx} ${cy} L ${x0o} ${y0o} A ${r1} ${r1} 0 ${large} 1 ${x1o} ${y1o} Z`;
  }
  return [
    `M ${x0o} ${y0o}`,
    `A ${r1} ${r1} 0 ${large} 1 ${x1o} ${y1o}`,
    `L ${x0i} ${y0i}`,
    `A ${r0} ${r0} 0 ${large} 0 ${x1i} ${y1i}`,
    "Z",
  ].join(" ");
}

function buildWedges(
  ego: Genome,
  ancestors: Map<string, Genome>,
  depth: number,
  weightFn: AncestryWeight,
  centerRadius: number,
  ringWidth: number,
): Wedge[] {
  const wedges: Wedge[] = [];

  type Slot = { genome: Genome | null; slotIndex: number };
  let prevRing: Slot[] = [{ genome: ego, slotIndex: 0 }];

  for (let d = 1; d <= depth; d++) {
    const slotCount = Math.pow(2, d);
    const weights: number[] = [];
    let weightTotal = 0;
    for (let i = 0; i < slotCount; i++) {
      const w = Math.max(0, weightFn(d, i));
      weights.push(w);
      weightTotal += w;
    }
    if (weightTotal <= 0) {
      for (let i = 0; i < slotCount; i++) weights[i] = 1 / slotCount;
      weightTotal = 1;
    }
    const innerRadius = centerRadius + (d - 1) * ringWidth;
    const outerRadius = innerRadius + ringWidth;
    const nextRing: Slot[] = new Array(slotCount).fill(null).map(() => ({
      genome: null,
      slotIndex: 0,
    }));

    let cursor = START_OFFSET;
    for (let i = 0; i < slotCount; i++) {
      const parentSlotIdx = Math.floor(i / 2);
      const parentSlot = prevRing[parentSlotIdx];
      const child = parentSlot?.genome;
      let genome: Genome | null = null;
      if (child) {
        const pid = child.parentIds[i % 2];
        if (pid) genome = ancestors.get(pid) ?? null;
      }
      const wRaw = weights[i] ?? 0;
      const span = (wRaw / weightTotal) * TWO_PI;
      const startAngle = cursor;
      const endAngle = cursor + span;
      cursor = endAngle;

      wedges.push({
        id: genome ? `${d}-${i}-${genome.sequenceId}` : `${d}-${i}-empty`,
        depth: d,
        slotIndex: i,
        genome,
        startAngle,
        endAngle,
        innerRadius,
        outerRadius,
      });
      nextRing[i] = { genome, slotIndex: i };
    }
    prevRing = nextRing;
  }
  return wedges;
}

function descendantSlotsOf(
  depth: number,
  slotIndex: number,
  maxDepth: number,
): Array<{ depth: number; slotIndex: number }> {
  const out: Array<{ depth: number; slotIndex: number }> = [];
  let lo = slotIndex;
  let hi = slotIndex + 1;
  for (let d = depth; d <= maxDepth; d++) {
    for (let i = lo; i < hi; i++) out.push({ depth: d, slotIndex: i });
    lo *= 2;
    hi *= 2;
  }
  return out;
}

export function FanChart(props: FanChartProps): React.JSX.Element {
  const {
    ego,
    ancestors,
    depth,
    onSelect,
    hoveredId,
    onHover,
    weightFn = generationDecayWeight,
    size = 560,
  } = props;
  const cx = size / 2;
  const cy = size / 2;
  const centerRadius = size * 0.085;
  const ringWidth = (size / 2 - centerRadius - 14) / Math.max(depth, 1);

  const wedges = useMemo(
    () => buildWedges(ego, ancestors, depth, weightFn, centerRadius, ringWidth),
    [ego, ancestors, depth, weightFn, centerRadius, ringWidth],
  );

  const hoveredWedge = wedges.find(
    (w) => w.genome && w.genome.sequenceId === hoveredId,
  );
  const highlightSet = new Set<string>();
  if (hoveredWedge) {
    for (const d of descendantSlotsOf(hoveredWedge.depth, hoveredWedge.slotIndex, depth)) {
      highlightSet.add(`${d.depth}-${d.slotIndex}`);
    }
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={`Ancestry fan chart for ${ego.sequenceId}`}
      className="block select-none"
    >
      <defs>
        <radialGradient id="fan-disc" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.02)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={size / 2 - 6} fill="url(#fan-disc)" stroke="rgba(255,255,255,0.06)" />

      {wedges.map((w) => {
        const fill = w.genome
          ? KINGDOM_COLOURS[w.genome.kingdom]
          : "rgba(255,255,255,0.03)";
        const slotKey = `${w.depth}-${w.slotIndex}`;
        const isHighlighted = highlightSet.has(slotKey);
        const dimmed = hoveredWedge && !isHighlighted;
        const isFocused = hoveredWedge && w.depth === hoveredWedge.depth && w.slotIndex === hoveredWedge.slotIndex;
        return (
          <g key={w.id}>
            <path
              d={wedgePath(cx, cy, w.innerRadius, w.outerRadius, w.startAngle, w.endAngle)}
              fill={fill}
              fillOpacity={dimmed ? 0.25 : isHighlighted ? 0.95 : 0.7}
              stroke={isFocused ? "#f2c6d4" : "rgba(0,0,0,0.4)"}
              strokeWidth={isFocused ? 1.5 : 0.6}
              style={{ cursor: w.genome ? "pointer" : "default", transition: "fill-opacity 120ms" }}
              onClick={() => {
                if (w.genome) onSelect(w.genome.sequenceId);
              }}
              onMouseEnter={() => {
                if (w.genome && onHover) onHover(w.genome.sequenceId);
              }}
              onMouseLeave={() => {
                if (onHover) onHover(null);
              }}
            />
            {w.genome ? (
              <WedgeCaption
                cx={cx}
                cy={cy}
                wedge={w}
                fontSize={Math.max(7, ringWidth * 0.18)}
              />
            ) : null}
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={centerRadius} fill={KINGDOM_COLOURS[ego.kingdom]} fillOpacity={0.85} stroke="rgba(255,255,255,0.4)" />
      <text x={cx} y={cy - 2} textAnchor="middle" fill="#1a1612" fontSize={11} fontFamily="ui-monospace, monospace" fontWeight={600}>
        {ego.kingdom}
      </text>
      <text x={cx} y={cy + 11} textAnchor="middle" fill="#1a1612" fontSize={8} fontFamily="ui-monospace, monospace">
        gen {ego.generation}
      </text>
    </svg>
  );
}

function WedgeCaption({
  cx,
  cy,
  wedge,
  fontSize,
}: {
  cx: number;
  cy: number;
  wedge: Wedge;
  fontSize: number;
}): React.JSX.Element | null {
  if (!wedge.genome) return null;
  const mid = (wedge.startAngle + wedge.endAngle) / 2;
  const r = (wedge.innerRadius + wedge.outerRadius) / 2;
  const [x, y] = polar(cx, cy, r, mid);
  const arcRoom = (wedge.endAngle - wedge.startAngle) * r;
  if (arcRoom < fontSize * 2.4) return null;
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      fill="rgba(20,16,14,0.85)"
      fontFamily="ui-monospace, monospace"
      fontSize={fontSize}
      pointerEvents="none"
    >
      {wedge.genome.kingdom.slice(0, 6)} g{wedge.genome.generation}
    </text>
  );
}
