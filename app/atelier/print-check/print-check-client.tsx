"use client";

/**
 * app/atelier/print-check/print-check-client.tsx — Print-check chamber UI.
 *
 * Drop an image → POST to /api/print-check → render the verdict card.
 * Unlike most chambers there's no "Generate" button — the check runs
 * automatically as soon as a file lands. Verdict is information, not
 * action, so the wait should be invisible.
 *
 * The verdict card renders the printable-size pyramid (A6 → A2) with
 * the current image's tier highlighted, plus warnings + errors. 360
 * equirectangulars get a "reframe first" callout that points to the
 * reframe chamber (which doesn't exist yet — a follow-up).
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { createLogger } from "lib/log";
import type {
  PrintCheckVerdict,
  PrintSize,
} from "lib/capabilities/image/print-check";
import { useActiveChamber } from "lib/state/atelier-hooks";

const FlagDisplay = dynamic(
  () => import("components/atelier/flag-display/flag-display"),
  { ssr: false },
);

const log = createLogger("atelier:print-check");

const ALL_SIZES: PrintSize[] = ["screen-only", "A6", "A5", "A4", "A3", "A2"];

const SIZE_LABELS: Record<PrintSize, string> = {
  "screen-only": "Screen only",
  A6: "A6 — postcard",
  A5: "A5 — half-letter",
  A4: "A4 — letter",
  A3: "A3 — tabloid",
  A2: "A2 — full sheet (studio target)",
};

type State =
  | { kind: "idle" }
  | {
      kind: "checking";
      previewUrl: string;
      filename: string;
      aspect: number;
    }
  | {
      kind: "ready";
      previewUrl: string;
      filename: string;
      aspect: number;
      verdict: PrintCheckVerdict;
    }
  | {
      kind: "error";
      previewUrl: string;
      filename: string;
      message: string;
      code?: string;
    };

export default function PrintCheckClient() {
  useActiveChamber("print-check");

  const [state, setState] = useState<State>({ kind: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileFieldId = useId();

  const runCheck = useCallback(async (file: File, previewUrl: string, aspect: number) => {
    setState({ kind: "checking", previewUrl, filename: file.name, aspect });
    try {
      const fd = new FormData();
      fd.append("image", file, file.name);
      const res = await fetch("/api/print-check", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const text = await res.text();
        let message = `HTTP ${res.status}`;
        let code: string | undefined;
        try {
          const parsed = JSON.parse(text) as { error?: string; code?: string };
          if (parsed.error) message = parsed.error;
          if (parsed.code) code = parsed.code;
        } catch {
          if (text.length > 0 && text.length < 300) message = text;
        }
        const next: State = {
          kind: "error",
          previewUrl,
          filename: file.name,
          message,
        };
        if (code !== undefined) next.code = code;
        setState(next);
        return;
      }
      const json = (await res.json()) as { verdict?: PrintCheckVerdict };
      if (!json.verdict) {
        setState({
          kind: "error",
          previewUrl,
          filename: file.name,
          message: "Server replied without a verdict.",
        });
        return;
      }
      setState({
        kind: "ready",
        previewUrl,
        filename: file.name,
        aspect,
        verdict: json.verdict,
      });
    } catch (err) {
      log.error("check failed", { err });
      setState({
        kind: "error",
        previewUrl,
        filename: file.name,
        message:
          err instanceof Error ? err.message : "Check failed unexpectedly.",
      });
    }
  }, []);

  const loadFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setState({
          kind: "error",
          previewUrl: "",
          filename: file.name,
          message: "That doesn't look like an image.",
        });
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      // Measure aspect from the file before running the check; the
      // FlagDisplay needs it to lay out the cloth correctly.
      const probe = new Image();
      probe.onload = () => {
        const aspect =
          probe.naturalWidth > 0 && probe.naturalHeight > 0
            ? probe.naturalWidth / probe.naturalHeight
            : 1.5;
        void runCheck(file, previewUrl, aspect);
      };
      probe.onerror = () => {
        void runCheck(file, previewUrl, 1.5);
      };
      probe.src = previewUrl;
    },
    [runCheck],
  );

  // Revoke the preview blob when state transitions or unmounts.
  useEffect(() => {
    return () => {
      if (state.kind !== "idle" && state.previewUrl) {
        URL.revokeObjectURL(state.previewUrl);
      }
    };
  }, [state]);

  const dropClasses = `flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-6 py-10 text-center transition-colors ${
    isDragOver
      ? "border-pink-200 bg-warm-black-900/60"
      : "border-warm-black-700 bg-warm-black-950"
  }`;

  return (
    <div className="flex flex-col gap-8">
      <section
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) loadFile(file);
        }}
        className={dropClasses}
      >
        {state.kind !== "idle" && state.previewUrl ? (
          <img
            src={state.previewUrl}
            alt={state.filename}
            className="max-h-64 rounded-sm border border-warm-black-800"
          />
        ) : null}
        <span className="chrome-label text-chrome-400">Drop zone</span>
        <p className="text-sm leading-relaxed text-chrome-300">
          Drag an image here, or
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
        >
          Choose an image
        </button>
        <input
          id={fileFieldId}
          ref={fileInputRef}
          type="file"
          accept="image/*"
          aria-label="Choose an image to print-check"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadFile(file);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      </section>

      {state.kind === "checking" ? (
        <section className="rounded-sm border border-pink-200/40 bg-pink-900/10 px-4 py-4 text-sm text-chrome-200">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-pink-200">
            Checking &middot; decoding {state.filename}
          </p>
          <p className="mt-2 text-chrome-300">
            Reading dimensions, ICC profile, colour space, XMP metadata.
            Usually finishes in under a second.
          </p>
        </section>
      ) : null}

      {/* Silk-flag preview — auto-switches to sphere for 360s */}
      {state.kind === "ready" && state.previewUrl ? (
        <section className="h-[480px] w-full overflow-hidden rounded-sm border border-warm-black-700 bg-warm-black-950">
          <FlagDisplay
            imageUrl={state.previewUrl}
            mode={state.verdict.needsReframe ? "sphere" : "flag"}
            aspect={state.aspect}
            className="h-full w-full"
          />
        </section>
      ) : null}

      {state.kind === "error" ? (
        <section className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-sm text-pink-100">
          <p>{state.message}</p>
          {state.code === "too_large" ? (
            <p className="mt-2 text-xs text-pink-200/80">
              The 40 MB cap fits an Osmo 360 max-res JPEG. Re-export at a
              slightly lower quality or downscale the long edge a touch.
            </p>
          ) : null}
        </section>
      ) : null}

      {state.kind === "ready" ? (
        <VerdictPanel verdict={state.verdict} filename={state.filename} />
      ) : null}
    </div>
  );
}

function VerdictPanel({
  verdict,
  filename,
}: {
  verdict: PrintCheckVerdict;
  filename: string;
}) {
  const maxIndex = ALL_SIZES.indexOf(verdict.maxPrintableSize);
  const recommendedIndex = ALL_SIZES.indexOf(verdict.recommendedSize);

  return (
    <section className="flex flex-col gap-6 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
      <header className="flex flex-col gap-1">
        <span className="chrome-label text-chrome-400">
          Verdict &middot; {filename}
        </span>
        <h2 className="text-2xl text-chrome-100">
          {verdict.needsReframe
            ? "360 panorama — reframe before printing"
            : verdict.printable
              ? `Prints up to ${verdict.maxPrintableSize} clean`
              : "Screen-only at the studio's PPI thresholds"}
        </h2>
        {verdict.printable && !verdict.needsReframe ? (
          <p className="text-sm text-chrome-300">
            {verdict.recommendedSize === verdict.maxPrintableSize
              ? `Effective ${verdict.effectivePpiAtMax} PPI at ${verdict.maxPrintableSize} — clean at every PPI tier.`
              : `${verdict.maxPrintableSize} at ${verdict.effectivePpiAtMax} PPI (acceptable). ${verdict.recommendedSize} at ${verdict.effectivePpiAtRecommended} PPI (recommended).`}
          </p>
        ) : null}
        {verdict.needsReframe ? (
          <p className="text-sm text-chrome-300">
            Detected a 360 equirectangular. A 2:1 panorama doesn&rsquo;t
            print as-is &mdash; reframe through the virtual camera to a
            flat ISO-A crop first. After reframe, this source supports
            up to {verdict.maxPrintableSize}{" "}
            at {verdict.effectivePpiAtMax} PPI.
          </p>
        ) : null}
      </header>

      {/* Size ladder ----------------------------------------------- */}
      <div className="flex flex-col gap-2">
        <span className="chrome-label text-chrome-400">Size ladder</span>
        <ul className="flex flex-col gap-1.5">
          {ALL_SIZES.map((size, i) => {
            const isMax = i === maxIndex && size !== "screen-only";
            const isRec = i === recommendedIndex && size !== "screen-only";
            const isBelowMax = i > 0 && i <= maxIndex;
            return (
              <li
                key={size}
                className={`flex items-center justify-between rounded-sm border px-3 py-2 font-mono text-xs ${
                  isMax
                    ? "border-pink-200/60 bg-pink-900/20 text-pink-100"
                    : isBelowMax
                      ? "border-warm-black-700 bg-warm-black-900/60 text-chrome-200"
                      : "border-warm-black-800 bg-warm-black-950 text-chrome-500"
                }`}
              >
                <span>{SIZE_LABELS[size]}</span>
                <span className="text-[0.65rem] uppercase tracking-[0.15em]">
                  {isRec
                    ? "recommended"
                    : isMax
                      ? "max acceptable"
                      : isBelowMax
                        ? "below max"
                        : size === "screen-only"
                          ? ""
                          : "too large"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Warnings + errors ----------------------------------------- */}
      {verdict.warnings.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="chrome-label text-amber-200">Warnings</span>
          <ul className="flex flex-col gap-1.5 text-sm text-amber-100/90">
            {verdict.warnings.map((w, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="mt-1 text-amber-200">
                  •
                </span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {verdict.errors.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="chrome-label text-pink-300">Errors</span>
          <ul className="flex flex-col gap-1.5 text-sm text-pink-200">
            {verdict.errors.map((e, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="mt-1">
                  ✕
                </span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Flags --------------------------------------------------- */}
      <div className="flex flex-wrap gap-2 border-t border-warm-black-800 pt-4 font-mono text-[0.6rem] uppercase tracking-[0.15em]">
        <Flag
          label="Web downscale"
          value={verdict.isLikelyWebDownscale}
          tone="warn"
        />
        <Flag label="360 / needs reframe" value={verdict.needsReframe} tone="info" />
        <Flag
          label="Training corpus eligible"
          value={verdict.isTrainingEligible}
          tone="ok"
        />
      </div>
    </section>
  );
}

function Flag({
  label,
  value,
  tone,
}: {
  label: string;
  value: boolean;
  tone: "ok" | "warn" | "info";
}) {
  const cls = value
    ? tone === "ok"
      ? "border-emerald-400/40 bg-emerald-900/30 text-emerald-100"
      : tone === "warn"
        ? "border-amber-400/40 bg-amber-900/30 text-amber-100"
        : "border-cyan-400/40 bg-cyan-900/30 text-cyan-100"
    : "border-warm-black-800 bg-warm-black-900 text-chrome-500";
  return (
    <span className={`rounded-sm border px-2 py-1 ${cls}`}>
      {label} &middot; {value ? "yes" : "no"}
    </span>
  );
}
