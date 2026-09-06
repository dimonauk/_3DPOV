# Screen-Recording Notes — LG Optical Vortex Floor

## What you are recording

A Blender 5.1 scripted session that runs `blueprint.py` to build a 128×128
quad-grid height field representing Laguerre–Gaussian optical vortex beam
intensity profiles (|LG_p^l|²) at the beam waist.  The four shape keys morph
between different topological-charge / radial-index combinations, revealing the
characteristic ring-and-petal structure of these phase-singular beams.

---

## OBS / Game Bar settings

| Setting | Value |
|---------|-------|
| Window source | **Blender** (full window, not just viewport) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (silent run) |
| Encoder | x264 / NVENC, CRF 18 |
| Output | `screen.mp4` (place in `videos/scripting/<slug>/`) |

---

## Shot list

### 1 — Setup  (0:00–0:30)
- Open Blender 5.1 fresh.
- Open **Scripting** workspace.
- Load `blueprint.py` via *Open* in the text editor.
- Show the full script briefly — pause on the `lg_field()` function docstring.

### 2 — Run blueprint  (0:30–1:30)
- Click **Run Script**.
- Switch to **3D Viewport**, Numpad 7 (top view) to see the grid populate.
- Switch to **Material Preview** shading to reveal the cobalt–amber phase patterning.
- Orbit around the floor (middle-mouse drag) — show the doughnut ring from
  different angles.

### 3 — Shape key tour  (1:30–3:00)
- Open **Object Data Properties** → Shape Keys panel.
- With Basis selected: identify the single bright ring (l=1 p=0).
  Show cursor hover on the dark centre — explain the phase singularity.
- Drag SK_l2 value from 0→1: ring grows, dark core widens.
  Pause at SK_l2=1 — show the wider, dimmer ring of charge-2.
- Drag SK_l3 value 0→1: note that the peak moves further outward.
- Drag SK_p1 value 0→1: two concentric rings appear — the inner and outer
  bright bands of the p=1 radial quantum number.

### 4 — Colour explanation  (3:00–4:00)
- Switch to **Rendered** view (EEVEE Next) or **Material Preview**.
- Explain: colour encodes helical phase l·φ via |sin(l·φ/2)|.
  - Basis (l=1): one cobalt→amber petal per 360°.
  - SK_l2 (l=2): two petal pairs visible as alternating cobalt / amber wedges.
- Open **Shader Editor** briefly — show the Attribute → Base Color connection.

### 5 — Export  (4:00–4:45)
- Run the GLB export block (last section of blueprint.py, or call from console).
- Show the GLB size in the file browser (~few MB with Draco-6).
- Mention Draco compression level 6 and WebP textures.

### 6 — Record.py overview  (4:45–5:30)
- Switch back to Scripting workspace, open `record.py`.
- Explain the morph-key animation timeline (0–60 s Basis, 60–120 SK_l2, etc.).
- Mention the 10-second EEVEE Next render to `viewport.mp4`.

---

## Tips

- Run blueprint.py in a fresh Blender session (File → New) to avoid name
  collisions with existing objects.
- If the grid appears flat (z=0 everywhere), check that `scipy.special` is
  accessible from Blender's Python; the script uses only `numpy` and `math`
  so it should work with the bundled Python.
- Material Preview shading (keyboard Z → Material Preview) shows the colour
  attribute more accurately than Solid mode.
- To inspect the LG_Phase attribute values: select all vertices in Edit Mode,
  open **Spreadsheet Editor** (set domain to Vertex), search "LG_Phase".
