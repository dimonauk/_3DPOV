# Screen Recording Notes — Hair Curves Spring Dynamics

These notes are for capturing `screen.mp4` alongside the automated
`viewport.mp4`. Use OBS Studio or Windows Game Bar.

## OBS Studio setup

| Setting | Value |
|---|---|
| Source type | Window Capture |
| Window | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Output format | MP4 (H.264) |
| Audio | Disabled (no audio needed) |

## What to record

1. **Open** `hf_hair_spring.blend` in Blender 5.1.
2. **Timeline**: set to frame 1.
3. **Start recording** in OBS.
4. In Blender, press **Space** to play back the timeline.
   - The strands should swing down under gravity, bounce, and settle.
5. Let it play to at least frame 60 (one full swing cycle), then **stop**.
6. **Stop recording** in OBS.
7. Save the file as `screen.mp4` in this directory.

## Viewport tips

- Shading: **Solid** → **Matcap** (Studio mode, pale clay preset reads strands well)
- Enable **Object Outline** in Viewport Overlay for silhouette clarity
- Camera view is **not** required — a well-framed orthographic or perspective view works
- If the simulation looks wrong (all strands rigid or exploding):
  - Check the Geometry Nodes modifier is enabled
  - Scrub back to frame 1 before pressing Play — the Simulation Zone must start
    from frame 1 to build its cache correctly

## Filename convention

| File | Location |
|---|---|
| `viewport.mp4` | `public/library/videos/geometry-nodes/gn-simulation-zone-hair-curves-spring-dynamics-vrm/` |
| `screen.mp4` | Same directory |

Both videos go into the `videos/` folder, not next to blueprint.py.
