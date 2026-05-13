"use client";

import { useMemo } from "react";

import {
  chronoModes,
  type ChronoMode,
  type ChronoModeSlug,
  wheelOrder,
} from "lib/chrono-protocol";

/**
 * The 5-mode wheel as a clickable SVG.
 *
 * Renders 5 nodes around a circle (one per mode in wheelOrder), draws
 * ally edges between every adjacent pair (the wheel sides), and draws
 * enemy edges as crossing chords across the centre. The current mode
 * gets a bright halo; non-current modes fade.
 *
 * SVG was chosen over an R3F mount: this is a UI element, not a 3D
 * sculpture. SSR-clean, accessible, scales without canvas friction.
 *
 * The component is presentational — the parent owns the active mode
 * and the click handler. The chrono-protocol/run page wires it to the
 * gameplay state machine; the chrono-protocol/page.tsx wires it to a
 * local-state demo that lets the visitor try the switching feel.
 */

export type ModeWheelProps = {
  currentMode: ChronoModeSlug;
  onModeSelect?: (slug: ChronoModeSlug) => void;
  /** Pixel diameter of the wheel. */
  size?: number;
  /** Whether to draw the enemy edges. Defaults true. */
  showEnemyEdges?: boolean;
  /** Whether the wheel is interactive. Defaults true. */
  interactive?: boolean;
};

type NodeLayout = {
  mode: ChronoMode;
  cx: number;
  cy: number;
  /** Index in wheelOrder, 0..4. */
  index: number;
};

function computeNodes(size: number): NodeLayout[] {
  const cx0 = size / 2;
  const cy0 = size / 2;
  const radius = size / 2 - size * 0.13;
  const nodes: NodeLayout[] = [];
  const count = wheelOrder.length;
  for (let i = 0; i < count; i++) {
    const slug = wheelOrder[i];
    if (!slug) continue;
    const mode = chronoModes.find((m) => m.slug === slug);
    if (!mode) continue;
    // Start at the top (12 o'clock), go clockwise.
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / count;
    nodes.push({
      mode,
      cx: cx0 + Math.cos(angle) * radius,
      cy: cy0 + Math.sin(angle) * radius,
      index: i,
    });
  }
  return nodes;
}

export function ModeWheel({
  currentMode,
  onModeSelect,
  size = 280,
  showEnemyEdges = true,
  interactive = true,
}: ModeWheelProps) {
  const nodes = useMemo(() => computeNodes(size), [size]);
  const center = { x: size / 2, y: size / 2 };
  const nodeRadius = size * 0.08;

  // Ally edges: connect every adjacent pair in wheelOrder (and wrap).
  const allyEdges = useMemo(() => {
    const out: Array<{ a: NodeLayout; b: NodeLayout }> = [];
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const b = nodes[(i + 1) % nodes.length];
      if (a && b) out.push({ a, b });
    }
    return out;
  }, [nodes]);

  // Enemy edges: connect every pair distance 2 (i.e. one apart from
  // adjacent), wrap-aware. With 5 nodes that yields the 5 chords of
  // the pentagram — the classic MTG-pie enemy pattern.
  const enemyEdges = useMemo(() => {
    const out: Array<{ a: NodeLayout; b: NodeLayout }> = [];
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const b = nodes[(i + 2) % nodes.length];
      if (a && b) out.push({ a, b });
    }
    return out;
  }, [nodes]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="group"
      aria-label="Chrono-Protocol mode wheel"
      className="select-none"
    >
      <defs>
        <radialGradient id="cp-wheel-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a1322" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0c0a12" stopOpacity="1" />
        </radialGradient>
      </defs>

      <circle
        cx={center.x}
        cy={center.y}
        r={size / 2 - 2}
        fill="url(#cp-wheel-bg)"
        stroke="#2a2238"
        strokeWidth={1}
      />

      {showEnemyEdges
        ? enemyEdges.map((edge, i) => (
            <line
              key={`enemy-${i}`}
              x1={edge.a.cx}
              y1={edge.a.cy}
              x2={edge.b.cx}
              y2={edge.b.cy}
              stroke="#3a2030"
              strokeOpacity={0.6}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ))
        : null}

      {allyEdges.map((edge, i) => (
        <line
          key={`ally-${i}`}
          x1={edge.a.cx}
          y1={edge.a.cy}
          x2={edge.b.cx}
          y2={edge.b.cy}
          stroke="#5a4a78"
          strokeOpacity={0.6}
          strokeWidth={1.5}
        />
      ))}

      {nodes.map((node) => {
        const active = node.mode.slug === currentMode;
        const handleClick =
          interactive && onModeSelect
            ? () => onModeSelect(node.mode.slug)
            : undefined;
        return (
          <g
            key={node.mode.slug}
            onClick={handleClick}
            style={{ cursor: interactive ? "pointer" : "default" }}
          >
            {active ? (
              <circle
                cx={node.cx}
                cy={node.cy}
                r={nodeRadius + 8}
                fill="none"
                stroke={node.mode.hexColor}
                strokeOpacity={0.6}
                strokeWidth={2}
              />
            ) : null}
            <circle
              cx={node.cx}
              cy={node.cy}
              r={nodeRadius}
              fill={node.mode.hexColor}
              fillOpacity={active ? 0.85 : 0.35}
              stroke={node.mode.hexColor}
              strokeWidth={active ? 2 : 1}
            />
            <text
              x={node.cx}
              y={node.cy + 3}
              textAnchor="middle"
              fontSize={nodeRadius * 0.7}
              fontFamily="var(--font-mono, monospace)"
              fontWeight={700}
              fill={active ? "#0c0a12" : "#0c0a12"}
              fillOpacity={active ? 1 : 0.7}
            >
              {node.mode.name.slice(0, 2)}
            </text>
          </g>
        );
      })}

      <circle
        cx={center.x}
        cy={center.y}
        r={3}
        fill="#5a4a78"
        fillOpacity={0.5}
      />
    </svg>
  );
}
