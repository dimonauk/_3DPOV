import { BridgeOfflineNote } from "../widgets";
import type { SidecarStatus } from "../types";

export function CapturesTab({ status }: { status: SidecarStatus }) {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl text-chrome-100">Recent captures</h2>
        <p className="mt-2 max-w-2xl text-sm text-chrome-400">
          The bench keeps a flat directory of recent image / RAW shoots
          at <code className="font-mono text-chrome-200">D:\HoloFlow\projects</code>.
          When the sidecar is online this tab lists the newest 100 with
          size + modified-time + a click-through.
        </p>
      </header>
      {status.kind !== "online" ? (
        <BridgeOfflineNote
          what="captures listing"
          mount="/captures"
          extra="walks the captures dir and returns name/size/mtime"
        />
      ) : (
        <p className="text-xs text-chrome-400">
          The captures listing is wired up server-side; UI grid lands in a follow-up.
        </p>
      )}
    </div>
  );
}
