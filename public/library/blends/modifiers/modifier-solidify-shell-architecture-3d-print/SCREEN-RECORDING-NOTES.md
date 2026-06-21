# Screen Recording Notes
## modifier-solidify-shell-architecture-3d-print

**Goal:** Capture a Blender session demonstrating Solidify Simple vs Complex mode
on an L-shaped wall corner, showing the self-intersection failure in Simple mode
and the clean miter joint produced by Complex mode.

---

### OBS / Windows Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (tutorial voice-over added in post) |
| Output | `screen.mp4` (H.264, CRF 18) |

---

### Shot List

1. **Open `blueprint.py`** in the Scripting workspace. Run it (▶). Confirm GLB exported.

2. **Properties panel → Modifier (spanner icon)**
   - Select the `wall_corner` object.
   - Scroll to the Solidify modifier.
   - Slowly pan the mouse over each parameter: Thickness (0.20 m), Mode (Complex),
     Offset (−1.0), Thickness Mode (Fixed), Boundary (Flat).

3. **Switch Mode to Simple**
   - Change `solidify_mode` from `NON_MANIFOLD` to `SIMPLE`.
   - In Solid view, orbit to the inner corner — point camera toward (0, 0, 0) from
     inside the room (+X, +Y quadrant). The self-intersecting geometry is visible
     as overlapping faces. Pause on this for 3 seconds.

4. **Switch back to Complex (NON_MANIFOLD)**
   - Same camera angle. The miter diagonal closes the corner cleanly.
   - Slowly orbit around the corner to show the closed rim at floor and ceiling.

5. **Material preview (Material Preview mode)**
   - Switch from Solid to Material Preview (Z → Material Preview).
   - Show the EXTERIOR material (dark concrete) on outer faces, RIM material on
     the edge faces, and the inner face visible from the room interior.

6. **Viewport render still**
   - Render → Render Image (F12). Wait for EEVEE to complete (< 2 s).
   - Show render output briefly before closing.

7. **Save .blend** (Ctrl + S → confirm path).

---

### Timing Target

Full session: 8–12 minutes unedited.
After VSE trim: 4–6 minutes finished tutorial video.

See `/tutorials/blender-tutorial-vse-screen-recording-to-tutorial-export` for
the editing workflow.
