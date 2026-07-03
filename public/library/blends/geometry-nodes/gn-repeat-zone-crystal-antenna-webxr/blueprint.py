"""
GN Repeat Zone — Iterative L-System Crystal Antenna for WebXR
Blender 5.1  |  CC0  |  Holoflow Studio
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TECHNIQUE
The Geometry Nodes Repeat Zone (Blender 4.0+, stable in 5.1) runs its inner
body N times per depsgraph evaluation, threading geometry state through named
'items' from one iteration to the next.  Unlike the Simulation Zone (one
evaluation pass per playback frame), all N iterations collapse into a single
frame — keyframe the 'Iterations' modifier input and scrub to watch the
crystal grow in real-time with no cache invalidation.

Each Repeat Zone iteration:
  1. Receives 'Accum'  — geometry accumulated so far (starts empty)
  2. Receives 'Tips'   — a point cloud of current branch endpoints (starts at origin)
  3. Receives 'Scale'  — the current tube radius and length multiplier (starts at TUBE_RADIUS)
  4. For each of the 3 L-system directions (BRANCH_ANGLE from +Z, 120° apart):
       a. Sweeps a TUBE_VERTS-sided profile along a CurveLine whose endpoint
          equals the branch direction unit vector × BRANCH_LENGTH × Scale.
          CurveLine + CurveToMesh encodes both direction and length in local
          geometry, so InstanceOnPoints needs no rotation arithmetic.
       b. Places one tube instance at every tip in the current Tips cloud.
       c. Moves the current Tips cloud to the child positions.
  5. Joins all 3 branch tube instance clouds, realises them, and joins with Accum.
  6. Joins the 3 child tip clouds → new Tips for the next iteration.
  7. Multiplies Scale by SHRINK_RATIO → taper per generation.

After ITERATIONS=5, Accum holds 3+9+27+81+243 = 363 tube segments.
MergeByDistance welds coincident vertices at branching nodes.

WHY REPEAT ZONE, NOT SIMULATION ZONE
Simulation Zones write one timestep per playback frame; you must play to
frame N to see N iterations.  The Repeat Zone evaluates all iterations in
one depsgraph pass so you can keyframe 'Iterations' (range 1–8) and scrub.

WHY CURVELINE + CURVETOMESH, NOT CYLINDER INSTANCES
A cylinder needs AlignEulerToVector + ObjectInfo reference + rotation math.
CurveLine(end=branch_offset) + CurveToMesh with a circle profile bakes the
direction into the instance's local geometry; InstanceOnPoints places it at
each tip with no rotation argument needed.

RUN
    blender --background --python blueprint.py
OUTPUTS
    crystal_antenna.blend
    crystal_antenna.glb  (Draco 6, +Y up, WebP)

Outside source — Blender Manual: Repeat Zone
  https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/repeat_zone.html
  Licence: CC BY-SA 4.0  ·  © Blender Foundation  ·  sibling: github.com/blender/blender
Outside source — The Algorithmic Beauty of Plants (Prusinkiewicz & Lindenmayer)
  https://algorithmicbotany.org/papers/abop/abop.pdf
  Licence: free-to-read distribution provided by authors
"""

import bpy
import math

# ── CONSTANTS ──────────────────────────────────────────────────────────────────
GN_NAME          = "CrystalAntennaGN"
HOST_NAME        = "crystal_antenna"
MAT_NAME         = "crystal_metal"
OUTPUT_BLEND     = "//crystal_antenna.blend"
OUTPUT_GLB       = "//crystal_antenna.glb"

ITERATIONS       = 5         # 3^5 = 243 tips; keep ≤ 7 or vertex count explodes
BRANCH_ANGLE_DEG = 38.0      # tilt from +Z; 38° gives a classic spiky silhouette
BRANCH_LENGTH    = 0.38      # first-generation branch length in metres
SHRINK_RATIO     = 0.63      # length+radius multiplier per iteration
TUBE_RADIUS      = 0.030     # first-generation tube cross-section radius
TUBE_VERTS       = 6         # hex cross-section → ~25 % fewer tris than 8-sided

# Pre-computed unit vectors for the three L-system branch directions.
# Each lies on a cone of half-angle BRANCH_ANGLE_DEG centred on +Z,
# separated by 120° in azimuth.  Hardcoding avoids VectorRotate nodes.
_s = math.sin(math.radians(BRANCH_ANGLE_DEG))
_c = math.cos(math.radians(BRANCH_ANGLE_DEG))
BRANCH_DIRS = [
    (_s * math.sin(az), _s * math.cos(az), _c)
    for az in (0.0, math.tau / 3.0, 2.0 * math.tau / 3.0)
]


# ── MINI-HELPERS ───────────────────────────────────────────────────────────────
def N(nodes, ntype, x, y):
    nd = nodes.new(ntype)
    nd.location = (x, y)
    return nd


def L(links, src, dst):
    links.new(src, dst)


# ── SCENE SETUP ────────────────────────────────────────────────────────────────
def clear_scene():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for ng in list(bpy.data.node_groups):
        bpy.data.node_groups.remove(ng)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)


# ── MATERIAL ──────────────────────────────────────────────────────────────────
def make_material():
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Metallic'].default_value   = 0.92
    bsdf.inputs['Roughness'].default_value  = 0.12
    # Ice-blue tint; IOR 2.42 (diamond) sharpens specular highlights
    bsdf.inputs['Base Color'].default_value = (0.78, 0.86, 1.0, 1.0)
    bsdf.inputs['IOR'].default_value        = 2.42
    out.location  = (300, 0)
    bsdf.location = (0, 0)
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat


# ── NODE TREE ─────────────────────────────────────────────────────────────────
def build_node_tree(mat):
    ng    = bpy.data.node_groups.new(GN_NAME, 'GeometryNodeTree')
    nodes = ng.nodes
    links = ng.links

    # Group interface — 'Iterations' exposed to the modifier panel
    iface = ng.interface
    iface.new_socket('Geometry',   in_out='OUTPUT', socket_type='NodeSocketGeometry')
    it    = iface.new_socket('Iterations', in_out='INPUT',  socket_type='NodeSocketInt')
    it.default_value = ITERATIONS
    it.min_value     = 1
    it.max_value     = 8

    gin  = N(nodes, 'NodeGroupInput',  -900,    0)
    gout = N(nodes, 'NodeGroupOutput',  1100,   0)

    # Repeat Zone boundary nodes — auto-pair on creation in the same group.
    # Items added to the Output node; matching sockets appear on Input node.
    # rpt_in.inputs  : [Iterations, Accum_init, Tips_init, Scale_init]
    # rpt_in.outputs : [Iteration Index, Accum_current, Tips_current, Scale_current]
    # rpt_out.inputs : [Accum_next, Tips_next, Scale_next]
    # rpt_out.outputs: [Accum_final, Tips_final, Scale_final]
    rpt_in  = N(nodes, 'GeometryNodeRepeatInput',  -450,  300)
    rpt_out = N(nodes, 'GeometryNodeRepeatOutput',  800,  300)
    rpt_out.items.new('GEOMETRY', 'Accum')
    rpt_out.items.new('GEOMETRY', 'Tips')
    rpt_out.items.new('FLOAT',    'Scale')

    # Wire Iterations group input → repeat count
    L(links, gin.outputs['Iterations'], rpt_in.inputs[0])

    # Initial Accum: unconnected → Blender defaults to empty geometry
    # Initial Tips: single point at origin (the antenna root)
    root_pt = N(nodes, 'GeometryNodePoints', -700, -50)
    root_pt.inputs['Count'].default_value    = 1
    root_pt.inputs['Position'].default_value = (0.0, 0.0, 0.0)
    L(links, root_pt.outputs['Geometry'],  rpt_in.inputs[2])  # Tips_init

    # Initial Scale: TUBE_RADIUS (absolute radius for first generation)
    rpt_in.inputs[3].default_value = TUBE_RADIUS              # Scale_init

    # ── Zone body: shared per-iteration scalars ──
    # BRANCH_LENGTH × current Scale → used as both CurveLine endpoint magnitude
    # and the VectorMath scale argument
    m_bl = N(nodes, 'ShaderNodeMath', -200, 500)
    m_bl.operation = 'MULTIPLY'
    m_bl.inputs[0].default_value = BRANCH_LENGTH
    L(links, rpt_in.outputs[3], m_bl.inputs[1])

    # current Scale × TUBE_RADIUS → circle radius for all 3 cross-section profiles
    m_tr = N(nodes, 'ShaderNodeMath', -200, 640)
    m_tr.operation = 'MULTIPLY'
    m_tr.inputs[0].default_value = TUBE_RADIUS
    L(links, rpt_in.outputs[3], m_tr.inputs[1])

    branch_tube_outs = []
    child_tip_outs   = []

    for i, (bx, by, bz) in enumerate(BRANCH_DIRS):
        col = i * 240  # horizontal layout offset per direction

        # VectorMath SCALE: branch_direction_unit × (BRANCH_LENGTH × current_Scale)
        # SCALE socket is inputs[3] on ShaderNodeVectorMath when operation='SCALE'
        vm = N(nodes, 'ShaderNodeVectorMath', col, 300)
        vm.operation = 'SCALE'
        vm.inputs[0].default_value = (bx, by, bz)  # unit vector, pre-computed
        L(links, m_bl.outputs['Value'], vm.inputs['Scale'])

        # CurveLine from (0,0,0) to branch_offset — encodes direction AND length
        # in local geometry so InstanceOnPoints needs no rotation argument
        cl = N(nodes, 'GeometryNodeCurvePrimitiveLine', col, 160)
        L(links, vm.outputs['Vector'], cl.inputs['End'])

        # Hex circle cross-section; radius shrinks with Scale each generation
        circ = N(nodes, 'GeometryNodeCurvePrimitiveCircle', col, 20)
        circ.mode = 'RADIUS'
        circ.inputs['Resolution'].default_value = TUBE_VERTS
        L(links, m_tr.outputs['Value'], circ.inputs['Radius'])

        # Sweep profile along line → a capped hex tube from tip → child
        c2m = N(nodes, 'GeometryNodeCurveToMesh', col, -120)
        c2m.inputs['Fill Caps'].default_value = True
        L(links, cl.outputs['Curve'],   c2m.inputs['Curve'])
        L(links, circ.outputs['Curve'], c2m.inputs['Profile Curve'])

        # One tube instance per current tip, positioned so root = tip, end = child
        iop = N(nodes, 'GeometryNodeInstanceOnPoints', col, -270)
        L(links, rpt_in.outputs[2],   iop.inputs['Points'])    # current Tips
        L(links, c2m.outputs['Mesh'], iop.inputs['Instance'])
        branch_tube_outs.append(iop.outputs['Instances'])

        # Move current Tips by branch_offset → child positions for next iteration
        sp = N(nodes, 'GeometryNodeSetPosition', col, -420)
        L(links, rpt_in.outputs[2],    sp.inputs['Geometry'])  # current Tips
        L(links, vm.outputs['Vector'], sp.inputs['Offset'])
        child_tip_outs.append(sp.outputs['Geometry'])

    # Join 3 branch instance clouds → realise → merge into Accum
    jb = N(nodes, 'GeometryNodeJoinGeometry', 760, 200)
    for bto in branch_tube_outs:
        L(links, bto, jb.inputs['Geometry'])

    real = N(nodes, 'GeometryNodeRealizeInstances', 760, 60)
    L(links, jb.outputs['Geometry'], real.inputs['Geometry'])

    jacc = N(nodes, 'GeometryNodeJoinGeometry', 760, -80)
    L(links, rpt_in.outputs[1],        jacc.inputs['Geometry'])  # current Accum
    L(links, real.outputs['Geometry'], jacc.inputs['Geometry'])

    # Join 3 child tip clouds → new Tips for the next iteration
    jt = N(nodes, 'GeometryNodeJoinGeometry', 760, -230)
    for ct in child_tip_outs:
        L(links, ct, jt.inputs['Geometry'])

    # Scale × SHRINK_RATIO → taper tube radius and branch length each generation
    m_sh = N(nodes, 'ShaderNodeMath', 760, -380)
    m_sh.operation = 'MULTIPLY'
    m_sh.inputs[1].default_value = SHRINK_RATIO
    L(links, rpt_in.outputs[3], m_sh.inputs[0])

    # Feed all three items into Repeat Output (carries to next iteration)
    L(links, jacc.outputs['Geometry'], rpt_out.inputs[0])  # new Accum
    L(links, jt.outputs['Geometry'],   rpt_out.inputs[1])  # new Tips
    L(links, m_sh.outputs['Value'],    rpt_out.inputs[2])  # new Scale

    # ── Post-zone: weld branch nodes, apply material, output ──
    mbd = N(nodes, 'GeometryNodeMergeByDistance', 950, 300)
    mbd.inputs['Distance'].default_value = TUBE_RADIUS * 0.04
    L(links, rpt_out.outputs[0], mbd.inputs['Geometry'])

    smat = N(nodes, 'GeometryNodeSetMaterial', 950, 160)
    smat.inputs['Material'].default_value = mat
    L(links, mbd.outputs['Geometry'], smat.inputs['Geometry'])
    L(links, smat.outputs['Geometry'], gout.inputs['Geometry'])

    return ng


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    clear_scene()
    mat  = make_material()

    mesh = bpy.data.meshes.new(HOST_NAME)
    host = bpy.data.objects.new(HOST_NAME, mesh)
    bpy.context.scene.collection.objects.link(host)
    bpy.context.view_layer.objects.active = host

    ng  = build_node_tree(mat)
    mod = host.modifiers.new("CrystalGN", 'NODES')
    mod.node_group = ng

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))

    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        export_format='GLB',
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_materials='EXPORT',
        use_selection=False,
    )
    print(f"[crystal-antenna] Saved {OUTPUT_BLEND} and {OUTPUT_GLB}")
    print(f"  363 tube segments · {363 * 14} vertices (approx.) · Draco 6")


if __name__ == '__main__':
    main()
