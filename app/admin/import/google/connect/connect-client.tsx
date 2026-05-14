"use client";

/**
 * app/admin/import/google/connect/connect-client.tsx — Client island
 * for the Google connect page.
 *
 * One-line role: shows current connection state and triggers the OAuth
 * start route with the operator's Firebase ID token attached.
 *
 * The OAuth start endpoint can't read a session cookie (the site is
 * stateless), so we POST the ID token in the Authorization header,
 * receive back a one-time `state` token, then navigate the browser to
 * Google's consent URL.
 */

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "components/auth/auth-provider";
import { getFirebaseAuth } from "lib/firebase/client";

type Status =
  | { kind: "loading" }
  | { kind: "not-connected" }
  | {
      kind: "connected";
      scopes: string[];
      connectedAt: string;
    }
  | { kind: "error"; message: string };

export function ConnectGooglePanel() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus({ kind: "not-connected" });
      return;
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/import/google/status", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        setStatus({
          kind: "error",
          message: `Status check failed (${res.status}).`,
        });
        return;
      }
      const data = (await res.json()) as
        | { connected: false }
        | { connected: true; scopes: string[]; connectedAt: string };
      if (!data.connected) {
        setStatus({ kind: "not-connected" });
      } else {
        setStatus({
          kind: "connected",
          scopes: data.scopes,
          connectedAt: data.connectedAt,
        });
      }
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Unknown error.",
      });
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onConnect = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth?.currentUser) return;
    setBusy(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/admin/import/google/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`/start failed (${res.status}): ${text.slice(0, 200)}`);
      }
      const data = (await res.json()) as { authUrl: string };
      window.location.href = data.authUrl;
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Unknown error.",
      });
      setBusy(false);
    }
  }, []);

  if (status.kind === "loading") {
    return (
      <p className="text-xs leading-relaxed text-chrome-400">
        Checking connection state…
      </p>
    );
  }

  if (status.kind === "error") {
    return (
      <div className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-xs text-pink-200">
        {status.message}
      </div>
    );
  }

  if (status.kind === "connected") {
    return (
      <div className="flex flex-col gap-3 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-5 py-4 text-xs text-chrome-300">
        <span className="chrome-label text-emerald-300">Connected</span>
        <span>
          Connected at{" "}
          <span className="text-chrome-100">
            {new Date(status.connectedAt).toLocaleString()}
          </span>
          .
        </span>
        <span>
          Scopes:{" "}
          <span className="text-chrome-100">
            {status.scopes.length ? status.scopes.join(", ") : "(none recorded)"}
          </span>
        </span>
        <button
          type="button"
          onClick={onConnect}
          disabled={busy}
          className="self-start rounded-sm border border-chrome-400/40 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-chrome-100 transition-colors hover:border-pink-200 disabled:opacity-60"
        >
          {busy ? "Redirecting…" : "Re-connect / refresh scopes"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-5 py-4 text-xs text-chrome-300">
      <span className="chrome-label text-chrome-400">Not connected</span>
      <span>
        Google Photos broad-read scopes were turned off in March 2025; we use
        the Picker API instead. You&rsquo;ll be redirected to Google to
        approve the read-only scopes.
      </span>
      <button
        type="button"
        onClick={onConnect}
        disabled={busy}
        className="self-start rounded-sm border border-pink-200/40 bg-pink-900/20 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
      >
        {busy ? "Redirecting…" : "Connect Google"}
      </button>
    </div>
  );
}
