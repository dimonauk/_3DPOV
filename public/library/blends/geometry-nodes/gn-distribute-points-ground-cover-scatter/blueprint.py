"""
GN Distribute Points on Faces — Procedural Ground Cover Scatter
Blender 5.1  |  bpy + bmesh API  |  CC0 / Holoflow Studio

POISSON_DISK mode enforces minimum separation (distance_min) via Mitchell's
best-candidate — avoids micro-clustering that RANDOM mode produces.  Density
is a Named Attribute field matching a vertex-group, so weight-painting in the
viewport directly controls where cover is thick or sparse.  Pick Instance =
True on Instance on Points selects per-point from a Collection, enabling
multi-asset scatter from a single node tree in O(1) per point.
"""

import bpy
import bmesh
import math
from mathutils import Vector, Euler

# ── Constants ────────────────────────────────────────────────────────────────
GROUND_SIZE      = 4.0      # metres, world-space plane dimensions
GROUND_SUBDIV    = 4        # subdivision level → 16×16 faces
POISSON_DIST_MIN = 0.08     # metres; minimum spacing between scatter points
SCATTER_DENSITY  = 12.0     # points / m² at full weight
SCALE_MIN        = 0.55     # smallest instance relative scale
SCALE_MAX        = 1.25     # largest  instance relative scale
GRASS_HEIGHT     = 0.18     # blade height in metres
PEBBLE_RADIUS    = 0.035    # pebble radius in metres
RENDER_SAMPLES   = 64
EXPORT_PATH      = "//ground_cover_scatter.glb"


# ── Utility ───────────────────────────────────────────────────────────────────
def purge_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes) + list(bpy.data.node_groups):
        bpy.data.batch_remove([block])


def link(tree, a, b):
    tree.links.new(a, b)


# ── Scatter instances ─────────────────────────────────────────────────────────
def make_grass_blade(collection) -> bpy.types.Object:
    """
    A pointed cone representing a single grass blade.  Using a cone (not a
    plane) keeps the mesh visible from all azimuths — crucial for real-time
    WebXR environments where the camera can circle freely.
    """
    bm = bmesh.new()
    # Base ring of 5 verts, apex at GRASS_HEIGHT
    apex   = bm.verts.new((0, 0, GRASS_HEIGHT))
    angles = [2 * math.pi * i / 5 for i in range(5)]
    base   = [bm.verts.new((0.012 * math.cos(a), 0.012 * math.sin(a), 0)) for a in angles]
    for i in range(5):
        bm.faces.new([apex, base[i], base[(i + 1) % 5]])
    base_face = bm.faces.new(base)  # noqa: F841  (floor cap)
    me = bpy.data.meshes.new("GrassBlade")
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("GrassBlade", me)
    collection.objects.link(ob)
    mat = bpy.data.materials.new("GrassMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.18, 0.45, 0.08, 1)
    bsdf.inputs["Roughness"].default_value = 0.9
    me.materials.append(mat)
    return ob


def make_pebble(collection) -> bpy.types.Object:
    """
    Icosphere at 1 subdivision for a faceted pebble — fits the Holoflow
    low-poly aesthetic and keeps the tri count minimal for WebXR instancing.
    """
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=PEBBLE_RADIUS)
    ob = bpy.context.active_object
    ob.name = "Pebble"
    bpy.ops.object.collection_link(collection=collection.name)
    # Unlink from scene collection so it won't render directly
    bpy.context.scene.collection.objects.unlink(ob)
    mat = bpy.data.materials.new("PebbleMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.38, 0.33, 0.28, 1)
    bsdf.inputs["Roughness"].default_value = 0.75
    ob.data.materials.append(mat)
    return ob


# ── Base plane with vertex-group density mask ─────────────────────────────────
def make_ground(collection) -> bpy.types.Object:
    bm = bmesh.new()
    half = GROUND_SIZE / 2
    bmesh.ops.create_grid(bm, x_segments=GROUND_SUBDIV * 2,
                          y_segments=GROUND_SUBDIV * 2, size=half)
    me = bpy.data.meshes.new("GroundPlane")
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("GroundPlane", me)
    collection.objects.link(ob)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob

    # Vertex group "scatter_weight": dense in centre, sparse at edges
    vg = ob.vertex_groups.new(name="scatter_weight")
    centre = Vector((0, 0, 0))
    for v in me.vertices:
        dist = (v.co - centre).length
        w = max(0.0, 1.0 - dist / (GROUND_SIZE * 0.6))
        w = w ** 0.7          # gamma < 1 → gradient stays dense longer
        vg.add([v.index], w, 'REPLACE')

    # Ground material: simple sandy-brown
    mat = bpy.data.materials.new("GroundMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.52, 0.42, 0.28, 1)
    bsdf.inputs["Roughness"].default_value = 0.95
    me.materials.append(mat)
    return ob


# ── Geometry Nodes tree ───────────────────────────────────────────────────────
def build_gn_tree(ground: bpy.types.Object, scatter_col: bpy.types.Collection) -> None:
    mod  = ground.modifiers.new("ScatterCover", 'NODES')
    tree = bpy.data.node_groups.new("ScatterGroundCover", 'GeometryNodeTree')
    mod.node_group = tree
    nodes = tree.nodes
    nodes.clear()

    def N(bl_idname, x, y):
        n = nodes.new(bl_idname)
        n.location = (x, y)
        return n

    # Input / Output
    n_in  = N('NodeGroupInput',  -600, 0)
    n_out = N('NodeGroupOutput',  900, 0)
    tree.interface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
    tree.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    # Named Attribute → reads "scatter_weight" vertex-group float
    n_attr = N('GeometryNodeInputNamedAttribute', -400, -120)
    n_attr.data_type = 'FLOAT'
    n_attr.inputs["Name"].default_value = "scatter_weight"

    # Distribute Points on Faces (Poisson Disk)
    n_dist = N('GeometryNodeDistributePointsOnFaces', -160, 0)
    n_dist.distribution_type = 'POISSON_DISK'
    n_dist.inputs["Distance Min"].default_value    = POISSON_DIST_MIN
    n_dist.inputs["Density Max"].default_value     = SCATTER_DENSITY
    n_dist.inputs["Seed"].default_value            = 7

    # Collection Info → the scatter pieces collection
    n_col = N('GeometryNodeCollectionInfo', -160, -260)
    n_col.transform_space  = 'RELATIVE'
    n_col.inputs["Separate Children"].default_value = True
    n_col.inputs["Reset Children"].default_value    = False
    n_col.inputs["Collection"].default_value        = scatter_col

    # Random float for Instance Index selection (0 or 1 — two asset types)
    n_idx = N('FunctionNodeRandomValue', -160, -380)
    n_idx.data_type = 'INT'
    n_idx.inputs["Min"].default_value = 0
    n_idx.inputs["Max"].default_value = 1   # two meshes in collection

    # Align Euler to Vector — align +Z to face Normal
    n_align = N('FunctionNodeAlignEulerToVector', 80, -80)
    n_align.axis   = 'Z'
    n_align.pivot_axis = 'AUTO'
    n_align.inputs["Factor"].default_value = 1.0

    # Random Yaw rotation vector (0..2π around Z)
    n_rand_rot = N('FunctionNodeRandomValue', 80, -200)
    n_rand_rot.data_type = 'FLOAT_VECTOR'
    n_rand_rot.inputs["Min"].default_value    = (0.0, 0.0, 0.0)
    n_rand_rot.inputs["Max"].default_value    = (0.0, 0.0, 6.2832)
    n_rand_rot.inputs["Seed"].default_value   = 13

    # Instance on Points
    n_inst = N('GeometryNodeInstanceOnPoints', 320, 0)
    n_inst.inputs["Pick Instance"].default_value  = True

    # Random Scale
    n_scale_rnd = N('FunctionNodeRandomValue', 320, -200)
    n_scale_rnd.data_type = 'FLOAT'
    n_scale_rnd.inputs["Min"].default_value  = SCALE_MIN
    n_scale_rnd.inputs["Max"].default_value  = SCALE_MAX
    n_scale_rnd.inputs["Seed"].default_value = 42

    # Scale Instances
    n_scale = N('GeometryNodeScaleInstances', 540, 0)
    n_scale.inputs["Local Space"].default_value = True

    # Realize Instances — REQUIRED before GLB export; see sister tutorial
    n_real = N('GeometryNodeRealizeInstances', 720, 0)

    # Join with original ground geometry so mesh + scatter export together
    n_join = N('GeometryNodeJoinGeometry', 860, 0)

    # ── Wire ─────────────────────────────────────────────────────────────────
    link(tree, n_in.outputs["Geometry"],       n_dist.inputs["Mesh"])
    link(tree, n_attr.outputs["Attribute"],    n_dist.inputs["Density"])
    link(tree, n_dist.outputs["Points"],       n_inst.inputs["Points"])
    link(tree, n_dist.outputs["Normal"],       n_align.inputs["Vector"])
    link(tree, n_align.outputs["Rotation"],    n_rand_rot.inputs["Min"])  # seed rotation on aligned base
    link(tree, n_rand_rot.outputs["Value"],    n_inst.inputs["Rotation"])
    link(tree, n_col.outputs["Geometry"],      n_inst.inputs["Instance"])
    link(tree, n_idx.outputs["Value"],         n_inst.inputs["Instance Index"])
    link(tree, n_inst.outputs["Instances"],    n_scale.inputs["Instances"])
    link(tree, n_scale_rnd.outputs["Value"],   n_scale.inputs["Scale"])
    link(tree, n_scale.outputs["Instances"],   n_real.inputs["Geometry"])
    link(tree, n_real.outputs["Geometry"],     n_join.inputs["Geometry"])
    link(tree, n_in.outputs["Geometry"],       n_join.inputs["Geometry"])
    link(tree, n_join.outputs["Geometry"],     n_out.inputs["Geometry"])


# ── Camera + lighting ─────────────────────────────────────────────────────────
def setup_scene() -> None:
    sun = bpy.data.lights.new("Sun", 'SUN')
    sun.energy = 4.0
    sun.angle  = math.radians(2)
    sun_ob = bpy.data.objects.new("Sun", sun)
    bpy.context.scene.collection.objects.link(sun_ob)
    sun_ob.rotation_euler = Euler((math.radians(55), 0, math.radians(30)))

    cam_data = bpy.data.cameras.new("Cam")
    cam_ob   = bpy.data.objects.new("Cam", cam_data)
    bpy.context.scene.collection.objects.link(cam_ob)
    cam_ob.location       = (0, -3.5, 2.5)
    cam_ob.rotation_euler = Euler((math.radians(55), 0, 0))
    bpy.context.scene.camera = cam_ob

    bpy.context.scene.render.engine            = 'BLENDER_EEVEE_NEXT'
    bpy.context.scene.eevee.taa_render_samples = RENDER_SAMPLES
    bpy.context.scene.render.resolution_x      = 1920
    bpy.context.scene.render.resolution_y      = 1080


# ── GLB export ────────────────────────────────────────────────────────────────
def export_glb(ground: bpy.types.Object) -> None:
    """
    Apply modifier before export: Realize Instances inside the GN tree means
    the GLB writer receives a flat vertex buffer, not EXT_mesh_gpu_instancing.
    export_apply=True bakes the NODES modifier.
    """
    bpy.ops.export_scene.gltf(
        filepath            = bpy.path.abspath(EXPORT_PATH),
        export_format       = 'GLB',
        export_apply        = True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format = 'WEBP',
        use_selection       = False,
    )


# ── Entry point ───────────────────────────────────────────────────────────────
def main() -> None:
    purge_scene()

    # Scatter-pieces collection (not linked to scene — GN references it)
    sc_col = bpy.data.collections.new("ScatterPieces")
    bpy.context.scene.collection.children.link(sc_col)
    # Exclude from view layer so pieces don't render independently
    bpy.context.view_layer.layer_collection.children["ScatterPieces"].exclude = True

    make_grass_blade(sc_col)
    make_pebble(sc_col)

    scene_col = bpy.context.scene.collection
    ground = make_ground(scene_col)

    build_gn_tree(ground, sc_col)
    setup_scene()

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//ground_cover_scatter.blend"))
    export_glb(ground)
    print("Blueprint complete — ground_cover_scatter.blend + .glb written.")


if __name__ == "__main__":
    main()
