"use client";

/**
 * app/atelier/webxr-retroarch/retroarch-client.tsx — Client shell for
 * the WebXR RetroArch room. Owns the ROM file-picker state, mounts
 * <SceneStage webxr> with <RetroArchRoom> inside, stitches the
 * EmulatorHost canvas to the room via a ref-bound bridge.
 *
 * Flow:
 *   1. Visitor picks a system from the toolbar (default: SNES)
 *   2. Visitor picks a ROM (and BIOS if required)
 *   3. Visitor hits Boot → EmulatorHost mounts hidden, EmulatorJS
 *      boots, the canvas appears, onCanvasReady fires
 *   4. RetroArchRoom wraps the canvas in a CanvasTexture and paints
 *      the TV's screen plane with it
 *   5. Visitor enters VR via the SceneStage toolbar pill; XR
 *      controllers route into EmulatorJS via the input bridge
 */

import { useEffect, useState } from "react";

import { SYSTEMS, getSystem } from "lib/emulator/systems";
import type { EmulatorSystem } from "lib/emulator/systems";
import { SceneStage } from "components/xr-scene/SceneStage";

import EmulatorHost from "components/webxr-retroarch/EmulatorHost";
import { RetroArchRoom } from "components/webxr-retroarch/RetroArchRoom";
import { RetroArchToolbar } from "components/webxr-retroarch/RetroArchToolbar";

export type RetroArchClientProps = {
  /** Optional default system slug — used by the per-system entry route. */
  defaultSystemSlug?: string;
};

export default function RetroArchClient({
  defaultSystemSlug,
}: RetroArchClientProps) {
  const [system, setSystem] = useState<EmulatorSystem>(() => {
    // SYSTEMS[1] is the SNES fallback. noUncheckedIndexedAccess gives
    // `EmulatorSystem | undefined`; assert non-undefined since SYSTEMS
    // is a module-level const with > 1 entry.
    const fallback = SYSTEMS[1] as EmulatorSystem;
    if (defaultSystemSlug) {
      const found = getSystem(defaultSystemSlug);
      if (found) return found;
    }
    return fallback;
  });
  const [romUrl, setRomUrl] = useState<string | null>(null);
  const [romName, setRomName] = useState<string>("");
  const [biosUrl, setBiosUrl] = useState<string | null>(null);
  const [biosName, setBiosName] = useState<string>("");
  const [booted, setBooted] = useState(false);
  const [emulatorCanvas, setEmulatorCanvas] =
    useState<HTMLCanvasElement | null>(null);

  // Revoke object URLs on unmount + on swap. Browsers don't garbage-
  // collect blob URLs and a long session will leak ROM bytes if we
  // don't.
  useEffect(() => {
    return () => {
      if (romUrl) URL.revokeObjectURL(romUrl);
      if (biosUrl) URL.revokeObjectURL(biosUrl);
    };
  }, [romUrl, biosUrl]);

  const onPickRom = (file: File | undefined) => {
    if (!file) return;
    if (romUrl) URL.revokeObjectURL(romUrl);
    const url = URL.createObjectURL(file);
    setRomUrl(url);
    setRomName(file.name);
  };

  const onPickBios = (file: File | undefined) => {
    if (!file) return;
    if (biosUrl) URL.revokeObjectURL(biosUrl);
    const url = URL.createObjectURL(file);
    setBiosUrl(url);
    setBiosName(file.name);
  };

  const onSystemChange = (next: EmulatorSystem) => {
    if (booted) return; // EmulatorJS doesn't expose a clean teardown
    setSystem(next);
    if (romUrl) URL.revokeObjectURL(romUrl);
    if (biosUrl) URL.revokeObjectURL(biosUrl);
    setRomUrl(null);
    setRomName("");
    setBiosUrl(null);
    setBiosName("");
  };

  const canBoot =
    !!romUrl && (!system.biosRequired || !!biosUrl) && !booted;

  const onBoot = () => {
    if (!canBoot) return;
    setBooted(true);
  };

  return (
    <div className="space-y-5">
      <RetroArchToolbar
        system={system}
        onSystemChange={onSystemChange}
        romName={romName || null}
        onPickRom={onPickRom}
        biosName={biosName || null}
        onPickBios={onPickBios}
        booted={booted}
        canBoot={canBoot}
        onBoot={onBoot}
      />

      <SceneStage
        label={`WebXR RetroArch · ${system.label}`}
        webxr
        height="72vh"
        background="#0a0810"
        camera={{ position: [0, 1.6, 0.1], target: [0, 1.0, -2], fov: 60 }}
      >
        <RetroArchRoom
          systemSlug={system.slug}
          emulatorCanvas={emulatorCanvas}
        />
      </SceneStage>

      {booted && romUrl ? (
        <EmulatorHost
          system={system}
          romUrl={romUrl}
          romName={romName}
          biosUrl={biosUrl ?? undefined}
          onCanvasReady={(canvas) => setEmulatorCanvas(canvas)}
        />
      ) : null}
    </div>
  );
}
