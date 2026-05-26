#!/usr/bin/env python3
"""
blueprint.py — GN Capture Attribute + Named Attribute
Per-Instance Data Pipelines | Blender 5.1 | CC0 | Holoflow Studio

In Geometry Nodes, most value nodes are FIELDS — lazy expressions that
define HOW to compute a value, not WHAT it is.  A RandomValue node seeded
by Index doesn't produce 64 different numbers; it produces a recipe that
says "when evaluated at element N, return hash(N, seed)".  Fields are
re-evaluated at whatever domain is active at the point of consumption.

The problem: after InstanceOnPoints, the POINT domain of the scatter cloud
becomes the INSTANCE domain of the instanced geometry.  A RandomValue seeded
by Index still works here — INSTANCE Index is 0..N-1, matching POINT Index.
BUT the moment you add a deletion step (e.g. cull low-density points) before
InstanceOnPoints, the point indices shift.  The re-evaluated random values
are now different numbers from what you intended.

Capture Attribute is the solution.  It forces the field to evaluate AT the
POINT domain of the scatter cloud and stores the result as a concrete
attribute.  That attribute propagates through InstanceOnPoints intact — it
is NOT re-evaluated.  Downstream deletions, reorders, or domain changes
cannot corrupt an already-captured value.

Node graph (11 processing nodes):
  MeshGrid(4 m, 4 m)
  DistributePointsOnFaces(RANDOM, density=4/m², seed=42)
  Index → RandomValue(FLOAT, 0..1, ID=Index) → colour phase per scatter pt
  CaptureAttribute(FLOAT, POINT)          ← THIS IS THE KEY NODE
  IcoSphere(r=0.08) → SetMaterial(ColourPhaseEmission)
  InstanceOnPoints
  StoreNamedAttribute(FLOAT, INSTANCE, 'colour_phase') ← CaptureAttr.Attr
  RealizeInstances → SetShadeSmooth(FACE, False) → GroupOutput

Run headlessly:
    blender --background --python blueprint.py
"""

import bpy
import math
from pathlib import Path

# ============================================================
# Parameters
# ============================================================
SLUG             = "gn-capture-attribute-named-attribute"
TOPIC            = "geometry-nodes"
MESH_NAME        = "colour_scatter"

HERE             = Path(__file__).parent
BLEND_OUT        = HERE / f"{MESH_NAME}.blend"
GLB_OUT          = HERE.parents[3] / "glbs" / TOPIC / SLUG / f"{MESH_NAME}.glb"

GRID_SIZE        = 4.0   # scatter plane XY extent (m)
GRID_DIVS        = 3     # minimal topology — scatter uses face area, not vertex density
SCATTER_DENSITY  = 4.0   # pts/m²  →  ~64 points on 4×4 m plane
SCATTER_SEED     = 42
SPHERE_RADIUS    = 0.08  # per-instance ico sphere radius (m)
SPHERE_SUBDIVS   = 2     # low-subdivision → visible facets

# ============================================================
# Scene reset
# ============================================================
bpy.ops.wm.read_factory_settings(use_empty=True)
scene               = bpy.context.scene
scene.name          = "GN_CaptureAttribute"
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.frame_start   = 1
scene.frame_end     = 120

# ============================================================
# ColourPhaseEmission material
# ShaderNodeAttribute reads 'colour_phase' (FLOAT, POINT domain after
# RealizeInstances) and maps it through a 6-stop rainbow ColorRamp.
# Emission is used rather than Principled so EEVEE renders the colour
# without light-position dependence — every facet shows its hue clearly.
# ============================================================
mat = bpy.data.materials.new("ColourPhaseEmission")
mat.use_nodes = True
mn = mat.node_tree.nodes
ml = mat.node_tree.links
mn.clear()

n_attr = mn.new("ShaderNodeAttribute")
n_attr.attribute_type = "GEOMETRY"
n_attr.attribute_name = "colour_phase"  # must match StoreNamedAttribute name

n_ramp = mn.new("ShaderNodeValToRGB")
ramp   = n_ramp.color_ramp
stops  = [
    (0.00, (1.0, 0.0, 0.0, 1.0)),   # red
    (0.20, (1.0, 1.0, 0.0, 1.0)),   # yellow
    (0.40, (0.0, 1.0, 0.0, 1.0)),   # green
    (0.60, (0.0, 1.0, 1.0, 1.0)),   # cyan
    (0.80, (0.0, 0.0, 1.0, 1.0)),   # blue
    (1.00, (1.0, 0.0, 1.0, 1.0)),   # magenta
]
ramp.elements[0].position = stops[0][0]; ramp.elements[0].color = stops[0][1]
ramp.elements[1].position = stops[1][0]; ramp.elements[1].color = stops[1][1]
for pos, col in stops[2:]:
    el = ramp.elements.new(pos); el.color = col

n_emit              = mn.new("ShaderNodeEmission")
n_emit.inputs[1].default_value = 3.0   # strength — bright enough for EEVEE viewport

n_mout              = mn.new("ShaderNodeOutputMaterial")
ml.new(n_attr.outputs[2], n_ramp.inputs[0])   # Fac → Fac   (float attr → ramp position)
ml.new(n_ramp.outputs[0], n_emit.inputs[0])   # Color → Color
ml.new(n_emit.outputs[0], n_mout.inputs[0])   # BSDF → Surface

# ============================================================
# Scatter host object — empty mesh; GN modifier supplies all geometry
# ============================================================
host_mesh = bpy.data.meshes.new("scatter_host")
host_obj  = bpy.data.objects.new("scatter_host", host_mesh)
scene.collection.objects.link(host_obj)

# ============================================================
# Geometry Nodes tree
# ============================================================
tree   = bpy.data.node_groups.new("CaptureAttributeDemo", "GeometryNodeTree")
nodes  = tree.nodes
links  = tree.links

n_in  = nodes.new("NodeGroupInput")
n_out = nodes.new("NodeGroupOutput")
tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

# --- MeshGrid: procedural scatter surface ---
n_grid = nodes.new("GeometryNodeMeshGrid")
n_grid.inputs[0].default_value = GRID_SIZE   # Size X
n_grid.inputs[1].default_value = GRID_SIZE   # Size Y
n_grid.inputs[2].default_value = GRID_DIVS   # Vertices X
n_grid.inputs[3].default_value = GRID_DIVS   # Vertices Y

# --- DistributePointsOnFaces: scatter cloud ---
n_dist = nodes.new("GeometryNodeDistributePointsOnFaces")
n_dist.distribute_method = "RANDOM"
# [0]=Mesh [1]=Selection(hidden) [2]=Density Factor [3]=Density Max [4]=Seed
n_dist.inputs[2].default_value = 1.0
n_dist.inputs[3].default_value = SCATTER_DENSITY
n_dist.inputs[4].default_value = SCATTER_SEED
links.new(n_grid.outputs[0], n_dist.inputs[0])

# --- Index + RandomValue: per-point hue, evaluated at POINT domain ---
n_idx = nodes.new("GeometryNodeInputIndex")
n_rng = nodes.new("GeometryNodeRandomValue")
n_rng.data_type = "FLOAT"
# [0]=Min [1]=Max [2]=ID (per-element seed) [3]=Seed (global offset)
n_rng.inputs[0].default_value = 0.0
n_rng.inputs[1].default_value = 1.0
n_rng.inputs[3].default_value = 7
links.new(n_idx.outputs[0], n_rng.inputs[2])   # Index → ID

# --- CaptureAttribute: freeze the hue at POINT domain NOW ---
# If this node were removed and the RandomValue output connected directly
# to StoreNamedAttribute below, the field would still evaluate at INSTANCE
# domain — giving the same 0..N-1 Index values in a simple pipeline.
# Adding any deletion between scatter and instancing breaks that assumption;
# the captured version is always correct regardless of downstream operations.
n_cap = nodes.new("GeometryNodeCaptureAttribute")
n_cap.data_type = "FLOAT"
n_cap.domain    = "POINT"
# [0]=Geometry [1]=Value(Float)  →  [0]=Geometry [1]=Attribute(Float)
links.new(n_dist.outputs[0], n_cap.inputs[0])   # scatter cloud → CA.Geometry
links.new(n_rng.outputs[0],  n_cap.inputs[1])   # random float  → CA.Value

# --- IcoSphere: instance template (built-in, no external object needed) ---
n_ico = nodes.new("GeometryNodeIcoSphere")
n_ico.inputs[0].default_value = SPHERE_RADIUS   # Radius
n_ico.inputs[1].default_value = SPHERE_SUBDIVS  # Subdivisions

# --- SetMaterial: brand the template sphere before instancing ---
n_smat = nodes.new("GeometryNodeSetMaterial")
n_smat.inputs[2].default_value = mat   # Material socket
links.new(n_ico.outputs[0], n_smat.inputs[0])

# --- InstanceOnPoints: one sphere per scatter point ---
n_iop = nodes.new("GeometryNodeInstanceOnPoints")
# [0]=Points [1]=Selection [2]=Instance [3]=PickInstance [4]=InstanceIndex [5]=Rotation [6]=Scale
links.new(n_cap.outputs[0],  n_iop.inputs[0])   # captured cloud → Points
links.new(n_smat.outputs[0], n_iop.inputs[2])   # sphere+mat     → Instance

# --- StoreNamedAttribute: name the captured hue on each INSTANCE ---
# INSTANCE domain: one attribute value per sphere instance.
# After RealizeInstances, this propagates to every POINT (vertex) within
# each instance — all 20 vertices of sphere #k get the same colour_phase.
# The material then reads it correctly per-sphere, not per-vertex.
n_store = nodes.new("GeometryNodeStoreNamedAttribute")
n_store.data_type = "FLOAT"
n_store.domain    = "INSTANCE"
# [0]=Geometry [1]=Selection(hidden) [2]=Name [3]=Value(Float)
n_store.inputs[2].default_value = "colour_phase"
links.new(n_iop.outputs[0],   n_store.inputs[0])   # Instances  → SNA.Geometry
links.new(n_cap.outputs[1],   n_store.inputs[3])   # CA.Attr    → SNA.Value

# --- RealizeInstances + SetShadeSmooth ---
n_real = nodes.new("GeometryNodeRealizeInstances")
links.new(n_store.outputs[0], n_real.inputs[0])

n_ssm = nodes.new("GeometryNodeSetShadeSmooth")
n_ssm.domain = "FACE"
n_ssm.inputs[2].default_value = False   # flat shading → faceted look
links.new(n_real.outputs[0], n_ssm.inputs[0])

links.new(n_ssm.outputs[0], n_out.inputs[0])

# ============================================================
# Attach modifier
# ============================================================
mod            = host_obj.modifiers.new("CaptureAttrDemo", "NODES")
mod.node_group = tree

# ============================================================
# Camera + light
# ============================================================
bpy.ops.object.camera_add(location=(6.0, -5.5, 5.0))
cam_obj                = bpy.context.active_object
cam_obj.rotation_euler = (math.radians(52), 0.0, math.radians(48))
scene.camera           = cam_obj

bpy.ops.object.light_add(type="SUN", location=(4.0, 2.0, 6.0))
sun             = bpy.context.active_object
sun.data.energy = 3.0

# ============================================================
# Export GLB
# export_apply=True bakes the entire GN + RealizeInstances stack into
# real mesh data.  Without it, runtimes (Three.js, Babylon, WebXR) see
# an empty host mesh — they do not evaluate Geometry Nodes.
# The 'colour_phase' POINT attribute exports as a custom glTF attribute
# under _COLOUR_PHASE; Three.js reads it via geometry.attributes.
# ============================================================
GLB_OUT.parent.mkdir(parents=True, exist_ok=True)
bpy.context.view_layer.objects.active = host_obj
bpy.ops.export_scene.gltf(
    filepath                             = str(GLB_OUT),
    export_format                        = "GLB",
    export_apply                         = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = "WEBP",
    export_yup                           = True,
    use_selection                        = False,
)

# ============================================================
# Save blend
# ============================================================
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
print(f"✓  {BLEND_OUT}")
print(f"✓  {GLB_OUT}")
