# Screen-Recording Notes — Toda Lattice Poi Disc

**Target file:** `public/library/videos/scripting/python-numpy-toda-lattice-integrable-chain-flaschka-lax-soliton-poi-disc-webxr/screen.mp4`

---

## Setup

| Setting | Value |
|---------|-------|
| Software | OBS Studio 30+ / Windows Game Bar / macOS Screen Capture |
| Window source | Blender 5.1 (maximised viewport, **no** UI chrome) |
| Capture resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **off** |
| Output | H.264 MP4, CRF 18 |

---

## Blender workspace before recording

1. Open `hf_toda_disc.blend` (saved by blueprint.py).
2. Switch to **Scripting** workspace → run `blueprint.py` once if the mesh
   is not present.
3. Set viewport shading to **Solid → Vertex** colour.
4. In the timeline: set End Frame = **143**, press **Space** to preview.
5. Place the 3D cursor at origin.  Press **Numpad 5** (ortho), then **Numpad 7**
   (top view) to start; tilt slightly with **Middle Mouse** to see disc depth.

---

## What to record (2-minute demo)

| Segment | Duration | Action |
|---------|----------|--------|
| 1 — 2-soliton top view | 0:00–0:20 | Top-ortho, let animation run. Two ridges visible. |
| 2 — Perspective tilt | 0:20–0:45 | Middle-mouse drag to 3/4 perspective. Ridges show height. |
| 3 — Shape-key morph | 0:45–1:10 | In Properties > Object Data > Shape Keys, drag `SK_1sol` 0→1. One ridge remains. |
| 4 — Phonon mode | 1:10–1:35 | Drag `SK_1sol` back to 0, drag `SK_phonon` 0→1. Sinusoidal ring pattern. |
| 5 — GLB viewport | 1:35–2:00 | Open hf_toda_disc.glb in Blender or WebXR viewer; rotate in 3D. |

---

## Tips

- **Particle count visible:** In top view, count 32 azimuthal "fins" — each is one lattice particle's displacement over time.
- **Soliton identification:** The bright gold ridges are solitons. In the 2-soliton basis, watch them merge at the collision point (roughly frame 60–70) and re-emerge — the **phase shift** (each soliton jumps forward/backward upon collision) is detectable as a positional discontinuity.
- **Conservation laws:** Pause at any frame and notice the overall disc shape is preserved — the Lax isospectral flow keeps the spectrum of the Jacobi matrix constant throughout.
- Avoid recording the Blender header/menus; drag them off-screen with a widescreen window setup.
