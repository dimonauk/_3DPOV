# Screen-Recording Notes — Aizawa Attractor Poi Head

**Target file:** `public/library/videos/scripting/python-numpy-aizawa-attractor-langford-1984-torus-wrapping-bishop-tube-poi-webxr/screen.mp4`

---

## OBS / Windows Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → **Blender** |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no mic, no desktop) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

---

## What to record (approx. 4 minutes)

### Part 1 — Paste and run `blueprint.py` (90 s)

1. Open Blender 5.1, new General file.
2. Switch the default Layout workspace to **Scripting**.
3. Open a new text block, paste the contents of `blueprint.py`.
4. Point out the named constants at the top (`A`, `B`, `C`, `D`, `E`, `F`) — explain each in a sentence.
5. Hit **Run Script** (▶).  
   The viewport should show a glowing cobalt-to-amber tube winding around a toroidal manifold.
6. Zoom in to show the cross-section, then pull out to see the full torus shape.

### Part 2 — Inspect the mesh (45 s)

1. Switch to **Object Data Properties** panel (green triangle icon).
2. Open **Shape Keys** rollout — show Basis, SK_HighD, SK_NoEF, SK_LowB.
3. Scrub SK_HighD from 0 → 1 — tube visibly winds more tightly.
4. Reset to 0; show SK_LowB — orbit shifts outward.

### Part 3 — Colour attribute in Shader Editor (45 s)

1. Switch to **Shader Editor**, confirm the Vertex Color node reads `Aizawa_Z`.
2. In viewport, switch to **Material Preview** (sphere icon in top-right of 3D view).
3. Orbit the model; note cobalt at the bottom of the z-range, amber at the top.

### Part 4 — Run `record.py` (30 s)

1. Open `record.py` in a second text block.
2. Hit Run Script — Blender's timeline animates 1→90 and writes `viewport.mp4`.
3. Show the resulting file in the system file browser.

---

## Post-processing (optional)

```
ffmpeg -i screen_raw.mkv -vf "scale=1920:1080" -c:v libx264 -crf 20 screen.mp4
```

Drop the finished file into:
`public/library/videos/scripting/python-numpy-aizawa-attractor-langford-1984-torus-wrapping-bishop-tube-poi-webxr/screen.mp4`
