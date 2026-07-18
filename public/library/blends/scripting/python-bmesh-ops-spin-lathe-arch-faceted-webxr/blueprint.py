"""
blueprint.py — bmesh.ops.spin: Surface of Revolution & Partial Arc
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Produces two props in one Blender 5.1 Python session:
  hf_spin_toroid.glb  — hex-faceted low-poly torus ring
  hf_spin_arch.glb    — horseshoe arch gateway (240° partial revolution)

bmesh.ops.spin is the low-level rotational-extrude primitive that
underlies the Screw modifier.  Unlike the modifier it is destructive
but entirely context-free: no modifier stack, no depsgraph update
required, and the resulting geometry lives in the same bmesh so you
can immediately chain bevel, bridge, or extrude ops before ever
creating a Blender data-block.

How spin works internally
─────────────────────────
Each call to bmesh.ops.spin:
  1. Copies geom (verts + edges) at the identity rotation.
  2. Rotates the copy by angle/steps radians around axis through cent.
  3. Bridges edge-pairs between the previous ring and the new copy with
     quad faces.
  4. Repeats steps times.
  5. If use_merge=True, welds the final ring back to the first (step 0)
     within merge_dist — giving a sealed, seam-free revolution.

Critical: geom MUST contain both BMVert and BMEdge objects.
Passing only verts produces a fan of isolated vertices with no quads.
"""
import math
import bpy
import bmesh
from mathutils import Vector

# ── PARAMETERS ────────────────────────────────────────────────────────────────

# Toroid ring: hex cross-section revolved 360°
RING_RADIUS = 0.35   # Z-axis to hex-profile centre (metres); controls "hole" size
HEX_R       = 0.08   # hexagon circumradius; controls tube thickness
HEX_SEGS    = 6      # sides on the profile polygon (6=hexagon → flat facets)
SPIN_STEPS  = 18     # circumferential quad columns (18 gives 108 total quads)

# Horseshoe arch: rect cross-section revolved 240°
ARCH_INNER_R = 0.28  # inner bore radius
ARCH_W       = 0.07  # wall thickness (radial)
ARCH_H       = 0.07  # wall height (axial)
ARCH_DEG     = 240.0 # sweep angle; 240° produces horseshoe opening
ARCH_STEPS   = 12    # steps for the partial sweep

# ── SCENE RESET ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col   = bpy.data.collections.new("HF_Spin")
scene.collection.children.link(col)

# ── HELPERS ───────────────────────────────────────────────────────────────────
def _obj(name, me):
    o = bpy.data.objects.new(name, me)
    col.objects.link(o)
    return o

def _flat(bm):
    bm.faces.ensure_lookup_table()
    for f in bm.faces:
        f.smooth = False

def _mat(name, r, g, b, rough=0.45):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)
    bsdf.inputs['Roughness'].default_value  = rough
    return m

def _export(filepath, obj):
    for o in bpy.data.objects:
        o.select_set(o is obj)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath                            = filepath,
        use_selection                       = True,
        export_format                       = 'GLB',
        export_apply                        = True,
        export_yup                          = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format                 = 'WEBP',
    )

# ── PROP 1 · HEX-FACETED TOROID ──────────────────────────────────────────────
# A regular hexagon at (RING_RADIUS, y, z) is revolved around the world Z axis.
# Because the profile is offset RING_RADIUS from the spin axis, the swept solid
# forms a toroid — the "hole" size equals RING_RADIUS - HEX_R (minimum).
# Choosing HEX_SEGS=6 with SPIN_STEPS=18 gives facets of similar apparent width
# in both the longitudinal and latitudinal directions, matching the cel-shade
# aesthetic.
bm = bmesh.new()

hex_verts = [
    bm.verts.new(Vector((
        RING_RADIUS,
        HEX_R * math.cos(math.tau * i / HEX_SEGS),
        HEX_R * math.sin(math.tau * i / HEX_SEGS),
    )))
    for i in range(HEX_SEGS)
]

# Closed edge loop — the edges are what get extruded into quad bands by spin
hex_edges = [
    bm.edges.new([hex_verts[i], hex_verts[(i + 1) % HEX_SEGS]])
    for i in range(HEX_SEGS)
]

# spin() — full 360° revolution, sealed with use_merge
#   axis=Z through origin: standard lathe axis
#   use_merge=True + merge_dist: welds the SPIN_STEPS-th copy back to step-0,
#     eliminating the seam edge that would otherwise cause a lighting artefact
#     at the join.  merge_dist must be smaller than the shortest profile edge
#     (shortest edge here ≈ 2·HEX_R·sin(π/6) ≈ 0.08 → merge_dist 1e-4 is safe)
bmesh.ops.spin(
    bm,
    geom            = hex_verts + hex_edges,
    axis            = Vector((0.0, 0.0, 1.0)),
    cent            = Vector((0.0, 0.0, 0.0)),
    angle           = math.tau,
    steps           = SPIN_STEPS,
    use_merge       = True,
    merge_dist      = 1e-4,
    dvec            = Vector((0.0, 0.0, 0.0)),  # pure revolution; non-zero = helix
    use_normal_flip = False,
)

_flat(bm)

mat_gold   = _mat("HF_Gold",   0.83, 0.67, 0.22, rough=0.22)
mat_copper = _mat("HF_Copper", 0.72, 0.45, 0.20, rough=0.38)

me_tor = bpy.data.meshes.new("hf_spin_toroid")
bm.to_mesh(me_tor)
bm.free()
me_tor.materials.append(mat_gold)    # index 0
me_tor.materials.append(mat_copper)  # index 1
for poly in me_tor.polygons:
    # Face-centroid Z splits ring into upper gold and lower copper bands
    poly.material_index = 0 if poly.center[2] >= 0 else 1

obj_tor = _obj("hf_spin_toroid", me_tor)

# ── PROP 2 · HORSESHOE ARCH (PARTIAL SPIN) ────────────────────────────────────
# A rectangular 4-vert loop is revolved ARCH_DEG degrees (less than 360°).
# use_merge=False leaves open boundary loops at 0° and ARCH_DEG; we cap them
# explicitly with bm2.faces.new().
# result['geom_last'] conveniently holds only the geometry from the FINAL step,
# making it easy to locate the end-cap verts without indexing the full bm2.
bm2 = bmesh.new()

AI = ARCH_INNER_R            # inner X
AO = ARCH_INNER_R + ARCH_W  # outer X
v_bl = bm2.verts.new(Vector((AI, 0.0, 0.0)))
v_br = bm2.verts.new(Vector((AO, 0.0, 0.0)))
v_tr = bm2.verts.new(Vector((AO, 0.0, ARCH_H)))
v_tl = bm2.verts.new(Vector((AI, 0.0, ARCH_H)))

arch_edges = [
    bm2.edges.new([v_bl, v_br]),
    bm2.edges.new([v_br, v_tr]),
    bm2.edges.new([v_tr, v_tl]),
    bm2.edges.new([v_tl, v_bl]),
]

result = bmesh.ops.spin(
    bm2,
    geom            = [v_bl, v_br, v_tr, v_tl] + arch_edges,
    axis            = Vector((0.0, 0.0, 1.0)),
    cent            = Vector((0.0, 0.0, 0.0)),
    angle           = math.radians(ARCH_DEG),
    steps           = ARCH_STEPS,
    use_merge       = False,   # open ends — boundary loops need manual caps
    dvec            = Vector((0.0, 0.0, 0.0)),
    use_normal_flip = False,
)

# Start cap: original profile verts, wound so the outward normal faces -Y
bm2.faces.new([v_bl, v_tl, v_tr, v_br])

# End cap: pull the 4 BMVerts from result['geom_last']
end_verts = [e for e in result['geom_last'] if isinstance(e, bmesh.types.BMVert)]
if len(end_verts) == 4:
    by_z = sorted(end_verts, key=lambda v: v.co.z)
    lo   = sorted(by_z[:2], key=lambda v: v.co.x)  # [inner-lo, outer-lo]
    hi   = sorted(by_z[2:], key=lambda v: v.co.x)  # [inner-hi, outer-hi]
    bm2.faces.new([lo[1], hi[1], hi[0], lo[0]])

bmesh.ops.recalc_face_normals(bm2, faces=bm2.faces[:])
_flat(bm2)

mat_stone = _mat("HF_Stone", 0.55, 0.51, 0.46, rough=0.72)
me_arch   = bpy.data.meshes.new("hf_spin_arch")
bm2.to_mesh(me_arch)
bm2.free()
me_arch.materials.append(mat_stone)
obj_arch = _obj("hf_spin_arch", me_arch)
obj_arch.location.x = 1.1  # side-by-side in scene

# ── EXPORT ─────────────────────────────────────────────────────────────────────
_dir = bpy.path.abspath("//")
_export(_dir + "hf_spin_toroid.glb", obj_tor)
_export(_dir + "hf_spin_arch.glb",   obj_arch)
print("✓  hf_spin_toroid.glb + hf_spin_arch.glb written to", _dir)
