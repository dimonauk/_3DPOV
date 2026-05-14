import Link from "next/link";

import type { SplatZone } from "lib/neo-london/types";

import { LondonMapLegend } from "./london-map-legend";
import {
  LEA_PATH,
  LIMEHOUSE_CUT_PATH,
  PIN_STYLE,
  REGENTS_CANAL_PATH,
  THAMES_PATH,
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
  latToY,
  lngToX,
} from "./london-map-paths";

/**
 * London map — option (c): a stylised SVG of the Thames + the three
 * canal/river spines named in /articles/london-360-walking (Regent's
 * Canal, Limehouse Cut, River Lea). No external tile dependency, no
 * fonts, no images. Reads as a sketch rather than a map, which is the
 * point at this stage.
 *
 * The pins are absolute-positioned by linear interpolation of each
 * zone's lat/lng against LONDON_BOUNDS. SVG drawing space is
 * 0 0 1000 700; longitude maps to x, latitude maps to y (flipped
 * because north should be up).
 *
 * Pure path data + projection helpers live in `./london-map-paths`;
 * the pin-state legend in `./london-map-legend`.
 */

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

        {/* Backdrop — deep midnight with a faint grid overlay */}
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

        {/* Thames — the spine. Painted twice for a glow halo. */}
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

        {/* Canal labels */}
        <text x={415} y={252} fill="#fbcfe8" fontSize={10} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" opacity={0.75} letterSpacing={1.5}>
          REGENT&apos;S CANAL
        </text>
        <text x={773} y={380} fill="#fbcfe8" fontSize={10} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" opacity={0.75} letterSpacing={1.5}>
          LIMEHOUSE CUT
        </text>
        <text x={730} y={150} fill="#fbcfe8" fontSize={10} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" opacity={0.75} letterSpacing={1.5}>
          RIVER LEA
        </text>
        <text x={60} y={350} fill="#00f3ff" fontSize={11} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" opacity={0.85} letterSpacing={2}>
          THAMES
        </text>

        {/* Compass — functional decoration */}
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

      <LondonMapLegend />
    </div>
  );
}
