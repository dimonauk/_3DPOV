# Silk Brush — Atelier Chamber

3D paint canvas. Tilt-brush vibe in the browser. WebXR-ready.

## What it is

- Drag the pointer against an invisible interaction plane one metre out;
  the studio extrudes a `TubeGeometry` along the path.
- Three brushes:
  - **Neon** — flat emissive line, cyan.
  - **Sparkle** — same tube, hotter emissive, amber.
  - **Keijiro** — custom shader material, magenta, pulses on its own `time` uniform per-frame.
- OrbitControls — walk around the painting.
- Enter VR / Enter AR buttons appear top-right if the browser supports them. The same scene renders inside the headset.

## Files

- `page.tsx` — server-only, exports metadata, renders the chrome + the client child.
- `silk-brush-client.tsx` — everything Three.js. Holds the stroke list, the XR store, the scene, the HUD.

## Ported from

`D:/The_Hangar/apps/silk-brush-canvas/` (Vite bench prototype).

### Changes vs the bench

- `@react-three/xr` v5 → v6: `VRButton` / `Controllers` / `Hands` swapped for `createXRStore()` + `<XR store={...}>` + an enter/exit bar patterned on `components/stage/StageXRBar.tsx`.
- `framer-motion` import dropped (unused in source).
- `lucide-react` icons replaced with inline SVG — no new dep.
- `clsx` + `tailwind-merge` not needed — class strings are inline.
- `console.log` in `canvasService.ts` → `createLogger("atelier:silk-brush")`. The "save artwork" service is not ported; strokes live in component state only. Wire to a Firebase Function later if persistence is wanted.
- Tailwind classes rewritten against the holoflow palette (`warm-black-*`, `chrome-*`, `pink-200`).

## Known gaps

- No undo. (`useState` history would be one extra line — left for the next pass.)
- No export. The bench's `EXPORT_DNA` button hit a stub service; here the equivalent would be a GLTFExporter on the scene's stroke meshes. Out of scope for the port.
- VR controller-driven painting is not wired — once a headset is in session, the pointer events on the invisible plane don't fire from XR ray-input. Adding `@react-three/xr`'s `<XRController>` ray + a controller trigger handler is the follow-up.

## Voice

Holoflow: terse, mechanical, lowercase. Chamber label `atelier · silk brush`. No exclamation marks. No "DNA," no "Vision Archivist" — those were bench-side fiction.
