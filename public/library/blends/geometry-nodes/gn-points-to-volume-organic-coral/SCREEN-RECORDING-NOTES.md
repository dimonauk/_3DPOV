# Screen Recording Notes — GN Points to Volume + Volume to Mesh

Target file: `public/library/videos/geometry-nodes/gn-points-to-volume-organic-coral/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (no mic, no system audio) |
| Output format | MP4 (H.264, CRF 22) |

## What to record

### Section 1 — New file and base object (≈ 45 s)

1. File → New → General. Delete the default cube (`X`, Enter).
2. Shift+A → Mesh → Plane. In the N-panel rename the object to `coral_blob`.
3. Add a Material: open Shading workspace, New material, name `coral_mat`.
   Set up the world-space noise → ColorRamp (teal to coral-pink) → Principled BSDF.

### Section 2 — Geometry Nodes modifier (≈ 90 s)

1. Return to Layout workspace. With `coral_blob` selected, go to the Properties
   panel → Modifier (wrench icon) → Add Modifier → Geometry Nodes.
   Click **New** to create a fresh tree. Name it `OrganicCoral`.
2. Open the Geometry Nodes editor. Remove the default Group Input → Group Output
   pass-through link.
3. Add Group Input node; add two Float sockets to the interface:
   `Threshold` (default 0.08, min 0.001, max 2.0) and
   `Adaptivity` (default 0.45, min 0.0, max 1.0).

### Section 3 — Node chain (≈ 120 s)

Build the pipeline left to right. Pause to name each node after adding it:

1. **Mesh IcoSphere** (Shift+A → Mesh → Ico Sphere): Radius=1.0, Subdivisions=1.
2. **Mesh to Points** (Shift+A → Point → Mesh to Points): mode=Vertices.
   Connect IcoSphere.Mesh → Mesh to Points.Mesh.
3. **Points to Volume** (Shift+A → Volume → Points to Volume):
   set Resolution Mode to *Voxel Size*. Set Voxel Size=0.06, Radius=0.32.
   Connect Mesh to Points.Points → Points to Volume.Points.
4. **Volume to Mesh** (Shift+A → Volume → Volume to Mesh):
   set Resolution Mode to *Grid*.
   Connect GroupInput.Threshold → VolumeToMesh.Threshold.
   Connect GroupInput.Adaptivity → VolumeToMesh.Adaptivity.
   Connect Points to Volume.Volume → Volume to Mesh.Volume.
5. **Set Shade Smooth** (Shift+A → Geometry → Set Shade Smooth):
   set Shade Smooth = False (tick off).
   Connect VolumeToMesh.Mesh → SetShadeSmooth.Geometry.
   Connect SetShadeSmooth.Geometry → GroupOutput.Geometry.

### Section 4 — Live parameter demo (≈ 60 s)

1. In the modifier panel, drag **Threshold** from 1.20 down to 0.08 — show
   the coral blob emerging from nothing as the isosurface descends.
2. Drag **Adaptivity** from 0 to 1 — show the faceting increase from smooth
   marching-cubes quads to chunky simplification.
3. Reset to Threshold=0.08, Adaptivity=0.45.

### Section 5 — GLB export (≈ 30 s)

File → Export → glTF 2.0.
Enable *Apply Modifiers*, *Draco Mesh Compression* (Level 6), format=GLB.
Export to `public/library/glbs/geometry-nodes/gn-points-to-volume-organic-coral/organic_coral.glb`.

## Final check before stopping

- Viewport shows the full coral blob at Threshold=0.08, Adaptivity=0.45.
- The Properties → Modifier panel shows both Threshold and Adaptivity sliders.
- The node editor shows the complete 5-node chain: IcoSphere → MeshToPoints →
  PointsToVolume → VolumeToMesh → SetShadeSmooth.
