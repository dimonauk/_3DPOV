# GN Simulation Zone — Euler-Integrated Rolling Sphere Physics
**Blender 5.1 · Geometry Nodes · CC0**

Simulates a sphere rolling and bouncing on an undulating terrain mesh using a
Geometry Nodes **Simulation Zone** — no Blender physics engine required.

## Technique

Explicit **Euler integration** inside the Simulation Zone:

```
vel  ← vel + gravity × dt
pos  ← pos + vel × dt
if raycast_down hits terrain AND hit_distance < sphere_radius:
    vel  ← reflect(vel, hit_normal) × restitution
    pos  ← hit_pos + hit_normal × sphere_radius
```

Two `VECTOR` state items carry **Position** and **Velocity** across frames.
The sphere geometry is instanced at the tracked position each frame via
`GeometryNodeInstanceOnPoints`.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy script — builds scene, GN tree, bakes 120 frames, exports GLB |
| `record.py` | OpenGL viewport animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |

## Run

```bash
# Step 1 — build and bake
blender --background --python blueprint.py

# Step 2 — render viewport video
blender rolling_sphere.blend --python record.py

# Step 3 — screen record
# Follow SCREEN-RECORDING-NOTES.md
```

## Parameters (GN modifier panel)

| Parameter | Default | Effect |
|---|---|---|
| Initial Position | (0, 1.8, 2.2) | Launch point in terrain space |
| Initial Velocity | (0.28, −0.65, 0) | m/s — direction of launch |
| Gravity Z | −9.81 | m/s² — change for Moon (−2.0) or Mars (−3.7) |
| Restitution | 0.55 | Energy fraction retained per bounce (0 = dead stop, 1 = perfectly elastic) |
| Sphere Radius | 0.12 m | Must match the icosphere template radius |

## External Sources

- Blender Manual — Simulation Zone Node  
  <https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html>  
  Licence: CC BY-SA 4.0 · © Blender Foundation · sibling: <https://github.com/blender/blender>

- Wikipedia — Euler method  
  <https://en.wikipedia.org/wiki/Euler_method>  
  Licence: CC BY-SA 3.0 · Various contributors

## Studio Cross-References

- `/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal` — Simulation Zone fundamentals, state_items API
- `/tutorials/blender-tutorial-gn-simulation-zone-boid-flock` — multi-agent simulation, vector state
- `/tutorials/blender-tutorial-gn-raycast-terrain-decal-projection` — Raycast node in-depth
- `/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing` — continuous-field simulation
