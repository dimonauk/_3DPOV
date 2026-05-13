import Link from "next/link";
import { LONDON_BOUNDS } from "lib/neo-london/zones";
import type { SplatStatus, SplatZone } from "lib/neo-london/types";

/**
 * London map &mdash; option (c): a stylised SVG of the Thames + the
 * three canal/river spines named in /articles/london-360-walking
 * (Regent&rsquo;s Canal, Limehouse Cut, River Lea). No external
 * tile dependency, no fonts, no images. Reads as a sketch rather
 * than a map, which is the point at this stage.
 *
 * The pins are absolute-positioned by linear interpolation of each
 * zone&rsquo;s lat/lng against LONDON_BOUNDS. SVG drawing space is
 * 0 0 1000 700; longitude maps to x, latitude maps to y (flipped
 * because north should be up).
 *
 * The river path is hand-traced &mdash; rough, not OS-data accurate.
 * Enough to read as the Thames if you have ever walked it.
 */

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 700;

function lngToX(lng: number): number {
  const t =
    (lng - LONDON_BOUNDS.lngMin) /
    (LONDON_BOUNDS.lngMax - LONDON_BOUNDS.lngMin);
  return t * VIEWBOX_WIDTH;
}

function latToY(lat: number): number {
  // North up, so larger latitude is smaller y.
  const t =
    (lat - LONDON_BOUNDS.latMin) /
    (LONDON_BOUNDS.latMax - LONDON_BOUNDS.latMin);
  return (1 - t) * VIEWBOX_HEIGHT;
}

const PIN_STYLE: Record<SplatStatus, { fill: string; stroke: string; r: number }> = {
  placeholder: { fill: "#3a3a4a", stroke: "#7a7a8a", r: 5 },
  "frame-captured": { fill: "#7a7a8a", stroke: "#cccccc", r: 6 },
  "splat-rendered": { fill: "#fbcfe8", stroke: "#fff", r: 7 },
  "mesh-added": { fill: "#ffd700", stroke: "#fff", r: 7 },
  playable: { fill: "#00f3ff", stroke: "#fff", r: 8 },
};

/**
 * Approximate Thames path through Greater London &mdash; a single
 * SVG path traced from a reference map, not survey data. Reads west
 * to east. Tuned to LONDON_BOUNDS so it sits inside the viewBox.
 */
const THAMES_PATH =
  "M 60 360 " +
  "C 120 380, 180 360, 230 410 " +
  "C 280 450, 320 420, 360 450 " +
  "C 400 480, 430 440, 470 460 " +
  "C 500 475, 520 420, 555 415 " +
  "C 590 410, 615 460, 650 460 " +
  "C 700 460, 720 420, 740 440 " +
  "C 770 470, 800 510, 850 510 " +
  "C 900 510, 940 470, 985 480";

/**
 * Regent&rsquo;s Canal &mdash; Paddington Basin out through Camden
 * Lock, down past Mile End to Limehouse. Hand-traced.
 */
const REGENTS_CANAL_PATH =
  "M 305 330 " +
  "C 330 300, 360 270, 410 260 " +
  "C 460 255, 510 285, 560 295 " +
  "C 610 305, 650 325, 690 360 " +
  "C 720 385, 730 415, 735 445";

/**
 * Limehouse Cut &mdash; from the Lower Lea Crossing/Bow Locks
 * northeast corner to Limehouse Basin at the Thames. Short
 * diagonal.
 */
const LIMEHOUSE_CUT_PATH = "M 760 320 L 735 445";

/**
 * River Lea &mdash; from north of Hackney Marshes down to the Bow
 * confluence with the Thames at Bow Creek.
 */
const LEA_PATH =
  "M 720 160 " +
  "C 730 200, 740 250, 755 295 " +
  "C 762 315, 765 320, 760 320 " +
  "L 745 435";

export function LondonMap({ zones }: { zones: SplatZone[] }) {
  return (
    <div className="relative rounded-sm border border-warm-black-800 bg-[#0c0a12] p-2">
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        xmlns="http://www.w3.org/2000/svg"
        className="block h-auto w-full"
        role="img"
        aria-label="Stylised map of London showing splat zones along the Thames and the canal spines"
      >
        <defs>
          <pattern
            id="neo-london-grid"
            x={0}
            y={0}
            width={50}
            height={50}
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="#1a1530"
              strokeWidth={0.6}
            />
          </pattern>
          <radialGradient id="neo-london-glow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#10121e" />
            <stop offset="100%" stopColor="#0c0a12" />
          </radialGradient>
        </defs>

        {/* Backdrop &mdash; deep midnight with a faint grid overlay */}
        <rect
          x={0}
          y={0}
          width={VIEWBOX_WIDTH}
          height={VIEWBOX_HEIGHT}
          fill="url(#neo-london-glow)"
        />
        <rect
          x={0}
          y={0}
          width={VIEWBOX_WIDTH}
          height={VIEWBOX_HEIGHT}
          fill="url(#neo-london-grid)"
        />

        {/* Thames &mdash; the spine. Painted twice for a glow halo. */}
        <path
          d={THAMES_PATH}
          fill="none"
          stroke="#00f3ff"
          strokeWidth={9}
          strokeLinecap="round"
          opacity={0.18}
        />
        <path
          d={THAMES_PATH}
          fill="none"
          stroke="#00f3ff"
          strokeWidth={2.2}
          strokeLinecap="round"
          opacity={0.85}
        />

        {/* The three canal/river spines named in the walking article */}
        <g opacity={0.85}>
          <path
            d={REGENTS_CANAL_PATH}
            fill="none"
            stroke="#fbcfe8"
            strokeWidth={1.6}
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
          <path
            d={LIMEHOUSE_CUT_PATH}
            fill="none"
            stroke="#fbcfe8"
            strokeWidth={1.6}
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
          <path
            d={LEA_PATH}
            fill="none"
            stroke="#fbcfe8"
            strokeWidth={1.6}
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
        </g>

        {/* Canal labels &mdash; tiny, monospace-styled */}
        <text
          x={415}
          y={252}
          fill="#fbcfe8"
          fontSize={10}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          opacity={0.75}
          letterSpacing={1.5}
        >
          REGENT&apos;S CANAL
        </text>
        <text
          x={773}
          y={380}
          fill="#fbcfe8"
          fontSize={10}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          opacity={0.75}
          letterSpacing={1.5}
        >
          LIMEHOUSE CUT
        </text>
        <text
          x={730}
          y={150}
          fill="#fbcfe8"
          fontSize={10}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          opacity={0.75}
          letterSpacing={1.5}
        >
          RIVER LEA
        </text>
        <text
          x={60}
          y={350}
          fill="#00f3ff"
          fontSize={11}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          opacity={0.85}
          letterSpacing={2}
        >
          THAMES
        </text>

        {/* Compass + scale &mdash; functional decoration */}
        <g transform="translate(40, 40)" opacity={0.6}>
          <circle cx={0} cy={0} r={14} fill="none" stroke="#7a7a8a" strokeWidth={0.8} />
          <path d="M 0 -10 L 3 0 L 0 10 L -3 0 Z" fill="#cccccc" />
          <text
            x={0}
            y={-18}
            fill="#cccccc"
            fontSize={8}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
            letterSpacing={1.2}
          >
            N
          </text>
        </g>

        {/* Zone pins */}
        {zones.map((zone) => {
          const x = lngToX(zone.lng);
          const y = latToY(zone.lat);
          const style = PIN_STYLE[zone.status];
          return (
            <Link
              key={zone.slug}
              href={`/play/neo-london/zone/${zone.slug}`}
              aria-label={`${zone.name} — status ${zone.status}`}
            >
              <g className="cursor-pointer">
                {/* Hover halo &mdash; revealed via CSS group-hover */}
                <circle
                  cx={x}
                  cy={y}
                  r={style.r + 10}
                  fill={style.fill}
                  opacity={0}
                  className="transition-opacity hover:opacity-25"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={style.r}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={1.2}
                  className="transition-transform"
                />
                <title>
                  {zone.name} &mdash; {zone.status}
                </title>
              </g>
            </Link>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 px-2 pb-1 text-[0.7rem] text-chrome-400">
        <span className="chrome-label text-chrome-500">Pin states</span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: PIN_STYLE.placeholder.fill }}
          />
          placeholder
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: PIN_STYLE["frame-captured"].fill }}
          />
          frame captured
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: PIN_STYLE["splat-rendered"].fill }}
          />
          splat rendered
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: PIN_STYLE["mesh-added"].fill }}
          />
          mesh added
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: PIN_STYLE.playable.fill }}
          />
          playable
        </span>
      </div>
    </div>
  );
}
