"use client";

/**
 * app/admin/import/google-photos/page.tsx — Operator UI for the
 * Google Photos Picker import flow.
 *
 * Flow:
 *   1. Operator clicks "Open Google Photos Picker".
 *      → POST /api/admin/import/google-photos/start → { sessionId, pickerUri }
 *      → window.open(pickerUri, "_blank") so Google's modal lives in a
 *        new tab. The current tab keeps polling.
 *   2. Poll /api/admin/import/google-photos/poll?sessionId=… every 2s.
 *      → When `mediaItemsSet: true`, the picked items list lands too.
 *   3. Operator picks subject + tags per item (or globally), ticks
 *      which items to actually import.
 *   4. Click "Import all" → POST /api/admin/import/google-photos/import
 *      → server downloads each item, calls mediaUpload(…).
 *
 * 2025 reality: the Picker API replaced the deprecated Photos Library
 * broad-read scopes. We only ever see what the operator picks.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "components/auth/auth-provider";
import type { MediaSubject } from "lib/capabilities/media/library-types";

import {
  SUBJECT_OPTIONS,
  type PickedItemRow,
  type ImportOutcome,
} from "./google-photos-types";

const POLL_MS = 2000;

export default function GooglePhotosImportPage() {
  const { user } = useAuth();
  const [session, setSession] = useState<
    | { id: string; pickerUri: string; mediaItemsSet: boolean }
    | null
  >(null);
  const [items, setItems] = useState<PickedItemRow[]>([]);
  const [subject, setSubject] = useState<MediaSubject>("photograph");
  const [tags, setTags] = useState("");
  const [splatTarget, setSplatTarget] =
    useState<"vercel-blob" | "google-drive">("google-drive");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, ImportOutcome>>({});
  const pollRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    return user.getIdToken();
  }, [user]);

  const onStart = useCallback(async () => {
    setError(null);
    setItems([]);
    setOutcomes({});
    const token = await getToken();
    if (!token) {
      setError("Sign in first.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/import/google-photos/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`start failed (${res.status}): ${t.slice(0, 200)}`);
      }
      const data = (await res.json()) as {
        sessionId: string;
        pickerUri: string;
      };
      setSession({
        id: data.sessionId,
        pickerUri: data.pickerUri,
        mediaItemsSet: false,
      });
      window.open(data.pickerUri, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start session.");
    } finally {
      setBusy(false);
    }
  }, [getToken]);

  // Poll the session for "mediaItemsSet".
  useEffect(() => {
    if (!session || session.mediaItemsSet) return;
    let cancelled = false;
    const tick = async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await fetch(
          `/api/admin/import/google-photos/poll?sessionId=${encodeURIComponent(session.id)}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          mediaItemsSet: boolean;
          mediaItems: PickedItemRow["raw"][];
        };
        if (cancelled) return;
        if (data.mediaItemsSet) {
          stopPolling();
          setSession((s) => (s ? { ...s, mediaItemsSet: true } : s));
          setItems(
            data.mediaItems.map((m) => ({
              raw: m,
              picked: true,
            })),
          );
        }
      } catch {
        // Soft-fail polling; the operator can hit "Re-poll" manually.
      }
    };
    pollRef.current = window.setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [session, getToken, stopPolling]);

  const onTogglePicked = useCallback((id: string) => {
    setItems((rows) =>
      rows.map((r) => (r.raw.id === id ? { ...r, picked: !r.picked } : r)),
    );
  }, []);

  const onSplatify = useCallback(async () => {
    if (!session) return;
    const token = await getToken();
    if (!token) {
      setError("Sign in first.");
      return;
    }
    const toSplat = items
      .filter((r) => r.picked)
      .map((r) => r.raw.id);
    if (!toSplat.length) {
      setError("Tick at least one photo to splat.");
      return;
    }
    if (
      !window.confirm(
        `Send ${toSplat.length} photo${toSplat.length === 1 ? "" : "s"} ` +
          `through SHARP? ~90s per photo on the bench GPU. The output ` +
          `lands as a research-licence splat on /research/cctv-3d-archive.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/admin/import/google-photos/to-splat",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: session.id,
            mediaItemIds: toSplat,
            target: splatTarget,
          }),
        },
      );
      const data = (await res.json()) as {
        outcomes: Array<{
          mediaItemId: string;
          ok: boolean;
          error?: string;
        }>;
      };
      const next: Record<string, ImportOutcome> = {};
      for (const o of data.outcomes ?? []) {
        next[o.mediaItemId] = o.ok
          ? { status: "ok" }
          : { status: "error", message: o.error ?? "Splat failed." };
      }
      setOutcomes(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Splat failed.");
    } finally {
      setBusy(false);
    }
  }, [getToken, items, session, splatTarget]);

  const onImportAll = useCallback(async () => {
    if (!session) return;
    const token = await getToken();
    if (!token) {
      setError("Sign in first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const toImport = items.filter((r) => r.picked).map((r) => r.raw.id);
      if (!toImport.length) {
        setError("Tick at least one item to import.");
        return;
      }
      const res = await fetch("/api/admin/import/google-photos/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: session.id,
          mediaItemIds: toImport,
          subject,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const data = (await res.json()) as {
        outcomes: Array<{ mediaItemId: string; ok: boolean; error?: string }>;
      };
      const next: Record<string, ImportOutcome> = {};
      for (const o of data.outcomes ?? []) {
        next[o.mediaItemId] = o.ok
          ? { status: "ok" }
          : { status: "error", message: o.error ?? "Unknown error." };
      }
      setOutcomes(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }, [getToken, items, session, subject, tags]);

  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-16 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-2 border-b border-warm-black-700 pb-6">
          <span className="chrome-label text-chrome-400">
            Operator console / Import / Google Photos
          </span>
          <h1 className="text-2xl uppercase tracking-[0.18em] text-chrome-100">
            Pick from Google Photos
          </h1>
          <p className="text-xs leading-relaxed text-chrome-400">
            Picker API only. Your library stays private — the studio sees only
            what you tick in Google&rsquo;s own modal.
          </p>
        </header>

        <section className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onStart}
            disabled={busy}
            className="self-start rounded-sm border border-pink-200/40 bg-pink-900/20 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
          >
            {busy ? "Working…" : "Open Google Photos Picker"}
          </button>
          {session && !session.mediaItemsSet ? (
            <p className="text-xs text-chrome-400">
              Picker open in a new tab. Waiting for your selection…
            </p>
          ) : null}
          {session?.mediaItemsSet ? (
            <p className="text-xs text-emerald-300">
              {items.length} item{items.length === 1 ? "" : "s"} picked.
            </p>
          ) : null}
        </section>

        {error ? (
          <div className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-xs text-pink-200">
            {error}
          </div>
        ) : null}

        {items.length > 0 ? (
          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3 border-b border-warm-black-700 pb-4">
              <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.18em] text-chrome-400">
                Subject
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as MediaSubject)}
                  className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-xs text-chrome-100"
                >
                  {SUBJECT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.18em] text-chrome-400">
                SHARP output
                <select
                  value={splatTarget}
                  onChange={(e) =>
                    setSplatTarget(
                      e.target.value as "vercel-blob" | "google-drive",
                    )
                  }
                  title="Where the resulting splat .ply file lands. google-drive uses your Drive's quota; vercel-blob uses the studio's 1GB Hobby cap."
                  className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-xs text-chrome-100"
                >
                  <option value="google-drive">→ Drive (your quota)</option>
                  <option value="vercel-blob">→ Vercel Blob</option>
                </select>
              </label>
              <label className="flex flex-1 flex-col gap-1 text-[10px] uppercase tracking-[0.18em] text-chrome-400">
                Tags (comma-separated)
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="manchester, golden-hour"
                  className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-xs text-chrome-100"
                />
              </label>
            </div>

            <ul className="flex flex-col divide-y divide-warm-black-700">
              {items.map(({ raw, picked }) => (
                <li
                  key={raw.id}
                  className="flex items-center gap-3 py-3 text-xs text-chrome-200"
                >
                  <input
                    type="checkbox"
                    aria-label={`Select ${raw.mediaFile?.filename ?? raw.id}`}
                    checked={picked}
                    onChange={() => onTogglePicked(raw.id)}
                  />
                  <span className="truncate text-chrome-100">
                    {raw.mediaFile?.filename ?? raw.id}
                  </span>
                  <span className="chrome-label text-chrome-500">
                    {raw.type}
                  </span>
                  <span className="ml-auto text-[10px] text-chrome-500">
                    {raw.mediaFile?.mimeType ?? "?"}
                  </span>
                  {(() => {
                    const o = outcomes[raw.id];
                    if (!o) return null;
                    return (
                      <span
                        className={
                          o.status === "ok"
                            ? "text-emerald-300"
                            : "text-pink-300"
                        }
                      >
                        {o.status === "ok"
                          ? "imported"
                          : `error: ${o.message}`}
                      </span>
                    );
                  })()}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onImportAll}
                disabled={busy}
                className="rounded-sm border border-pink-200/40 bg-pink-900/20 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
              >
                {busy ? "Working…" : "Import ticked items"}
              </button>
              <button
                type="button"
                onClick={onSplatify}
                disabled={busy}
                className="rounded-sm border border-pink-200/60 bg-pink-900/40 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
                title="Pipe each ticked photo through Apple SHARP on the studio bench. Outputs a 1.18M-gaussian splat per photo on /research/cctv-3d-archive. Research-licence only."
              >
                {busy ? "Working…" : "→ Splat-ify via SHARP"}
              </button>
            </div>
          </section>
        ) : null}

        <footer className="flex justify-between border-t border-warm-black-700 pt-4">
          <a
            href="/admin/import/google/connect"
            className="chrome-label text-chrome-500 hover:text-pink-200"
          >
            ← Connection
          </a>
          <a
            href="/admin"
            className="chrome-label text-chrome-500 hover:text-pink-200"
          >
            Operator console →
          </a>
        </footer>
      </div>
    </main>
  );
}
