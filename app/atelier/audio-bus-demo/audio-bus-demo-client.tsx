"use client";

/**
 * app/atelier/audio-bus-demo/audio-bus-demo-client.tsx — Client side
 * of the audio bus showcase. Owns the AudioBus instance for the
 * page's lifetime and renders a small control panel.
 *
 * The chime sound is synthesised in-browser the first time the page
 * loads — a 0.4 s decaying sine at 880 Hz — so the demo ships with
 * no external asset. Handing the result to the bus as a raw
 * AudioBuffer through a private API would be tidier than the
 * `URL.createObjectURL` round-trip below; rather than expand the
 * bus's public surface to "accept a pre-decoded buffer", we encode
 * the synthesised tone to a WAV blob and `load()` it. Same code
 * path the bus uses for shipped sounds, no special case.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import { createAudioBus, type AudioBus } from "lib/game";

type FiredEvent = {
  at: number;
  position: [number, number, number];
};

export default function AudioBusDemoClient() {
  const busRef = useRef<AudioBus | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [events, setEvents] = useState<FiredEvent[]>([]);

  // Construct the bus + synthesise the chime once on mount. Tear
  // down on unmount — the bus owns an AudioContext and a graph;
  // leaving it dangling would burn a slot in the browser's pool of
  // live contexts.
  useEffect(() => {
    const bus = createAudioBus();
    busRef.current = bus;

    let cancelled = false;
    (async () => {
      try {
        const wavUrl = synthesiseChimeWav();
        await bus.load("chime", wavUrl);
        URL.revokeObjectURL(wavUrl);
        if (!cancelled) {
          setLoaded(true);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!cancelled) {
          setLoadError(message);
        }
      }
    })();

    return () => {
      cancelled = true;
      bus.destroy();
      busRef.current = null;
    };
  }, []);

  // Drive master volume through the bus rather than scaling per
  // play() call — that's the bus's master gain doing its job.
  useEffect(() => {
    busRef.current?.setMasterVolume(volume);
  }, [volume]);

  const recentEvents = useMemo(() => events.slice(-6).reverse(), [events]);

  function fire(): void {
    const bus = busRef.current;
    if (!bus || !loaded) return;
    // Random position in front of the listener: -4..4 across, -1..2
    // vertically, -2..-6 in depth (negative Z is forward in three's
    // convention). Distance roughly between 2 and 7 metres.
    const position: [number, number, number] = [
      (Math.random() * 2 - 1) * 4,
      Math.random() * 3 - 1,
      -(Math.random() * 4 + 2),
    ];
    bus.play("chime", { position, volume: 1 });
    setEvents((prev) => [
      ...prev.slice(-19),
      { at: performance.now(), position },
    ]);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-6">
        <div className="chrome-label">Bus controls</div>
        <div className="mt-4 flex flex-col gap-4">
          <button
            type="button"
            onClick={fire}
            disabled={!loaded}
            className="rounded-sm border border-pink-200/60 bg-warm-black-950 px-4 py-3 text-sm font-medium text-pink-200 transition hover:bg-pink-200/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loaded ? "Fire chime at random 3D position" : "Loading…"}
          </button>
          {loadError && (
            <p className="text-xs text-rose-300">
              Load failed: <span className="font-mono">{loadError}</span>
            </p>
          )}
          <label className="flex flex-col gap-2 text-xs text-chrome-300">
            <span>
              Master volume{" "}
              <span className="font-mono text-chrome-100">
                {volume.toFixed(2)}
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(ev) => setVolume(Number(ev.target.value))}
              className="accent-pink-200"
            />
          </label>
          <p className="text-xs text-chrome-400">
            Headphones recommended. With speakers you&rsquo;ll still
            hear left/right but the HRTF front/back image collapses.
          </p>
        </div>
      </div>

      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-6">
        <div className="chrome-label">Recent fires</div>
        {recentEvents.length === 0 ? (
          <p className="mt-4 text-xs text-chrome-400">
            Nothing fired yet. Hit the button on the left.
          </p>
        ) : (
          <ul className="mt-4 space-y-2 text-xs text-chrome-200">
            {recentEvents.map((e) => (
              <li
                key={e.at}
                className="flex items-center justify-between gap-3 rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-2"
              >
                <span className="font-mono text-chrome-400">
                  +{((performance.now() - e.at) / 1000).toFixed(1)}s
                </span>
                <span className="font-mono">
                  [{e.position.map((n) => n.toFixed(2)).join(", ")}]
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Synthesise a 0.4 s 880 Hz decaying sine, encode as a 16-bit PCM
 * WAV, return a blob: URL the bus can `load()` like any other
 * audio asset. Mirrors how the studio's voice pipeline ships TTS
 * results to the player.
 */
function synthesiseChimeWav(): string {
  const sampleRate = 44_100;
  const durationSec = 0.4;
  const length = Math.floor(sampleRate * durationSec);
  const freq = 880;
  const samples = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    // Quick exponential decay. Peak amplitude 0.6 to leave headroom.
    const env = Math.exp(-t * 6);
    samples[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.6;
  }

  // WAV header: 44 bytes for mono PCM16 + the samples themselves.
  const bytesPerSample = 2;
  const dataSize = length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  let offset = 0;
  function writeString(s: string) {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(offset++, s.charCodeAt(i));
    }
  }
  function writeUint32(v: number) {
    view.setUint32(offset, v, true);
    offset += 4;
  }
  function writeUint16(v: number) {
    view.setUint16(offset, v, true);
    offset += 2;
  }
  writeString("RIFF");
  writeUint32(36 + dataSize);
  writeString("WAVE");
  writeString("fmt ");
  writeUint32(16); // PCM chunk size
  writeUint16(1); // PCM format
  writeUint16(1); // mono
  writeUint32(sampleRate);
  writeUint32(sampleRate * bytesPerSample); // byte rate
  writeUint16(bytesPerSample); // block align
  writeUint16(16); // bits per sample
  writeString("data");
  writeUint32(dataSize);
  for (let i = 0; i < length; i++) {
    // The compiler can't prove `samples[i]` is defined under
    // `noUncheckedIndexedAccess`. Read once, default to 0 for the
    // never-hit out-of-bounds branch.
    const s = samples[i] ?? 0;
    const clamped = Math.max(-1, Math.min(1, s));
    view.setInt16(offset, clamped * 0x7fff, true);
    offset += 2;
  }

  const blob = new Blob([buffer], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}
