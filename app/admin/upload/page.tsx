"use client";

/**
 * app/admin/upload/page.tsx — Operator drag-and-drop ingest.
 *
 * Multipart-POSTs each file to `/api/admin/media/upload` with the file
 * and per-file metadata fields. Tracks queued / uploading / done /
 * failed states per row. Fetch's body stream doesn't give us a
 * universal progress callback; an XHR upload is used so the operator
 * can watch a real progress bar move.
 *
 * Voice: catalogue / archival. Single Princess-teaching sentence in
 * the hero — everything else is dispassionate.
 */

import { useMemo, useRef, useState } from "react";
import { useAuth } from "components/auth/auth-provider";
import { getFirebaseAuth } from "lib/firebase/client";
import type {
  MediaKind,
  MediaSubject,
} from "lib/capabilities/media/library-types";

const SUBJECTS: MediaSubject[] = [
  "photograph",
  "aerial",
  "holo-walk",
  "codex",
  "article",
  "journal",
  "tutorial",
  "product",
  "rookery",
  "press",
  "other",
];

const KINDS: MediaKind[] = [
  "photo",
  "photo-single-exposure",
  "video",
  "360-photo",
  "360-video",
  "sbs-stereo-mp4",
  "usdz",
  "glb",
  "ply",
  "audio",
  "pdf",
  "other",
];

type RowStatus =
  | { kind: "queued" }
  | { kind: "uploading"; percent: number }
  | { kind: "done"; url: string; id: string }
  | { kind: "failed"; message: string };

type Row = {
  id: string;
  file: File;
  title: string;
  description: string;
  subject: MediaSubject;
  mediaKind: MediaKind;
  capturedAt: string;
  tags: string;
  locationSlug: string;
  locationName: string;
  locationLat: string;
  locationLng: string;
  status: RowStatus;
};

/** Best-guess kind from MIME / extension. Operator can override. */
function inferKind(file: File): MediaKind {
  const mime = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "photo";
  if (name.endsWith(".glb") || name.endsWith(".gltf")) return "glb";
  if (name.endsWith(".usdz")) return "usdz";
  if (name.endsWith(".ply") || name.endsWith(".splat")) return "ply";
  return "other";
}

function makeRow(file: File): Row {
  const titleFromName = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    title: titleFromName,
    description: "",
    subject: "photograph",
    mediaKind: inferKind(file),
    capturedAt: "",
    tags: "",
    locationSlug: "",
    locationName: "",
    locationLat: "",
    locationLng: "",
    status: { kind: "queued" },
  };
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

async function uploadRow(
  row: Row,
  idToken: string,
  onProgress: (percent: number) => void,
): Promise<{ id: string; url: string }> {
  const fd = new FormData();
  fd.append("file", row.file, row.file.name);
  fd.append("filename", row.file.name);
  fd.append("mimeType", row.file.type || "application/octet-stream");
  fd.append("subject", row.subject);
  fd.append("kind", row.mediaKind);
  if (row.title.trim()) fd.append("title", row.title.trim());
  if (row.description.trim()) fd.append("description", row.description.trim());
  if (row.capturedAt) fd.append("capturedAt", new Date(row.capturedAt).toISOString());
  const tagList = row.tags
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (tagList.length > 0) fd.append("tags", tagList.join(","));
  const location: Record<string, unknown> = {};
  if (row.locationSlug.trim()) location["slug"] = row.locationSlug.trim();
  if (row.locationName.trim()) location["name"] = row.locationName.trim();
  if (row.locationLat.trim()) {
    const lat = Number(row.locationLat);
    if (Number.isFinite(lat)) location["lat"] = lat;
  }
  if (row.locationLng.trim()) {
    const lng = Number(row.locationLng);
    if (Number.isFinite(lng)) location["lng"] = lng;
  }
  if (Object.keys(location).length > 0) {
    fd.append("location-json", JSON.stringify(location));
  }

  return new Promise<{ id: string; url: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media/upload", true);
    xhr.setRequestHeader("Authorization", `Bearer ${idToken}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as
          | { media: { id: string; url: string } }
          | { error: string };
        if (xhr.status >= 200 && xhr.status < 300 && "media" in body) {
          resolve({ id: body.media.id, url: body.media.url });
        } else {
          const message =
            "error" in body && typeof body.error === "string"
              ? body.error
              : `HTTP ${xhr.status}`;
          reject(new Error(message));
        }
      } catch {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };
    xhr.send(fd);
  });
}

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
    if (!auth || !user) {
      return;
    }
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
            <span className="chrome-label text-chrome-400">Operator · upload</span>
            <a
              href="/admin"
              className="chrome-label text-chrome-500 hover:text-pink-200"
            >
              ← Console
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
                Queue · {rows.length} file{rows.length === 1 ? "" : "s"}
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

function RowCard({
  row,
  onChange,
  onRemove,
}: {
  row: Row;
  onChange: (patch: Partial<Row>) => void;
  onRemove: () => void;
}) {
  const disabled =
    row.status.kind === "uploading" || row.status.kind === "done";

  return (
    <li className="rounded-sm border border-warm-black-700 bg-warm-black-950 p-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex flex-col gap-2 lg:w-64 lg:shrink-0">
          <span className="chrome-label text-chrome-400">File</span>
          <span className="break-all text-xs text-chrome-100">
            {row.file.name}
          </span>
          <span className="chrome-label text-chrome-500">
            {row.file.type || "unknown"} · {formatBytes(row.file.size)}
          </span>
          <StatusPill status={row.status} />
          {row.status.kind === "queued" ? (
            <button
              type="button"
              onClick={onRemove}
              className="chrome-label self-start text-chrome-500 hover:text-pink-200"
            >
              Remove
            </button>
          ) : null}
        </div>

        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Title">
            <input
              type="text"
              value={row.title}
              disabled={disabled}
              onChange={(e) => onChange({ title: e.target.value })}
              className="w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-xs text-chrome-100 focus:border-pink-200 focus:outline-none disabled:opacity-60"
            />
          </Field>
          <Field label="Subject">
            <select
              value={row.subject}
              disabled={disabled}
              onChange={(e) =>
                onChange({ subject: e.target.value as MediaSubject })
              }
              className="w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-xs text-chrome-100 focus:border-pink-200 focus:outline-none disabled:opacity-60"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kind">
            <select
              value={row.mediaKind}
              disabled={disabled}
              onChange={(e) =>
                onChange({ mediaKind: e.target.value as MediaKind })
              }
              className="w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-xs text-chrome-100 focus:border-pink-200 focus:outline-none disabled:opacity-60"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Captured at">
            <input
              type="date"
              value={row.capturedAt}
              disabled={disabled}
              onChange={(e) => onChange({ capturedAt: e.target.value })}
              className="w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-xs text-chrome-100 focus:border-pink-200 focus:outline-none disabled:opacity-60"
            />
          </Field>
          <Field label="Description" className="md:col-span-2">
            <textarea
              value={row.description}
              disabled={disabled}
              rows={2}
              onChange={(e) => onChange({ description: e.target.value })}
              className="w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-xs text-chrome-100 focus:border-pink-200 focus:outline-none disabled:opacity-60"
            />
          </Field>
          <Field label="Tags (comma-separated)" className="md:col-span-2">
            <input
              type="text"
              value={row.tags}
              disabled={disabled}
              placeholder="poi, salford, single-exposure"
              onChange={(e) => onChange({ tags: e.target.value })}
              className="w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-xs text-chrome-100 placeholder:text-chrome-600 focus:border-pink-200 focus:outline-none disabled:opacity-60"
            />
          </Field>
          <Field label="Location slug">
            <input
              type="text"
              value={row.locationSlug}
              disabled={disabled}
              onChange={(e) => onChange({ locationSlug: e.target.value })}
              className="w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-xs text-chrome-100 focus:border-pink-200 focus:outline-none disabled:opacity-60"
            />
          </Field>
          <Field label="Location name">
            <input
              type="text"
              value={row.locationName}
              disabled={disabled}
              onChange={(e) => onChange({ locationName: e.target.value })}
              className="w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-xs text-chrome-100 focus:border-pink-200 focus:outline-none disabled:opacity-60"
            />
          </Field>
          <Field label="Latitude">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={row.locationLat}
              disabled={disabled}
              onChange={(e) => onChange({ locationLat: e.target.value })}
              className="w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-xs text-chrome-100 focus:border-pink-200 focus:outline-none disabled:opacity-60"
            />
          </Field>
          <Field label="Longitude">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={row.locationLng}
              disabled={disabled}
              onChange={(e) => onChange({ locationLng: e.target.value })}
              className="w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-xs text-chrome-100 focus:border-pink-200 focus:outline-none disabled:opacity-60"
            />
          </Field>
        </div>
      </div>
    </li>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="chrome-label text-chrome-500">{label}</span>
      {children}
    </label>
  );
}

function StatusPill({ status }: { status: RowStatus }) {
  if (status.kind === "queued") {
    return (
      <span className="chrome-label text-chrome-500">Queued</span>
    );
  }
  if (status.kind === "uploading") {
    return (
      <div className="flex flex-col gap-1">
        <span className="chrome-label text-pink-200">
          Uploading · {status.percent}%
        </span>
        <div
          className="h-1 w-full rounded-full bg-warm-black-800"
          aria-label="upload progress"
        >
          <div
            className="h-full rounded-full bg-pink-200"
            style={{ width: `${status.percent}%` }}
          />
        </div>
      </div>
    );
  }
  if (status.kind === "done") {
    return (
      <div className="flex flex-col gap-1">
        <span className="chrome-label text-mint-300">Done</span>
        <a
          href={status.url}
          target="_blank"
          rel="noreferrer"
          className="break-all text-[0.65rem] text-chrome-400 hover:text-pink-200"
        >
          {status.url}
        </a>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="chrome-label text-pink-300">Failed</span>
      <span className="text-[0.65rem] text-pink-300">{status.message}</span>
    </div>
  );
}
