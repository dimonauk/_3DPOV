# Screen-Recording Notes — Lozi Map Strange Attractor

**Target file:** `public/library/videos/scripting/python-numpy-lozi-map-1978-piecewise-linear-henon-misiurewicz-strange-attractor-stage-floor-webxr/screen.mp4`

---

## Setup

1. Open Blender 5.1.
2. Open the **Scripting** workspace.
3. Load `blueprint.py` in the text editor.
4. Open OBS Studio (or Xbox Game Bar on Windows).

---

## OBS scene configuration

| Setting | Value |
|---------|-------|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (mute mic + desktop audio) |
| Output format | MP4 / H.264, CRF 18 |
| Output file | `screen.mp4` (rename to slug path after recording) |

---

## Recording sequence

### Part A — Script execution (~3 min)

1. Start recording.
2. In the Blender text editor, press **Run Script** (▶).
3. Keep the console / info bar visible so viewers see the progress prints:
   ```
   [Lozi] Computing Basis density …
   [Lozi] Computing SK_LowA density …
   [Lozi] Computing SK_HighA density …
   [Lozi] Computing SK_LowB density …
   [Lozi] Done — 'Lozi_Attractor' with 14641 vertices.
   ```
4. Do **not** move the mouse during the long computation — the viewer should
   see the console updating naturally.

### Part B — Shape key sweep (~2 min)

1. Switch to the **Layout** workspace.
2. Select the `Lozi_Attractor` object.
3. Open **Object Data Properties → Shape Keys**.
4. Slowly slide each shape key value from 0 → 1 → 0:
   - **Basis** → **SK_LowA**: notice the attractor wing broadens.
   - **SK_LowA** → **SK_HighA**: attractor compresses, ridges steepen.
   - **SK_HighA** → **SK_LowB**: dissipation increases, fractal creases sharpen.
5. Pause at each extreme so the viewer can read the geometry change.

### Part C — Viewport shading / colour (~1 min)

1. Set viewport shading to **Material Preview** (Sphere icon).
2. In **Viewport Overlays → Geometry**, enable **Vertex Color** to show
   the Lozi_Density cobalt–amber attribute.
3. Orbit around the object slowly (numpad 4/6) to show the 3-D height variation.

### Part D — Numpad views (~30 s)

| Numpad | View | Why |
|--------|------|-----|
| 7 | Top | Shows the 2-D map density from above — clearest for the fractal structure |
| 1 | Front | Shows height variation profile |
| 5 | Toggle ortho/persp | Comparison |

---

## Stop recording

Stop OBS recording, rename output to `screen.mp4`, move to the slug path above.
