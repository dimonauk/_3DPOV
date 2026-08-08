# Screen-Recording Notes — Lorenz Attractor Tutorial

## Setup checklist

| Step | Action |
|------|--------|
| 1 | OBS Studio → Add **Window Capture** source → select **Blender** |
| 2 | Resolution: **1920 × 1080**, framerate: **30 fps**, audio: **muted** |
| 3 | Output: **MP4 / H.264** → `screen.mp4` |

## Recording sequence

### Part A — Script execution (≈60 s)

1. Scripting workspace → open `blueprint.py` → **Run Script** (Alt+P).
2. Console shows two lines:
   - `[Lorenz] Orbit A: 4500 verts  Orbit B: 4500 verts`
   - `[Lorenz] GLB → /path/to/hf_lorenz.glb`
3. Zoom the console so both lines are legible — this confirms RK4 convergence
   and successful GLB output.

### Part B — Viewport inspection (≈90 s)

1. Switch to **3D Viewport** → Material Preview (Z → Material Preview).
2. Orbit to the **side view** (Numpad 1): the two wings of the butterfly
   are clearly separated — blue-white on one side, amber on the other.
3. Orbit to **top-down** (Numpad 7): the double-scroll structure is visible,
   the two orbits spiralling outward from the inner fixed points.
4. Select `Lorenz_WingB` → show Properties → notice the vertex count; compare
   with `Lorenz_WingA` to confirm both are identical length (both use the same
   N_STEPS / THIN).

### Part C — Divergence demonstration (optional, ≈45 s)

1. Increase `DT` to 0.006 and `THIN` to 2 in `blueprint.py` and re-run.
2. Point out that the wing geometry shifts slightly — this is NOT a rendering
   artefact but a genuine consequence of halving accuracy; the chaotic system's
   sensitivity amplifies tiny numerical differences.
3. Reset to original parameters.

### Part D — GLB preview in file browser (≈20 s)

1. Open **File Browser** panel, navigate to `.blend` directory.
2. Show `hf_lorenz.glb` — expect 400–700 kB after Draco-6 compression.

## Final output

- `screen.mp4` → `public/library/videos/scripting/…lorenz…/screen.mp4`
- `viewport.mp4` → same folder (rendered by `record.py`)
- `hf_lorenz.blend` → save with Ctrl+S before closing

## Common issues

| Issue | Fix |
|-------|-----|
| `AttributeError: 'eevee' bloom` | Ensure **EEVEE Next** is selected in Render Properties |
| Tube appears kinked near the wing-crossing | Normal — the orbit actually does make sharp direction changes there; if aesthetically undesirable, increase THIN from 4 to 8 |
| GLB very large ({">"} 2 MB) | Reduce N_STEPS to 10 000 or increase THIN to 8 |
| Wing B looks identical to Wing A | The Δx = 1e-4 divergence only shows at t {">"} ~10 time units; with SKIP=500 steps (1.5 t.u.) you're already post-divergence; if orbits look the same, reduce DT to 0.001 to ensure accuracy |
