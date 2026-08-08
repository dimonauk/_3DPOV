# Screen-Recording Notes — Kuen / Dini / Pseudosphere (K = −1) Tutorial

## OBS setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (add voiceover in post) |
| Output format | MP4 · H.264 · CRF 18 |
| Filename | `screen.mp4` |

## Recording script (approx. 8 minutes)

### Part 1 — Theory (2 min)

**Say / show:**
- "Three surfaces — Kuen, Dini, and the pseudosphere — all have the same Gaussian curvature K = −1 everywhere."
- Draw the three shapes on a whiteboard or tablet (or show the GLB in the Holoflow viewer).
- "They are related by Bäcklund transformations — the same symmetry that links solitons in the sine-Gordon equation."
- Open the Blender viewport with the finished .blend loaded.  Orbit slowly to show the Kuen surface's self-intersecting folds.

### Part 2 — Code walkthrough (3 min)

- Open Scripting workspace.  Walk through `blueprint.py` top-to-bottom:
  - **Constants block** (U_KUEN, DINI_B, POI_RADIUS etc.) — explain each.
  - **`kuen_surface()`** — show the denominator `d = 1 + u² sin²v` and explain why it keeps K = −1.
  - **`dini_surface()`** — highlight the twist term `DINI_B * u`.
  - **`pseudosphere()`** — show `sech(v)` and `v − tanh(v)` forming the tractrix profile.
  - **`scale_to_poi()`** — normalise all three to the same bounding radius.
  - **`build_mesh()`** — `from_pydata` → shape keys via `foreach_set` → vertex colours.

### Part 3 — Live run (1 min)

- Press **Alt + P** with `blueprint.py` active.
- Console output should read:
  ```
  [kuen] 4800 verts  4661 faces  shape keys: Basis, Dini, Pseudosphere
  [kuen] poi radius 0.115 m — export GLB: File → Export → glTF 2.0
  ```
- Orbit viewport to show vertex-colour gradient (indigo poles, orange equator).

### Part 4 — Shape key demo (1 min)

- Object Properties → Shape Keys panel.
- Slowly dial **Dini** from 0 → 1: audience sees the Kuen folds unwrap into a helix.
- Return Dini to 0; dial **Pseudosphere** from 0 → 1: shape becomes a trumpet horn.
- Cross-fade Dini + Pseudosphere simultaneously for a blended intermediate surface.

### Part 5 — Export & WebXR (1 min)

- **File → Export → glTF 2.0** with correct options (Draco 6, Morph Targets, Vertex Colors).
- Load `hf_kuen_poi.glb` in the Holoflow Three.js viewer.
- Show the morph-target sliders in the inspector panel.

## Render viewport.mp4

After Part 3 live run:
1. Load `record.py` in a second text block; press **Alt + P**.
2. Press **Ctrl + F12** (Render Animation).
3. Watch the 150-frame (5 s) morph cycle render.
4. File lands at `public/library/videos/scripting/…/viewport.mp4`.

## File checklist before upload

- [ ] `hf_kuen_poi.blend` — saved alongside the script
- [ ] `hf_kuen_poi.glb` — exported with Draco 6
- [ ] `viewport.mp4` — rendered (≤ 15 MB)
- [ ] `screen.mp4` — OBS recording (≤ 200 MB, compress if needed)
