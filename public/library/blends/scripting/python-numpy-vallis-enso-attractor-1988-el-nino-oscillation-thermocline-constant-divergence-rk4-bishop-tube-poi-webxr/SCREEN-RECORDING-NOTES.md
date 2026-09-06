# Screen-Recording Notes — Vallis ENSO Attractor

**Target file:**
`public/library/videos/scripting/python-numpy-vallis-enso-attractor-1988-el-nino-oscillation-thermocline-constant-divergence-rk4-bishop-tube-poi-webxr/screen.mp4`

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

### Part A — Script execution (~4 min)

1. Start recording.
2. In the Blender text editor, press **Run Script** (▶).
3. Keep the Info bar visible so viewers see progress:
   ```
   [Vallis] Computing Basis orbit (b=14 c=0.1 F=18) …
   [Vallis] Computing SK_Periodic orbit (F=11) …
   [Vallis] Computing SK_StrongB orbit (b=20) …
   [Vallis] Computing SK_LowDamp orbit (c=0.05) …
   [Vallis] Building tube mesh …
   [Vallis] Adding SK_Periodic shape key …
   [Vallis] Adding SK_StrongB shape key …
   [Vallis] Adding SK_LowDamp shape key …
   [Vallis] Exporting GLB …
   [Vallis] Done — 3000 wire-points, 24000 tube vertices.
   ```
4. Hold the camera steady — let the console scroll naturally.

### Part B — Shape-key sweep: chaos vs. periodic (~3 min)

1. Switch to the **Layout** workspace.
2. Select `Vallis_ENSO_Poi`.
3. Open **Object Data Properties → Shape Keys**.
4. Sweep each key 0 → 1 → 0 with a brief pause at each extreme:

   - **Basis → SK_Periodic (F=18 → F=11)**:
     The chaotic tangle collapses to a tight, elliptical loop — the
     periodic El Niño cycle. Pause at SK_Periodic=1.0 for 5 s.

   - **Basis → SK_StrongB (b=14 → b=20)**:
     Stronger thermocline coupling spreads the orbit wider. Pause at 1.0.

   - **Basis → SK_LowDamp (c=0.1 → c=0.05)**:
     SST damping halves; the orbit expands slightly and the slow segments
     lengthen. Pause at 1.0.

5. Return all keys to 0 before Part C.

### Part C — Vertex colour walkthrough (~1 min)

1. Set viewport shading to **Material Preview** (sphere icon in header).
2. Orbit around the object with **Middle Mouse** to show the cobalt (fast)
   and amber (slow) speed gradient from multiple angles.
3. Switch to **Solid** mode and enable **Vertex Color** in Viewport Overlays
   to confirm the FLOAT_COLOR attribute is baked into the mesh.

### Part D — Numpad views (~30 s)

| Numpad | View | Why |
|--------|------|-----|
| 1 | Front | Shows the main loop structure of the Vallis attractor |
| 3 | Side | Reveals depth of the spiralling basin |
| 7 | Top | Shows plan topology — compare chaotic vs. periodic keys |
| 0 | Camera | Preview of the record.py orbit path |

---

## Stop recording

Stop OBS recording, rename to `screen.mp4`, move to the slug path above.
