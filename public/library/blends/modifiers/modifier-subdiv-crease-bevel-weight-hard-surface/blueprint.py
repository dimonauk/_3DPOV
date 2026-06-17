"""
Modifier Stack — Subdivision Surface + Edge Crease + Bevel Weight:
Classic Hard-Surface SubD Workflow
===================================================================
Blender 5.1 | Holoflow Studio | CC0

Three distinct sharpness controls occupy three different roles in every
hard-surface SubD model:

  SUPPORT LOOPS — two edge loops placed close to a corner restrict
    Catmull-Clark curvature without touching the corner itself.
    Adds edge density; ideal where geometry permits.

  EDGE CREASE — a per-edge float [0, 1] stored in the mesh attribute
    'crease_edge'.  At 1.0 the SubD algorithm treats the edge as fixed;
    at 0.7 it partially pins it.  Adds no geometry — correct for long
    silhouette rails that cannot absorb loop cuts without creating n-gons.

  BEVEL WEIGHT — a per-edge float [0, 1] stored in 'bevel_weight_edge'.
    The Bevel modifier (Limit Method: Weight) applies its chamfer ONLY to
    edges with bevel_weight > 0.  This creates real geometry before SubDiv
    sees the mesh, so the chamfer is geometrically present in the final
    surface — not just a sharpness artefact.

MODIFIER ORDER (matters):
  1. Bevel  (first, Weight limit) — chamfers marked edges before SubDiv
  2. Subdivision Surface           — smooths everything, respects Crease
  3. Weighted Normal               — corrects shading at planar-to-curved
                                     transitions; must come last

SCENE: machined mount block with a recessed panel groove on top.
  - Outer silhouette edges: Crease = 1.0 (never round the profile)
  - Vertical corner pillars: Crease = 1.0
  - Groove inner rim: Crease = 0.5 (slight pull for organic transition)
  - Top outer rim: Bevel Weight = 1.0 (visible chamfer strip)
  - Base outer rim: Bevel Weight = 0.6 (lighter bottom chamfer)

WHY NO LOOP CUTS IN THE SCRIPT:
  bmesh.ops.bisect_plane replicates loop cuts but the cut must be placed
  at a precise normalised distance from the edge — that arithmetic is
  fiddly and meshes built procedurally often have edge-loop-incompatible
  topology (T-junctions from the panel groove).  Crease + Bevel solves
  the same problem without topology constraints and is therefore the
  correct tool for procedural/generated meshes.
"""

import bpy
import bmesh

# ── Parameters ────────────────────────────────────────────────────────────────
OBJ_NAME        = "MountBlock"
MAT_NAME        = "MachinedAluminium"
W, D, H         = 0.80, 0.30, 0.22      # block width, depth, height (m)
PANEL_INSET     = 0.055                  # groove setback from outer rim (m)
PANEL_DEPTH     = -0.010                 # groove depth below top face (m, negative)
CREASE_OUTER    = 1.0                    # silhouette / corner edges: fully locked
CREASE_GROOVE   = 0.5                    # groove rim: half tension
BEVEL_W_TOP     = 1.0                    # top rim chamfer active at full weight
BEVEL_W_BASE    = 0.6                    # base rim lighter chamfer
BEVEL_AMOUNT    = 0.010                  # chamfer width (m)
BEVEL_SEGMENTS  = 2                      # 2 segs = single profile chamfer
BEVEL_PROFILE   = 0.5                    # 0.5 = circular arc; 1.0 = straight
SUBDIV_LEVELS_V = 2                      # viewport subdivision levels
SUBDIV_LEVELS_R = 3                      # render subdivision levels
RENDER_W        = 1280
RENDER_H        = 720
RENDER_SAMPLES  = 64
OUTPUT_PATH     = "//mount_block"


# ── Scene reset ───────────────────────────────────────────────────────────────
def reset_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


# ── Material ──────────────────────────────────────────────────────────────────
def make_mat():
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    out  = nodes.new('ShaderNodeOutputMaterial')
    bsdf.inputs['Base Color'].default_value = (0.62, 0.63, 0.65, 1.0)  # light alloy
    bsdf.inputs['Metallic'].default_value    = 1.0
    bsdf.inputs['Roughness'].default_value   = 0.18
    # Coat (Blender 5.1 Principled v2): subtle clearcoat for machined polish
    bsdf.inputs['Coat Weight'].default_value   = 0.25
    bsdf.inputs['Coat Roughness'].default_value = 0.08
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat


# ── Geometry ──────────────────────────────────────────────────────────────────
def build_block():
    """
    Create mount block mesh, tag creases and bevel weights.

    Vertex layout (created in order so indices are predictable):
      b0-b3  : bottom ring (z = 0)
      t0-t3  : top ring (z = H)
      p0-p3  : top inset rim (z = H, offset by PANEL_INSET)
      g0-g3  : groove floor (z = H + PANEL_DEPTH)
    """
    mesh = bpy.data.meshes.new(OBJ_NAME)
    obj  = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()
    hw, hd = W / 2, D / 2

    # Bottom ring
    b0 = bm.verts.new((-hw, -hd, 0.0))
    b1 = bm.verts.new(( hw, -hd, 0.0))
    b2 = bm.verts.new(( hw,  hd, 0.0))
    b3 = bm.verts.new((-hw,  hd, 0.0))

    # Top ring
    t0 = bm.verts.new((-hw, -hd, H))
    t1 = bm.verts.new(( hw, -hd, H))
    t2 = bm.verts.new(( hw,  hd, H))
    t3 = bm.verts.new((-hw,  hd, H))

    # Top inset rim (panel groove outer boundary)
    pi = PANEL_INSET
    p0 = bm.verts.new((-hw + pi, -hd + pi, H))
    p1 = bm.verts.new(( hw - pi, -hd + pi, H))
    p2 = bm.verts.new(( hw - pi,  hd - pi, H))
    p3 = bm.verts.new((-hw + pi,  hd - pi, H))

    # Groove floor
    gz = H + PANEL_DEPTH
    g0 = bm.verts.new((-hw + pi, -hd + pi, gz))
    g1 = bm.verts.new(( hw - pi, -hd + pi, gz))
    g2 = bm.verts.new(( hw - pi,  hd - pi, gz))
    g3 = bm.verts.new((-hw + pi,  hd - pi, gz))

    bm.verts.ensure_lookup_table()

    # Faces: winding CCW when viewed from outside
    bm.faces.new([b0, b3, b2, b1])          # bottom
    bm.faces.new([b0, b1, t1, t0])          # front side
    bm.faces.new([b1, b2, t2, t1])          # right side
    bm.faces.new([b2, b3, t3, t2])          # back side
    bm.faces.new([b3, b0, t0, t3])          # left side
    bm.faces.new([t0, t1, p1, p0])          # top front annulus
    bm.faces.new([t1, t2, p2, p1])          # top right annulus
    bm.faces.new([t2, t3, p3, p2])          # top back annulus
    bm.faces.new([t3, t0, p0, p3])          # top left annulus
    bm.faces.new([p0, p1, g1, g0])          # groove front wall
    bm.faces.new([p1, p2, g2, g1])          # groove right wall
    bm.faces.new([p2, p3, g3, g2])          # groove back wall
    bm.faces.new([p3, p0, g0, g3])          # groove left wall
    bm.faces.new([g0, g1, g2, g3])          # groove floor

    bm.faces.ensure_lookup_table()
    bm.normal_update()

    # ── Edge crease ───────────────────────────────────────────────────────────
    # crease_edge attribute: Blender 5.1 stores this via bmesh crease layer,
    # which maps to the named attribute 'crease_edge' on the mesh.
    cl = bm.edges.layers.crease.verify()

    def crease_pair(va, vb, val):
        e = bm.edges.get([va, vb])
        if e:
            e[cl] = val

    # Outer silhouette: bottom rim + vertical corners = fully sharp
    for a, b in [(b0,b1),(b1,b2),(b2,b3),(b3,b0)]:
        crease_pair(a, b, CREASE_OUTER)
    for a, b in [(b0,t0),(b1,t1),(b2,t2),(b3,t3)]:
        crease_pair(a, b, CREASE_OUTER)

    # Groove inner rim: medium pull (SubDiv softens the step slightly)
    for a, b in [(p0,p1),(p1,p2),(p2,p3),(p3,p0)]:
        crease_pair(a, b, CREASE_GROOVE)
    for a, b in [(g0,g1),(g1,g2),(g2,g3),(g3,g0)]:
        crease_pair(a, b, CREASE_GROOVE)

    # ── Write to mesh ─────────────────────────────────────────────────────────
    bm.to_mesh(mesh)
    bm.free()

    # ── Bevel weight (mesh attribute API — correct for Blender 3.4+) ─────────
    if "bevel_weight_edge" not in mesh.attributes:
        mesh.attributes.new(name="bevel_weight_edge", type='FLOAT', domain='EDGE')
    bwt = mesh.attributes["bevel_weight_edge"]

    # Re-open bmesh to look up edge indices by vertex positions
    bm2 = bmesh.new()
    bm2.from_mesh(mesh)
    bm2.edges.ensure_lookup_table()
    bm2.verts.ensure_lookup_table()

    def edge_idx(vi, vj):
        v_a = bm2.verts[vi]
        for e in v_a.link_edges:
            if e.other_vert(v_a) == bm2.verts[vj]:
                return e.index
        return None

    # Vertex creation order: b0=0,b1=1,b2=2,b3=3, t0=4,t1=5,t2=6,t3=7, p0=8..
    top_rim   = [(4,5),(5,6),(6,7),(7,4)]   # t0-t1-t2-t3
    base_rim  = [(0,1),(1,2),(2,3),(3,0)]   # b0-b1-b2-b3

    for vi, vj in top_rim:
        idx = edge_idx(vi, vj)
        if idx is not None:
            bwt.data[idx].value = BEVEL_W_TOP

    for vi, vj in base_rim:
        idx = edge_idx(vi, vj)
        if idx is not None:
            bwt.data[idx].value = BEVEL_W_BASE

    bm2.to_mesh(mesh)
    bm2.free()
    mesh.update()
    return obj


# ── Modifiers ─────────────────────────────────────────────────────────────────
def add_modifier_stack(obj):
    """
    Order matters: Bevel first (chamfer geometry), then SubDiv (smooth),
    then Weighted Normal (fix shading seams).
    """
    # 1 — Bevel (limit by weight, so only tagged edges get chamfered)
    bev = obj.modifiers.new("Bevel", 'BEVEL')
    bev.limit_method  = 'WEIGHT'
    bev.width         = BEVEL_AMOUNT
    bev.segments      = BEVEL_SEGMENTS
    bev.profile       = BEVEL_PROFILE
    bev.use_clamp_overlap = True  # prevents self-intersect on tight corners
    bev.loop_slide    = True      # slides loop endpoints along adjacent edges

    # 2 — Subdivision Surface (Catmull-Clark)
    sub = obj.modifiers.new("SubDiv", 'SUBSURF')
    sub.subdivision_type = 'CATMULL_CLARK'
    sub.levels           = SUBDIV_LEVELS_V
    sub.render_levels    = SUBDIV_LEVELS_R
    sub.use_creases      = True   # honour the crease_edge attribute

    # 3 — Weighted Normal (correct shading at planar↔curved boundaries)
    wn = obj.modifiers.new("WeightedNormal", 'WEIGHTED_NORMAL')
    wn.weight          = 100    # full face-area weighting
    wn.face_influence  = True   # face strength override from Sharp edges


# ── Camera and lighting ───────────────────────────────────────────────────────
def setup_scene(obj):
    scene = bpy.context.scene
    scene.render.engine       = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = RENDER_W
    scene.render.resolution_y = RENDER_H
    scene.eevee.taa_render_samples = RENDER_SAMPLES

    # Three-point light rig
    def add_light(name, t, loc, energy, size=0.2):
        ld = bpy.data.lights.new(name, t)
        ld.energy = energy
        ld.shadow_soft_size = size
        lo = bpy.data.objects.new(name, ld)
        bpy.context.scene.collection.objects.link(lo)
        lo.location = loc
        return lo

    add_light("Key",  'AREA', ( 1.5,  -1.2, 1.8), 150, 0.5)
    add_light("Fill", 'AREA', (-1.8,   0.5, 1.0),  40, 0.8)
    add_light("Rim",  'SPOT', ( 0.2,   1.8, 0.8),  80, 0.15)

    # Camera: 45° overhead-front
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 85
    cam_obj  = bpy.data.objects.new("Camera", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    cam_obj.location = (1.2, -1.5, 1.0)
    cam_obj.rotation_euler = (1.05, 0.0, 0.65)
    scene.camera = cam_obj

    scene.render.filepath = OUTPUT_PATH


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    reset_scene()
    mat = make_mat()
    obj = build_block()
    obj.data.materials.append(mat)
    add_modifier_stack(obj)
    setup_scene(obj)
    print("MountBlock built. Apply modifiers and export GLB with:")
    print("  bpy.ops.export_scene.gltf(filepath='//mount_block.glb',")
    print("      export_apply=True, export_format='GLB',")
    print("      export_draco_mesh_compression_enable=True,")
    print("      export_draco_mesh_compression_level=6)")
