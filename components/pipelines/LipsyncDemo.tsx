"use client";

/**
 * components/pipelines/LipsyncDemo.tsx — Live composition of the
 * `lipsync` pipeline (vrm.load → audio.tts → audio.visemes →
 * vrm.expressions.blend).
 *
 * One-line role: render Aura, take typed text, speak it, animate her
 * mouth on the active viseme. The composition runs end-to-end without
 * any provider keys (uses the browser's Web Speech API).
 *
 * # The flow when "Speak" is clicked
 *
 *   1. Estimate the duration of the utterance from text length.
 *   2. Start the vrm.expressions.blend loop on Aura's handle —
 *      from now on it reads audio.visemes each frame and writes
 *      mouth weights to vrm.expressions.
 *   3. Kick `audio.visemes.start(text, durationMs)` which writes
 *      the viseme timeline and walks the cursor.
 *   4. Call `audio.tts.speak(text, { provider: "web-speech" })`
 *      which speaks via SpeechSynthesisUtterance and resolves on end.
 *   5. On resolve, stop the visemes cursor and the blend loop.
 *
 * # Why Web Speech
 *
 * No API keys, works offline, available in every modern browser. The
 * ElevenLabs / F5 / Kokoro providers exist behind the same `speak()`
 * contract and can be swapped in with a single options change — but
 * for a registry-level *demo* the goal is to prove the end-to-end
 * chain composes, not to ship studio-grade voice.
 *
 * # Per dollyos-memory-leaks
 *
 * The blend loop + viseme cursor are stopped on unmount; the VRMAvatar
 * owns its own load/unload lifecycle. No object URLs created here.
 */

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";

import { VRMAvatar } from "components/three/VRMAvatar";
import { createLogger } from "lib/log";
import {
  estimateDurationMs,
  start as startVisemes,
  stop as stopVisemes,
} from "lib/capabilities/audio/visemes";
import {
  speak as ttsSpeak,
  stop as ttsStop,
} from "lib/capabilities/audio/tts";
import {
  startBlend,
  stopBlend,
} from "lib/capabilities/vrm/expression";

const log = createLogger("pipelines.lipsync");

// Stable handle so we can target the blend loop precisely. VRMAvatar
// reads this in its useEffect and threads it through loadVRM.
const VRM_ID = "pipelines.lipsync.aura";

const SAMPLE_TEXT =
  "Hello. The lipsync pipeline is composing four capabilities live in your browser: vrm load, audio tts, audio visemes, and vrm expressions blend. Type something else and I'll say it too.";

export default function LipsyncDemo() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [speaking, setSpeaking] = useState(false);
  const speakingRef = useRef(false);

  const stopAll = useCallback(() => {
    ttsStop();
    stopVisemes();
    stopBlend(VRM_ID);
    speakingRef.current = false;
    setSpeaking(false);
  }, []);

  // Make sure the blend loop and any in-flight speech are torn down
  // on unmount — leaving them running would leak a rAF + a speech
  // utterance into the next page.
  useEffect(() => {
    return () => stopAll();
  }, [stopAll]);

  const onSpeak = useCallback(async () => {
    const utterance = text.trim();
    if (!utterance) return;
    if (speakingRef.current) {
      stopAll();
      return;
    }
    const durationMs = estimateDurationMs(utterance);
    speakingRef.current = true;
    setSpeaking(true);
    startBlend(VRM_ID);
    startVisemes(utterance, durationMs);
    try {
      await ttsSpeak(utterance, { provider: "web-speech" });
    } catch (err) {
      log.warn("speak failed", {
        err: err instanceof Error ? err.message : String(err),
      });
    } finally {
      stopAll();
    }
  }, [text, stopAll]);

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
      <Stage />

      <div className="flex flex-col gap-4">
        <label
          htmlFor="lipsync-text"
          className="chrome-label text-chrome-300"
        >
          Text for Aura to speak
        </label>
        <textarea
          id="lipsync-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full rounded-sm border border-warm-black-800 bg-warm-black-950/70 px-3 py-2 font-mono text-sm text-chrome-100 focus:border-pink-200/60 focus:outline-none"
          placeholder="Type something for Aura to say…"
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSpeak}
            className="rounded-full border border-pink-200/40 bg-pink-200/10 px-5 py-2 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
            aria-label={speaking ? "Stop speaking" : "Speak the text"}
          >
            {speaking ? "Stop" : "Speak"}
          </button>
          <span className="self-center text-xs text-chrome-400">
            Web Speech API · zero API keys · works offline
          </span>
        </div>

        <Legend />
      </div>
    </div>
  );
}

/**
 * R3F Canvas wrapping the VRMAvatar with three-point lighting. The
 * Suspense boundary covers @react-three/fiber's internal lazy paths
 * and the VRMAvatar's own async load.
 */
function Stage() {
  return (
    <div
      className="relative aspect-[3/4] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950"
      style={{
        background:
          "linear-gradient(180deg, rgba(255, 111, 181, 0.15), rgba(10, 10, 15, 0.95))",
      }}
    >
      <Canvas
        camera={{ position: [0, 1.4, 1.2], fov: 30, near: 0.1, far: 20 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.0} color={0xffffff} />
        <directionalLight
          position={[1.5, 2.5, 1.5]}
          intensity={1.2}
          color={0xffffff}
        />
        <directionalLight
          position={[-1.2, 1.8, -0.6]}
          intensity={0.4}
          color={0xb8d4f0}
        />
        <Suspense fallback={null}>
          <FacingVRM />
        </Suspense>
      </Canvas>
    </div>
  );
}

/**
 * VRMAvatar oriented to face the camera. The avatar mounts at world
 * origin and the canonical VRM forward is +Z; rotating the wrapper
 * group 180° around Y turns Aura to look at the viewer.
 */
function FacingVRM() {
  return (
    <group rotation={[0, Math.PI, 0]}>
      <VRMAvatar url="/dimona.vrm" id={VRM_ID} />
    </group>
  );
}

function Legend() {
  return (
    <ol className="mt-2 space-y-2 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4 text-xs text-chrome-300">
      <li>
        <span className="font-mono text-chrome-100">vrm.load</span> · loads{" "}
        <code className="text-pink-200">/dimona.vrm</code> into the{" "}
        <code className="text-chrome-100">vrm</code> slice.
      </li>
      <li>
        <span className="font-mono text-chrome-100">audio.tts</span> · routes
        through the Web Speech API; the same call signature handles
        ElevenLabs / Kokoro / F5 when their keys are set.
      </li>
      <li>
        <span className="font-mono text-chrome-100">audio.visemes</span> ·
        estimates the viseme timeline from text length and writes the active
        viseme into the <code className="text-chrome-100">audio</code> slice
        every frame.
      </li>
      <li>
        <span className="font-mono text-chrome-100">vrm.expressions.blend</span>{" "}
        · reads <code className="text-chrome-100">audio.visemes</code> + Aura&rsquo;s
        mood, writes mouth + face weights into{" "}
        <code className="text-chrome-100">vrm.expressions</code>. The
        VRMAvatar applies them per frame in <code>useFrame</code>.
      </li>
    </ol>
  );
}
