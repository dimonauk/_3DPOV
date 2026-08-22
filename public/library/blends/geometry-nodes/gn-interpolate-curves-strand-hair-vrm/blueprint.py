"""
HF GN Interpolate Curves — Procedural Strand Hair on VRM Scalp
Blender 5.1 · CC0 — Holoflow Studio

Technique
---------
Interpolate Curves (GeometryNodeInterpolateCurves) generates N strands
across a carrier mesh by barycentric-blending a small set of artist-
positioned guide curves.  Each guide defines root attachment, tip reach,
and curvature; the node fills every follicle position by weighted-averaging
the nearest K guides, giving parting lines and silhouette shape without
hand-placing every strand.

The guide curves are a *Curves* (HairCurves) data block — bpy.data.hair_curves,
distinct from legacy bpy.data.curves (Bézier/NURBS).  Setting .surface and
.surface_uv_map on the HairCurves block lets the grooming tools reproject
guides after mesh edits; the GN node uses those fields for barycentric root
computation automatically.

After interpolation, Curve to Mesh converts strands to a round ribbon mesh
(6-vertex circle profile) that GLTF can export.  512 strands × 12 pts × 6
cross-section verts ≈ 36 K triangles — real-time budget on current GPUs.

Output
------
  blend : scalp_hair.blend          (this directory)
  glb   : public/library/glbs/geometry-nodes/
            gn-interpolate-curves-strand-hair-vrm/scalp_hair.glb
"""

import bpy, bmesh, math, mathutils, os

# ── Constants ─────────────────────────────────────────────────────────────────
SCALP_RADIUS   = 0.11    # metres — typical VRM head radius
STRAND_COUNT   = 256     # interpolated strands output by Interpolate Curves
STRAND_RADIUS  = 0.0025  # round cross-section half-width (metres)
STRAND_LEN     = 0.18    # arc length root→tip (metres)
GUIDE_PTS      = 8       # control points per guide
GN_TREE_NAME   = "HF_HairInterpolate"
SCALP_NAME     = "VRM_Scalp"
GUIDES_NAME    = "VRM_GuideHair"
OUTPUT_NAME    = "hair_strands"
BLEND_OUT      = bpy.path.abspath("//scalp_hair.blend")
GLB_OUT        = bpy.path.abspath(
    "//../../../../glbs/geometry-nodes/"
    "gn-interpolate-curves-strand-hair-vrm/scalp_hair.glb"
)

# ── Purge previous run ────────────────────────────────────────────────────────
def _purge() -> None:
    for n in (OUTPUT_NAME, SCALP_NAME, GUIDES_NAME):
        if n in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)
    if GN_TREE_NAME in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[GN_TREE_NAME])
    for hc in list(bpy.data.hair_curves):
        if hc.name.startswith("VRM_"):
            bpy.data.hair_curves.remove(hc)

_purge()

# ── 1. Scalp dome ─────────────────────────────────────────────────────────────
def _make_scalp() -> bpy.types.Object:
    """Upper hemisphere mesh — UV sphere cropped at z=0 with spherical UV map.
    The UV map is mandatory: Interpolate Curves uses it for barycentric root
    lookup to distribute interpolated strands on the surface."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=12, radius=SCALP_RADIUS)
    # remove lower hemisphere; keep equator band for clean root anchoring
    bmesh.ops.delete(
        bm,
        geom=[v for v in bm.verts if v.co.z < -0.002],
        context='VERTS',
    )
    bm.faces.ensure_lookup_table()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    for face in bm.faces:
        for loop in face.loops:
            n = loop.vert.co.normalized()
            u = (math.atan2(n.x, n.y) / math.tau) % 1.0
            v = (math.asin(max(-1.0, min(1.0, n.z))) / math.pi) + 0.5
            loop[uv_layer].uv = (u, v)
    mesh = bpy.data.meshes.new(SCALP_NAME)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(SCALP_NAME, mesh)
    bpy.context.collection.objects.link(obj)
    return obj

scalp_obj = _make_scalp()

# ── 2. Guide hair curves ──────────────────────────────────────────────────────
# 8 guides: 1 crown + 3 mid-scalp + 3 lower + 1 nape
# lat=latitude from equator (degrees), lon=azimuth from +Y (degrees)
GUIDE_SPECS = [
    (82, 0),    # crown
    (45,   0),  # forehead centreline
    (45,  90),  # right temple
    (45, 270),  # left temple
    (45, 180),  # back-crown
    (15,  60),  # right side
    (15, 300),  # left side
    (12, 180),  # nape
]

def _spherical(lat_deg: float, lon_deg: float, r: float) -> mathutils.Vector:
    lat = math.radians(lat_deg)
    lon = math.radians(lon_deg)
    return mathutils.Vector((
        r * math.cos(lat) * math.sin(lon),
        r * math.cos(lat) * math.cos(lon),
        r * math.sin(lat),
    ))

def _make_guides() -> bpy.types.Object:
    """Create HairCurves data block with GUIDE_SPECS guides.

    Each guide has GUIDE_PTS control points from root (on the scalp surface)
    to tip.  The tip direction is the surface normal drooped 30 % downward so
    gravity is implied without simulation — gives a natural fall without
    running physics at export time.

    .surface + .surface_uv_map link the HairCurves to the scalp mesh so the
    hair grooming tools can re-snap roots after any mesh deformation; the GN
    Interpolate Curves node also reads these to resolve barycentric coords.
    """
    hc = bpy.data.hair_curves.new(GUIDES_NAME)
    hc.add_curves([GUIDE_PTS] * len(GUIDE_SPECS))

    pos_attr = hc.attributes["position"]
    pt_idx   = 0

    for lat_deg, lon_deg in GUIDE_SPECS:
        root   = _spherical(lat_deg, lon_deg, SCALP_RADIUS)
        normal = root.normalized()
        # droop blends the surface normal with −Z; t² ease accelerates at tip
        droop  = (normal * 0.8 + mathutils.Vector((0, 0, -0.6))).normalized()
        for step in range(GUIDE_PTS):
            t         = step / (GUIDE_PTS - 1)
            droop_amt = t * t * STRAND_LEN * 0.10  # gravitational offset
            pos       = root + droop * (STRAND_LEN * t) - mathutils.Vector((0, 0, droop_amt))
            pos_attr.data[pt_idx].vector = pos
            pt_idx += 1

    hc.surface        = scalp_obj
    hc.surface_uv_map = "UVMap"

    obj = bpy.data.objects.new(GUIDES_NAME, hc)
    bpy.context.collection.objects.link(obj)
    return obj

guides_obj = _make_guides()

# ── 3. GN tree: HF_HairInterpolate ───────────────────────────────────────────
# ObjectInfo(guides) → InterpolateCurves ← ObjectInfo(scalp)
#                       ↓
#               CurveToMesh(profile=CurveCircle) → GroupOutput

ng     = bpy.data.node_groups.new(GN_TREE_NAME, 'GeometryNodeTree')
ng.is_modifier = True
iface  = ng.interface
nodes  = ng.nodes
links  = ng.links

# Interface sockets
iface.new_socket("Geometry",      in_out='OUTPUT', socket_type='NodeSocketGeometry')
iface.new_socket("Geometry",      in_out='INPUT',  socket_type='NodeSocketGeometry')
s_cnt  = iface.new_socket("Strand Count",  in_out='INPUT', socket_type='NodeSocketInt')
s_cnt.default_value  = STRAND_COUNT;  s_cnt.min_value = 1;  s_cnt.max_value = 4096
s_seed = iface.new_socket("Seed",          in_out='INPUT', socket_type='NodeSocketInt')
s_seed.default_value = 0
s_len  = iface.new_socket("Strand Length", in_out='INPUT', socket_type='NodeSocketFloat')
s_len.default_value  = STRAND_LEN;   s_len.min_value = 0.01

# Nodes
gout     = nodes.new('NodeGroupOutput')
gin      = nodes.new('NodeGroupInput')
n_gi     = nodes.new('GeometryNodeObjectInfo')   # guide curves source
n_si     = nodes.new('GeometryNodeObjectInfo')   # scalp surface source
n_interp = nodes.new('GeometryNodeInterpolateCurves')
n_circle = nodes.new('GeometryNodeCurvePrimitiveCircle')
n_c2m    = nodes.new('GeometryNodeCurveToMesh')

n_gi.inputs['Object'].default_value = guides_obj
n_si.inputs['Object'].default_value = scalp_obj
n_gi.transform_space = 'RELATIVE'   # coordinates relative to hair_strands object
n_si.transform_space = 'RELATIVE'

# MINIMUM_TWIST prevents guide frames from flipping at high curvature —
# superior to FOLLOW_HAIR_CURVE for round (non-ribbon) profiles
n_interp.guide_up_mode = 'MINIMUM_TWIST'

n_circle.mode = 'POINTS'                           # fixed vertex resolution
n_circle.inputs['Vertices'].default_value = 6
n_circle.inputs['Radius'].default_value   = STRAND_RADIUS

# Fill Caps False: open tips look like real hair; capped tips look like wires
n_c2m.inputs['Fill Caps'].default_value = False

# Connections (index-safe: named sockets first, index fallback commented)
links.new(n_gi.outputs['Geometry'],     n_interp.inputs[0])  # Guide Curves
links.new(n_si.outputs['Geometry'],     n_interp.inputs[1])  # Surface
links.new(gin.outputs['Strand Count'],  n_interp.inputs['Count'])
links.new(gin.outputs['Seed'],          n_interp.inputs['Seed'])
links.new(gin.outputs['Strand Length'], n_interp.inputs['Length'])
links.new(n_interp.outputs['Curves'],   n_c2m.inputs['Curve'])
links.new(n_circle.outputs['Curve'],    n_c2m.inputs['Profile Curve'])
links.new(n_c2m.outputs['Mesh'],        gout.inputs['Geometry'])

for node, x, y in [
    (gin, -620, 0), (n_gi, -400, 250), (n_si, -400, 50),
    (n_interp, -100, 150), (n_circle, -100, -180), (n_c2m, 200, 0), (gout, 460, 0),
]:
    node.location = (x, y)

# ── 4. Output mesh object ─────────────────────────────────────────────────────
out_mesh = bpy.data.meshes.new(OUTPUT_NAME)
out_obj  = bpy.data.objects.new(OUTPUT_NAME, out_mesh)
bpy.context.collection.objects.link(out_obj)
mod = out_obj.modifiers.new("HairInterpolate", 'NODES')
mod.node_group = ng

# ── 5. Save blend ─────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)
print(f"[HF] blend saved → {BLEND_OUT}")

# ── 6. Apply modifier + GLB export ───────────────────────────────────────────
bpy.context.view_layer.objects.active = out_obj
bpy.ops.object.modifier_apply(modifier="HairInterpolate")
os.makedirs(os.path.dirname(GLB_OUT), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath                             = GLB_OUT,
    export_format                        = 'GLB',
    use_selection                        = False,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = 'WEBP',
    export_apply                         = True,
)
print(f"[HF] GLB exported → {GLB_OUT}")
