# Python bpy + numpy — Reynolds 3D Boids

**Blender 5.1 · Python scripting · CC0**

Craig Reynolds' (1987) three-rule boid steering model, implemented as a
pure numpy simulation running inside a Blender 5.1 `frame_change_pre`
handler. 120 agents in a ±8 m cube develop emergent flocking behaviour
driven only by separation, alignment, and cohesion forces filtered through
a 120° cone-of-vision mask.

## Artefacts

| File | Description |
|---|---|
| `blueprint.py` | Full annotated boids simulation + Blender scene setup |
| `record.py` | Orbiting-camera viewport render to MP4 |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `hf_boids.glb` | Final-frame trail mesh (Draco-6 GLB, CC0) |

## Quick start

1. Open Blender 5.1
2. Go to **Scripting** workspace → open `blueprint.py` in the Text Editor
3. Click **Run Script** — expect ~5 s for the 180-frame simulation
4. Press **Space** in the 3D Viewport to play the animation
5. To export the trail GLB, set `EXPORT_GLB = True` and re-run

## Key parameters

| Constant | Default | Effect |
|---|---|---|
| `N` | 120 | Boid count (O(N²) — keep ≤ 200 for interactive speed) |
| `R_SEP / R_ALI / R_COH` | 1.2 / 2.5 / 4.0 | Zone radii (see blueprint) |
| `W_SEP / W_ALI / W_COH` | 2.0 / 1.0 / 0.8 | Force weights |
| `VISION_COS` | −0.5 | cos(120°) — forward cone filter |
| `STEER_LIM` | 0.04 | Max steering acceleration per frame |
| `TRAIL_LEN` | 30 | Trail history depth |

## External sources

- Reynolds, C.W. (1987) — "Flocks, Herds, and Schools: A Distributed Behavioral Model"
  *ACM SIGGRAPH Computer Graphics*, 21(4), 25–34.
  https://dl.acm.org/doi/10.1145/37402.37406 — public domain
- Shiffman, D. — *The Nature of Code* §5 Autonomous Agents — MIT licence (code)
  https://natureofcode.com/autonomous-agents/
