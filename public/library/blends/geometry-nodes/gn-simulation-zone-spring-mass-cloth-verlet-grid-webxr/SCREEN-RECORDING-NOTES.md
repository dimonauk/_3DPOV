# Screen Recording Notes — Spring-Mass Cloth GN Tutorial

**Target file:** `public/library/videos/geometry-nodes/gn-simulation-zone-spring-mass-cloth-verlet-grid-webxr/screen.mp4`

## Setup

1. Run `blueprint.py` in Blender's Scripting workspace to build `hf_cloth_verlet.blend`.
2. Bake the simulation: **Object → Geometry Nodes Cache → Bake All** (~20 s for 200 frames).
3. Switch to the **3D Viewport**, set shading to **Rendered** (EEVEE Next).
4. Move the camera to the front-right position so the full cloth drape is visible (approximately `(0.6, -1.8, 0.05)` looking toward the cloth centre).
5. Confirm the top edge is pinned (stationary) and the rest of the cloth sags visibly by frame 30.

## OBS settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 24 fps |
| Format | MP4 / H.264 |
| Audio | Off |
| Recording path | `…/screen.mp4` |

## What to capture (approx. 50 s)

| Time | Action |
|------|--------|
| 0:00–0:08 | Show the initial flat XZ-plane cloth at frame 0; highlight the red top-row pinned vertices (if you have them selected) |
| 0:08–0:18 | Play from frame 0 → 60 at normal speed; cloth begins to droop and bow toward +X under gravity + wind |
| 0:18–0:28 | Pause at frame 60; orbit the 3D view to show the cloth from the side to reveal Z-depth of folds |
| 0:28–0:38 | Resume to frame 150; cloth oscillates slowly with damping settling the motion |
| 0:38–0:46 | Open the Geometry Nodes editor; show the SimulationInput → BlurAttribute × 2 → VectorMath chain → StoreNamedAttribute → SetPosition chain |
| 0:46–0:52 | Return to viewport; scrub quickly from frame 0 → 200 to show the full life of the simulation |

## Demo talking points

- "The top row's `is_pinned=1.0` attribute zeroes out the Verlet velocity and displacement each frame — no special 'constraint solver' needed."
- "Two `BlurAttribute` nodes replace dozens of explicit spring connections: iter=1 for structural (edge-length), iter=3 for bending (curvature resistance)."
- "Stability requires `K × DT² < 1`; we're at 0.43 — increasing K beyond 576 would cause explosive instability."
- "Unlike Blender's native cloth modifier, this bakes once and exports as deformed geometry to GLB — useful for WebXR playback."

## Render via script

```
blender --background hf_cloth_verlet.blend --python record.py
```

This produces `viewport.mp4` (rendered camera view) automatically.
Run the screen recording separately for the interactive UI walkthrough.
