# Screen Recording Notes — GN Raycast: Terrain Decal Projection

**Target file:** `public/library/videos/geometry-nodes/gn-raycast-terrain-decal-projection/screen.mp4`

## Software

| Tool | Setting |
|------|---------|
| OBS Studio | Source: Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (Sources panel → mute microphone and desktop audio) |
| Output | MP4 / H.264 / CRF 18 |

## Before you start

1. Open `terrain_decal.blend` in Blender 5.1.
2. Switch to the **Geometry Nodes** workspace.
3. Select `RC_Stamps` in the Outliner — the GN modifier appears in Properties.
4. Maximise the 3-D viewport (`Ctrl + Space`), shading = **Material Preview** (`Z` → Material).

## Part 1 — Surface conformance overview (0:00–0:25)

1. In viewport, hold **Middle Mouse** and orbit slowly to show stamps lying
   flat on the slope — no stamp is perpendicular to the surface; each one
   stands upright relative to its local terrain face.
2. Point the camera so a steep hillside is visible — stamps are absent there
   (too-steep gate removes them).
3. Zoom out until the whole terrain fits in frame, then slow-orbit 90°.

## Part 2 — GN node tree walkthrough (0:25–1:00)

1. Switch the lower editor to **Node Editor** (stay in GN workspace).
2. Pan slowly left-to-right across the tree, narrating:
   - **MeshGrid** → **SetPosition (raise)** → candidates at Z = 5 m
   - **ObjectInfo (terrain)** feeds **Raycast**
   - **Raycast → BoolNot → DeleteGeometry (misses)** — remove off-edge candidates
   - **SetPosition (snap)** reads Hit Position to move surviving points to terrain
   - **VectorMath DOT_PRODUCT** computes slope cosine
   - **Compare → DeleteGeometry (steep)** removes cliffs
   - **MapRange → CombineXYZ → Scale** on InstanceOnPoints
   - **ColorRamp → StoreNamedAttribute (stamp_col)** — feeds the material
   - **AlignEulerToVector (Z) → Rotation** on InstanceOnPoints
   - **MeshCylinder (6 sides)** → **InstanceOnPoints** → **RealizeInstances**
3. Hover over the **Raycast** node; call out Is Hit, Hit Position, Hit Normal outputs.

## Part 3 — Live slope-threshold editing (1:00–1:30)

1. Select the **Too Steep?** (Compare) node.
2. In the node, slowly scrub the `B` input from `0.35` down to `0.05`
   (many more stamps appear on steep slopes).
3. Scrub back up to `0.80` (most stamps vanish — only flat plateau survives).
4. Return to `0.35`.
5. While scrubbing, ensure the viewport updates in real time.

## Part 4 — Scale variation (1:30–1:50)

1. Select the **Slope → Scale** (Map Range) node.
2. Scrub `To Min` from `0.40` down to `0.02` — stamps on near-threshold slopes
   shrink to tiny hexes while flat-zone stamps stay large.
3. Return to `0.40`.

## Tips

- Use a dark desktop wallpaper; close all notifications.
- Trim the recording to under 2 minutes before saving to `screen.mp4`.
- Do NOT include audio — the tutorial consumer will add their own narration.
