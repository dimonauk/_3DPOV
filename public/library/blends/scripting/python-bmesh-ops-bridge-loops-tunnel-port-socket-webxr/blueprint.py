"""
blueprint.py — bmesh.ops.bridge_loops: Cylindrical Bore & Tapered Port Socket
═══════════════════════════════════════════════════════════════════════════════
Outputs:
  hf_bridge_port.blend  — saved Blender 5.1 file
  hf_bridge_port.glb    — Draco L6 / WebP GLB for WebXR

TECHNIQUE: BRIDGE_LOOPS
────────────────────────
bmesh.ops.bridge_loops connects two spatially separated edge loops with a clean
quad strip.  It is the context-free kernel behind Blender's "Bridge Edge Loops"
mesh tool (Ctrl+E › Bridge Edge Loops in Edge Select mode).

Unlike bmesh.ops.spin (revolves one profile around a single axis) and
bmesh.ops.grid_fill (patches a rectangular hole in a single plane), bridge_loops
works across ANY two compatible loops — even on disconnected mesh islands — making
it the correct primitive for:
  — cylindrical bores and connector tunnels through chassis panels
  — tapered funnel sockets and convergent port geometry
  — organic saddle strips joining two open boundary rails

KEY API INVARIANT
─────────────────
The `edges` argument accepts a FLAT list containing ALL edges from BOTH loops
combined.  The operator traces the connected edge graph from that pool to
discover each loop independently.  Order within the list is irrelevant; only
edge connectivity determines loop membership.

LOOP TOPOLOGY RULE
──────────────────
  use_cyclic=True  → each loop must be a CLOSED RING (edges form a cycle with
                     no free endpoints).  Produces a closed tube or ring bridge.
  use_cyclic=False → each loop is an OPEN RAIL (two free endpoints).  Produces
                     a flat strip — saddle, ramp, or arched panel.

TWIST HANDLING
──────────────
twist_offset (int) shifts which vertex on loop B aligns with vertex 0 on loop A.
On a 12-vert ring, twist_offset=1 rotates matching by one vertex (30°).  Critical
for asymmetric profiles: a 30°-rotated hex aligns its flats to the destination
loop's corners rather than its own corners, producing a spiral if left at zero.

CONSTRUCTION
────────────
Two standalone port objects sitting on the XY plane:
  PORT_BORE   — straight cylindrical tube (N=12, same radius both ends, num_cuts=2)
  PORT_TAPER  — tapered socket (N=16, wide front→narrow back, interpolation='SURFACE')
Both use use_cyclic=True (closed rings) and are end-capped with a poke fan.
"""

import math
import os

import bpy
import bmesh
from mathutils import Vector

# ── PARAMETERS ───────────────────────────────────────────────────────────────
N_BORE        = 12      # ring vertex count — 12-sided gives clean 30° facets
N_TAPER       = 16      # 16-sided for the tapered socket
R_BORE        = 0.120   # bore radius [m] — identical on both ends (straight)
BORE_HEIGHT   = 0.100   # tube length [m]
NUM_CUTS_BORE = 2       # extra mid-span edge loops (divides tube into 3 spans)
                        # mid-loop edges are essential if you later deform with
                        # an Armature or Lattice — without them, long spans kink

R_TAPER_FRONT = 0.150   # wide front-opening radius [m]
R_TAPER_BACK  = 0.068   # narrow back-opening radius [m] — ~45% convergence
TAPER_HEIGHT  = 0.100   # taper depth [m]
NUM_CUTS_TAPER = 1      # one mid-span loop for the taper shoulder

# Surface interpolation mode for the tapered socket:
#   'LINEAR'  — straight-sided frustum (hard chamfer)
#   'SURFACE' — smooth blend following a B-spline profile (bulging shoulder)
#   'PATH'    — follows the shortest path between loops (useful for twisted loops)
TAPER_INTERP  = 'SURFACE'
TAPER_SMOOTH  = 0.45    # smoothness [0.0–1.0]; controls how far the shoulder bulges

OFFSET_X = 0.42         # X-axis separation between the two objects [m]

_here      = os.path.dirname(os.path.abspath(__file__))
BLEND_PATH = os.path.join(_here, "hf_bridge_port.blend")
GLB_PATH   = os.path.join(_here, "hf_bridge_port.glb")

# ── SCENE RESET ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col   = bpy.data.collections.new("HF_BridgePort")
scene.collection.children.link(col)

# ── MATERIALS ─────────────────────────────────────────────────────────────────
def _mat(name, rgba, metallic=0.1, roughness=0.65):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    pb = m.node_tree.nodes["Principled BSDF"]
    pb.inputs["Base Color"].default_value  = rgba
    pb.inputs["Metallic"].default_value    = metallic
    pb.inputs["Roughness"].default_value   = roughness
    return m

mat_cap_bore  = _mat("HF_Cap_Bore",  (0.40, 0.44, 0.48, 1.0), metallic=0.55)
mat_wall_bore = _mat("HF_Wall_Bore", (0.22, 0.24, 0.28, 1.0), metallic=0.80)
mat_cap_taper = _mat("HF_Cap_Taper", (0.55, 0.28, 0.08, 1.0), metallic=0.10)
mat_wall_taper= _mat("HF_Wall_Taper",(0.38, 0.18, 0.04, 1.0), metallic=0.10)

# ── HELPER: closed vertex ring ────────────────────────────────────────────────
def make_ring(bm, n, radius, origin):
    """
    Build a closed N-vert ring centred at `origin` (Vector).
    Returns (verts, edges) — edges wind counter-clockwise when viewed from +Z.
    Counter-clockwise winding means the open-disk normal points +Z before capping,
    which recalc_face_normals then orients outward from the closed solid.
    """
    verts = []
    for i in range(n):
        angle = 2.0 * math.pi * i / n
        pos   = origin + Vector((radius * math.cos(angle),
                                  radius * math.sin(angle),
                                  0.0))
        verts.append(bm.verts.new(pos))
    edges = []
    for i in range(n):
        edges.append(bm.edges.new((verts[i], verts[(i + 1) % n])))
    return verts, edges

# ── HELPER: poke cap ─────────────────────────────────────────────────────────
def poke_cap(bm, verts, mat_idx=0):
    """
    Fill a closed N-vert ring with a fan of N triangles sharing a centre vertex.
    The existing ring edges are reused; new spoke edges connect each ring vertex
    to the centre.  Material index applied to all new faces.
    """
    n  = len(verts)
    cx = sum(v.co.x for v in verts) / n
    cy = sum(v.co.y for v in verts) / n
    cz = verts[0].co.z
    centre = bm.verts.new(Vector((cx, cy, cz)))
    for i in range(n):
        f = bm.faces.new((verts[i], verts[(i + 1) % n], centre))
        f.smooth = False
        f.material_index = mat_idx
    return centre

# ── HELPER: build mesh object and add to collection ───────────────────────────
def make_obj(bm, name, mats, offset_x):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    for mat in mats:
        me.materials.append(mat)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    obj.location.x = offset_x
    col.objects.link(obj)
    return obj

# ── PORT_BORE — straight cylindrical tube ──────────────────────────────────────
bm = bmesh.new()

ring_front, edges_front = make_ring(bm, N_BORE, R_BORE, Vector((0, 0,  0.0)))
ring_back,  edges_back  = make_ring(bm, N_BORE, R_BORE, Vector((0, 0, -BORE_HEIGHT)))

# Bridge — pass ALL edges from both loops as a flat list.
# use_cyclic=True because both rings are closed cycles (no free endpoints).
# num_cuts=2 inserts two intermediate edge loops, giving 3 quad-row spans along
# the tube length.  This is the minimum safe cut count for any tube that will be
# deformed post-export.
ret = bmesh.ops.bridge_loops(
    bm,
    edges      = edges_front + edges_back,
    use_cyclic = True,
    num_cuts   = NUM_CUTS_BORE,
)
for f in ret['faces']:
    f.smooth       = False
    f.material_index = 1  # wall material

poke_cap(bm, ring_front, mat_idx=0)  # front cap — faces viewer
poke_cap(bm, ring_back,  mat_idx=0)  # back cap

obj_bore = make_obj(bm, "HF_PortBore", [mat_cap_bore, mat_wall_bore], -OFFSET_X / 2)

# ── PORT_TAPER — tapered socket (convergent frustum) ──────────────────────────
bm = bmesh.new()

ring_top, edges_top = make_ring(bm, N_TAPER, R_TAPER_FRONT, Vector((0, 0,  0.0)))
ring_bot, edges_bot = make_ring(bm, N_TAPER, R_TAPER_BACK,  Vector((0, 0, -TAPER_HEIGHT)))

# interpolation='SURFACE' makes the bridge profile bulge outward slightly,
# following a smoothed B-spline path between the two ring planes.
# On a convergent (tapered) bridge this produces a visible shoulder — a
# slight outward belly at the mid-span — which reads as a machined chamfer
# rather than a straight linear frustum.
# smoothness=0.45: less than 0.5 keeps the bulge subtle on a short taper.
ret = bmesh.ops.bridge_loops(
    bm,
    edges         = edges_top + edges_bot,
    use_cyclic    = True,
    num_cuts      = NUM_CUTS_TAPER,
    interpolation = TAPER_INTERP,
    smoothness    = TAPER_SMOOTH,
)
for f in ret['faces']:
    f.smooth         = False
    f.material_index = 1

poke_cap(bm, ring_top, mat_idx=0)
poke_cap(bm, ring_bot, mat_idx=0)

obj_taper = make_obj(bm, "HF_TaperSocket", [mat_cap_taper, mat_wall_taper], OFFSET_X / 2)

# ── APPLY TRANSFORMS (WebXR pipeline) ─────────────────────────────────────────
for obj in (obj_bore, obj_taper):
    obj.select_set(True)
bpy.context.view_layer.objects.active = obj_bore
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
for obj in (obj_bore, obj_taper):
    obj.select_set(False)

# ── SAVE BLEND ────────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)

# ── EXPORT GLB ────────────────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath              = GLB_PATH,
    export_format         = "GLB",
    export_draco_mesh_compression_enable  = True,
    export_draco_mesh_compression_level   = 6,
    export_apply          = True,         # bake flat-shade normals into GLB NORMAL accessor
    export_image_format   = "WEBP",
    export_yup            = True,         # +Y up for Three.js / WebXR convention
    use_selection         = False,
    export_materials      = "EXPORT",
    export_normals        = True,
)

print(f"[HF] blend → {BLEND_PATH}")
print(f"[HF] glb   → {GLB_PATH}")
