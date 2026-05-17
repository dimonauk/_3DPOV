import { createLogger } from "lib/log";

import { PIXELORAMA_EXTENSIONS_PREVIEW } from "../inventory-data";
import { BridgeOfflineNote, StatCard } from "../widgets";
import type { SidecarStatus } from "../types";

const log = createLogger("atelier:mesh-studio:palette");

export function PaletteTab({ status }: { status: SidecarStatus }) {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h2 className="text-2xl text-chrome-100">Pixelorama bridge</h2>
        <p className="mt-2 max-w-2xl text-sm text-chrome-400">
          Send sprites from the studio into Pixelorama for touch-ups,
          send them through Voxelorama for layered-pixel-to-mesh, pick
          up the resulting .obj on the way back. The bridge watches two
          folders &mdash; one outgoing (sprites pending), one incoming
          (exports waiting).
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatCard label="Installed" value={status.kind === "online" ? "yes" : "—"} accent={status.kind === "online" ? "good" : undefined} />
        <StatCard label="Extensions" value={String(PIXELORAMA_EXTENSIONS_PREVIEW.length) + "+"} />
        <StatCard label="Sprites pending" value="—" />
        <StatCard label="Exports waiting" value="—" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={status.kind !== "online"}
          onClick={() => log.info("pixelorama launch requested")}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20 disabled:opacity-40"
        >
          ▶ Launch Pixelorama
        </button>
        <button
          type="button"
          disabled={status.kind !== "online"}
          onClick={() => log.info("send sprite requested")}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20 disabled:opacity-40"
        >
          ↗ Send current sprite
        </button>
      </div>

      <section>
        <h3 className="chrome-label mb-3 border-b border-warm-black-800 pb-2 text-chrome-400">
          Featured extensions
        </h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {PIXELORAMA_EXTENSIONS_PREVIEW.map((x) => (
            <div
              key={x.id}
              className={`rounded-sm border p-3 ${
                x.featured
                  ? "border-pink-200/40 bg-pink-200/5"
                  : "border-warm-black-800 bg-warm-black-900/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm ${x.featured ? "text-pink-100" : "text-chrome-100"}`}
                >
                  {x.id}
                </span>
                <span className="ml-auto rounded-sm border border-warm-black-700 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-chrome-500">
                  {x.category}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-chrome-400">{x.what}</p>
            </div>
          ))}
        </div>
      </section>

      {status.kind !== "online" ? (
        <BridgeOfflineNote
          what="pixelorama bridge"
          mount="/pixelorama"
          extra="bench-side path: pixelorama_bridge.py mounted in main.py"
        />
      ) : null}
    </div>
  );
}
