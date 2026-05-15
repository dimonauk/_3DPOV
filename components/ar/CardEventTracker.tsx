"use client";

/**
 * CardEventTracker — fires analytics ping(s) on the client.
 *
 * Mount on every /c/<slug> landing. Reads `?src=` from the URL to
 * capture print-run / campaign source. Sends one 'view' event the
 * first time the component sees a given slug, then exposes a
 * `track()` function via the global `window.__holoflow_track` symbol
 * for downstream components (AR scene, vCard button, etc.) to fire
 * additional events without each one re-importing this module.
 *
 * Design notes:
 *   - Fire-and-forget POST with sendBeacon when available; falls back
 *     to fetch() so it works during pagehide too.
 *   - Dedupes per-slug within a session via sessionStorage so a user
 *     who navigates away and comes back doesn't generate two 'view'
 *     events. Other event types (ar_launch, recording, etc.) are NOT
 *     deduped — every action is its own event.
 *   - Honours Do Not Track / Global Privacy Control: if either is on,
 *     this component does nothing. No event, no global. Quiet.
 */

import { useEffect } from "react";

declare global {
  interface Window {
    __holoflow_track?: (
      slug: string,
      type:
        | "ar_launch"
        | "hand_lock"
        | "webxr"
        | "vcard_download"
        | "recording"
        | "lead_capture",
    ) => void;
  }
}

function isDntActive(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    doNotTrack?: string;
    globalPrivacyControl?: boolean;
  };
  if (nav.globalPrivacyControl) return true;
  const dnt = nav.doNotTrack || (window as { doNotTrack?: string }).doNotTrack;
  return dnt === "1" || dnt === "yes";
}

function readSrc(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  const src = params.get("src") || params.get("utm_source");
  return src ? src.slice(0, 64) : undefined;
}

async function sendEvent(slug: string, type: string, src?: string) {
  if (typeof window === "undefined") return;
  if (isDntActive()) return;

  const url = `/api/cards/${encodeURIComponent(slug)}/events`;
  const payload = JSON.stringify({ type, src });

  if (navigator.sendBeacon) {
    try {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    } catch {
      // fall through to fetch
    }
  }
  try {
    await fetch(url, {
      method: "POST",
      body: payload,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    });
  } catch {
    // Silent — analytics is best-effort, never blocks UX.
  }
}

type Props = { slug: string };

export default function CardEventTracker({ slug }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isDntActive()) return;

    const src = readSrc();

    // Dedupe 'view' within a session — same slug = one view.
    const key = `holoflow.view.${slug}`;
    let alreadyViewed = false;
    try {
      alreadyViewed = window.sessionStorage.getItem(key) === "1";
    } catch {
      // sessionStorage can throw in private mode; just send anyway.
    }
    if (!alreadyViewed) {
      void sendEvent(slug, "view", src);
      try {
        window.sessionStorage.setItem(key, "1");
      } catch {
        // ignore
      }
    }

    // Expose a global tracker so downstream components don't all
    // need to import this module + duplicate the sendBeacon path.
    window.__holoflow_track = (s, t) => {
      void sendEvent(s, t, src);
    };

    return () => {
      // Don't tear the global down — other components may still use
      // it on unmount (e.g. a stop-recording event). It's harmless to
      // leave alive.
    };
  }, [slug]);

  return null;
}
