# Screen Recording Notes — Lissajous Knots

These notes are for Dimona (or any Holoflow operator) capturing `screen.mp4`
of the Blender session. The finished recording supplements the `viewport.mp4`
(generated automatically by `record.py`) with a human-navigated walkthrough
of the technique.

---

## Software & settings

| Setting | Value |
|---|---|
| Recorder | OBS Studio ≥ 30 (Windows) or Game Bar (Win+G) |
| Window source | Blender 5.1 — main window only |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (silent recording — music added in post) |
| Encoder | x264 / NVENC at CQ 20 |
| Output | `screen.mp4` → place in `public/library/videos/scripting/python-numpy-lissajous-knots-chebyshev-amphichiral-bishop-tube-poi-webxr/` |

---

## Scene preparation (do before hitting Record)

1. Open Blender 5.1. Close the splash screen.
2. Delete the default cube/camera/light.
3. Open the Scripting workspace (top menu bar).
4. Load `blueprint.py` from this directory.
5. Run the script (▶ Run Script). Wait for the console to print
   `✓ hf_lissajous_poi.blend + hf_lissajous_poi.glb written.`
6. Switch to the **Layout** workspace.
7. Press `Numpad 5` (Orthographic → Perspective).  
   Press `Numpad 1` (front view), then orbit to a 3/4 angle with middle-mouse drag.
8. Set viewport shading to **Material Preview** (sphere icon, or `Z → Material Preview`).
9. Enable `Overlays → Face Orientation` — observe the consistent outward normal
   (all blue, unlike the Boy Surface which shows alternating blue/red).

---

## Shot list (≈ 60–90 seconds total)

### Shot 1 — Full orbit (15 s)
- With the figure-eight (Basis) shape active, press `R → Z → drag` to rotate
  slowly around Z. Or use the View → Orbit tool in the header.
- Narrate (if recording voice-over later): "This is a Lissajous knot: three
  cosine oscillators with frequencies 3, 4, 5 — the same maths as the
  Lissajous figures on an oscilloscope, but in 3D."

### Shot 2 — Properties panel shape keys (20 s)
- Click the **Object Data Properties** tab (triangle/mesh icon in Properties).
- Expand **Shape Keys**. Show the five entries: Basis, SK_Trefoil, SK_Cinquefoil,
  SK_Nine, SK_Twelve.
- Scrub the SK_Trefoil value slider from 0 → 1 → 0 slowly. Watch the tube
  deform from figure-eight to trefoil topology.

### Shot 3 — Scripting workspace walkthrough (20 s)
- Switch to Scripting.
- Scroll to the `KNOTS` list in `blueprint.py` (~line 65).
- Highlight the four frequency triples. Point out the coprimality condition
  and the phase offsets.

### Shot 4 — Vertex colour attribute (15 s)
- Back in Layout. In Properties → Object Data, expand **Color Attributes**.
- Show the `Col` entry (type `FLOAT_COLOR`, domain `POINT`).
- In viewport, enable Overlays → Vertex Colors (or use Attribute display).
  The rainbow hue cycling along arc length should be visible.

### Shot 5 — GLB export confirmation (10 s)
- File → Export → glTF 2.0.
- Check that **Draco Compression** is ticked, level 6.
- Check **Shape Keys** and **Vertex Colors** are both ticked.
- Press Export (or cancel if the file is already written by blueprint.py).

---

## OBS quick-start checklist

- [ ] Sources → Add → Window Capture → select "Blender"
- [ ] Audio → mute all tracks
- [ ] Output → Recording → format mp4, encoder x264/NVENC
- [ ] Start Recording → work through shot list → Stop Recording
- [ ] Rename the file to `screen.mp4`
- [ ] Copy to the videos directory above

---

## Common issues

| Problem | Fix |
|---|---|
| Tube looks faceted | N_TUBE in blueprint.py is too low; increase to 16 |
| Shape key morph is jerky | Scrub slowly; the key values blend in Blender's vertex lerp |
| OBS window capture shows black | Set Blender capture to "Specific Window → Blender", not desktop capture |
| Colors look washed out in recording | Set OBS colour space to sRGB; disable HDR |
