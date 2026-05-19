import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

import { WiringTheWebXRRetroArchRoomBody } from "./wiring-the-webxr-retroarch-room.body";

/**
 * Tutorial — wiring the WebXR RetroArch room. The free-form Princess-
 * register body lives in the sibling `.body.tsx` so this file stays
 * under the studio's 300-line per-file rule; the Instructable steps
 * (workshop-Dimona register) live here.
 *
 * The load-bearing trick the tutorial hands over is the EmulatorJS
 * canvas → Three.js CanvasTexture bridge — six lines of code that
 * turn a libretro framebuffer into a textured plane the WebXR session
 * can paint onto a virtual CRT.
 */

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
            { name: "Meta Quest 3", url: "https://www.meta.com/gb/quest/quest-3/", price: "~£479" },
            { name: "Apple Vision Pro", url: "https://www.apple.com/uk/apple-vision-pro/", price: "~£3,499" },
            { name: "Pico 4 Ultra", url: "https://www.picoxr.com/global/products/pico4-ultra", price: "~£529" },
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
      { name: "three", version: "^0.171", registry: "pnpm", url: "https://www.npmjs.com/package/three", purpose: "The renderer. CanvasTexture is the load-bearing class." },
      { name: "@react-three/fiber", version: "^9.0", registry: "pnpm", url: "https://www.npmjs.com/package/@react-three/fiber", purpose: "R3F runtime — JSX → Three scene graph." },
      { name: "@react-three/xr", version: "^6.6", registry: "pnpm", url: "https://www.npmjs.com/package/@react-three/xr", purpose: "WebXR session, controllers, locomotion hooks." },
      { name: "@react-three/drei", version: "^10.0", registry: "pnpm", url: "https://www.npmjs.com/package/@react-three/drei", purpose: "useGLTF for the console + controller models." },
    ],
    steps: [
      {
        title: "Wrap the scene in <SceneStage webxr>",
        body:
          "Same dual-mode wrapper every scene uses. Pass `webxr` to enable the XR session; pass a camera that starts the visitor at 1.6 m eye-level facing the TV.\n\n```tsx\nimport SceneStage from \"components/xr-scene/SceneStage\";\nimport RetroArchRoom from \"components/webxr-retroarch/RetroArchRoom\";\n\nexport function MyRoomScene() {\n  return (\n    <SceneStage\n      label=\"WebXR RetroArch\"\n      webxr\n      camera={{ position: [0, 1.6, 0.1], target: [0, 1.0, -2], fov: 60 }}\n      height=\"72vh\"\n    >\n      <RetroArchRoom systemSlug={\"snes\"} emulatorCanvas={null} />\n    </SceneStage>\n  );\n}\n```\n\n`fov: 60` reads closer to the visitor than the SceneStage default — the room is small and 35° fov makes it feel claustrophobic.",
      },
      {
        title: "Boot EmulatorJS into a hidden host div",
        body:
          "EmulatorJS wants a real DOM container and a real canvas. The R3F Canvas can't share its canvas, so EmulatorJS lives in a hidden div outside the R3F tree.\n\nSet the EmulatorJS globals before the loader script lands, append the loader to the body, then poll the host div for the canvas EmulatorJS creates. Once it appears, fire `onCanvasReady(canvas)` so the parent can pass it to the room.\n\n```tsx\nwindow.EJS_player = \"#ejs-host-vr\";\nwindow.EJS_core = system.coreSlug; // \"snes\" / \"n64\" / \"psx\" / ...\nwindow.EJS_gameUrl = romObjectUrl;\nwindow.EJS_pathtodata = \"https://cdn.emulatorjs.org/stable/data/\";\nwindow.EJS_startOnLoaded = true;\n\nconst script = document.createElement(\"script\");\nscript.src = \"https://cdn.emulatorjs.org/stable/data/loader.js\";\ndocument.body.appendChild(script);\n```\n\nThe hidden div uses `position: absolute; top: -9999px` rather than `display: none` — some Chromium builds skip compositing detached subtrees and the canvas never gets upgraded.",
      },
      {
        title: "Wrap the canvas in a CanvasTexture",
        body:
          "The six-line bridge from the body above. Build the texture once when the canvas appears; the per-frame work is a single `texture.needsUpdate = true`.\n\n```ts\nimport { CanvasTexture, NearestFilter } from \"three\";\n\nfunction buildEmulatorTexture(canvas: HTMLCanvasElement) {\n  const tex = new CanvasTexture(canvas);\n  tex.minFilter = NearestFilter;\n  tex.magFilter = NearestFilter;\n  tex.generateMipmaps = false;\n  tex.needsUpdate = true;\n  return tex;\n}\n```\n\nDispose the texture on unmount — `CanvasTexture` owns a GPU upload that needs releasing.",
      },
      {
        title: "Paint the texture onto a screen plane",
        body:
          "The TV chassis is a primitive box; the screen plane is a separate flat mesh sitting flush on the chassis's front face. The material is `MeshBasicMaterial` — basic because lit materials recolour the framebuffer and emulator pixels look wrong under directional light.\n\n```tsx\n<mesh position={[0, 1.0, -2 + 0.225 + 0.001]}>\n  <planeGeometry args={[0.62, 0.46]} />\n  <meshBasicMaterial\n    map={emulatorTexture}\n    color=\"#ffffff\"\n    toneMapped={false}\n    side={DoubleSide}\n  />\n</mesh>\n```\n\n`toneMapped={false}` keeps the ACES filmic tone-mapper from desaturating the framebuffer. In the R3F `useFrame` callback, flip `texture.needsUpdate = true` each tick.",
      },
      {
        title: "Build a per-system input mapping",
        body:
          "The mapping registry lives at `lib/webxr-retroarch/input-mappings.ts`. One entry per console:\n\n```ts\nsnes: {\n  systemSlug: \"snes\",\n  schemeLabel: \"SNES (4 face + L/R + Start/Select)\",\n  leftHand: { primaryFace: \"SELECT\", secondaryFace: \"START\", trigger: \"L\", grip: \"L\" },\n  rightHand: { primaryFace: \"A\", secondaryFace: \"B\", trigger: \"R\", grip: \"R\" },\n  leftStick: { kind: \"dpad\" },\n  rightStick: { kind: \"ignore\" },\n},\n```\n\nThe `XRGamepadButton` keys (`primaryFace`, `secondaryFace`, `trigger`, `grip`, `thumbstickPress`) are the names the bridge reads off the xr-standard gamepad. The values are libretro button names from `LIBRETRO_BUTTONS`. Stick routing is `\"dpad\"` (discretised) or `\"analogue-left\"` / `\"analogue-right\"` (analogue routing is documented but not yet wired — see the doc).",
      },
      {
        title: "Forward gamepad deltas to EmulatorJS simulateInput",
        body:
          "Walk every connected gamepad with `mapping === \"xr-standard\"`, decide which hand it is from `gamepad.hand`, look up the per-hand mapping, compare each button's current state to the previous state, and call `simulateInput(0, libretroButton, value)` on deltas only.\n\nEdge detection matters. EmulatorJS treats each `simulateInput` call as an event; firing every frame on every button floods the input queue and the controller feels laggy.\n\n```ts\nconst sim = window.EJS_emulator?.gameManager?.simulateInput;\nif (typeof sim !== \"function\") return;\n\nfor (const pad of navigator.getGamepads()) {\n  if (!pad || pad.mapping !== \"xr-standard\") continue;\n  // ... walk pad.buttons, compare to prevState, push deltas\n}\n```\n\nThe full bridge is in `lib/webxr-retroarch/emulator-bridge.ts`. Call `pollXRInput(mapping, prevState)` once per frame in the R3F `useFrame` loop.",
      },
      {
        title: "Compose the room around the screen",
        body:
          "The geometry is in `lib/webxr-retroarch/room-layout.ts` as a pure function. Floor, wood stand, CRT chassis, screen plane, side table, console body, three-light setup. Tuned for a 2 m × 2 m WebXR standing play area.\n\n```ts\nconst layout = buildRoomLayout();\n// layout.tvCenter      → (0, 1.0, -2)\n// layout.tableCenter   → (0.8, 0.78, -0.5)\n// layout.consolePosition → on the table top\n// layout.playerPosition → (0, 1.6, 0)  — eye-level\n```\n\nThe console body comes from `lib/devices/catalogue.ts` via `DeviceMesh`. The controller sits on the table; handhelds skip the controller entirely (the device is the controller).\n\nThree-light setup: a warm tungsten key from front-left, a cool fill from front-right, a pink-200 rim from behind. The TV adds its own soft point light at the screen to fake the CRT glow.",
      },
      {
        title: "Test on every target device before shipping",
        body:
          "Per-device checks the studio runs on each one:\n\n- **Quest 3**: thumbstick → D-pad, trigger → libretro R, grip → L. Test with an SMB ROM — the running-and-jumping is the regression catch for stick discretisation.\n- **Vision Pro**: the picture renders; the controllers don't. Vision Pro has no persistent gamepad — only transient-pointer pinch events. Pair a Bluetooth keyboard if the visitor wants to play.\n- **Pico 4 Ultra**: same as Quest 3 in practice. Watch for `gamepad.hand === \"\"` on older Pico Browser builds — the bridge falls back to first-pad-is-right handling.\n\nThe doc at `docs/WEBXR-RETROARCH.md` has the per-system framebuffer-size table and the measured upload cost per system.",
      },
    ],
    finalResult:
      "A WebXR scene that lets the visitor enter a virtual living room, stand in front of a CRT TV, and play a ROM they brought from home with the XR controller. The libretro WASM core runs in the browser tab; the texture-bridge keeps the picture on the screen; the per-system mapping registry keeps the controls honest. Tested on Quest 3 + Pico 4 Ultra; Vision Pro renders in stereo with keyboard fallback.",
    variations: [
      "Per-room theming — sun-bleached 1970s living room for the Atari 2600, a student dorm for the N64, a bedroom for the Game Boy. Swap room-layout backdrop colours and lighting; geometry stays the same.",
      "Custom controller model on the XR gripSpace — replace the @react-three/xr default with the period model via the `controller` slot on `createXRStore`. Future pass.",
      "Save-state across reloads — IndexedDB first, Vercel Blob sync for logged-in users. The 2D /emulator surface has the local save-state UI; lift it into the room.",
      "Multiplayer via WebRTC — two visitors, two controllers, one shared room. See docs/WEBXR-GAME-FRAMEWORK.md.",
      "Spatial audio for the TV speakers — pipe EmulatorJS audio through a PannerNode positioned at the chassis using `lib/game/audio-bus.ts`.",
    ],
    troubleshooting: [
      {
        symptom: "EmulatorJS loader script returns 404 / network error.",
        cause: "The CDN is rate-limited or blocked. The studio's CSP allows cdn.emulatorjs.org — check yours.",
        fix: "Verify the network tab. If the CDN is genuinely down, the bundle is small and can be self-hosted — the EmulatorJS GitHub release ships every asset under one folder.",
      },
      {
        symptom: "The TV screen renders, but stays black after EmulatorJS boots.",
        cause: "The CanvasTexture was created before EmulatorJS finished initialising — the canvas was empty when the texture was constructed.",
        fix: "Build the texture only after the canvas-ready callback fires from EmulatorHost. The room component already gates this on `emulatorCanvas !== null`.",
      },
      {
        symptom: "Controller buttons feel laggy or repeated — Mario keeps jumping every frame.",
        cause: "The input bridge isn't edge-detecting — it's calling simulateInput every frame instead of on state transitions.",
        fix: "Use the `prevState` Map pattern in `lib/webxr-retroarch/emulator-bridge.ts`. Compare current button value to previous; only call simulateInput when they differ.",
      },
      {
        symptom: "Picture is bilinear-smeared instead of crisp pixel art.",
        cause: "Texture filters defaulted to LinearFilter instead of NearestFilter.",
        fix: "Set both `texture.minFilter` and `texture.magFilter` to `NearestFilter`. Disable mipmaps too.",
      },
      {
        symptom: "Vision Pro renders the room but no controller works.",
        cause: "Vision Pro doesn't expose a persistent gamepad. Its only input is transient-pointer pinch events.",
        fix: "Document the device-specific behaviour — Vision Pro is keyboard-only on the room. Pair a Bluetooth keyboard; EmulatorJS's default keyboard mapping takes over.",
      },
      {
        symptom: "Switching systems mid-session leaves the old ROM running.",
        cause: "EmulatorJS doesn't expose a clean teardown — the loader globals are stale after first boot.",
        fix: "Disable the system selector once `booted === true` (the toolbar already does this). Page reload to switch systems. Known limitation; documented.",
      },
    ],
  },
  base,
);
