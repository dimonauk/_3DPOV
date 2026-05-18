"use client";

/**
 * app/admin/printfiles/order-row.tsx — one order in the dashboard.
 *
 * Expandable row showing summary + attachments + the operator action
 * buttons (mark-sent-to-farm, mark-shipped, mark-delivered, archive).
 * Actions POST to /api/admin/printfiles/[id]/status with the new
 * state; the dashboard re-fetches via `router.refresh()`.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "components/auth/auth-provider";
import type { PrintfilesOrder, PrintfilesOrderStatus } from "lib/printfiles/types";

function statusClass(status: PrintfilesOrderStatus): string {
  if (status === "received" || status === "queued") {
    return "border-pink-200/60 text-pink-200";
  }
  if (status === "sent-to-farm" || status === "printing") {
    return "border-chrome-300 text-chrome-200";
  }
  if (status === "shipped") return "border-emerald-300/60 text-emerald-200";
  if (status === "delivered") return "border-emerald-500/60 text-emerald-300";
  if (status === "rejected" || status === "errored") {
    return "border-rose-400/60 text-rose-200";
  }
  return "border-warm-black-700 text-chrome-400";
}

const NEXT_STATUS: Partial<Record<PrintfilesOrderStatus, PrintfilesOrderStatus[]>> = {
  received: ["queued", "rejected"],
  queued: ["sent-to-farm", "rejected"],
  "sent-to-farm": ["printing", "shipped", "errored"],
  printing: ["shipped", "errored"],
  shipped: ["delivered"],
};

export function OrderRow({ order }: { order: PrintfilesOrder }) {
  const router = useRouter();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalBytes = order.attachments.reduce((n, a) => n + a.sizeBytes, 0);
  const totalMb = (totalBytes / 1024 / 1024).toFixed(2);

  async function updateStatus(next: PrintfilesOrderStatus) {
    if (!user) {
      setError("not signed in");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/admin/printfiles/${order.id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${detail ? ": " + detail.slice(0, 200) : ""}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "update failed");
    } finally {
      setPending(false);
    }
  }

  const actions = NEXT_STATUS[order.status] ?? [];

  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full flex-col gap-2 px-5 py-4 text-left transition-colors hover:bg-warm-black-900/60"
      >
        <div className="flex flex-wrap items-baseline gap-4">
          <code className="font-mono text-xs text-pink-200">{order.id}</code>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusClass(
              order.status,
            )}`}
          >
            {order.status}
          </span>
          <span className="text-xs text-chrome-400">
            {new Date(order.receivedAt).toLocaleString("en-GB")}
          </span>
          <span className="ml-auto text-xs text-chrome-400">
            {order.attachments.length} file
            {order.attachments.length === 1 ? "" : "s"} · {totalMb} MB · provider:{" "}
            {order.printfarm.provider}
          </span>
        </div>
        <div className="flex flex-wrap items-baseline gap-3 text-sm">
          <span className="text-chrome-100">
            {order.sender.name ?? order.sender.address}
          </span>
          {order.sender.name && (
            <span className="text-xs text-chrome-400">
              &lt;{order.sender.address}&gt;
            </span>
          )}
          <span className="text-xs text-chrome-300">— {order.subject}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-warm-black-700 px-5 py-4 text-sm">
          <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <dt className="chrome-label text-chrome-400">Body</dt>
              <dd className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-sm border border-warm-black-700 bg-warm-black-950 p-3 text-xs text-chrome-300">
                {order.bodyText || "(empty)"}
              </dd>
            </div>
            <div>
              <dt className="chrome-label text-chrome-400">Validation</dt>
              <dd className="mt-1 text-xs text-chrome-300">
                {order.validation.ok ? (
                  <span className="text-emerald-300">OK</span>
                ) : (
                  <span className="text-rose-200">
                    Issues: {order.validation.issues.join(", ")}
                  </span>
                )}
              </dd>
              <dt className="chrome-label mt-3 text-chrome-400">Farm</dt>
              <dd className="mt-1 text-xs text-chrome-300">
                {order.printfarm.provider}
                {order.printfarm.externalId && (
                  <> · ext id: {order.printfarm.externalId}</>
                )}
                {order.printfarm.trackingUrl && (
                  <>
                    {" "}
                    ·{" "}
                    <a
                      href={order.printfarm.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-pink-200 underline underline-offset-2"
                    >
                      tracking
                    </a>
                  </>
                )}
              </dd>
            </div>
          </dl>

          <h3 className="chrome-label mt-5 text-chrome-400">
            Attachments ({order.attachments.length})
          </h3>
          <ul className="mt-2 flex flex-col gap-2 text-xs">
            {order.attachments.map((a) => (
              <li
                key={a.blobPathname}
                className="rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-2"
              >
                <div className="flex flex-wrap items-baseline gap-3">
                  <code className="text-chrome-100">{a.filename}</code>
                  <span className="text-chrome-400">
                    {(a.sizeBytes / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <span className="text-chrome-400">{a.inferredKind.toUpperCase()}</span>
                  {a.validation.triangleCount !== null && (
                    <span className="text-chrome-400">
                      {a.validation.triangleCount.toLocaleString()} tris
                    </span>
                  )}
                  {a.validation.boundingBoxMm && (
                    <span className="text-chrome-400">
                      {a.validation.boundingBoxMm.x.toFixed(1)} ×{" "}
                      {a.validation.boundingBoxMm.y.toFixed(1)} ×{" "}
                      {a.validation.boundingBoxMm.z.toFixed(1)}
                    </span>
                  )}
                  <a
                    href={a.blobUrl}
                    className="ml-auto text-pink-200 underline underline-offset-2"
                  >
                    Download
                  </a>
                </div>
                {!a.validation.ok && (
                  <div className="mt-1 text-rose-200">
                    Issues: {a.validation.issues.join(", ")}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {actions.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {actions.map((next) => (
                <button
                  key={next}
                  type="button"
                  disabled={pending}
                  onClick={() => updateStatus(next)}
                  className="rounded-sm border border-warm-black-700 px-3 py-1.5 text-xs uppercase tracking-wider text-chrome-200 transition-colors hover:border-pink-200 hover:text-pink-200 disabled:opacity-50"
                >
                  → {next}
                </button>
              ))}
            </div>
          )}
          {error && (
            <p className="mt-2 text-xs text-rose-300">Error: {error}</p>
          )}
        </div>
      )}
    </div>
  );
}
