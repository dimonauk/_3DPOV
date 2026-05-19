import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";

/**
 * Tutorial — wiring spatial audio into the Holoflow framework. Aura
 * Test Chamber + workshop-Dimona composite. The free-form Body holds
 * the Princess framing; the Instructable surface holds the
 * workshop-Dimona step-by-step. Recipe drives the audio-bus primitive
 * at lib/game/audio-bus.ts — created on a user gesture, fed by URL,
 * positioned in world space, listener pose driven from the R3F
 * camera each frame. The companion article at
 * /articles/spatial-audio-in-webxr is the why; this is the how.
 */
function WiringSpatialAudioBody() {
  return (
    <>
      <p>
        Wiring spatial audio into a WebXR scene is one of those
        evenings on the bench where the work the wearer hears is
        wildly disproportionate to the work the author put in. The
        browser does most of the dramatic heavy lifting &mdash; the
        head-related transfer function, the per-ear convolution, the
        listener orientation maths &mdash; for the price of a
        <code>PannerNode</code> with <code>panningModel</code> set to
        <code>&ldquo;HRTF&rdquo;</code>. The author&rsquo;s job is to
        keep the bus alive across React remounts, to update the
        listener pose every frame, and to make sure the first call
        happens after a user gesture so the autoplay policy
        doesn&rsquo;t silently swallow the audio.
      </p>

      <p>
        The Princess will set the framing; the workshop-Dimona register
        carries the bench-level steps below. The companion article{" "}
        <Link href="/articles/spatial-audio-in-webxr" className={ext}>
          Spatial audio in WebXR &mdash; HRTF panning, the aesthetic,
          and why your eyes lie when your ears don&rsquo;t
        </Link>{" "}
        is the why-this-matters reading; this tutorial is the
        how-do-I-do-it. The primitive doing the work is{" "}
        <code>lib/game/audio-bus.ts</code>, which exposes a small
        surface: <code>load</code>, <code>play</code>, <code>stop</code>,{" "}
        <code>setListenerPose</code>, <code>destroy</code>. Everything
        below is a way of talking to that surface from inside a React
        Three Fiber tree.
      </p>

      <p>
        The Test Chamber sheet has the supplies, the software, and the
        step-by-step. You will leave the evening with a scene where a
        positioned sound moves with an object, the listener tracks the
        headset, and an unpositioned UI click coexists with both. From
        that primitive every other audio behaviour in the framework is
        a small variation.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "wiring-spatial-audio-in-the-framework",
  title:
    "Wiring spatial audio in the Holoflow framework — Web Audio, HRTF panning, and the audio-bus primitive",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "An evening on the bench wiring spatial audio into a WebXR scene. Initialise the audio-bus on a user gesture, load and play unpositioned cues, position a sound in world space, drive the listener pose from the R3F camera every frame, handle the autoplay policy and the Quest browser quirks. Pure Web Audio — no dependencies beyond the browser.",
  Body: WiringSpatialAudioBody,
  related: [
    {
      href: "/articles/spatial-audio-in-webxr",
      label: "Article — Spatial audio in WebXR",
      note: "The why-this-matters companion. Perceptual argument, canon, the four flavours of WebXR audio.",
    },
    {
      href: "/atelier/sculpture-gallery",
      label: "Sculpture gallery atelier",
      note: "The studio space most likely to grow per-object audio signatures using this recipe.",
    },
    {
      href: "/atelier/scene-stage-demo",
      label: "Scene stage demo atelier",
      note: "The R3F scene the recipe drops into without ceremony.",
    },
    {
      href: "/articles/low-poly-graphics-in-vr",
      label: "Article — Low-poly graphics in VR",
      note: "The visual sibling. Why audio carries the room when the geometry is sparse.",
    },
  ],
  furtherReading: [
    {
      href: "https://developer.mozilla.org/en-US/docs/Web/API/PannerNode",
      label: "MDN — PannerNode (HRTF panning)",
      note: "The single primitive doing the spatial work behind the bus.",
    },
    {
      href: "https://developer.mozilla.org/en-US/docs/Web/API/AudioListener",
      label: "MDN — AudioListener (position + orientation)",
      note: "The other half of the spatial pair. Update both per frame from the headset pose.",
    },
    {
      href: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices",
      label: "MDN — Web Audio best practices",
      note: "Autoplay policy, decode-once caching, AudioContext lifecycle.",
    },
    {
      href: "https://r3f.docs.pmnd.rs/api/hooks",
      label: "React Three Fiber — useFrame / useThree",
      note: "The two hooks the recipe uses to bridge the scene clock and camera into the audio bus.",
    },
    {
      href: "https://www.w3.org/TR/webaudio/",
      label: "W3C — Web Audio API specification",
      note: "The spec the audio-bus primitive targets.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "an evening — about 2-3 h of bench time",
    difficulty: "intermediate",
    cost: "free — Web Audio is in the browser, the bus primitive is in the framework",
    prerequisites: [
      "Comfortable with React + Three.js. You can read a useFrame loop without flinching.",
      "You understand you're inside a Next.js client component — the recipe lives below a 'use client' directive.",
      "You can put one CC0 audio file in /public/audio/, or you're willing to synthesise a sine tone from scratch (the alternative path below is under 50 lines).",
    ],
    supplies: {
      materials: [
        {
          name: "One short CC0 audio file (.wav or .ogg)",
          quantity: "1× clip, ≤ 3 seconds",
          note: "A click, a chime, a bell — anything mono with a clear attack reads well under HRTF panning. Drop it into /public/audio/. If you can't source one, skip to the sine-tone alternative in the steps.",
          suppliers: [
            {
              name: "ambientCG audio library (CC0)",
              url: "https://ambientcg.com/list?type=Audio",
              price: "free",
            },
            {
              name: "freesound.org (CC0 filter)",
              url: "https://freesound.org/search/?f=license%3A%22Creative+Commons+0%22",
              price: "free",
            },
            {
              name: "BBC Sound Effects (rs licence, attribution-style)",
              url: "https://sound-effects.bbcrewind.co.uk/",
              price: "free for personal / educational",
            },
          ],
        },
        {
          name: "A WebXR-capable scene to drop the bus into",
          note: "Any existing R3F Canvas with an XRButton or VRButton will do. The studio's scene-stage-demo atelier is the smallest viable host.",
        },
      ],
      tools: [
        {
          name: "A modern desktop browser (Chromium-based ideal for first iteration)",
          note: "Chromium gets you the cleanest devtools view of the AudioContext and the most permissive autoplay heuristics during development.",
          suppliers: [
            {
              name: "Google Chrome",
              url: "https://www.google.com/chrome/",
              price: "free",
            },
            {
              name: "Microsoft Edge",
              url: "https://www.microsoft.com/edge",
              price: "free",
            },
            {
              name: "Firefox (also fine; slightly different devtools UI)",
              url: "https://www.mozilla.org/firefox/",
              price: "free",
            },
          ],
        },
        {
          name: "A standalone headset for the proper test",
          isOptional: true,
          note: "Quest 3 in Meta Browser is the studio's baseline. Vision Pro Safari is the rigorous test — different HRTF, different listener-orientation API quirks.",
          suppliers: [
            {
              name: "Meta Quest 3",
              url: "https://www.meta.com/quest/quest-3/",
              price: "£479",
            },
            {
              name: "Apple Vision Pro",
              url: "https://www.apple.com/uk/apple-vision-pro/",
              price: "£3,499",
            },
          ],
        },
        {
          name: "Stereo headphones for the desktop iteration",
          note: "HRTF is convolution against a head model — speakers won't reproduce the effect. Any closed or open-back headphone teaches the technique; bundled earbuds are the worst case to test against.",
        },
      ],
    },
    software: [
      {
        name: "Node.js + pnpm (for the Holoflow dev server)",
        version: "Node ≥ 20, pnpm ≥ 9",
        url: "https://pnpm.io/",
        cost: "free",
        platforms: ["windows", "macos", "linux"],
        note: "Standard Holoflow dev environment. The recipe runs on top of whatever Next.js dev server you already have.",
      },
      {
        name: "Audacity (optional, for trimming the audio clip)",
        version: "≥ 3.4",
        url: "https://www.audacityteam.org/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Use to trim, fade and mono-fold the clip. HRTF wants mono input; a stereo clip will play, but the panner only uses the first channel.",
      },
    ],
    dependencies: [
      {
        name: "@react-three/fiber",
        registry: "pnpm",
        url: "https://www.npmjs.com/package/@react-three/fiber",
        purpose: "useFrame + useThree, the two hooks the recipe leans on.",
      },
      {
        name: "@react-three/xr",
        registry: "pnpm",
        url: "https://www.npmjs.com/package/@react-three/xr",
        purpose: "XR session lifecycle. The recipe is agnostic about which XR library wraps the Canvas; this is the studio default.",
      },
      {
        name: "three",
        registry: "pnpm",
        url: "https://www.npmjs.com/package/three",
        purpose: "The scene library the R3F tree wraps. Already in any Holoflow scene.",
      },
    ],
    steps: [
      {
        title: "Import the audio bus and instantiate it lazily",
        body: "Open the React component that owns the scene Canvas. Import the bus from lib/game/audio-bus and create a ref that holds the live instance. The instance is created lazily on the first user gesture — not at module load, not at component mount — because every browser suspends the AudioContext until the user has actually interacted with the page.\n\nworkshop-Dimona pattern in the field:\n\n```tsx\n'use client';\nimport { useEffect, useRef } from 'react';\nimport { createAudioBus, type AudioBus } from 'lib/game/audio-bus';\n\nexport function Scene() {\n  const busRef = useRef<AudioBus | null>(null);\n\n  useEffect(() => {\n    return () => {\n      busRef.current?.destroy();\n      busRef.current = null;\n    };\n  }, []);\n\n  // ... bus is instantiated on first user gesture, see step 2.\n}\n```\n\nThe `destroy` call in the cleanup is what keeps the bus from leaking across hot-module-reloads in dev. Skip it and your browser tab will accumulate AudioContexts every time you save.",
      },
      {
        title: "Initialise on user gesture (autoplay policy)",
        body: "Wire the first `createAudioBus()` call to a pointerdown / click handler on whatever the wearer touches to enter your scene — the XRButton, an explicit \"start\" button, anywhere a verifiable gesture lives.\n\n```tsx\nfunction onEnter() {\n  if (!busRef.current) {\n    busRef.current = createAudioBus();\n  }\n  // ... the bus is now alive and the AudioContext is running.\n}\n```\n\nWhy not instantiate in useEffect on mount? Because in Chrome, Safari, Firefox and Meta Browser the AudioContext starts in the `suspended` state and stays there until a user gesture resumes it. The bus primitive will queue play() calls and replay them on the first gesture — but it cannot manufacture the gesture itself. The pattern of \"button click → create bus\" is the one that survives the autoplay heuristics on every browser the studio has tested.",
      },
      {
        title: "Load a sound",
        body: "Once the bus exists, load your CC0 clip by URL. The bus fetches the file, decodes it once into an AudioBuffer, and caches the buffer under the id you give it. Subsequent `play()` calls reuse the decoded buffer.\n\n```tsx\nasync function onEnter() {\n  if (!busRef.current) {\n    busRef.current = createAudioBus();\n  }\n  await busRef.current.load('click', '/audio/click.wav');\n  await busRef.current.load('chime', '/audio/chime.wav');\n}\n```\n\nLoad calls are idempotent — calling `load('click', ...)` twice is fine, the second call returns immediately. The studio's habit is to load every clip the scene needs in the `onEnter` handler before the wearer is shown the scene, so the first `play()` call inside the scene is instant.",
      },
      {
        title: "Play an unpositioned sound (UI click)",
        body: "The simplest case. No options, no position. Plays through the master gain only — no HRTF, no pan. Use for confirmation cues, UI feedback, anything that should read as \"the system speaking\" rather than \"a thing in the room\".\n\n```tsx\nfunction onConfirmButtonClick() {\n  busRef.current?.play('click');\n}\n```\n\nThat's it. The cue is stereo (mono input duplicated across both channels) and unpositional. Cheap to fire; safe to fire many of at once.",
      },
      {
        title: "Play a positioned sound (HRTF panning)",
        body: "Pass a `position` tuple in world space (the same coordinate frame the R3F scene uses). The bus routes the sound through a PannerNode with `panningModel = 'HRTF'`, which the browser convolves against a generic head model and produces a binaural stereo result. The wearer reads the result as a sound at the given point.\n\n```tsx\nfunction onChimeTrigger() {\n  busRef.current?.play('chime', {\n    position: [2, 0, -3], // 2m right, ground level, 3m forward\n    volume: 0.8,\n  });\n}\n```\n\nDistance attenuation is set in the bus to an inverse model with a 30m default `maxDistance`. Over-ride with `maxDistance` per call if a particular cue needs a different reach.",
      },
      {
        title: "Tie position to a scene object (useFrame loop)",
        body: "For a sound that moves with an object — a creature, a vehicle, a thrown ball — fire the positioned `play()` once and stop. If the cue is short, the per-call position captures where the object was when the cue fired; the wearer doesn't notice that the cue stopped tracking the object once it started.\n\nFor a continuous loop that needs to follow an object as it moves, drive a per-frame position update by re-firing the cue every N frames. The audio-bus primitive doesn't yet expose a `setPosition` for a running source (it would mean tracking active source handles and exposing them as a typed return); the workshop pattern below uses the short-cue model:\n\n```tsx\nimport { useFrame } from '@react-three/fiber';\n\nfunction MovingChime({ targetRef, bus }: { targetRef: any; bus: AudioBus }) {\n  const lastFire = useRef(0);\n  useFrame((state) => {\n    if (!targetRef.current) return;\n    const now = state.clock.getElapsedTime();\n    if (now - lastFire.current < 1.0) return; // fire once per second\n    lastFire.current = now;\n    const { x, y, z } = targetRef.current.position;\n    bus.play('chime', { position: [x, y, z], volume: 0.6 });\n  });\n  return null;\n}\n```\n\nThis keeps the moving-source illusion intact for cues short enough that the wearer doesn't perceive the position lock. For genuinely continuous looping sources that must follow a moving object, the next iteration of the bus will expose a source handle with `setPosition`; the TODO is tracked in the audio-bus source comments.",
      },
      {
        title: "Drive the listener pose from the camera (useThree)",
        body: "The other half of HRTF panning is the listener orientation. The Web Audio AudioListener has a position and a forward vector; updating both every frame from the headset camera means the wearer's head rotation is reflected immediately in the audio scene.\n\n```tsx\nimport { useFrame, useThree } from '@react-three/fiber';\nimport { Vector3 } from 'three';\n\nfunction AudioListenerSync({ bus }: { bus: AudioBus }) {\n  const camera = useThree((s) => s.camera);\n  const forward = useRef(new Vector3());\n  useFrame(() => {\n    camera.getWorldDirection(forward.current);\n    bus.setListenerPose({\n      position: [camera.position.x, camera.position.y, camera.position.z],\n      forward: [forward.current.x, forward.current.y, forward.current.z],\n      up: [0, 1, 0],\n    });\n  });\n  return null;\n}\n```\n\nDrop `<AudioListenerSync bus={busRef.current!} />` inside the Canvas (and only after the bus is created — guard with a conditional render or pass the ref through). Inside an XR session the R3F camera tracks the headset; the audio listener now tracks it as well.",
      },
      {
        title: "Handle headset rotation correctly",
        body: "The forward vector is what makes HRTF panning believable when the wearer turns their head. Forget to update it and the audio scene stays glued to the wearer's original facing — a sound to the left when they entered will still read as to the left after they've turned ninety degrees right, which is the audio equivalent of motion sickness.\n\nThe `getWorldDirection` call in step 7 already covers this. The thing to verify is that you're calling it every frame, not in a useEffect that fires once. If you're seeing audio that doesn't update with head rotation, the listener sync hook is not running.\n\nOn Vision Pro Safari specifically, the listener orientation API has a quirk — the legacy `setOrientation` method is preferred over the per-axis params on some build trains. The audio-bus primitive already handles both paths internally; you do not need to special-case anything in your scene code.",
      },
      {
        title: "Test on a desktop browser first, headset second",
        body: "Open the page in a Chromium browser on stereo headphones. Trigger the unpositioned click. Trigger the positioned chime at [2, 0, -3]. Turn your head (the OrbitControls camera, in dev) and confirm the chime stays in the same world-space spot.\n\nOnly then strap on the headset. The Quest 3 in Meta Browser is the studio's baseline — Web Audio works, HRTF panning works, listener pose updates work. Vision Pro Safari is the rigorous test; mobile Safari on iPhone is the cautious test. If anything sounds wrong, the first thing to check is whether `panningModel` is actually HRTF on the running PannerNode (Chromium devtools → AudioContext panel will show you).",
      },
    ],
    finalResult:
      "A WebXR scene where an unpositioned click confirms a UI action, a positioned chime appears at a believable point in space, and the audio scene rotates with the wearer's head. The bus is created once on entry, destroyed on unmount, and survives hot-module reloads cleanly. From this primitive every other audio behaviour in the framework — environmental loops, footstep cues, voice acting placed in the room — is one variation away.",
    variations: [
      "3D loops — pass `loop: true` to a positioned cue for ambient sources that should run continuously from a fixed point (a fan, a torch, a fountain). Stop them with `bus.stop(id)` when leaving the area.",
      "Doppler simulation — feed the source's velocity vector to a PannerNode's `setVelocity` for the cheap Doppler effect. (The current audio-bus surface does not yet expose this; add it as a follow-up TODO if your scene needs it.)",
      "Reverb zones — wrap the bus output in a ConvolverNode with a short impulse response for the room the wearer is in; cross-fade impulse responses as the wearer moves between rooms.",
      "Spatialised TTS — pipe a synthesised voice (Kokoro or similar) through the bus as a positioned source; the narrator now lives at a specific point in the room rather than at the master bus.",
      "Ambisonic ambiences — outside the bus's current scope; use Resonance Audio or Steam Audio for B-format decoding when the brief is a captured location ambience.",
    ],
    troubleshooting: [
      {
        symptom: "Nothing plays at all",
        cause:
          "Almost always the autoplay policy. The AudioContext is suspended and there hasn't been a verified user gesture to resume it.",
        fix: "Confirm `createAudioBus()` is being called from a click handler, not from useEffect on mount. Open devtools → Application or the Chromium AudioContext panel and check the context state is 'running'. If it's 'suspended', the gesture didn't fire (or the click handler is on a non-interactive element the browser doesn't trust).",
      },
      {
        symptom: "The sound plays but feels flat — no spatial sense of position",
        cause:
          "The PannerNode is falling back to equalpower instead of HRTF, or the cue is being played without a `position` option, or the listener pose isn't being updated.",
        fix: "Verify in devtools that `panningModel` on the running PannerNode is 'HRTF'. Confirm the `play()` call has a `position` option. Confirm the AudioListenerSync hook is rendered inside the Canvas and is firing useFrame. Confirm you're listening on headphones — desktop speakers will not reproduce HRTF panning.",
      },
      {
        symptom: "Audio lags noticeably behind the visual cue on Quest",
        cause:
          "Web Audio in Meta Browser has a ~100ms baseline output latency that the spec calls 'interactive' but which is enough to feel late on a rhythmic cue.",
        fix: "For rhythm-critical content, bake the rhythm into a single longer clip with an anchor cue at the start so the wearer's brain entrains on the clip rather than on the per-event timing. Avoid one-shot percussion fired per beat — the latency will be audible.",
      },
      {
        symptom: "Audio works on desktop Chrome but breaks on Vision Pro Safari",
        cause:
          "Listener orientation update API differs between browsers; older Safari builds prefer the legacy `setOrientation` method to the per-axis AudioParam form.",
        fix: "The audio-bus primitive already tries the spec form first and falls back to the legacy method, so this should not be a code-level fix. If you're still seeing it, you've probably hand-rolled a listener update somewhere outside the bus. Route all listener updates through `bus.setListenerPose`.",
      },
      {
        symptom: "AudioContexts accumulating across hot-module reloads in dev",
        cause:
          "useEffect cleanup is not calling `bus.destroy()`, so each HMR cycle leaves the previous AudioContext alive in memory.",
        fix: "Confirm your useEffect returns a cleanup function that calls `busRef.current?.destroy()` and nulls the ref. After this, dev reloads are clean — verify by opening devtools → Memory and watching the count of live AudioContexts.",
      },
      {
        symptom: "First sound after the gesture plays late or not at all",
        cause:
          "The AudioContext was suspended at the time of the `play()` call; the bus queued it but the queue runs on the resume callback, which itself takes a few hundred milliseconds.",
        fix: "Trigger a silent 'warm-up' play in the gesture handler before any audible cue — `bus.play('click', { volume: 0 })` is enough to flush the queue and warm the audio thread. After that, real plays are instant.",
      },
    ],
  },
  base,
);
