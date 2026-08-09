# Screen Recording Notes — Clebsch Diagonal Cubic Stage Floor

## Goal
Capture `screen.mp4` showing the full workflow: Script Editor → run `blueprint.py`
→ rotate & inspect the 27-line surface in the 3D Viewport → File ▸ Export GLB.
Target: **90–120 seconds**, 1920 × 1080, 30 fps.

---

## OBS Setup

| Setting | Value |
|---|---|
| **Window source** | Blender 5.1 (title bar match) |
| **Resolution** | 1920 × 1080 |
| **FPS** | 30 |
| **Audio** | Disabled |
| **Output format** | MP4 / H.264, CRF 17 |
| **Output filename** | `screen.mp4` |

---

## Shot list

### 1. Script Editor (0–20 s)
- Switch to **Scripting** workspace.
- Open `blueprint.py` via Text ▸ Open.
- Pause on the polynomial evaluation block:
  ```python
  S  = X + Y + Z + 1.0
  F  = X**3 + Y**3 + Z**3 + 1.0 - S**3
  ```
  Point out that this is only 2 lines of actual maths — far simpler than
  the barth sextic's three-factor product.

### 2. Run script (20–40 s)
- Press **Run Script** (▶ or Alt+P).
- Let the console print surface cell and quad counts.
- Expected: ~3–6 seconds for N=90 on a 2024 CPU.

### 3. Viewport inspection (40–90 s)
- Switch to **3D Viewport**, Solid mode.
- Press Numpad **7** (top orthographic): from above, the S₃ symmetry
  (3-fold rotation) of the tile is clearly visible — the 27 lines meet
  in a 3-way pattern.
- Press `Z` → **Wireframe**: the straight-ridge 27-line features are most
  visible here as nearly-straight edge sequences cutting across the mesh.
- Press Numpad **1** (front ortho): the compressed thickness (0.20 m vs
  1.50 m wide) confirms the stage-floor proportions.
- Switch to **Material Preview** (Z → Material Preview): deep indigo with
  subtle transmission — contrast with gold Barth sextic if shown side by side.
- Orbit (Middle Mouse, slow) to show the surface from various angles.

### 4. Export (90–110 s)
- File ▸ Export ▸ glTF 2.0 (.glb/.gltf).
- Show Draco ticked (level 6) and +Y-up enabled.
- Click **Export**.

---

## Tips
- Set viewport clipping to `View ▸ Clip Distance ▸ Start: 0.01 m` so the
  thin tile (0.20 m) doesn't clip.
- The 27 straight-line ridges are best seen in Wireframe mode from a 30–45°
  angle above the tile surface — tilt the camera slightly off the horizontal.
- If the surface appears broken into disconnected islands, N is too low —
  increase to 100 before recording.
