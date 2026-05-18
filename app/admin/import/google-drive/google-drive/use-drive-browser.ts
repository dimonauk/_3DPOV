"use client";

/**
 * app/admin/import/google-drive/google-drive/use-drive-browser.ts —
 * Owner-side state machine for the operator Drive importer.
 *
 * Owns: breadcrumbs + listed files, selection set, all the filter
 * + import-config knobs (mediaOnly, printFilter, subject, tags,
 * mode, preset, splatTarget), the paste-URL buffer, busy + error
 * flags, and the cumulative per-file outcomes map.
 *
 * Exposes the handlers — loadFolder, onEnterFolder, onCrumbClick,
 * onToggle, onImportSelected, onSplatify, onImportPasted,
 * onWatchFolder — and bounces everything through the Firebase ID
 * token.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1.
 */

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "components/auth/auth-provider";
import type { MediaSubject } from "lib/capabilities/media/library-types";

import type {
  Breadcrumb,
  DriveFile,
  ImportMode,
  ImportOutcome,
  ImportPreset,
  PrintFilter,
  SplatTarget,
} from "./types";

export function useDriveBrowser() {
  const { user } = useAuth();
  const [crumbs, setCrumbs] = useState<Breadcrumb[]>([
    { id: "root", name: "My Drive" },
  ]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mediaOnly, setMediaOnly] = useState(true);
  const [printFilter, setPrintFilter] = useState<PrintFilter>("all");
  const [subject, setSubject] = useState<MediaSubject>("photograph");
  const [tags, setTags] = useState("");
  const [mode, setMode] = useState<ImportMode>("keep-on-drive");
  const [preset, setPreset] = useState<ImportPreset>("");
  const [pasteUrls, setPasteUrls] = useState("");
  const [splatTarget, setSplatTarget] = useState<SplatTarget>("google-drive");
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
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
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

  const runImport = useCallback(
    async (fileIds: string[]) => {
      const token = await getToken();
      if (!token) {
        setError("Sign in first.");
        return;
      }
      if (fileIds.length === 0) {
        setError("No files to import.");
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
            fileIds,
            subject,
            mode,
            ...(preset ? { preset } : {}),
            tags: tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
          }),
        });
        const data = (await res.json()) as {
          outcomes: Array<{ fileId: string; ok: boolean; error?: string }>;
        };
        const next: Record<string, ImportOutcome> = { ...outcomes };
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
    },
    [getToken, mode, outcomes, preset, subject, tags],
  );

  const onImportSelected = useCallback(async () => {
    if (selected.size === 0) {
      setError("Tick at least one file.");
      return;
    }
    void runImport(Array.from(selected));
  }, [runImport, selected]);

  const onSplatify = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setError("Sign in first.");
      return;
    }
    const fileIds = Array.from(selected);
    if (fileIds.length === 0) {
      setError("Tick at least one image to splat.");
      return;
    }
    if (
      !window.confirm(
        `Send ${fileIds.length} file${fileIds.length === 1 ? "" : "s"} ` +
          `through SHARP? ~90s per image on the bench GPU. The output ` +
          `lands as a research-licence splat on /research/cctv-3d-archive.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/import/google-drive/to-splat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileIds, target: splatTarget }),
      });
      const data = (await res.json()) as {
        outcomes: Array<{ fileId: string; ok: boolean; error?: string }>;
      };
      const next: Record<string, ImportOutcome> = { ...outcomes };
      for (const o of data.outcomes ?? []) {
        next[o.fileId] = o.ok
          ? { status: "ok" }
          : { status: "error", message: o.error ?? "Splat failed." };
      }
      setOutcomes(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Splat failed.");
    } finally {
      setBusy(false);
    }
  }, [getToken, outcomes, selected, splatTarget]);

  const onImportPasted = useCallback(async () => {
    // Accept a mix of bare file ids, share URLs, and full Drive URLs;
    // pull out the id from each line.
    const lines = pasteUrls
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const ids: string[] = [];
    for (const line of lines) {
      // Drive URLs come in three shapes:
      //   https://drive.google.com/file/d/<ID>/view
      //   https://drive.google.com/open?id=<ID>
      //   https://drive.google.com/uc?id=<ID>
      let m = line.match(/\/file\/d\/([^/?#]+)/);
      if (!m) m = line.match(/[?&]id=([^&]+)/);
      const id = m ? m[1] : line;
      if (id && !ids.includes(id)) ids.push(id);
    }
    if (ids.length === 0) {
      setError("No valid Drive URLs or file ids found.");
      return;
    }
    setPasteUrls("");
    void runImport(ids);
  }, [pasteUrls, runImport]);

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

  return {
    crumbs,
    files,
    selected,
    mediaOnly,
    setMediaOnly,
    printFilter,
    setPrintFilter,
    subject,
    setSubject,
    tags,
    setTags,
    mode,
    setMode,
    preset,
    setPreset,
    pasteUrls,
    setPasteUrls,
    splatTarget,
    setSplatTarget,
    busy,
    error,
    outcomes,
    currentFolder,
    onEnterFolder,
    onCrumbClick,
    onToggle,
    onImportSelected,
    onSplatify,
    onImportPasted,
    onWatchFolder,
  };
}
