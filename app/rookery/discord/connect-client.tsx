"use client";

import { use, useEffect, useState } from "react";

import { useAuth } from "components/auth/auth-provider";

type LinkStatus =
  | "loading"
  | "no-auth"
  | "unconfigured"
  | "not-linked"
  | "linked"
  | "linked-pending-invite"
  | "linked-sync-failed"
  | "error";

const FRIENDLY: Record<
  Exclude<LinkStatus, "loading" | "unconfigured" | "error">,
  { headline: string; line: string }
> = {
  "no-auth": {
    headline: "Sign in first",
    line: "You need to be signed in to the Rookery before you can link Discord.",
  },
  "not-linked": {
    headline: "Not linked yet",
    line: "Click Connect Discord to hand off to Discord's OAuth screen.",
  },
  linked: {
    headline: "Linked",
    line: "Your Discord is connected and your role is up to date.",
  },
  "linked-pending-invite": {
    headline: "Linked — but you're not in the server yet",
    line: "Join the Holo-Flow Studio server using the invite below, then click Re-sync to drop your role in.",
  },
  "linked-sync-failed": {
    headline: "Linked — but the role didn't apply",
    line: "Something went wrong on the role-grant side. Try Re-sync. If it persists, email contact@holoflow.co.uk.",
  },
};

export function ConnectDiscordClient({
  searchParams,
}: {
  searchParams: Promise<{ discord?: string; reason?: string }>;
}) {
  const params = use(searchParams);
  const { user, loading, configured } = useAuth();
  const [linked, setLinked] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const initialOutcome: string | null = params.discord ?? null;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const token = await user.getIdTokenResult(true);
      if (cancelled) return;
      const c = token.claims as unknown as Record<string, unknown>;
      setLinked(typeof c.discord_user_id === "string" && c.discord_user_id.length > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    // Surface the public invite URL via a read-only endpoint. We don't
    // hard-code it into the bundle so rotating the invite doesn't
    // require a redeploy.
    fetch("/api/discord/invite-url", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { url?: string } | null) => {
        if (j?.url) setInviteUrl(j.url);
      })
      .catch(() => {});
  }, []);

  const status: LinkStatus = (() => {
    if (!configured) return "unconfigured";
    if (loading || linked === null) return "loading";
    if (!user) return "no-auth";
    if (!linked) return "not-linked";
    if (initialOutcome === "pending-invite") return "linked-pending-invite";
    if (initialOutcome === "linked-sync-failed") return "linked-sync-failed";
    if (initialOutcome === "error") return "error";
    return "linked";
  })();

  const onConnect = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const here = typeof window !== "undefined" ? window.location.pathname : "/rookery/discord";
      const url = `/api/discord/oauth/start?return=${encodeURIComponent(here)}&id_token=${encodeURIComponent(idToken)}`;
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the link.");
      setBusy(false);
    }
  };

  const onResync = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/discord/resync", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        deferred?: boolean;
        reason?: string;
        error?: string;
      };
      if (!res.ok || !body.ok) {
        throw new Error(body.error ?? `Resync failed (${res.status})`);
      }
      if (body.deferred && body.reason === "user-not-in-guild") {
        setError("You're not in the studio server yet. Use the invite below, then re-sync.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resync failed.");
    } finally {
      setBusy(false);
    }
  };

  const onDisconnect = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/discord/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Disconnect failed (${res.status})`);
      }
      await user.getIdToken(true);
      setLinked(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disconnect failed.");
    } finally {
      setBusy(false);
    }
  };

  if (status === "unconfigured") {
    return (
      <div className="mt-10 rounded border border-chrome-700 p-6 text-chrome-300">
        Auth isn&rsquo;t wired in this environment.
      </div>
    );
  }
  if (status === "loading") {
    return <div className="mt-10 text-chrome-400">Checking your sign-in&hellip;</div>;
  }
  if (status === "no-auth") {
    return (
      <div className="mt-10 rounded border border-chrome-700 p-6 text-chrome-300">
        Sign in to the Rookery first, then come back here to link Discord.
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="mt-10 rounded border border-pink-300/40 bg-pink-300/5 p-6">
        <p className="text-pink-200">
          The link didn&rsquo;t complete. Reason:&nbsp;
          <code className="text-chrome-200">{params.reason ?? "unknown"}</code>.
          Try again, and if it keeps failing, email contact@holoflow.co.uk.
        </p>
        <button
          type="button"
          onClick={onConnect}
          disabled={busy}
          className="mt-4 rounded bg-pink-200 px-6 py-3 text-warm-black-950 text-sm hover:bg-pink-100 disabled:opacity-50"
        >
          Try again
        </button>
      </div>
    );
  }

  const meta = FRIENDLY[status];

  return (
    <div className="mt-10 space-y-6">
      <div className="rounded border border-pink-300/40 bg-pink-300/5 p-6">
        <div className="chrome-label text-pink-200">{meta.headline}</div>
        <p className="mt-3 text-chrome-100">{meta.line}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {status === "not-linked" ? (
            <button
              type="button"
              onClick={onConnect}
              disabled={busy}
              className="rounded bg-pink-200 px-6 py-3 text-warm-black-950 text-sm hover:bg-pink-100 disabled:opacity-50"
            >
              {busy ? "Heading to Discord…" : "Connect Discord"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onResync}
                disabled={busy}
                className="rounded border border-chrome-600 px-4 py-2 text-chrome-200 text-sm hover:border-chrome-300 disabled:opacity-50"
              >
                {busy ? "Re-syncing…" : "Re-sync role"}
              </button>
              <button
                type="button"
                onClick={onDisconnect}
                disabled={busy}
                className="rounded border border-chrome-700 px-4 py-2 text-chrome-400 text-sm hover:border-chrome-300 disabled:opacity-50"
              >
                Disconnect
              </button>
            </>
          )}
        </div>

        {inviteUrl && (status === "linked-pending-invite" || status === "linked-sync-failed") ? (
          <p className="mt-4 text-chrome-300 text-sm">
            Server invite:&nbsp;
            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-pink-200"
            >
              {inviteUrl}
            </a>
          </p>
        ) : null}
      </div>

      {error ? <p className="text-pink-300 text-sm">{error}</p> : null}
    </div>
  );
}
