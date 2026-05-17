"use client";

/**
 * components/studio/export-panel/splat-status.tsx — Status block
 * shown beneath the "Generate splat" button. Renders one of three
 * states:
 *
 *  - Desktop unreachable → install prompt + reason
 *  - Source not splat-able → reason + hint
 *  - Reachable + supported → blob-URL caveat + StreamingDetail
 *
 * Extracted from ExportPanel.tsx per ARCHITECTURE.md Rule 1.
 */

import { reasonCopy, useHoloFlowDesktop } from "lib/studio/desktop";

import { DESKTOP_INSTALL_URL } from "./constants";
import type { SplatSupport } from "./splat-support";
import type { JobEvent, SubmitState } from "./types";

type DesktopStateForUi = ReturnType<typeof useHoloFlowDesktop>;

export function SplatStatusBlock({
  desktopState,
  splatSupport,
  submitState,
}: {
  desktopState: DesktopStateForUi;
  splatSupport: SplatSupport;
  submitState: SubmitState;
}) {
  // Desktop unreachable — show the install / start prompt.
  if (desktopState.status !== "available") {
    return (
      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-2 font-mono text-xs text-chrome-300">
        <div className="text-chrome-100">
          HoloFlow Desktop not connected — install or start it from the tray.
        </div>
        <div className="mt-1 text-chrome-500">{reasonCopy(desktopState)}</div>
        <a
          href={DESKTOP_INSTALL_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-pink-200 underline decoration-pink-200/40 underline-offset-2 hover:decoration-pink-200"
        >
          Get HoloFlow Desktop →
        </a>
      </div>
    );
  }

  // Desktop reachable but the source isn't splat-able.
  if (!splatSupport.ok) {
    return (
      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-2 font-mono text-xs text-chrome-300">
        <div className="text-chrome-100">{splatSupport.reason}</div>
        {splatSupport.hint ? (
          <div className="mt-1 text-chrome-500">{splatSupport.hint}</div>
        ) : null}
      </div>
    );
  }

  // Reachable + supported. Always render the blob-URL caveat so the
  // operator knows v0 is payload-schema-only — the localhost service
  // can't actually fetch a blob:https://… URL from a different origin.
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-2 font-mono text-xs text-chrome-300">
      <div className="text-chrome-100">
        v0 limitation: the source URL we send is a browser{" "}
        <code className="text-pink-200">blob:</code> handle. HoloFlow Desktop
        runs in a different origin and can't fetch it — for now the operator
        must pre-stage the file with the desktop helper, or wait for direct
        upload (v1). The job below is real; the input bytes are not.
      </div>

      {submitState.status === "idle" ? (
        <div className="mt-2 text-chrome-500">
          Ready. Variant: colmap + nerfstudio (strategy=auto).
        </div>
      ) : null}

      {submitState.status === "submitting" ? (
        <div className="mt-2 text-pink-200">Submitting job…</div>
      ) : null}

      {submitState.status === "streaming" || submitState.status === "done" ? (
        <StreamingDetail
          jobId={submitState.jobId}
          events={submitState.events}
          finalPhase={
            submitState.status === "done" ? submitState.finalPhase : null
          }
        />
      ) : null}

      {submitState.status === "error" ? (
        <div className="mt-2 text-pink-200">
          Submission failed: {submitState.message}
        </div>
      ) : null}
    </div>
  );
}

function StreamingDetail({
  jobId,
  events,
  finalPhase,
}: {
  jobId: string;
  events: JobEvent[];
  finalPhase: string | null;
}) {
  const last = events[events.length - 1];
  const terminal = finalPhase === "done" || finalPhase === "failed";
  return (
    <div className="mt-2 space-y-1">
      <div className="flex justify-between">
        <span className="text-chrome-500">job</span>
        <span className="text-chrome-100">{jobId}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-chrome-500">events</span>
        <span className={terminal ? "text-chrome-300" : "text-pink-200"}>
          {events.length}
          {last?.phase ? ` · ${last.phase}` : ""}
        </span>
      </div>
      {last ? (
        <div className="text-pink-200">{last.message}</div>
      ) : (
        <div className="text-chrome-500">waiting for first event…</div>
      )}
      {terminal ? (
        <div
          className={
            finalPhase === "done"
              ? "mt-2 rounded-sm border border-pink-200/30 bg-pink-200/5 px-2 py-1 text-pink-100"
              : "mt-2 rounded-sm border border-warm-black-700 bg-warm-black-900/60 px-2 py-1 text-chrome-200"
          }
        >
          Final phase: {finalPhase}. Job id: {jobId}
        </div>
      ) : null}
    </div>
  );
}
