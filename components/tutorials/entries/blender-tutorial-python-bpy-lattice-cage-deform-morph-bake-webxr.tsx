import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A Lattice is a volumetric cage deformer. Blender evaluates each mesh
        vertex&apos;s position inside the cage using trilinear or tricubic
        interpolation of control-point displacements, then writes the result
        through the modifier stack without touching the underlying mesh data.
        This indirection is the key insight: swapping{" "}
        <code>mod.object</code> to a different lattice object replaces the
        entire deformation without duplicating mesh topology. For shape-variant
        generation at scale — producing ten slightly different versions of the
        same prop — this is far cheaper than ten shape keys or ten GN modifier
        stacks. For WebXR delivery the lattice modifier must be applied (baked)
        before GLB export, since the GLTF format has no lattice primitive;
        <Link
          href="/tutorials/blender-tutorial-python-modifier-stack-pre-export-apply"
          className={lk}
        >
          {" "}the modifier-stack apply tutorial{" "}
        </Link>
        covers the full apply-and-export pipeline.
      </p>
      <p>
        The Python surface lives at <code>bpy.data.lattices.new(name)</code>,
        which returns a <code>bpy.types.Lattice</code> data block. Resolution is
        set via <code>points_u</code>, <code>points_v</code>,{" "}
        <code>points_w</code> — you must set these <em>before</em> first
        accessing <code>lattice.points</code>, because resizing the array
        afterwards resets all <code>co_deform</code> values to the rest-grid
        positions. Each control point exposes two Vector attributes:{" "}
        <code>.co</code> (rest-grid position, read-only after creation) and{" "}
        <code>.co_deform</code> (deformed position, writable). The flat{" "}
        <code>points</code> sequence is indexed row-major:{" "}
        <code>idx = u + v&nbsp;*&nbsp;U + w&nbsp;*&nbsp;U&nbsp;*&nbsp;V</code>.
        Forget the formula and every manual point lookup silently produces
        incorrect vertex positions. Interpolation between cage points is
        controlled per-axis by <code>interpolation_type_u/v/w</code>;{" "}
        <code>&apos;KEY_LINEAR&apos;</code> (C0 linear blend) is the correct
        default for production bakes because <code>&apos;BSPLINE&apos;</code>{" "}
        can inflate the cage boundaries beyond the intended deformation
        envelope.
      </p>
      <p>
        The deformation vertex group on the mesh (
        <code>mod.vertex_group = &quot;PinMask&quot;</code>) lets you limit
        cage influence to a named subset of vertices, which is how you protect
        attachment points (seams, sockets) from deforming while a lattice
        reshapes the body of an object. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-vertex-group-weight-assign-vrm-deform-envelope"
          className={lk}
        >
          vertex group tutorial
        </Link>{" "}
        explains how to author those masks in Python. After baking,{" "}
        <code>temp_override()</code> is required for the{" "}
        <code>modifier_apply</code> operator call — headless context is absent
        a proper area/region stack; the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-context-temp-override-ops-headless-scripting"
          className={lk}
        >
          context override tutorial
        </Link>{" "}
        explains why. Custom split normals set before the apply step are
        preserved through the bake (see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mesh-custom-split-normals-smooth-island-faceted-webxr"
          className={lk}
        >
          custom normals tutorial
        </Link>
        ), so a pre-bake normal-assignment pass is safe. Outside reference:{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.Lattice.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.Lattice API (Blender Foundation, CC-BY-SA-4.0)
        </a>
        ; sibling:{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.LatticePoint.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.LatticePoint
        </a>
        . Lattice modifier manual:{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/lattice.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Lattice Modifier (Blender Foundation, CC-BY-SA-4.0)
        </a>
        ; sibling:{" "}
        <a
          href="https://projects.blender.org/blender/blender"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          projects.blender.org/blender/blender
        </a>
        .
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    supplies: { materials: [], tools: [] },
    steps: [
      {
        title: "Clean scene and build a subdivided column mesh",
        body: `"""
32×32 grid plane extruded 0.5 m in Z — gives the cage interior geometry to
push on all sides, not just the top face.

create_grid() centres at world origin, [−0.5, +0.5] XY, Z=0.
extrude_face_region() returns all new geometry; we filter to BMVerts only
because the geom list also includes edges and faces.
translate() lifts those verts to Z=0.5, filling the interior with loop rings.
"""
import bpy, bmesh
from mathutils import Vector
import math

MESH_NAME   = "holoflow_lattice_base"
LAT_NAME    = "holoflow_lattice_cage"
GLB_PATH    = "//holoflow_lattice_baked.glb"
GRID_SEGS   = 32
LAT_U, LAT_V, LAT_W = 4, 4, 3
PINCH_SCALE = 0.35
WAVE_FREQ   = 2.0
WAVE_AMP    = 0.28
DRACO_LVL   = 6

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.name = "holoflow_lattice"

me = bpy.data.meshes.new(MESH_NAME)
ob = bpy.data.objects.new(MESH_NAME, me)
sc.collection.objects.link(ob)

bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=GRID_SEGS, y_segments=GRID_SEGS,
                      size=0.5, calc_uvs=True)
res = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
top = [e for e in res["geom"] if isinstance(e, bmesh.types.BMVert)]
bmesh.ops.translate(bm, verts=top, vec=Vector((0, 0, 0.5)))
bm.to_mesh(me); bm.free(); me.update()
print(f"[holoflow] mesh — {len(me.vertices)} verts")`,
      },
      {
        title: "Create a 4×4×3 Lattice with KEY_LINEAR interpolation",
        body: `"""
Lattice data block + object wrapper.  Resolution must be set before first
access to lat.points — resizing afterwards resets co_deform to rest-grid.

interpolation_type_* options:
  KEY_LINEAR — linear (C0); correct for WebXR bakes; no overshoot
  CARDINAL   — Catmull-Rom (C1); smooth; can overshoot on large displacements
  BSPLINE    — B-spline (C2); very smooth; attenuates and inflates cage edges

Object scale/location override the internal [−0.5, +0.5]³ unit cube so the
cage encloses the mesh at Z=[0, 0.5] with a small margin on all sides.
"""
lat    = bpy.data.lattices.new(LAT_NAME)
lat_ob = bpy.data.objects.new(LAT_NAME, lat)
sc.collection.objects.link(lat_ob)

lat.points_u, lat.points_v, lat.points_w = LAT_U, LAT_V, LAT_W
lat.interpolation_type_u = lat.interpolation_type_v = lat.interpolation_type_w = 'KEY_LINEAR'

lat_ob.scale    = Vector((1.04, 1.04, 0.56))
lat_ob.location = Vector((0.0, 0.0, 0.25))

print(f"[holoflow] lattice — {len(lat.points)} pts ({LAT_U}×{LAT_V}×{LAT_W})")`,
      },
      {
        title: "Deform control points — radial wave + inward pinch",
        body: `"""
Index formula (row-major, 0-based):
    idx = u + v * U + w * U * V

.co        — rest-grid position; read-only; marks where the point WOULD be
             in an undeformed cage
.co_deform — deformed position; writable; Blender computes per-vertex
             displacement as (co_deform − co) blended via the interpolation
             kernel

Top layer (w == W-1):
  Radial sine wave on Z — a crown-like wave across the top face.
  XY pinch toward centre — tapers the mesh like a vase neck.

Mid layer (0 < w < W-1):
  Gentle outward bulge on XY only so the side walls stay plump through the
  cage transition; without this the cage produces a visible waist crease.
"""
U, V, W = LAT_U, LAT_V, LAT_W
pts = lat.points

for w in range(W):
    t_w = w / (W - 1)
    for v in range(V):
        for u in range(U):
            idx = u + v * U + w * U * V
            pt  = pts[idx]
            lx  = (u / (U - 1)) - 0.5
            ly  = (v / (V - 1)) - 0.5
            r   = math.sqrt(lx*lx + ly*ly)

            if w == W - 1:
                dz    = math.sin(r * math.pi * WAVE_FREQ * 2.0) * WAVE_AMP
                scale = 1.0 - PINCH_SCALE * (1.0 - math.cos(r * math.pi))
                pt.co_deform.x = lx * scale
                pt.co_deform.y = ly * scale
                pt.co_deform.z = 0.5 + dz
            elif w > 0:
                bulge = 1.0 + 0.07 * math.sin(t_w * math.pi)
                pt.co_deform.x = lx * bulge
                pt.co_deform.y = ly * bulge

print("[holoflow] control points deformed")`,
      },
      {
        title: "Add LATTICE modifier and bake via modifier_apply",
        body: `"""
mod.object must be the lattice Object — the data block (bpy.data.lattices[…])
is silently ignored; no error is raised but the mesh deforms as if no lattice
is present.

modifier_apply() polls for an OBJECT mode, active, viewport-visible object.
temp_override() satisfies the poll headlessly.

After apply the mesh data holds baked vertex positions; the lattice object can
be deleted.  export_apply=False in the GLB export step is therefore correct —
double-applying an already-applied modifier would raise RuntimeError.
"""
sc.view_layer.objects.active = ob
ob.select_set(True)

mod        = ob.modifiers.new(name="Lattice", type='LATTICE')
mod.object = lat_ob   # ← Object, not data block

bpy.context.view_layer.update()   # force depsgraph eval before apply

with bpy.context.temp_override(
    active_object=ob,
    selected_objects=[ob],
    object=ob,
):
    bpy.ops.object.modifier_apply(modifier=mod.name)

print("[holoflow] modifier applied — vertex positions baked")`,
      },
      {
        title: "Assign metallic material and export GLB",
        body: `"""
Low roughness + high metallic so specular highlights reveal the wave
curvature of the deformed surface clearly in a single viewport shot.

Only the mesh object is selected for export; the lattice cage is excluded
by deselecting all objects first then reselecting the mesh.

Draco level 6 is the studio default — optimal for smooth deformed meshes
that have no hard edges or sharp attribute boundaries.
"""
mat = bpy.data.materials.new("holoflow_lattice_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.06, 0.22, 0.70, 1.0)
bsdf.inputs["Metallic"].default_value   = 0.82
bsdf.inputs["Roughness"].default_value  = 0.10
ob.data.materials.append(mat)

for o in sc.collection.objects:
    o.select_set(False)
ob.select_set(True)
sc.view_layer.objects.active = ob

with bpy.context.temp_override(active_object=ob, selected_objects=[ob]):
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        use_selection=True,
        export_apply=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=DRACO_LVL,
        export_image_format='WEBP',
        export_yup=True,
    )
print(f"[holoflow] GLB exported → {GLB_PATH}")`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-bpy-lattice-cage-deform-morph-bake-webxr",
    title:
      "Python bpy.types.Lattice — Cage Deformer: Control Point Scripting, Cage Morphing & Pre-Export Bake for WebXR (Blender 5.1)",
    description:
      "Script a 4×4×3 Lattice cage in Blender 5.1 Python: set resolution, write co_deform per-point with the row-major index formula, apply the LATTICE modifier, and export a Draco-compressed GLB for WebXR.",
    topic: "scripting",
    tags: [
      "blender",
      "python",
      "lattice",
      "bpy",
      "deformer",
      "cage",
      "webxr",
      "glb",
      "modifier",
      "scripting",
    ],
    date: "2026-07-12",
    body: <Body />,
  }
);
