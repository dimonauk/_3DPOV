# Screen-Recording Notes — Klein Bottle Poi Head

**Target file:**  
`public/library/videos/scripting/python-numpy-klein-bottle-figure-8-tube-euler-chi-0-non-orientable-poi-head-webxr/screen.mp4`

---

## Setup

| Setting | Value |
|---------|-------|
| Software | OBS Studio 30+ / Windows Game Bar / macOS Screen Capture |
| Window source | Blender 5.1 (maximised 3D viewport, no UI chrome) |
| Capture resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **off** |
| Output | H.264 MP4, CRF 18 |

---

## Blender workspace before recording

1. Open `hf_klein_bottle.blend` (saved by `blueprint.py`).
2. Viewport shading → **Solid → Colour: Vertex Colour**.
3. **Backface Culling must be OFF** — the Klein bottle is non-orientable;
   enabling culling will silently discard parts of the surface, making it
   appear torn. Confirm in the Material tab.
4. Select the object; press **Numpad .** to frame it.
5. Set shading overlay **Wireframe** to **0%** (clean solid view for recording).

---

## What to record (3-minute demo)

| Segment | Duration | Action |
|---------|----------|--------|
| 1 — Overview orbit | 0:00–0:25 | Slow orbit. Note the tube circling back through itself — the neck of the "bottle" passing inside the outer surface. |
| 2 — Self-intersection | 0:25–0:55 | Navigate to a view from slightly above the equatorial plane. Observe the bright equatorial band (z≈0) — this is where the surface crosses itself. Two distinct surface sheets occupy the same 3D circle. Orbit slowly around this band. |
| 3 — Face Orientation | 0:55–1:20 | Enable **Face Orientation** overlay (Viewport Overlays → Face Orientation). You will see alternating blue/red patches as you orbit — this reveals that no consistent outward normal exists. Switch it off. |
| 4 — SK_Wide | 1:20–1:45 | Properties → Object Data → Shape Keys → drag **SK_Wide** 0→1. The tube widens; the equatorial ring becomes visibly larger. |
| 5 — SK_Flat | 1:45–2:10 | Return SK_Wide → 0. Drag **SK_Flat** 0→1. The bottle flattens to a disc; from above you can see the equatorial ring as a circle. The self-intersection becomes a ring in the middle of the flat disc. |
| 6 — SK_Tall | 2:10–2:35 | Return SK_Flat → 0. Drag **SK_Tall** 0→1. The bottle elongates to a wand-head shape. |
| 7 — WebXR GLB | 2:35–3:00 | Open `hf_klein_bottle.glb` in Blender (File → Import → glTF 2.0) or drag into a WebXR viewer. Confirm the shape-key morph targets are preserved. |

---

## Demonstrating non-orientability

- **Backface Culling ON/OFF toggle:** Switch Backface Culling ON — parts of
  the surface disappear, torn-looking. Switch OFF — full surface returns.
  This makes the non-orientability tangible: the surface has no consistent
  inside/outside.
- **Normal overlay:** Face Orientation overlay shows that the patch colours
  flip as you orbit. Trace the colour flip to the equatorial self-intersection
  circle — this is where the surface's normal reverses, just as a Möbius
  band's normal reverses after one traverse.
- **Z-fighting at the equator:** In Solid mode, the equatorial band
  (z ≈ 0) shows a faint flickering or z-fighting artefact. This is
  geometrically correct: two surface sheets occupy identical z=0 positions
  at each u, and the GPU cannot resolve which is "in front".
- **Self-intersection circle trace:** In wireframe mode, select vertices
  near z=0. You will see two rings of vertices — one from v≈0 and one from
  v≈π — overlapping at the same 3D coordinates. These are the parameter
  values that produce the self-intersection.
