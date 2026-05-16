# `/stage` — Holoflow VRM-world Stage

The studio's reference surface for "VRM character in a good-looking
world". One scene description (a `RoomConfig` object), two render
modes (flat screen + WebXR), same camera position / lighting / props
in both.

## Why this exists

Procedural three.js geometry written from scratch always looks like
Roblox 2008 because it's missing the three things real 3D needs:
image-based lighting, authored meshes, and a tone-mapping pipeline.
The Stage gives you all three as defaults so you can drop a VRM into
a believable space without re-discovering the recipe each time.

## The recipe

| Layer | What | Implementation |
|---|---|---|
| Lighting | HDRI image-based lighting | Drei `<Environment>` + Poly Haven CC0 presets |
| Tone | ACES filmic | three.js `gl.toneMapping = ACESFilmicToneMapping` |
| Ground | Contact shadows + optional floor | Drei `<ContactShadows>` |
| Character | VRM with bones + visemes | `components/three/VRMAvatar` |
| Props | Authored GLB meshes | Drei `useGLTF` + ComfyUI Hunyuan3D pipeline |
| Post | Bloom + vignette (flat only) | `@react-three/postprocessing` |
| XR | WebVR / WebAR session | `@react-three/xr` |

## File map

| File | Role |
|---|---|
| `page.tsx` | Server-component shell, reads `?room=<slug>` from URL |
| `stage-client.tsx` | Root client component, room picker overlay |
| `layout.tsx` | Chrome-bypass (full viewport, no Navbar/Footer) |
| `../../lib/stage/types.ts` | `RoomConfig`, `EnvironmentSpec`, `AvatarSpec`, … |
| `../../lib/stage/rooms.ts` | Named room presets (studio / warehouse / sunset / void) |
| `../../components/stage/Stage.tsx` | Top-level composer — Canvas + tone mapping + XR gating |
| `../../components/stage/StageEnvironment.tsx` | HDRI envmap |
| `../../components/stage/StageGround.tsx` | Contact shadows + optional floor |
| `../../components/stage/StageAvatar.tsx` | VRM character mount |
| `../../components/stage/StageProps.tsx` | GLB prop loader |
| `../../components/stage/StagePost.tsx` | Bloom + vignette (skipped in XR sessions) |
| `../../components/stage/StageXRBar.tsx` | Enter-VR / Enter-AR button row |

## Web ⇄ XR — the design rule

The Stage component is the ONLY place that knows about the Canvas,
tone mapping, and the flat-vs-XR split. Everything below (Environment,
Ground, Avatar, Props, Post) is pure scene content and is identical
between modes.

- **Flat**: `<Canvas><OrbitControls /><room content /></Canvas>`
- **XR**: `<Canvas><XR><room content /></XR></Canvas>`

Same VRM, same world position, same HDRI, same props. The differences
are forced by the medium:

- OrbitControls disable themselves inside an XR session — your head IS
  the camera, you don't need a mouse to orbit.
- Post-processing skips inside an XR session — stereoscopic bloom on a
  90Hz headset doubles per-frame GPU cost and drops frames on mid-range
  hardware. `<PostGate>` reads `useXR().session` and conditionally
  unmounts the EffectComposer.

## Adding a new room

1. Add an entry to `lib/stage/rooms.ts`
2. Pick an HDRI: either a Drei preset (`"studio"`, `"warehouse"`,
   `"sunset"`, etc.) or a custom `.hdr` dropped into `public/hdri/`
3. Set the camera position + target so it's eye-level with the avatar
4. Visit `/stage?room=<slug>` to preview

## Generating bespoke environments + props

| Asset | Source | Workflow |
|---|---|---|
| Custom HDRI | ComfyUI Flux + Equirectangular LoRA v3 | text → 360° equirect PNG → save as `.hdr` → `public/hdri/<name>.hdr` |
| Custom prop GLB | ComfyUI Hunyuan3D-2mv-turbo | image → 15 MB mesh in ~53s → `public/props/<name>.glb` |
| VRM character | VRoid Studio → export | drop into `public/<name>.vrm`; see [[holoflow-vrm-locations]] |

The bench has the workflows already (see [[dollyos-comfyui-3d]]).

## v0 status check

| Capability | Status |
|---|---|
| Single VRM in HDRI-lit scene | ✅ |
| Multiple named room presets | ✅ (studio, warehouse, sunset, void) |
| WebXR enter button | ✅ (gated to browsers with `navigator.xr`) |
| Post-processing | ✅ (bloom + vignette, flat-mode only) |
| Custom prop loading | ✅ (drop GLB into `public/props/`) |
| Custom HDRI loading | ✅ (drop .hdr into `public/hdri/`) |
| DollyOS room migration | ❌ M2 (VolumetricVoid + ParallaxStage as RoomConfigs) |
| In-XR locomotion (teleport / smooth) | ❌ M1.1 |
| Multi-avatar scenes (Aura + YOW + PURP) | ❌ M2 |
| Audio (visemes → lipsync) | ✅ via existing VRMAvatar slice (no Stage code needed) |

## See also

- [[holoflow-vrm-locations]] — where the VRM files live
- [[dollyos-comfyui-3d]] — generating HDRIs + props
- `components/three/VRMAvatar.tsx` — the runtime mount Stage delegates to
- `lib/capabilities/vrm/load.ts` — the load capability
