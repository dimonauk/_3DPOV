/**
 * app/atelier/quilt-designer/quilt-designer/blocks.tsx — Public-domain
 * quilt-block canon. Each block is a function from
 * (primary, secondary, background) hex strings to an SVG fragment
 * drawn in a 1×1 box; the grid scales it.
 *
 * Extracted from quilt-designer-client.tsx per ARCHITECTURE.md
 * Rule 1. Adding a new block is one entry in this array.
 */

import type { Block } from "./types";

export const BLOCKS: ReadonlyArray<Block> = [
  {
    id: "solid",
    label: "Solid",
    render: (p) => <rect x={0} y={0} width={1} height={1} fill={p} />,
  },
  {
    id: "half-square-triangle",
    label: "Half-square triangle",
    render: (p, _s, b) => (
      <>
        <rect x={0} y={0} width={1} height={1} fill={b} />
        <polygon points="0,0 1,0 0,1" fill={p} />
      </>
    ),
  },
  {
    id: "quarter-square-triangle",
    label: "Quarter-square triangle",
    render: (p, s, b) => (
      <>
        <rect x={0} y={0} width={1} height={1} fill={b} />
        <polygon points="0,0 1,0 0.5,0.5" fill={p} />
        <polygon points="1,0 1,1 0.5,0.5" fill={s} />
        <polygon points="1,1 0,1 0.5,0.5" fill={p} />
        <polygon points="0,1 0,0 0.5,0.5" fill={s} />
      </>
    ),
  },
  {
    id: "pinwheel",
    label: "Pinwheel",
    render: (p, s, b) => (
      <>
        <rect x={0} y={0} width={1} height={1} fill={b} />
        <polygon points="0,0 0.5,0 0.5,0.5" fill={p} />
        <polygon points="1,0 1,0.5 0.5,0.5" fill={s} />
        <polygon points="1,1 0.5,1 0.5,0.5" fill={p} />
        <polygon points="0,1 0,0.5 0.5,0.5" fill={s} />
      </>
    ),
  },
  {
    id: "nine-patch",
    label: "Nine-patch",
    render: (p, s, b) => {
      // diagonal alternation across the 3×3.
      const cells: string[] = [
        p, s, p,
        s, p, s,
        p, s, p,
      ];
      void b;
      return (
        <>
          {cells.map((fill, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            return (
              <rect
                key={i}
                x={col / 3}
                y={row / 3}
                width={1 / 3}
                height={1 / 3}
                fill={fill}
              />
            );
          })}
        </>
      );
    },
  },
  {
    id: "rail-fence",
    label: "Rail fence",
    render: (p, s, b) => (
      <>
        <rect x={0} y={0} width={1} height={1 / 3} fill={p} />
        <rect x={0} y={1 / 3} width={1} height={1 / 3} fill={s} />
        <rect x={0} y={2 / 3} width={1} height={1 / 3} fill={b} />
      </>
    ),
  },
  {
    id: "log-cabin",
    label: "Log cabin",
    render: (p, s, b) => (
      <>
        <rect x={0} y={0} width={1} height={1} fill={b} />
        {/* expanding concentric rings, alternating warm / cool */}
        <rect x={0.15} y={0.15} width={0.7} height={0.7} fill={s} />
        <rect x={0.25} y={0.25} width={0.5} height={0.5} fill={p} />
        <rect x={0.35} y={0.35} width={0.3} height={0.3} fill={s} />
        <rect x={0.42} y={0.42} width={0.16} height={0.16} fill={p} />
      </>
    ),
  },
  {
    id: "churn-dash",
    label: "Churn dash",
    render: (p, s, b) => {
      const t = 1 / 3;
      const e = 1 / 6;
      return (
        <>
          <rect x={0} y={0} width={1} height={1} fill={b} />
          {/* four corner half-square triangles */}
          <polygon points={`0,0 ${t},0 0,${t}`} fill={p} />
          <polygon points={`${1 - t},0 1,0 1,${t}`} fill={p} />
          <polygon points={`0,${1 - t} 0,1 ${t},1`} fill={p} />
          <polygon points={`1,${1 - t} 1,1 ${1 - t},1`} fill={p} />
          {/* four edge bars */}
          <rect x={t} y={0} width={t} height={e} fill={s} />
          <rect x={t} y={1 - e} width={t} height={e} fill={s} />
          <rect x={0} y={t} width={e} height={t} fill={s} />
          <rect x={1 - e} y={t} width={e} height={t} fill={s} />
          {/* centre square */}
          <rect x={t} y={t} width={t} height={t} fill={p} />
        </>
      );
    },
  },
  {
    id: "flying-geese",
    label: "Flying geese",
    render: (p, s, b) => {
      const t = 1 / 3;
      const tt = 2 / 3;
      return (
        <>
          <rect x={0} y={0} width={1} height={1} fill={b} />
          {/* three stacked triangles, each pointing up */}
          <polygon points={`0,${t} 1,${t} 0.5,0`} fill={p} />
          <polygon points={`0,${tt} 1,${tt} 0.5,${t}`} fill={s} />
          <polygon points={`0,1 1,1 0.5,${tt}`} fill={p} />
        </>
      );
    },
  },
  {
    id: "bears-paw",
    label: "Bear's paw",
    render: (p, s, b) => (
      <>
        <rect x={0} y={0} width={1} height={1} fill={b} />
        {/* simplified: big paw pad + four claws */}
        <rect x={0.18} y={0.18} width={0.5} height={0.5} fill={p} />
        <polygon points="0.05,0.05 0.25,0.05 0.05,0.25" fill={s} />
        <polygon points="0.4,0.05 0.6,0.05 0.6,0.25" fill={s} />
        <polygon points="0.05,0.4 0.05,0.6 0.25,0.6" fill={s} />
        <polygon points="0.78,0.78 0.95,0.78 0.95,0.95" fill={s} />
      </>
    ),
  },
];

export const BLOCKS_BY_ID = new Map(BLOCKS.map((b) => [b.id, b]));
