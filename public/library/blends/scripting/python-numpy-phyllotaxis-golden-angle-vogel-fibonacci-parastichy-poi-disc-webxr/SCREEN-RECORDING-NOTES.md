# Screen Recording Notes — Phyllotaxis Poi Disc

Capture the full Blender session showing blueprint construction and interactive shape-key scrubbing.
Target output: `public/library/videos/scripting/python-numpy-phyllotaxis-golden-angle-vogel-fibonacci-parastichy-poi-disc-webxr/screen.mp4`

---

## Software

| Tool | Setting |
|------|---------|
| OBS Studio ≥ 30 | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (mute all audio tracks) |
| Output format | MP4 / H.264 / CRF 18 |

---

## Before you hit record

1. Open Blender 5.1 with a blank scene.
2. Switch to the **Scripting** workspace.
3. Load `blueprint.py` into the text editor (Text → Open).
4. Set the Viewport to **Solid mode**, colour set to **Vertex**.
5. Confirm the Python console shows numpy is available:
   ```python
   import numpy; print(numpy.__version__)
   ```

---

## Recording sequence (~4 minutes)

| Segment | Duration | Action |
|---------|----------|--------|
| Intro — explain golden angle in console | 30 s | Print `2 * math.pi / ((1+5**0.5)/2)**2` and compare to 137.508° |
| Run blueprint.py | ~15 s | Click ▶ Run Script; watch seeds appear |
| Overhead plan view | 20 s | Numpad 7 → top view, zoom to fill frame |
| Equator orbit | 20 s | Middle-mouse orbit slowly around the disc |
| Shape Properties panel | 40 s | Open Properties → Object Data → Shape Keys; scrub through each key value 0→1→0 |
| Alpha_180 demo | 30 s | Show seeds rearranging into lines; explain why this is bad packing |
| Alpha_120 demo | 20 s | Show three-arm star pattern |
| Vertex colour explanation | 20 s | Point out the 34 coloured arms (FIB_CW=34 parastichies) |
| Export GLB | 10 s | File → Export → glTF 2.0 with settings visible |

---

## OBS window-capture setup

```
Sources → + → Window Capture
  Window:  [Blender 5.1 …]
  Capture method: NVFBC / XCOMPOSITE
  Crop: none
Filter: none (capture at native 1920×1080)
```

Do NOT capture the entire desktop — the window border looks untidy.

---

## Post-processing (optional)

- Trim dead space at the start/end (DaVinci Resolve or ffmpeg).
- Add lower-third text with the tutorial URL via Resolve's built-in titles.
- No music — ambient silence reads as professional in a technical tutorial.

```bash
# Quick trim and re-encode if needed
ffmpeg -i screen_raw.mp4 -ss 00:00:02 -to 00:04:10 \
  -c:v libx264 -crf 18 -preset slow -an \
  screen.mp4
```
