"""
Python: Batch GLB Scene Exporter — Collection-per-GLB Pipeline
Blender 5.1  ·  CC0  ·  Holoflow Studio

Every top-level collection whose name starts with EXPORT_PREFIX is exported
as a separate Draco-compressed GLB.  A JSON manifest is written to OUTPUT_DIR
on completion.  The demo scene builds three HF_EXPORT_ collections so you can
run this script immediately in a clean Blender session.

Core mechanism:
  bpy.context.view_layer.active_layer_collection = lc
  bpy.ops.export_scene.gltf(use_active_collection=True, export_apply=True, ...)

Why use_active_collection rather than use_selection:
  Selecting objects puts them into the scene-level selection state, which
  persists across operators and can bleed into other ops.  The active
  collection flag is stateless from the perspective of other tools — Blender
  isolates the export via the view-layer context, not the selection buffer.

Why export_apply=True:
  Blender's glTF exporter with export_apply=True evaluates the full
  dependency graph (modifiers, transforms, shape keys at rest) before
  building the mesh for export.  This is the equivalent of
  bpy.ops.object.convert(target='MESH') but without mutating the source data.

Outside sources
  Blender Manual — glTF 2.0 Exporter  CC-BY-SA 4.0  Blender Foundation
    https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html
  glTF-Blender-IO  Apache-2.0  Khronos Group
    https://github.com/KhronosGroup/glTF-Blender-IO
    Related: glTF-Sample-Assets (MIT), glTF-Validator (Apache-2.0)
"""

import bpy
import bmesh
import json
import math
import os

# ── Parameters ────────────────────────────────────────────────────────────────
EXPORT_PREFIX     = "HF_EXPORT_"      # only collections whose names start here
OUTPUT_DIR        = "//../../glbs/scripting/python-batch-glb-exporter/"
DRACO_LEVEL       = 6                 # Draco quality 0–10; 6 = good balance
DRACO_POS_BITS    = 14                # position quantisation bits (14 ≈ lossless)
DRACO_NRM_BITS    = 10                # normals quantisation bits
DRACO_UV_BITS     = 12                # UV quantisation bits
WEBP_TEXTURES     = True              # PNG/JPG → WebP; ~30 % smaller
WEBP_QUALITY      = 90                # WebP quality 0–100
EXPORT_CAMERAS    = False             # WebXR supplies its own cameras
EXPORT_LIGHTS     = False             # realtime renderers use scene lights
SNAKE_CASE_NAMES  = True             # rename object roots to snake_case for glTF
MANIFEST_FILENAME = "manifest.json"


# ── Helpers ───────────────────────────────────────────────────────────────────
def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)
    for block in (list(bpy.data.meshes) + list(bpy.data.materials)
                  + list(bpy.data.curves)):
        bpy.data.batch_remove([block])


def make_collection(name: str) -> bpy.types.Collection:
    """Create a top-level collection linked to the scene."""
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col


def link_to(obj: bpy.types.Object, col: bpy.types.Collection) -> None:
    """Link an object to a collection (and unlink from scene root if present)."""
    if obj.name in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.unlink(obj)
    col.objects.link(obj)


def add_mat(name: str, r: float, g: float, b: float) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)
        bsdf.inputs['Roughness'].default_value  = 0.35
        bsdf.inputs['Metallic'].default_value   = 0.0
    return mat


def snake_case(s: str) -> str:
    """'My Object.001' → 'my_object_001'  (crude; sufficient for object names)."""
    return (s.lower()
             .replace(' ', '_')
             .replace('-', '_')
             .replace('.', '_'))


# ── Demo scene builders ───────────────────────────────────────────────────────
def build_arch_column_collection() -> bpy.types.Collection:
    """
    HF_EXPORT_arch_column — a fluted column with capital and plinth.
    Three separate mesh objects in one collection: plinth, shaft, capital.
    """
    col = make_collection("HF_EXPORT_arch_column")

    # Plinth — flat box base
    bpy.ops.mesh.primitive_cube_add(size=1)
    plinth = bpy.context.active_object
    plinth.name = "arch_column_plinth"
    plinth.scale = (0.8, 0.8, 0.1)
    bpy.ops.object.transform_apply(scale=True)
    plinth.data.materials.append(add_mat("mat_stone", 0.78, 0.74, 0.68))
    link_to(plinth, col)

    # Shaft — cylinder with 8 sides (fluted look)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=8, radius=0.28, depth=1.6,
        location=(0, 0, 0.95),
    )
    shaft = bpy.context.active_object
    shaft.name = "arch_column_shaft"
    shaft.data.materials.append(add_mat("mat_column_shaft", 0.80, 0.77, 0.72))
    link_to(shaft, col)

    # Capital — tapered box at top
    bpy.ops.mesh.primitive_cone_add(
        vertices=4, radius1=0.4, radius2=0.55,
        depth=0.22, location=(0, 0, 1.87),
    )
    capital = bpy.context.active_object
    capital.name = "arch_column_capital"
    capital.data.materials.append(add_mat("mat_capital", 0.76, 0.72, 0.65))
    link_to(capital, col)

    return col


def build_gem_cluster_collection() -> bpy.types.Collection:
    """
    HF_EXPORT_gem_cluster — five icosphere gems at various scales and rotations.
    Each is a separate mesh; they share a flat-faceted gem material.
    """
    col = make_collection("HF_EXPORT_gem_cluster")

    gem_mat = add_mat("mat_gem_base", 0.08, 0.45, 0.82)
    gem_mat.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value   = 0.0
    gem_mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value  = 0.05
    gem_mat.node_tree.nodes['Principled BSDF'].inputs['IOR'].default_value        = 2.42
    gem_mat.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value = 0.9

    placements = [
        # (x, y, z, rx, rz, scale, suffix)
        ( 0.00,  0.00, 0.0, 0.0,  0.0, 0.40, "centre"),
        ( 0.55,  0.20, 0.0, 15.0, 35.0, 0.28, "a"),
        (-0.50,  0.30, 0.0, 10.0, 70.0, 0.22, "b"),
        ( 0.15, -0.55, 0.0, 5.0, 120.0, 0.30, "c"),
        (-0.30, -0.35, 0.0, 20.0, 200.0, 0.18, "d"),
    ]

    for x, y, z, rx, rz, sc, suf in placements:
        bpy.ops.mesh.primitive_ico_sphere_add(
            subdivisions=1, radius=sc,
            location=(x, y, z),
            rotation=(math.radians(rx), 0, math.radians(rz)),
        )
        gem = bpy.context.active_object
        gem.name = f"gem_{suf}"
        # Flat-shade the icosphere for faceted look
        bpy.ops.object.shade_flat()
        gem.data.materials.append(gem_mat)
        link_to(gem, col)

    return col


def build_cable_bundle_collection() -> bpy.types.Collection:
    """
    HF_EXPORT_cable_bundle — three bezier curves converted to mesh tubes.
    Demonstrates export_apply=True handling GN / convert on curves.
    """
    col = make_collection("HF_EXPORT_cable_bundle")

    cable_colours = [
        ("cable_red",   0.80, 0.10, 0.10),
        ("cable_green", 0.08, 0.60, 0.10),
        ("cable_blue",  0.10, 0.18, 0.80),
    ]
    offsets = [(-0.12, 0), (0.0, 0.08), (0.12, 0)]

    for (cname, r, g, b), (ox, oy) in zip(cable_colours, offsets):
        cu = bpy.data.curves.new(cname, type='CURVE')
        cu.dimensions     = '3D'
        cu.bevel_depth    = 0.025   # tube radius
        cu.bevel_resolution = 4     # 8-sided tube
        cu.use_fill_caps  = True

        spline = cu.splines.new('BEZIER')
        spline.bezier_points.add(2)  # 3 total points
        pts = spline.bezier_points
        pts[0].co = (ox, oy + 0.0,  0.0)
        pts[1].co = (ox, oy + 0.15, 0.55)
        pts[2].co = (ox, oy + 0.0,  1.10)
        for pt in pts:
            pt.handle_left_type  = 'AUTO'
            pt.handle_right_type = 'AUTO'

        obj = bpy.data.objects.new(cname, cu)
        mat = add_mat(f"mat_{cname}", r, g, b)
        obj.data.materials.append(mat)
        link_to(obj, col)

    return col


# ── LayerCollection traversal ─────────────────────────────────────────────────
def find_layer_collection(
    root_lc: bpy.types.LayerCollection, name: str
) -> bpy.types.LayerCollection | None:
    """
    Recursively locate the LayerCollection matching a Collection name.
    Required because bpy.context.view_layer.active_layer_collection takes
    a LayerCollection, not a Collection — they are separate types in the
    view-layer hierarchy.
    """
    if root_lc.collection.name == name:
        return root_lc
    for child in root_lc.children:
        found = find_layer_collection(child, name)
        if found:
            return found
    return None


# ── Batch exporter ────────────────────────────────────────────────────────────
def get_export_collections() -> list[bpy.types.Collection]:
    return sorted(
        [c for c in bpy.data.collections if c.name.startswith(EXPORT_PREFIX)],
        key=lambda c: c.name,
    )


def resolve_output_dir() -> str:
    """Resolve OUTPUT_DIR (blend-relative // path) to an absolute path."""
    if OUTPUT_DIR.startswith('//'):
        blend_dir = os.path.dirname(bpy.path.abspath("//"))
        rel       = OUTPUT_DIR[2:]
        return os.path.normpath(os.path.join(blend_dir, rel))
    return os.path.abspath(OUTPUT_DIR)


def export_one_collection(
    col: bpy.types.Collection, output_abs: str
) -> dict:
    """
    Activate col in the view layer then call bpy.ops.export_scene.gltf.
    Returns a manifest entry dict.
    """
    root_lc = bpy.context.view_layer.layer_collection
    lc = find_layer_collection(root_lc, col.name)
    if lc is None:
        print(f"  [SKIP] LayerCollection for '{col.name}' not found")
        return {}

    bpy.context.view_layer.active_layer_collection = lc

    # Derive GLB filename from the collection name (strip prefix, snake_case)
    slug     = snake_case(col.name[len(EXPORT_PREFIX):])
    glb_path = os.path.join(output_abs, f"{slug}.glb")

    # Rename root objects to snake_case so glTF node names are clean
    if SNAKE_CASE_NAMES:
        for obj in col.all_objects:
            if obj.parent is None or obj.parent not in set(col.all_objects):
                obj.name = snake_case(obj.name)

    poly_count = sum(
        len(obj.data.polygons)
        for obj in col.all_objects
        if obj.type == 'MESH' and obj.data
    )

    bpy.ops.export_scene.gltf(
        filepath                             = glb_path,
        export_format                        = 'GLB',
        use_active_collection                = True,
        use_selection                        = False,
        # export_apply bakes modifiers + applies transforms in one pass
        export_apply                         = True,
        export_cameras                       = EXPORT_CAMERAS,
        export_lights                        = EXPORT_LIGHTS,
        # +Y up is the glTF spec convention; holoflow_webxr_exporter enforces it
        export_yup                           = True,
        export_image_format                  = 'WEBP' if WEBP_TEXTURES else 'AUTO',
        export_image_quality                 = WEBP_QUALITY,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = DRACO_LEVEL,
        export_draco_position_quantization   = DRACO_POS_BITS,
        export_draco_normal_quantization     = DRACO_NRM_BITS,
        export_draco_texcoord_quantization   = DRACO_UV_BITS,
    )

    size_kb = os.path.getsize(glb_path) // 1024 if os.path.exists(glb_path) else 0
    n_obj   = len(col.all_objects)
    print(f"  ✓ {slug}.glb  ({n_obj} objects · {poly_count} polys · {size_kb} KB)")

    return {
        "slug"       : slug,
        "collection" : col.name,
        "filepath"   : glb_path,
        "objects"    : n_obj,
        "polygons"   : poly_count,
        "size_kb"    : size_kb,
    }


def run_batch_export() -> None:
    export_cols = get_export_collections()
    if not export_cols:
        print(f"[Batch Exporter] No collections prefixed '{EXPORT_PREFIX}' — nothing to do.")
        return

    output_abs = resolve_output_dir()
    os.makedirs(output_abs, exist_ok=True)

    print(f"[Batch Exporter] {len(export_cols)} collection(s) → {output_abs}")
    results = []
    for col in export_cols:
        print(f"  → {col.name}")
        entry = export_one_collection(col, output_abs)
        if entry:
            results.append(entry)

    manifest = {
        "blender_version" : ".".join(str(v) for v in bpy.app.version),
        "blend_file"      : os.path.basename(bpy.data.filepath) or "(unsaved)",
        "draco_level"     : DRACO_LEVEL,
        "webp_textures"   : WEBP_TEXTURES,
        "exports"         : results,
        "total_exported"  : len(results),
    }
    manifest_path = os.path.join(output_abs, MANIFEST_FILENAME)
    with open(manifest_path, 'w') as fh:
        json.dump(manifest, fh, indent=2)

    print(f"[Batch Exporter] Manifest → {manifest_path}")
    print(f"[Batch Exporter] Complete: {len(results)} GLB(s) exported")


# ── Entry point ───────────────────────────────────────────────────────────────
def main() -> None:
    clear_scene()

    # Build three demo collections
    build_arch_column_collection()
    build_gem_cluster_collection()
    build_cable_bundle_collection()

    # Save .blend so resolve_output_dir() can compute a relative path
    blend_path = os.path.abspath(
        "public/library/blends/scripting/python-batch-glb-exporter/batch_pipeline.blend"
    )
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)

    # Run the batch export
    run_batch_export()


main()
