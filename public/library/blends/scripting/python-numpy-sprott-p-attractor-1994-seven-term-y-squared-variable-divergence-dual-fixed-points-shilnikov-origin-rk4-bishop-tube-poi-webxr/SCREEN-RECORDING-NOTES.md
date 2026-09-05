# Screen-Recording Notes — Sprott P Attractor
## OBS / Windows Game Bar instructions for `screen.mp4`

### Target output
- File: `public/library/videos/scripting/python-numpy-sprott-p-attractor-.../screen.mp4`
- Resolution: 1920 × 1080
- Frame rate: 30 fps
- Audio: **off** (no microphone needed)
- Duration: ~3–4 minutes (full scripting + shape-key demo)

---

### OBS setup (recommended)

1. **Source**: Window Capture → select `Blender 5.1`
2. **Canvas**: 1920 × 1080 → Scale Output: 1920 × 1080
3. **Recording**: MP4, H.264, CRF 18 (high quality)
4. **Audio tracks**: disable all

### Game Bar (Windows 11 fallback)
`Win + G` → Capture → Record (Win+Alt+R)
Ensure "Record audio" is **unchecked**.

---

### What to capture

**Step 1 — Open Blender, load blueprint**
```
File → New → Scripting workspace
Paste contents of blueprint.py into the Text Editor
Press Run Script (▶)
```
Let the build run. The console should print:
`SprottP build complete — 3000 waypoints, a=2.7, ratio≈5.96`

**Step 2 — Inspect the attractor (30 s)**
- Switch to 3D Viewport (WORKBENCH, SOLID, VERTEX_COLORS)
- Rotate around the tube with middle-mouse drag
- Note the cobalt–amber speed gradient: tight spirals near origin are amber
  (fast), wide loops are cobalt (slow) — this is the Shilnikov saddle-focus
  signature.

**Step 3 — Shape key morphs (60 s)**
- Open Properties → Object Data → Shape Keys
- Slide SK_LowA to 1.0: orbit widens (a=2.0, Shilnikov ratio ≈4.2)
- Reset; slide SK_HighA to 1.0: orbit tightens (a=3.5, ratio ≈7.9)
- Reset; slide SK_WideA to 1.0: near topology shift (a=4.5)
- Each morph takes ~3 s; hold for 5 s so viewers can see the difference

**Step 4 — Console annotations (optional, 30 s)**
Open the Python console and run:
```python
# Confirm variable divergence
print("div at P0:", 2*0 - 1)          # → -1
print("P1:", ((1+2.7)**2, -(1+2.7), 2.7*(1+2.7)))  # → (13.69, -3.7, 9.99)
```

**Step 5 — Run record.py (optional)**
If a local Blender session is available:
- Paste record.py into Text Editor, Run Script
- Wait ~2–5 min for the 300-frame render to complete
- viewport.mp4 appears in `public/library/videos/scripting/.../`

---

### Timing guide
| Clock | Action |
|-------|--------|
| 0:00  | Start recording, OBS scene showing Blender |
| 0:05  | Paste + run blueprint.py |
| 0:30  | Viewport inspection, rotate |
| 1:00  | Shape key panel, morph SK_LowA |
| 1:30  | Morph SK_HighA, compare |
| 2:00  | Morph SK_WideA |
| 2:30  | Console divergence check |
| 3:00  | Stop recording |

---

### File naming
Save as `screen.mp4` (lowercase, no spaces) in the same directory as
`viewport.mp4`.  The MANIFEST lists both.
