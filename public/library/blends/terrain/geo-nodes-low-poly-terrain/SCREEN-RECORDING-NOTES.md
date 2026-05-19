# Screen Recording Notes — Geo-Nodes Low-Poly Terrain

**Target file:** `public/library/videos/terrain/geo-nodes-low-poly-terrain/screen.mp4`

---

## Software

| Field | Value |
|---|---|
| Recorder | OBS Studio 31+ (Windows) or built-in Game Bar (Win+G) |
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off — no microphone needed for this take |
| Format | MP4 / H.264 |

---

## Before you hit Record

1. Open `blueprint.py` in the Blender Scripting workspace.
2. Run it (Alt+R). Confirm the terrain appears in the 3D Viewport.
3. Switch to the **Layout** workspace.
4. Select the `terrain_low_poly` object.
5. Open the **Properties** panel → **Modifier Properties** tab (spanner icon).
6. The `HoloflowTerrain` Geometry Nodes modifier is visible with three sliders:
   - Height Scale (default 2.0)
   - Noise Scale (default 3.5)
   - Roughness (default 0.65)
7. Set viewport shading to **Material Preview** (Z key → Material Preview, or the
   sphere icon top-right of the 3D Viewport).
8. Position the camera at roughly 45° overhead: Numpad 5 (ortho), Numpad 7 (top),
   then orbit to a pleasant 3/4 view.

---

## Shot list

| Take | Duration | Action |
|---|---|---|
| 01 — establish | 5 s | Hold on the flat grid + modifier panel visible at right |
| 02 — node tree | 8 s | Shift to Geometry Node Editor workspace; hover over each node to show tooltip |
| 03 — slider drag | 10 s | Drag Height Scale from 0 → 2.5 slowly in the modifier panel; terrain rises |
| 04 — roughness | 8 s | Drag Roughness from 0.2 → 0.9; micro-detail appears |
| 05 — shade flat | 6 s | Show the faceted silhouette in solid mode — angle the view so facets catch light |
| 06 — export | 5 s | File > Export > glTF 2.0, brief pause on the export dialogue |

Total: ~42 s. Trim in DaVinci / Premiere. Target final cut ≤ 90 s with title card.

---

## OBS scene setup

```
Sources:
  [1] Window Capture — "Blender" — 1920×1080
  [2] (optional) Image — studio watermark — bottom-right corner, 10% opacity

Filters on [1]:
  - Crop/Pad: none (full window)
  - Colour Correction: none

Output:
  Recording path: <repo>/public/library/videos/terrain/geo-nodes-low-poly-terrain/
  Filename: screen.mp4
  Encoder: NVIDIA NVENC H.264 or x264 (CRF 18)
```

---

## Game Bar (fallback)

Win+G → Capture → Start Recording.
Rename `%USERPROFILE%\Videos\<timestamp>.mp4` → `screen.mp4` after.

---

## After recording

Move `screen.mp4` into:
```
public/library/videos/terrain/geo-nodes-low-poly-terrain/screen.mp4
```

`viewport.mp4` is produced by `record.py` automatically (Blender renders it).
Both files should exist before the tutorial is considered fully recorded.
