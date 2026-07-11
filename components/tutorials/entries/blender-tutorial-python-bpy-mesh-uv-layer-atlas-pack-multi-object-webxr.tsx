import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        In Blender 4.0 and later, UV coordinates are stored as a{" "}
        <strong>FLOAT2 corner attribute</strong> — one entry per face-loop, not
        per vertex. The classic <code>mesh.uv_layers</code> API is a
        compatibility view of the same data; the attribute path via{" "}
        <code>mesh.attributes[&quot;UVMap&quot;].data</code> is both faster and
        more composable with the geometry-node attribute model. Bulk reads and
        writes through <code>foreach_get / foreach_set</code> bypass Python loop
        overhead with a single C-side <code>memcpy</code>, making it practical
        to reposition thousands of UV islands programmatically. This tutorial
        builds three prop meshes (body cube, pillar cylinder, lantern cap
        sphere), smart-projects each independently via{" "}
        <code>temp_override</code>, then remaps all UV islands into distinct
        quadrants of a shared 0-1 UV tile — the foundation for a
        single-draw-call WebXR asset. The{" "}
        <Link
          href="/tutorials/blender-tutorial-uv-unwrap-low-poly-stylised"
          className={lk}
        >
          low-poly UV unwrap tutorial
        </Link>{" "}
        covers the interactive workflow that this script automates; the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-uv-unwrap-pack-islands-glb"
          className={lk}
        >
          GN UV unwrap + pack islands tutorial
        </Link>{" "}
        shows the geometry-nodes variant for instanced geometry.
      </p>
      <p>
        Outside references:{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.types.MeshUVLoop.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Python API — bpy.types.MeshUVLoop (CC-BY-SA 4.0)
        </a>
        ; sibling projects:{" "}
        <a
          href="https://projects.blender.org/blender/blender"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          projects.blender.org/blender/blender
        </a>
        {" "}and{" "}
        <a
          href="https://developer.blender.org/docs/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          developer.blender.org/docs
        </a>
        .{" "}
        <a
          href="https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Khronos glTF 2.0 Specification — TEXCOORD_n attribute (Apache-2.0)
        </a>
        ; sibling:{" "}
        <a
          href="https://github.com/KhronosGroup/glTF"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/KhronosGroup/glTF
        </a>{" "}
        (MIT-licensed samples and validator).
      </p>
    </>
  );
}

export const entry = buildInstructable(
  {
    steps: [
      {
        title: "Scene setup — three props with Solidify modifier",
        body: `# WHY Solidify before UV unwrap: Solidify adds inner faces and a rim strip
# that smart_project must account for.  Adding it BEFORE UV projection means
# the UVs cover the shell geometry the GLB exporter will actually write.
# Adding it AFTER would leave the inner faces with stacked/default UVs.
#
# vertices=8 for cylinder, ring_count=5 for sphere: low polygon counts keep
# UV islands simple and atlas density reasonable for a prop-set debug pass.

import bpy, math, json, pathlib
import numpy as np

EXPORT_PATH   = pathlib.Path("/tmp/holoflow_uv_atlas.glb")
ATLAS_SIZE    = 512
ISLAND_MARGIN = 0.01
SMART_ANGLE   = 66.0
DRACO         = 6

bpy.ops.wm.read_factory_settings(use_empty=True)

def add_solidify(obj, thickness=0.04, offset=-1.0):
    mod = obj.modifiers.new("Solidify", 'SOLIDIFY')
    mod.thickness       = thickness
    mod.offset          = offset
    mod.use_even_offset = True

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.5))
body = bpy.context.active_object; body.name = "prop_body"
body.scale = (0.5, 0.5, 0.9)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
add_solidify(body, 0.05)

bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.07, depth=0.45, location=(0, 0, 0))
pillar = bpy.context.active_object; pillar.name = "prop_pillar"
add_solidify(pillar, 0.02)

bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=5, radius=0.22, location=(0, 0, 1.1))
cap = bpy.context.active_object; cap.name = "prop_cap"
add_solidify(cap, 0.015)

PROPS = [body, pillar, cap]
print(f"Props created: {[o.name for o in PROPS]}")`,
      },
      {
        title:
          "Smart UV project per object via temp_override (headless-safe)",
        body: `# bpy.ops.uv.smart_project() breaks the mesh into UV islands by surface
# normal change: faces whose normals diverge by more than SMART_ANGLE degrees
# become separate islands.  66° is Blender's default; lower values produce
# more (smaller) islands that unwrap with less stretch but waste more margin.
#
# WHY temp_override with edit_object=obj:
# uv.smart_project polls for an active object in EDIT mode.  Without
# edit_object set in the override context, the operator raises RuntimeError
# in a headless script where no 3-D View context is visible.
#
# scale_to_bounds=True fills the 0-1 UV square with each object's islands
# BEFORE the global quadrant placement step.  This maximises the sampling
# resolution per object within its allocated atlas quadrant.

import bpy, math

SMART_ANGLE   = 66.0
ISLAND_MARGIN = 0.01

for obj in PROPS:
    with bpy.context.temp_override(
        active_object   = obj,
        selected_objects= [obj],
        edit_object     = obj,
    ):
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(
            angle_limit    = math.radians(SMART_ANGLE),
            island_margin  = ISLAND_MARGIN,
            correct_aspect = True,
            scale_to_bounds= True,
        )
        bpy.ops.object.mode_set(mode='OBJECT')
    print(f"  UV projected: {obj.name}")`,
      },
      {
        title:
          "foreach_get — bulk-read UV data from the FLOAT2 corner attribute",
        body: `# In Blender 4.0+, UV maps are stored as generic mesh attributes.
# mesh.attributes contains the same data as mesh.uv_layers but with a
# cleaner API for bulk I/O.
#
# Identifying the UV attribute: look for data_type == 'FLOAT2' AND
# domain == 'CORNER'.  A mesh may have multiple UV maps (e.g. "UVMap" and
# "LightmapUV") — always disambiguate by name for production scripts.
#
# Buffer sizing: len(mesh.loops) gives the CORNER count.  Each loop has
# 2 float components (U, V), so the flat buffer is len(mesh.loops) * 2.
# Using len(mesh.vertices) is a common mistake that produces buffer overflows
# on meshes where vertices are shared by multiple faces.
#
# foreach_get is ~20× faster than a Python list comprehension over
# attr.data because it performs a single C-side memcpy.

import numpy as np

def get_uv_attr(mesh):
    for attr in mesh.attributes:
        if attr.data_type == 'FLOAT2' and attr.domain == 'CORNER':
            return attr
    return None

def read_uvs(mesh):
    attr = get_uv_attr(mesh)
    if attr is None:
        return np.empty((0, 2), dtype=np.float32)
    buf = np.empty(len(mesh.loops) * 2, dtype=np.float32)
    attr.data.foreach_get("vector", buf)
    return buf.reshape(-1, 2)

print("\\n── UV stats after smart_project ──")
for obj in PROPS:
    uvs = read_uvs(obj.data)
    if len(uvs) == 0:
        print(f"  {obj.name}: no UV attribute found")
        continue
    u_range = uvs[:, 0].max() - uvs[:, 0].min()
    v_range = uvs[:, 1].max() - uvs[:, 1].min()
    print(
        f"  {obj.name}: {len(uvs)} loops  "
        f"U {uvs[:,0].min():.3f}–{uvs[:,0].max():.3f}  "
        f"coverage ≈ {u_range * v_range:.2f}"
    )`,
      },
      {
        title:
          "foreach_set — remap UV islands into atlas quadrants (headless-safe atlas pack)",
        body: `# bpy.ops.uv.pack_islands() packs optimally but polls for an open
# SpaceImageEditor — unavailable in headless batch mode.  Manual quadrant
# assignment is deterministic and maps directly onto UDIM tile conventions:
#   UDIM 1001 = U 0–1, V 0–1  (bottom-left  in Blender's Y-up pixel space)
#   UDIM 1002 = U 1–2, V 0–1  (bottom-right)
#   UDIM 1011 = U 0–1, V 1–2  (top-left)
#
# Normalise formula: each object's UVs are first normalised to 0-1 relative
# to their own bounding box (removing the per-object fill from smart_project),
# then scaled to 0.5×0.5 and shifted to the target quadrant origin.
#
# The pad variable preserves the ISLAND_MARGIN between quadrant edges so
# bilinear texture sampling cannot bleed across tile boundaries in WebXR.
#
# foreach_set writes the modified array back in a single C call — modifying
# in-place and calling foreach_set is faster than writing a Python list
# because numpy's ravel() avoids a temporary list allocation when the
# array is already contiguous.  Use .tolist() only at the foreach_set call.

def write_uvs(mesh, uvs):
    attr = get_uv_attr(mesh)
    if attr is None:
        return
    attr.data.foreach_set("vector", uvs.ravel().tolist())

QUADRANT = {
    "prop_body":   (0.0, 0.0),   # BL — red tile
    "prop_pillar": (0.5, 0.0),   # BR — green tile
    "prop_cap":    (0.0, 0.5),   # TL — blue tile
}

for obj in PROPS:
    mesh = obj.data
    uvs  = read_uvs(mesh)
    if len(uvs) == 0:
        continue
    u_min  = uvs[:, 0].min(); v_min  = uvs[:, 1].min()
    u_rng  = max(uvs[:, 0].max() - u_min, 1e-6)
    v_rng  = max(uvs[:, 1].max() - v_min, 1e-6)
    ox, oy = QUADRANT.get(obj.name, (0.0, 0.0))
    pad    = ISLAND_MARGIN * 0.5
    scale  = 0.5 - pad * 2
    uvs[:, 0] = (uvs[:, 0] - u_min) / u_rng * scale + ox + pad
    uvs[:, 1] = (uvs[:, 1] - v_min) / v_rng * scale + oy + pad
    write_uvs(mesh, uvs)
    print(f"  {obj.name}: quadrant ({ox},{oy}) "
          f"→ U {uvs[:,0].min():.3f}–{uvs[:,0].max():.3f}")`,
      },
      {
        title:
          "Build shared atlas material + export single-draw-call GLB",
        body: `# Debug atlas: numpy array ops write quadrant colours in one vectorised pass.
# Blender's pixel row 0 = bottom of image (V = 0 in UV space).
# [:h, :h] covers rows 0..h-1 (V 0..0.5) and columns 0..h-1 (U 0..0.5) — BL.
#
# One material → one GPU material state change per WebXR scene draw.
# Three separate materials would triple the state-change count for this prop set.
#
# tex.interpolation = 'Closest': keeps the debug grid edges sharp so you can
# verify UV placement at a glance.  Switch to 'Linear' for baked atlas textures
# in production to avoid mipmap aliasing on diagonal UV island edges.
#
# export_apply=True: the Solidify modifier is baked into the GLB geometry.
# Without it, the exporter writes the base mesh pre-modifier and the GLB
# will appear hollow in Three.js (no shell thickness, no inner faces).

import bpy
import numpy as np

ATLAS_SIZE = 512
h = ATLAS_SIZE // 2
grid = np.zeros((ATLAS_SIZE, ATLAS_SIZE, 4), dtype=np.float32)
grid[:h, :h] = [0.78, 0.22, 0.22, 1.0]   # BL red   → prop_body
grid[:h, h:] = [0.22, 0.72, 0.22, 1.0]   # BR green → prop_pillar
grid[h:, :h] = [0.22, 0.32, 0.85, 1.0]   # TL blue  → prop_cap
grid[h:, h:] = [0.82, 0.82, 0.82, 1.0]   # TR grey  → unused

atlas_img = bpy.data.images.new("atlas_debug", ATLAS_SIZE, ATLAS_SIZE, alpha=False)
atlas_img.pixels.foreach_set(grid.ravel().tolist())

mat = bpy.data.materials.new("atlas_mat")
mat.use_nodes = True
nt = mat.node_tree; nt.nodes.clear()
out = nt.nodes.new("ShaderNodeOutputMaterial"); out.location = (500, 0)
pe  = nt.nodes.new("ShaderNodeBsdfPrincipled"); pe.location  = (200, 0)
tex = nt.nodes.new("ShaderNodeTexImage");       tex.location = (-100, 150)
uvn = nt.nodes.new("ShaderNodeTexCoord");       uvn.location = (-350, 150)
tex.image = atlas_img; tex.interpolation = 'Closest'
nt.links.new(uvn.outputs["UV"],    tex.inputs["Vector"])
nt.links.new(tex.outputs["Color"], pe.inputs["Base Color"])
nt.links.new(pe.outputs["BSDF"],   out.inputs["Surface"])

for obj in PROPS:
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    obj.select_set(True)

EXPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath              = str(EXPORT_PATH),
    use_selection         = True,
    export_format         = 'GLB',
    export_yup            = True,
    export_apply          = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format   = 'WEBP',
    export_normals        = True,
)

import json, pathlib
size_kb = EXPORT_PATH.stat().st_size / 1024
manifest = {
    "objects":  [o.name for o in PROPS],
    "atlas_px": ATLAS_SIZE,
    "glb_kb":   round(size_kb, 1),
}
EXPORT_PATH.with_suffix(".json").write_text(json.dumps(manifest, indent=2))
print(json.dumps(manifest, indent=2))
print("[holoflow] Atlas GLB complete.")`,
      },
    ],
    troubleshooting: [
      {
        problem:
          "get_uv_attr() returns None — no FLOAT2 corner attribute found after smart_project",
        solution:
          "smart_project creates the UV layer only in EDIT mode and only if the override context includes edit_object. Confirm the temp_override() call passes edit_object=obj (not just active_object). After mode_set(mode='OBJECT'), call `print([a.name for a in obj.data.attributes])` — you should see 'UVMap'. If not, the operator silently skipped the object (e.g. the object had no faces selected at the time of the call — add bpy.ops.mesh.select_all(action='SELECT') before smart_project).",
      },
      {
        problem:
          "foreach_get raises ValueError: array length mismatch",
        solution:
          "The buffer must be exactly len(mesh.loops) * 2 floats for a FLOAT2 corner attribute. Using len(mesh.vertices) * 2 is wrong — vertices are shared across faces, so len(mesh.vertices) < len(mesh.loops) on any real mesh. Always use `buf = np.empty(len(mesh.loops) * 2, dtype=np.float32)`.",
      },
      {
        problem:
          "GLB looks hollow in Three.js — no shell thickness visible",
        solution:
          "The Solidify modifier was not applied before export. Set export_apply=True in the bpy.ops.export_scene.gltf() call. Without it, the exporter writes the base mesh topology (the flat quad/triangle grid) without the solidified shell. Alternatively, apply the modifier in Python before export: bpy.ops.object.modifier_apply(modifier='Solidify') — but export_apply=True is cleaner for library scripts that should not mutate the original blend data.",
      },
      {
        problem:
          "UV islands bleed across quadrant boundaries in WebXR texture sampling",
        solution:
          "Increase the `pad` variable in the quadrant placement step. The formula `pad = ISLAND_MARGIN * 0.5` gives a half-margin inset from each quadrant edge. If bilinear sampling at the boundary still picks up colour from the adjacent quadrant, increase to `pad = 0.015` and rebuild the atlas. Alternatively, switch from bilinear (`Linear`) to `Closest` interpolation on the ImageTexture node — correct for pixel-art / cel-shaded atlases, undesirable for photorealistic bakes.",
      },
    ],
    outsideSources: [
      {
        title: "Blender Python API — bpy.types.MeshUVLoop (CC-BY-SA 4.0)",
        author: "Blender Foundation",
        licence: "CC-BY-SA-4.0",
        url: "https://docs.blender.org/api/current/bpy.types.MeshUVLoop.html",
        relatedProjects: [
          "https://projects.blender.org/blender/blender",
          "https://developer.blender.org/docs/",
        ],
      },
      {
        title:
          "Khronos glTF 2.0 Specification — TEXCOORD_n attribute (Apache-2.0)",
        author: "Khronos Group",
        licence: "Apache-2.0",
        url: "https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html",
        relatedProjects: [
          "https://github.com/KhronosGroup/glTF",
          "https://github.com/KhronosGroup/glTF-Sample-Assets",
        ],
      },
    ],
  },
  {
    slug: "python-bpy-mesh-uv-layer-atlas-pack-multi-object-webxr",
    title:
      "Python bpy.types.MeshUVLoop — UV Layer Authoring, Island Pack & Multi-Object Atlas GLB for WebXR (Blender 5.1)",
    description:
      "Script the full UV atlas pipeline in Blender 5.1: smart-project each object via temp_override, bulk-read and bulk-write UV coordinates with foreach_get/foreach_set on the FLOAT2 corner attribute, remap islands into per-object quadrants for a shared 0-1 tile, and export a single-draw-call GLB for WebXR.",
    date: "2026-07-11",
    image: null,
    body: <Body />,
    tags: [
      "blender",
      "python",
      "scripting",
      "uv",
      "uv-atlas",
      "texture-atlas",
      "meshuv",
      "foreach-get",
      "foreach-set",
      "webxr",
      "glb",
      "draw-call",
      "texture",
    ],
  }
);
