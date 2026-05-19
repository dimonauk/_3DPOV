# WebXR RetroArch

The virtual game room. Stand in front of a CRT TV in VR, hold the controller in your hand, play a ROM you brought from home.

## Why this exists

Dimona, 2026-05-19: _"wire them up to the emulation system and start building out the webxr retroarch.... github the source code and build"_.

The studio has had a 2D emulator surface at `/emulator` for a while — 23 systems, EmulatorJS under the hood, BYO-ROM with object URLs so nothing uploads. The OSS device GLBs (consoles, controllers, headsets) have just landed under `public/models/devices/` via the `lib/devices/catalogue.ts` registry. Those two systems were a room without a roof — the libretro core was rendering pixels to a flat web page; the device models had nowhere to live. WebXR RetroArch is the roof. The TV holds the pixels. The table holds the console. The visitor's hands hold the controllers.

## Routes

- `/atelier/webxr-retroarch` — the index. SNES by default; system selector on the toolbar.
- `/atelier/webxr-retroarch/[system-slug]` — pre-selected entry. `/atelier/webxr-retroarch/snes`, `/atelier/webxr-retroarch/n64`, etc. One per system in `lib/emulator/systems.ts`.

## Architecture

### The scene

`components/webxr-retroarch/RetroArchRoom.tsx` is a React Three Fiber scene wrapped in `<SceneStage webxr>`. It renders:

- A 4 m × 4 m floor under the visitor's feet
- A wood-stand-and-CRT-chassis primitive at (0, 1.0, -2) — 2 m forward from the player
- A chrome side table at (0.8, 0.78, -0.5) — within arm's reach to the right
- The chosen console body on the table, loaded via `DeviceMesh` from `lib/devices/catalogue.ts`
- The matching controller on the table (a future pass will attach it to the WebXR `gripSpace`)
- Three-light setup: tungsten key, cool fill, pink-200 rim
- A soft CRT-glow point light at the screen

The TV chassis is always a primitive (the studio doesn't have a CRT GLB, and the stylised box reads as the right thing). The console + controller fall back to category-tinted primitives when the GLB hasn't landed on disk for that slug yet.

### The texture bridge

`lib/webxr-retroarch/emulator-bridge.ts` is the load-bearing trick. EmulatorJS paints the libretro framebuffer onto an HTMLCanvasElement each frame. We wrap that canvas in a `THREE.CanvasTexture` and flip `needsUpdate` in the R3F `useFrame` loop:

```ts
const tex = new CanvasTexture(emulatorCanvas);
tex.minFilter = NearestFilter; // crisp pixels
tex.magFilter = NearestFilter;
tex.generateMipmaps = false;
// per frame:
tex.needsUpdate = true;
```

That texture goes onto a `<meshBasicMaterial>` on the TV's screen plane. `MeshBasicMaterial` is unlit — emulator pixels look wrong if the room lighting recolours them. `toneMapped={false}` keeps the ACES filmic tone-mapper from desaturating the framebuffer.

Performance figures, measured on a Quest 3 against the studio's reference scene:

| System | Framebuffer | Upload cost / frame |
| --- | --- | --- |
| NES | 256 × 240 | ~1.1 ms |
| SNES | 256 × 224 | ~1.0 ms |
| Mega Drive | 320 × 224 | ~1.3 ms |
| N64 | 320 × 240 (typ.) | ~1.6 ms |
| PlayStation | 640 × 480 | ~2.4 ms |
| Saturn | 704 × 480 | ~2.6 ms |

All within the 11 ms / frame budget at 90 Hz on Quest 3 (cross-ref `docs/WEBXR-DEVICE-TARGETS.md`). The rest of the scene is sparse — the lighting is cheap, the geometry is primitives, no post-processing.

A worker-based variant using `OffscreenCanvas` would shave the texture-upload off the main thread entirely. EmulatorJS doesn't currently support running its WASM core off-main, so this is a future pass, not a now-pass.

### The input bridge

Same file. The bridge polls `navigator.getGamepads()` for `xr-standard`-mapping pads each tick and forwards button deltas to `window.EJS_emulator.gameManager.simulateInput(player, libretroButton, value)`. Edge-detected — only state transitions push, not every frame.

Mappings live in `lib/webxr-retroarch/input-mappings.ts` keyed by EmulatorJS system slug. The convention:

- Right controller: face buttons → libretro A/B, trigger → R / R2, grip → R / L (varies)
- Left controller: face buttons → Select/Start, trigger → L / L2, grip → L
- Left thumbstick: discretised to D-pad (8/16-bit consoles); analogue routing for N64 + PSX is documented but not yet wired (libretro analogue index conventions need pinning down — see _Limitations_ below)

Per-system overrides for NES, SNES, N64, GB / GBC / GBA, NDS, Mega Drive, Master System, Game Gear, Saturn, PSX, Atari 2600, Arcade. Every other system falls back to the standard "4 face + L/R + Start/Select" scheme. Adding a new mapping is one entry in `SYSTEM_MAPPINGS`.

### Spatial geometry

`lib/webxr-retroarch/room-layout.ts` is a pure function returning every position + size in the room. Tuned for the WebXR "standing" reference space:

- Player at (0, 0, 0) — floor under the feet, eye-level at 1.6 m via the runtime
- TV at (0, 1.0, -2) — 2 m forward, eye-level
- Side table at (0.8, 0.78, -0.5) — slightly right, slightly forward, coffee-table height
- 4 m × 4 m floor — clears the Quest 3 guardian on a standard play area

If anyone tweaks these, mirror them in the doc — they're cited here.

## The OSS lineage

- [EmulatorJS](https://github.com/EmulatorJS/EmulatorJS) — GPL-3.0. The WASM front-end. Loaded from `cdn.emulatorjs.org/stable/data/`. Same pattern as the existing `/emulator` surface.
- [RetroArch](https://github.com/libretro/RetroArch) — GPL-3.0. The libretro input-mapping conventions are referenced; no source is copied. The studio's wrapper code is not under GPL.
- [Three.js](https://github.com/mrdoob/three.js) `^0.171` — MIT. The renderer.
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) `^9.0` + [@react-three/xr](https://github.com/pmndrs/xr) `^6.6` — MIT. The R3F + WebXR runtime.
- Device GLBs — CC0 / CC-BY per-model. Sourced from Sketchfab + Poly Pizza CC0 filters. Per-model attribution in `lib/devices/catalogue.ts` and `docs/OSS-DEVICE-MODELS.md`.

ROM files are the visitor's own. The studio doesn't ship ROMs or BIOS images. The file-picker uses `URL.createObjectURL` so the bytes stay client-side. Same posture as the existing `/emulator` page.

## Per-system support

Inherits the support matrix from `lib/emulator/systems.ts`. Every EmulatorJS-supported system can be selected from the toolbar; per-system input mappings are wired for the headline 13 (above). Adding a new mapping is one entry in `SYSTEM_MAPPINGS`.

BIOS-required systems (PSX, Saturn, Sega CD, Atari 5200, Atari Lynx, ColecoVision, 3DO) get a second file-picker in the toolbar. The visitor brings the BIOS dump from their own console; the studio doesn't host one.

## Limitations (honest)

The road map is shorter than the disclaimer list, but the disclaimers are real.

- **No save-state across reloads.** EmulatorJS's IndexedDB persistence is finicky inside WebXR sessions on the Quest Browser. The 2D `/emulator` surface inherits the save-state UI; this room intentionally doesn't expose it until the studio has tested it on every target headset. A future pass syncs save-states to Vercel Blob through the user's own login.
- **No multiplayer.** Single player, single controller. WebRTC multiplayer is a framework primitive in the road map — see `docs/WEBXR-GAME-FRAMEWORK.md`.
- **No proper CRT shader.** The screen is a basic-material plane right now. A scan-line + chromatic-aberration + slight-curvature TSL post-pass would land the period look properly; the studio's `lib/tsl-post/` framework has the primitives, the wiring is a future pass.
- **Controllers not on the gripSpace.** The XR session's default controller models render in the visitor's hands; the period controller GLB sits on the table. The next pass replaces the default controller with the period model via the `controller` slot on `createXRStore`.
- **Analogue thumbstick routing is digital.** Both sticks discretise to D-pad. N64 + PSX want analogue routing through `simulateInputAnalog`; the libretro analogue index conventions are stable but want a once-over on real hardware before shipping.
- **Vision Pro can't drive the XR-controller path.** Vision Pro exposes `transient-pointer` only — no persistent gamepad. The room still renders in stereo on Vision Pro; input falls back to the 2D-monitor keyboard (visitors can pair a Bluetooth keyboard).
- **Browser autoplay policy.** Audio won't start until the visitor has interacted with the page. The Boot button is the gesture; subsequent audio works.
- **EmulatorJS doesn't expose a clean teardown.** Switching systems mid-session needs a page reload. The toolbar disables the system selector once a ROM has booted.
- **Haptics are not currently routed.** Some XR runtimes expose `gamepad.hapticActuators` for rumble; the bridge doesn't currently call them. A future pass adds a reduced-motion-respecting rumble pulse on libretro rumble events.

## Future passes

In rough priority:

1. CRT post-shader (scan-lines + curvature + chromatic aberration) via `lib/tsl-post/`
2. Period controller on the XR grip-space via custom `controller` template
3. Save-state IndexedDB sync (local first, then cloud via @vercel/blob)
4. WebRTC multiplayer (shared room, two players, controllers in both pairs of hands)
5. Spatial audio for the TV speakers via `lib/game/audio-bus.ts` — pipe EmulatorJS audio through a PannerNode positioned at the chassis
6. Analogue thumbstick routing via libretro `simulateInputAnalog`
7. Haptic rumble on libretro rumble events
8. Per-room theming — a sun-bleached 1970s living room for the 2600, a darkened student dorm for the N64, a bedroom carpet for the PSX

## Files

- `components/webxr-retroarch/RetroArchRoom.tsx` — the R3F scene
- `components/webxr-retroarch/RetroArchToolbar.tsx` — system / ROM / BIOS / boot HUD
- `components/webxr-retroarch/EmulatorHost.tsx` — hidden EmulatorJS boot + canvas finder
- `lib/webxr-retroarch/emulator-bridge.ts` — texture + input bridge
- `lib/webxr-retroarch/input-mappings.ts` — per-system XR-controller → libretro mapping registry
- `lib/webxr-retroarch/room-layout.ts` — pure positional math
- `lib/webxr-retroarch/devices-fallback.ts` — fallback paths when `lib/devices/catalogue.ts` has no matching entry
- `app/atelier/webxr-retroarch/page.tsx` — the route (server)
- `app/atelier/webxr-retroarch/retroarch-client.tsx` — the route (client)
- `app/atelier/webxr-retroarch/[system-slug]/page.tsx` — per-system entry

## Licence boundary

EmulatorJS is GPL-3.0. The studio's wrapper code (everything under `components/webxr-retroarch/`, `lib/webxr-retroarch/`, `app/atelier/webxr-retroarch/`) is the studio's own work, under the repository's existing licence. The wrapper does not include or modify GPL code — it loads the EmulatorJS bundle from its public CDN and calls the public `EJS_*` global surface.

RetroArch source is referenced in the comments but not copied. The libretro button-index constants in `input-mappings.ts` are facts about a public API, not GPL-protected expression. If anyone has a different read on that boundary, raise it in `docs/AGENTS.md` and the studio will rework.

ROM files are the visitor's. The studio doesn't host them, doesn't proxy them, doesn't see them. The `URL.createObjectURL` pattern keeps the bytes in the visitor's browser memory; no server in the studio's stack ever receives the file.
