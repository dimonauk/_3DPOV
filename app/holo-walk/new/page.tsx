"use client";

/**
 * app/holo-walk/new/page.tsx — Operator "add a sculpture" page.
 *
 * Admin-guarded by the runtime check (`useAuth` + an allow-list on the
 * `/api/holo-walk/generate-splat` route). Visitors who aren't signed-
 * in operators see the sign-in nudge; everyone else sees the upload
 * form.
 *
 * Flow:
 *   1. Operator picks a 360 MP4 / OSV / video file, types a label,
 *      optionally pastes GPS coords.
 *   2. POST to `/api/holo-walk/generate-splat`. The route uploads the
 *      video, calls the `viz.splat-generate` capability with the
 *      `hangar-gsplat` provider, then writes a row to the dynamic
 *      sculpture store.
 *   3. We surface the status pill + the bench job id + the resulting
 *      splat URL. On success we send the operator straight to the
 *      HoloWalk gallery so they can see their addition in context.
 *
 * The status copy is deliberately blunt:
 *   - "training splat… typically 5-10 minutes"
 *   - queued · running · done · error, with the job id rendered for
 *     diagnostics.
 */

import { useAuth } from "components/auth/auth-provider";
import { getFirebaseAuth } from "lib/firebase/client";
import { createLogger } from "lib/log";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const log = createLogger("route:/holo-walk:splat-generate");

type Status =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "training"; jobId?: string }
  | {
      kind: "done";
      sculptureId: string;
      plyUrl: string;
      gaussianCount: number;
      jobId?: string;
    }
  | { kind: "error"; message: string; stage?: string; jobId?: string };

type ApiResponse = {
  sculpture?: {
    id: string;
    label: string;
    plyUrl?: string;
    gaussianCount?: number;
    jobId?: string;
  };
  splat?: {
    plyUrl: string;
    gaussianCount: number;
    meta: Record<string, unknown>;
  };
  error?: string;
  stage?: string;
  code?: string;
};

export default function HoloWalkNewSculpturePage() {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [label, setLabel] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // Abort the in-flight POST if the operator navigates away mid-train.
  // Without this, the request keeps streaming bytes server-side AND
  // the bench-side splat job continues; the route's maxDuration=800
  // means we'd otherwise tie up a function instance for ~13 min after
  // the operator has visibly moved on.
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const isBusy = status.kind === "uploading" || status.kind === "training";

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const auth = getFirebaseAuth();
    if (!auth || !user) return;
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setStatus({
        kind: "error",
        message: "Pick a 360 video file before hitting upload.",
      });
      return;
    }
    if (!label.trim()) {
      setStatus({
        kind: "error",
        message: "A label is required — the gallery needs something to call it.",
      });
      return;
    }

    setStatus({ kind: "uploading" });
    log.info("starting upload", {
      filename: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
      hasGps: lat.trim() !== "" && lon.trim() !== "",
    });

    let idToken: string;
    try {
      idToken = await user.getIdToken();
    } catch (err) {
      setStatus({
        kind: "error",
        message: `Could not refresh sign-in token: ${err instanceof Error ? err.message : String(err)}`,
      });
      return;
    }

    const fd = new FormData();
    fd.set("file", file, file.name);
    fd.set("filename", file.name);
    if (file.type) fd.set("mimeType", file.type);
    fd.set("label", label.trim());
    if (lat.trim()) fd.set("lat", lat.trim());
    if (lon.trim()) fd.set("lon", lon.trim());

    // The capability flips to "training" once the upload portion is
    // done and the bench job is in flight. Without an SSE channel we
    // optimistically show "training" the moment the POST is sent —
    // the actual bench job typically dominates the wall-clock time.
    setStatus({ kind: "training" });

    // Replace any prior controller (e.g. a previous failed submit
    // that the operator is retrying). Cancel-then-abandon is fine
    // here — the previous request's response, if any, is discarded.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let res: Response;
    try {
      res = await fetch("/api/holo-walk/generate-splat", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: fd,
        signal: controller.signal,
      });
    } catch (err) {
      // Distinguish operator-cancel (unmount, resubmit) from real
      // network failure so we don't surface a spurious error toast
      // for a user-initiated abort.
      if (err instanceof DOMException && err.name === "AbortError") {
        log.info("upload aborted");
        return;
      }
      const message =
        err instanceof Error ? err.message : "Network error during upload.";
      log.error("upload network error", { message });
      setStatus({ kind: "error", message });
      return;
    }

    let body: ApiResponse;
    try {
      body = (await res.json()) as ApiResponse;
    } catch {
      // Salvage whatever text came back — Next sometimes returns an
      // HTML 500 page on uncaught route errors, which the JSON parse
      // hides. Cap at 500 chars so a giant HTML body doesn't fill the
      // status pill.
      let snippet = "";
      try {
        snippet = (await res.text()).slice(0, 500);
      } catch {
        // body already consumed by the .json() attempt above
      }
      const message = snippet
        ? `Server returned non-JSON (${res.status}): ${snippet}`
        : `Server returned non-JSON response (${res.status}).`;
      log.error("non-json response", { status: res.status, snippet });
      setStatus({ kind: "error", message });
      return;
    }

    if (!res.ok || !body.sculpture || !body.splat) {
      const message = body.error ?? `Upload failed (${res.status}).`;
      const jobId =
        body.splat &&
        typeof (body.splat.meta as { jobId?: unknown })?.jobId === "string"
          ? ((body.splat.meta as { jobId: string }).jobId)
          : body.sculpture?.jobId;
      log.error("upload failed", {
        status: res.status,
        stage: body.stage ?? null,
        message,
      });
      setStatus({
        kind: "error",
        message,
        ...(body.stage ? { stage: body.stage } : {}),
        ...(jobId ? { jobId } : {}),
      });
      return;
    }

    const jobId =
      typeof (body.splat.meta as { jobId?: unknown }).jobId === "string"
        ? ((body.splat.meta as { jobId: string }).jobId)
        : undefined;

    log.info("done", {
      sculptureId: body.sculpture.id,
      plyUrl: body.splat.plyUrl,
      gaussianCount: body.splat.gaussianCount,
      jobId: jobId ?? null,
    });

    setStatus({
      kind: "done",
      sculptureId: body.sculpture.id,
      plyUrl: body.splat.plyUrl,
      gaussianCount: body.splat.gaussianCount,
      ...(jobId ? { jobId } : {}),
    });
  };

  return (
    <article className="mx-auto max-w-2xl px-6 py-20 md:py-28">
      <Link
        href="/holo-walk"
        className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
      >
        &larr; HoloWalk
      </Link>
      <h1 className="mt-8 text-4xl leading-[1.05] md:text-5xl">
        Add a sculpture.
      </h1>
      <p className="mt-4 max-w-md text-chrome-300">
        Drop a 360 video. The bench trains a Gaussian Splat from it and
        lands the result in the gallery. Typically five to ten minutes
        per piece; the job id stays visible while it runs.
      </p>

      {loading ? (
        <p className="mt-10 chrome-label text-chrome-500">
          Checking your perch&hellip;
        </p>
      ) : !configured ? (
        <div className="mt-10 rounded-sm border border-warm-black-800 bg-warm-black-900/60 p-6">
          <div className="chrome-label">Auth not configured</div>
          <p className="mt-3 text-sm text-chrome-300">
            Firebase auth env vars are missing on this build. Operator
            actions are disabled until the project env is wired.
          </p>
        </div>
      ) : !user ? (
        <div className="mt-10 rounded-sm border border-warm-black-800 bg-warm-black-900/60 p-6">
          <div className="chrome-label">Signed-out</div>
          <h2 className="mt-2 text-xl text-chrome-100">
            Operator sign-in required.
          </h2>
          <p className="mt-3 text-sm text-chrome-300">
            This is an admin route — only the operator allow-list can
            upload sculptures. Sign in with the allowed Google account.
          </p>
          <div className="mt-5">
            <Link
              href="/signin"
              className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-3 chrome-label text-pink-200 transition-colors hover:bg-pink-200/20"
            >
              Sign in &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-5">
          <div>
            <label
              htmlFor="sculpture-file"
              className="chrome-label mb-2 block"
            >
              360 video
            </label>
            <input
              id="sculpture-file"
              ref={fileRef}
              type="file"
              required
              accept="video/*,.osv,.insv,.mp4,.mov,.m4v,.webm,.mkv"
              disabled={isBusy}
              className="w-full rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2.5 text-sm text-chrome-100 file:mr-3 file:rounded-sm file:border file:border-warm-black-700 file:bg-warm-black-800 file:px-3 file:py-1.5 file:text-xs file:uppercase file:tracking-[0.18em] file:text-chrome-200"
            />
            <p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-chrome-500">
              MP4, MOV, OSV — the bench picks frames from it.
            </p>
          </div>

          <div>
            <label
              htmlFor="sculpture-label"
              className="chrome-label mb-2 block"
            >
              Label
            </label>
            <input
              id="sculpture-label"
              type="text"
              required
              maxLength={120}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={isBusy}
              placeholder="What is this sculpture called?"
              className="w-full rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2.5 text-sm text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200 focus:outline-none"
            />
          </div>

          <div>
            <div className="chrome-label mb-2 block">
              GPS (optional)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                id="sculpture-lat"
                type="text"
                inputMode="decimal"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                disabled={isBusy}
                placeholder="lat (e.g. 51.5074)"
                className="w-full rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2.5 text-sm font-mono text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200 focus:outline-none"
              />
              <input
                id="sculpture-lon"
                type="text"
                inputMode="decimal"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                disabled={isBusy}
                placeholder="lon (e.g. -0.1278)"
                className="w-full rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2.5 text-sm font-mono text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-chrome-500">
              Decimal degrees. Leave blank if you don't have a fix.
            </p>
          </div>

          <StatusBlock status={status} />

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isBusy}
              className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-3 chrome-label text-pink-200 transition-colors hover:bg-pink-200/20 disabled:opacity-60"
            >
              {status.kind === "uploading"
                ? "Uploading…"
                : status.kind === "training"
                ? "Training…"
                : "Upload 360 video"}
            </button>
            {status.kind === "done" && (
              <button
                type="button"
                onClick={() => router.push("/holo-walk")}
                className="chrome-label text-chrome-400 hover:text-pink-200"
              >
                View in gallery &rarr;
              </button>
            )}
            <Link
              href="/holo-walk"
              className="chrome-label text-chrome-400 hover:text-pink-200"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </article>
  );
}

function StatusBlock({ status }: { status: Status }) {
  if (status.kind === "idle") return null;

  const tone =
    status.kind === "error"
      ? "border-red-400/50 text-red-200"
      : status.kind === "done"
        ? "border-emerald-400/40 text-emerald-100"
        : "border-pink-200/40 text-chrome-100";

  return (
    <div
      className={`rounded-sm border bg-warm-black-900/60 p-4 text-sm ${tone}`}
    >
      <div className="chrome-label">
        Status &middot;{" "}
        {status.kind === "uploading"
          ? "queued"
          : status.kind === "training"
            ? "running"
            : status.kind}
      </div>
      {status.kind === "uploading" && (
        <p className="mt-2 text-sm">
          Uploading the source video to the media library…
        </p>
      )}
      {status.kind === "training" && (
        <p className="mt-2 text-sm">
          Training splat… typically 5-10 minutes.
        </p>
      )}
      {status.kind === "done" && (
        <div className="mt-2 space-y-1 text-sm">
          <p>
            Splat trained. {status.gaussianCount.toLocaleString()} gaussians,{" "}
            <Link
              href={status.plyUrl}
              className="text-pink-200 underline-offset-4 hover:underline"
            >
              open .ply
            </Link>
            .
          </p>
        </div>
      )}
      {status.kind === "error" && (
        <p className="mt-2 text-sm">
          {status.stage ? `[${status.stage}] ` : ""}
          {status.message}
        </p>
      )}
      {("jobId" in status) && status.jobId && (
        <p className="mt-2 font-mono text-[0.7rem] text-chrome-400">
          bench job id: {status.jobId}
        </p>
      )}
    </div>
  );
}
