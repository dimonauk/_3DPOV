"use client";

/**
 * components/atelier/printability-badge.tsx — Compact print-check verdict badge.
 *
 * Renders a one-line verdict that fits inside a chamber's image preview
 * row, a Drive scan list row, or a recent-outputs drawer entry. Three
 * sizes available; the default ("compact") fits a 28px row, the "tag"
 * variant is a small chip, and "full" is a small panel with the size
 * ladder + flags.
 *
 * The component is purely presentational — fetching the verdict is the
 * caller's job. Two factories below help with that: `verdictFromDrive`
 * for a Drive file's imageMediaMetadata, and `useVerdictFromBlob` for an
 * uploaded Blob (POSTs to /api/print-check).
 */

import { useEffect, useState } from "react";

import {
  type PrintCheckVerdict,
  printCheckFromDriveMeta,
  summarisePrintVerdict,
} from "lib/capabilities/image/print-check";

type Variant = "compact" | "tag" | "full";

type Props = {
  verdict: PrintCheckVerdict | null;
  variant?: Variant;
  /** Show "(360 — needs reframe)" tail when needsReframe is true. Default true. */
  showReframeNote?: boolean;
};

export default function PrintabilityBadge({
  verdict,
  variant = "compact",
  showReframeNote = true,
}: Props) {
  if (!verdict) {
    return (
      <span className="rounded-sm border border-warm-black-800 bg-warm-black-900 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-chrome-500">
        no verdict
      </span>
    );
  }

  if (variant === "tag") {
    return <Tag verdict={verdict} showReframeNote={showReframeNote} />;
  }
  if (variant === "full") {
    return <FullPanel verdict={verdict} />;
  }
  return <Compact verdict={verdict} showReframeNote={showReframeNote} />;
}

// ---------- Variants ----------

function Compact({
  verdict,
  showReframeNote,
}: {
  verdict: PrintCheckVerdict;
  showReframeNote: boolean;
}) {
  const tone = toneFor(verdict);
  const summary = summarisePrintVerdict(verdict);
  const showReframe = showReframeNote && verdict.needsReframe;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${tone}`}
    >
      <span>{summary}</span>
      {showReframe ? (
        <span className="text-cyan-200/80">· 360</span>
      ) : null}
      {verdict.isTrainingEligible ? (
        <span className="text-emerald-200/80">· corpus</span>
      ) : null}
    </span>
  );
}

function Tag({
  verdict,
  showReframeNote,
}: {
  verdict: PrintCheckVerdict;
  showReframeNote: boolean;
}) {
  if (!verdict.printable && !verdict.needsReframe) {
    return (
      <span className="rounded-sm border border-pink-400/40 bg-pink-900/20 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-pink-200">
        screen
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${toneFor(verdict)}`}
    >
      <span>{verdict.maxPrintableSize}</span>
      {showReframeNote && verdict.needsReframe ? (
        <span aria-label="360 panorama">◯</span>
      ) : null}
    </span>
  );
}

function FullPanel({ verdict }: { verdict: PrintCheckVerdict }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-2 font-mono text-[10px] uppercase tracking-[0.12em] text-chrome-300">
      <span>{summarisePrintVerdict(verdict)}</span>
      <div className="flex flex-wrap gap-1">
        <span
          className={`rounded-sm border px-1.5 py-0.5 ${
            verdict.needsReframe
              ? "border-cyan-400/40 bg-cyan-900/20 text-cyan-100"
              : "border-warm-black-800 bg-warm-black-900 text-chrome-500"
          }`}
        >
          {verdict.needsReframe ? "360 reframe" : "flat"}
        </span>
        <span
          className={`rounded-sm border px-1.5 py-0.5 ${
            verdict.isLikelyWebDownscale
              ? "border-amber-400/40 bg-amber-900/20 text-amber-100"
              : "border-warm-black-800 bg-warm-black-900 text-chrome-500"
          }`}
        >
          {verdict.isLikelyWebDownscale ? "downscale" : "full-res"}
        </span>
        <span
          className={`rounded-sm border px-1.5 py-0.5 ${
            verdict.isTrainingEligible
              ? "border-emerald-400/40 bg-emerald-900/20 text-emerald-100"
              : "border-warm-black-800 bg-warm-black-900 text-chrome-500"
          }`}
        >
          {verdict.isTrainingEligible ? "training corpus" : "not corpus"}
        </span>
      </div>
    </div>
  );
}

// ---------- Tone selection ----------

function toneFor(verdict: PrintCheckVerdict): string {
  if (verdict.needsReframe) {
    return "border-cyan-400/40 bg-cyan-900/20 text-cyan-100";
  }
  if (!verdict.printable) {
    return "border-pink-400/40 bg-pink-900/20 text-pink-200";
  }
  // Tier the tone by max printable size.
  switch (verdict.maxPrintableSize) {
    case "A2":
      return "border-emerald-400/60 bg-emerald-900/30 text-emerald-100";
    case "A3":
      return "border-emerald-400/40 bg-emerald-900/20 text-emerald-100";
    case "A4":
      return "border-chrome-400/40 bg-chrome-900/20 text-chrome-100";
    case "A5":
    case "A6":
      return "border-amber-400/40 bg-amber-900/20 text-amber-100";
    default:
      return "border-pink-400/40 bg-pink-900/20 text-pink-200";
  }
}

// ---------- Factory helpers ----------

/**
 * Compute a verdict from a Drive file's imageMediaMetadata, no fetch
 * required. Returns null if the file has no usable metadata.
 */
export function verdictFromDriveMeta(meta: {
  width?: number;
  height?: number;
  rotation?: number;
  cameraMake?: string;
  cameraModel?: string;
  fileName?: string;
  fileSizeBytes?: number;
} | undefined): PrintCheckVerdict | null {
  if (!meta) return null;
  return printCheckFromDriveMeta(meta);
}

/**
 * Fetch a verdict by POSTing the Blob to /api/print-check. Returns
 * { verdict, loading, error } state.
 */
export function useVerdictFromBlob(blob: Blob | null): {
  verdict: PrintCheckVerdict | null;
  loading: boolean;
  error: string | null;
} {
  const [verdict, setVerdict] = useState<PrintCheckVerdict | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setVerdict(null);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fd = new FormData();
    fd.append("image", blob, "image");

    fetch("/api/print-check", { method: "POST", body: fd })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        }
        return res.json() as Promise<{ verdict?: PrintCheckVerdict }>;
      })
      .then((data) => {
        if (cancelled) return;
        setVerdict(data.verdict ?? null);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Verdict failed.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [blob]);

  return { verdict, loading, error };
}
