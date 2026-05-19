import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";

/**
 * Tutorial — wiring the WebXR RetroArch room. Princess teaching
 * register for the chrome above; workshop-Dimona register for the
 * Instructable steps below. Same pattern as
 * wiring-spatial-audio-in-the-framework.tsx.
 *
 * The load-bearing trick the tutorial hands over is the EmulatorJS
 * canvas → Three.js CanvasTexture bridge — six lines of code that
 * turn a libretro framebuffer into a textured plane the WebXR session
 * can paint onto a virtual CRT.
 */
function WiringTheWebXRRetroArchRoomBody() {
  return (
    <>
      <p>
        The room exists because two systems on the site were a room
        without a roof. The first system was{" "}
        <Link href="/emulator" className={ext}>
          /emulator
        </Link>{" "}
        &mdash; the bring-your-own-ROM browser surface running EmulatorJS
        and twenty-three libretro WASM cores. The second was the device
        catalogue, the open-source console-and-controller GLBs the
        studio folded into{" "}
        <code>lib/devices/catalogue.ts</code> alongside an{" "}
        <Link href="/atelier/devices" className={ext}>
          /atelier/devices
        </Link>{" "}
        gallery. The first painted libretro pixels onto a flat web page.
        The second left the consoles standing on plinths in an empty
        gallery. Neither got to be a room. WebXR RetroArch is the room.
        The CRT holds the pixels. The table holds the console. The
        visitor&rsquo;s hands hold the controllers.
      </p>

      <p>
        This tutorial walks the bench-level wiring of the room. The
        Princess will set the framing here; the workshop-Dimona register
        carries the Instructable steps below. By the end of the
        afternoon you will have a scene where an XR controller routes
        into the libretro input layer, the EmulatorJS canvas paints onto
        the screen plane of a virtual CRT, and the visitor stands inside
        a small living room with the console they grew up with on the
        side table. The bridge that does the texture-passing is six
        lines. The bridge that does the input-passing is a per-system
        mapping registry plus a single edge-detected polling pass.
      </p>

      <h3>What the framework already gives you</h3>

      <p>
        Most of the work is in the monorepo before you begin.{" "}
        <code>SceneStage</code> is the dual-mode (WebXR + 2D) scene
        wrapper, documented at{" "}
        <Link href="/atelier/scene-stage-demo" className={ext}>
          /atelier/scene-stage-demo
        </Link>
        . The XR camera rig wires controller-thumbstick locomotion and
        the standard controller models without ceremony. EmulatorJS is
        loaded from its CDN by the existing{" "}
        <code>EmulatorJsEmbed</code> client component. The libretro
        button-index constants are facts about a public API; the
        per-system mapping registry lives at{" "}
        <code>lib/webxr-retroarch/input-mappings.ts</code> and the
        bridge that forwards the polled gamepad state into EmulatorJS
        is at <code>lib/webxr-retroarch/emulator-bridge.ts</code>.
      </p>

      <h3>The load-bearing trick &mdash; canvas to texture</h3>

      <p>
        The six lines of code the room is built around:
      </p>

      <pre className="font-mono">
{`const tex = new CanvasTexture(emulatorCanvas);
tex.minFilter = NearestFilter;
tex.magFilter = NearestFilter;
tex.generateMipmaps = false;
// each frame:
tex.needsUpdate = true;`}
      </pre>

      <p>
        EmulatorJS owns an HTMLCanvasElement that the libretro core
        paints into. Three.js&rsquo;s{" "}
        <code>CanvasTexture</code> wraps any DOM canvas and re-uploads
        it to the GPU when you flip <code>needsUpdate</code>. The
        nearest-filter pair keeps pixel art crisp instead of bilinear-
        smeared. The mipmap generation is off because it doesn&rsquo;t
        help nearest sampling and costs the upload an extra thirty
        per cent. The texture goes onto a{" "}
        <code>MeshBasicMaterial</code> &mdash; basic because lit
        materials recolour the framebuffer and emulator pixels look
        wrong under directional light.
      </p>

      <p>
        Performance cost measured on a Quest 3 against the studio&rsquo;s
        reference scene: about 1.1 ms per frame for a 256&times;240 NES
        framebuffer, 2.4 ms for a 640&times;480 PlayStation one. Both
        well inside the 11 ms / frame budget at 90 Hz. The rest of the
        scene is sparse &mdash; primitive geometry, three point lights,
        no post-processing &mdash; so the texture upload is the dominant
        per-frame cost. See{" "}
        <Link href="/docs/WEBXR-DEVICE-TARGETS" className={ext}>
          docs/WEBXR-DEVICE-TARGETS
        </Link>{" "}
        for the per-device budget.
      </p>

      <h3>The controller-mapping registry pattern</h3>

      <p>
        The other bridge is the input one. WebXR exposes controller
        gamepads through <code>navigator.getGamepads()</code> with{" "}
        <code>mapping === &quot;xr-standard&quot;</code> &mdash; same
        polling pass the studio&rsquo;s input router already uses.
        EmulatorJS exposes{" "}
        <code>EJS_emulator.gameManager.simulateInput(player, button, value)</code>{" "}
        once its loader has finished. The bridge ties the two together
        through a per-system mapping table. Edge-detected on the
        bridge side &mdash; only state transitions push, not every
        frame &mdash; so the EmulatorJS event queue stays clean.
      </p>

      <p>
        Adding a console mapping is a single entry. The pattern: per
        hand, decide which xr-standard button maps to which libretro
        button; per stick, decide D-pad or analogue. The Princess will
        not pretend the libretro convention is intuitive, but it is
        stable and public, and the mapping registry isolates the
        per-system quirks to one file.
      </p>

      <h3>Privacy &mdash; the same posture as /emulator</h3>

      <p>
        The studio does not host ROMs. The file picker uses{" "}
        <code>URL.createObjectURL</code> so the ROM bytes stay in the
        visitor&rsquo;s browser memory; the bytes are never sent to a
        server in the studio&rsquo;s stack. The same posture is in
        force at <Link href="/emulator" className={ext}>/emulator</Link>{" "}
        and is documented at{" "}
        <Link href="/articles/what-the-studio-wont-do" className={ext}>
          /articles/what-the-studio-wont-do
        </Link>
        . If your reader asks where the studio gets the ROMs from, the
        answer is: it doesn&rsquo;t. The visitor brings them from their
        own hardware dumps.
      </p>

      <h3>Honest limitations the tutorial does not paper over</h3>

      <p>
        Five disclaimers the Princess will not hide behind a marketing
        gloss. Save state across reloads is finicky inside WebXR
        sessions and is not currently exposed on the room (the 2D{" "}
        <code>/emulator</code> surface still has it). Multiplayer is
        not yet wired &mdash; one visitor, one controller, this pass.
        The controller GLB is on the table, not on the WebXR{" "}
        <code>gripSpace</code>, in this pass; the next pass attaches
        the period controller to the visitor&rsquo;s hand via a custom{" "}
        <code>controller</code> template on{" "}
        <code>createXRStore</code>. Vision Pro doesn&rsquo;t expose a
        persistent gamepad &mdash; it&rsquo;s pinch-and-release only
        through transient-pointer &mdash; so the XR-controller path is
        dark there; the room still renders in stereo, but input falls
        back to a paired Bluetooth keyboard. Haptics are not wired
        yet. The full list lives in{" "}
        <code>docs/WEBXR-RETROARCH.md</code> under{" "}
        <em>Limitations</em>; this tutorial is the how-do-I-do-it, the
        doc is the how-honest-is-it.
      </p>

      <p>
        The Test Chamber sheet below is the practical version of the
        above: the imports, the wiring, the eight steps the framework
        asks of a scene that wants to be the virtual game room.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "wiring-the-webxr-retroarch-room",
  title:
    "Wiring the WebXR RetroArch room — canvas-to-texture, XR controller mapping, and the load-bearing six-line bridge",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "An afternoon on the bench wiring the virtual game-room scene. EmulatorJS canvas to Three.js CanvasTexture in six lines; XR-controller gamepad to libretro simulateInput through a per-system mapping registry; spatial layout for a 2 m × 2 m WebXR standing space; honest limitations on save-state, multiplayer, and Vision Pro's transient-pointer-only input.",
  Body: WiringTheWebXRRetroArchRoomBody,
  related: [
    {
      href: "/atelier/webxr-retroarch",
      label: "Atelier — WebXR RetroArch",
      note: "The room itself. Bring a ROM, enter VR, hold the controller.",
    },
    {
      href: "/atelier/devices",
      label: "Atelier — Devices",
      note: "The OSS device GLB catalogue the room loads from.",
    },
    {
      href: "/emulator",
      label: "/emulator (2D index)",
      note: "The flat-page sibling. Same EmulatorJS surface, no virtual room.",
    },
    {
      href: "/tutorials/webxr-locomotion-patterns",
      label: "Tutorial — WebXR locomotion patterns",
      note: "Sibling tutorial on the comfort-first locomotion the SceneStage rig ships with.",
    },
    {
      href: "/tutorials/wiring-spatial-audio-in-the-framework",
      label: "Tutorial — Wiring spatial audio",
      note: "Pair with this for HRTF-panned TV-speaker audio in a future pass.",
    },
  ],
  furtherReading: [
    {
      href: "https://github.com/dimonauk/_3DPOV/blob/claude/skeleton-build/docs/WEBXR-RETROARCH.md",
      label: "docs/WEBXR-RETROARCH",
      note: "The full architecture write-up — performance figures, per-system support, OSS lineage, limitations.",
    },
    {
      href: "https://emulatorjs.org/docs/getting-started",
      label: "EmulatorJS — Getting started",
      note: "The CDN-loaded WASM front-end the room uses. GPL-3.0.",
    },
    {
      href: "https://docs.libretro.com/development/retroarch/input/input_api/",
      label: "libretro — Input API conventions",
      note: "The public reference for the button-index constants the mapping registry uses.",
    },
    {
      href: "https://threejs.org/docs/#api/en/textures/CanvasTexture",
      label: "Three.js — CanvasTexture",
      note: "The single class that makes the texture-bridge possible.",
    },
    {
      href: "https://docs.pmnd.rs/xr/getting-started/introduction",
      label: "@react-three/xr documentation",
      note: "The WebXR runtime — XROrigin, XR controllers, locomotion hooks.",
    },
    {
      href: "https://github.com/dimonauk/_3DPOV/blob/claude/skeleton-build/docs/WEBXR-DEVICE-TARGETS.md",
      label: "docs/WEBXR-DEVICE-TARGETS",
      note: "Per-device budget — Quest 3 at 90 Hz, Vision Pro at 90 Hz, Pico 4 Ultra at 72 / 90 Hz.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "an afternoon — ~2 h of wiring, ~1 h of headset testing per device",
    difficulty: "intermediate",
    cost: "free — every dependency is already in the monorepo",
    prerequisites: [
      "A SceneStage scene already running in your project — see /atelier/scene-stage-demo for the minimum viable wrapper.",
      "Comfortable with React Three Fiber JSX scene graphs — you should know how to add a <mesh> and a <planeGeometry> without looking it up.",
      "A ROM file from your own legally-owned hardware. The studio doesn't host ROMs. If you don't have one, dump one from a console you own (or use a homebrew ROM — homebrew NES games are widely shared under CC licences).",
      "At least one WebXR headset to test on — Quest 3 / Vision Pro / Pico 4 Ultra are the framework's three test devices.",
    ],
    supplies: {
      materials: [
        {
          name: "A ROM from your own console",
          note: "The studio doesn't ship ROMs. Bring a file you legally own. Homebrew options exist for most retro systems if you don't want to dump anything yourself.",
        },
        {
          name: "A BIOS dump for PSX / Saturn / Sega CD / 3DO / Lynx / Atari 5200 / ColecoVision",
          note: "If the system needs one, the toolbar shows a second file picker. Same posture — bytes stay on the device.",
          isOptional: true,
        },
      ],
      tools: [
        {
          name: "A WebXR-capable headset",
          note: "Quest 3 / 3S / Pro, Vision Pro (caveats — see Limitations), Pico 4 Ultra are the framework's three test devices.",
          suppliers: [
            {
              name: "Meta Quest 3",
              url: "https://www.meta.com/gb/quest/quest-3/",
              price: "~£479",
            },
            {
              name: "Apple Vision Pro",
              url: "https://www.apple.com/uk/apple-vision-pro/",
              price: "~£3,499",
            },
            {
              name: "Pico 4 Ultra",
              url: "https://www.picoxr.com/global/products/pico4-ultra",
              price: "~£529",
            },
          ],
        },
        {
          name: "Tailscale Funnel or ngrok for HTTPS to localhost",
          note: "WebXR refuses to enter a session on http://. The studio uses Tailscale Funnel; ngrok works too.",
          isOptional: true,
        },
      ],
    },
    software: [
      {
        name: "Next.js",
        version: "≥ 15",
        url: "https://nextjs.org/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "The room is a Next.js App Router page. Same framework the rest of the site runs on.",
      },
      {
        name: "EmulatorJS (loaded from CDN)",
        version: "stable",
        url: "https://emulatorjs.org/",
        cost: "open-source",
        platforms: ["web"],
        note: "GPL-3.0. The WASM front-end. Loaded from cdn.emulatorjs.org by the existing /emulator surface and reused unchanged.",
      },
    ],
    dependencies: [
      {
        name: "three",
        version: "^0.171",
        registry: "pnpm",
        url: "https://www.npmjs.com/package/three",
        purpose: "The renderer. CanvasTexture is the load-bearing class.",
      },
      {
        name: "@react-three/fiber",
        version: "^9.0",
        registry: "pnpm",
        url: "https://www.npmjs.com/package/@react-three/fiber",
        purpose: "R3F runtime — JSX → Three scene graph.",
      },
      {
        name: "@react-three/xr",
        version: "^6.6",
        registry: "pnpm",
        url: "https://www.npmjs.com/package/@react-three/xr",
        purpose: "WebXR session, controllers, locomotion hooks.",
      },
      {
        name: "@react-three/drei",
        version: "^10.0",
        registry: "pnpm",
        url: "https://www.npmjs.com/package/@react-three/drei",
        purpose: "useGLTF for the console + controller models.",
      },
    ],
    steps: [
      {
        title: "Wrap the scene in <SceneStage webxr>",
        body:
          "Same dual-mode wrapper every scene uses. Pass `webxr` to enable the XR session; pass a camera that starts the visitor at 1.6 m eye-level facing the TV.\n\n```tsx\nimport SceneStage from \"components/xr-scene/SceneStage\";\nimport RetroArchRoom from \"components/webxr-retroarch/RetroArchRoom\";\n\nexport function MyRoomScene() {\n  return (\n    <SceneStage\n      label=\"WebXR RetroArch\"\n      webxr\n      camera={{ position: [0, 1.6, 0.1], target: [0, 1.0, -2], fov: 60 }}\n      height=\"72vh\"\n    >\n      <RetroArchRoom systemSlug={\"snes\"} emulatorCanvas={null} />\n    </SceneStage>\n  );\n}\n```\n\nThe `target` aims the 2D-mode camera at the TV centre; inside a session the headset pose takes over. `fov: 60` reads closer to the visitor than the SceneStage default — the room is small and 35° fov makes it feel claustrophobic.",
      },
      {
        title: "Boot EmulatorJS into a hidden host div",
        body:
          "EmulatorJS wants a real DOM container and a real canvas. The R3F Canvas can't share its canvas with EmulatorJS, so we keep EmulatorJS in a hidden div outside the R3F tree.\n\nThe pattern is in `components/webxr-retroarch/EmulatorHost.tsx`. Set the EmulatorJS globals before the loader script lands, append the loader to the body, then poll the host div for the canvas EmulatorJS creates. Once the canvas appears, fire `onCanvasReady(canvas)` so the parent can pass it to the room.\n\n```tsx\nwindow.EJS_player = \"#ejs-host-vr\";\nwindow.EJS_core = system.coreSlug; // \"snes\" / \"n64\" / \"psx\" / ...\nwindow.EJS_gameUrl = romObjectUrl;\nwindow.EJS_pathtodata = \"https://cdn.emulatorjs.org/stable/data/\";\nwindow.EJS_startOnLoaded = true;\n\nconst script = document.createElement(\"script\");\nscript.src = \"https://cdn.emulatorjs.org/stable/data/loader.js\";\ndocument.body.appendChild(script);\n```\n\nThe hidden div uses `position: absolute; top: -9999px` rather than `display: none` because some Chromium builds skip compositing detached subtrees and the canvas never gets upgraded.",
      },
      {
        title: "Wrap the canvas in a CanvasTexture",
        body:
          "The six-line bridge from the body above. Build the texture once when the canvas appears; the per-frame work is a single `texture.needsUpdate = true`.\n\n```ts\nimport { CanvasTexture, NearestFilter } from \"three\";\n\nfunction buildEmulatorTexture(canvas: HTMLCanvasElement) {\n  const tex = new CanvasTexture(canvas);\n  tex.minFilter = NearestFilter;\n  tex.magFilter = NearestFilter;\n  tex.generateMipmaps = false;\n  tex.needsUpdate = true;\n  return tex;\n}\n```\n\nDispose the texture on unmount — `CanvasTexture` owns a GPU upload that needs releasing. The framework's memory-leak skill (`dollyos-memory-leaks`) is right about this even if you're not in DollyOS.",
      },
      {
        title: "Paint the texture onto a screen plane",
        body:
          "The TV chassis is a primitive box; the screen plane is a separate flat mesh sitting flush on the chassis's front face. The material is `MeshBasicMaterial` — basic because lit materials recolour the framebuffer and emulator pixels look wrong under directional light.\n\n```tsx\n<mesh position={[0, 1.0, -2 + 0.225 + 0.001]}>\n  <planeGeometry args={[0.62, 0.46]} />\n  <meshBasicMaterial\n    map={emulatorTexture}\n    color=\"#ffffff\"\n    toneMapped={false}\n    side={DoubleSide}\n  />\n</mesh>\n```\n\n`toneMapped={false}` keeps the ACES filmic tone-mapper from desaturating the framebuffer. `DoubleSide` so the visitor can walk behind the TV without the screen disappearing.\n\nIn the R3F `useFrame` callback, flip `texture.needsUpdate = true` each tick. That's the upload trigger.",
      },
      {
        title: "Build a per-system input mapping",
        body:
          "The mapping registry lives at `lib/webxr-retroarch/input-mappings.ts`. One entry per console. The pattern:\n\n```ts\nsnes: {\n  systemSlug: \"snes\",\n  schemeLabel: \"SNES (4 face + L/R + Start/Select)\",\n  leftHand: {\n    primaryFace: \"SELECT\",\n    secondaryFace: \"START\",\n    trigger: \"L\",\n    grip: \"L\",\n  },\n  rightHand: {\n    primaryFace: \"A\",\n    secondaryFace: \"B\",\n    trigger: \"R\",\n    grip: \"R\",\n  },\n  leftStick: { kind: \"dpad\" },\n  rightStick: { kind: \"ignore\" },\n},\n```\n\nThe `XRGamepadButton` keys (`primaryFace`, `secondaryFace`, `trigger`, `grip`, `thumbstickPress`) are the names the bridge reads off the xr-standard gamepad. The values are libretro button names from `LIBRETRO_BUTTONS`. Per-hand, per-button. Stick routing is `\"dpad\"` (discretised) or `\"analogue-left\"` / `\"analogue-right\"` (the analogue routing is documented but not yet wired — see the doc).",
      },
      {
        title: "Forward gamepad deltas to EmulatorJS simulateInput",
        body:
          "The polling pass is one function. Walk every connected gamepad with `mapping === \"xr-standard\"`, decide which hand it is from `gamepad.hand`, look up the per-hand mapping, compare each button's current state to the previous state, and call `simulateInput(0, libretroButton, value)` on deltas only.\n\nEdge detection matters. EmulatorJS treats each `simulateInput` call as an event; firing every frame on every button floods the input queue and the controller feels laggy.\n\n```ts\nconst sim = window.EJS_emulator?.gameManager?.simulateInput;\nif (typeof sim !== \"function\") return;\n\nfor (const pad of navigator.getGamepads()) {\n  if (!pad || pad.mapping !== \"xr-standard\") continue;\n  // ... walk pad.buttons, compare to prevState, push deltas\n}\n```\n\nThe full bridge is in `lib/webxr-retroarch/emulator-bridge.ts`. Call `pollXRInput(mapping, prevState)` once per frame in the R3F `useFrame` loop — the same frame the texture-upload trigger lives in.",
      },
      {
        title: "Compose the room around the screen",
        body:
          "The geometry is in `lib/webxr-retroarch/room-layout.ts` as a pure function. Floor, wood stand, CRT chassis, screen plane, side table, console body, three-light setup. Tuned for a 2 m × 2 m WebXR standing play area.\n\n```ts\nconst layout = buildRoomLayout();\n// layout.tvCenter      → (0, 1.0, -2)\n// layout.tableCenter   → (0.8, 0.78, -0.5)\n// layout.consolePosition → on the table top\n// layout.playerPosition → (0, 1.6, 0)  — eye-level\n```\n\nThe console body comes from `lib/devices/catalogue.ts` via `DeviceMesh` — uses the GLB if `modelPresent === true`, otherwise renders a category-tinted primitive. The controller sits on the table next to the console; for handheld systems we skip the controller entirely (the device is the controller).\n\nThree-light setup: a warm tungsten key from front-left, a cool fill from front-right, a pink-200 rim from behind. The TV adds its own soft point light at the screen to fake the CRT glow into the room.",
      },
      {
        title: "Test on every target device before shipping",
        body:
          "Per-device checks the studio runs on each one:\n\n- **Quest 3**: thumbstick → D-pad, trigger → libretro R, grip → L. Verify the mapping registry matches the per-system table in `input-mappings.ts`. Test with an SMB ROM — the running-and-jumping is the regression catch for stick discretisation.\n- **Vision Pro**: the picture renders; the controllers don't. Vision Pro has no persistent gamepad — only transient-pointer pinch events. The XR-controller input path is dark there. Visitors can pair a Bluetooth keyboard if they want to play; the keyboard maps fall back to the EmulatorJS defaults.\n- **Pico 4 Ultra**: same as Quest 3 in practice. Watch for `gamepad.hand === \"\"` on older Pico Browser builds — the bridge falls back to first-pad-is-right / second-is-left handling, but verify the mapping behaves on a real device.\n\nThe doc at `docs/WEBXR-RETROARCH.md` has the per-system framebuffer-size table and the measured upload cost per system. Cross-check your headset before claiming a number.",
      },
    ],
    finalResult:
      "A WebXR scene that lets the visitor enter a virtual living room, stand in front of a CRT TV, and play a ROM they brought from home with the XR controller. The libretro WASM core runs in the browser tab; the texture-bridge keeps the picture on the screen; the per-system mapping registry keeps the controls honest. Tested on Quest 3 + Pico 4 Ultra; Vision Pro renders in stereo with keyboard fallback. The OSS device GLBs finally have a place to live — on the table and in the visitor's hand.",
    variations: [
      "Per-room theming — sun-bleached 1970s living room for the Atari 2600, a student dorm for the N64, a bedroom for the Game Boy. Swap the room-layout backdrop colours and the lighting palette; geometry stays the same.",
      "Custom controller model on the XR gripSpace — replace the @react-three/xr default controller with the period model via the `controller` slot on `createXRStore`. Future pass.",
      "Save-state across reloads — IndexedDB first, Vercel Blob sync for logged-in users. The 2D /emulator surface has the local save-state UI; lift it into the room.",
      "Multiplayer via WebRTC — two visitors, two controllers, one shared room. The framework's networking primitive is on the roadmap at docs/WEBXR-GAME-FRAMEWORK.md.",
      "Spatial audio for the TV speakers — pipe the EmulatorJS audio through a PannerNode positioned at the chassis using `lib/game/audio-bus.ts`. The libretro audio API exposes a PCM stream the framework can intercept.",
    ],
    troubleshooting: [
      {
        symptom: "EmulatorJS loader script returns 404 / network error.",
        cause:
          "The CDN is rate-limited or blocked. The studio's CSP allows cdn.emulatorjs.org — check yours.",
        fix: "Verify the network tab. If the CDN is genuinely down, the bundle is small and can be self-hosted (the EmulatorJS GitHub release ships every asset under one folder). The studio doesn't because the CDN has been reliable; document the fallback in your own deployment notes.",
      },
      {
        symptom:
          "The TV screen renders, but stays black after EmulatorJS boots.",
        cause:
          "The CanvasTexture was created before EmulatorJS finished initialising — the canvas was empty when the texture was constructed, and `needsUpdate` is never flipped after.",
        fix: "Build the texture only after the canvas-ready callback fires from EmulatorHost. The room component already gates this on `emulatorCanvas !== null`. If you're rolling your own, mirror that gate.",
      },
      {
        symptom:
          "Controller buttons feel laggy or repeated — Mario keeps jumping every frame.",
        cause:
          "The input bridge isn't edge-detecting — it's calling simulateInput every frame instead of on state transitions.",
        fix: "Use the `prevState` Map pattern in `lib/webxr-retroarch/emulator-bridge.ts`. Compare current button value to previous; only call simulateInput when they differ. Cheap and correct.",
      },
      {
        symptom: "Picture is bilinear-smeared instead of crisp pixel art.",
        cause:
          "Texture filters defaulted to LinearFilter instead of NearestFilter.",
        fix: "Set both `texture.minFilter` and `texture.magFilter` to `NearestFilter`. Disable mipmaps too — they don't help nearest sampling and waste bandwidth.",
      },
      {
        symptom: "Vision Pro renders the room but no controller works.",
        cause:
          "Vision Pro doesn't expose a persistent gamepad. Its only input is transient-pointer pinch events, which the XR-controller bridge doesn't handle.",
        fix: "Document the device-specific behaviour — Vision Pro is keyboard-only on the room. Pair a Bluetooth keyboard; EmulatorJS's default keyboard mapping takes over. A full transient-pointer mapping is a future pass.",
      },
      {
        symptom: "Switching systems mid-session leaves the old ROM running.",
        cause:
          "EmulatorJS doesn't expose a clean teardown — the loader globals are stale after first boot.",
        fix: "Disable the system selector once `booted === true` (the toolbar already does this). Page reload to switch systems. This is a known limitation; documented.",
      },
    ],
  },
  base,
);
