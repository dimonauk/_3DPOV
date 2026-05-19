"use client";

/**
 * components/webxr-retroarch/RetroArchToolbar.tsx — HUD chrome for the
 * WebXR RetroArch room. Sits over the SceneStage canvas as plain DOM.
 *
 * Responsibilities:
 *   - System selector
 *   - ROM file picker — bytes never leave the device (object URL)
 *   - BIOS file picker — when the system requires one
 *   - Boot button — disabled until ROM (+ BIOS) are picked
 *   - Mapping label — tells the visitor which controller scheme is
 *     active so they know what the right thumbstick does
 *
 * The SceneStage's own toolbar already handles "Enter VR" / "Exit" /
 * recentre / WebGPU pill — we layer above it, not duplicate it.
 */

import { useMemo } from "react";

import type { EmulatorSystem } from "lib/emulator/systems";
import { SYSTEMS } from "lib/emulator/systems";
import { getMapping } from "lib/webxr-retroarch/input-mappings";

export type RetroArchToolbarProps = {
  system: EmulatorSystem;
  onSystemChange?: (next: EmulatorSystem) => void;
  romName: string | null;
  onPickRom: (file: File | undefined) => void;
  biosName: string | null;
  onPickBios: (file: File | undefined) => void;
  booted: boolean;
  canBoot: boolean;
  onBoot: () => void;
};

export function RetroArchToolbar({
  system,
  onSystemChange,
  romName,
  onPickRom,
  biosName,
  onPickBios,
  booted,
  canBoot,
  onBoot,
}: RetroArchToolbarProps) {
  const mapping = useMemo(() => getMapping(system.slug), [system.slug]);

  return (
    <div className="retroarch-toolbar">
      <div className="retroarch-toolbar__row">
        <label className="retroarch-toolbar__field">
          <span className="retroarch-toolbar__label">System</span>
          <select
            value={system.slug}
            disabled={booted}
            onChange={(e) => {
              const next = SYSTEMS.find((s) => s.slug === e.target.value);
              if (next && onSystemChange) onSystemChange(next);
            }}
          >
            {SYSTEMS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="retroarch-toolbar__field">
          <span className="retroarch-toolbar__label">ROM file</span>
          <input
            type="file"
            accept={system.acceptExtensions.join(",")}
            disabled={booted}
            onChange={(e) => onPickRom(e.target.files?.[0])}
          />
          <span className="retroarch-toolbar__hint">
            {romName ?? (
              <>
                Accepts {system.acceptExtensions.join(" / ")} &middot;
                read locally, nothing uploads
              </>
            )}
          </span>
        </label>

        {system.biosRequired && (
          <label className="retroarch-toolbar__field">
            <span className="retroarch-toolbar__label">BIOS file</span>
            <input
              type="file"
              accept=".bin,.rom"
              disabled={booted}
              onChange={(e) => onPickBios(e.target.files?.[0])}
            />
            <span className="retroarch-toolbar__hint">
              {biosName ?? (
                <>
                  {system.label} BIOS &middot; bring your own dump
                  &middot; nothing uploads
                </>
              )}
            </span>
          </label>
        )}

        <button
          type="button"
          onClick={onBoot}
          disabled={!canBoot}
          className="retroarch-toolbar__boot"
        >
          {booted ? "Running" : `Boot ${system.label}`}
        </button>
      </div>

      <div className="retroarch-toolbar__meta">
        <span className="retroarch-toolbar__chip">
          Scheme &middot; {mapping.schemeLabel}
        </span>
        <span className="retroarch-toolbar__chip">
          ROM bytes never leave the device
        </span>
      </div>

      <style>{`
        .retroarch-toolbar {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          padding: 0.9rem 1.1rem;
          background: rgba(8, 6, 14, 0.78);
          border: 1px solid rgba(255, 196, 217, 0.28);
          border-radius: 0.4rem;
          color: rgba(255, 255, 255, 0.85);
        }
        .retroarch-toolbar__row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.9rem;
          align-items: flex-end;
        }
        .retroarch-toolbar__field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1 1 220px;
          min-width: 200px;
        }
        .retroarch-toolbar__label {
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 196, 217, 0.85);
        }
        .retroarch-toolbar__field input,
        .retroarch-toolbar__field select {
          background: rgba(0, 0, 0, 0.4);
          color: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.45rem 0.6rem;
          border-radius: 0.3rem;
          font-size: 0.82rem;
          font-family: inherit;
        }
        .retroarch-toolbar__hint {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
        }
        .retroarch-toolbar__boot {
          background: #ff6fb5;
          color: #1a0a1a;
          border: 0;
          padding: 0.65rem 1.2rem;
          border-radius: 0.35rem;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          letter-spacing: 0.06em;
        }
        .retroarch-toolbar__boot:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .retroarch-toolbar__meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.55);
        }
        .retroarch-toolbar__chip {
          padding: 0.25rem 0.55rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 0.25rem;
          background: rgba(0, 0, 0, 0.3);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}

export default RetroArchToolbar;
