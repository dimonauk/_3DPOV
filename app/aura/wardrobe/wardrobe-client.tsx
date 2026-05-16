"use client";

/**
 * app/aura/wardrobe/wardrobe-client.tsx — Client for /aura/wardrobe.
 *
 * One-line role: mount the rig, accept .vrm file drops, swap outfit
 * textures via the vrm.wardrobe.swap capability.
 * Full purpose in wardrobe-client.PURPOSE.md.
 */

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCallback, useEffect, useState } from "react";

import { VRMAvatar } from "components/three/VRMAvatar";
import { setNamedPose } from "lib/capabilities/vrm/pose";
import { startIdle, stopIdle } from "lib/capabilities/motion/idle";
import { swapOutfit } from "lib/capabilities/vrm/wardrobe";
import { vrmStore } from "lib/state/vrm";
import { createLogger } from "lib/log";

const log = createLogger("route:/aura/wardrobe");

type Outfit = {
  id: string;
  name: string;
  buffer: ArrayBuffer;
  addedAt: number;
};

export default function WardrobeClient({ url }: { url: string }) {
  const [handleId, setHandleId] = useState<string | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let appliedFor: string | null = null;
    const unsubscribe = vrmStore.subscribe((state) => {
      const firstId = Object.keys(state.handles)[0];
      if (firstId && firstId !== appliedFor) {
        appliedFor = firstId;
        setHandleId(firstId);
        setNamedPose(firstId, "auraDefault");
        startIdle(firstId);
        log.info("base rig handle picked up", { handleId: firstId });
      }
    });
    return () => {
      unsubscribe();
      if (appliedFor) stopIdle(appliedFor);
    };
  }, []);

  const registerOutfitFiles = useCallback(
    async (files: File[]) => {
      const vrmFiles = files.filter((f) =>
        f.name.toLowerCase().endsWith(".vrm"),
      );
      if (vrmFiles.length === 0) {
        setStatus("Drop .vrm files only.");
        return;
      }
      const next: Outfit[] = [];
      for (const file of vrmFiles) {
        const buffer = await file.arrayBuffer();
        next.push({
          id: `outfit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: file.name.replace(/\.vrm$/i, ""),
          buffer,
          addedAt: Date.now(),
        });
      }
      setOutfits((s) => [...s, ...next]);
      setStatus(`${next.length} outfit${next.length === 1 ? "" : "s"} added.`);
      log.info("outfits registered", { count: next.length });
      // Auto-wear first registered outfit if nothing is active.
      const first = next[0];
      if (first && !activeId && handleId) {
        await wear(first);
      }
    },
    // wear references activeId+handleId; deps below cover it
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeId, handleId],
  );

  const wear = useCallback(
    async (outfit: Outfit) => {
      if (!handleId) {
        setStatus("Waiting for base rig to load…");
        return;
      }
      if (busy) return;
      setBusy(true);
      setStatus(`Applying "${outfit.name}"…`);
      try {
        const result = await swapOutfit(handleId, outfit.buffer);
        setActiveId(outfit.id);
        setStatus(
          `"${outfit.name}" applied (${result.swapped}/${result.outfitMeshCount} meshes).`,
        );
        log.info("outfit swap done", {
          outfitId: outfit.id,
          swapped: result.swapped,
          outfitMeshCount: result.outfitMeshCount,
        });
      } catch (err) {
        log.error("outfit swap failed", { err: String(err) });
        setStatus(`Could not apply "${outfit.name}".`);
      } finally {
        setBusy(false);
      }
    },
    [handleId, busy],
  );

  const removeOutfit = useCallback(
    (id: string) => {
      setOutfits((s) => s.filter((o) => o.id !== id));
      if (activeId === id) setActiveId(null);
    },
    [activeId],
  );

  return (
    <div
      className="relative h-full w-full"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const files = Array.from(e.dataTransfer.files);
        void registerOutfitFiles(files);
      }}
    >
      <Canvas camera={{ position: [0, 1.4, 2.2], fov: 30 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 4, 3]} intensity={1.2} />
        <directionalLight
          position={[-2, 2, -2]}
          intensity={0.4}
          color="#ff66cc"
        />
        <OrbitControls target={[0, 1.0, 0]} enablePan={false} />
        <VRMAvatar url={url} />
      </Canvas>

      {dragging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-pink-200/10 backdrop-blur-sm">
          <span className="chrome-label rounded-sm border border-pink-200/60 bg-warm-black-950/80 px-6 py-3 text-pink-100">
            drop .vrm to dress her
          </span>
        </div>
      )}

      {/* Outfit rail */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2 rounded-sm border border-warm-black-800 bg-warm-black-950/85 p-3 text-xs text-chrome-300 backdrop-blur">
        <span className="chrome-label">outfits</span>
        {outfits.length === 0 ? (
          <span className="text-chrome-500">
            None yet. Drop a .vrm onto the viewport.
          </span>
        ) : (
          outfits.map((o) => (
            <div
              key={o.id}
              className={`flex items-center gap-1 rounded-sm border px-2 py-1 ${
                o.id === activeId
                  ? "border-pink-200 bg-pink-200/10 text-pink-100"
                  : "border-warm-black-800 hover:border-pink-200/40"
              }`}
            >
              <button
                type="button"
                disabled={busy}
                onClick={() => wear(o)}
                className="disabled:cursor-not-allowed disabled:opacity-40"
              >
                Wear {o.name}
              </button>
              <button
                type="button"
                onClick={() => removeOutfit(o.id)}
                className="text-chrome-500 hover:text-chrome-200"
                aria-label={`Remove ${o.name}`}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))
        )}
        {status && (
          <span className="ml-auto text-chrome-400">{status}</span>
        )}
      </div>
    </div>
  );
}
