"""
HF GN Distribute Points on Faces — Poisson Disc Scatter
Blender 5.1 · CC0 — Holoflow Studio

Technique
---------
Distribute Points on Faces (Poisson Disc mode) places points on a mesh
surface such that no two points are closer than ``Distance Min``.  The
critical art-direction layer is the *density field*: a vertex-group weight
attribute named "scatter_density" is read via a Named Attribute node and
multiplied by Density Max before reaching the distribute node.  Painting
that vertex group gives brush-level control over where rocks appear—no
extra mask geometry, no material override.

Instance on Points then places a randomly-selected member of a collection
(three faceted rock variants) at each scatter point with:
  • Face-normal-aligned rotation from the Distribute node's Rotation output
  • Random yaw (0–2π) added via Rotate Euler (AXIS_ANGLE, local Z)
  • Uniform random scale clamped between SCALE_MIN and SCALE_MAX

Output
------
  blend:  scatter_terrain.blend   (this directory)
  glb:    public/library/glbs/geometry-nodes/
            gn-distribute-points-faces-poisson-scatter/scatter_terrain.glb
"""

import bpy
import bmesh
import math
import mathutils
import os

# ── Constants ─────────────────────────────────────────────────────────────────
TERRAIN_SUBDIVISIONS = 12        # grid resolution — more = smoother weight mask
TERRAIN_SIZE         = 4.0       # plane side length in metres
DENSITY_MAX          = 6.0       # max scatter points/m² at vertex weight 1.0
MIN_DISTANCE         = 0.25      # Poisson minimum separation in metres
SEED                 = 42
SCALE_MIN            = 0.08      # smallest rock world-space scale
SCALE_MAX            = 0.22      # largest rock world-space scale
WEIGHT_GROUP         = "scatter_density"
GN_TREE_NAME         = "HF_ScatterDensityMask"
BLEND_OUT = bpy.path.abspath("//scatter_terrain.blend")
GLB_OUT   = bpy.path.abspath(
    "//../../../../glbs/geometry-nodes/"
    "gn-distribute-points-faces-poisson-scatter/scatter_terrain.glb"
)

# ── Purge previous run ────────────────────────────────────────────────────────
def _purge() -> None:
    for name in ("scatter_terrain", "rock_a", "rock_b", "rock_c"):
        if name in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
    if "HF_ScatterCollection" in bpy.data.collections:
        bpy.data.collections.remove(bpy.data.collections["HF_ScatterCollection"])
    if GN_TREE_NAME in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[GN_TREE_NAME])

_purge()

# ── Low-poly rock instances ───────────────────────────────────────────────────
def _make_rock(name: str, jitter: float = 0.0) -> bpy.types.Object:
    """Faceted gem-like polyhedron.  Jitter perturbs vertices for variant feel."""
    import random
    rng = random.Random(hash(name))

    raw = [
        ( 0.00,  0.00,  0.50),
        ( 0.42,  0.00,  0.18),
        (-0.21,  0.36,  0.18),
        (-0.21, -0.36,  0.18),
        ( 0.30,  0.26, -0.10),
        ( 0.30, -0.26, -0.10),
        (-0.40,  0.00, -0.10),
        ( 0.00,  0.00, -0.48),
    ]
    bm = bmesh.new()
    verts = [
        bm.verts.new(mathutils.Vector((
            rx + rng.uniform(-jitter, jitter),
            ry + rng.uniform(-jitter, jitter),
            rz + rng.uniform(-jitter, jitter),
        )))
        for rx, ry, rz in raw
    ]
    bm.verts.ensure_lookup_table()
    for fi in [
        (0,1,2),(0,2,3),(0,3,1),
        (1,4,2),(2,4,6),(2,6,3),(3,6,5),(3,5,1),(1,5,4),
        (4,5,7),(5,6,7),(6,4,7),
    ]:
        try:
            bm.faces.new([verts[i] for i in fi])
        except ValueError:
            pass
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob

rock_a = _make_rock("rock_a", jitter=0.00)
rock_b = _make_rock("rock_b", jitter=0.06)
rock_c = _make_rock("rock_c", jitter=0.10)

rock_b.data.transform(mathutils.Matrix.Rotation(math.radians(37), 4, 'Z'))
rock_c.data.transform(mathutils.Matrix.Rotation(math.radians(71), 4, 'Z'))

scatter_col = bpy.data.collections.new("HF_ScatterCollection")
bpy.context.scene.collection.children.link(scatter_col)
for rock in (rock_a, rock_b, rock_c):
    bpy.context.scene.collection.objects.unlink(rock)
    scatter_col.objects.link(rock)
    rock.hide_render   = True   # instances render; originals are prototypes only
    rock.hide_viewport = True

# ── Terrain with vertex-group density mask ────────────────────────────────────
bm = bmesh.new()
bmesh.ops.create_grid(
    bm,
    x_segments = TERRAIN_SUBDIVISIONS,
    y_segments = TERRAIN_SUBDIVISIONS,
    size       = TERRAIN_SIZE / 2,   # create_grid expects half-extent
)
terrain_me = bpy.data.meshes.new("scatter_terrain")
bm.to_mesh(terrain_me); bm.free()
terrain_ob = bpy.data.objects.new("scatter_terrain", terrain_me)
bpy.context.scene.collection.objects.link(terrain_ob)

# Radial falloff centred at origin + secondary lobe at (1.2, 1.0).
# Painting these weights via the Weight Paint tool adjusts density live.
vg = terrain_ob.vertex_groups.new(name=WEIGHT_GROUP)
for v in terrain_me.vertices:
    x, y = v.co.x, v.co.y
    r0 = math.sqrt(x ** 2 + y ** 2)
    r1 = math.sqrt((x - 1.2) ** 2 + (y - 1.0) ** 2)
    w  = min(1.0, max(0.0, 1.0 - r0 / 1.8) + max(0.0, 1.0 - r1 / 0.9))
    vg.add([v.index], w, 'REPLACE')

# ── Geometry Nodes tree ───────────────────────────────────────────────────────
ng    = bpy.data.node_groups.new(GN_TREE_NAME, "GeometryNodeTree")
iface = ng.interface
nodes = ng.nodes
links = ng.links

iface.new_socket("Geometry",    in_out="INPUT",  socket_type="NodeSocketGeometry")
iface.new_socket("Geometry",    in_out="OUTPUT", socket_type="NodeSocketGeometry")

s_dmax             = iface.new_socket("Density Max",  in_out="INPUT",
                         socket_type="NodeSocketFloat")
s_dmax.default_value = DENSITY_MAX
s_dmax.min_value     = 0.0
s_dmax.max_value     = 30.0

s_mind             = iface.new_socket("Min Distance", in_out="INPUT",
                         socket_type="NodeSocketFloat")
s_mind.subtype       = "DISTANCE"
s_mind.default_value = MIN_DISTANCE
s_mind.min_value     = 0.01
s_mind.max_value     = 2.0

s_smin             = iface.new_socket("Scale Min",    in_out="INPUT",
                         socket_type="NodeSocketFloat")
s_smin.default_value = SCALE_MIN

s_smax             = iface.new_socket("Scale Max",    in_out="INPUT",
                         socket_type="NodeSocketFloat")
s_smax.default_value = SCALE_MAX

s_seed             = iface.new_socket("Seed",         in_out="INPUT",
                         socket_type="NodeSocketInt")
s_seed.default_value = SEED

# Nodes
n_in   = nodes.new("NodeGroupInput");  n_in.location  = (-700,  0)
n_out  = nodes.new("NodeGroupOutput"); n_out.location  = ( 900,  0)

# Named Attribute reads the vertex group as a per-vertex float field.
# Blender's field evaluation engine interpolates it to face domain automatically
# when it reaches the Density Max socket on Distribute Points on Faces.
n_attr = nodes.new("GeometryNodeInputNamedAttribute")
n_attr.data_type                    = "FLOAT"
n_attr.inputs["Name"].default_value = WEIGHT_GROUP
n_attr.location                     = (-500, -200)

# Scale density linearly with the painted weight.
n_mul           = nodes.new("ShaderNodeMath")
n_mul.operation = "MULTIPLY"
n_mul.location  = (-280, -160)

# Distribute Points on Faces in Poisson Disc mode.
n_dist                   = nodes.new("GeometryNodeDistributePointsOnFaces")
n_dist.distribute_method = "POISSON"
n_dist.location          = (-60, 80)

# Random yaw: each scatter point gets a unique spin around its local Z.
# Using the same Seed as the distribute node is intentional — different node
# IDs mean each Random Value produces an independent sequence even with
# identical seeds.
n_ryaw              = nodes.new("FunctionNodeRandomValue")
n_ryaw.data_type    = "FLOAT"
n_ryaw.inputs["Min"].default_value = 0.0
n_ryaw.inputs["Max"].default_value = math.tau
n_ryaw.location     = (180, -120)

# Rotate Euler adds the random yaw on top of the face-normal rotation that
# Distribute Points on Faces already provides on its Rotation output.
# AXIS_ANGLE + LOCAL rotates around the instance's own Z after alignment.
n_rote        = nodes.new("FunctionNodeRotateEuler")
n_rote.type   = "AXIS_ANGLE"
n_rote.space  = "LOCAL"
n_rote.inputs["Axis"].default_value = (0.0, 0.0, 1.0)
n_rote.location = (420, -60)

# Random uniform scale — same value on X/Y/Z keeps the rock proportional.
n_rscl              = nodes.new("FunctionNodeRandomValue")
n_rscl.data_type    = "FLOAT"
n_rscl.location     = (180, -300)

n_cxyz         = nodes.new("ShaderNodeCombineXYZ")
n_cxyz.location = (420, -240)

# Random integer (0, 1, 2) selects which rock variant to place.
n_rpick              = nodes.new("FunctionNodeRandomValue")
n_rpick.data_type    = "INT"
n_rpick.inputs["Min"].default_value = 0
n_rpick.inputs["Max"].default_value = 2
n_rpick.location     = (180, -480)

# Collection Info expands the scatter collection into a list of instances.
# Separate Children=True + Pick Instance=True on IOP selects one child per point.
n_col                 = nodes.new("GeometryNodeCollectionInfo")
n_col.transform_space = "RELATIVE"
n_col.inputs["Collection"].default_value        = scatter_col
n_col.inputs["Separate Children"].default_value = True
n_col.inputs["Reset Children"].default_value    = False
n_col.location = (180, 200)

n_iop          = nodes.new("GeometryNodeInstanceOnPoints")
n_iop.inputs["Pick Instance"].default_value = True
n_iop.location = (640, 80)

# ── Links ─────────────────────────────────────────────────────────────────────
links.new(n_attr.outputs["Attribute"],      n_mul.inputs[0])
links.new(n_in.outputs["Density Max"],      n_mul.inputs[1])

links.new(n_in.outputs["Geometry"],         n_dist.inputs["Mesh"])
links.new(n_mul.outputs["Value"],           n_dist.inputs["Density Max"])
links.new(n_in.outputs["Min Distance"],     n_dist.inputs["Distance Min"])
links.new(n_in.outputs["Seed"],             n_dist.inputs["Seed"])

links.new(n_dist.outputs["Rotation"],       n_rote.inputs["Rotation"])
links.new(n_in.outputs["Seed"],             n_ryaw.inputs["Seed"])
links.new(n_ryaw.outputs["Value"],          n_rote.inputs["Angle"])

links.new(n_in.outputs["Scale Min"],        n_rscl.inputs["Min"])
links.new(n_in.outputs["Scale Max"],        n_rscl.inputs["Max"])
links.new(n_in.outputs["Seed"],             n_rscl.inputs["Seed"])
links.new(n_rscl.outputs["Value"],          n_cxyz.inputs["X"])
links.new(n_rscl.outputs["Value"],          n_cxyz.inputs["Y"])
links.new(n_rscl.outputs["Value"],          n_cxyz.inputs["Z"])

links.new(n_in.outputs["Seed"],             n_rpick.inputs["Seed"])

links.new(n_dist.outputs["Points"],         n_iop.inputs["Points"])
links.new(n_col.outputs["Instances"],       n_iop.inputs["Instance"])
links.new(n_rpick.outputs["Value"],         n_iop.inputs["Instance Index"])
links.new(n_rote.outputs["Rotation"],       n_iop.inputs["Rotation"])
links.new(n_cxyz.outputs["Vector"],         n_iop.inputs["Scale"])
links.new(n_iop.outputs["Instances"],       n_out.inputs["Geometry"])

# ── Attach modifier to terrain ────────────────────────────────────────────────
mod            = terrain_ob.modifiers.new(GN_TREE_NAME, "NODES")
mod.node_group = ng

# ── GLB export — export_apply=True realises all instances into mesh data ──────
os.makedirs(os.path.dirname(GLB_OUT), exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
terrain_ob.select_set(True)
bpy.context.view_layer.objects.active = terrain_ob
bpy.ops.export_scene.gltf(
    filepath                             = GLB_OUT,
    use_selection                        = True,
    export_apply                         = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = "WEBP",
)

bpy.ops.wm.save_mainfile(filepath=BLEND_OUT)
print("✓ scatter_terrain.blend + scatter_terrain.glb written.")
