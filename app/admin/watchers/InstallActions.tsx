"use client";

/**
 * app/admin/watchers/InstallActions.tsx — Ack button per install
 * suggestion. POSTs to /api/admin/watchers/install-ack with the
 * operator's Firebase ID token.
 */
import { useState } from "react";

import { useAuth } from "components/auth/auth-provider";
import { getFirebaseAuth } from "lib/firebase/client";

export function InstallActions({ id }: { id: string }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onAck = async () => {
    if (!user) {
      setErr("Sign in first.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const auth = getFirebaseAuth();
      if (!auth?.currentUser) throw new Error("auth unavailable");
      const token = await auth.currentUser.getIdToken();
      const resp = await fetch("/api/admin/watchers/install-ack", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`http ${resp.status}: ${text}`);
      }
      // Soft reload — the server component will re-render with the
      // suggestion hidden.
      window.location.reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onAck}
        disabled={busy}
        className="chrome-label rounded-sm border border-pink-200/40 px-2 py-1 text-pink-200 transition-colors hover:bg-warm-black-900 disabled:opacity-60"
      >
        {busy ? "Acking…" : "Mark handled"}
      </button>
      {err ? <span className="text-xs text-pink-300">{err}</span> : null}
    </div>
  );
}
