# Screen Recording Notes — GN Subdivide Mesh Adaptive LOD
## Blender 5.1 | OBS / Windows Game Bar

**Window source**: Blender 5.1 (windowed, 1920×1080)
**Resolution**: 1920×1080 | **Frame rate**: 30 fps | **Audio**: OFF

---

## Takes

### Take 1 — Wireframe contrast (≈ 30 s)
1. Run `blueprint.py`. Terrain appears in viewport.
2. In the 3D Viewport header: Viewport Shading → **Solid**, then enable
   **Wireframe Overlay** (Viewport Overlays dropdown → Wireframe, Amount 1.0).
3. Orbit slowly around the terrain (middle-mouse drag).
4. Point out dense-patch regions (brown, fine wireframe grid) vs coarse regions
   (green, sparse quad grid). Pause on the boundary.
5. Switch to **Material Preview** shading — colours confirm the material split.

### Take 2 — Threshold slider live (≈ 40 s)
1. Select `adaptive_terrain`. Properties panel → Modifier Properties →
   AdaptiveLOD modifier → **Open in Node Editor** (or switch to Geometry Nodes
   workspace).
2. Find the **Compare** node. Drag the **B** (threshold) input from 0.0 → 1.0
   while watching the viewport.
3. At 0.0: entire terrain is subdivided dense. At 1.0: no faces subdivide.
   Sweet spot ≈ 0.55 (the default).
4. Demonstrate that the FACE count in the status bar (bottom-left of viewport)
   changes as threshold moves — confirm adaptive LOD is live.

### Take 3 — Animation playback (≈ 20 s)
1. Set timeline to frame 1. Press **Space** to play.
2. The threshold is keyframed 0.2 → 0.8 → 0.2 over 120 frames. Dense patches
   bloom outward then contract. Keep wireframe overlay ON so the viewer sees the
   topology changing.
3. Stop at frame 60 (maximum density). Zoom in on a patch boundary to show
   Catmull-Clark style subdivided quads vs coarse quads meeting cleanly.

---

## Save
- Save to: `public/library/videos/geometry-nodes/gn-subdivide-mesh-adaptive-noise-lod/screen.mp4`
- Encode: H.264, CRF 23, yuv420p (Windows Game Bar output — re-encode if needed).
