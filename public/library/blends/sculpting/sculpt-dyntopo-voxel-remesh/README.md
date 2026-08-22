# Sculpt Mode — Dynamic Topology + Voxel Remesh

**Blender 5.1 | Topic: sculpting | Slug: sculpt-dyntopo-voxel-remesh**

Dynamic Topology (Dyntopo) lets Blender triangulate your mesh on-the-fly as
you sculpt, concentrating geometry exactly where the brush is working and
removing it where you smooth out.  Voxel Remesh converts the resulting
triangle soup back to clean quad topology at the end of a session.  Together
they form the fastest path from "blank sphere" to "rig-ready organic form"
without any manual retopology.

---

## Prerequisites

- Blender 5.1 (EEVEE Next renderer)
- A fresh general scene (delete default cube and lamp before starting)
- At least 8 GB RAM — Dyntopo at fine detail settings generates millions of
  triangles and keeps them all in memory

---

## Workflow

### 1. Base mesh

`Shift+A → Mesh → UV Sphere` (32 segments, 24 rings, radius 0.5 m).  Apply
scale immediately: `Ctrl+A → Scale`.  Unapplied scale makes Dyntopo's
"Constant Detail" resolution measure in wrong units.

### 2. Enter Sculpt Mode

`Ctrl+Tab` or header dropdown → **Sculpt Mode**.  The viewport shading
switches to MatCap automatically — leave it there, MatCap is faster than PBR
during sculpting and gives excellent surface reading for bumps and creases.

### 3. Enable Dynamic Topology

Tick **Dyntopo** in the header (top-left of the 3D Viewport in Sculpt Mode).
A confirmation popup warns you the mesh will be triangulated.  Accept.

Configure in the N-panel → **Tool → Dyntopo**:

| Setting | Recommended | Why |
|---|---|---|
| Detailing | SUBDIVIDE_COLLAPSE | adds AND removes tris; prevents topology creep |
| Detail Type | CONSTANT_DETAIL | same pixel density everywhere regardless of brush size |
| Constant Detail | 12 px | fast starting point; drop to 6–8 px for final detail passes |
| Symmetry | X Mirror | tick this before the first stroke |

### 4. Primary brush workflow

Work in passes, coarse to fine.  Do not jump to fine detail on rough forms.

1. **Draw (X)** — pull volume out of the base sphere.  Eye sockets (Ctrl+Draw
   inverts to push in), brow ridge, cheekbones.  Keep strokes long and slow
   for organic flow.
2. **Clay Strips (Shift+C → search "Clay Strips")** — builds flat planes of
   clay; excellent for brow ridge and jawline definition.
3. **Crease (Shift+C → "Crease")** — pinches a sharp line.  Use for eyelid
   seams, nostril edges, lip corners.  Ctrl inverts to a raised ridge.
4. **Inflate (I)** — pushes geometry outward along normals.  Good for lips,
   ear lobes, cartilage.
5. **Smooth (Shift, hold during any brush)** — blend between strokes.  The
   most-used modifier in organic sculpting.

Increase **Strength** (F key) for early passes; reduce it as you approach
final form.  Increase **Radius** (Shift+F) for broad strokes, reduce for detail.

### 5. Mask by Curvature

In the header: **Mask → Mask by Curvature**.  This auto-generates a mask that
protects creases and edges while leaving broad faces editable — useful before
a broad smooth pass so you don't accidentally erode sharp features.

### 6. Voxel Remesh

Once the primary form is finished, exit Sculpt Mode (`Tab`) and go to:
**Properties → Object Data Properties → Remesh**.

Set **Voxel Size** to 0.025 m for a head-scale mesh (roughly 10 000–20 000
quads result).  Tick **Smooth Normals**.  Click **Voxel Remesh**.

The mesh converts from Dyntopo triangles to Marching Cubes quads run through
the Quadriflow algorithm.  The result is not retopology but it is clean enough
for UV unwrapping, armature skinning, and GLB export.

### 7. Post-remesh workflow

After Voxel Remesh:
- Apply **Shade Smooth** (`Right-click → Shade Smooth`)
- Add a **Multires modifier** if you want to bake remaining fine detail to a
  normal map — see the texture baking tutorial linked below
- UV unwrap with Smart UV Project for a quick export — see the UV unwrap
  tutorial linked below
- Export: `File → Export → glTF 2.0 (.glb)`, Enable Draco compression,
  Y-up, Apply Modifiers

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Scene setup + Displace-modifier approximation of sculpted surface + GLB export |
| `record.py` | 90-frame camera orbit render → `videos/sculpting/sculpt-dyntopo-voxel-remesh/viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for capturing the live sculpt session |

Run `blueprint.py` first, then `record.py` in the same file.

---

## Troubleshooting

**Dyntopo checkbox is greyed out** — you are in a Multires modifier sculpt
session.  Dyntopo and Multires are mutually exclusive.  Remove the Multires
modifier before enabling Dyntopo.

**Voxel Remesh produces a sphere** — the mesh has unapplied modifiers that
the remesher cannot see.  Apply all modifiers before running Voxel Remesh.

**Topology explodes after Voxel Remesh** — Voxel Size is too large relative
to thin geometry.  A 0.025 m voxel on a 0.5 m sphere is the right ratio
(1:20).  If your mesh has thin spikes or fins, increase voxel resolution
(smaller number) or sculpt them away first.

**GLB file is too large** — the mesh has too many voxel quads.  Use a larger
Voxel Size (0.04 m instead of 0.025 m) to reduce poly count, or enable Draco
compression (level 6) in the glTF exporter.

---

## Cross-references

- `/tutorials/blender-tutorial-texture-baking-normal-ao` — bake high-poly
  sculpt detail to a normal map on the Voxel-Remeshed low-poly
- `/tutorials/blender-tutorial-armature-weight-paint` — rig and weight-paint
  the remeshed head for animation
- `/tutorials/blender-tutorial-gn-uv-unwrap-pack-islands-glb` — UV unwrap the
  remeshed mesh for GLB export
- `/tutorials/blender-tutorial-eevee-toon-cel-shader` — apply a toon shader to
  the finished sculpt for stylised WebXR presentation
- `/tutorials/blender-tutorial-python-3d-print-mesh-analysis` — check the
  remeshed mesh is watertight before sending to a 3D printer

---

Source: Blender Manual (CC-BY-SA-4.0, Blender Foundation)
https://docs.blender.org/manual/en/latest/sculpt_paint/sculpting/
