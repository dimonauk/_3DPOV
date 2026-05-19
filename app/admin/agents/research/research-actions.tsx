"use client";

/**
 * app/admin/agents/research/research-actions.tsx — Per-page client
 * controls.
 *
 * One-line role: render the "Re-index" button next to the active
 * specialist's header. Pulls the Firebase ID token, POSTs to the
 * admin route, refreshes the page on success. Same posture as
 * `app/admin/library/row-actions.tsx`.
 *
 * `slug` is accepted as a prop so the same component can later host
 * per-specialist actions (forget-all, retire-topic). Today the
 * re-index button is whole-cast — the slug is forward-compatibility.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "components/auth/auth-provider";

export function ResearchActions({ slug }: { slug: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch {
      return null;
    }
  };

  const reindex = async () => {
    setError(null);
    setStatus(null);
    const token = await getToken();
    if (!token) {
      setError("Not signed in");
      return;
    }
    setBusy(true);
    setStatus("Walking the docs tree…");
    try {
      const res = await fetch("/api/admin/agents/research/index", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };
        setError(body.message ?? body.error ?? `HTTP ${res.status}`);
        setStatus(null);
      } else {
        const body = (await res.json().catch(() => ({}))) as {
          scanned?: number;
          indexed?: number;
        };
        setStatus(
          `Scanned ${body.scanned ?? "?"} docs, wrote ${body.indexed ?? "?"} entries.`,
        );
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  };

  // `slug` is preserved for future per-specialist actions — see the
  // file header. Suppress the unused-var warning in a way TS-strict
  // tolerates.
  void slug;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={reindex}
        disabled={busy}
        className="rounded-sm border border-warm-black-700 px-3 py-1 text-xs uppercase tracking-[0.18em] text-chrome-200 hover:border-pink-200 hover:text-pink-200 disabled:opacity-50"
      >
        {busy ? "Indexing…" : "Re-index"}
      </button>
      {status ? (
        <span className="text-[0.65rem] text-chrome-400">{status}</span>
      ) : null}
      {error ? (
        <span className="text-[0.65rem] text-pink-300">{error}</span>
      ) : null}
    </div>
  );
}
