import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A Vertex Animation Texture (VAT) collapses an entire physics simulation
        into two flat images: one for per-vertex positions, one for normals.
        Each row of the image is one frame of animation; each column is one
        vertex. At runtime the WebXR shader samples the texture instead of
        reading from a joint-matrix uniform array, which means the mesh topology
        is completely static in the GLB — no skeleton, no morph targets, no
        blend weights. This suits cloth, ribbons, flags, and secondary jiggle
        where the motion is authored in simulation rather than animation curves.
        The technique is format-agnostic: the same EXR pair drives a Three.js
        custom ShaderMaterial, a Babylon.js custom vertex shader, or a raw WebGL
        draw call with equal ease. The{" "}
        <Link
          href="/tutorials/blender-tutorial-shape-keys-morph-targets"
          className={lk}
        >
          shape keys tutorial
        </Link>{" "}
        covers the alternative morph-target path, which suits facial expressions
        but scales poorly beyond ~60 discrete shapes.
      </p>
      <p>
        The Python pipeline has five stages. First, a pinned-cloth grid is built
        via bmesh and given a <code>VAT_ID</code> UV channel that stores the
        vertex index as a normalised U coordinate — this survives GLB export and
        tells the shader which column to fetch regardless of how the exporter
        re-orders the index buffer. Second, a cloth modifier with a wind force
        is configured. Third, <code>scene.frame_set()</code> steps the
        simulation one frame at a time while{" "}
        <code>ob.evaluated_get(depsgraph)</code> captures the deformed vertex
        positions and normals; see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export"
          className={lk}
        >
          depsgraph tutorial
        </Link>{" "}
        for the evaluation model. Fourth, positions are normalised against a
        global bounding box and packed into 32-bit float EXR images via{" "}
        <code>bpy.data.images.new(float_buffer=True)</code> — the same image
        API demonstrated in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-image-pixel-buffer-sdf-texture-atlas-webxr"
          className={lk}
        >
          SDF texture atlas tutorial
        </Link>
        . Fifth, a <code>vat_meta.json</code> carries the bounding box for
        shader-side decode, and the rest-pose GLB is exported with{" "}
        <code>export_apply=False</code> so the VAT_ID UV layer is preserved.
        Outside reference:{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.ClothModifier.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.ClothModifier (Blender Foundation, CC-BY-SA 4.0)
        </a>
        ; sibling:{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.ClothSettings.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.ClothSettings
        </a>
        . VAT technique reference:{" "}
        <a
          href="https://www.sidefx.com/docs/houdini/nodes/out/rop_vertex_animation_textures.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          SideFX Vertex Animation Textures (public-domain technique)
        </a>
        ; sibling:{" "}
        <a
          href="https://github.com/sidefx/houdini-labs"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          houdini-labs (BSD)
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
        title: "Build the flag mesh and encode vertex indices as a UV channel",
        body: `"""
bmesh.ops.scale() expands the unit grid to FLAG_W × FLAG_H before writing
to the mesh, so the object keeps an identity transform.  Object-space
coordinates then equal world-space, which simplifies the capture loop and
the shader — no model matrix needed to decode position.

The VAT_ID UV layer stores u = vertex_index / (VAT_WIDTH - 1) per loop.
Encoding the index into UV rather than a custom attribute is intentional:
the standard glTF TEXCOORD_N accessor travels to every WebXR runtime
without special handling, whereas custom integer attributes require
KHR_mesh_quantization or a custom accessor and are ignored by most loaders.
"""
import bpy, bmesh, json, math
from mathutils import Matrix, Vector

CLOTH_NAME  = "ClothFlag"
VAT_FRAMES  = 48
FRAME_START = 1
GRID_X, GRID_Y = 12, 8   # 13 × 9 = 117 vertices → VAT_WIDTH = 128
FLAG_W, FLAG_H  = 1.0, 0.6
WIND_STR, WIND_NOISE = 3.5, 0.4
DRACO_LVL   = 6
OUT         = "//"

def _pow2(n):
    p = 1
    while p < n: p <<= 1
    return p

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.frame_start = FRAME_START
sc.frame_end   = FRAME_START + VAT_FRAMES - 1

me = bpy.data.meshes.new(CLOTH_NAME)
cloth_ob = bpy.data.objects.new(CLOTH_NAME, me)
sc.collection.objects.link(cloth_ob)
sc.view_layer.objects.active = cloth_ob

bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=GRID_X, y_segments=GRID_Y, size=0.5)
bmesh.ops.scale(bm, vec=Vector((FLAG_W, FLAG_H, 1.0)),
                space=Matrix.Identity(4), verts=bm.verts)
bm.to_mesh(me); bm.free()
n_verts   = len(me.vertices)
VAT_WIDTH = _pow2(n_verts)
print(f"[vat] vertices={n_verts}  texture={VAT_WIDTH}×{VAT_FRAMES}")

uv_layer = me.uv_layers.new(name="VAT_ID")
for poly in me.polygons:
    for li in poly.loop_indices:
        vi = me.loops[li].vertex_index
        uv_layer.data[li].uv = (vi / max(VAT_WIDTH - 1, 1), 0.0)`,
      },
      {
        title: "Pin the top edge and configure the cloth modifier",
        body: `"""
vertex_group_mass must name an existing vertex group on the same object.
Blender treats vertices in this group as having infinite mass — they do
not respond to forces or collision but anchor the draped cloth.  Setting
weight = 1.0 means fully pinned; 0.5 would allow partial pull-through,
useful for stretchy fabric but wrong for a rigid flagpole attachment.

ClothSettings parameters worth tuning for export quality:
  tension_stiffness    — resistance to stretching (cotton ≈ 15, silk ≈ 5)
  bending_stiffness    — resistance to folding   (cotton ≈ 0.5, leather ≈ 80)
  mass                 — per-vertex mass in kg;  lighter cloth billows more
  air_damping          — drag coefficient; increase to damp oscillation

The point_cache frame range should match sc.frame_start/frame_end so the
depsgraph evaluator never tries to interpolate outside the baked range.
"""
pin_vg  = cloth_ob.vertex_groups.new(name="Pin")
top_y   = max(v.co.y for v in me.vertices)
pin_ids = [v.index for v in me.vertices if abs(v.co.y - top_y) < 1e-4]
pin_vg.add(pin_ids, 1.0, 'REPLACE')
print(f"[vat] pinned {len(pin_ids)} vertices at y={top_y:.4f}")

cloth_mod = cloth_ob.modifiers.new("Cloth", 'CLOTH')
cs = cloth_mod.settings
cs.vertex_group_mass     = "Pin"
cs.mass                  = 0.30
cs.tension_stiffness     = 15.0
cs.compression_stiffness = 15.0
cs.shear_stiffness       = 5.0
cs.bending_stiffness     = 0.5
cs.air_damping           = 1.0
cloth_mod.collision_settings.use_self_collision = False
pc = cloth_mod.point_cache
pc.frame_start = FRAME_START
pc.frame_end   = FRAME_START + VAT_FRAMES - 1

with bpy.context.temp_override(scene=sc, view_layer=sc.view_layer):
    bpy.ops.object.effector_add(type='WIND', location=(0.6, -0.4, 0.3))
wind_ob = sc.view_layer.objects.active
wind_ob.rotation_euler = (math.radians(75), 0.0, math.radians(-15))
wind_ob.field.strength = WIND_STR
wind_ob.field.noise    = WIND_NOISE`,
      },
      {
        title: "Step the simulation frame-by-frame and capture vertex data",
        body: `"""
frame_set() drives the cloth integrator one step forward through Blender's
dependency graph.  Jumping to frame 48 directly without stepping through
each preceding frame produces rest-pose geometry because the solver has not
integrated the intermediate states into the point cache.

ob.evaluated_get(dg) returns a temporary evaluated object whose lifetime
lasts until the next depsgraph evaluation.  to_mesh() snapshots it into a
plain Mesh; to_mesh_clear() must be called to release that snapshot — not
calling it leaks memory per frame, which becomes ~100 MB for a 48-frame
capture of a moderate-density cloth.

We capture in object space (v.co) rather than world space because the object
has an identity transform.  For objects with non-identity scale or rotation,
multiply by cloth_ob.matrix_world to get true world positions.
"""
pos_data = []
nrm_data = []

for fi in range(VAT_FRAMES):
    sc.frame_set(FRAME_START + fi)
    dg       = bpy.context.evaluated_depsgraph_get()
    ob_eval  = cloth_ob.evaluated_get(dg)
    me_eval  = ob_eval.to_mesh()

    pos_row = [0.0] * (VAT_WIDTH * 4)
    nrm_row = [0.0] * (VAT_WIDTH * 4)
    for vi, v in enumerate(me_eval.vertices):
        co, n = v.co, v.normal
        i4 = vi * 4
        pos_row[i4:i4+4] = [co.x, co.y, co.z, 1.0]
        nrm_row[i4:i4+4] = [(n.x+1)*0.5, (n.y+1)*0.5, (n.z+1)*0.5, 1.0]

    pos_data.append(pos_row)
    nrm_data.append(nrm_row)
    ob_eval.to_mesh_clear()`,
      },
      {
        title: "Normalise positions by global bounding box",
        body: `"""
A per-frame local bbox would require the shader to sample a second 'range'
texture per frame, doubling texture lookups.  A single global bbox is
computed once across all frames; the shader multiplies by the constant
range uniform uBBoxSize and adds uBBoxMin.  The cost is a slightly wider
range (lower precision density) in frames where the cloth is near rest,
but for 32-bit float textures this is irrelevant — sub-micron precision
at any cloth size.

Guard with 'or 1e-6' on each axis to handle perfectly flat geometry (e.g.
a vertical flag has near-zero Z displacement in some wind conditions).
"""
all_x = [pos_data[f][vi*4]   for f in range(VAT_FRAMES) for vi in range(n_verts)]
all_y = [pos_data[f][vi*4+1] for f in range(VAT_FRAMES) for vi in range(n_verts)]
all_z = [pos_data[f][vi*4+2] for f in range(VAT_FRAMES) for vi in range(n_verts)]
bmin  = (min(all_x), min(all_y), min(all_z))
bmax  = (max(all_x), max(all_y), max(all_z))
bsz   = tuple((bmax[i] - bmin[i]) or 1e-6 for i in range(3))

for f in range(VAT_FRAMES):
    for vi in range(n_verts):
        i4 = vi * 4
        pos_data[f][i4]   = (pos_data[f][i4]   - bmin[0]) / bsz[0]
        pos_data[f][i4+1] = (pos_data[f][i4+1] - bmin[1]) / bsz[1]
        pos_data[f][i4+2] = (pos_data[f][i4+2] - bmin[2]) / bsz[2]`,
      },
      {
        title: "Pack EXR images and write metadata JSON",
        body: `"""
float_buffer=True creates a 32-bit RGBA image.  Saving with file_format
'OPEN_EXR' preserves all 32 bits — saving as PNG would silently quantise
to 8 bits (256 steps) and produce visible stepping artefacts in position
data at any camera distance under 5 m.

is_data=True disables sRGB gamma correction on load, which would corrupt
the linear position values.  Always set is_data=True for data textures.

The pixel array is flat [r0,g0,b0,a0, r1,g1,b1,a1, ...] in row-major
order where row 0 is the BOTTOM of the image.  Our capture fills row 0
with frame 0 (the first simulation frame), so UV.y = 0.0 samples frame 0
in the WebXR shader — consistent with the standard bottom-up convention.
"""
for img_name, data, fname in (
    ("vat_position", pos_data, "vat_position.exr"),
    ("vat_normal",   nrm_data, "vat_normal.exr"),
):
    img = bpy.data.images.new(
        img_name, width=VAT_WIDTH, height=VAT_FRAMES,
        float_buffer=True, is_data=True, alpha=False
    )
    flat = []
    for row in data:
        flat.extend(row)
    img.pixels[:] = flat
    img.filepath_raw = OUT + fname
    img.file_format  = "OPEN_EXR"
    img.save()
    print(f"[vat] {fname}  {VAT_WIDTH}×{VAT_FRAMES}")

meta = {
    "vat_frames":   VAT_FRAMES, "vat_width":  VAT_WIDTH,
    "n_verts":      n_verts,    "frame_start": FRAME_START,
    "bbox_min":     list(bmin), "bbox_max":    list(bmax),
    "position_tex": "vat_position.exr", "normal_tex": "vat_normal.exr",
    "rest_mesh_glb":"cloth_flag_rest.glb",
}
with open(bpy.path.abspath(OUT + "vat_meta.json"), "w") as fh:
    json.dump(meta, fh, indent=2)`,
      },
      {
        title: "Export rest-pose GLB and save the .blend",
        body: `"""
export_apply=False exports the BASE mesh data before any modifier result.
This is what we want: the rest-pose flat flag topology where vertex indices
correspond exactly to the VAT columns.  export_apply=True would bake the
cloth modifier output at the current frame — correct geometry, but the
index ordering is not guaranteed to match the pre-modifier indices captured
during the simulation loop.

The VAT_ID UV layer is included automatically via the default export_uvs=True.
The exporter writes it as TEXCOORD_1 in the GLB primitive; the WebXR shader
binds it to attribute aVatId.  No custom attribute extension is needed.

Troubleshooting: if the cloth looks correct in Blender but the WebXR playback
shows vertices staying at rest position, verify that (a) VAT_ID UV is present
in the GLB primitive (open in gltf.report or Khronos glTF viewer), and (b)
the shader samples TEXCOORD_1 not TEXCOORD_0 (the standard UV map).
"""
cloth_ob.select_set(True)
with bpy.context.temp_override(scene=sc, view_layer=sc.view_layer):
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUT + "cloth_flag_rest.glb"),
        export_format="GLB",
        export_apply=False,
        export_image_format="WEBP",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=DRACO_LVL,
        export_yup=True,
        export_normals=True,
        use_selection=True,
    )
bpy.ops.wm.save_as_mainfile(
    filepath=bpy.path.abspath(OUT + "cloth_vat.blend")
)
print("[vat] done — cloth_flag_rest.glb  vat_position.exr  vat_normal.exr")`,
      },
    ],
  },
  {
    slug: "python-cloth-modifier-sim-bake-vertex-animation-texture-webxr",
    title:
      "Python ClothModifier → Vertex Animation Texture: Simulation Bake & VAT Export for WebXR (Blender 5.1)",
    description:
      "Script a pinned-cloth simulation, capture per-frame vertex positions and normals via the Depsgraph API, pack into 32-bit float EXR images, and export a rest-pose GLB with a VAT_ID UV channel for skeleton-free WebXR playback.",
    image: null,
    body: <Body />,
    tags: ["blender", "python", "scripting", "cloth", "vat", "webxr", "simulation"],
  }
);
