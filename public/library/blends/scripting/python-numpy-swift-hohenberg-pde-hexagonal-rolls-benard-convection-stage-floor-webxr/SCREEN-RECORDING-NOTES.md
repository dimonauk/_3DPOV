# Screen Recording Notes — Swift–Hohenberg Bénard Convection Stage Floor

These instructions are for capturing `screen.mp4` — the OBS / Game Bar recording
of Blender's viewport while `record.py` animates the scene.

---

## Software

| Tool | Setting |
|------|---------|
| OBS Studio | Source: **Window Capture → Blender** |
| Game Bar (Win 11) | Win+G → Record |
| SimpleScreenRecorder (Linux) | Window: Blender 5.1 |

---

## Blender window setup

1. Run `blueprint.py` first (Text Editor → Run Script).  
   The floor mesh appears with cobalt-amber vertex colours.
2. Switch the main viewport to **Rendered** shading (Z → Rendered).
3. Set viewport background to solid black: **World Properties → Surface →
   Background** colour = `#050508`.
4. Open `record.py` in the Text Editor but **do not run it yet**.
5. Maximise the 3D viewport (hover, press Numpad 5 for ortho, then Ctrl+Up).

---

## OBS settings

- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Encoder**: x264 or NVENC H.264 at CRF 18
- **Audio**: OFF (no commentary on this recording)
- **Output**: `screen.mp4` → save alongside `viewport.mp4`

---

## Recording procedure

1. Start OBS recording.
2. In Blender Text Editor, click **Run Script** on `record.py`.
   - The script animates the camera 180° and morphs through all four shape keys.
   - Total animation: 270 frames at 30 fps = **9 seconds**.
3. Watch the render progress bar at the top of the Blender window.
4. When the render completes (`[record] viewport.mp4 written →`), stop OBS.

---

## Post-processing (optional)

```bash
# Trim to the exact 9-second duration, normalise exposure
ffmpeg -i screen.mp4 -t 9 -vf "eq=brightness=0.05" -c:v libx264 -crf 18 screen_final.mp4
```

---

## Expected output files

```
public/library/videos/scripting/
python-numpy-swift-hohenberg-pde-hexagonal-rolls-benard-convection-stage-floor-webxr/
├── viewport.mp4   ← rendered by record.py (EEVEE Next)
└── screen.mp4     ← OBS capture of Blender window
```

---

## Pattern transitions you should see

| Time | Shape key | Visual |
|------|-----------|--------|
| 0–2 s | Basis | Roll stripes — parallel ridges, cobalt troughs, amber crests |
| 2–3.5 s | SK_Hex | Hexagonal cells — honeycomb-like spots |
| 3.5–5.5 s | SK_Labyrinth | Dense meandering labyrinth (ε=0.6, longer run) |
| 5.5–7 s | SK_Onset | Barely visible incipient pattern near bifurcation (ε=0.05) |

The colour gradient (cobalt = below average, amber = above average) makes
it easy to read the pattern topology on camera.
