"use client";

/**
 * app/admin/import/google-drive/page.tsx — Google Drive folder browser
 * for the operator import flow.
 *
 * Walks the Drive tree starting at "root". Lets the operator drill into
 * folders, tick files (image/video only by default), and import the
 * selection into the catalogue.
 *
 * "Watch this folder" is a stub: posts to /api/admin/import/google-
 * drive/watch which only records the folder id in
 * operatorIntegrations/{uid}.watchedDriveFolders[]. The cron polling
 * job is deferred.
 */

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "components/auth/auth-provider";
import type { MediaSubject } from "lib/capabilities/media/library-types";

import { SUBJECT_OPTIONS } from "../google-photos/google-photos-types";

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  thumbnailLink?: string;
  isFolder: boolean;
};

type Breadcrumb = { id: string; name: string };

type ImportOutcome =
  | { status: "ok" }
  | { status: "error"; message: string };

export default function GoogleDriveImportPage() {
  const { user } = useAuth();
  const [crumbs, setCrumbs] = useState<Breadcrumb[]>([
    { id: "root", name: "My Drive" },
  ]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mediaOnly, setMediaOnly] = useState(true);
  const [subject, setSubject] = useState<MediaSubject>("photograph");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, ImportOutcome>>({});

  const currentFolder: Breadcrumb =
    crumbs[crumbs.length - 1] ?? { id: "root", name: "My Drive" };

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    return user.getIdToken();
  }, [user]);

  const loadFolder = useCallback(
    async (folderId: string) => {
      const token = await getToken();
      if (!token) return;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/import/google-drive/list?folderId=${encodeURIComponent(folderId)}&mediaOnly=${mediaOnly ? "1" : "0"}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
        );
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(`list failed (${res.status}): ${t.slice(0, 200)}`);
        }
        const data = (await res.json()) as { files: DriveFile[] };
        setFiles(data.files ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "List failed.");
      } finally {
        setBusy(false);
      }
    },
    [getToken, mediaOnly],
  );

  useEffect(() => {
    void loadFolder(currentFolder.id);
  }, [currentFolder.id, loadFolder]);

  const onEnterFolder = useCallback((f: DriveFile) => {
    setSelected(new Set());
    setCrumbs((cs) => [...cs, { id: f.id, name: f.name }]);
  }, []);

  const onCrumbClick = useCallback((idx: number) => {
    setSelected(new Set());
    setCrumbs((cs) => cs.slice(0, idx + 1));
  }, []);

  const onToggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onImportSelected = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setError("Sign in first.");
      return;
    }
    if (selected.size === 0) {
      setError("Tick at least one file.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/import/google-drive/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileIds: Array.from(selected),
          subject,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const data = (await res.json()) as {
        outcomes: Array<{ fileId: string; ok: boolean; error?: string }>;
      };
      const next: Record<string, ImportOutcome> = {};
      for (const o of data.outcomes ?? []) {
        next[o.fileId] = o.ok
          ? { status: "ok" }
          : { status: "error", message: o.error ?? "Unknown error." };
      }
      setOutcomes(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }, [getToken, selected, subject, tags]);

  const onWatchFolder = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      await fetch("/api/admin/import/google-drive/watch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderId: currentFolder.id }),
      });
    } catch {
      // Best-effort; watch is deferred-cron territory.
    }
  }, [currentFolder.id, getToken]);

  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-16 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-2 border-b border-warm-black-700 pb-6">
          <span className="chrome-label text-chrome-400">
            Operator console / Import / Google Drive
          </span>
          <h1 className="text-2xl uppercase tracking-[0.18em] text-chrome-100">
            Browse Google Drive
          </h1>
          <p className="text-xs leading-relaxed text-chrome-400">
            Walk a folder. Tick images / videos. Import. The drive.readonly
            scope means nothing in the studio writes back to Drive.
          </p>
        </header>

        <nav className="flex flex-wrap items-center gap-2 text-xs text-chrome-300">
          {crumbs.map((c, i) => (
            <span key={c.id} className="flex items-center gap-2">
              {i > 0 ? <span className="text-chrome-500">/</span> : null}
              <button
                type="button"
                onClick={() => onCrumbClick(i)}
                className="text-chrome-200 hover:text-pink-200"
              >
                {c.name}
              </button>
            </span>
          ))}
          <label className="ml-auto flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-chrome-400">
            <input
              type="checkbox"
              checked={mediaOnly}
              onChange={(e) => setMediaOnly(e.target.checked)}
            />
            media only
          </label>
          <button
            type="button"
            onClick={onWatchFolder}
            className="chrome-label text-chrome-500 hover:text-pink-200"
          >
            ☆ Watch this folder
          </button>
        </nav>

        {error ? (
          <div className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-xs text-pink-200">
            {error}
          </div>
        ) : null}

        <section className="rounded-sm border border-warm-black-700 bg-warm-black-900/40">
          {busy && files.length === 0 ? (
            <p className="px-4 py-3 text-xs text-chrome-400">Loading…</p>
          ) : files.length === 0 ? (
            <p className="px-4 py-3 text-xs text-chrome-400">
              No items in this folder{mediaOnly ? " (filtered to media)" : ""}.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-warm-black-700">
              {files.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-3 px-4 py-2 text-xs text-chrome-200"
                >
                  {f.isFolder ? (
                    <button
                      type="button"
                      onClick={() => onEnterFolder(f)}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      <span className="text-pink-200">📁</span>
                      <span className="text-chrome-100">{f.name}</span>
                    </button>
                  ) : (
                    <>
                      <input
                        type="checkbox"
                        aria-label={`Select ${f.name}`}
                        checked={selected.has(f.id)}
                        onChange={() => onToggle(f.id)}
                      />
                      <span className="truncate text-chrome-100">{f.name}</span>
                      <span className="ml-auto text-[10px] text-chrome-500">
                        {f.mimeType}
                      </span>
                      {(() => {
                        const o = outcomes[f.id];
                        if (!o) return null;
                        return (
                          <span
                            className={
                              o.status === "ok"
                                ? "text-emerald-300"
                                : "text-pink-300"
                            }
                          >
                            {o.status === "ok" ? "imported" : "error"}
                          </span>
                        );
                      })()}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-wrap items-end gap-3 border-t border-warm-black-700 pt-4">
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
          <label className="flex flex-1 flex-col gap-1 text-[10px] uppercase tracking-[0.18em] text-chrome-400">
            Tags (comma-separated)
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="codex, sculpture"
              className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-xs text-chrome-100"
            />
          </label>
          <button
            type="button"
            onClick={onImportSelected}
            disabled={busy || selected.size === 0}
            className="rounded-sm border border-pink-200/40 bg-pink-900/20 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
          >
            {busy
              ? "Importing…"
              : `Import ${selected.size} selected`}
          </button>
        </section>

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
