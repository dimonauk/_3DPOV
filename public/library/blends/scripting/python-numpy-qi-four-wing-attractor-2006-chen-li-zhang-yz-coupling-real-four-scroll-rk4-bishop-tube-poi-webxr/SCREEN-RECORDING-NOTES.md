# Screen Recording Notes — Qi Four-Wing Attractor

Use these instructions to capture `screen.mp4` with OBS Studio or Windows
Game Bar. The recording goes alongside `viewport.mp4` in the video library.

| Setting         | Value                                                                |
|-----------------|----------------------------------------------------------------------|
| Window source   | Blender 5.1 (full application window)                               |
| Resolution      | 1920 × 1080                                                          |
| Frame rate      | 30 fps                                                               |
| Audio           | OFF (mute all tracks)                                                |
| Output path     | `public/library/videos/scripting/python-numpy-qi-four-wing-attractor-2006-chen-li-zhang-yz-coupling-real-four-scroll-rk4-bishop-tube-poi-webxr/screen.mp4` |

---

## Shot list (≈ 5–8 minutes total)

### 1 — Open the .blend file (0:00–0:30)
- Launch Blender 5.1.
- File → Open → navigate to `hf_qi_poi.blend`.
- Let the file load fully; wait for the viewport to become responsive.

### 2 — Viewport tour (0:30–1:30)
- Switch to **Material Preview** (Z → Material Preview).
- Tumble slowly around the attractor with MMB-drag so the four wings are
  visible from at least three angles:
  - Top-down (showing all four quadrant lobes in the xy-plane).
  - Side view (showing the z-extent and wing curvature).
  - Isometric diagonal (showing the full poi-head + tube assembly).
- Pause on the top-down view for 5 seconds — this is the clearest
  demonstration of the four-wing topology.

### 3 — Shape Key: SK_TwoWing (1:30–2:30)
- Open the **Properties** panel → Object Data → Shape Keys.
- Scroll slowly to `SK_TwoWing` and set Value = 0 → 1 over about 10 seconds
  (manually drag the slider).
- **Narrate / on-screen label**: "d=0 removes yz coupling; orbit collapses
  from four wings to two."
- Hold at Value=1 for 5 seconds; compare the two-wing form to the Basis.
- Return Value to 0.

### 4 — Python Script walkthrough (2:30–4:00)
- Switch workspace to **Scripting**.
- Open `blueprint.py` in the Text Editor.
- Scroll slowly through the file — pause on:
  - The `_f()` function (the three-line ODE, especially the `d * y * z` term).
  - The `_bishop_frame()` function (parallel-transport explanation).
  - The `integrate()` call block with shape-key loops.

### 5 — SK_HighB and SK_LowC (4:00–5:30)
- Return to the viewport.
- Set `SK_HighB` Value = 0 → 1 (b increases from 16 to 24; wings widen).
  Hold 5 s, then return to 0.
- Set `SK_LowC` Value = 0 → 1 (c decreases to 4; attractor stretches in z).
  Hold 5 s.

### 6 — Colour attribute inspection (5:30–6:30)
- In **Vertex Paint** mode (or via Properties → Object Data → Attributes),
  show that `Qi_Speed` FLOAT_COLOR is present and that the colour shifts
  from cobalt (slow regions) to amber (fast regions near the wing tips).

### 7 — Closing shot (6:30–end)
- Return to **Material Preview**, tumble to a satisfying diagonal angle,
  and hold for 5 seconds as the screen fade-out.

---

## OBS Studio quick-setup

1. Scene → Add → Window Capture → select Blender.
2. Settings → Output → Recording → Format: mp4, Encoder: x264,
   Bitrate: 8000 kbps (CRF 18 equivalent).
3. Settings → Video → Base: 1920×1080, Output: 1920×1080, FPS: 30.
4. Start Recording before step 1 above; Stop after step 7.

## Windows Game Bar alternative

Win + G → Capture → Start Recording (Win + Alt + R to toggle). Trim the
start/end in the Xbox Clip Editor or any video editor before saving to the
output path.
