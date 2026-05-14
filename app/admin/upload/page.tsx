"use client";

/**
 * app/admin/upload/page.tsx — Operator drag-and-drop ingest.
 *
 * Slim orchestrator: drop zone + queue header + row list. Per-file
 * metadata form lives in `./upload-row-card`; per-row status indicator
 * in `./upload-status-pill`. The actual XHR upload + FormData building
 * live in `./upload-pipeline`. Local types + enum lists in
 * `./upload-types`.
 *
 * Voice: catalogue / archival. Single Princess-teaching sentence in
 * the hero — everything else is dispassionate.
 */

import { useMemo, useRef, useState } from "react";

import { useAuth } from "components/auth/auth-provider";
import { getFirebaseAuth } from "lib/firebase/client";

import { uploadRow, makeRow } from "./upload-pipeline";
import { RowCard } from "./upload-row-card";
import type { Row, RowStatus } from "./upload-types";

export default function AdminUploadPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const queuedCount = useMemo(
    () => rows.filter((r) => r.status.kind === "queued").length,
    [rows],
  );

  const addFiles = (files: FileList | File[]) => {
    const incoming = Array.from(files);
    if (incoming.length === 0) return;
    setRows((prev) => [...prev, ...incoming.map(makeRow)]);
  };

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  };

  const setStatus = (id: string, status: RowStatus) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    );
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const uploadAll = async () => {
    const auth = getFirebaseAuth();
    if (!auth || !user) return;
    setBusy(true);
    try {
      const idToken = await user.getIdToken();
      // Snapshot the queued rows so adds during upload don't surprise us.
      const queue = rows.filter((r) => r.status.kind === "queued");
      for (const row of queue) {
        setStatus(row.id, { kind: "uploading", percent: 0 });
        try {
          const { id, url } = await uploadRow(row, idToken, (percent) => {
            setStatus(row.id, { kind: "uploading", percent });
          });
          setStatus(row.id, { kind: "done", id, url });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload failed";
          setStatus(row.id, { kind: "failed", message });
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-12 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-3 border-b border-warm-black-700 pb-6">
          <div className="flex items-center justify-between">
            <span className="chrome-label text-chrome-400">
              Operator &middot; upload
            </span>
            <a
              href="/admin"
              className="chrome-label text-chrome-500 hover:text-pink-200"
            >
              &larr; Console
            </a>
          </div>
          <h1 className="text-2xl uppercase tracking-[0.18em] text-chrome-100">
            Ingest media
          </h1>
          <p className="text-sm leading-relaxed text-chrome-300">
            Every photograph wants a home before it goes out. Tag it now and
            the rest of the site will know what to do with it.
          </p>
        </header>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
          className={`flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-6 py-8 text-center transition-colors ${
            isDragOver
              ? "border-pink-200 bg-warm-black-900/60"
              : "border-warm-black-700 bg-warm-black-950"
          }`}
        >
          <span className="chrome-label text-chrome-400">Drop zone</span>
          <p className="text-xs leading-relaxed text-chrome-300">
            Drag files here, or
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-2 text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
          >
            Choose files
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              if (inputRef.current) inputRef.current.value = "";
            }}
          />
        </div>

        {rows.length > 0 ? (
          <>
            <div className="flex items-center justify-between border-b border-warm-black-700 pb-3">
              <span className="chrome-label text-chrome-400">
                Queue &middot; {rows.length} file{rows.length === 1 ? "" : "s"}
                {queuedCount > 0 ? ` · ${queuedCount} pending` : ""}
              </span>
              <button
                type="button"
                onClick={uploadAll}
                disabled={busy || queuedCount === 0 || !user}
                className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-2 text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20 disabled:opacity-50"
              >
                {busy ? "Uploading…" : "Upload all"}
              </button>
            </div>

            <ul className="flex flex-col gap-4">
              {rows.map((row) => (
                <RowCard
                  key={row.id}
                  row={row}
                  onChange={(patch) => updateRow(row.id, patch)}
                  onRemove={() => removeRow(row.id)}
                />
              ))}
            </ul>
          </>
        ) : (
          <p className="text-xs leading-relaxed text-chrome-500">
            Nothing in the queue. Drop some files above to begin.
          </p>
        )}
      </div>
    </main>
  );
}
