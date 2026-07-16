"""
mathutils.kdtree.KDTree — Nearest-Neighbour Attribute Transfer
==============================================================
Build a compiled k-d tree from the vertex positions of a high-resolution
source mesh, read a custom FLOAT per-vertex attribute (e.g., a baked AO
value), then write a distance-weighted interpolant onto a low-poly proxy as
FLOAT_COLOR for WebXR vertex-colour export.

WHY kdtree OVER Data Transfer Modifier
  The modifier cannot address custom-named attributes added by Geometry Nodes
  or user scripts. It also re-evaluates on every frame change. A scripted
  KDTree transfer runs once, targets any attribute by name, and produces a
  deterministic bake that survives GLB round-trips unchanged.

WHY kdtree OVER bvhtree
  mathutils.bvhtree.BVHTree.find_nearest() projects a query point onto the
  nearest TRIANGLE — solving "which surface point am I closest to?". That is
  the right primitive for normals or UV interpolation. KDTree.find_n() finds
  the K nearest raw VERTEX INDICES — the right primitive when source data lives
  on the POINT domain (per-vertex AO, scalar weights, procedural masks).

WHY inverse-distance SQUARED weighting
  Simple 1/d can amplify distant stray samples when query and source differ in
  density. 1/d² weights the nearest contributor far more aggressively, giving
  a result that reads as "locally coherent" even across coarse-to-fine mismatches.
  Exact coincident hits (dist < epsilon) must be short-circuited: 1/0 is undefined
  and 1/epsilon² would produce NaN or overflow — the guard below handles that case.

Blender 5.1 notes
  - Import: `import mathutils` then `mathutils.kdtree.KDTree(capacity)`.
    capacity is a preallocated hint; inserting more points than capacity is safe
    but causes internal reallocation.
  - kd.balance() is MANDATORY before any find call; builds the tree structure.
    Calling find() before balance() raises a RuntimeError.
  - kd.find_n(co, n) returns a list of (Vector, int, float) tuples sorted by
    ascending distance — the returned Vector is the matched vertex coordinate,
    int is the index tag supplied to insert(), float is the Euclidean distance.
  - Attribute API: mesh.attributes.new(name, type, domain)
  - foreach_get / foreach_set operate on a flat C-contiguous buffer (array.array
    or a flattened numpy array). They issue a single memcopy at C speed.
    Iterating over attr.data items in Python is ~100× slower.
  - FLOAT_COLOR on POINT domain: each element stores 4 floats (R,G,B,A).
    The GLB exporter writes this as a COLOR_0 accessor, which Three.js and
    Babylon.js consume as vertexColors in their respective material APIs.
"""

import array
import math
import mathutils
import bpy

# ── parameters ──────────────────────────────────────────────────────────────
SOURCE_OBJ     = "hires_source"
TARGET_OBJ     = "lores_proxy"
ATTR_SRC       = "ao_value"      # FLOAT, POINT domain, on source
ATTR_DST       = "ao_baked"      # FLOAT_COLOR, POINT domain, on target
K_NEAREST      = 4               # blend from 4 nearest source verts
SOURCE_SUBDIVS = 4               # icosphere subdivisions — ~2562 verts
TARGET_SUBDIVS = 2               # icosphere subdivisions — ~162 verts
BLEND_PATH     = "//attr_transfer.blend"
GLB_PATH       = "//attr_transfer.glb"
# ────────────────────────────────────────────────────────────────────────────


def _clear_scene() -> None:
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        bpy.data.meshes.remove(me)
    for ma in list(bpy.data.materials):
        bpy.data.materials.remove(ma)


def _add_icosphere(name: str, subdivs: int, radius: float = 1.0) -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivs, radius=radius)
    ob = bpy.context.active_object
    ob.name = name
    ob.data.name = name + "_mesh"
    return ob


def _write_ao_attribute(ob: bpy.types.Object) -> None:
    """
    Populate ATTR_SRC on the source mesh with a fake AO proxy — each vertex's
    value is its normalised Y height. In production, replace this with a Cycles
    AO bake read back from an image pixel buffer; the transfer code is identical
    either way.
    """
    me = ob.data
    n = len(me.vertices)

    co_buf = array.array('f', [0.0] * (n * 3))
    me.vertices.foreach_get("co", co_buf)           # bulk read: one C call

    y_vals = [co_buf[i * 3 + 1] for i in range(n)]  # Y component
    y_min, y_max = min(y_vals), max(y_vals)
    span = (y_max - y_min) or 1.0

    ao_buf = array.array('f', [(y - y_min) / span for y in y_vals])
    attr = (me.attributes.get(ATTR_SRC)
            or me.attributes.new(ATTR_SRC, type='FLOAT', domain='POINT'))
    attr.data.foreach_set("value", ao_buf)           # bulk write
    me.update()
    print(f"[blueprint] wrote {ATTR_SRC} on {n} source verts")


def _build_kdtree(ob: bpy.types.Object) -> tuple:
    """
    Return (kd, ao_list) — a balanced KDTree keyed by vertex index and a
    parallel list of float AO values.

    capacity = n is exact here; if you preallocate large and insert fewer,
    the unused slots are harmless. Over-inserting causes silent realloc.
    """
    me = ob.data
    n = len(me.vertices)

    kd = mathutils.kdtree.KDTree(n)

    co_buf = array.array('f', [0.0] * (n * 3))
    me.vertices.foreach_get("co", co_buf)

    for i in range(n):
        kd.insert(
            mathutils.Vector((co_buf[i*3], co_buf[i*3+1], co_buf[i*3+2])),
            i,
        )
    kd.balance()    # tree is invalid (and find() raises) before this returns

    ao_attr = me.attributes.get(ATTR_SRC)
    ao_buf = array.array('f', [0.0] * n)
    ao_attr.data.foreach_get("value", ao_buf)
    return kd, list(ao_buf)


def _transfer_attribute(
    target: bpy.types.Object,
    kd: "mathutils.kdtree.KDTree",
    ao_src: list[float],
) -> None:
    """
    Walk every vertex of *target*, query K nearest source verts, blend with
    inverse-distance-squared weights, and write to FLOAT_COLOR ATTR_DST.

    FLOAT_COLOR stores RGBA (4 floats per vertex). Greyscale AO is mapped to
    R=G=B with A=1.0 — WebXR runtimes generally read .rgb from COLOR_0 for
    colour, ignoring alpha unless the material specifically routes it.
    """
    me = target.data
    n = len(me.vertices)

    co_buf = array.array('f', [0.0] * (n * 3))
    me.vertices.foreach_get("co", co_buf)

    color_buf = array.array('f', [0.0] * (n * 4))   # RGBA interleaved

    for i in range(n):
        query = mathutils.Vector((co_buf[i*3], co_buf[i*3+1], co_buf[i*3+2]))
        hits = kd.find_n(query, K_NEAREST)           # sorted nearest-first

        if hits and hits[0][2] < 1e-8:
            # Exact vertex coincidence — use directly; guard against 1/0
            val = ao_src[hits[0][1]]
        else:
            total_w = 0.0
            total_v = 0.0
            for _co, idx, dist in hits:
                w = 1.0 / (dist * dist)              # 1/d² weighting
                total_w += w
                total_v += w * ao_src[idx]
            val = total_v / total_w if total_w else 0.0

        base = i * 4
        color_buf[base]     = val
        color_buf[base + 1] = val
        color_buf[base + 2] = val
        color_buf[base + 3] = 1.0

    attr = (me.attributes.get(ATTR_DST)
            or me.attributes.new(ATTR_DST, type='FLOAT_COLOR', domain='POINT'))
    attr.data.foreach_set("color", color_buf)
    me.update()
    print(f"[blueprint] transferred → {ATTR_DST} on {n} target verts")


def _apply_vertex_colour_material(ob: bpy.types.Object) -> None:
    """
    Wire a Vertex Color node → Principled BSDF so the transferred AO is
    visible in the viewport and in the Workbench render used by record.py.
    """
    mat = bpy.data.materials.new("AttrTransferMat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out   = nt.nodes.new("ShaderNodeOutputMaterial");  out.location = (300, 0)
    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled");  bsdf.location = (0, 0)
    vcol  = nt.nodes.new("ShaderNodeVertexColor");     vcol.location = (-260, 80)

    vcol.layer_name = ATTR_DST
    bsdf.inputs["Roughness"].default_value = 0.60
    nt.links.new(vcol.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])

    ob.data.materials.clear()
    ob.data.materials.append(mat)

    # Set ATTR_DST as the active render colour so the GLB exporter writes it
    for i, ca in enumerate(ob.data.color_attributes):
        if ca.name == ATTR_DST:
            ob.data.color_attributes.render_color_index = i
            ob.data.color_attributes.active_color_index = i
            break


def main() -> None:
    _clear_scene()

    src = _add_icosphere(SOURCE_OBJ, SOURCE_SUBDIVS)
    _write_ao_attribute(src)

    # Place target slightly to the right so both meshes are visible
    tgt = _add_icosphere(TARGET_OBJ, TARGET_SUBDIVS)
    tgt.location = (2.6, 0.0, 0.0)
    bpy.context.view_layer.update()

    kd, ao_src = _build_kdtree(src)
    _transfer_attribute(tgt, kd, ao_src)
    _apply_vertex_colour_material(tgt)

    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)

    bpy.ops.export_scene.gltf(
        filepath                            = GLB_PATH,
        export_format                       = 'GLB',
        export_yup                          = True,
        export_apply                        = True,
        export_draco_mesh_compression_enable= True,
        export_draco_mesh_compression_level = 6,
        export_image_format                 = 'WEBP',
        export_vertex_color                 = 'ACTIVE',  # COLOR_0 accessor
        use_selection                       = False,
    )
    print(f"[blueprint] GLB → {GLB_PATH}")
    print(f"[blueprint] source verts={len(src.data.vertices)}  "
          f"target verts={len(tgt.data.vertices)}")


main()
