# Screen Recording Notes — Torus Knot T(p,q)

**Target file:** `public/library/videos/scripting/python-numpy-torus-knot-pq-seifert-genus-milnor-fibre-bishop-tube-poi-webxr/screen.mp4`

## Software

OBS Studio (Windows/macOS/Linux) or Xbox Game Bar (Windows only).

## Settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (mute all tracks) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

## Blender viewport preparation

1. Open `blueprint.py` in the Scripting editor and run it.
2. Switch to the **3D Viewport** (press `N`, uncheck Overlays, uncheck Gizmos).
3. Set viewport shading to **Rendered** (shortcut: `Z` → Rendered).
4. Set renderer to **EEVEE** in the Properties → Render panel.
5. Enable **Bloom**: threshold 0.32, intensity 0.45, radius 4.5.
6. Press `Numpad 0` to enter camera view, or set up a manual framing
   with the knot centred at roughly 30 cm distance (match CAM_R in record.py).

## What to capture

1. **Blender running blueprint.py** — show the script in the text editor,
   hit Run Script, watch the terminal output confirm completion.
2. **Viewport tumble** — middle-mouse-drag to tumble the trefoil (Basis) slowly.
3. **Shape-key scrub** — open Properties → Object Data → Shape Keys;
   drag each shape key value from 0 to 1 in turn:
   - Basis → SK_Cinq (cinquefoil): count the extra crossing.
   - SK_Cinq → SK_T34 (T(3,4)): a third strand appears.
   - SK_T34 → SK_T35 (T(3,5)): the knot becomes denser.
4. **record.py run** — switch to Scripting panel, run record.py, show
   the render progress in the Info header.

## Tips

- Disable the **Header** and **Footer** panels in the Blender viewport for a
  cleaner capture (right-click on the edge → uncheck header).
- Use a **solid black HDRI** or set the World background colour to `(0.02, 0.02, 0.04)`
  so bloom reads clearly.
- The screen.mp4 is companion to viewport.mp4 (which record.py generates).
  Between the two files the viewer sees both the raw viewport interaction and
  the polished render.
