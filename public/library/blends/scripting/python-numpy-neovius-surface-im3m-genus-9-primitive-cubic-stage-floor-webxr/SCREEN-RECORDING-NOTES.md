# Screen Recording Notes — Neovius Surface

**Target file:** `screen.mp4`
**Resolution:** 1920 × 1080 · **Frame rate:** 30 fps · **Audio:** off

---

## OBS / Windows Game Bar setup

| Setting | Value |
|---|---|
| Source type | Window Capture → *Blender 5.1* |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (no commentary for library entry) |
| Output format | MP4 / H.264 |
| Quality preset | High (CRF ~18) |

---

## What to record (≈ 90 seconds)

### 1 — Run the blueprint (0:00–0:25)
1. Open Blender 5.1 → Scripting workspace.
2. Open `blueprint.py` from this folder.
3. Hit **Run Script**.
4. Switch to **Layout** workspace while the script runs.
5. Let the viewport update to show the Neovius floor.

*Show the terminal output — the script prints vertex count and GLB path.*

### 2 — Explore the mesh (0:25–0:55)
- Orbit the viewport (Middle Mouse Button) slowly around the floor.
- Pause on the complex sponge topology at the top.
- Press `Z` → **Material Preview** to show the Gaussian curvature colour.
- Briefly navigate into one of the larger channel openings to show the
  two-labyrinth non-congruent structure.

### 3 — Shape key demo (0:55–1:20)
- Open **Properties → Object Data → Shape Keys** panel.
- Scrub **SK_Expand** from 0 → 1 → 0 (shows larger labyrinth expanding).
- Scrub **SK_Compress** from 0 → 1 → 0 (shows smaller labyrinth growing).
- Scrub **SK_Wide** from 0 → 1 (near-rupture topology change).

### 4 — Inspect the GLB (1:20–1:30)
- Open File Manager and drag `neovius_floor.glb` into the Blender viewport
  (or show the file size in the output folder).
- Cut.

---

## File destinations

| File | Location |
|---|---|
| `neovius_floor.blend` | `public/library/blends/scripting/…/` |
| `neovius_floor.glb` | same directory |
| `screen.mp4` | `public/library/videos/scripting/python-numpy-neovius-surface-im3m-genus-9-primitive-cubic-stage-floor-webxr/` |
| `viewport.mp4` | same videos directory (rendered by `record.py`) |
