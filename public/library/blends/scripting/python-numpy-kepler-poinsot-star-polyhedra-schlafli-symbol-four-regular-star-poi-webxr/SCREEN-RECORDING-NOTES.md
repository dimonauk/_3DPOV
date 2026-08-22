# Screen Recording Notes — Kepler-Poinsot Star Polyhedra

Capture the Blender 5.1 session as you run `blueprint.py` then `record.py`.
The aim is a **screen.mp4** alongside the pre-rendered **viewport.mp4**.

---

## Software

| Tool | Setting |
|------|---------|
| OBS Studio (≥ 29) or Windows Game Bar | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off (no voiceover on this pass) |
| Output | MP4 / H.264 / CRF 18 |

---

## Steps to record

1. **Open Blender 5.1.** New General file, save as `hf_kp_star_polyhedra.blend`
   in `public/library/blends/scripting/python-numpy-kepler-poinsot-star-polyhedra…/`.

2. **Switch to Scripting workspace** (top tab bar).

3. **Start OBS recording** before doing anything else — capture the empty script
   editor as context.

4. Open `blueprint.py` via *Text → Open*. Scroll slowly through the file so
   the camera catches the parameter block and the spike construction functions
   (`spike_polyhedron`, `convex_faces`). Pause on the `PHI` constant and the
   `spike_h_factor` argument — these are the key creative knobs.

5. **Run the script** (Alt+P or the ▶ button). The four mesh objects appear in
   the viewport. Switch to **3D Viewport**, orbit around to show:
   - The crimson SSD (12 spikes) from an angle that reveals all three rings of
     four spikes each
   - The cobalt GSD (20 spikes) alongside it

6. **Select the SSD** (`hf_ssd`), enter Edit Mode (Tab), enable Face Select,
   then slowly rotate the view around a single spike to show the five
   triangular faces that make up one pentagram pyramid. Exit Edit Mode.

7. Open `record.py` via *Text → Open*. Run it. You will hear the render begin;
   let it run for a few seconds on-screen so the progress bar is visible, then
   stop if needed (Esc) — the point is to show the animation bake process,
   not to wait for the full 300 frames.

8. **Stop OBS recording.** Save the file as `screen.mp4` in:
   `public/library/videos/scripting/python-numpy-kepler-poinsot-star-polyhedra…/`

---

## Tips

- Use **Workbench** render (solid shading with cavity = 0.25, MatCap = ceramic)
  for the live viewport — it shows the spike geometry most clearly.
- Set viewport background to **dark grey** (Preferences → Themes → 3D Viewport
  → Gradient High / Low both to #1a1a1a) so the star spikes read crisply.
- For the Edit Mode pass, enable **Overlays → Face Normals** (length 0.01) to
  show outward normals on each spike face.
- The SSD and GSD are offset along X in the scene; pan the camera slightly
  right to frame both in one shot during the overview pass.

---

## Expected output files

```
public/library/videos/scripting/
  python-numpy-kepler-poinsot-star-polyhedra-schlafli-symbol-four-regular-star-poi-webxr/
    viewport.mp4   ← rendered by record.py (300 frames @ 30fps = 10 s)
    screen.mp4     ← your OBS capture of the Blender session above
```
