/**
 * lib/tracking/webcam.ts — Shared webcam capture + consent helpers.
 *
 * Two trackers (face + hand) want the same MediaStream. Asking the
 * browser for two separate getUserMedia handles produces two
 * permission prompts on some browsers and a "device in use" error
 * on others, so we centralise the capture here and hand out
 * subscriptions to the same `<video>` element.
 *
 * Consent persists in localStorage under "holoflow.tracking.consent"
 * so the second visit does not re-prompt. The value "granted" means
 * we may call getUserMedia without an interstitial; "denied" means
 * we never try; anything else (or missing) means we ask the user.
 *
 * This module never auto-starts the camera. The tracker calls
 * `requestWebcam()` only after a UI surface has either confirmed
 * cached consent or explicitly opted in for this session.
 */

const STORAGE_KEY = "holoflow.tracking.consent";

export type ConsentDecision = "granted" | "denied" | "ask";

let activeStream: MediaStream | null = null;
let activeVideo: HTMLVideoElement | null = null;
let refcount = 0;

export function readConsent(): ConsentDecision {
  if (typeof window === "undefined") return "ask";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "granted" || v === "denied") return v;
  } catch {
    // localStorage can throw in strict cookie modes.
  }
  return "ask";
}

export function writeConsent(decision: ConsentDecision): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, decision);
  } catch {
    // ignore — best-effort persistence
  }
}

/**
 * Hand back a shared video element wired to a webcam stream.
 * Refcounted: every caller pairs `acquireWebcam()` with
 * `releaseWebcam()` and the underlying tracks stop when the
 * last consumer leaves.
 *
 * Throws if consent is "denied". Callers should call readConsent()
 * first and route through the consent UI when the answer is "ask".
 */
export async function acquireWebcam(): Promise<HTMLVideoElement> {
  if (typeof window === "undefined") {
    throw new Error("acquireWebcam called outside the browser");
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("getUserMedia not available on this browser");
  }
  if (readConsent() === "denied") {
    throw new Error("webcam consent denied");
  }
  if (activeStream && activeVideo) {
    refcount += 1;
    return activeVideo;
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: "user",
      frameRate: { ideal: 30, max: 30 },
    },
    audio: false,
  });
  // First successful capture also confirms consent so the next
  // visit picks up the saved decision without another prompt.
  if (readConsent() === "ask") writeConsent("granted");

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.srcObject = stream;
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    video.addEventListener(
      "loadeddata",
      () => {
        if (settled) return;
        settled = true;
        resolve();
      },
      { once: true },
    );
    video.addEventListener(
      "error",
      () => {
        if (settled) return;
        settled = true;
        reject(new Error("webcam <video> failed to load"));
      },
      { once: true },
    );
    void video.play().catch(() => {
      // Autoplay can throw in Safari; loadeddata still fires for SRC streams.
    });
  });

  activeStream = stream;
  activeVideo = video;
  refcount = 1;
  return video;
}

export function releaseWebcam(): void {
  refcount = Math.max(0, refcount - 1);
  if (refcount > 0) return;
  if (activeStream) {
    for (const track of activeStream.getTracks()) {
      try {
        track.stop();
      } catch {
        // ignore
      }
    }
  }
  if (activeVideo) {
    try {
      activeVideo.srcObject = null;
    } catch {
      // ignore
    }
  }
  activeStream = null;
  activeVideo = null;
}

/**
 * Cheap probe: does the device claim to have at least one video
 * input? Used by the tracker's `available()` to decide whether to
 * even attempt getUserMedia. Does NOT trigger a permission prompt
 * (enumerateDevices only labels devices after consent — but the
 * count itself is available unconditionally on modern browsers).
 */
export async function hasVideoInput(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  if (!navigator.mediaDevices?.enumerateDevices) return false;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some((d) => d.kind === "videoinput");
  } catch {
    return false;
  }
}
