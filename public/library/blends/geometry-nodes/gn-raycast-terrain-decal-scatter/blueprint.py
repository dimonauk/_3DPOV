"""
GN Raycast Node — Terrain-Following Decal Scatter
Blender 5.1  ·  CC0  ·  Holoflow Studio

Technique: a Geometry Nodes Raycast node fires one ray per scatter point
straight down (-Z) and asks the terrain mesh "where exactly do you intersect
this ray?".  Each returned Hit Position becomes the decal's world position;
each Hit Normal becomes its orientation axis.  The result is flat quad decals
that lie flush against any curved surface — no UV projection, no baking, no
texture-space tricks.

Key insight: both the emitter grid and the terrain are separate mesh objects.
Object Info with transform_space='RELATIVE' imports the terrain geometry into
the scatter modifier's local coordinate space, making all spatial comparisons
coherent regardless of either object's transform.

Outside sources
  Blender Manual — Raycast Node
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/sample/raycast.html
    CC-BY-SA 4.0 · Blender Documentation Team
  blender-scripting — Nicolas Janakiev
    https://github.com/njanakiev/blender-scripting  (MIT)
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
TERRAIN_SIZE        = 4.0    # metres — plane extent on each axis
TERRAIN_SUBDIVS     = 28     # grid line count per axis (28×28 = 784 faces)
TERRAIN_NOISE_SCALE = 1.3    # Clouds texture noise frequency
TERRAIN_DISP_STR    = 0.42   # displacement modifier strength (peak height ~0.42m)

EMITTER_HEIGHT      = 2.0    # metres; rays originate at this Z, travel −Z
RAY_LENGTH          = 3.5    # must exceed EMITTER_HEIGHT + terrain peak by margin

SCATTER_DIST_MIN    = 0.14   # Poisson-disk minimum inter-decal spacing (metres)
SCATTER_SEED        = 7
SCATTER_DENSITY     = 20.0   # target density (points / m²) for POISSON_DISK

DECAL_HALF          = 0.09   # decal quad half-size in metres
SCALE_MIN           = 0.55
SCALE_MAX           = 1.50
SCALE_SEED          = 19

EMISSIVE_COLOUR     = (0.08, 0.78, 1.0, 1.0)   # pale-cyan glow
EMISSIVE_STRENGTH   = 3.2
EXPORT_PATH         = "//terrain_decal_scatter.glb"


# ── Helpers ───────────────────────────────────────────────────────────────────
def _purge() -> None:
    for ob in list(bpy.data.objects):
        if ob.name.startswith(("terrain_mesh", "decal_scatter", "decal_template",
                                "DecalScatter_", "TDS_")):
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.name.startswith(("TerrainGrid", "DecalQuad", "DecalScatter")):
            bpy.data.meshes.remove(me)
    for ng in list(bpy.data.node_groups):
        if ng.name.startswith("DecalScatter"):
            bpy.data.node_groups.remove(ng)
    for tex in list(bpy.data.textures):
        if tex.name.startswith("TDS_"):
            bpy.data.textures.remove(tex)
    for ma in list(bpy.data.materials):
        if ma.name.startswith("TDS_"):
            bpy.data.materials.remove(ma)


def _lk(ng, a, b):
    ng.links.new(a, b)


def _N(ns, bl_id: str, x: float, y: float):
    n = ns.new(bl_id)
    n.location = (x, y)
    return n


# ── Terrain mesh ──────────────────────────────────────────────────────────────
def make_terrain() -> bpy.types.Object:
    """
    A subdivided grid displaced by Clouds noise.  We apply the modifier stack
    so terrain_mesh is a plain baked mesh — the Raycast node can then use it
    as a static collision target via Object Info.  Keeping it as a plain mesh
    (not GN-processed) avoids a dependency cycle where the scatter GN tree
    tries to evaluate the terrain GN tree at the same time.
    """
    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=TERRAIN_SUBDIVS,
        y_subdivisions=TERRAIN_SUBDIVS,
        size=TERRAIN_SIZE,
        location=(0, 0, 0),
    )
    ob = bpy.context.active_object
    ob.name = "terrain_mesh"

    sub = ob.modifiers.new("Sub", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 1

    tex = bpy.data.textures.new("TDS_TerrainNoise", 'CLOUDS')
    tex.noise_scale = TERRAIN_NOISE_SCALE
    tex.noise_depth = 3

    disp = ob.modifiers.new("Displace", "DISPLACE")
    disp.texture      = tex
    disp.strength     = TERRAIN_DISP_STR
    disp.texture_coords = 'LOCAL'   # LOCAL ties the pattern to the mesh, not world

    # Apply — bake displacement so terrain becomes a static target mesh
    bpy.ops.object.convert(target='MESH')

    mat = _make_terrain_material()
    ob.data.materials.append(mat)
    return ob


def _make_terrain_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("TDS_Terrain")
    mat.use_nodes = True
    ns = mat.node_tree.nodes
    ns.clear()
    out = ns.new("ShaderNodeOutputMaterial")
    out.location = (300, 0)
    pb = ns.new("ShaderNodeBsdfPrincipled")
    pb.location = (0, 0)
    pb.inputs["Base Color"].default_value = (0.14, 0.11, 0.08, 1.0)
    pb.inputs["Roughness"].default_value  = 0.88
    pb.inputs["Metallic"].default_value   = 0.0
    mat.node_tree.links.new(pb.outputs["BSDF"], out.inputs["Surface"])
    return mat


# ── Decal template mesh ────────────────────────────────────────────────────────
def make_decal_template() -> bpy.types.Object:
    """
    A minimal quad: two triangles forming a square of side 2×DECAL_HALF.
    Flat-shaded so each quad catches terrain normal lighting correctly.
    This object lives in the scene but is hidden from render — it is only
    referenced by the GN tree's Object Info node as the instance source.
    """
    bm = bmesh.new()
    h = DECAL_HALF
    v = [bm.verts.new(co) for co in [(-h, -h, 0), (h, -h, 0), (h, h, 0), (-h, h, 0)]]
    bm.faces.new(v)
    me = bpy.data.meshes.new("DecalQuad")
    bm.to_mesh(me)
    bm.free()
    me.shade_flat()

    ob = bpy.data.objects.new("decal_template", me)
    bpy.context.collection.objects.link(ob)
    ob.hide_render   = True   # invisible directly; only used as GN instance
    ob.hide_viewport = False

    mat = _make_decal_material()
    ob.data.materials.append(mat)
    return ob


def _make_decal_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("TDS_Decal")
    mat.use_nodes = True
    mat.surface_render_method = 'FORWARD'
    mat.use_backface_culling = True   # decals only visible from above surface

    ns = mat.node_tree.nodes
    ns.clear()
    out = ns.new("ShaderNodeOutputMaterial")
    out.location = (400, 0)

    emit = ns.new("ShaderNodeEmission")
    emit.location = (100, 0)
    emit.inputs["Color"].default_value    = EMISSIVE_COLOUR
    emit.inputs["Strength"].default_value = EMISSIVE_STRENGTH
    mat.node_tree.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


# ── GN tree: Raycast scatter ───────────────────────────────────────────────────
def build_gn_tree(scatter_ob: bpy.types.Object,
                  terrain_ob: bpy.types.Object,
                  decal_ob:   bpy.types.Object) -> None:
    """
    Node graph (left → right):

    [MeshGrid 4×4m, 20×20]
      → [DistributePointsOnFaces POISSON]
      → [SetPosition: override Z to EMITTER_HEIGHT]  ← lift above terrain
      → [Raycast: target=terrain_ob, dir=(0,0,-1)]
      → [BooleanMath NOT Is_Hit] → [DeleteGeometry: remove misses]
      → [SetPosition: snap to HitPosition]
      → [AlignEulerToVector Z←HitNormal: orient to surface]
      → [RandomValue FLOAT: per-point scale]
      → [CombineXYZ: scalar→vec3]
      → [InstanceOnPoints: instance=decal_ob, rotation, scale]
      → [RealizeInstances]
      → [GroupOutput]

    RELATIVE transform space is the critical detail: it imports the terrain
    mesh pre-multiplied by terrain_ob.matrix_world × scatter_ob.matrix_world⁻¹.
    With both objects at the origin this is identity, but it remains correct
    if either object is later moved.
    """
    mod = scatter_ob.modifiers.new("DecalScatterGN", "NODES")
    ng = bpy.data.node_groups.new("DecalScatter", "GeometryNodeTree")
    mod.node_group = ng
    ns = ng.nodes
    lks = ng.links

    # Interface: Group Input / Output only; no user-facing sockets needed
    grp_in  = _N(ns, "NodeGroupInput",  -1400, 0)
    grp_out = _N(ns, "NodeGroupOutput",  1600, 0)
    ng.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    # ── Emitter grid ──────────────────────────────────────────────────────────
    n_grid = _N(ns, "GeometryNodeMeshGrid", -1200, 200)
    n_grid.inputs["Size X"].default_value     = TERRAIN_SIZE
    n_grid.inputs["Size Y"].default_value     = TERRAIN_SIZE
    n_grid.inputs["Vertices X"].default_value = 20
    n_grid.inputs["Vertices Y"].default_value = 20

    # ── Distribute points ─────────────────────────────────────────────────────
    n_dist = _N(ns, "GeometryNodeDistributePointsOnFaces", -900, 200)
    n_dist.mode = 'POISSON_DISK'
    n_dist.inputs["Distance Min"].default_value = SCATTER_DIST_MIN
    n_dist.inputs["Seed"].default_value         = SCATTER_SEED
    _lk(ng, n_grid.outputs["Mesh"], n_dist.inputs["Mesh"])

    # ── Separate XY, reattach at EMITTER_HEIGHT ────────────────────────────────
    # We cannot simply translate the grid because Distribute runs BEFORE we
    # lift points.  Instead we set all distributed-point Z to EMITTER_HEIGHT
    # after distribution, preserving XY scatter positions.
    n_pos = _N(ns, "GeometryNodeInputPosition", -700, 320)
    n_sep = _N(ns, "ShaderNodeSeparateXYZ",     -500, 320)
    _lk(ng, n_pos.outputs["Position"], n_sep.inputs["Vector"])

    n_comb_up = _N(ns, "ShaderNodeCombineXYZ", -300, 320)
    _lk(ng, n_sep.outputs["X"], n_comb_up.inputs["X"])
    _lk(ng, n_sep.outputs["Y"], n_comb_up.inputs["Y"])
    n_comb_up.inputs["Z"].default_value = EMITTER_HEIGHT

    n_setp_up = _N(ns, "GeometryNodeSetPosition", -100, 200)
    _lk(ng, n_dist.outputs["Points"],      n_setp_up.inputs["Geometry"])
    _lk(ng, n_comb_up.outputs["Vector"],   n_setp_up.inputs["Position"])

    # ── Object Info: terrain as Raycast target ─────────────────────────────────
    n_obj_terrain = _N(ns, "GeometryNodeObjectInfo", -700, -100)
    n_obj_terrain.transform_space = 'RELATIVE'   # terrain in scatter's local space
    n_obj_terrain.inputs["Object"].default_value = terrain_ob

    # ── Ray direction constant: straight down ──────────────────────────────────
    n_dir = _N(ns, "ShaderNodeCombineXYZ", -700, -250)
    n_dir.inputs["X"].default_value = 0.0
    n_dir.inputs["Y"].default_value = 0.0
    n_dir.inputs["Z"].default_value = -1.0   # −Z = downward

    # ── Raycast ───────────────────────────────────────────────────────────────
    # Fires one ray per point.  Source Position defaults to each point's current
    # position (at EMITTER_HEIGHT) when left unconnected — this is intentional.
    n_ray = _N(ns, "GeometryNodeRaycast", 100, 200)
    n_ray.inputs["Ray Length"].default_value = RAY_LENGTH
    _lk(ng, n_obj_terrain.outputs["Geometry"], n_ray.inputs["Target Geometry"])
    _lk(ng, n_dir.outputs["Vector"],           n_ray.inputs["Ray Direction"])
    _lk(ng, n_setp_up.outputs["Geometry"],     n_ray.inputs[0])
    # socket[0] of Raycast is the source geometry (geometry that carries the points)

    # ── Delete points that missed the terrain ──────────────────────────────────
    # Is Hit = False means the ray escaped without intersection (border points).
    # BooleanMath(NOT) inverts: True → delete (the missed ones).
    n_not = _N(ns, "FunctionNodeBooleanMath", 300, 60)
    n_not.operation = 'NOT'
    _lk(ng, n_ray.outputs["Is Hit"], n_not.inputs[0])

    n_del = _N(ns, "GeometryNodeDeleteGeometry", 500, 200)
    n_del.domain = 'POINT'
    n_del.mode   = 'ALL'
    _lk(ng, n_ray.outputs[0],      n_del.inputs["Geometry"])
    _lk(ng, n_not.outputs["Boolean"], n_del.inputs["Selection"])

    # ── Snap to hit position on terrain surface ───────────────────────────────
    n_setp_hit = _N(ns, "GeometryNodeSetPosition", 700, 200)
    _lk(ng, n_del.outputs["Geometry"],     n_setp_hit.inputs["Geometry"])
    _lk(ng, n_ray.outputs["Hit Position"], n_setp_hit.inputs["Position"])

    # ── Align rotation: local +Z → terrain Hit Normal ─────────────────────────
    # AlignEulerToVector maps a chosen local axis toward a world vector.
    # axis='Z' ensures the quad lies flat on the surface (normal-aligned).
    n_align = _N(ns, "FunctionNodeAlignEulerToVector", 700, -100)
    n_align.axis        = 'Z'
    n_align.pivot_axis  = 'AUTO'
    _lk(ng, n_ray.outputs["Hit Normal"], n_align.inputs["Vector"])

    # ── Random per-point scale ─────────────────────────────────────────────────
    # Using a separate Seed from scatter keeps scale variation uncorrelated
    # with position — otherwise larger decals would cluster where scatter is dense.
    n_rng = _N(ns, "FunctionNodeRandomValue", 700, -300)
    n_rng.data_type = 'FLOAT'
    n_rng.inputs["Min"].default_value  = SCALE_MIN
    n_rng.inputs["Max"].default_value  = SCALE_MAX
    n_rng.inputs["Seed"].default_value = SCALE_SEED

    # Combine scalar into uniform XYZ scale vector
    n_scl_xyz = _N(ns, "ShaderNodeCombineXYZ", 900, -300)
    _lk(ng, n_rng.outputs[1], n_scl_xyz.inputs["X"])   # [1] = Value (FLOAT output)
    _lk(ng, n_rng.outputs[1], n_scl_xyz.inputs["Y"])
    _lk(ng, n_rng.outputs[1], n_scl_xyz.inputs["Z"])

    # ── Object Info: decal template as instance source ─────────────────────────
    n_obj_decal = _N(ns, "GeometryNodeObjectInfo", 700, -500)
    n_obj_decal.transform_space = 'RELATIVE'
    n_obj_decal.inputs["Object"].default_value = decal_ob

    # ── Instance on points ─────────────────────────────────────────────────────
    n_inst = _N(ns, "GeometryNodeInstanceOnPoints", 1100, 200)
    _lk(ng, n_setp_hit.outputs["Geometry"],     n_inst.inputs["Points"])
    _lk(ng, n_obj_decal.outputs["Geometry"],    n_inst.inputs["Instance"])
    _lk(ng, n_align.outputs["Rotation"],        n_inst.inputs["Rotation"])
    _lk(ng, n_scl_xyz.outputs["Vector"],        n_inst.inputs["Scale"])

    # ── Realize instances → group output ──────────────────────────────────────
    n_real = _N(ns, "GeometryNodeRealizeInstances", 1300, 200)
    _lk(ng, n_inst.outputs["Instances"], n_real.inputs["Geometry"])
    _lk(ng, n_real.outputs["Geometry"],  grp_out.inputs["Geometry"])


# ── Export ────────────────────────────────────────────────────────────────────
def export_glb(scatter_ob: bpy.types.Object,
               terrain_ob: bpy.types.Object) -> None:
    for ob in bpy.context.scene.objects:
        ob.select_set(ob in (scatter_ob, terrain_ob))
    bpy.context.view_layer.objects.active = scatter_ob
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_PATH,
        use_selection=True,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_apply=True,          # bake GN modifier before export
        export_yup=True,            # +Y up for WebXR / Three.js convention
    )
    print(f"Exported → {EXPORT_PATH}")


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    _purge()

    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'

    terrain = make_terrain()
    decal_t = make_decal_template()

    # Scatter host: a near-empty mesh object; GN supplies all geometry
    me_host = bpy.data.meshes.new("DecalScatterHost")
    scatter = bpy.data.objects.new("decal_scatter", me_host)
    bpy.context.collection.objects.link(scatter)
    bpy.context.view_layer.objects.active = scatter

    build_gn_tree(scatter, terrain, decal_t)

    # Camera
    cam_data = bpy.data.cameras.new("Cam")
    cam = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = (3.5, -3.5, 3.0)
    cam.rotation_euler = (1.05, 0.0, 0.785)
    scene.camera = cam

    # World background
    scene.world = bpy.data.worlds.new("World")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value    = (0.02, 0.02, 0.04, 1.0)
        bg.inputs["Strength"].default_value = 0.6

    # Sun lamp
    lamp_d = bpy.data.lights.new("Sun", 'SUN')
    lamp_d.energy = 3.0
    lamp = bpy.data.objects.new("Sun", lamp_d)
    bpy.context.collection.objects.link(lamp)
    lamp.rotation_euler = (0.6, 0.0, 0.3)

    export_glb(scatter, terrain)
    print("Blueprint complete.  Run record.py for viewport animation.")


if __name__ == "__main__":
    main()
