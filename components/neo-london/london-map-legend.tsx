/**
 * components/neo-london/london-map-legend.tsx — Pin-state legend.
 *
 * Five swatches: placeholder, frame-captured, splat-rendered, mesh-added,
 * playable. Pure presentation; pulls colours from PIN_STYLE so the
 * legend stays in sync with the map.
 */

import { PIN_STYLE } from "./london-map-paths";

type Item = {
  status: keyof typeof PIN_STYLE;
  label: string;
};

const ITEMS: Item[] = [
  { status: "placeholder", label: "placeholder" },
  { status: "frame-captured", label: "frame captured" },
  { status: "splat-rendered", label: "splat rendered" },
  { status: "mesh-added", label: "mesh added" },
  { status: "playable", label: "playable" },
];

export function LondonMapLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 px-2 pb-1 text-[0.7rem] text-chrome-400">
      <span className="chrome-label text-chrome-500">Pin states</span>
      {ITEMS.map(({ status, label }) => (
        <span key={status} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: PIN_STYLE[status].fill }}
          />
          {label}
        </span>
      ))}
    </div>
  );
}
