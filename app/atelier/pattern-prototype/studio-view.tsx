"use client";

/**
 * app/atelier/pattern-prototype/studio-view.tsx — Mannequin + outfit
 * SVG render that fronts the editorial / playroom / archive modes.
 * Container chrome (rounded card, sepia wash, dashed pattern overlay
 * for playroom, "Plate No. 420" archive tag) shifts per mode.
 *
 * Extracted from pattern-prototype-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import type { AppMode, OutfitState } from "./types";

export function StudioView({
  outfit,
  mode,
}: {
  outfit: OutfitState;
  mode: AppMode;
}) {
  const isPlayroom = mode === "playroom";
  const isEditorial = mode === "editorial";
  const isArchive = mode === "archive";

  const containerClass = isPlayroom
    ? "bg-white rounded-[3rem] border-[14px] border-rose-50/50 p-10 shadow-[inset_0_4px_40px_rgba(0,0,0,0.05)]"
    : isEditorial
      ? "bg-white rounded-3xl p-6 shadow-[0_30px_80px_-20px_rgba(251,113,133,0.3)]"
      : "bg-[#f4ebe0] rounded-lg grayscale-[0.2] sepia-[0.3] brightness-[0.9] contrast-[1.1]";

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden transition-all duration-1000 ${containerClass}`}
    >
      <div
        className={`relative flex h-[480px] w-[480px] items-center justify-center transition-transform duration-1000 ${
          isArchive ? "rotate-[-1deg] scale-90" : "scale-105"
        }`}
      >
        <svg
          className="absolute h-full w-full drop-shadow-2xl"
          viewBox="0 0 100 100"
        >
          {/* Mannequin */}
          <path
            d="M50,15 C45,15 42,20 42,25 C42,28 44,30 46,31 L46,35 Q40,40 38,55 L38,85 Q50,90 62,85 L62,55 Q60,40 54,35 L54,31 C56,30 58,28 58,25 C58,20 55,15 50,15"
            fill={isArchive ? "#eaddca" : isEditorial ? "#fffcf9" : "#fff7ed"}
            stroke={isArchive ? "#8b4513" : "#fecdd3"}
            strokeWidth={isArchive ? "0.3" : "0.5"}
          />
          {/* Blouse */}
          <path
            d="M32,22 L68,22 L72,55 L28,55 Z"
            fill="#fffcf2"
            stroke="#fda4af"
            strokeWidth="0.5"
          />
          {/* Bottom */}
          {outfit.bottom === "circle_skirt" ? (
            <path
              d="M25,45 Q50,40 75,45 L85,85 Q50,95 15,85 Z"
              fill={outfit.color}
              stroke="#be123c"
              strokeWidth="0.5"
            />
          ) : outfit.bottom === "pencil_skirt" ? (
            <path
              d="M30,45 L70,45 L72,85 L28,85 Z"
              fill={outfit.color}
              stroke="#be123c"
              strokeWidth="0.5"
            />
          ) : outfit.bottom === "pleated" ? (
            <path
              d="M28,45 L72,45 L78,85 L22,85 Z M40,46 L40,85 M50,46 L50,85 M60,46 L60,85"
              fill={outfit.color}
              stroke="#be123c"
              strokeWidth="0.5"
            />
          ) : null}
          {/* Jacket */}
          <path
            d="M30,22 Q50,18 70,22 L75,48 Q50,42 25,48 Z"
            fill={outfit.color}
            stroke="#be123c"
            strokeWidth="0.5"
          />
          {outfit.accessories.includes("pearls") ? (
            <g fill="#fefce8" stroke="#e2e8f0" strokeWidth="0.05">
              {[38, 42, 46, 50, 54, 58, 62].map((x, i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={28 + Math.sin(i * 0.8) * 1.5}
                  r="1.2"
                />
              ))}
            </g>
          ) : null}
          {outfit.accessories.includes("bonnet") ? (
            <path
              d="M35,10 Q50,0 65,10 L75,25 Q50,15 25,25 Z"
              fill={outfit.color}
              stroke="#be123c"
              strokeWidth="0.5"
            />
          ) : null}
          {outfit.accessories.includes("bow") ? (
            <path
              d="M42,52 L58,52 L62,65 L38,65 Z"
              fill={outfit.color}
              stroke="#be123c"
              strokeWidth="0.3"
            />
          ) : null}
        </svg>

        {isPlayroom ? (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
            viewBox="0 0 100 100"
          >
            <rect
              x="2"
              y="2"
              width="96"
              height="96"
              fill="none"
              stroke="#4c1d95"
              strokeWidth="0.2"
              strokeDasharray="1,1"
              rx="10"
            />
            <text
              x="4"
              y="6"
              fontSize="2"
              fill="#4c1d95"
              className="font-mono opacity-50"
            >
              CUT HERE (1:1 SCALE)
            </text>
          </svg>
        ) : null}

        {isArchive ? (
          <div className="absolute right-0 top-0 m-6 flex flex-col items-end border border-rose-900/20 bg-white/50 p-3">
            <span className="text-[10px] font-black uppercase tracking-tighter opacity-50">
              Plate No. 420
            </span>
            <span
              className="text-lg italic text-rose-900"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Sears Tween Dream
            </span>
          </div>
        ) : null}
      </div>

      <div className="absolute bottom-8 right-8 text-right opacity-40">
        <span
          className="text-2xl italic text-rose-900"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {isEditorial
            ? "La Parisienne"
            : isPlayroom
              ? "Little Dolly"
              : "Vintage Engraving"}
        </span>
      </div>
    </div>
  );
}
