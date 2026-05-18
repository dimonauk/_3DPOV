"use client";

/**
 * <EmulatorJsEmbed /> — Client-side EmulatorJS embed wrapper.
 *
 * Loads the EmulatorJS loader script from the official CDN
 * (data4.zip), wires it to a div, and boots a chosen core against a
 * ROM file the user picked from their own disk. Nothing uploads.
 *
 * EmulatorJS docs: https://emulatorjs.org/docs/getting-started
 *
 * The embed uses object URLs (URL.createObjectURL) so the ROM bytes
 * stay client-side. The studio doesn't host ROMs, BIOS files, or
 * firmware; the user must provide their own from their own hardware
 * dumps. See /articles/what-the-studio-wont-do.
 */

import { useEffect, useRef, useState } from "react";

import type { EmulatorSystem } from "lib/emulator/systems";

declare global {
  interface Window {
    EJS_player?: string;
    EJS_core?: string;
    EJS_gameUrl?: string;
    EJS_pathtodata?: string;
    EJS_startOnLoaded?: boolean;
    EJS_biosUrl?: string;
    EJS_gameName?: string;
  }
}

const EMULATORJS_CDN = "https://cdn.emulatorjs.org/stable/data/";

export type EmulatorJsEmbedProps = {
  system: EmulatorSystem;
};

export default function EmulatorJsEmbed({ system }: EmulatorJsEmbedProps) {
  const [romUrl, setRomUrl] = useState<string | null>(null);
  const [biosUrl, setBiosUrl] = useState<string | null>(null);
  const [romName, setRomName] = useState<string>("");
  const [booted, setBooted] = useState(false);
  const scriptLoadedRef = useRef(false);

  // Clean up the object URLs when the component unmounts.
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
  };

  const canBoot =
    !!romUrl && (!system.biosRequired || !!biosUrl) && !booted;

  const onBoot = () => {
    if (!canBoot || !romUrl) return;
    // Configure EmulatorJS globals before loading the loader.
    window.EJS_player = "#emulator-host";
    window.EJS_core = system.coreSlug;
    window.EJS_gameUrl = romUrl;
    window.EJS_pathtodata = EMULATORJS_CDN;
    window.EJS_startOnLoaded = true;
    window.EJS_gameName = romName || system.label;
    if (system.biosRequired && biosUrl) {
      window.EJS_biosUrl = biosUrl;
    }
    // Load the loader script.
    if (!scriptLoadedRef.current) {
      const script = document.createElement("script");
      script.src = `${EMULATORJS_CDN}loader.js`;
      script.async = true;
      document.body.appendChild(script);
      scriptLoadedRef.current = true;
    }
    setBooted(true);
  };

  return (
    <div className="ejs-root">
      {!booted ? (
        <div className="ejs-setup">
          <label className="ejs-row">
            <span className="ejs-label">ROM file</span>
            <input
              type="file"
              accept={system.acceptExtensions.join(",")}
              onChange={(e) => onPickRom(e.target.files?.[0])}
            />
            {romName ? (
              <span className="ejs-hint">{romName}</span>
            ) : (
              <span className="ejs-hint">
                Accepts {system.acceptExtensions.join(" / ")} files.
                Read locally; nothing uploads.
              </span>
            )}
          </label>

          {system.biosRequired && (
            <label className="ejs-row">
              <span className="ejs-label">BIOS file</span>
              <input
                type="file"
                accept=".bin,.rom"
                onChange={(e) => onPickBios(e.target.files?.[0])}
              />
              <span className="ejs-hint">
                The {system.label} needs a BIOS dump from your own
                console. The studio doesn&rsquo;t host one. Read
                locally; nothing uploads.
              </span>
            </label>
          )}

          <button
            type="button"
            onClick={onBoot}
            disabled={!canBoot}
            className="ejs-boot"
          >
            Boot {system.label}
          </button>
        </div>
      ) : (
        <div id="emulator-host" className="ejs-host" />
      )}

      <style>{`
        .ejs-root {
          width: 100%;
        }
        .ejs-setup {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
        }
        .ejs-row {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .ejs-label {
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.6);
        }
        .ejs-row input[type="file"] {
          background: rgba(0, 0, 0, 0.4);
          color: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.55rem 0.75rem;
          border-radius: 0.4rem;
          font-size: 0.85rem;
          font-family: inherit;
        }
        .ejs-hint {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.45);
        }
        .ejs-boot {
          background: #ff6fb5;
          color: #1a0a1a;
          border: 0;
          padding: 0.8rem 1.5rem;
          border-radius: 0.5rem;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          align-self: flex-start;
          font-family: inherit;
        }
        .ejs-boot:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .ejs-host {
          width: 100%;
          min-height: 520px;
          aspect-ratio: 4 / 3;
          background: #000;
          border-radius: 0.5rem;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
