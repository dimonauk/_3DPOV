# Screen Recording Notes — Cast Modifier Squash-and-Stretch

## Target file
`public/library/videos/modifiers/modifier-cast-sphere-cuboid-cartoon-squash/screen.mp4`

## OBS / Game Bar settings

| Setting        | Value                                   |
|----------------|-----------------------------------------|
| Source         | Window Capture → Blender 5.1           |
| Resolution     | 1920 × 1080                             |
| Frame rate     | 30 fps                                  |
| Audio          | Off                                     |
| Output format  | MP4 (H.264)                             |

## What to record (approx. 3 minutes)

### 1. Scene overview — 30 s
- Open `cartoon_blob.blend`.
- Show the blob resting on the ground plane in SOLID shading.
- Point camera at the Properties panel → Modifier Properties (wrench icon).
- Highlight the three modifiers in order: **Subdiv** (Simple), **CastCuboid**, **CastSphere**.

### 2. CastCuboid inspection — 45 s
- Click into the CastCuboid modifier.
- Show the settings: `Type = Cuboid`, `X = ✓`, `Y = ✓`, `Z = ✗`, `Radius`, `Factor = 0`.
- Manually drag the **Factor** slider from `0` to `1` — watch the blob flatten to a disc.
- Reset Factor to `0`.

### 3. CastSphere inspection — 45 s
- Click into the CastSphere modifier.
- Show: `Type = Sphere`, `X = ✗`, `Y = ✗`, `Z = ✓`, `Factor = 0`.
- Drag Factor to `1.8` — blob elongates into a teardrop.
- Drag to `2.5` for extreme overshoot demonstration.
- Reset to `0`.

### 4. Timeline scrub — 45 s
- Open the Timeline editor (bottom strip).
- Scrub to **frame 12** — show the squash disc pose.
- Scrub to **frame 30** — show the stretch teardrop pose.
- Show the Dope Sheet (change editor type) — highlight the `CastCuboid.factor`
  and `CastSphere.factor` animation tracks.

### 5. Animated playback — 30 s
- Switch back to Timeline.
- Press **Space** to play.
- Let the squash-stretch cycle play through at least twice.
- Switch shading to **Material Preview** to show the emission glow.

### 6. Blueprint run (optional) — 30 s
- Scripting workspace → open `blueprint.py`.
- Press **Run Script**.
- Show the GLB files appearing in the file browser.

## Notes
- During the Factor drag demonstrations, keep Blender in **SOLID** mode so
  the deformation is clearly visible without render overhead.
- The squash impact (frame 12) is fast — scrub slowly through frames 10–14
  to make the arc visible.
- If recording audio narration, call out: *"CastCuboid flattens the XY plane
  into a square; CastSphere then stretches the Z axis into a teardrop — both
  via a single keyframed float."*
