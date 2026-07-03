# Screen Recording Notes — World-Height Proximity Crystal

**Target file:** `public/library/videos/geometry-nodes/gn-self-object-world-height-proximity-crystal-webxr/screen.mp4`

---

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no system audio) |
| Output format | MP4 / H.264 |

---

## What to record

1. **Run blueprint.py** (Scripting workspace → Run Script).  
   Record from the moment the icosphere appears with the GN modifier applied.

2. **Switch to Geometry Nodes editor** (`Shift+F3`).  
   Slowly pan across the node graph: Self Object → Object Info → SeparateXYZ →
   MathADD → MapRange → StoreNamedAttribute → ScaleElements.

3. **Switch to 3D Viewport** (Numpad 0 = camera view).  
   Press `G Z` and drag the crystal upward — the glow band should visibly
   slide from the base toward the tip as the object rises.
   Return it to Z=0 and drag it below Z=0 — the whole crystal should glow.

4. **Open Spreadsheet editor** (drag from a viewport corner).  
   Select the crystal → enable *Attribute* mode → confirm `proximity_t`
   (FLOAT, POINT domain) is visible and values range 0→1.

5. **Run record.py** to generate `viewport.mp4` automatically.  
   Stop the screen recording after the viewport render finishes.

---

## Timecode targets

| 0:00–0:10 | Blueprint runs; icosphere + GN modifier appear |
| 0:10–0:25 | Node graph pan — Self Object chain highlighted |
| 0:25–0:45 | Live drag: crystal rising, glow wave ascending |
| 0:45–0:55 | Spreadsheet: proximity_t attribute values |
| 0:55–1:05 | record.py runs; viewport.mp4 output confirmed |

---

## Export

Trim to ≤ 90 s.  H.264, CRF 23, 1920 × 1080, 30 fps.  
Save as `screen.mp4` alongside `viewport.mp4`.
