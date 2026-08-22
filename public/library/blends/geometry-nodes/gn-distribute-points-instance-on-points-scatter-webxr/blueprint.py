# ─────────────────────────────────────────────────────────────────────────────
# BLUEPRINT: GN Distribute Points on Faces + Instance on Points
#            Procedural Crystal Garden Scatter — Blender 5.1 / holoflow studio
#
# Technique:
#   Distribute Points on Faces in POISSON_DISK mode scatters sample points
#   over a mesh surface while enforcing a minimum inter-point distance — the
#   key distinction from RANDOM mode, which can stack instances on top of each
#   other when density is high. Instance on Points then pins a mesh drawn from
#   a collection (three crystal spike variants) to each point, picking the
#   variant via a stable per-point random integer. The Rotation socket from
#   Distribute Points carries surface-normal alignment automatically; a second
#   RandomValue node adds per-instance Z-spin so crystals don't all face the
#   same way. RealizeInstances collapses everything to concrete vertex data
#   before GLB export — Draco L6 requires real geometry, not GN instance refs.
#
# Source: Blender Foundation Documentation Team, CC-BY-SA 4.0
#   https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/point/
#   https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/instances/
# ─────────────────────────────────────────────────────────────────────────────
import bpy
import bmesh
import mathutils
import math

# ── Parameters (edit these before running) ───────────────────────────────────
TERRAIN_RADIUS    = 1.2    # metres — hexagonal terrain pad radius
TERRAIN_SEGMENTS  = 6      # hex tile sides
SCATTER_DENSITY   = 18.0   # points/m² in RANDOM mode (unused in Poisson path)
POISSON_MIN_DIST  = 0.12   # minimum inter-instance gap (metres), Poisson mode
SEED              = 7      # stable integer seed — change for different layouts
SCALE_MIN         = 0.35   # smallest crystal (relative to crystal geometry)
SCALE_MAX         = 1.15   # tallest crystal
BLEND_PATH = "//hf_crystal_scatter.blend"
GLB_PATH   = "//hf_crystal_scatter.glb"

# ── Scene reset ──────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for col in list(bpy.data.collections):
    bpy.data.collections.remove(col)

# ── Crystal collection ───────────────────────────────────────────────────────
crystal_col = bpy.data.collections.new("HF_Crystals")
bpy.context.scene.collection.children.link(crystal_col)

def make_crystal(name, verts_base, height, tip_height, base_r, link_col):
    """
    Hexagonal spike: an n-sided prism body (height) capped by a pyramid tip
    (tip_height). Flat-shaded so each face reads as a distinct plane — this
    is the faceted look the studio uses for all crystal geometry.
    """
    bm = bmesh.new()
    n = verts_base
    # Base ring
    base_ring = [
        bm.verts.new(mathutils.Vector((
            base_r * math.cos(2*math.pi * i/n),
            base_r * math.sin(2*math.pi * i/n),
            0.0)))
        for i in range(n)
    ]
    # Top ring (same radius, at 'height')
    top_ring = [
        bm.verts.new(mathutils.Vector((
            base_r * math.cos(2*math.pi * i/n),
            base_r * math.sin(2*math.pi * i/n),
            height)))
        for i in range(n)
    ]
    # Apex
    apex = bm.verts.new(mathutils.Vector((0, 0, height + tip_height)))
    bm.verts.ensure_lookup_table()

    # Side quads (body)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new([base_ring[i], base_ring[j], top_ring[j], top_ring[i]])

    # Tip triangles
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new([top_ring[i], top_ring[j], apex])

    # Bottom cap (polygon — will be hidden by terrain)
    bm.faces.new(list(reversed(base_ring)))

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()

    # Flat shading: no smooth-shade so each facet reads clean
    for poly in mesh.polygons:
        poly.use_smooth = False

    obj = bpy.data.objects.new(name, mesh)
    link_col.objects.link(obj)
    return obj

# Three variants — height and tip proportions differ deliberately so the
# scatter reads as a natural cluster rather than a stamped pattern.
make_crystal("Crystal_A", verts_base=6, height=0.22, tip_height=0.18, base_r=0.045, link_col=crystal_col)
make_crystal("Crystal_B", verts_base=4, height=0.14, tip_height=0.28, base_r=0.035, link_col=crystal_col)
make_crystal("Crystal_C", verts_base=6, height=0.08, tip_height=0.10, base_r=0.055, link_col=crystal_col)

# ── Terrain pad ──────────────────────────────────────────────────────────────
bm_ter = bmesh.new()
# Hexagonal disc: one centre vert + ring — creates a fan of triangles
centre = bm_ter.verts.new(mathutils.Vector((0, 0, 0)))
ring = [
    bm_ter.verts.new(mathutils.Vector((
        TERRAIN_RADIUS * math.cos(2*math.pi * i/TERRAIN_SEGMENTS),
        TERRAIN_RADIUS * math.sin(2*math.pi * i/TERRAIN_SEGMENTS),
        0.0)))
    for i in range(TERRAIN_SEGMENTS)
]
bm_ter.verts.ensure_lookup_table()
for i in range(TERRAIN_SEGMENTS):
    j = (i + 1) % TERRAIN_SEGMENTS
    bm_ter.faces.new([centre, ring[i], ring[j]])

ter_mesh = bpy.data.meshes.new("HF_Terrain")
bm_ter.to_mesh(ter_mesh)
bm_ter.free()
for poly in ter_mesh.polygons:
    poly.use_smooth = False

terrain = bpy.data.objects.new("HF_Terrain", ter_mesh)
bpy.context.scene.collection.objects.link(terrain)

# ── GN node tree ─────────────────────────────────────────────────────────────
mod  = terrain.modifiers.new("GN_CrystalScatter", "NODES")
tree = bpy.data.node_groups.new("HF_CrystalScatter_Tree", "GeometryNodeTree")
mod.node_group = tree
nodes = tree.nodes
links = tree.links

# Group interface sockets — expose only what matters for the scene panel
tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
s_dist = tree.interface.new_socket("Min Distance", in_out="INPUT", socket_type="NodeSocketFloat")
s_dist.default_value = POISSON_MIN_DIST; s_dist.min_value = 0.02; s_dist.max_value = 1.0
s_seed = tree.interface.new_socket("Seed", in_out="INPUT", socket_type="NodeSocketInt")
s_seed.default_value = SEED; s_seed.min_value = 0; s_seed.max_value = 9999
tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
mod["Input_2"] = POISSON_MIN_DIST
mod["Input_3"] = SEED

def N(t, x=0, y=0):
    n = nodes.new(t); n.location = (x, y); return n

gi  = N("NodeGroupInput",  -1200, 0)
go  = N("NodeGroupOutput",   800, 0)

# Distribute points — POISSON_DISK enforces minimum spacing
dist = N("GeometryNodeDistributePointsOnFaces", -800, 80)
# distribute_method property switches socket layout; set BEFORE linking
dist.distribute_method = 'POISSON_DISK'
links.new(gi.outputs["Geometry"],     dist.inputs["Mesh"])
links.new(gi.outputs["Min Distance"], dist.inputs["Distance Min"])
links.new(gi.outputs["Seed"],         dist.inputs["Seed"])
# Density Max: how many points per m² as an upper ceiling in Poisson mode.
# The algorithm then thins by enforcing Distance Min, so the actual count
# is lower. 200 gives enough candidates for the Poisson solver to work with.
dist.inputs["Density Max"].default_value = 200.0

# Collection info — feeds all three crystal objects as the instance pool
col_info = N("GeometryNodeCollectionInfo", -800, -200)
col_info.inputs["Collection"].default_value = crystal_col
# use_relative_transform=False: instances inherit object transforms from
# their own object origins (bottom of each crystal = world origin).
col_info.transform_space = 'RELATIVE'
col_info.inputs["Separate Children"].default_value = True
col_info.inputs["Reset Children"].default_value    = False

# Random scale per point — seed offset by +1 so it's independent of dist seed
rand_scale = N("FunctionNodeRandomValue", -500, -80)
rand_scale.data_type = 'FLOAT'
rand_scale.inputs["Min"].default_value = SCALE_MIN
rand_scale.inputs["Max"].default_value = SCALE_MAX
rand_scale.inputs["Seed"].default_value = SEED + 1   # independent RNG stream

# Random instance index — picks which crystal variant (0, 1, or 2)
rand_idx = N("FunctionNodeRandomValue", -500, -240)
rand_idx.data_type = 'INT'
rand_idx.inputs["Min"].default_value = 0
rand_idx.inputs["Max"].default_value = 2   # three variants in collection
rand_idx.inputs["Seed"].default_value = SEED + 2   # third independent stream

# Instance on Points
#   Pick Instance = True: uses Instance Index to pick from the Instances geometry
#   Rotation socket: surface-normal rotation from Distribute (Z-up = face normal)
#   Scale socket: uniform float from rand_scale → replicated to all three axes
inst = N("GeometryNodeInstanceOnPoints", -100, 0)
inst.inputs["Pick Instance"].default_value = True
links.new(dist.outputs["Points"],        inst.inputs["Points"])
links.new(dist.outputs["Rotation"],      inst.inputs["Rotation"])
links.new(col_info.outputs["Instances"], inst.inputs["Instance"])
links.new(rand_scale.outputs["Value"],   inst.inputs["Scale"])
links.new(rand_idx.outputs["Value"],     inst.inputs["Instance Index"])

# Realize instances: collapse GN instance refs to concrete mesh data.
# Without this, GLB export sees an empty mesh — gltf exporter cannot
# serialise GN instance geometry that hasn't been realized.
real = N("GeometryNodeRealizeInstances", 300, 0)
links.new(inst.outputs["Instances"], real.inputs["Geometry"])

# Pass-through the terrain geometry alongside the realized crystals
join = N("GeometryNodeJoinGeometry", 550, 0)
links.new(gi.outputs["Geometry"],    join.inputs["Geometry"])
links.new(real.outputs["Geometry"],  join.inputs["Geometry"])
links.new(join.outputs["Geometry"],  go.inputs["Geometry"])

# ── Materials ─────────────────────────────────────────────────────────────────
# Crystal: translucent lilac — Principled BSDF Transmission + Roughness=0
mat_crystal = bpy.data.materials.new("HF_Crystal")
mat_crystal.use_nodes = True
bsdf = mat_crystal.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value       = (0.62, 0.42, 0.92, 1.0)
bsdf.inputs["Roughness"].default_value        = 0.05
bsdf.inputs["Transmission Weight"].default_value = 0.6

mat_terrain = bpy.data.materials.new("HF_Terrain")
mat_terrain.use_nodes = True
bsdf_t = mat_terrain.node_tree.nodes["Principled BSDF"]
bsdf_t.inputs["Base Color"].default_value = (0.18, 0.14, 0.22, 1.0)
bsdf_t.inputs["Roughness"].default_value  = 0.85

for obj in crystal_col.objects:
    obj.data.materials.append(mat_crystal)
terrain.data.materials.append(mat_terrain)

# ── Apply modifier + export ──────────────────────────────────────────────────
bpy.context.view_layer.update()
bpy.context.view_layer.objects.active = terrain
terrain.select_set(True)

bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_PATH))

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(GLB_PATH),
    export_format='GLB',
    use_selection=False,    # export all — terrain + crystals both in scene
    export_yup=True,
    export_apply=True,      # applies GN modifier so crystals appear in GLB
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_materials='EXPORT',
    export_texcoords=False,  # no UVs on these procedural meshes
    export_normals=True,
)
print("GLB written:", bpy.path.abspath(GLB_PATH))
