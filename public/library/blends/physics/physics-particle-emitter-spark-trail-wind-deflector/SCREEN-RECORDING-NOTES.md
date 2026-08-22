# Screen Recording Notes — Particle Emitter: Spark Trail

## Recording software
OBS Studio or Windows Game Bar (`Win + G`).

## OBS settings
| Setting | Value |
|---|---|
| Source type | Window Capture (select "Blender") |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output | `screen.mp4` |

## Output path
`public/library/videos/physics/physics-particle-emitter-spark-trail-wind-deflector/screen.mp4`

## What to record

### 1 — Blueprint run (Scripting workspace)
- Open Scripting workspace. Load `blueprint.py`.
- Press **Run Script**. Scene populates: emitter plane at Z=3, sphere obstacle,
  ground plane, wind empty, vortex empty, spark instance (hidden), camera.
- Show the Outliner to confirm all objects are named correctly.

### 2 — Particle settings inspection
- Select `spark_emitter`. Open Properties → Physics → Particle Systems.
- Show the Emission rollout: Count=500, Lifetime=80, Start=1, End=40.
- Show the Physics rollout: Newton, Mass=0.001.
- Show the Render rollout: Object, spark_instance.
- Show the Force Weights rollout: all three weights at 1.0.

### 3 — Force field inspection
- Select `wind_force`. Properties → Physics → Force Field.
  Show Strength=8.0, Noise=0.8.
- Select `vortex_force`. Show Strength=2.5, Flow=0.6.

### 4 — Collision modifier inspection
- Select `ground_deflector`. Properties → Physics → Collision.
  Show Outer=0.02, Damping=0.65, Friction=0.80.
- Select `sphere_deflector`. Show its tighter outer thickness of 0.01.

### 5 — Bake the simulation
- Top menu: **Physics ▸ Bake All Dynamics** (or in the particle modifier Cache
  panel, click **Bake**).
- Record the progress bar counting up to frame 120. This takes 5–30 seconds
  depending on hardware.

### 6 — Playback scrub
- Press **Space** to play. Show sparks leaving the emitter, curving under wind,
  bouncing off the sphere, scattering across the tilted ground.
- Pause at frame 55 — show the hero frame with maximum particle density.

### 7 — Wind empty manipulation
- Select `wind_force` empty. Press **G Z** and move it up slightly — show how
  the wind direction shifts (you will need to re-bake to see the full effect,
  but even in real-time preview the force lines update).

## Tips
- Viewport shading: **Rendered** mode shows Bloom + Emission glow. Material
  Preview is faster if bloom isn't needed.
- If the viewport slows, reduce `display_count` in the particle settings from
  200 to 100.
- The `spark_instance` object is hidden. Do NOT unhide it — it will render a
  static shard at the origin and confuse the viewer.
