# Screen Recording Notes — Apollonian Gasket Poi Head

**Blender version**: 5.1  
**Recording software**: OBS Studio (or Windows Game Bar)  
**Target file**: `public/library/videos/scripting/.../screen.mp4`

---

## OBS Setup

| Setting | Value |
|---|---|
| Window source | Blender 5.1 (main window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

---

## What to record (step by step)

1. **Open Blender 5.1** with a fresh general scene.

2. **Load blueprint** — go to Scripting workspace, open `blueprint.py`, press **Run Script**.
   - Wait for the terminal output: `Saved → hf_apollonian_gasket.blend`.
   - The viewport should now show the terraced fractal disc (≈ 1 000–2 000 cylinder discs).

3. **Viewport settings for recording**:
   - Shading: **Solid → Colour: Attribute → Attribute name: Col**
   - Overlay: disable Grid and Axes
   - Zoom and orbit to a 3/4 top-down view showing the fractal depth relief.

4. **Start OBS recording**.

5. **Demonstrate the fractal structure** (1–2 min):
   - Orbit slowly around the disc with middle-mouse-drag.
   - Zoom in on a high-curvature corner region — show how circles nest infinitely.
   - Press **Numpad 7** for top-down view; the Apollonian packing reads clearly.
   - Press **Numpad 1** for side view; terraced depth layers are visible.

6. **Select the mesh** and press **N** to show the custom properties panel:
   - Point out `holoflow:facet = True` and `holoflow:category = poi-head`.

7. **Open Scripting workspace** — briefly show the BFS queue logic and the
   reflection formula `kN = 2*(kB+kC+kD) − kP`.

8. **Run record.py** to show how the viewport animation render is queued.

9. **Stop OBS recording** and trim to ≤ 3 min.

---

## Tips

- The fractal relief is most dramatic at oblique angles (~45° elevation).
- If frame rate drops below 30 fps during orbit, reduce `DISC_SEGMENTS` to 12
  in `blueprint.py` and re-run.
- Workbench vertex-colour mode renders in real time; no need for Eevee or Cycles
  during the screen recording.

---

*Holoflow Studio — Blender Expert Content Mill*
