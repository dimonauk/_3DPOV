import { BridgeOfflineNote } from "../widgets";
import type { SidecarStatus } from "../types";

const FIRMWARE_PROJECTS: ReadonlyArray<{ name: string; what: string }> = [
  { name: "ImagePainting", what: "BMP → POV LED stick firmware" },
  { name: "Lightpainter2", what: "POV light painting firmware (v2)" },
  { name: "pov-library", what: "POV core library" },
  { name: "light-stick", what: "Generic light stick firmware" },
  { name: "LumiFur_Controller", what: "Drone LED controller" },
];

export function FirmwareTab({ status }: { status: SidecarStatus }) {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl text-chrome-100">POV firmware shelves</h2>
        <p className="mt-2 max-w-2xl text-sm text-chrome-400">
          The bench tracks five firmware projects for POV light wands +
          drone LEDs. Each entry is a folder under{" "}
          <code className="font-mono text-chrome-200">firmware/drone_pov/</code> with
          flags for Arduino, PlatformIO, and README presence so you can
          tell at a glance which build chain is wired.
        </p>
      </header>
      <ul className="grid grid-cols-1 gap-2">
        {FIRMWARE_PROJECTS.map((f) => (
          <li
            key={f.name}
            className="rounded-sm border border-warm-black-800 bg-warm-black-900/60 p-3"
          >
            <div className="text-sm text-chrome-100">{f.name}</div>
            <div className="mt-0.5 text-xs text-chrome-400">{f.what}</div>
          </li>
        ))}
      </ul>
      {status.kind !== "online" ? (
        <BridgeOfflineNote
          what="firmware listing"
          mount="/firmware"
          extra="walks firmware/drone_pov/ and reports build-chain flags"
        />
      ) : null}
    </div>
  );
}
