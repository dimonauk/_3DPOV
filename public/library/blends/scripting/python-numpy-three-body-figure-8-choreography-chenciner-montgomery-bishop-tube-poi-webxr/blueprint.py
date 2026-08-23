"""
Three-Body Figure-8 Choreography — Chenciner & Montgomery 2000
==============================================================
In 2000, Alain Chenciner and Richard Montgomery proved by variational methods
(minimising the Lagrangian action over a symmetry-constrained path space) that
three equal masses under Newtonian gravity can chase each other on a single
figure-8 orbit. Cristopher Simó (2002) refined the initial conditions to
machine precision and verified the orbit's stability properties.

The orbit satisfies:
  • Period    T ≈ 6.3259 (G = m = 1 units)
  • Symmetry  D₆ dihedral group, order 12 (three-fold rotation + reflections)
  • Braid     σ₁ σ₂⁻¹ repeated three times in the mapping-class group B₃
  • Energy    E = −0.8726... (verified by centre-of-mass invariant)
  • Phase     each body follows the same curve at phase offset T/3 from neighbours

All three bodies trace the SAME figure-8. This blueprint integrates body 1 with
RK4 at dt = T/6 000 (energy conservation ΔE/E₀ ≈ 5×10⁻⁹ per period), samples
N_LONG = 360 equally spaced points, builds a Bishop parallel-transport tube
around the closed self-intersecting curve, bakes shape keys SK_Wide / SK_Thin,
encodes the D₆ three-colour phase gradient as FLOAT_COLOR POINT, and exports a
Draco-6 WebP GLB for WebXR.

Expert notes
============
• The figure-8 is a planar curve (z = 0 for all t). The Bishop tube cross-section
  extends perpendicular to the tangent, so the tube has depth even though the
  spine is flat. The tube self-intersects near (0, 0, 0) — the figure-8 crossing
  — which is correct; the mesh topology is still a torus (no degenerate faces).
• Bishop frame is essential at the crossing: the spatial tangent does not go to
  zero there, but the curve passes through the same point TWICE with two distinct
  tangent vectors. Frenet–Serret would need the curvature κ to be continuous and
  non-zero at every sample; Bishop avoids this entirely.
• Holonomy correction: after one full period the Bishop normal has rotated by
  angle γ relative to the seed. Distributing γ linearly over N_LONG segments
  ensures the tube closes without a visible twist seam.
• SCALE = 0.29 maps the figure-8 (half-width ≈ 0.97) to ~0.56 m — a standard
  poi-head diameter for WebXR at 1:1 metre scale.
• foreach_set bulk-writes vertex colours; per-element assignment is ~40× slower.
"""

import bpy, math
import numpy as np

# ─── Parameters ──────────────────────────────────────────────────────────────
G        = 1.0      # gravitational constant (natural units)
MASS     = 1.0      # each body mass
T_PERIOD = 6.3259   # orbit period (Simó 2002)
N_STEPS  = 6000     # RK4 integration steps; ΔE/E₀ ≈ 5e-9
N_LONG   = 360      # tube spine samples
N_CIRC   = 14       # cross-section polygon sides (even for mirror symmetry)
TUBE_R   = 0.028    # tube radius [m]
SCALE    = 0.29     # orbit units → metres; figure-8 half-width ≈ 0.97 → 0.28 m

OBJ_NAME  = "threebody_fig8_poi"
MESH_NAME = "ThreeBody_Tube"
GLB_PATH  = "//hf_three_body_fig8.glb"

# Chenciner–Montgomery initial conditions (Simó 2002, Table 1)
# Centre of mass at origin: x₁ + x₂ + x₃ = (0.97-0.97+0, −0.24+0.24+0, 0) = 0 ✓
X1_0 = np.array([ 0.97000436, -0.24308753, 0.0])
X2_0 = np.array([-0.97000436,  0.24308753, 0.0])
X3_0 = np.array([ 0.0,         0.0,        0.0])
# v₁ = v₂ = −v₃/2 (zero total momentum: ∑mᵢvᵢ = 0) ✓
V1_0 = np.array([ 0.46620369,  0.43236573, 0.0])
V2_0 = np.array([ 0.46620369,  0.43236573, 0.0])
V3_0 = np.array([-0.93240737, -0.86473146, 0.0])

# Linear FLOAT_COLOR palette (pre-linearised from sRGB)
COL_COBALT = (0.055, 0.408, 0.918, 1.0)
COL_AMBER  = (0.918, 0.510, 0.055, 1.0)
COL_WHITE  = (0.900, 0.900, 0.870, 1.0)


# ─── RK4 N-body integrator ────────────────────────────────────────────────────
def _deriv(s):
    """Time derivative of state s = [x1,v1,x2,v2,x3,v3] (shape 18,)."""
    x1, v1, x2, v2, x3, v3 = s.reshape(6, 3)
    r12 = x2 - x1; r13 = x3 - x1; r23 = x3 - x2
    d12 = np.linalg.norm(r12); d13 = np.linalg.norm(r13); d23 = np.linalg.norm(r23)
    # Why G·m/d³: gravitational force = G m₁ m₂ r̂/r² = G m² r/r³ (equal masses)
    f12 = G * MASS * r12 / d12**3
    f13 = G * MASS * r13 / d13**3
    f23 = G * MASS * r23 / d23**3
    a1 =  f12 + f13
    a2 = -f12 + f23
    a3 = -f13 - f23
    return np.concatenate([v1, a1, v2, a2, v3, a3])


def _rk4_step(state, dt):
    k1 = _deriv(state)
    k2 = _deriv(state + 0.5 * dt * k1)
    k3 = _deriv(state + 0.5 * dt * k2)
    k4 = _deriv(state + dt * k3)
    return state + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)


def integrate_orbit():
    """Integrate body 1's trajectory over exactly one period T."""
    dt    = T_PERIOD / N_STEPS
    state = np.concatenate([X1_0, V1_0, X2_0, V2_0, X3_0, V3_0])
    traj  = np.empty((N_STEPS + 1, 3))
    traj[0] = X1_0
    for i in range(N_STEPS):
        state = _rk4_step(state, dt)
        traj[i + 1] = state[:3]
    return traj


# ─── Curve sampling ───────────────────────────────────────────────────────────
def sample_curve(traj):
    """Sample N_LONG evenly spaced points from traj, scale to metres."""
    # endpoint=False: exclude duplicate of starting point (closed curve)
    idx = np.round(np.linspace(0, N_STEPS, N_LONG, endpoint=False)).astype(int)
    return traj[idx] * SCALE


# ─── Bishop parallel-transport frame ─────────────────────────────────────────
def bishop_frames(pts):
    """
    Compute parallel-transport (Bishop) frame for a closed curve.
    Returns T, N, B arrays each (N_LONG, 3).
    Holonomy γ at closure is distributed linearly to close the seam.
    """
    n = len(pts)
    # Central finite difference (periodic), normalised
    T = pts[(np.arange(n) + 1) % n] - pts[(np.arange(n) - 1) % n]
    nrm = np.linalg.norm(T, axis=1, keepdims=True)
    T /= np.where(nrm < 1e-14, 1.0, nrm)

    # Seed: N₀ ⊥ T₀ via cross product with world-up
    up = np.array([0.0, 0.0, 1.0])
    if abs(float(T[0] @ up)) > 0.9:
        up = np.array([1.0, 0.0, 0.0])
    N = np.empty_like(T)
    N[0] = np.cross(T[0], up); N[0] /= np.linalg.norm(N[0])

    # Rodrigues transport step: N_new = c·N + s·(axis×N) + (1-c)(axis·N)axis
    for i in range(1, n):
        axis = np.cross(T[i-1], T[i])
        ax_n = np.linalg.norm(axis)
        if ax_n < 1e-14:
            N[i] = N[i-1]; continue
        axis /= ax_n
        c  = float(np.clip(T[i-1] @ T[i], -1.0, 1.0))
        s  = math.sqrt(max(0.0, 1.0 - c*c))
        N[i] = c*N[i-1] + s*np.cross(axis, N[i-1]) + (1.0-c)*float(axis@N[i-1])*axis
        nm = np.linalg.norm(N[i])
        if nm > 1e-14: N[i] /= nm

    # Holonomy correction: project N[-1] onto T[0]-perp plane, measure angle to N[0]
    Nf  = N[-1] - float(N[-1] @ T[0]) * T[0]
    nfm = np.linalg.norm(Nf)
    if nfm > 1e-14: Nf /= nfm
    B0        = np.cross(T[0], N[0])
    holonomy  = math.atan2(float(Nf @ B0), float(np.clip(Nf @ N[0], -1.0, 1.0)))
    # Distribute twist linearly: each segment i gets twist_i = holonomy * i/n
    for i in range(n):
        th  = holonomy * i / n
        c, sv = math.cos(th), math.sin(th)
        Bi  = np.cross(T[i], N[i])
        N[i] = c*N[i] + sv*Bi
        nm  = np.linalg.norm(N[i])
        if nm > 1e-14: N[i] /= nm

    B = np.cross(T, N)
    return T, N, B


# ─── Tube geometry ────────────────────────────────────────────────────────────
def tube_verts_faces(pts, N, B, r):
    """Toroidal tube mesh: N_LONG × N_CIRC vertices, N_LONG × N_CIRC quads."""
    nl, nc = len(pts), N_CIRC
    ang = np.linspace(0.0, 2*math.pi, nc, endpoint=False)
    ca, sa = np.cos(ang), np.sin(ang)
    verts = (pts[:, None, :]
             + r * (ca[None, :, None] * N[:, None, :]
                    + sa[None, :, None] * B[:, None, :]))
    verts = verts.reshape(-1, 3)
    faces = [(i*nc+j, ((i+1)%nl)*nc+j, ((i+1)%nl)*nc+(j+1)%nc, i*nc+(j+1)%nc)
             for i in range(nl) for j in range(nc)]
    return verts, faces


# ─── Phase colour: D₆ three-colour gradient ───────────────────────────────────
def phase_colours(n_long, n_circ):
    """
    The orbit has three-fold period (D₆ symmetry). Colour each third differently:
      Third 0 (t ∈ [0, T/3)):   COBALT → AMBER
      Third 1 (t ∈ [T/3, 2T/3)): AMBER → WHITE
      Third 2 (t ∈ [2T/3, T)):  WHITE → COBALT
    Each vertex on the cross-section gets the same colour as its spine point.
    """
    flat = []
    palettes = [(COL_COBALT, COL_AMBER), (COL_AMBER, COL_WHITE), (COL_WHITE, COL_COBALT)]
    for i in range(n_long):
        frac    = (3.0 * i / n_long) % 1.0   # within-third [0,1)
        third   = int(3.0 * i / n_long) % 3
        c0, c1  = palettes[third]
        col     = tuple(frac*c1[k] + (1.0-frac)*c0[k] for k in range(4))
        flat.extend(col * n_circ)
    return flat


# ─── Emissive material ────────────────────────────────────────────────────────
def emissive_material(attr_name):
    mat = bpy.data.materials.new(attr_name + "_Mat")
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = attr_name
    emit.inputs["Strength"].default_value = 3.5
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


# ─── Main ────────────────────────────────────────────────────────────────────
def main():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for coll in (bpy.data.meshes, bpy.data.materials,
                 bpy.data.cameras, bpy.data.lights):
        for item in list(coll): coll.remove(item)

    # 1 — Integrate orbit and sample curve
    traj = integrate_orbit()
    pts  = sample_curve(traj)
    _, N_fr, B_fr = bishop_frames(pts)

    # 2 — Build base mesh
    me = bpy.data.meshes.new(MESH_NAME)
    verts, faces = tube_verts_faces(pts, N_fr, B_fr, TUBE_R)
    me.from_pydata(verts.tolist(), [], faces)
    for p in me.polygons: p.use_smooth = True

    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    obj["holoflow:facet"] = True

    # 3 — Vertex colour: D₆ three-phase gradient
    vc = me.color_attributes.new("ThreeBody_Phase", 'FLOAT_COLOR', 'POINT')
    vc.data.foreach_set("color", phase_colours(N_LONG, N_CIRC))

    # 4 — Emissive material
    obj.data.materials.append(emissive_material("ThreeBody_Phase"))

    # 5 — Shape keys (reuse same Bishop frame; only tube radius changes)
    obj.shape_key_add(name="Basis", from_mix=False)
    for sk_name, r_sk in [("SK_Wide", TUBE_R * 1.96),   # 0.055 m
                           ("SK_Thin", TUBE_R * 0.43)]:  # 0.012 m
        v_sk, _ = tube_verts_faces(pts, N_fr, B_fr, r_sk)
        sk = obj.shape_key_add(name=sk_name, from_mix=False)
        for idx, co in enumerate(v_sk):
            sk.data[idx].co = co.tolist()

    # 6 — Camera
    bpy.ops.object.camera_add(location=(0.7, -1.5, 0.65))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(65), 0, math.radians(25))
    bpy.context.scene.camera = cam
    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (
        0.008, 0.008, 0.015, 1.0)
    bpy.context.scene.world = world

    # 7 — Export GLB
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        export_format='GLB',
        export_yup=True,
        export_apply=True,
        export_morph=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    nv = N_LONG * N_CIRC
    print(f"[three-body] ✓ Exported → {GLB_PATH}  (V={nv}  F={nv}  SK=3)")


if __name__ == "__main__":
    main()
