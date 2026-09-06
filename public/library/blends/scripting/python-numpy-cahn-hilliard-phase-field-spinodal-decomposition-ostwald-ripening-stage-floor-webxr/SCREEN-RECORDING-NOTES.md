# Screen Recording Notes — Cahn–Hilliard Phase-Field Floor

## OBS / Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264) |
| Output file | `screen.mp4` → drag to `public/library/videos/scripting/python-numpy-cahn-hilliard-phase-field-spinodal-decomposition-ostwald-ripening-stage-floor-webxr/` |

---

## What to capture (approx. 5 minutes)

### 1 — Open a fresh Blender 5.1 file (30 s)
Open **General** template. Switch to **Scripting** workspace.

### 2 — Paste and run `blueprint.py` (2 min)
- New text block → paste blueprint.py → click **Run Script**.
- Show the Python console output as integration steps proceed.
- While it runs, pan to the **3D Viewport** (keep OBS on Blender window).
- When done, the mesh appears as a labyrinthine cobalt/amber height field.

### 3 — Inspect shape keys (1 min)
- Object Properties → Shape Keys panel.
- Scrub each key: **Basis** (early spinodal), **SK_Coarsened** (Ostwald ripening),
  **SK_Droplets** (minority phase), **SK_ThickInterface** (soft walls).
- Show vertex colour in **Viewport Shading → Color → Attribute**.

### 4 — Material preview (30 s)
- Switch viewport to **Material Preview** mode.
- Rotate with Middle-Mouse to show the 3D height variation.

### 5 — GLB export confirm (1 min)
- Show the Scripting console: `print("CH floor written →", ...)`.
- Open file browser to `public/library/blends/scripting/…` — confirm
  `cahn_hilliard_floor.blend` and `cahn_hilliard_floor.glb` exist.

---

## Post-processing hint
Trim to ≤ 5 minutes in DaVinci Resolve or ffmpeg:
```
ffmpeg -i screen_raw.mp4 -ss 0 -t 300 -c copy screen.mp4
```
