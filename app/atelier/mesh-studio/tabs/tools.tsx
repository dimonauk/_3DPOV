import { BridgeOfflineNote } from "../widgets";
import type { SidecarStatus } from "../types";

export function ToolsTab({ status }: { status: SidecarStatus }) {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl text-chrome-100">Live tools registry</h2>
        <p className="mt-2 max-w-2xl text-sm text-chrome-400">
          Pulled from <code className="font-mono text-chrome-200">/tools</code> on the
          sidecar. Each entry is a one-button runner: feed it the image
          on the bench or pick a file, the sidecar runs the
          corresponding Python tool, the result lands as a download.
        </p>
      </header>
      <ToolRegistryPreview />
      {status.kind !== "online" ? (
        <BridgeOfflineNote
          what="tools registry"
          mount="/tools"
          extra="returns a JSON list of every Python tool the sidecar exposes"
        />
      ) : null}
    </div>
  );
}

function ToolRegistryPreview() {
  const preview: ReadonlyArray<{ id: string; name: string; what: string; endpoint: string }> = [
    { id: "lithophane", name: "Lithophane", what: "Image → relief STL", endpoint: "POST /lithophane" },
    { id: "image-segment-bg", name: "Background segment", what: "Image → alpha mask", endpoint: "POST /image-segment-bg" },
    { id: "image-extract-trails", name: "Light trails", what: "Image → trail polylines JSON", endpoint: "POST /image-extract-trails" },
    { id: "voxelize", name: "Voxelize mesh", what: "STL → voxel grid info JSON", endpoint: "POST /voxelize" },
    { id: "mesh-repair", name: "Repair mesh", what: "STL → watertight STL", endpoint: "POST /mesh-repair" },
    { id: "audio-beats", name: "Beat detect", what: "Audio → BPM + onsets JSON", endpoint: "POST /audio-beats" },
    { id: "raw-decode", name: "RAW decode", what: ".CR2/.NEF/.ARW → PNG", endpoint: "POST /raw-decode" },
  ];
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {preview.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/60 p-3"
        >
          <span className="h-2 w-2 flex-none rounded-full bg-chrome-500" />
          <div className="min-w-0 flex-1">
            <div className="text-sm text-chrome-100">{t.name}</div>
            <div className="mt-0.5 text-xs text-chrome-400">{t.what}</div>
            <div className="mt-1 truncate font-mono text-[10px] text-chrome-500">{t.endpoint}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
