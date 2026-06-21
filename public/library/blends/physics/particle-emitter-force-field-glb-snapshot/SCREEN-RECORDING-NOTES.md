# Screen-Recording Notes — Particle Emitter Force Field

**Target file**: `public/library/videos/physics/particle-emitter-force-field-glb-snapshot/screen.mp4`

## OBS / Windows Game Bar settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |

## Capture sequence (~50 s total)

1. **Scripting workspace** — show `blueprint.py` open, parameter block visible (3 s).
2. **Run Script (Alt+P)** — capture the console output: three `[holoflow]` lines
   confirming alive particle count, `.blend` path, `.glb` path (5 s).
3. **Layout workspace** — torus emitter + particle dot cloud visible (3 s).
4. **Scrub timeline 1 → 120** slowly — shards erupt from torus faces during
   frames 1–12, arc through turbulence, scatter and settle (10 s).
5. **Pause at frame 35** — orbit 3D Viewport to show burst frozen in space;
   note the arcing trajectories from turbulence (5 s).
6. **TURB_SIZE demo** — change `TURB_SIZE = 0.2`, rerun, show tight jitter;
   then `TURB_SIZE = 2.0`, rerun, show slow coherent sweep (10 s).
7. **Properties ▸ Particles ▸ ShardBurst** — show count, lifetime, emit from
   Face, render type Object, instance object = shard_instance (5 s).
8. **gltf.report** — drag `particle_shard_burst.glb` in; confirm node name,
   two materials, Draco decoded, identity transform, Y-up (6 s).

Total: ~47 s. Trim dead time to ≤ 35 s for the published clip.

## Post-processing

No colour grading required. Crop to 1920 × 1080 if letterboxed.
Encode: H.264, CRF 23, no audio stream.
