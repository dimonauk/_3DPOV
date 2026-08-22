# Screen Recording Notes — bmesh.ops.subdivide_edges

Target file:
`public/library/videos/scripting/python-bmesh-ops-subdivide-edges-catmull-loop-cut-faceted-plinth-webxr/screen.mp4`

## OBS / Game Bar Setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

## Steps to Record

1. Open Blender 5.1. Open `blueprint.py` in the Text Editor (`Shift+F11`).
2. Run the script (`Alt+P`). Three objects appear:
   - **Left**: `hf_sub_cap` — flat lid with 2 support-loop rings
   - **Centre**: `hf_sub_shaft` — rough stone column with fractal noise
   - **Right**: `hf_sub_base` — stepped base with INNER_VERT star inset
3. Press `Z` → **Material Preview** so the material colours are visible.
4. Frame all three with `Numpad .` (View Selected All).
5. **Start OBS recording.**

### Key Moments to Capture (≤ 60 seconds total)

**Cap (left object)** — support loops:
- Select `hf_sub_cap`. Press `Tab` → Edit Mode.
- Press `Alt+A` to deselect all, then `2` (Edge select).
- Hover over one of the two new horizontal edge rings; press `Alt+Click` to select the whole loop.
- The selected loop should light up — this is the `geom_inner` edge ring from `subdivide_edges`.
- Press `Tab` back to Object Mode. Pause 2 seconds.

**Shaft (centre object)** — fractal stone:
- Select `hf_sub_shaft`. Tab into Edit Mode.
- Press `Alt+Z` (X-ray on) — the dense fractal interior topology becomes visible as a dense wireframe.
- Rotate with middle-mouse drag so the bumpy silhouette is visible from a 3/4 angle.
- Tab back to Object Mode. Pause 2 seconds.

**Base (right object)** — INNER_VERT panel:
- Select `hf_sub_base`. Tab into Edit Mode.
- View from above (`Numpad 7`). The top face shows a 4-triangle star fan from the INNER_VERT centre vertex.
- Return to perspective view (`Numpad 5`). Press `Alt+Z` to see through to the star fan.
- Tab back. Pause 2 seconds.

6. **Stop OBS recording.** Trim to ≤ 60 seconds. Save to the path above.

## Notes

- If the fractal shaft looks too smooth, increase `FRACTAL_AMT` to `0.10` in `blueprint.py` and re-run.
- The INNER_VERT star fan on the base top face is subtle at default settings. View from above (`Numpad 7`) to show it clearly.
- `FRACTAL_SEED = 7` is deterministic — re-running the script always produces the same stone texture.
