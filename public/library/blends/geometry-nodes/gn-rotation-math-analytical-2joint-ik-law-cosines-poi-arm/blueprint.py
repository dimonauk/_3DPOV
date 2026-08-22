"""
GN — Analytical 2-Joint IK: Law of Cosines Solver in a GN Modifier
====================================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

TECHNIQUE
A two-link planar IK solver built entirely in Geometry Nodes — no Simulation
Zone, no iteration, no Python at solve-time.  Given a target Empty's world
position the modifier computes both joint angles analytically via the law of
cosines, then outputs the full arm geometry (two tube segments, elbow sphere,
poi-head sphere) driven by those angles.  The modifier is pure forward
data-flow: target position → scalar angles → arm geometry.

WHY ANALYTICAL OVER ITERATIVE
CCD and FABRIK iterate to convergence — they require a Simulation Zone to
carry state across frames.  Analytical 2R IK gives a closed-form solution in
constant time: one atan2 + two arccos calls.  The cost is applicability: it
only works when the kinematic structure is algebraically invertible.  For a
2-link planar arm (shoulder → wrist → poi) that constraint is met exactly.

ELBOW-UP vs ELBOW-DOWN
Law of cosines admits two solutions for any reachable target.  Setting
ELBOW_SIGN = -1 selects elbow-up (φ₁ = α − β).  Set +1 for elbow-down.

SINGULARITIES
When d ≥ L1+L2 (over-reach) cos(θ_e) clips to -1 → arm extends straight.
When d ≈ 0 a d_safe floor of 1 mm prevents division by zero in the β calc.
Both are handled by MINIMUM/MAXIMUM nodes — no conditionals needed.
"""

import bpy
import math

# ── parameters ──────────────────────────────────────────────────────────────
L1          = 1.50   # upper arm length  (shoulder → elbow)
L2          = 1.20   # lower arm length  (elbow → wrist / poi head)
ARM_R       = 0.055  # arm-tube radius
JOINT_R     = 0.09   # elbow-sphere radius
POI_R       = 0.19   # poi-head sphere radius
PROFILE_RES = 8      # profile circle vertex count
ELBOW_SIGN  = -1.0   # −1 = elbow-up (subtract β),  +1 = elbow-down (add β)
TREE_NAME   = "HF_2JointIK"

# ── GN helpers ───────────────────────────────────────────────────────────────

def N(nd, bl_id, lbl, x, y):
    n = nd.new(bl_id);  n.label = lbl;  n.location = (x, y);  return n

def M(nd, op, lbl, x, y):
    n = N(nd, "ShaderNodeMath", lbl, x, y);  n.operation = op;  return n

def K(nd, val, lbl, x, y):
    n = N(nd, "ShaderNodeValue", lbl, x, y);  n.outputs[0].default_value = val;  return n

def clamp11(nd, lk, src, lbl, x, y):
    """Clamp float src to [-1, 1] using MINIMUM + MAXIMUM."""
    mn = M(nd, "MINIMUM", f"min1_{lbl}", x, y)
    mn.inputs[1].default_value = 1.0
    lk.new(src, mn.inputs[0])
    mx = M(nd, "MAXIMUM", f"max1_{lbl}", x + 160, y)
    mx.inputs[1].default_value = -1.0
    lk.new(mn.outputs[0], mx.inputs[0])
    return mx.outputs[0]  # clamped output

# ── GN tree ──────────────────────────────────────────────────────────────────

def build_ik_tree():
    if TREE_NAME in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[TREE_NAME])
    ng  = bpy.data.node_groups.new(TREE_NAME, "GeometryNodeTree")
    itf = ng.interface
    itf.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    itf.new_socket("Target",   in_out="INPUT",  socket_type="NodeSocketObject")

    nd, lk = ng.nodes, ng.links

    g_in  = N(nd, "NodeGroupInput",  "GI", -2400,   0)
    g_out = N(nd, "NodeGroupOutput", "GO",  1600,   0)

    # ── target position ────────────────────────────────────────────────────
    oi = N(nd, "GeometryNodeObjectInfo", "ObjInfo", -2000, 0)
    oi.transform_space = "RELATIVE"
    lk.new(g_in.outputs["Target"], oi.inputs["Object"])
    sep = N(nd, "ShaderNodeSeparateXYZ", "SepXYZ", -1700, 0)
    lk.new(oi.outputs["Location"], sep.inputs["Vector"])

    # ── scalar constants ───────────────────────────────────────────────────
    cL1  = K(nd, L1,       "L1",  -2100, 450)
    cL2  = K(nd, L2,       "L2",  -2100, 350)
    cTwo = K(nd, 2.0,      "2",   -2100, 250)
    cPi  = K(nd, math.pi,  "π",   -2100, 150)

    # ── d² = tx² + ty² ────────────────────────────────────────────────────
    tx2 = M(nd, "MULTIPLY", "tx²",  -1400,  220);  lk.new(sep.outputs["X"], tx2.inputs[0]);  lk.new(sep.outputs["X"], tx2.inputs[1])
    ty2 = M(nd, "MULTIPLY", "ty²",  -1400,   80);  lk.new(sep.outputs["Y"], ty2.inputs[0]);  lk.new(sep.outputs["Y"], ty2.inputs[1])
    dsq = M(nd, "ADD",      "d²",   -1200,  150);  lk.new(tx2.outputs[0], dsq.inputs[0]);  lk.new(ty2.outputs[0], dsq.inputs[1])
    d   = M(nd, "SQRT",     "d",    -1000,  150);  lk.new(dsq.outputs[0], d.inputs[0])

    # d_safe: floor at 1 mm to guard the β denominator against d=0
    dSafe = M(nd, "MAXIMUM", "d_safe", -800, 150)
    dSafe.inputs[1].default_value = 0.001
    lk.new(d.outputs[0], dSafe.inputs[0])

    # ── L1², L2² ──────────────────────────────────────────────────────────
    l1s = M(nd, "MULTIPLY", "L1²", -1700, 450);  lk.new(cL1.outputs[0], l1s.inputs[0]);  lk.new(cL1.outputs[0], l1s.inputs[1])
    l2s = M(nd, "MULTIPLY", "L2²", -1700, 350);  lk.new(cL2.outputs[0], l2s.inputs[0]);  lk.new(cL2.outputs[0], l2s.inputs[1])

    # ── elbow angle  cos θ_e = (L1²+L2²−d²) / (2·L1·L2) ─────────────────
    s12  = M(nd, "ADD",      "L1²+L2²",   -1500, 450);  lk.new(l1s.outputs[0], s12.inputs[0]);  lk.new(l2s.outputs[0], s12.inputs[1])
    ne   = M(nd, "SUBTRACT", "num_e",     -1300, 450);  lk.new(s12.outputs[0], ne.inputs[0]);   lk.new(dsq.outputs[0],  ne.inputs[1])
    de1  = M(nd, "MULTIPLY", "L1·L2",     -1500, 600);  lk.new(cL1.outputs[0], de1.inputs[0]); lk.new(cL2.outputs[0],  de1.inputs[1])
    de2  = M(nd, "MULTIPLY", "2·L1·L2",   -1300, 600);  lk.new(cTwo.outputs[0],de2.inputs[0]); lk.new(de1.outputs[0],  de2.inputs[1])
    ce   = M(nd, "DIVIDE",   "cos_θe",    -1100, 520);  lk.new(ne.outputs[0], ce.inputs[0]);    lk.new(de2.outputs[0],  ce.inputs[1])
    cce  = clamp11(nd, lk, ce.outputs[0], "θe", -900, 520)
    te   = M(nd, "ARCCOSINE","θ_e",        -520, 520);  lk.new(cce, te.inputs[0])

    # ── shoulder base angle  α = atan2(ty, tx) ────────────────────────────
    alpha = M(nd, "ARCTAN2", "α=atan2(ty,tx)", -1100, -100)
    lk.new(sep.outputs["Y"], alpha.inputs[0])   # Y (numerator)
    lk.new(sep.outputs["X"], alpha.inputs[1])   # X (denominator)

    # ── correction β  cos β = (d²+L1²−L2²) / (2·d·L1) ──────────────────
    sd1  = M(nd, "ADD",      "d²+L1²",    -1300, -200);  lk.new(dsq.outputs[0], sd1.inputs[0]);    lk.new(l1s.outputs[0],  sd1.inputs[1])
    nb   = M(nd, "SUBTRACT", "num_β",     -1100, -200);  lk.new(sd1.outputs[0], nb.inputs[0]);     lk.new(l2s.outputs[0],  nb.inputs[1])
    db1  = M(nd, "MULTIPLY", "d·L1",      -1300, -350);  lk.new(dSafe.outputs[0],db1.inputs[0]);   lk.new(cL1.outputs[0],  db1.inputs[1])
    db2  = M(nd, "MULTIPLY", "2·d·L1",    -1100, -350);  lk.new(cTwo.outputs[0],db2.inputs[0]);    lk.new(db1.outputs[0],  db2.inputs[1])
    cb   = M(nd, "DIVIDE",   "cos_β",      -900, -280);  lk.new(nb.outputs[0], cb.inputs[0]);      lk.new(db2.outputs[0],  cb.inputs[1])
    ccb  = clamp11(nd, lk, cb.outputs[0], "β", -700, -280)
    tb   = M(nd, "ARCCOSINE","β",           -320, -280);  lk.new(ccb, tb.inputs[0])

    # ── φ₁ = α − β  (elbow-up; change to ADD for elbow-down) ────────────
    phi1 = M(nd, "SUBTRACT", "φ₁=α−β", -100, -100);  lk.new(alpha.outputs[0], phi1.inputs[0]);  lk.new(tb.outputs[0], phi1.inputs[1])

    # ── φ₂ = φ₁ + π − θ_e  (lower arm world angle) ──────────────────────
    pp  = M(nd, "ADD",      "φ₁+π",   100, 300);  lk.new(phi1.outputs[0], pp.inputs[0]);  lk.new(cPi.outputs[0], pp.inputs[1])
    phi2 = M(nd, "SUBTRACT", "φ₂",    300, 300);  lk.new(pp.outputs[0], phi2.inputs[0]);  lk.new(te.outputs[0], phi2.inputs[1])

    # ── elbow position (L1 along φ₁) ─────────────────────────────────────
    c1 = M(nd, "COSINE", "cos_φ₁", 100,  0);  lk.new(phi1.outputs[0], c1.inputs[0])
    s1 = M(nd, "SINE",   "sin_φ₁", 100,-80);  lk.new(phi1.outputs[0], s1.inputs[0])
    ex = M(nd, "MULTIPLY","ex",    300,  0);  lk.new(cL1.outputs[0], ex.inputs[0]);  lk.new(c1.outputs[0], ex.inputs[1])
    ey = M(nd, "MULTIPLY","ey",    300,-80);  lk.new(cL1.outputs[0], ey.inputs[0]);  lk.new(s1.outputs[0], ey.inputs[1])
    ev = N(nd, "ShaderNodeCombineXYZ", "elbow_pos", 500, 0)
    lk.new(ex.outputs[0], ev.inputs[0]);  lk.new(ey.outputs[0], ev.inputs[1])

    # ── wrist position (elbow + L2 along φ₂) ────────────────────────────
    c2 = M(nd, "COSINE", "cos_φ₂", 300, 400);  lk.new(phi2.outputs[0], c2.inputs[0])
    s2 = M(nd, "SINE",   "sin_φ₂", 300, 320);  lk.new(phi2.outputs[0], s2.inputs[0])
    lx = M(nd, "MULTIPLY","lx",    500, 400);  lk.new(cL2.outputs[0], lx.inputs[0]);  lk.new(c2.outputs[0], lx.inputs[1])
    ly = M(nd, "MULTIPLY","ly",    500, 320);  lk.new(cL2.outputs[0], ly.inputs[0]);  lk.new(s2.outputs[0], ly.inputs[1])
    wx = M(nd, "ADD","wx",         700, 400);  lk.new(ex.outputs[0], wx.inputs[0]);   lk.new(lx.outputs[0], wx.inputs[1])
    wy = M(nd, "ADD","wy",         700, 320);  lk.new(ey.outputs[0], wy.inputs[0]);   lk.new(ly.outputs[0], wy.inputs[1])
    wv = N(nd, "ShaderNodeCombineXYZ", "wrist_pos", 900, 360)
    lk.new(wx.outputs[0], wv.inputs[0]);  lk.new(wy.outputs[0], wv.inputs[1])

    # ── profile circle (shared by both tubes) ────────────────────────────
    prof = N(nd, "GeometryNodeCurvePrimitiveCircle", "Profile", -200, -600)
    prof.mode = "RADIUS"
    prof.inputs["Resolution"].default_value = PROFILE_RES
    prof.inputs["Radius"].default_value     = ARM_R

    # ── upper arm tube (root → elbow) ─────────────────────────────────────
    ul = N(nd, "GeometryNodeCurveLine", "UpperLine", 600, -500)
    lk.new(ev.outputs["Vector"], ul.inputs[1])                # End = elbow
    uc = N(nd, "GeometryNodeCurveToMesh", "UpperTube", 800, -500)
    lk.new(ul.outputs["Curve"], uc.inputs["Curve"])
    lk.new(prof.outputs["Curve"], uc.inputs["Profile Curve"])
    uc.inputs["Fill Caps"].default_value = True

    # ── lower arm tube (elbow → wrist) ────────────────────────────────────
    ll = N(nd, "GeometryNodeCurveLine", "LowerLine", 600, -630)
    lk.new(ev.outputs["Vector"], ll.inputs[0])               # Start = elbow
    lk.new(wv.outputs["Vector"], ll.inputs[1])               # End   = wrist
    lc = N(nd, "GeometryNodeCurveToMesh", "LowerTube", 800, -630)
    lk.new(ll.outputs["Curve"], lc.inputs["Curve"])
    lk.new(prof.outputs["Curve"], lc.inputs["Profile Curve"])
    lc.inputs["Fill Caps"].default_value = True

    # ── elbow joint sphere ────────────────────────────────────────────────
    ep  = N(nd, "GeometryNodePoints", "ElbowPt", 600, -760);  ep.inputs["Count"].default_value = 1
    esp = N(nd, "GeometryNodeSetPosition", "ElbowSPos", 800, -760)
    lk.new(ep.outputs["Geometry"],     esp.inputs["Geometry"])
    lk.new(ev.outputs["Vector"],       esp.inputs["Position"])
    ei  = N(nd, "GeometryNodeMeshIcoSphere", "ElbowIco", 600, -880)
    ei.inputs["Radius"].default_value       = JOINT_R
    ei.inputs["Subdivisions"].default_value = 1
    eon = N(nd, "GeometryNodeInstanceOnPoints", "ElbowInst", 1000, -820)
    lk.new(esp.outputs["Geometry"],    eon.inputs["Points"])
    lk.new(ei.outputs["Mesh"],         eon.inputs["Instance"])
    eri = N(nd, "GeometryNodeRealizeInstances", "ElbowReal", 1200, -820)
    lk.new(eon.outputs["Instances"],   eri.inputs["Geometry"])

    # ── poi head sphere ───────────────────────────────────────────────────
    wp  = N(nd, "GeometryNodePoints", "WristPt", 600,-1000);  wp.inputs["Count"].default_value = 1
    wsp = N(nd, "GeometryNodeSetPosition", "WristSPos", 800,-1000)
    lk.new(wp.outputs["Geometry"],     wsp.inputs["Geometry"])
    lk.new(wv.outputs["Vector"],       wsp.inputs["Position"])
    wi  = N(nd, "GeometryNodeMeshIcoSphere", "PoiIco", 600,-1100)
    wi.inputs["Radius"].default_value       = POI_R
    wi.inputs["Subdivisions"].default_value = 2
    won = N(nd, "GeometryNodeInstanceOnPoints", "PoiInst", 1000,-1050)
    lk.new(wsp.outputs["Geometry"],    won.inputs["Points"])
    lk.new(wi.outputs["Mesh"],         won.inputs["Instance"])
    wri = N(nd, "GeometryNodeRealizeInstances", "PoiReal", 1200,-1050)
    lk.new(won.outputs["Instances"],   wri.inputs["Geometry"])

    # ── join all ──────────────────────────────────────────────────────────
    jn = N(nd, "GeometryNodeJoinGeometry", "Join", 1400, 0)
    for src in (uc.outputs["Mesh"], lc.outputs["Mesh"],
                eri.outputs["Geometry"], wri.outputs["Geometry"]):
        lk.new(src, jn.inputs["Geometry"])
    lk.new(jn.outputs["Geometry"], g_out.inputs["Geometry"])
    return ng


# ── scene setup ───────────────────────────────────────────────────────────────

def new_emission_mat(name, color_rgba):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emi = nt.nodes.new("ShaderNodeEmission")
    emi.inputs["Color"].default_value = color_rgba
    emi.inputs["Strength"].default_value = 1.5
    nt.links.new(emi.outputs["Emission"], out.inputs["Surface"])
    return mat


def run():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scn = bpy.context.scene
    scn.unit_settings.system = "METRIC"
    scn.render.engine = "BLENDER_EEVEE_NEXT"

    # Target empty — starts at a reachable position
    bpy.ops.object.empty_add(type="SPHERE", location=(1.8, 1.4, 0.0))
    target = bpy.context.active_object
    target.name = "PoiTarget"
    target.empty_display_size = 0.15

    # Arm mesh object
    bpy.ops.mesh.primitive_plane_add(size=0.01, location=(0, 0, 0))
    arm_ob = bpy.context.active_object
    arm_ob.name = "PoiArm"

    ng  = build_ik_tree()
    mod = arm_ob.modifiers.new("IK", "NODES")
    mod.node_group = ng
    mod["Socket_1"] = target   # "Target" input slot

    # Shader
    arm_ob.data.materials.append(new_emission_mat("HF_Arm", (0.3, 0.7, 1.0, 1.0)))

    # Camera & world
    bpy.ops.object.camera_add(location=(0, -6, 2))
    cam = bpy.context.active_object
    cam.rotation_euler = (1.2, 0, 0)
    scn.camera = cam

    world = bpy.data.worlds.new("HF_World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.03, 0.03, 0.05, 1.0)
    scn.world = world

    bpy.ops.wm.save_as_mainfile(
        filepath="//hf_2joint_ik.blend"
    )
    print("Saved hf_2joint_ik.blend — set PoiTarget location and observe arm tracking.")


if __name__ == "__main__":
    run()
