# Screen Recording Notes — bmesh.ops.convex_hull

Target file: `public/library/videos/geometry/python-bmesh-ops-convex-hull-pointcloud-crystal-gem-webxr/screen.mp4`

## OBS / Game Bar Setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (no mic needed) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

## Steps to Record

1. Run `blueprint.py` via Blender's Text Editor (`Alt+P`) — three objects appear: gem (left), organic blob (centre), proxy hull (right).
2. In the 3D Viewport, press `Numpad 5` (Orthographic off → Perspective), then `Numpad 0` (reset view).
3. Press `Z` → **Material Preview** so colours are visible.
4. **Start OBS recording.**
5. Press `Numpad 1` — front view. Slowly rotate with middle-mouse drag to a 3/4 angle showing all three objects at once.
6. Select the crystal gem, press `R Z` and slowly spin it 180° so the facets catch the light at different angles — pause 2 seconds.
7. Tab into Edit Mode on the gem, press `Alt+Z` (X-ray) to reveal interior — you should see ONLY the hull faces and NO interior verts (they were deleted). Pause 2 seconds. Tab back to Object Mode.
8. Switch to the proxy (right object), press `G X 0` to snap it back to centre briefly, move it back right so it overlaps the organic blob for 2 seconds — showing the tight convex fit.
9. **Stop OBS recording.** Trim to ≤ 60 seconds.
10. Save to the path above.

## Key Moments to Capture

- Hull materialising in Edit Mode (show only triangular faces, no interior remnants)
- Side-by-side: smooth organic blob vs. faceted convex proxy
- Crystal gem rotating so face normals flash in the light

## Notes

- The collision proxy is intentionally translucent-coloured (amber) — in Material Preview it appears opaque; add alpha = 0.4 in the material settings before recording if you want it see-through.
- If the script's random seed produces a degenerate long-sliver triangle on any hull face, increase `GEM_N` to 64 in `blueprint.py` and re-run.
