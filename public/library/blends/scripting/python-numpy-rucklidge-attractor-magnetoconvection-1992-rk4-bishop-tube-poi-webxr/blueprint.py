"""
Rucklidge Attractor  (Blender 5.1 · Holoflow Studio)
Rucklidge AM 1992  "Chaos in models of double-diffusive convection"
J. Fluid Mech. 237:209-229   doi:10.1017/S0022112092003392

A minimal three-ODE model of oscillatory magnetoconvection — convection in
a conducting fluid driven by a temperature gradient in the presence of an
imposed magnetic field:

    ẋ = −κx + λy − yz     (magnetic/velocity coupling with thermal feedback)
    ẏ = x                  (induction equation; x drives y)
    ż = −z + y²            (thermal perturbation; y² is the driving term)

Here x ~ fluid velocity (or magnetic flux anomaly), y ~ stream function,
z ~ thermal perturbation squared.  κ is the ratio of magnetic to thermal
diffusivity (a damping parameter); λ is proportional to the Rayleigh number
(the thermal driving).

Three fixed points exist for λ > 0:
    O  = (0, 0, 0)         — origin (unstable saddle for λ > κ²)
    P± = (0, ±√λ, λ)       — symmetric pair (spiral foci, unstable for large λ)

Divergence  ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z  =  −κ + 0 + (−1)  =  −(κ+1)

This is CONSTANT — a uniform phase-space contraction rate of −3 for κ=2.
Consequently ∑ᵢ λᵢ = −(κ+1) exactly.  The sum identity provides a cheap
self-check: λ₃ = −(κ+1) − λ₁ − λ₂.

Canonical chaos:  κ=2.0, λ=6.7
    λ₁ ≈ +0.071   λ₂ ≈ 0   λ₃ ≈ −3.071
    Kaplan-Yorke dim  D_KY = 2 + λ₁/|λ₃| ≈ 2.023  (very thin attractor)

The trajectory winds around the two off-origin foci P± in alternating loops,
occasionally switching lobes — the hallmark of Shilnikov-type homoclinic chaos.
"""

import bpy, numpy as np

# ── Named constants  ──────────────────────────────────────────────────────────
KAPPA_BASIS  = 2.0   # damping (magnetic/thermal diffusivity ratio)
LAMBDA_BASIS = 6.7   # driving (scaled Rayleigh number); chaos onset ~λ=6.5

# Shape-key parameters — each demonstrates a distinct dynamical regime
KAPPA_HOPF     = 2.0;  LAMBDA_HOPF     = 4.5  # past Hopf (κ=2 bifurcates ~λ=3.9)
KAPPA_DENSE    = 1.5;  LAMBDA_DENSE    = 6.7  # lower damping → broader lobes
KAPPA_HIGHDRIVE= 2.0;  LAMBDA_HIGHDRIVE= 9.0  # higher Rayleigh → denser chaos

# Integration
DT       = 0.002   # RK4 step. At P± the complex eigenvalue ω satisfies
                   # ω²≈(λ₀−z₀)/x…; empirically max|Re(eigenvalue)|≈3.1,
                   # so DT×3.1=0.0062 ≪ RK4 stability radius 2.79  ✓
BURN_IN  = 15_000  # 30 time-units — allows all four ICs to reach attractor
N_STEPS  = 150_000 # 300 t.u. of trajectory
SKIP     = 50      # every 50th step → 3 000 waypoints

IC = (1.0, 0.0, 4.5)  # near P+ basin; consistent attractor reach for all keys

# Geometry
TUBE_R     = 0.014   # metres — tube cross-section radius
TUBE_SIDES = 12      # polygon cross-section (12 = good smoothness / poly count)
POI_R      = 0.082   # metres — final bounding-sphere radius

OBJ_NAME  = "Rucklidge"
ATTR_NAME = "Rucklidge_Z"   # FLOAT_COLOR driven by z-coordinate

COL_COBALT = (0.03, 0.15, 0.58, 1.0)  # low z (near origin / lobe base)
COL_AMBER  = (1.00, 0.65, 0.00, 1.0)  # high z (apex of thermal perturbation)


# ── Dynamics  ─────────────────────────────────────────────────────────────────
def _rucklidge_deriv(state, kappa, lam):
    """Right-hand side of the Rucklidge system.

    The yz coupling in ẋ is the sole nonlinearity.  It produces the
    alternating lobe-switching that generates chaos: when y is large and
    z rises to match y², the yz term overwhelms λy and drives x negative,
    switching the trajectory from P+ to P−.  This is structurally
    analogous to the xz term in Lorenz, but operates through the
    y-channel rather than via direct x−y competition.
    """
    x, y, z = state
    dx = -kappa*x + lam*y - y*z
    dy = x
    dz = -z + y*y
    return np.array([dx, dy, dz])


def _rk4(state, kappa, lam):
    """Classic fixed-step RK4.  The Rucklidge vector field is smooth and
    Lipschitz, so a fixed step is safe given the stability check at DT."""
    k1 = _rucklidge_deriv(state,             kappa, lam)
    k2 = _rucklidge_deriv(state + 0.5*DT*k1, kappa, lam)
    k3 = _rucklidge_deriv(state + 0.5*DT*k2, kappa, lam)
    k4 = _rucklidge_deriv(state +     DT*k3, kappa, lam)
    return state + (DT/6.0)*(k1 + 2*k2 + 2*k3 + k4)


def _integrate(kappa, lam):
    """Burn in, then collect N_STEPS/SKIP waypoints and their z values."""
    state = np.array(IC, dtype=float)
    for _ in range(BURN_IN):
        state = _rk4(state, kappa, lam)

    n_wp   = N_STEPS // SKIP
    pts    = np.empty((n_wp, 3))
    z_vals = np.empty(n_wp)
    idx    = 0
    for step in range(N_STEPS):
        state = _rk4(state, kappa, lam)
        if step % SKIP == 0 and idx < n_wp:
            pts[idx]    = state
            z_vals[idx] = state[2]
            idx += 1
    return pts, z_vals


# ── Bishop parallel-transport frame  ─────────────────────────────────────────
def _bishop_frame(pts):
    """Minimum-rotation frame: propagate normal via Rodrigues rotations.

    The Rucklidge trajectory is OPEN (start ≠ end) so no holonomy-correction
    angle is needed — unlike a closed torus-knot where accumulated twist must
    be redistributed.  Bishop framing avoids the cusp singularities of
    Frenet-Serret at inflection points.
    """
    raw = np.diff(pts, axis=0, append=pts[[-1]])
    raw[-1] = raw[-2]
    nrm = np.linalg.norm(raw, axis=1, keepdims=True)
    nrm = np.where(nrm < 1e-12, 1.0, nrm)
    T = raw / nrm

    seed = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], seed)) > 0.9:
        seed = np.array([1.0, 0.0, 0.0])
    N0 = seed - np.dot(seed, T[0])*T[0]
    N0 /= np.linalg.norm(N0)

    N = np.empty_like(pts)
    N[0] = N0
    for i in range(1, len(pts)):
        axis  = np.cross(T[i-1], T[i])
        sin_a = np.linalg.norm(axis)
        cos_a = float(np.clip(np.dot(T[i-1], T[i]), -1.0, 1.0))
        if sin_a < 1e-10:
            N[i] = N[i-1]
        else:
            ax   = axis / sin_a
            N[i] = (cos_a*N[i-1]
                    + sin_a*np.cross(ax, N[i-1])
                    + (1.0 - cos_a)*np.dot(ax, N[i-1])*ax)
    B = np.cross(T, N)
    return T, N, B


# ── Tube mesh  ────────────────────────────────────────────────────────────────
def _build_tube(pts, N, B):
    """Extrude a TUBE_SIDES polygon along the Bishop frame.

    Quads are wound counter-clockwise when viewed from outside — consistent
    with Blender's outward-normal convention.
    """
    angles = np.linspace(0.0, 2*np.pi, TUBE_SIDES, endpoint=False)
    ca, sa = np.cos(angles), np.sin(angles)
    rings  = (pts[:, None, :]
              + TUBE_R*(ca[None, :, None]*N[:, None, :]
                        + sa[None, :, None]*B[:, None, :]))
    verts  = rings.reshape(-1, 3).tolist()
    faces  = []
    S = TUBE_SIDES
    for i in range(len(pts) - 1):
        for j in range(S):
            j1  = (j + 1) % S
            faces.append([i*S+j,  i*S+j1, (i+1)*S+j1, (i+1)*S+j])
    return verts, faces


# ── Vertex colour  ────────────────────────────────────────────────────────────
def _vert_colours(z_vals):
    """Map z → cobalt (near-origin trough) → amber (thermal apex).

    z represents the squared thermal perturbation; high z occurs at the
    top of the trajectory loop, where the orbit is farthest from the origin
    and closest to turning back.  Colour encodes this structural meaning.
    """
    z_lo, z_hi = z_vals.min(), z_vals.max()
    t  = (z_vals - z_lo) / max(z_hi - z_lo, 1e-8)
    c0 = np.array(COL_COBALT)
    c1 = np.array(COL_AMBER)
    cols = c0*(1 - t[:, None]) + c1*t[:, None]
    return np.repeat(cols, TUBE_SIDES, axis=0)   # (n_wp×TUBE_SIDES, 4)


# ── Blender object builder  ───────────────────────────────────────────────────
def _make_obj(pts, z_vals, name):
    pts_c  = pts - pts.mean(axis=0)
    radius = np.linalg.norm(pts_c, axis=1).max()
    pts_c *= POI_R / max(radius, 1e-8)

    T, N, B      = _bishop_frame(pts_c)
    verts, faces = _build_tube(pts_c, N, B)

    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.shade_flat()
    obj = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(obj)

    # FLOAT_COLOR vertex attribute
    attr = me.attributes.new(ATTR_NAME, 'FLOAT_COLOR', 'POINT')
    cols = _vert_colours(z_vals)
    attr.data.foreach_set("color", cols.ravel().astype(np.float32))

    # Emission material driven by Rucklidge_Z
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()
    anode = nt.nodes.new("ShaderNodeAttribute")
    anode.attribute_name = ATTR_NAME
    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value          = 0.48
    bsdf.inputs["Roughness"].default_value         = 0.24
    bsdf.inputs["Emission Strength"].default_value = 1.6
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(anode.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(anode.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
    me.materials.append(mat)

    obj["holoflow:facet"]       = False
    obj["holoflow:category"]    = "poi-head"
    obj["holoflow:export_name"] = "hf_rucklidge_poi"
    return obj


def _add_shape_key(obj, label, kappa, lam):
    """Re-integrate, re-scale, rebuild tube, store as a morph target."""
    pts, _  = _integrate(kappa, lam)
    pts_c   = pts - pts.mean(axis=0)
    radius  = np.linalg.norm(pts_c, axis=1).max()
    pts_c  *= POI_R / max(radius, 1e-8)
    T, N, B = _bishop_frame(pts_c)
    verts, _ = _build_tube(pts_c, N, B)
    sk = obj.shape_key_add(name=label, from_mix=False)
    sk.data.foreach_set("co", np.array(verts, dtype=np.float32).ravel())


# ── Main  ─────────────────────────────────────────────────────────────────────
def main():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    pts_b, z_b = _integrate(KAPPA_BASIS, LAMBDA_BASIS)
    obj = _make_obj(pts_b, z_b, OBJ_NAME)
    obj.shape_key_add(name="Basis", from_mix=False)

    _add_shape_key(obj, "SK_Hopf",     KAPPA_HOPF,      LAMBDA_HOPF)
    _add_shape_key(obj, "SK_Dense",    KAPPA_DENSE,     LAMBDA_DENSE)
    _add_shape_key(obj, "SK_HighDrive",KAPPA_HIGHDRIVE, LAMBDA_HIGHDRIVE)

    # +Y-up for glTF (Blender +Z → rotate −90° around X)
    obj.rotation_euler = (-np.pi/2, 0, 0)
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(rotation=True)

    import os
    out_dir = os.path.join(
        os.path.dirname(bpy.data.filepath),
        "..", "..", "..", "glbs", "scripting",
        "python-numpy-rucklidge-attractor-magnetoconvection-1992-rk4-bishop-tube-poi-webxr",
    )
    os.makedirs(out_dir, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(out_dir, "hf_rucklidge_poi.glb"),
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_morph=True,
        export_colors=True,
        export_yup=True,
    )
    print("Done — hf_rucklidge_poi.glb written.")


if __name__ == "__main__":
    main()
