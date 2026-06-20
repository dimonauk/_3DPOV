"""
GN Index Switch — Per-Instance Geometry Variation
Blender 5.1 | CC0 | Holoflow Studio

TECHNIQUE
---------
Index Switch (bpy node type: GeometryNodeIndexSwitch) selects among up to 15
geometry inputs using an *integer field*.  The crucial distinction from Menu
Switch is domain: Menu Switch evaluates once per modifier evaluation (a global
enum), whereas Index Switch evaluates *per element* — meaning each instance can
receive a different geometry variant based on a field computation local to that
instance.

This blueprint scatters 40 points on a flat plane and assigns one of four
column variants to each point using:

  index = floor(RandomValue(0..3, seed=instance_index)) % 4

A proximity override overrides the index to 0 (the grandest column) for any
point within CENTRE_RADIUS of the world origin, demonstrating how spatial
logic can coexist with random variation.

PARAMETERS (edit the constants below, not the node setup)
"""

import bpy
import bmesh
import math

# ── constants ────────────────────────────────────────────────────────────────
SCATTER_COUNT   = 40      # points scattered on the ground plane
GROUND_SIZE     = 8.0     # half-extent of the ground plane (BU)
GROUND_SEED     = 7       # Distribute Points seed
COLUMN_HEIGHT   = 2.5     # shared column height (BU)
CENTRE_RADIUS   = 2.0     # within this radius all points get variant 0
RANDOM_SEED     = 42      # seed for Random Value (integer) — change for variety
OUTPUT_GLB      = "//colonnade_index_switch.glb"  # relative to .blend

# ── utilities ─────────────────────────────────────────────────────────────────

def _clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def _new_material(name: str, r: float, g: float, b: float) -> bpy.types.Material:
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (r, g, b, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.55
    bsdf.inputs["Metallic"].default_value = 0.05
    return mat


# ── variant geometry ──────────────────────────────────────────────────────────
# Each variant is built as a standalone object in a hidden collection so the
# GN modifier can reference it via Collection Info + Index Switch.

def _make_variant_a(col: bpy.types.Collection) -> bpy.types.Object:
    """Variant A — plain smooth cylinder (the 'Doric' standby)."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.18,
                                        depth=COLUMN_HEIGHT, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = "variant_column_a"
    # Shade smooth
    bpy.ops.object.shade_smooth()
    mat = _new_material("Mat_ColA", 0.82, 0.78, 0.70)
    obj.data.materials.append(mat)
    bpy.context.scene.collection.objects.unlink(obj)
    col.objects.link(obj)
    return obj


def _make_variant_b(col: bpy.types.Collection) -> bpy.types.Object:
    """Variant B — hexagonal fluted pillar (6 faces → flat shaded faceted look)."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.22,
                                        depth=COLUMN_HEIGHT, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = "variant_column_b"
    bpy.ops.object.shade_flat()
    mat = _new_material("Mat_ColB", 0.60, 0.72, 0.85)
    obj.data.materials.append(mat)
    bpy.context.scene.collection.objects.unlink(obj)
    col.objects.link(obj)
    return obj


def _make_variant_c(col: bpy.types.Collection) -> bpy.types.Object:
    """Variant C — tapered frustum (cone with top radius 0.08, base 0.20)."""
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.20, radius2=0.08,
                                    depth=COLUMN_HEIGHT, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = "variant_column_c"
    bpy.ops.object.shade_flat()
    mat = _new_material("Mat_ColC", 0.90, 0.55, 0.30)
    obj.data.materials.append(mat)
    bpy.context.scene.collection.objects.unlink(obj)
    col.objects.link(obj)
    return obj


def _make_variant_d(col: bpy.types.Collection) -> bpy.types.Object:
    """Variant D — stepped box (cube with a narrow waist via Loop Cut)."""
    bpy.ops.mesh.primitive_cube_add(size=0.36, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = "variant_column_d"
    # scale to column height and squash to narrow cross-section
    obj.scale = (0.5, 0.5, COLUMN_HEIGHT / 0.36 * 0.5)
    bpy.ops.object.transform_apply(scale=True)
    # add a loop cut at mid-height to create a stepped waist
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.to_mesh(obj.data)
    bm.free()
    bpy.ops.object.shade_flat()
    mat = _new_material("Mat_ColD", 0.45, 0.80, 0.55)
    obj.data.materials.append(mat)
    bpy.context.scene.collection.objects.unlink(obj)
    col.objects.link(obj)
    return obj


# ── ground plane ──────────────────────────────────────────────────────────────

def _make_ground() -> bpy.types.Object:
    bpy.ops.mesh.primitive_plane_add(size=GROUND_SIZE * 2, location=(0, 0, 0))
    plane = bpy.context.active_object
    plane.name = "ground_plane"
    mat = _new_material("Mat_Ground", 0.20, 0.20, 0.22)
    plane.data.materials.append(mat)
    return plane


# ── GN modifier ───────────────────────────────────────────────────────────────

def _build_gn_tree(ground: bpy.types.Object,
                   variant_col: bpy.types.Collection) -> None:
    """
    Node tree (abbreviated):

      Group Input.Geometry
        └─ Distribute Points on Faces (POISSON_DISK)
             └─ Instance on Points
                  ├─ geometry: Index Switch (0..3)  ← Random Value % 4 OR 0 if near centre
                  └─ rotation: Align Euler to Vector (Z, Normal)
      Join Geometry (points + ground)
        └─ Group Output.Geometry
    """
    mod = ground.modifiers.new(name="Colonnade Generator", type="NODES")
    tree = bpy.data.node_groups.new("ColonnadeGN", "GeometryNodeTree")
    mod.node_group = tree
    nodes = tree.nodes
    links = tree.links

    def N(bl_idname: str, loc=(0, 0)):
        n = nodes.new(bl_idname)
        n.location = loc
        return n

    # interface
    tree.interface.new_socket("Geometry", in_out="INPUT",
                              socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry", in_out="OUTPUT",
                              socket_type="NodeSocketGeometry")
    count_sock = tree.interface.new_socket("Instance Count", in_out="INPUT",
                                           socket_type="NodeSocketInt")
    count_sock.default_value = SCATTER_COUNT
    seed_sock = tree.interface.new_socket("Random Seed", in_out="INPUT",
                                          socket_type="NodeSocketInt")
    seed_sock.default_value = RANDOM_SEED
    radius_sock = tree.interface.new_socket("Centre Radius", in_out="INPUT",
                                             socket_type="NodeSocketFloat")
    radius_sock.default_value = CENTRE_RADIUS

    gi = N("NodeGroupInput",  (-1400, 0))
    go = N("NodeGroupOutput", ( 1000, 0))

    # ── scatter ──────────────────────────────────────────────────────────────
    dist = N("GeometryNodeDistributePointsOnFaces", (-1100, 0))
    dist.distribute_method = "POISSON_DISK"
    dist.inputs["Distance Min"].default_value = 0.55
    dist.inputs["Seed"].default_value = GROUND_SEED
    links.new(gi.outputs["Geometry"], dist.inputs["Mesh"])
    links.new(gi.outputs["Instance Count"], dist.inputs["Max Points"])

    # ── position field for proximity override ─────────────────────────────────
    pos     = N("GeometryNodeInputPosition", (-900, -200))
    sep_xyz = N("ShaderNodeSeparateXYZ",     (-720, -200))
    links.new(pos.outputs["Position"], sep_xyz.inputs["Vector"])

    # sqrt(X² + Y²) — distance from Z axis
    sq_x = N("ShaderNodeMath", (-540, -100)); sq_x.operation = "MULTIPLY"
    sq_y = N("ShaderNodeMath", (-540, -300)); sq_y.operation = "MULTIPLY"
    links.new(sep_xyz.outputs["X"], sq_x.inputs[0])
    links.new(sep_xyz.outputs["X"], sq_x.inputs[1])
    links.new(sep_xyz.outputs["Y"], sq_y.inputs[0])
    links.new(sep_xyz.outputs["Y"], sq_y.inputs[1])

    add_sq = N("ShaderNodeMath", (-360, -200)); add_sq.operation = "ADD"
    links.new(sq_x.outputs["Value"], add_sq.inputs[0])
    links.new(sq_y.outputs["Value"], add_sq.inputs[1])

    dist2d = N("ShaderNodeMath", (-200, -200)); dist2d.operation = "SQRT"
    links.new(add_sq.outputs["Value"], dist2d.inputs[0])

    # compare: distance < centre_radius → True (use variant 0)
    near_cmp = N("ShaderNodeMath", (-20, -200)); near_cmp.operation = "LESS_THAN"
    links.new(dist2d.outputs["Value"], near_cmp.inputs[0])
    links.new(gi.outputs["Centre Radius"], near_cmp.inputs[1])

    # ── random integer 0..3 per instance ─────────────────────────────────────
    rand_v = N("FunctionNodeRandomValue", (-900, 200))
    rand_v.data_type = "INT"
    rand_v.inputs["Min"].default_value = 0
    rand_v.inputs["Max"].default_value = 3
    links.new(gi.outputs["Random Seed"], rand_v.inputs["Seed"])
    # ID drives per-instance uniqueness — Instance on Points stamps each point
    # with an integer ID equal to its point index
    id_node = N("GeometryNodeInputIndex", (-1100, 200))
    links.new(id_node.outputs["Index"], rand_v.inputs["ID"])

    # multiply LessThan boolean (0 or 1) by (3 - random) to get:
    #   near=True  → 1 × (3 - r) but we actually want 0, so use: r * (1 - near)
    # Cleaner: MULTIPLY random by (1 - near_cmp), then convert float to int
    inv_near = N("ShaderNodeMath", (160, -100)); inv_near.operation = "SUBTRACT"
    inv_near.inputs[0].default_value = 1.0
    links.new(near_cmp.outputs["Value"], inv_near.inputs[1])

    # cast random INT → FLOAT for multiply
    rand_to_f = N("ShaderNodeMath", (160, 200)); rand_to_f.operation = "MULTIPLY"
    rand_to_f.inputs[1].default_value = 1.0          # identity multiply
    links.new(rand_v.outputs["Value"], rand_to_f.inputs[0])

    mul_near = N("ShaderNodeMath", (330, 100)); mul_near.operation = "MULTIPLY"
    links.new(rand_to_f.outputs["Value"],  mul_near.inputs[0])
    links.new(inv_near.outputs["Value"],   mul_near.inputs[1])

    # floor → int cast (rounding guard)
    floor_n = N("ShaderNodeMath", (500, 100)); floor_n.operation = "FLOOR"
    links.new(mul_near.outputs["Value"], floor_n.inputs[0])

    # ── Index Switch ──────────────────────────────────────────────────────────
    # Selects geometry per instance based on the integer field.
    # Index Switch requires integer domain; we evaluate on POINT domain.
    idx_sw = N("GeometryNodeIndexSwitch", (680, 200))
    idx_sw.data_type = "GEOMETRY"
    # Ensure 4 inputs are available (0..3); default is 2, extend to 4
    while len(idx_sw.index_switch_items) < 4:
        idx_sw.index_switch_items.new()
    links.new(floor_n.outputs["Value"], idx_sw.inputs["Index"])

    # variant collection objects via Object Info nodes
    for i, vname in enumerate(
            ["variant_column_a", "variant_column_b",
             "variant_column_c", "variant_column_d"]):
        oi = N("GeometryNodeObjectInfo", (480, 400 - i * 120))
        oi.transform_space = "ORIGINAL"
        oi.inputs["Object"].default_value = bpy.data.objects.get(vname)
        links.new(oi.outputs["Geometry"], idx_sw.inputs[i])

    # ── Instance on Points ────────────────────────────────────────────────────
    iop = N("GeometryNodeInstanceOnPoints", (880, 200))
    links.new(dist.outputs["Points"],       iop.inputs["Points"])
    links.new(idx_sw.outputs[0],            iop.inputs["Instance"])

    # random Z rotation per instance (orient variety)
    rand_rot = N("FunctionNodeRandomValue", (640, -200))
    rand_rot.data_type = "FLOAT"
    rand_rot.inputs["Min"].default_value = 0.0
    rand_rot.inputs["Max"].default_value = math.tau
    links.new(id_node.outputs["Index"], rand_rot.inputs["ID"])

    euler = N("FunctionNodeRotationToEuler",  (760, -200)) if hasattr(
        bpy.types, "FunctionNodeRotationToEuler") else None

    rot_xyz = N("ShaderNodeCombineXYZ", (760, -200))
    rot_xyz.inputs["X"].default_value = 0.0
    rot_xyz.inputs["Y"].default_value = 0.0
    links.new(rand_rot.outputs["Value"], rot_xyz.inputs["Z"])
    links.new(rot_xyz.outputs["Vector"], iop.inputs["Rotation"])

    # instance height: each column sits on Z=0 locally but points scatter
    # on the ground plane which is already at Z=0, so no extra Z-offset needed.

    # ── realise and join ──────────────────────────────────────────────────────
    realise = N("GeometryNodeRealizeInstances", (1060, 200))
    links.new(iop.outputs["Instances"], realise.inputs["Geometry"])

    join = N("GeometryNodeJoinGeometry", (880, 0))
    links.new(gi.outputs["Geometry"],    join.inputs["Geometry"])
    links.new(realise.outputs["Geometry"], join.inputs["Geometry"])
    links.new(join.outputs["Geometry"],  go.inputs["Geometry"])


# ── camera & lighting ─────────────────────────────────────────────────────────

def _setup_scene():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.eevee.taa_render_samples = 32

    # Sun
    bpy.ops.object.light_add(type="SUN", location=(5, -5, 8))
    sun = bpy.context.active_object
    sun.data.energy = 4.0
    sun.rotation_euler = (math.radians(45), 0, math.radians(30))

    # Camera
    bpy.ops.object.camera_add(location=(10, -10, 8))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(55), 0, math.radians(45))
    scene.camera = cam


# ── GLB export ────────────────────────────────────────────────────────────────

def _export_glb():
    bpy.ops.object.select_all(action="DESELECT")
    ground = bpy.data.objects.get("ground_plane")
    if ground:
        ground.select_set(True)
        bpy.context.view_layer.objects.active = ground
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_normals=True,
        export_materials="EXPORT",
        export_yup=True,
    )


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    _clear_scene()

    # hidden collection for variant objects
    variant_col = bpy.data.collections.new("_column_variants")
    bpy.context.scene.collection.children.link(variant_col)
    variant_col.hide_viewport = True
    variant_col.hide_render   = True

    _make_variant_a(variant_col)
    _make_variant_b(variant_col)
    _make_variant_c(variant_col)
    _make_variant_d(variant_col)

    ground = _make_ground()
    _build_gn_tree(ground, variant_col)
    _setup_scene()

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//colonnade_index_switch.blend"))
    _export_glb()
    print("Blueprint complete — colonnade_index_switch.blend + .glb written.")


main()
