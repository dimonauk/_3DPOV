"""
Hopf Fibration — Stereographic Projection of S³ Fibres
Linked-Torus Light Sculpture for WebXR  ·  Blender 5.1  ·  CC0
Holoflow Studio

TECHNIQUE
---------
The Hopf fibration h: S³ → S² partitions the 3-sphere into pairwise-linked
circles (fibres).  Every distinct pair of fibres links exactly once — a
topological fact with no intuitive analogue in flat 3-space.  Stereographic
projection π: S³ \ {N} → ℝ³ maps each fibre to a Villarceau circle that sits
on a torus.  Base points distributed across S² produce a family of tori nested
inside one another, their linking circles producing a light-sculpture that
feels impossible: rings that pass through rings, none touching.

MATHS
-----
Unit quaternions (a,b,c,d) ∈ ℝ⁴ with a²+b²+c²+d² = 1 form the 3-sphere S³.
The Hopf map:   h(a,b,c,d) = (2(ac+bd),  2(bc−ad),  a²+b²−c²−d²)
sends every unit quaternion to a point on S².

Section (canonical lift of p ∈ S² to S³):
    q₀ = ( √((1+p₃)/2),  −p₂/√(2(1+p₃)),  p₁/√(2(1+p₃)),  0 )
    Special case p₃ = −1: q₀ = (0, 0, 0, 1)

Full fibre over p:   { q₀ · (cos α − i sin α) : α ∈ [0, 2π) }
    i = (0,1,0,0) the quaternion imaginary unit

Right-multiplication by the phase circle e^{iα} = (cos α, sin α, 0, 0):
    q(α) = ( a₀ cos α − b₀ sin α,
             a₀ sin α + b₀ cos α,
             c₀ cos α − d₀ sin α,
             c₀ sin α + d₀ cos α )

Stereographic projection from north pole N = (1,0,0,0):
    π(a,b,c,d) = ( b/(1−a),  c/(1−a),  d/(1−a) )

WHY THIS MATTERS FOR LIGHT SCULPTURE
-------------------------------------
Each fibre is a closed loop in space.  Two fibres from non-antipodal base
points never intersect but always link.  Rendered as glowing bevel tubes with
Bloom, the sculpture reads as rings caught mid-pass through each other — a
frozen moment of topological entanglement.
"""

import math
import bpy

# ── tuneable parameters ────────────────────────────────────────────────────
PHI_COUNT      = 6      # latitude bands on S²  (0 < φ < π, excluding poles)
PSI_COUNT      = 12     # longitude steps per band
FIBRE_STEPS    = 96     # curve points per closed fibre circle
BEVEL_DEPTH    = 0.018  # tube radius (world units)
SCALE          = 1.8    # overall sculpture radius
EMISSION_STR   = 10.0   # neon glow strength in EEVEE


# ── core maths ────────────────────────────────────────────────────────────

def _hopf_section(p1, p2, p3):
    """Canonical section: lift of unit (p1,p2,p3) ∈ S² to q0 ∈ S³."""
    if p3 > -1.0 + 1e-10:
        denom = math.sqrt(2.0 * (1.0 + p3))
        return (math.sqrt(0.5 * (1.0 + p3)), -p2 / denom, p1 / denom, 0.0)
    return (0.0, 0.0, 0.0, 1.0)


def _phase_mul(q0, alpha):
    """q0 · e^{iα} where e^{iα} = (cos α, sin α, 0, 0)."""
    a0, b0, c0, d0 = q0
    ca, sa = math.cos(alpha), math.sin(alpha)
    return (a0 * ca - b0 * sa,
            a0 * sa + b0 * ca,
            c0 * ca - d0 * sa,
            c0 * sa + d0 * ca)


def _stereo(q):
    """Stereographic projection ℝ⁴ \ {N=(1,0,0,0)} → ℝ³."""
    a, b, c, d = q
    denom = 1.0 - a
    if abs(denom) < 1e-12:
        return None
    s = SCALE / denom
    return (b * s, c * s, d * s)


def fibre_polyline(p1, p2, p3, steps=FIBRE_STEPS):
    """Return the list of ℝ³ points of the fibre over (p1,p2,p3)."""
    q0 = _hopf_section(p1, p2, p3)
    pts = []
    for k in range(steps):
        alpha = 2.0 * math.pi * k / steps
        pt = _stereo(_phase_mul(q0, alpha))
        if pt is not None:
            pts.append(pt)
    return pts


# ── material helpers ───────────────────────────────────────────────────────

def _hsv_to_rgb(h, s, v):
    """HSV → (r, g, b) in [0,1]³."""
    if s == 0:
        return (v, v, v)
    h6 = (h % 1.0) * 6.0
    i = int(h6)
    f = h6 - i
    p, q2, t2 = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    return [(v, t2, p), (q2, v, p), (p, v, t2),
            (p, q2, v), (t2, p, v), (v, p, q2)][i]


def _emission_mat(name, hue, alpha=0.9):
    """Create (or reuse) a pure-emission EEVEE material."""
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.blend_method = "BLEND"
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    r, g, b = _hsv_to_rgb(hue, 0.85, 1.0)
    emit.inputs["Color"].default_value    = (r, g, b, 1.0)
    emit.inputs["Strength"].default_value = EMISSION_STR
    trans = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix   = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = alpha
    nt.links.new(trans.outputs[0], mix.inputs[1])
    nt.links.new(emit.outputs[0],  mix.inputs[2])
    nt.links.new(mix.outputs[0],   out.inputs["Surface"])
    return mat


# ── scene builder ─────────────────────────────────────────────────────────

def _clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def _make_fibre_curve(name, pts, mat):
    """Create a closed POLY curve object from a point list."""
    curve_data = bpy.data.curves.new(name, type="CURVE")
    curve_data.dimensions        = "3D"
    curve_data.bevel_depth       = BEVEL_DEPTH
    curve_data.bevel_resolution  = 3
    curve_data.use_fill_caps     = True

    spline = curve_data.splines.new("POLY")
    spline.use_cyclic_u = True
    spline.points.add(len(pts) - 1)
    for i, (x, y, z) in enumerate(pts):
        spline.points[i].co = (x, y, z, 1.0)

    obj = bpy.data.objects.new(name, curve_data)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def _setup_eevee():
    """Configure EEVEE Next for neon Bloom output."""
    scene = bpy.context.scene
    scene.render.engine       = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    eevee = scene.eevee
    eevee.use_bloom           = True
    eevee.bloom_threshold     = 0.8
    eevee.bloom_radius        = 6.0
    eevee.bloom_intensity     = 0.6
    eevee.bloom_color         = (1.0, 1.0, 1.0)


def _place_camera():
    cam_data = bpy.data.cameras.new("HopfCam")
    cam      = bpy.data.objects.new("HopfCam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    cam.location = (0.0, -6.5, 2.0)
    cam.rotation_euler = (1.18, 0.0, 0.0)


def build():
    _clear_scene()
    _setup_eevee()
    _place_camera()

    # World — pure black for contrast
    bpy.context.scene.world.node_tree.nodes["Background"].inputs[
        "Color"].default_value = (0, 0, 0, 1)

    fibre_id = 0
    for phi_idx in range(1, PHI_COUNT + 1):
        phi = math.pi * phi_idx / (PHI_COUNT + 1)
        hue = (phi_idx - 1) / max(PHI_COUNT - 1, 1)   # 0 (red) → 1 (violet)
        mat = _emission_mat(f"HopfMat_{phi_idx:02d}", hue)

        for psi_idx in range(PSI_COUNT):
            psi = 2.0 * math.pi * psi_idx / PSI_COUNT
            p1  = math.sin(phi) * math.cos(psi)
            p2  = math.sin(phi) * math.sin(psi)
            p3  = math.cos(phi)
            pts = fibre_polyline(p1, p2, p3)
            if len(pts) < 4:
                continue
            _make_fibre_curve(f"Fibre_{fibre_id:04d}", pts, mat)
            fibre_id += 1

    print(f"[Hopf] Built {fibre_id} fibre curves.")
    print("[Hopf] Export GLB: File → Export → glTF 2.0, include Apply Modifiers.")


build()
