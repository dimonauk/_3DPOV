"""
Python bpy.types.Depsgraph — Evaluated Geometry Access:
GN Instances, Modifier Output & Batch GLB Snapshot Export

Blender 5.1 | CC0 | Holoflow Studio

TECHNIQUE
---------
Every object in bpy.data is the *original* — the data before modifiers,
Geometry Nodes, constraints, and drivers have run.  The depsgraph is
Blender's internal evaluation engine; it holds a parallel, read-only
copy of every data-block in its *evaluated* state.  Reading vertex
positions from bpy.data.objects["Plane"].data gives you the unmodified
4-vert grid.  Reading the evaluated copy gives you 300 scattered crystal
instances realised into one mesh.

This blueprint covers the four depsgraph patterns Holoflow uses in
production:

  Pattern 1 — evaluated_get() + to_mesh()
      Read the modifier-stack result of a single object.

  Pattern 2 — object_instances
      Iterate every scene instance (GN scatter, dupli-collection, etc.)
      and capture per-instance world-space transforms.

  Pattern 3 — new_from_object()
      Bake evaluated geometry into a standalone, persistable Mesh block.

  Pattern 4 — batch_export_instances()
      Write each GN-scattered instance as a separate GLB for lazy WebXR
      loading (one small file per chunk beats one enormous monolith).

WHY separate GLBs for WebXR
  Three.js fetches assets over HTTP.  A single 20 MB scatter file blocks
  the network for several seconds on mobile.  One 80 KB GLB per instance
  loads in parallel, enables content-hash CDN dedup, and can be
  prioritised by camera distance without re-fetching unneeded geometry.
"""

import bpy
import bmesh
import math
import os

# ── CONSTANTS ────────────────────────────────────────────────────────────────

SCATTER_NAME  = "CrystalScatter"        # GN instancer object name
CRYSTAL_NAME  = "crystal_gem_source"    # template crystal object (hidden)
OUTPUT_DIR    = "//depsgraph_batch/"    # blend-relative; set absolute for CI


# ── SCENE SETUP ──────────────────────────────────────────────────────────────

def _make_crystal_mesh() -> bpy.types.Mesh:
    """Bipyramid crystal: 6 equatorial verts + top/bottom apex."""
    bm = bmesh.new()
    for i in range(6):
        a = math.tau * i / 6
        bm.verts.new((math.cos(a) * 0.14, math.sin(a) * 0.14, 0.0))
    bm.verts.new((0.0, 0.0,  0.52))
    bm.verts.new((0.0, 0.0, -0.22))
    bm.verts.ensure_lookup_table()
    top, bot = bm.verts[6], bm.verts[7]
    for i in range(6):
        j = (i + 1) % 6
        bm.faces.new([bm.verts[i], bm.verts[j], top])
        bm.faces.new([bm.verts[j], bm.verts[i], bot])
    me = bpy.data.meshes.new("crystal_gem_mesh")
    bm.to_mesh(me)
    bm.free()
    return me


def build_demo_scene() -> bpy.types.Object:
    """
    Build a GN scatter scene from scratch.

    Returns the plane instancer whose modifier stack we will access via
    the depsgraph.  The crystal template is hidden — it exists only as
    a data source for the GN Instance on Points node.
    """
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)

    # Crystal template — hidden from viewport, used by GN as instance source
    gem_obj = bpy.data.objects.new(CRYSTAL_NAME, _make_crystal_mesh())
    bpy.context.scene.collection.objects.link(gem_obj)
    gem_obj.hide_viewport = True

    # Ground plane that carries the GN modifier
    bpy.ops.mesh.primitive_plane_add(size=5.0, location=(0, 0, 0))
    plane = bpy.context.object
    plane.name = SCATTER_NAME

    # Build minimal GN tree: plane → Distribute on Faces → Instance on Points
    mod = plane.modifiers.new("GeoNodes_Scatter", "NODES")
    ng  = bpy.data.node_groups.new("CrystalScatterTree", "GeometryNodeTree")
    mod.node_group = ng

    ng.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    nd = ng.nodes
    lk = ng.links

    n_in   = nd.new("NodeGroupInput");  n_in.location  = (-500, 0)
    n_out  = nd.new("NodeGroupOutput"); n_out.location  = (420, 0)
    n_dist = nd.new("GeometryNodeDistributePointsOnFaces"); n_dist.location = (-200, 80)
    n_obj  = nd.new("GeometryNodeObjectInfo");              n_obj.location  = (-200, -100)
    n_inst = nd.new("GeometryNodeInstanceOnPoints");        n_inst.location = (80,  50)
    n_real = nd.new("GeometryNodeRealizeInstances");        n_real.location = (280, 50)

    n_dist.inputs["Density"].default_value = 2.0   # instances per m²
    n_obj.inputs["Object"].default_value   = gem_obj
    n_obj.transform_space                  = "ORIGINAL"

    lk.new(n_in.outputs["Geometry"],    n_dist.inputs["Mesh"])
    lk.new(n_obj.outputs["Geometry"],   n_inst.inputs["Instance"])
    lk.new(n_dist.outputs["Points"],    n_inst.inputs["Points"])
    lk.new(n_inst.outputs["Instances"], n_real.inputs["Geometry"])
    lk.new(n_real.outputs["Geometry"],  n_out.inputs["Geometry"])

    return plane


# ── PATTERN 1: Single-object evaluated access ─────────────────────────────────

def pattern_evaluated_mesh(plane: bpy.types.Object) -> int:
    """
    Read the EVALUATED vertex count after all GN modifiers have run.

    to_mesh_clear() is mandatory — the temporary Mesh is not tracked by
    the undo system and will not be freed automatically; accumulating
    un-cleared meshes causes a reference-count leak that manifests as
    random crashes on the next file-open.
    """
    dg          = bpy.context.evaluated_depsgraph_get()
    plane_eval  = plane.evaluated_get(dg)            # evaluated shadow object

    # preserve_all_data_layers keeps UV maps, vertex colours, custom attributes
    eval_mesh = plane_eval.to_mesh(
        preserve_all_data_layers=True,
        depsgraph=dg,
    )
    count = len(eval_mesh.vertices)
    plane_eval.to_mesh_clear()                        # MUST free after reading
    return count


# ── PATTERN 2: Iterate GN instances ──────────────────────────────────────────

def pattern_instance_list(instancer_name: str) -> list[dict]:
    """
    Collect world-space transforms for every GN-scattered instance.

    dg.object_instances yields DepsgraphObjectInstance for real objects
    (is_instance=False) AND every GN/dupli copy (is_instance=True).
    inst.matrix_world is already in world space — GN random rotation and
    scale have been applied.

    We deep-copy the matrix because inst lives only for the duration of
    the iteration; holding the reference past the loop is undefined
    behaviour and will produce garbage transforms.
    """
    import mathutils

    dg   = bpy.context.evaluated_depsgraph_get()
    hits = []
    for inst in dg.object_instances:
        if not inst.is_instance:
            continue
        if inst.parent is None or inst.parent.name != instancer_name:
            continue
        hits.append({
            "source":       inst.object.name,
            "matrix_world": mathutils.Matrix(inst.matrix_world),  # deep copy
        })
    return hits


# ── PATTERN 3 + 4: Batch GLB export ──────────────────────────────────────────

def batch_export_instances(instancer_name: str) -> int:
    """
    Bake each GN instance into a self-contained GLB.

    new_from_object() differs from to_mesh() in one critical way: the
    returned Mesh is an independent bpy.data.Mesh — it persists until you
    explicitly remove it, and does NOT require a matching clear() call.
    Use new_from_object() when you need to hand the Mesh to another
    data-block (here: a temp Object for the exporter).  Use to_mesh()
    when you only need to READ attributes and will immediately discard.

    transform(inst.matrix_world) bakes world-space position into vertex
    coordinates so the exported GLB has its root node at the origin.
    calc_normals_split() re-derives custom split normals after the
    transform — skipping this step produces shading artefacts in Three.js.
    """
    import mathutils

    bpy.ops.file.make_paths_absolute()
    out_dir = bpy.path.abspath(OUTPUT_DIR)
    os.makedirs(out_dir, exist_ok=True)

    dg   = bpy.context.evaluated_depsgraph_get()
    hits = 0

    for idx, inst in enumerate(dg.object_instances):
        if not inst.is_instance:
            continue
        if inst.parent is None or inst.parent.name != instancer_name:
            continue

        # Bake evaluated geometry into a new, persistent Mesh data-block
        snap_mesh = bpy.data.meshes.new_from_object(
            inst.object,
            preserve_all_data_layers=True,
            depsgraph=dg,
        )
        # Apply world transform so the GLB is self-contained
        snap_mesh.transform(mathutils.Matrix(inst.matrix_world))
        snap_mesh.calc_normals_split()

        snap_obj = bpy.data.objects.new(f"export_{idx:04d}", snap_mesh)
        bpy.context.scene.collection.objects.link(snap_obj)

        filepath = os.path.join(out_dir, f"crystal_{idx:04d}.glb")
        with bpy.context.temp_override(
            active_object=snap_obj,
            selected_objects=[snap_obj],
        ):
            bpy.ops.export_scene.gltf(
                filepath=filepath,
                use_selection=True,
                export_format="GLB",
                export_draco_mesh_compression_enable=True,
                export_draco_mesh_compression_level=6,
                export_image_format="WEBP",
                export_extras=True,
            )
        hits += 1

        # Always clean up temp data-blocks — undo history does not track them
        bpy.context.scene.collection.objects.unlink(snap_obj)
        bpy.data.objects.remove(snap_obj, do_unlink=True)
        bpy.data.meshes.remove(snap_mesh,  do_unlink=True)

    return hits


# ── ENTRY POINT ───────────────────────────────────────────────────────────────

def main() -> None:
    plane = build_demo_scene()

    # Force depsgraph evaluation — without this, stale data from the prior
    # frame state is returned by evaluated_get() and object_instances.
    bpy.context.view_layer.update()

    vert_count = pattern_evaluated_mesh(plane)
    print(f"[dg] evaluated vertex count : {vert_count}")

    instances = pattern_instance_list(SCATTER_NAME)
    print(f"[dg] GN instance count      : {len(instances)}")

    exported = batch_export_instances(SCATTER_NAME)
    print(f"[dg] GLBs written           : {exported}  →  {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
