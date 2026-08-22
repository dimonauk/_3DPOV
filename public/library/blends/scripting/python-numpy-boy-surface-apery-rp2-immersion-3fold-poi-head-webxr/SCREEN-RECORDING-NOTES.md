# Screen-Recording Notes — Boy Surface RP² Poi Head

**Target file:**  
`public/library/videos/scripting/python-numpy-boy-surface-apery-rp2-immersion-3fold-poi-head-webxr/screen.mp4`

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

1. Open `hf_boy_surface.blend` (saved by `blueprint.py`).
2. Switch to **Scripting** workspace and run `blueprint.py` if the mesh is absent.
3. Set viewport shading → **Solid → Colour: Vertex Colour**.
4. Enable **Backface Culling OFF** (see Material tab) — the surface is
   non-orientable; both faces must be visible.
5. Select the object; press **Numpad .** to frame it.
6. Set shading overlay **Wireframe** to **0%** (clean solid view).

---

## What to record (3-minute demo)

| Segment | Duration | Action |
|---------|----------|--------|
| 1 — 3-fold overview | 0:00–0:25 | Orbit slowly around the object. Notice three lobes with 3-fold rotational symmetry. |
| 2 — Triple point zoom | 0:25–0:55 | Navigate to bottom; zoom in to show the triple point where the surface crosses itself three times. Slowly orbit — watch the surface fold through itself. |
| 3 — Self-intersection ring | 0:55–1:20 | Tilt to show the equatorial self-intersection circle at the "rim" of the object. The three surface sheets converge here. |
| 4 — Shape key: SK_Oblate | 1:20–1:45 | In Properties → Object Data → Shape Keys, drag **SK_Oblate** 0→1. The poi head flattens to a discus. |
| 5 — Shape key: SK_Prolate | 1:45–2:10 | Return SK_Oblate to 0. Drag **SK_Prolate** 0→1. The surface elongates like a wand head. |
| 6 — Shape key: SK_Tight | 2:10–2:35 | Return SK_Prolate to 0. Drag **SK_Tight** 0→1. Compact version for stacked poi head rigs. |
| 7 — WebXR GLB viewer | 2:35–3:00 | Open `hf_boy_surface.glb` in Blender File → Import or drag into a WebXR viewer. Rotate in 3D to confirm the non-orientable geometry. |

---

## Tips for demonstrating non-orientability

- **Backface reveal:** temporarily enable Backface Culling ON, orbit slowly.
  You will see the surface "disappear" from certain angles — this shows
  the single-sided structure of RP². Switch it off to restore full geometry.
- **Normal overlay:** Enable **Face Orientation** overlay (blue = front,
  red = back). You will see alternating red/blue patches as you orbit —
  evidence that there is no globally consistent outward normal.
- **Self-intersection:** At the equatorial circle the surface actually passes
  through itself; in Solid mode, you may see z-fighting artefacts. These are
  geometrically correct, not render errors.
- **Triple point identification:** Frame count the vertices in wireframe mode
  that converge toward (0,0,0) — all three surface sheets meet at one point.
