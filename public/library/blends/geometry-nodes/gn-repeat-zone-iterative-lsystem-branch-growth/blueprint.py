"""
Blender 5.1 — GN Repeat Zone: Iterative Branch Growth
======================================================
Technique: The Repeat Zone (GeometryNodeRepeatInput / GeometryNodeRepeatOutput)
evaluates a body of nodes N times within a single frame. Each pass receives
the previous pass's output sockets as its input sockets — enabling stateful
iteration without Simulation Zone (which runs across frames).

This blueprint builds a fractal spike ball:
  - Seed mesh: IcoSphere (subdivisions=1, 12 vertices, 20 faces)
  - Each repeat iteration extrudes all "tip" faces outward, shrinking the
    offset scale by a fixed factor — creating nested shells of spikes
  - is_tip BOOLEAN FACE attribute marks which faces get extruded each pass
  - After each ExtrudeMesh the .Top boolean field overwrites is_tip on the output
    geometry so only freshly extruded tops are extruded on the next pass

Artefacts produced (relative to this file's directory):
  branch_ball.blend   — saved .blend containing the full GN setup
  branch_ball.glb     — Draco-L6 + WebP GLB snapshot at iteration=5
  blueprint.py        — this file
  record.py           — viewport-animation recorder
  SCREEN-RECORDING-NOTES.md

Outside source:
  Blender Manual — Repeat Zone  (CC-BY-SA-4.0, Blender Foundation)
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/repeat_zone.html

Licence: CC0 1.0 Universal — Holoflow Studio
"""

import math
import bpy
import bmesh

# ── Parameters ────────────────────────────────────────────────────────────────
OBJECT_NAME   = "branch_ball"
GROUP_NAME    = "HF_RepeatBranch"
BLEND_PATH    = "//branch_ball.blend"
GLB_PATH      = "//branch_ball.glb"

ITERATIONS    = 5      # loop count; 6+ gets heavy (~20k+ faces)
BRANCH_SCALE  = 0.55   # extrude offset for iteration 0 (shrinks each pass)
SHRINK        = 0.68   # multiply BRANCH_SCALE by this each iteration
FLAT_SHADING  = True   # cohesive with studio facet pipeline


# ── 1. Fresh scene ────────────────────────────────────────────────────────────
bpy.ops.wm.read_homefile(use_empty=True)
scene = bpy.context.scene
scene.name = "RepeatBranchScene"


# ── 2. Seed mesh (IcoSphere) ─────────────────────────────────────────────────
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1.0, location=(0, 0, 0))
obj = bpy.context.active_object
obj.name = OBJECT_NAME

if FLAT_SHADING:
    for poly in obj.data.polygons:
        poly.use_smooth = False

# Apply scale so the GN modifier receives a clean unit mesh.
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)


# ── 3. Material (flat-shaded toon) ───────────────────────────────────────────
mat = bpy.data.materials.new("BranchMat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.18, 0.72, 0.55, 1.0)  # teal
bsdf.inputs["Roughness"].default_value = 0.9
obj.data.materials.append(mat)


# ── 4. Build Geometry Node group ─────────────────────────────────────────────
ng = bpy.data.node_groups.new(GROUP_NAME, "GeometryNodeTree")

# Group sockets (Blender 4.0+ interface API)
ng.interface.new_socket("Geometry",     in_out="INPUT",  socket_type="NodeSocketGeometry")
ng.interface.new_socket("Iterations",   in_out="INPUT",  socket_type="NodeSocketInt")
ng.interface.new_socket("Branch Scale", in_out="INPUT",  socket_type="NodeSocketFloat")
ng.interface.new_socket("Shrink",       in_out="INPUT",  socket_type="NodeSocketFloat")
ng.interface.new_socket("Geometry",     in_out="OUTPUT", socket_type="NodeSocketGeometry")

# Helper ── create node and set position
def N(bl_id, x, y):
    n = ng.nodes.new(bl_id)
    n.location = (x, y)
    return n

def L(from_node, from_idx, to_node, to_idx):
    ng.links.new(from_node.outputs[from_idx], to_node.inputs[to_idx])

# Group I/O
grp_in  = N("NodeGroupInput",  -800, 0)
grp_out = N("NodeGroupOutput",  1400, 0)

# ── 4a. Pre-zone: initialise is_tip = True on all faces ──────────────────────
store_init = N("GeometryNodeStoreNamedAttribute", -520, 0)
store_init.domain     = "FACE"
store_init.data_type  = "BOOLEAN"
store_init.inputs["Name"].default_value  = "is_tip"
store_init.inputs["Value"].default_value = True   # constant True — marks all faces
L(grp_in, 0, store_init, 0)                       # Geometry in

# ── 4b. Repeat Zone nodes ─────────────────────────────────────────────────────
repeat_in  = N("GeometryNodeRepeatInput",  -200, 0)
repeat_out = N("GeometryNodeRepeatOutput",  900, 0)

# Add loop variables to the zone (both nodes gain matching sockets automatically).
# Socket type strings must use the NodeSocket* naming scheme.
repeat_out.repeat_items.new(socket_type="NodeSocketGeometry", name="Geometry")
repeat_out.repeat_items.new(socket_type="NodeSocketFloat",    name="Scale")

# Iteration Count: grp_in.Iterations → repeat_in[0] (Iterations socket)
L(grp_in, 1, repeat_in, 0)

# Initial loop-variable values
L(store_init, 0, repeat_in, 1)     # Geometry from pre-zone
L(grp_in, 2, repeat_in, 2)         # Branch Scale initial value

# ── 4c. Inside the zone body ─────────────────────────────────────────────────
# Repeat Input sockets:
#   outputs[0] = Iteration (Int, 0-based current index)
#   outputs[1] = Geometry  (loop var 0)
#   outputs[2] = Scale     (loop var 1)

# Read is_tip attribute to select faces for extrusion
na_tip = N("GeometryNodeInputNamedAttribute", 100, 80)
na_tip.data_type = "BOOLEAN"
na_tip.inputs["Name"].default_value = "is_tip"

# ExtrudeMesh — Individual Faces mode extrudes each tip face independently
extrude = N("GeometryNodeExtrudeMesh", 300, 0)
extrude.mode = "FACES"
# Geometry from loop var
L(repeat_in, 1, extrude, 0)
# Selection = is_tip
L(na_tip, 1, extrude, 1)           # outputs[1] = Exists (Bool) — attribute exists
# Offset Scale = current loop scale
L(repeat_in, 2, extrude, 3)        # inputs[3] = Offset Scale
# Individual Faces: True (default on mode=FACES, but explicit is safer)
extrude.inputs["Individual Faces"].default_value = True

# StoreNamedAttribute: overwrite is_tip with ExtrudeMesh.Top
# .Top is True only on newly-created top faces → next iteration extrudes only those
store_tip = N("GeometryNodeStoreNamedAttribute", 600, 0)
store_tip.domain    = "FACE"
store_tip.data_type = "BOOLEAN"
store_tip.inputs["Name"].default_value = "is_tip"
L(extrude, 0, store_tip, 0)        # Mesh → Geometry
L(extrude, 1, store_tip, 2)        # Top  → Value

# Scale shrinkage: new_scale = current_scale * Shrink
shrink_mult = N("ShaderNodeMath", 550, -180)
shrink_mult.operation = "MULTIPLY"
L(repeat_in, 2, shrink_mult, 0)    # current Scale
L(grp_in, 3, shrink_mult, 1)       # Shrink factor

# Repeat Output receives updated geometry and shrunken scale
L(store_tip, 0, repeat_out, 0)     # Geometry loop var
L(shrink_mult, 0, repeat_out, 1)   # Scale loop var (shrunk)

# ── 4d. Post-zone: flat shade, wire to group output ──────────────────────────
shade_smooth = N("GeometryNodeSetShadeSmooth", 1100, 0)
shade_smooth.domain = "FACE"
shade_smooth.inputs["Shade Smooth"].default_value = False  # flat facet
L(repeat_out, 0, shade_smooth, 0)
L(shade_smooth, 0, grp_out, 0)


# ── 5. Apply modifier ─────────────────────────────────────────────────────────
mod = obj.modifiers.new(GROUP_NAME, "NODES")
mod.node_group = ng

# Set modifier socket values via the interface identifier
def set_mod_socket(mod, ng, name, value):
    for item in ng.interface.items_tree:
        if item.item_type == "SOCKET" and item.in_out == "INPUT" and item.name == name:
            mod[item.identifier] = value
            return

set_mod_socket(mod, ng, "Iterations",   ITERATIONS)
set_mod_socket(mod, ng, "Branch Scale", BRANCH_SCALE)
set_mod_socket(mod, ng, "Shrink",       SHRINK)


# ── 6. Camera + lighting for GLB preview render ───────────────────────────────
bpy.ops.object.camera_add(location=(4, -4, 3))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(60), 0, math.radians(45))
scene.camera = cam

bpy.ops.object.light_add(type="SUN", location=(5, 5, 8))
sun = bpy.context.active_object
sun.data.energy = 3.0


# ── 7. GLB export ─────────────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath=GLB_PATH,
    export_format="GLB",
    export_apply=True,          # bake GN modifier; required — unapplied yields 20-face icosphere
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
    export_yup=True,            # glTF +Y-up convention
)


# ── 8. Save .blend ────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)

print("✓ branch_ball.blend + branch_ball.glb written")
print(f"  Iterations={ITERATIONS}  Branch Scale={BRANCH_SCALE}  Shrink={SHRINK}")
