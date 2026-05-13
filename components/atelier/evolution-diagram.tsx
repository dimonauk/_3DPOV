import {
  evolutionStations,
  stationKindColours,
  type EvolutionStation,
} from "lib/evolution/stations";

const W = 880;
const H = 540;
const NODE_R = 26;
const COLS = 5;

type Positioned = EvolutionStation & { x: number; y: number };

/**
 * Lay out the 14 stations in a hand-curated rough flow:
 *   row 0: S0
 *   row 1: S2, S5, S12          (breeding + crucible + studio entry)
 *   row 2: S4, S6N, S6F, S10    (fitness + narrative + forge + physics)
 *   row 3: S7, S14, S15         (archive + live + archive)
 *   row 4: S17, S18, S19        (hub + mosaic + gardener)
 *
 * Coordinates were derived to give the arrows a left-to-right
 * downstream feel without crossings.
 */
function layoutPositions(): Positioned[] {
  const rows: Record<string, [number, number]> = {
    S0: [W / 2, 60],
    S2: [W * 0.2, 160],
    S5: [W * 0.5, 160],
    S12: [W * 0.8, 160],
    S4: [W * 0.15, 270],
    S6N: [W * 0.4, 270],
    S6F: [W * 0.62, 270],
    S10: [W * 0.85, 270],
    S7: [W * 0.25, 380],
    S14: [W * 0.5, 380],
    S15: [W * 0.75, 380],
    S17: [W * 0.18, 480],
    S18: [W * 0.5, 480],
    S19: [W * 0.82, 480],
  };
  return evolutionStations.map((s) => {
    const fallback: [number, number] = [
      ((s.order % COLS) + 0.5) * (W / COLS),
      (Math.floor(s.order / COLS) + 1) * 100,
    ];
    const pos = rows[s.id] ?? fallback;
    return { ...s, x: pos[0], y: pos[1] };
  });
}

/**
 * Diagram of the 14-station evolution suite. SVG-only, no client
 * JavaScript &mdash; renders identically on server + client. Each
 * node is the station's id; colour signals the functional category;
 * arrows are the feedsInto edges. Hover labels live in the legend
 * below the SVG.
 */
export default function EvolutionDiagram() {
  const positioned = layoutPositions();
  const byId: Record<string, Positioned> = Object.fromEntries(
    positioned.map((p) => [p.id, p]),
  );

  return (
    <figure className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="The 14-station evolution suite as a directed graph"
      >
        <defs>
          <marker
            id="evo-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#cfd8dc" opacity="0.5" />
          </marker>
        </defs>

        {/* Edges first so they sit underneath nodes */}
        {positioned.map((node) =>
          node.feedsInto.map((targetId) => {
            const target = byId[targetId];
            if (!target) return null;
            const dx = target.x - node.x;
            const dy = target.y - node.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) return null;
            const ux = dx / len;
            const uy = dy / len;
            const x1 = node.x + ux * NODE_R;
            const y1 = node.y + uy * NODE_R;
            const x2 = target.x - ux * NODE_R;
            const y2 = target.y - uy * NODE_R;
            return (
              <line
                key={`${node.id}->${targetId}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#cfd8dc"
                strokeOpacity="0.3"
                strokeWidth="1"
                markerEnd="url(#evo-arrow)"
              />
            );
          }),
        )}

        {/* Nodes */}
        {positioned.map((node) => {
          const fill = stationKindColours[node.kind];
          return (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={NODE_R}
                fill="#0c0c0c"
                stroke={fill}
                strokeWidth="1.5"
              />
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fontSize="11"
                fontFamily="ui-monospace, monospace"
                fill="#cfd8dc"
              >
                {node.id}
              </text>
              <text
                x={node.x}
                y={node.y + NODE_R + 14}
                textAnchor="middle"
                fontSize="9"
                fontFamily="ui-sans-serif, system-ui"
                fill="#9aa0a6"
              >
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>

      <figcaption className="mt-4 flex flex-wrap gap-3 text-[0.65rem] text-chrome-400">
        {Object.entries(stationKindColours).map(([kind, color]) => (
          <span key={kind} className="flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <span className="uppercase tracking-[0.15em]">{kind}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
