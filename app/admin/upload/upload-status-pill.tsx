"use client";

/**
 * app/admin/upload/upload-status-pill.tsx — Per-row status indicator
 * for the upload queue. Renders queued / uploading (with progress bar)
 * / done (with Blob URL link) / failed (with error message).
 */

import type { RowStatus } from "./upload-types";

export function StatusPill({ status }: { status: RowStatus }) {
  if (status.kind === "queued") {
    return <span className="chrome-label text-chrome-500">Queued</span>;
  }
  if (status.kind === "uploading") {
    return (
      <div className="flex flex-col gap-1">
        <span className="chrome-label text-pink-200">
          Uploading &middot; {status.percent}%
        </span>
        <div
          className="h-1 w-full rounded-full bg-warm-black-800"
          aria-label="upload progress"
        >
          <div
            className="h-full rounded-full bg-pink-200"
            style={{ width: `${status.percent}%` }}
          />
        </div>
      </div>
    );
  }
  if (status.kind === "done") {
    return (
      <div className="flex flex-col gap-1">
        <span className="chrome-label text-mint-300">Done</span>
        <a
          href={status.url}
          target="_blank"
          rel="noreferrer"
          className="break-all text-[0.65rem] text-chrome-400 hover:text-pink-200"
        >
          {status.url}
        </a>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="chrome-label text-pink-300">Failed</span>
      <span className="text-[0.65rem] text-pink-300">{status.message}</span>
    </div>
  );
}
