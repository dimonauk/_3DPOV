# Screen Recording Notes — Parametric Bead Necklace

Capture the full Blender session that builds the bead necklace using
Geometry Nodes.  The resulting `screen.mp4` becomes the tutorial video.

## Software

- **OBS Studio** (Windows/macOS/Linux) or Windows Game Bar (`Win+G`)
- Blender 5.1

## OBS settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Base resolution | 1920 × 1080 |
| Output resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off (no mic input for this capture) |
| Format | MP4 |
| Output path | `public/library/videos/geometry-nodes/gn-curve-to-points-bead-necklace-instance-align/screen.mp4` |

## Session flow to record

1. Open a fresh Blender 5.1 scene (factory defaults).
2. Delete the default cube.
3. `Shift+A` → Curve → Bezier Circle, set Radius = 1 m.
4. Rotate X 90° so the circle stands vertically.
5. Add Geometry Nodes modifier; create new node tree.
6. Walk through each node group explained in the tutorial:
   - ResampleCurve + CurveToPoints (COUNT=40) — bead branch
   - MeshUVSphere (8×6) as instance template
   - AlignEulerToVector (axis=Y, pivot=Z) ← Tangent
   - FunctionNodeRandomValue (0.75–1.25) → CombineXYZ → Scale
   - InstanceOnPoints → SetMaterial(Pearl) → RealizeInstances
   - Parallel branch: ResampleCurve + CurveToMesh + circle profile
   - JoinGeometry merging both branches
7. Adjust Bead Count slider 4→200→40 to show real-time response.
8. Open Shader Editor, demonstrate the Pearl material coat layer.
9. `File → Export → glTF 2.0`, enable Apply Modifiers + Draco 6.
10. Drop the GLB into Khronos viewer to show WebXR result.

## Estimated duration

15–20 minutes of raw footage; expected edited tutorial: 8–12 minutes.

## Tips

- Use the N-panel socket panel to show slider min/max values.
- Zoom into the Geometry Nodes editor when adding each node group.
- Hover the mouse over sockets to show the data-type tooltip.
- After AlignEulerToVector: swap the bead template to a cylinder
  (briefly) to show that the hole axis tracks the string — this is the
  visual proof of why the alignment node exists.
