# Screen Recording Notes — GN Curve Spiral Helical Spring

Target file: `public/library/videos/geometry-nodes/gn-curve-spiral-helical-spring-webxr/screen.mp4`

---

## OBS / Xbox Game Bar settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (no narration track required) |
| Output format | MP4 (H.264) |

---

## What to record

1. **Open Blender 5.1.** New General file.
2. **Delete the default cube** (X → Delete).
3. **Add → Mesh → Plane** (or any small mesh as the host object).
4. **Properties → Modifier → Add Modifier → Geometry Nodes.** Click New.
5. **In the GN editor**, Add → Curve → Primitives → **Spiral**. Show the six parameter
   sockets: Rotations, Start Radius, End Radius, Height, Resolution, Reverse.
6. **Adjust Rotations** to 8, Height to 4 — show the helix appear in the viewport.
7. **Add → Curve → Primitives → Circle.** Set Radius to 0.12.
8. **Add → Curve → Curve to Mesh.** Connect Spiral.Curve → CurveToMesh.Curve and
   Circle.Curve → CurveToMesh.Profile Curve. Show the solid wire spring.
9. **Enable Fill Caps** — tick the socket. Show the closed wire ends.
10. **Add → Geometry → Set Shade Smooth.** Set Shade Smooth = True. Show the round wire.
11. **Change End Radius** to 0.4 — show the spring taper into a volute/conical form.
    Change back to 1.0 for the final export.
12. **File → Export → glTF 2.0 (.glb)** — tick "Apply Modifiers", enable Draco
    compression at level 6. Export as `spring_coil.glb`.

Pause the recording after the export dialogue confirms success.

---

## Post-processing

- Trim to remove any pauses longer than 3 seconds.
- No colour correction needed — the raw Blender viewport is the output.
- Rename output to `screen.mp4` and place in the videos directory above.
