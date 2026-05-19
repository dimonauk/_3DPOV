/**
 * lib/game/audio-bus.ts — A small Web Audio + HRTF spatial-audio bus
 * for the WebXR Game Framework.
 *
 * Why this exists. Up to now every scene that wanted sound used
 * raw HTML5 `Audio` elements, which means: no positional pan, no
 * easy master volume, no shared decode cache, no resume-after-
 * autoplay-block. The bus closes that gap with a single AudioContext
 * shared across scenes and a tiny API that any author can hold in
 * their head:
 *
 *   bus.load("chime", "/audio/chime.wav")
 *   bus.play("chime", { position: [x, y, z] })
 *
 * Positional sounds flow through a `PannerNode` with `panningModel
 * = "HRTF"` — the browser does binaural rendering against a head
 * model. Inside a WebXR session this is exactly what we want: the
 * listener position can be updated each frame from the headset
 * pose and stereo headphone listeners get a believable head-relative
 * stereo image without us writing any DSP code. The fallback is
 * "equalpower" 2D panning when HRTF isn't available — older Safari
 * builds and a few Android browsers fall here, but the audible
 * result is still positionally correct in the L/R axis.
 *
 * Autoplay policy. Browsers suspend the AudioContext until a user
 * gesture. We lazily resume on the *first* `play()` call so the
 * caller doesn't need to thread a `userGestureCallback`. If the
 * context is still suspended after a `play()` (the user hasn't
 * interacted yet) we cache the request and replay it on the next
 * gesture; this matches the studio's pattern in the VRM voice
 * pipeline (`lib/state/audio.ts` upstream).
 *
 * Listener pose. Callers can drive `setListenerPose` from the
 * scene's frame loop with the current head position + facing. The
 * bus updates the AudioListener's positionX/Y/Z + forwardX/Y/Z. The
 * default listener sits at origin looking down -Z, matching three.
 *
 * Lifecycle. `destroy()` stops every active source, disconnects the
 * graph, and closes the context. The studio's pagehide hook does
 * not auto-close the bus — that's the caller's responsibility because
 * a magazine surface may want the bus to persist across React tree
 * remounts. Pair the bus with a React lifecycle (`useEffect` cleanup)
 * to get one-bus-per-page behaviour.
 *
 * No external dependencies. Pure Web Audio + DOM. SSR-safe: every
 * method short-circuits with a warning when `window` is undefined.
 */

export type SoundId = string;

export type PlayOptions = {
  /** World-space coordinates. When set, the sound routes through a
   *  HRTF-panned PannerNode. When unset, it plays in stereo at the
   *  master gain only. */
  position?: [number, number, number];
  /** Linear gain [0..1]. Default 1. */
  volume?: number;
  /** Loop the buffer. Default false. */
  loop?: boolean;
  /** Playback rate (1 = native). Cheap pitch-shift. Default 1. */
  rate?: number;
  /** Distance after which the sound fades to zero. Default 30 (m). */
  maxDistance?: number;
};

export type ListenerPose = {
  position: [number, number, number];
  /** Forward unit vector (typically [0, 0, -1] in three's convention). */
  forward?: [number, number, number];
  /** Up unit vector. Defaults to [0, 1, 0]. */
  up?: [number, number, number];
};

export type AudioBus = {
  /** Fetch + decode the URL once, cache the AudioBuffer by id. */
  load(id: SoundId, url: string): Promise<void>;
  /** Start a previously-loaded sound. Returns silently if the id is
   *  unknown — log noise from a typo in a loop isn't worth the noise.
   */
  play(id: SoundId, opts?: PlayOptions): void;
  /** Stop every running instance of the sound. */
  stop(id: SoundId): void;
  /** Master gain [0..1]. Default 1. */
  setMasterVolume(v: number): void;
  /** Update the listener's head pose for positional rendering. */
  setListenerPose(pose: ListenerPose): void;
  /** Tear down — disconnects the graph, closes the AudioContext. */
  destroy(): void;
};

type LoadedSound = AudioBuffer;
type ActiveSource = {
  id: SoundId;
  source: AudioBufferSourceNode;
};

export function createAudioBus(): AudioBus {
  if (typeof window === "undefined") {
    return makeNoopBus();
  }

  // Standard Web Audio constructor name dance. Old Safari surfaces
  // only the webkit-prefixed name; current Safari ships AudioContext
  // properly. The cast keeps strict mode happy without a lib bump.
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) {
    console.warn("[audio-bus] Web Audio unavailable; bus is a no-op.");
    return makeNoopBus();
  }

  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 1;
  master.connect(ctx.destination);

  const buffers = new Map<SoundId, LoadedSound>();
  const active = new Set<ActiveSource>();
  const pendingOnResume: Array<() => void> = [];

  function ensureRunning(): void {
    if (ctx.state !== "suspended") return;
    // Try to resume; if the policy blocks us, queue the play call
    // for the next user gesture. The gesture listener is attached
    // once and self-removes after it fires.
    ctx.resume().catch(() => {
      attachResumeOnGesture();
    });
  }

  let gestureHandlerAttached = false;
  function attachResumeOnGesture(): void {
    if (gestureHandlerAttached) return;
    gestureHandlerAttached = true;
    const onGesture = () => {
      ctx.resume().then(() => {
        // Replay anything that was deferred while suspended.
        const queued = pendingOnResume.splice(0);
        for (const fn of queued) {
          try {
            fn();
          } catch (err) {
            console.warn("[audio-bus] deferred play threw:", err);
          }
        }
      });
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("touchstart", onGesture);
      gestureHandlerAttached = false;
    };
    window.addEventListener("pointerdown", onGesture, { once: false });
    window.addEventListener("keydown", onGesture, { once: false });
    window.addEventListener("touchstart", onGesture, { once: false });
  }

  // HRTF probe. Safari < 15 silently downgrades HRTF to equalpower
  // when the head model is missing. The probe is cheap — create a
  // throwaway panner, try to set HRTF, fall back if assignment fails.
  // We do this once at construction.
  const hrtfAvailable = (() => {
    try {
      const p = ctx.createPanner();
      p.panningModel = "HRTF";
      return p.panningModel === "HRTF";
    } catch {
      return false;
    }
  })();

  async function load(id: SoundId, url: string): Promise<void> {
    if (buffers.has(id)) return;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`[audio-bus] fetch failed for ${url}`);
    const arr = await res.arrayBuffer();
    // decodeAudioData has two signatures; the Promise form is the
    // current spec, but Safari historically wants the callback form.
    // Use a small adapter so both code paths work.
    const buffer: AudioBuffer = await new Promise<AudioBuffer>(
      (resolve, reject) => {
        try {
          const p = ctx.decodeAudioData(arr, resolve, reject);
          if (p && typeof (p as Promise<AudioBuffer>).then === "function") {
            (p as Promise<AudioBuffer>).then(resolve, reject);
          }
        } catch (err) {
          reject(err);
        }
      },
    );
    buffers.set(id, buffer);
  }

  function play(id: SoundId, opts: PlayOptions = {}): void {
    const buffer = buffers.get(id);
    if (!buffer) {
      // Silent miss — caller likely raced a load. The console churn
      // from a typo in a hot loop would drown the dev tools.
      return;
    }
    ensureRunning();
    const fire = () => spawn(id, buffer, opts);
    if (ctx.state === "suspended") {
      pendingOnResume.push(fire);
      return;
    }
    fire();
  }

  function spawn(
    id: SoundId,
    buffer: AudioBuffer,
    opts: PlayOptions,
  ): void {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = opts.loop ?? false;
    source.playbackRate.value = opts.rate ?? 1;

    const gain = ctx.createGain();
    gain.gain.value = opts.volume ?? 1;

    // Positional path — route through a PannerNode. Otherwise
    // straight into master.
    let head: AudioNode = gain;
    if (opts.position) {
      const panner = ctx.createPanner();
      panner.panningModel = hrtfAvailable ? "HRTF" : "equalpower";
      panner.distanceModel = "inverse";
      panner.refDistance = 1;
      panner.maxDistance = opts.maxDistance ?? 30;
      panner.rolloffFactor = 1;
      const [px, py, pz] = opts.position;
      // The .position{X,Y,Z} AudioParam form is the spec, but a few
      // older Chromium ports only ship `setPosition`. Try the param
      // form first; fall back to the legacy method.
      try {
        panner.positionX.value = px;
        panner.positionY.value = py;
        panner.positionZ.value = pz;
      } catch {
        const legacy = panner as unknown as {
          setPosition: (x: number, y: number, z: number) => void;
        };
        legacy.setPosition(px, py, pz);
      }
      gain.connect(panner);
      head = panner;
    }

    head.connect(master);
    source.connect(gain);

    const record: ActiveSource = { id, source };
    active.add(record);
    source.onended = () => {
      active.delete(record);
      try {
        source.disconnect();
        gain.disconnect();
        if (head !== gain) head.disconnect();
      } catch {
        // Already torn down — fine.
      }
    };
    source.start();
  }

  function stop(id: SoundId): void {
    for (const rec of Array.from(active)) {
      if (rec.id !== id) continue;
      try {
        rec.source.stop();
      } catch {
        // Already stopped — fine.
      }
      active.delete(rec);
    }
  }

  function setMasterVolume(v: number): void {
    master.gain.value = Math.max(0, Math.min(1, v));
  }

  function setListenerPose(pose: ListenerPose): void {
    const listener = ctx.listener;
    const [px, py, pz] = pose.position;
    const [fx, fy, fz] = pose.forward ?? [0, 0, -1];
    const [ux, uy, uz] = pose.up ?? [0, 1, 0];
    // Spec form (positionX etc.) preferred; fall back to the
    // legacy `setPosition` + `setOrientation` pair where needed.
    try {
      listener.positionX.value = px;
      listener.positionY.value = py;
      listener.positionZ.value = pz;
      listener.forwardX.value = fx;
      listener.forwardY.value = fy;
      listener.forwardZ.value = fz;
      listener.upX.value = ux;
      listener.upY.value = uy;
      listener.upZ.value = uz;
    } catch {
      const legacy = listener as unknown as {
        setPosition: (x: number, y: number, z: number) => void;
        setOrientation: (
          fx: number,
          fy: number,
          fz: number,
          ux: number,
          uy: number,
          uz: number,
        ) => void;
      };
      legacy.setPosition(px, py, pz);
      legacy.setOrientation(fx, fy, fz, ux, uy, uz);
    }
  }

  function destroy(): void {
    for (const rec of Array.from(active)) {
      try {
        rec.source.stop();
        rec.source.disconnect();
      } catch {
        // Already torn down — fine.
      }
    }
    active.clear();
    buffers.clear();
    try {
      master.disconnect();
    } catch {
      // Already disconnected — fine.
    }
    ctx.close().catch(() => {
      // Some browsers reject close() if called twice; not actionable.
    });
  }

  return {
    load,
    play,
    stop,
    setMasterVolume,
    setListenerPose,
    destroy,
  };
}

/**
 * Inert bus returned in SSR or when Web Audio is unavailable. Mirrors
 * the public surface so callers can construct unconditionally without
 * `if (typeof window …)` ceremony around every `play()` call.
 */
function makeNoopBus(): AudioBus {
  return {
    async load() {
      /* noop */
    },
    play() {
      /* noop */
    },
    stop() {
      /* noop */
    },
    setMasterVolume() {
      /* noop */
    },
    setListenerPose() {
      /* noop */
    },
    destroy() {
      /* noop */
    },
  };
}
