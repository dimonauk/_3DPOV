"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "components/auth/auth-provider";
import type { Drop } from "lib/drops/types";

export function DropAdminRow({ drop }: { drop: Drop }) {
  const { user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limitedRemaining = Math.max(
    0,
    drop.edition.limitedSize - drop.editionState.limitedClaimed,
  );

  const withdraw = async () => {
    if (!user) return;
    if (
      !window.confirm(
        `Withdraw drop "${drop.title}"?\n\nIt will disappear from the public /drops feed. Existing claims remain valid.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(
        `/api/admin/drops/${encodeURIComponent(drop.id)}/withdraw`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
        },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Withdraw failed (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdraw failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="flex flex-col gap-3 rounded-sm border border-warm-black-700 bg-warm-black-900/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link
            href={`/drops/${drop.id}`}
            className="text-sm uppercase tracking-[0.12em] text-chrome-100 hover:text-pink-200"
          >
            {drop.title}
          </Link>
          <span className="chrome-label text-chrome-500">
            {drop.kingdom} · {drop.id}
          </span>
        </div>
        <span className="chrome-label text-chrome-400">{drop.status}</span>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="chrome-label text-chrome-500">Unique</dt>
          <dd className="mt-1 text-chrome-200">
            {drop.editionState.uniqueClaimed ? "Claimed" : "Open"}
          </dd>
        </div>
        <div>
          <dt className="chrome-label text-chrome-500">Limited</dt>
          <dd className="mt-1 text-chrome-200">
            {limitedRemaining} / {drop.edition.limitedSize} left
          </dd>
        </div>
        <div>
          <dt className="chrome-label text-chrome-500">Open sold</dt>
          <dd className="mt-1 text-chrome-200">
            {drop.edition.openEnabled
              ? drop.editionState.openClaimed
              : "—"}
          </dd>
        </div>
      </dl>

      <div className="flex items-center justify-between border-t border-warm-black-800 pt-3">
        <span className="text-xs text-chrome-500">
          {drop.publishedAt
            ? `Published ${new Date(drop.publishedAt).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}`
            : "Draft"}
        </span>
        {drop.status === "published" ? (
          <button
            type="button"
            onClick={withdraw}
            disabled={busy}
            className="chrome-label rounded-sm border border-pink-300/40 px-3 py-1 text-pink-100 transition-colors hover:bg-pink-200 hover:text-warm-black-950 disabled:opacity-50"
          >
            {busy ? "Withdrawing…" : "Withdraw"}
          </button>
        ) : null}
      </div>
      {error ? <p className="text-pink-300 text-xs">{error}</p> : null}
    </li>
  );
}
