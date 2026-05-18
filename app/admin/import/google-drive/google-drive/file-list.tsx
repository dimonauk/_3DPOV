"use client";

/**
 * app/admin/import/google-drive/google-drive/file-list.tsx — Folder
 * contents list with the print-filter, the per-row checkbox + folder
 * descent button, printability badge, MIME hint, and outcome
 * indicator.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1.
 */

import PrintabilityBadge, {
  verdictFromDriveMeta,
} from "components/atelier/printability-badge";

import type {
  DriveFile,
  ImportOutcome,
  PrintFilter,
} from "./types";

export function FileList({
  files,
  busy,
  mediaOnly,
  printFilter,
  selected,
  outcomes,
  onEnterFolder,
  onToggle,
}: {
  files: DriveFile[];
  busy: boolean;
  mediaOnly: boolean;
  printFilter: PrintFilter;
  selected: Set<string>;
  outcomes: Record<string, ImportOutcome>;
  onEnterFolder: (f: DriveFile) => void;
  onToggle: (id: string) => void;
}) {
  const visibleFiles = files.filter((f) => {
    if (f.isFolder) return true;
    if (printFilter === "all") return true;
    const verdict = verdictFromDriveMeta(f.imageMediaMetadata);
    if (!verdict) {
      // No verdict computable — show in "all", hide in restrictive
      // filters since we can't confirm eligibility.
      return false;
    }
    if (printFilter === "printable-only") {
      return (
        verdict.printable &&
        verdict.maxPrintableSize !== "screen-only" &&
        verdict.maxPrintableSize !== "A6" &&
        verdict.maxPrintableSize !== "A5"
      );
    }
    if (printFilter === "hide-downscales") {
      return !verdict.isLikelyWebDownscale;
    }
    if (printFilter === "corpus-only") {
      return verdict.isTrainingEligible;
    }
    return true;
  });
  const hiddenCount = files.length - visibleFiles.length;

  if (busy && files.length === 0) {
    return <p className="px-4 py-3 text-xs text-chrome-400">Loading…</p>;
  }
  if (visibleFiles.length === 0) {
    return (
      <p className="px-4 py-3 text-xs text-chrome-400">
        {files.length === 0
          ? `No items in this folder${mediaOnly ? " (filtered to media)" : ""}.`
          : `All ${files.length} items hidden by the print filter. Pick "all" to show them.`}
      </p>
    );
  }
  return (
    <>
      {hiddenCount > 0 ? (
        <div className="border-b border-warm-black-700 px-4 py-2 text-[10px] uppercase tracking-[0.12em] text-chrome-500">
          {hiddenCount} of {files.length} hidden by print filter
        </div>
      ) : null}
      <ul className="flex flex-col divide-y divide-warm-black-700">
        {visibleFiles.map((f) => (
          <li
            key={f.id}
            className="flex items-center gap-3 px-4 py-2 text-xs text-chrome-200"
          >
            {f.isFolder ? (
              <button
                type="button"
                onClick={() => onEnterFolder(f)}
                className="flex w-full items-center gap-3 text-left"
              >
                <span className="text-pink-200">📁</span>
                <span className="text-chrome-100">{f.name}</span>
              </button>
            ) : (
              <>
                <input
                  type="checkbox"
                  aria-label={`Select ${f.name}`}
                  checked={selected.has(f.id)}
                  onChange={() => onToggle(f.id)}
                />
                <span className="truncate text-chrome-100">{f.name}</span>
                {(() => {
                  const verdict = verdictFromDriveMeta(f.imageMediaMetadata);
                  if (!verdict) return null;
                  return <PrintabilityBadge verdict={verdict} variant="tag" />;
                })()}
                <span className="ml-auto text-[10px] text-chrome-500">
                  {f.mimeType}
                </span>
                {(() => {
                  const o = outcomes[f.id];
                  if (!o) return null;
                  return (
                    <span
                      className={
                        o.status === "ok"
                          ? "text-emerald-300"
                          : "text-pink-300"
                      }
                    >
                      {o.status === "ok" ? "imported" : "error"}
                    </span>
                  );
                })()}
              </>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
