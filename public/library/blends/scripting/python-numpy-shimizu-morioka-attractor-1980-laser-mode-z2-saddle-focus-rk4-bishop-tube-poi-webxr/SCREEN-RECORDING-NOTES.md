# Screen Recording Notes — Shimizu–Morioka Attractor Poi Head

**Target file:** `public/library/videos/scripting/python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr/screen.mp4`

---

## Software

| Tool | Settings |
|------|----------|
| OBS Studio 30+ | Window capture source = Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no microphone) |
| Output format | MP4 / H.264 / CRF 18 |

---

## Pre-recording setup in Blender

1. Open a fresh Blender 5.1 file.
2. Switch to the **Scripting** workspace.
3. Load `blueprint.py` in the Text Editor (Alt+O or drag-and-drop).
4. Set the viewport to **Workbench → Flat shading → Vertex Colour**.
5. Run the script (Alt+P or ▶ button) — build time is roughly 15–25 seconds.
6. Switch to the **Layout** workspace.
7. Press **Numpad 5** (orthographic off) then **Numpad 0** (camera view).
8. In the Properties panel → Object Properties, expand **Shape Keys**.
9. Set viewport overlays to **off** (clean background, no grid).

---

## Shot list (aim for ≈ 60–90 seconds total)

| Clip | Action | Approx. duration |
|------|--------|-----------------|
| **1 — Build** | Switch to Scripting workspace, show script in Text Editor, press Run. Cut once the mesh appears. | 20 s |
| **2 — Orbit** | Rotate the poi head slowly in the viewport using Middle Mouse Button drag. Show the butterfly topology from multiple angles, dwelling on the narrow saddle passages at the origin. | 25 s |
| **3 — Colour** | With the mesh selected, show the SM_Speed colour attribute in the Properties panel → Object Data → Colour Attributes. Toggle to Rendered view briefly. | 10 s |
| **4 — Shape keys** | In Properties → Object Properties → Shape Keys, scrub each shape key value slider from 0 to 1: SK_LowA (wider orbit), SK_HiA (tighter, near Hopf boundary), SK_LowB (equilibria shift). | 30 s |
| **5 — Close-up** | Zoom into the central saddle region to show how the two wings are joined at the origin. | 10 s |

---

## OBS recording procedure

1. Start OBS, select the Blender window as source.
2. **Start Recording** before beginning the shot list.
3. Follow the shot list above.
4. **Stop Recording**.
5. Rename the output file to `screen.mp4` and place it in the target directory.

---

## Tips

- The butterfly has Z₂ symmetry — show both wings in the orbit clip.
- Keep the Workbench **Flat** shading active throughout; the cobalt→amber gradient should be clearly visible even without a separate colour ramp node.
- If the mesh appears grey, check that **Colour Attributes** is enabled in the Workbench colour-type dropdown.
- The shape key SK_LowB shifts the equilibria inward from (±0.894, 0, 1) to (±0.707, 0, 1) — the two wings appear to shrink inward; this is worth showing explicitly.
