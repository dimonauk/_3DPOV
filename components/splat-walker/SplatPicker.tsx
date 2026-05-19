"use client";

/**
 * components/splat-walker/SplatPicker.tsx — File-picker overlay for
 * the splat walker.
 *
 * Pink-on-warm-black chrome chip styling, matches the rest of the
 * site's `chrome-label` family. The bytes the user picks stay on
 * device: we hand them to `URL.createObjectURL` and pass the blob
 * URL back to the parent, never uploading or proxying. The caller
 * is responsible for `URL.revokeObjectURL` when the file is swapped.
 *
 * Accepts the same file extensions Spark.js can read:
 * `.ply / .splat / .ksplat / .spz / .sog`. Anything else is rejected
 * with an inline message — we'd rather fail with a useful hint than
 * let Spark blow up mid-parse.
 */

import { useId, useRef, useState } from "react";

const ACCEPT = ".ply,.splat,.ksplat,.spz,.sog";
const VALID_EXT = /\.(ply|splat|ksplat|spz|sog)$/i;

export type SplatPickerProps = {
  /** Called with the chosen file. Parent owns the object URL lifetime. */
  onPick: (file: File) => void;
  /** Current splat label to show when a file is loaded. */
  currentLabel?: string | null;
  /** Compact-mode (smaller chip, no instructions). Default false. */
  compact?: boolean;
};

export function SplatPicker({
  onPick,
  currentLabel,
  compact = false,
}: SplatPickerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!VALID_EXT.test(file.name)) {
      setError(`Unsupported extension — ${ACCEPT}`);
      return;
    }
    setError(null);
    onPick(file);
  };

  return (
    <div className="splat-walker-picker">
      <label htmlFor={inputId} className="splat-walker-picker-chip">
        <span className="splat-walker-picker-label">
          {currentLabel ? "Swap splat" : "Load splat"}
        </span>
        {!compact && (
          <span className="splat-walker-picker-hint">
            .ply / .splat / .ksplat / .spz / .sog — stays on this device
          </span>
        )}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        onChange={handleChange}
        className="splat-walker-picker-input"
      />
      {currentLabel && (
        <span className="splat-walker-picker-current" title={currentLabel}>
          {currentLabel}
        </span>
      )}
      {error && (
        <span className="splat-walker-picker-error">{error}</span>
      )}

      <style>{`
        .splat-walker-picker {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
        }
        .splat-walker-picker-chip {
          display: inline-flex;
          flex-direction: column;
          gap: 0.15rem;
          padding: 0.45rem 0.8rem;
          border: 1px solid rgba(255, 182, 193, 0.35);
          border-radius: 0.25rem;
          background: rgba(12, 10, 18, 0.78);
          color: #ffd2dc;
          cursor: pointer;
          transition: border-color 120ms ease, color 120ms ease;
        }
        .splat-walker-picker-chip:hover {
          border-color: #ffd2dc;
          color: #ffe5eb;
        }
        .splat-walker-picker-label {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .splat-walker-picker-hint {
          font-size: 0.6rem;
          color: rgba(255, 210, 220, 0.55);
        }
        .splat-walker-picker-input {
          position: absolute;
          opacity: 0;
          width: 1px;
          height: 1px;
          pointer-events: none;
        }
        .splat-walker-picker-current {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 0.62rem;
          color: rgba(255, 210, 220, 0.7);
          max-width: 16rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .splat-walker-picker-error {
          font-size: 0.7rem;
          color: #ff8585;
        }
      `}</style>
    </div>
  );
}

export default SplatPicker;
