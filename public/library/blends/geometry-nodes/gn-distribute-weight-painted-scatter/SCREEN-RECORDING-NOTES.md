# Screen Recording Notes — GN Distribute Weight-Painted Density Scatter

Save as: `public/library/videos/geometry-nodes/gn-distribute-weight-painted-scatter/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---|---|
| Source | Window Capture — Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (mute all tracks) |
| Encoder | x264 / NVENC H.264 |
| Output format | MP4 |

## What to record

This tutorial has two distinct phases. Record them as one continuous take
or two separate clips and join them in your editor.

### Phase 1 — Vertex Paint density map (≈ 90 seconds)

1. Open a fresh scene. Add a Plane and subdivide it 15 times
   (right-click → Subdivide × 3, or in Edit Mode: W → Subdivide).
2. In **Object Data Properties → Attributes**, click **+** and create:
   - Name: `scatter_density`
   - Type: Float
   - Domain: Point
3. Switch to **Vertex Paint** mode. In the header attribute selector,
   choose `scatter_density`.
4. Set brush colour to **white** (1.0). Paint the centre of the plane
   to build up a bright white blob.
5. Reduce brush strength to 0.3 and blend outward to the edges.
   The outer ring should stay dark grey / black (near 0.0).
6. Hold the camera over the plane so the gradient is clearly visible.
7. Open the Geometry Nodes modifier panel (Properties → Modifier → Add → Geometry Nodes).

### Phase 2 — GN tree build and live scatter (≈ 3 minutes)

1. In the Geometry Nodes editor, recreate the tree from the blueprint:
   - **Distribute Points on Faces** (Density = 8)
   - **Named Attribute** "scatter_density" (Float)
   - **Random Value** (Float, 0–1, same Seed)
   - **Compare** (GREATER_EQUAL: A = random, B = density)
   - **Delete Geometry** (Point domain, Selection = compare)
   - **Object Info** pointing to a small icosphere "rock" in the scene
   - **Instance on Points** (Rotation = Random Value FLOAT_VECTOR Z ∈ [0, 2π])
   - **Realize Instances**
2. As you connect the Delete Geometry node and wire it up, the scatter
   should appear live — show the viewport updating.
3. Zoom out to show the full terrain: dense rocks at the centre,
   gradually thinning to bare green at the edges.
4. Demonstrate interactive paint: return to Vertex Paint, darken the
   centre with black, and show the scatter thinning in real time.
5. End with a slow orbit around the finished scene.

## Cut points

- Cut any multi-second pauses while navigating menus.
- Keep the moment the scatter first appears live — it is the visual payoff.
- The density-painting demo in Phase 1 can be sped up 2× in post.

## After recording

Run `record.py` to generate `viewport.mp4` (the programmatic orbit render).
Pair it with `screen.mp4` in the tutorial page.
