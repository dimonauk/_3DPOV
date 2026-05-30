"use client";

/**
 * app/admin/drops/new/new-drop/status-block.tsx — Renders the
 * submit-status feedback: idle (null), submitting (null), done,
 * gate-failed (with Oracle/Sieve reasons), validation-failed (with
 * a path-keyed issue list), or a generic error.
 */

import type { SubmitStatus } from "./types";

export function StatusBlock({ status }: { status: SubmitStatus }) {
  if (status.kind === "idle" || status.kind === "submitting") return null;
  if (status.kind === "done") {
    return (
      <div className="rounded-sm border border-mint-300/40 bg-mint-300/10 p-3 text-xs text-mint-200">
        Drop published. Id:{" "}
        <code className="text-mint-100">{status.dropId}</code>.
      </div>
    );
  }
  if (status.kind === "gate-failed") {
    return (
      <div className="flex flex-col gap-2 rounded-sm border border-pink-300/40 bg-pink-300/10 p-3 text-xs text-pink-200">
        <strong className="chrome-label text-pink-100">
          Publish blocked at gate
        </strong>
        <span className="leading-relaxed">{status.message}</span>
        {status.oracle && !status.oracle.pass ? (
          <GateReport title="Oracle" reasons={status.oracle.reasons} />
        ) : null}
        {status.sieve && !status.sieve.pass ? (
          <GateReport title="Sieve" reasons={status.sieve.reasons} />
        ) : null}
      </div>
    );
  }
  if (status.kind === "validation-failed") {
    return (
      <div className="flex flex-col gap-2 rounded-sm border border-pink-300/40 bg-pink-300/10 p-3 text-xs text-pink-200">
        <strong className="chrome-label text-pink-100">
          Validation failed
        </strong>
        <ul className="list-disc pl-4 leading-relaxed">
          {status.issues.map((i) => (
            <li key={`${i.path}-${i.message}`}>
              <code className="text-pink-100">{i.path || "(root)"}</code>:{" "}
              {i.message}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="rounded-sm border border-pink-300/40 bg-pink-300/10 p-3 text-xs text-pink-200">
      <strong className="chrome-label text-pink-100">Error</strong>{" "}
      <span className="leading-relaxed">{status.message}</span>
    </div>
  );
}

function GateReport({
  title,
  reasons,
}: {
  title: string;
  reasons: ReadonlyArray<string>;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="chrome-label text-pink-100">{title}</span>
      <ul className="list-disc pl-4 leading-relaxed text-pink-200">
        {reasons.map((r, i) => (
          <li key={`${title}-${i}`}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
