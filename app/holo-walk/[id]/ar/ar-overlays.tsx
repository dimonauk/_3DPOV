"use client";

/**
 * app/holo-walk/[id]/ar/ar-overlays.tsx — UI overlay primitives for the AR view.
 *
 * One-line role: phase-shaped overlays (intro, requesting, denied, error,
 * arrived, info-strip, out-of-range, capture-bar) — pure presentational
 * components consumed by `ar-window-client.tsx`.
 */

import Link from "next/link";

import type { ARTransform } from "lib/capabilities/ar/window";
import type { SculptureLocation } from "lib/holo-walk/locations";

const COMPASS_LABELS = [
  "N", "NE", "E", "SE", "S", "SW", "W", "NW",
] as const;

export function bearingLabel(deg: number): string {
  const idx = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
  return COMPASS_LABELS[idx] ?? "N";
}

export function IntroCard({
  location,
  onStart,
}: {
  location: SculptureLocation;
  onStart: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center px-6">
      <div className="max-w-md rounded-sm border border-warm-black-700 bg-warm-black-950/85 p-8 text-center backdrop-blur">
        <div className="chrome-label">HoloWalk &middot; {location.city}</div>
        <h1 className="mt-3 text-3xl leading-tight">{location.name}</h1>
        <p className="mt-4 text-sm text-chrome-300">
          This view uses your camera, location and compass to overlay the
          light-sculpture at the spot it was made. Stand near the location,
          hold the phone up at eye level, and look around.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-sm border border-pink-200/60 bg-pink-200/10 px-6 chrome-label text-pink-100 hover:bg-pink-200/20"
        >
          start AR
        </button>
        <Link
          href={`/holo-walk/${location.id}`}
          className="mt-3 inline-block text-xs text-chrome-400 hover:text-pink-200"
        >
          cancel
        </Link>
      </div>
    </div>
  );
}

export function RequestingOverlay() {
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-warm-black-950/70 px-6 backdrop-blur">
      <div className="text-center text-sm text-chrome-200">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-pink-200/30 border-t-pink-200" />
        <p className="mt-4">Asking for camera + location permission&hellip;</p>
      </div>
    </div>
  );
}

export function DeniedOverlay({
  onRetry,
  errorMessage,
  locationId,
}: {
  onRetry: () => void;
  errorMessage: string | null;
  locationId: string;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center px-6">
      <div className="max-w-md rounded-sm border border-pink-200/40 bg-warm-black-950/90 p-8 text-center backdrop-blur">
        <div className="chrome-label text-pink-200">permission denied</div>
        <p className="mt-3 text-sm text-chrome-200">
          AR needs camera + location + compass. Tap retry below, or grant the
          permissions in your browser settings and reload.
        </p>
        {errorMessage && (
          <p className="mt-3 font-mono text-xs text-chrome-400">{errorMessage}</p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="h-12 rounded-sm border border-pink-200/60 bg-pink-200/10 chrome-label text-pink-100 hover:bg-pink-200/20"
          >
            retry
          </button>
          <Link
            href={`/holo-walk/${locationId}`}
            className="text-xs text-chrome-400 hover:text-pink-200"
          >
            back to sculpture page
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * iOS Safari blocks DeviceOrientationEvent (the compass feed) until the
 * visitor explicitly grants Motion & Orientation access — and that grant
 * is per-tab, not site-level. If they tap "Deny" the AR view has no
 * heading at all, which silently breaks sight lines: the sculpture
 * appears in the wrong direction. We surface this instead of letting
 * them walk into a useless experience.
 */
export function CompassDeniedOverlay({
  onRetry,
  locationId,
}: {
  onRetry: () => void;
  locationId: string;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center px-6">
      <div className="max-w-md rounded-sm border border-pink-200/40 bg-warm-black-950/90 p-8 text-center backdrop-blur">
        <div className="chrome-label text-pink-200">compass needed</div>
        <p className="mt-3 text-sm text-chrome-200">
          The sculpture is anchored to the spot it was made — AR needs
          your phone&rsquo;s compass to point it the right way. Tap
          retry and grant <em>Motion &amp; Orientation</em> when iOS
          asks. Otherwise the sculpture will float at the wrong bearing.
        </p>
        <p className="mt-3 text-xs text-chrome-400">
          On iOS: tap retry &rarr; the &ldquo;Motion &amp; Orientation
          Access&rdquo; prompt appears once per tab. If you already
          denied it, reload this page or enable it in Safari &rarr;
          Settings &rarr; Advanced &rarr; Website Data.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="h-12 rounded-sm border border-pink-200/60 bg-pink-200/10 chrome-label text-pink-100 hover:bg-pink-200/20"
          >
            retry
          </button>
          <Link
            href={`/holo-walk/${locationId}`}
            className="text-xs text-chrome-400 hover:text-pink-200"
          >
            back to sculpture page
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * GPS watcher returned timeout / unavailable without a fix. Cities + dense
 * indoor environments can suppress GPS for the first 30-60s; "step outside"
 * is the practical mitigation. The watcher stays attached so a real fix
 * will still flow in and unlock the active phase via the position effect.
 */
export function GpsUnavailableOverlay({
  onRetry,
  locationId,
  errorMessage,
}: {
  onRetry: () => void;
  locationId: string;
  errorMessage: string | null;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center px-6">
      <div className="max-w-md rounded-sm border border-pink-200/40 bg-warm-black-950/90 p-8 text-center backdrop-blur">
        <div className="chrome-label text-pink-200">no GPS fix yet</div>
        <p className="mt-3 text-sm text-chrome-200">
          The phone can&rsquo;t see the satellites well enough from
          where you&rsquo;re standing. Step somewhere with sky overhead
          and try again &mdash; cities and indoor spaces often take a
          full minute on the first fix.
        </p>
        {errorMessage && (
          <p className="mt-3 font-mono text-xs text-chrome-400">
            {errorMessage}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="h-12 rounded-sm border border-pink-200/60 bg-pink-200/10 chrome-label text-pink-100 hover:bg-pink-200/20"
          >
            try again
          </button>
          <Link
            href={`/holo-walk/${locationId}`}
            className="text-xs text-chrome-400 hover:text-pink-200"
          >
            back to sculpture page
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ErrorOverlay({
  errorMessage,
  onRetry,
  locationId,
}: {
  errorMessage: string | null;
  onRetry: () => void;
  locationId: string;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center px-6">
      <div className="max-w-md rounded-sm border border-warm-black-700 bg-warm-black-950/90 p-8 text-center backdrop-blur">
        <div className="chrome-label text-pink-200">something went wrong</div>
        <p className="mt-3 font-mono text-xs text-chrome-300">
          {errorMessage ?? "unknown error"}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="h-12 rounded-sm border border-pink-200/60 bg-pink-200/10 chrome-label text-pink-100 hover:bg-pink-200/20"
          >
            try again
          </button>
          <Link
            href={`/holo-walk/${locationId}`}
            className="text-xs text-chrome-400 hover:text-pink-200"
          >
            back
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ArrivedOverlay({ location }: { location: SculptureLocation }) {
  return (
    <div className="pointer-events-auto absolute inset-x-4 bottom-6 z-20 flex justify-center">
      <div className="max-w-md rounded-sm border border-pink-200/40 bg-warm-black-950/85 p-5 text-center backdrop-blur">
        <div className="chrome-label text-pink-200">you have arrived</div>
        <p className="mt-2 text-sm text-chrome-200">
          You stood here on{" "}
          <span className="font-mono text-chrome-100">{location.captureDate}</span>.
        </p>
        <p className="mt-2 text-xs text-chrome-400">
          The sculpture lives in your camera roll now &mdash; try a photo facing
          the way it was shot.
        </p>
      </div>
    </div>
  );
}

export function InfoStrip({ transform }: { transform: ARTransform }) {
  return (
    <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-sm border border-warm-black-700 bg-warm-black-950/70 px-3 py-2 font-mono text-xs text-chrome-100 backdrop-blur">
      <span className="text-pink-200">{Math.round(transform.distanceMeters)}m</span>{" "}
      <span className="text-chrome-400">head</span>{" "}
      <span>{bearingLabel(transform.bearing)}</span>{" "}
      <span className="text-chrome-500">({Math.round(transform.bearing)}&deg;)</span>
    </div>
  );
}

export function OutOfRangeStrip({
  distanceMeters,
  location,
}: {
  distanceMeters: number;
  location: SculptureLocation;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-28 z-20 flex justify-center">
      <div className="rounded-sm border border-warm-black-700 bg-warm-black-950/80 px-4 py-2 text-center text-xs text-chrome-200 backdrop-blur">
        Get closer to see the sculpture &mdash;{" "}
        <span className="font-mono text-pink-200">
          {Math.round(distanceMeters)}m
        </span>{" "}
        away. Visible within{" "}
        <span className="font-mono">{location.range.renderFromM}m</span>.
      </div>
    </div>
  );
}

export function CaptureBar({
  onPhoto,
  onToggleRecord,
  onShare,
  recording,
  recElapsed,
  canRecord,
}: {
  onPhoto: () => void;
  onToggleRecord: () => void;
  onShare: () => void;
  recording: boolean;
  recElapsed: number;
  canRecord: boolean;
}) {
  const mm = String(Math.floor(recElapsed / 60)).padStart(1, "0");
  const ss = String(recElapsed % 60).padStart(2, "0");
  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex h-24 items-center justify-around bg-warm-black-950/40 px-6 backdrop-blur"
      role="toolbar"
      aria-label="AR capture controls"
    >
      <button
        type="button"
        onClick={onPhoto}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-chrome-300/60 bg-warm-black-950/60 text-chrome-100 hover:border-pink-200 hover:text-pink-200"
        aria-label="Take photo"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      </button>

      {canRecord && (
        <button
          type="button"
          onClick={onToggleRecord}
          className={`flex h-14 min-w-[3.5rem] items-center justify-center gap-2 rounded-full border px-4 ${
            recording
              ? "border-pink-400 bg-pink-400/20 text-pink-100"
              : "border-chrome-300/60 bg-warm-black-950/60 text-chrome-100 hover:border-pink-200 hover:text-pink-200"
          }`}
          aria-label={recording ? "Stop recording" : "Start recording"}
        >
          <span
            className={`h-3 w-3 rounded-full ${
              recording ? "animate-pulse bg-pink-400" : "bg-pink-300"
            }`}
          />
          {recording && (
            <span className="font-mono text-xs">
              REC {mm}:{ss}
            </span>
          )}
        </button>
      )}

      <button
        type="button"
        onClick={onShare}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-chrome-300/60 bg-warm-black-950/60 text-chrome-100 hover:border-pink-200 hover:text-pink-200"
        aria-label="Share last capture"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
          <path d="M16 6l-4-4-4 4" />
          <path d="M12 2v14" />
        </svg>
      </button>
    </div>
  );
}
