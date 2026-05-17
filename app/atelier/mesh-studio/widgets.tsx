/**
 * app/atelier/mesh-studio/widgets.tsx — Shared chrome widgets for the
 * mesh-studio chamber tabs.
 *
 * Extracted from mesh-studio-client.tsx: the SidecarBar that crowns
 * the chamber, the PaletteSwatch used by the pixel-art form, and the
 * two small status primitives (StatCard, BridgeOfflineNote) every tab
 * reaches for when the sidecar is offline.
 */

import { SIDECAR_BASE, type SidecarStatus } from "./types";

export function SidecarBar({ status }: { status: SidecarStatus }) {
  const tone =
    status.kind === "online"
      ? "border-emerald-400/30 bg-emerald-900/10 text-emerald-200"
      : status.kind === "offline"
        ? "border-warm-black-700 bg-warm-black-900 text-chrome-400"
        : "border-warm-black-700 bg-warm-black-900 text-chrome-400";
  const label =
    status.kind === "online"
      ? `sidecar online · ${status.service} v${status.version}`
      : status.kind === "offline"
        ? `sidecar offline · ${status.reason} · read-only catalogue`
        : "probing sidecar…";
  return (
    <div className={`flex items-center justify-between border-b px-4 py-2 ${tone}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em]">{label}</span>
      <span className="font-mono text-[10px] tracking-wider text-chrome-500">
        {SIDECAR_BASE}
      </span>
    </div>
  );
}

export function PaletteSwatch({ colors }: { colors: ReadonlyArray<string> }) {
  return (
    <div className="flex overflow-hidden rounded-sm border border-warm-black-800">
      {colors.map((c, i) => (
        <div
          key={`${c}-${i}`}
          className="h-7 w-5"
          style={{ background: c }}
          title={c}
        />
      ))}
    </div>
  );
}

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "good" | "bad";
}) {
  const tone =
    accent === "good"
      ? "text-emerald-200"
      : accent === "bad"
        ? "text-pink-200"
        : "text-chrome-100";
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/60 px-3 py-2">
      <div className="chrome-label text-chrome-500">{label}</div>
      <div className={`mt-0.5 font-mono text-sm tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}

export function BridgeOfflineNote({
  what,
  mount,
  extra,
}: {
  what: string;
  mount: string;
  extra: string;
}) {
  return (
    <aside className="rounded-sm border border-warm-black-700 bg-warm-black-900 p-3 text-xs text-chrome-400">
      <span className="chrome-label mr-2 text-chrome-300">{what} offline</span>
      mounted at <code className="font-mono text-chrome-200">{mount}</code> on the sidecar.
      {" "}
      {extra}.
    </aside>
  );
}
