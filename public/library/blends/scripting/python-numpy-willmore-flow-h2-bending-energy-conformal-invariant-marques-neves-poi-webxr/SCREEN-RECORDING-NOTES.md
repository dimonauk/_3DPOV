# Screen-Recording Notes — Willmore Flow Tutorial
**Holoflow Studio · Blender 5.1**

---

## Software
| Tool | Setting |
|------|---------|
| OBS Studio ≥ 30.0 | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no commentary track) |
| Output | `screen.mp4`  H.264, CRF 18 |

---

## Pre-flight checklist
1. Open Blender 5.1. Set workspace to **Scripting**.
2. Load `blueprint.py` into the text editor.
3. Maximise the 3D Viewport in one corner and the Python Console in another.
4. Set viewport shading to **Material Preview** (Z key → Material Preview) so
   the Willmore-density colour attribute is visible.
5. In OBS, set your capture window to the Blender window.
6. Ensure the Blender title bar and Python console are both visible.

---

## Recording script (≈ 4–5 minutes)

### Part 1 — Setup (30 s)
- Show Blender splash / version string to timestamp "5.1".
- Open `blueprint.py`, scroll through it slowly to show the parameters block.
- Call out `TORUS_R=1.0`, `TORUS_r=0.45`, `DT=8e-6`, `N_STEPS=120`.

### Part 2 — Run the blueprint (60 s)
- Click **Run Script** (▶ button).
- Keep the System Console open (Window → Toggle System Console on Windows;
  or run Blender from a terminal on Linux/macOS).
- Show console output: initial W ≈ value, then Step 15/40/70/120 W values
  each decreasing toward 2π² ≈ 19.739.
- While running, narrate: "We're watching the Willmore energy drop with each
  step of gradient descent."

### Part 3 — Inspect the mesh (90 s)
- After script completes, switch to **Layout** workspace.
- Switch viewport to **Vertex Color** display mode.
- Slowly rotate the torus — cobalt regions are already close to the Clifford
  minimum, amber spikes are where H is large and will relax first.
- Open the **Shape Keys** panel (Properties → Object Data → Shape Keys).
- Scrub value on `SK_Step015` → `SK_Step120`; show the torus relaxing to a
  more equivolumetric cross-section.

### Part 4 — 3D Viewport close-ups (60 s)
- Numpad 1 (front view): show the cross-sectional shape flattening slightly.
- Numpad 3 (side view): confirm the tube stays closed (no mesh tearing).
- Middle-mouse orbit and zoom into a single tube cross-section.

### Part 5 — Console output (30 s)
- Switch back to System Console.
- Point out that W decreased from initial to final; if close to 2π² ≈ 19.739
  it validates the implementation.

---

## Post-processing
- Trim leading/trailing blank frames in DaVinci Resolve or Premiere.
- Export as `screen.mp4` alongside `viewport.mp4`.
- Upload both to `public/library/videos/scripting/<slug>/`.

---

## Destination
```
public/library/videos/scripting/
  python-numpy-willmore-flow-h2-bending-energy-conformal-invariant-marques-neves-poi-webxr/
    viewport.mp4   ← rendered by record.py
    screen.mp4     ← recorded via OBS per these notes
```
