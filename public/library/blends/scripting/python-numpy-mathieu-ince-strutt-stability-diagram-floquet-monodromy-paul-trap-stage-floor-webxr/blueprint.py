"""
Mathieu Equation — Ince–Strutt Stability Diagram
Floquet Monodromy Matrix · Vectorised RK4 · Stage Floor

Blender 5.1 · bpy + numpy · CC0

The Mathieu equation  ẍ + (a − 2q cos 2t) x = 0
is the canonical example of Hill's equation: a linear ODE with
π-periodic coefficients. Floquet theory guarantees that all solutions
are of the form  x(t) = e^{μt} p(t)  where p is π-periodic and μ
(the Floquet exponent) is determined by the monodromy matrix.

  Growth exponent:  λ = cosh⁻¹(|tr(M)/2|) / π   when |tr(M)/2| > 1
  Stable otherwise: λ = 0                          (bounded oscillations)

This script computes λ for a 160×140 grid of (a, q) values, producing
the classical Ince–Strutt diagram as a 3-D terrain where cobalt valleys
are stable and amber ridges are parametric-resonance tongues.

Algorithmic choice: two independent solutions c(t) [c(0)=1, c'(0)=0]
and s(t) [s(0)=0, s'(0)=1] are integrated simultaneously for all
22,400 parameter pairs via (Na, Nq, 2) numpy array broadcast.
No Python loop over parameters — only one loop over the N_STEPS time
steps.

Ref: NIST DLMF §28 "Mathieu Functions and Hill's Equation"
     https://dlmf.nist.gov/28  (Public Domain – US Government)
"""

import bpy
import numpy as np
from mathutils import Vector

# ── PARAMETERS ────────────────────────────────────────────────────────────────
N_A     = 160           # grid resolution in a-direction
N_Q     = 140           # grid resolution in q-direction
A_MIN   = -1.0          # a ∈ [A_MIN, A_MAX] — negative a shows eigenvalue flips
A_MAX   =  8.0          # covers tongues n=0,1,2 and the n=3 lower boundary
Q_MIN   =  0.0
Q_MAX   =  4.5          # q covers well into the 3rd tongue
N_STEPS =  400          # RK4 sub-steps per period π (accuracy ~10⁻⁸ at this res)
H_SCALE =  0.45         # peak height of resonance ridges in metres
FLOOR_W =  5.0          # x-width of the stage floor (a-direction) [m]
FLOOR_D =  4.0          # y-depth of the stage floor (q-direction) [m]

# Studio colour palette
C_STABLE  = np.array([0.02, 0.20, 0.72, 1.0])   # cobalt  — stability valley
C_MIDPT   = np.array([0.93, 0.93, 0.93, 1.0])   # white   — tongue boundary
C_UNSTBLE = np.array([0.95, 0.52, 0.04, 1.0])   # amber   — resonance ridge

MESH_NAME = "hf_ince_strutt"
OBJ_NAME  = "hf_ince_strutt_floor"

# ── FLOQUET STABILITY MAP ─────────────────────────────────────────────────────

def compute_growth_map(a_vals, q_vals, n_steps):
    """
    Vectorised Floquet monodromy over the (a, q) grid.

    Integrates the companion system
        [ẋ]   [ 0          1  ] [x]
        [ẍ] = [-(a-2q·cos2t) 0] [v]
    over t ∈ [0, π] for TWO initial conditions in parallel:
        c-type:  c(0)=1, c'(0)=0
        s-type:  s(0)=0, s'(0)=1

    Monodromy matrix  M = [[c(π), s(π)], [c'(π), s'(π)]]
    Trace:  tr(M) = c(π) + s'(π)
    Floquet exponent: λ = cosh⁻¹(|tr(M)/2|) / π  if |tr(M)/2| > 1
                         else 0.

    Shape of c and s arrays: (Na, Nq, 2), so every (a,q) pair advances
    in the same numpy operation — the only Python loop is over time.
    """
    A, Q = np.meshgrid(a_vals, q_vals, indexing='ij')   # (Na, Nq)
    T  = np.pi
    dt = T / n_steps

    # Two fundamental solution vectors: [x, v]  shape (Na, Nq, 2)
    c = np.zeros((*A.shape, 2), dtype=np.float64)
    s = np.zeros((*A.shape, 2), dtype=np.float64)
    c[..., 0] = 1.0   # c: x(0)=1, v(0)=0
    s[..., 1] = 1.0   # s: x(0)=0, v(0)=1

    def rhs(u, coef):
        # Mathieu RHS: d[x,v]/dt = [v, -coef·x]
        # u: (Na, Nq, 2);  coef: (Na, Nq)
        return np.stack([u[..., 1], -coef * u[..., 0]], axis=-1)

    for i in range(n_steps):
        t0 = i * dt
        t1 = t0 + 0.5 * dt
        t2 = t0 + dt
        # Mathieu coefficient a − 2q cos(2t) evaluated at each sub-step
        g0 = A - 2.0 * Q * np.cos(2.0 * t0)   # (Na, Nq)
        g1 = A - 2.0 * Q * np.cos(2.0 * t1)
        g2 = A - 2.0 * Q * np.cos(2.0 * t2)

        # Classic-RK4 for c
        k1c = rhs(c,              g0)
        k2c = rhs(c + 0.5*dt*k1c, g1)
        k3c = rhs(c + 0.5*dt*k2c, g1)
        k4c = rhs(c +     dt*k3c,  g2)
        c   = c + (dt / 6.0) * (k1c + 2.0*k2c + 2.0*k3c + k4c)

        # Classic-RK4 for s (same coefficient schedule)
        k1s = rhs(s,              g0)
        k2s = rhs(s + 0.5*dt*k1s, g1)
        k3s = rhs(s + 0.5*dt*k2s, g1)
        k4s = rhs(s +     dt*k3s,  g2)
        s   = s + (dt / 6.0) * (k1s + 2.0*k2s + 2.0*k3s + k4s)

    # Monodromy trace and Floquet growth rate
    trace  = c[..., 0] + s[..., 1]     # tr(M) = c[π].x + s[π].v
    half   = np.abs(trace) * 0.5
    growth = np.where(
        half > 1.0,
        np.arccosh(np.maximum(half, 1.0)) / np.pi,
        0.0
    )
    return growth.astype(np.float32)    # (Na, Nq)

# ── BUILD HEIGHT-FIELD MESH ───────────────────────────────────────────────────

def build_mesh(growth):
    """
    Rectangular terrain mesh from the Floquet growth-rate field.

    x-axis ↔ parameter a   (frequency-shift / restoring force)
    y-axis ↔ parameter q   (modulation depth / coupling strength)
    z-axis ↔ growth rate λ  (0 = stable, positive = resonant)
    """
    Na, Nq = growth.shape

    # Physical layout
    x_lin = np.linspace(0.0, FLOOR_W, Na, dtype=np.float32)
    y_lin = np.linspace(0.0, FLOOR_D, Nq, dtype=np.float32)
    X, Y  = np.meshgrid(x_lin, y_lin, indexing='ij')   # (Na, Nq)

    g_max = float(growth.max()) or 1.0
    Z     = (growth / g_max) * H_SCALE

    # Flatten vertex positions
    verts_np = np.column_stack([X.ravel(), Y.ravel(), Z.ravel()])  # (Na*Nq, 3)

    # Quad faces via vectorised index arithmetic (avoids Python loop)
    ii = np.arange(Na - 1, dtype=np.int32)
    jj = np.arange(Nq - 1, dtype=np.int32)
    I, J   = np.meshgrid(ii, jj, indexing='ij')
    I, J   = I.ravel(), J.ravel()
    a_idx  = I * Nq + J
    b_idx  = (I + 1) * Nq + J
    c_idx  = (I + 1) * Nq + (J + 1)
    d_idx  = I * Nq + (J + 1)
    faces  = np.column_stack([a_idx, b_idx, c_idx, d_idx]).tolist()

    # Vertex colours: stable → cobalt, boundary → white, resonance → amber
    g_norm = (growth.ravel() / g_max).astype(np.float32)   # [0, 1]
    t2     = np.clip(2.0 * g_norm, 0.0, 2.0)
    lo     = np.clip(t2,       0.0, 1.0)
    hi     = np.clip(t2 - 1.0, 0.0, 1.0)
    lo3    = lo[:, None]
    hi3    = hi[:, None]
    cols   = (C_STABLE[:3] * (1 - lo3) + C_MIDPT[:3] * lo3) * (1 - hi3) \
           + C_UNSTBLE[:3] * hi3                                # (N, 3)
    cols_rgba = np.concatenate([cols, np.ones((len(cols), 1), np.float32)], axis=1)

    # Create Blender mesh
    mesh = bpy.data.meshes.new(MESH_NAME)
    mesh.from_pydata(verts_np.tolist(), [], faces)
    mesh.update()

    # Vertex-colour attribute (FLOAT_COLOR POINT)
    attr = mesh.color_attributes.new(name="Col", type="FLOAT_COLOR", domain="POINT")
    attr.data.foreach_set("color", cols_rgba.ravel().tolist())

    # Object
    obj = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.collection.objects.link(obj)

    # ── SHAPE KEYS ──────────────────────────────────────────────────────────
    obj.shape_key_add(name="Basis", from_mix=False)

    # SK_Exaggerated: resonance ridges 2.5× taller — reveals tongue hierarchy
    sk_ex = obj.shape_key_add(name="SK_Exaggerated", from_mix=False)
    pos_ex = verts_np.copy()
    pos_ex[:, 2] *= 2.5
    sk_ex.data.foreach_set("co", pos_ex.ravel().tolist())

    # SK_Flat: collapse z — Ince-Strutt diagram as a colour-only plan view
    sk_fl = obj.shape_key_add(name="SK_Flat", from_mix=False)
    pos_fl = verts_np.copy()
    pos_fl[:, 2] = 0.0
    sk_fl.data.foreach_set("co", pos_fl.ravel().tolist())

    return obj

# ── MATERIAL ──────────────────────────────────────────────────────────────────

def make_material(obj):
    mat = bpy.data.materials.new("Ince_Strutt")
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    vcol  = nt.nodes.new("ShaderNodeVertexColor")
    vcol.layer_name = "Col"
    bsdf.inputs["Roughness"].default_value  = 0.38
    bsdf.inputs["Metallic"].default_value   = 0.28
    nt.links.new(vcol.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
    obj.data.materials.append(mat)

# ── GLB EXPORT ────────────────────────────────────────────────────────────────

def export_glb(obj, filepath):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=True,
        export_morph=True,
        export_colors=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )

# ── MAIN ──────────────────────────────────────────────────────────────────────

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)

    a_vals = np.linspace(A_MIN, A_MAX, N_A)
    q_vals = np.linspace(Q_MIN, Q_MAX, N_Q)

    print(f"Mathieu stability map: {N_A}×{N_Q} grid, {N_STEPS} RK4 sub-steps …")
    growth = compute_growth_map(a_vals, q_vals, N_STEPS)

    n_tot      = N_A * N_Q
    n_stable   = int(np.sum(growth == 0.0))
    n_unstable = n_tot - n_stable
    print(f"  Stable   : {n_stable}/{n_tot}  ({100*n_stable/n_tot:.1f} %)")
    print(f"  Unstable : {n_unstable}/{n_tot}  ({100*n_unstable/n_tot:.1f} %)")
    print(f"  Max λ/π  : {growth.max():.5f}")

    obj = build_mesh(growth)
    make_material(obj)

    # Studio metadata
    obj["holoflow:facet"]    = False
    obj["holoflow:category"] = "stage-floor"
    obj["holoflow:a_range"]  = f"[{A_MIN}, {A_MAX}]"
    obj["holoflow:q_range"]  = f"[{Q_MIN}, {Q_MAX}]"
    obj["holoflow:n_tongues_visible"] = 3

    # +Y-up convention (studio export standard)
    obj.rotation_euler = (np.pi / 2.0, 0.0, 0.0)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(rotation=True)

    bpy.ops.wm.save_as_mainfile(filepath="//hf_ince_strutt.blend")
    export_glb(obj, "//hf_ince_strutt.glb")
    print("Done: hf_ince_strutt.blend · hf_ince_strutt.glb")

main()
