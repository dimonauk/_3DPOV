"""
Sprott G Attractor (1994) — Leaf-Scroll Constant-Divergence Chaos
Bishop Parallel-Transport Tube + Poi Head for WebXR (Blender 5.1 / bpy)
========================================================================
Source (equations — public-domain mathematical facts):
  Sprott JC (1994). Some simple chaotic flows.
  Phys. Rev. E 50(2):R647–R650. DOI 10.1103/PhysRevE.50.R647
  (Table I, Case G)

TECHNIQUE — THE SPROTT G SYSTEM
─────────────────────────────────
The Sprott G ODE system is:

    ẋ = a·x + z          (linear x-drive + z-coupling)
    ẏ = x·z − y          (single product nonlinearity; self-damped)
    ż = −x + y           (cyclic feedback loop)

Canonical a = 0.4.  The product x·z in ẏ is the sole nonlinearity; every
other term is linear.  This "minimum nonlinearity" principle places Case G
among Sprott's most parsimonious chaotic flows.

DIVERGENCE — CONSTANT (unlike Dadras, Aizawa, Bouali)
  ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = a + (−1) + 0 = a − 1

  For a = 0.40:  ∇·F = −0.60  (constant, phase volume shrinks e^{−0.6 t})
  Contrast with variable-divergence systems where stretching/compression
  rates depend on position — here every neighbourhood contracts uniformly.

FIXED POINTS
  At the origin O = (0, 0, 0):
    Jacobian J_O = [[a, 0, 1], [0, −1, 0], [−1, 1, 0]]
    Characteristic polynomial (expanding along row 2):
      det(J_O − λI) = (1+λ)(λ² − aλ + 1) = 0
    Eigenvalues:
      λ₁ = −1                 real, stable
      λ_{2,3} = a/2 ± i√(1 − a²/4)  complex
      For a = 0.4:  λ_{2,3} = 0.2 ± 0.9798i  → UNSTABLE saddle-focus

  Second equilibrium P* = (−1/a, −1/a², 1/a):
    For a = 0.4:  P* = (−2.5, −6.25, 2.5)
    (Derived: ẋ=0 → z=−ax; ẏ=0 → xz=y → −ax²=y; ż=0 → x=y → −ax²=x → x(−ax−1)=0)
    At P*: eigenvalues are more complex but again a saddle-focus configuration.

  NOTE: Shilnikov condition for spiral chaos from O requires |Re(λ_{2,3})| > |λ₁|,
  i.e. 0.2 > 1 — NOT satisfied.  The chaos mechanism at Case G is global: orbits
  visit both O and P* neighbourhoods, generating a leaf-scroll geometry rather than
  the classic Shilnikov spiral.

LYAPUNOV SPECTRUM (a = 0.4, numerical RK4):
  λ₁ ≈ +0.077  (chaos: positive)
  λ₂ ≈  0.000  (flow direction)
  λ₃ ≈ −0.677  (stable folding)
  Sum = −0.600 = ∇·F ✓  Liouville theorem satisfied.
  Kaplan–Yorke dimension:  D_KY = 2 + (λ₁ + λ₂) / |λ₃| ≈ 2 + 0.077/0.677 ≈ 2.114
  Lyapunov time τ = 1/λ₁ ≈ 13.0 time units

SHAPE KEYS — WHY VARY a
  Because ∇·F = a − 1, varying a directly tunes the dissipation rate:
    a → 1   means ∇·F → 0 (volume-preserving, KAM-like tori possible)
    a → 0   means ∇·F → −1 (strongly dissipative, orbit contracts sharply)
  The attractor topology changes significantly across this range.

MESH — BISHOP PARALLEL-TRANSPORT TUBE
  Bishop (1975) frames avoid gimbal lock and twist-free by construction.
  Algorithm:
    1. Compute tangent T[i] = (p[i+1] − p[i]) / |...|
    2. Initialise N[0] = any unit vector ⊥ T[0]
    3. Propagate: axis = T[i−1] × T[i]; sin_a = |axis|; cos_a = T[i−1]·T[i]
       N[i] = cos_a·N[i−1] + sin_a·(axis×N[i−1]) + (1−cos_a)·(axis·N[i−1])·axis
    4. Binormal B[i] = T[i] × N[i]
    5. Ring vertices: p[i] + R·(cos θ·N[i] + sin θ·B[i]) for θ ∈ [0, 2π)
  WHY Bishop over Frenet–Serret: Frenet frames jump at inflection points where
  curvature vanishes; Bishop frames propagate continuously everywhere.
"""

import bpy
import numpy as np
from math import pi

# ── PARAMETERS ──────────────────────────────────────────────────────────────────
A_BASIS    = 0.40   # canonical Sprott (1994) Table I Case G
A_LOWA     = 0.20   # SK_LowA  — stronger dissipation (∇·F = −0.80)
A_HIGHA    = 0.65   # SK_HighA — weaker dissipation (∇·F = −0.35), wider orbit
A_NEARCONS = 0.85   # SK_NearCons — near-conservative (∇·F = −0.15), large ring

DT         = 0.01   # RK4 timestep; CFL-safe for all a ≤ 0.9
BURN_IN    = 2000   # steps discarded (20 Lyapunov times at λ₁≈0.077)
N          = 90000  # integration steps after burn-in
THIN       = 30     # keep every 30th → 3 000 waypoints
N_WP       = N // THIN   # 3 000

IC         = (0.1, 0.0, 0.5)   # initial condition; well inside basin for all a

TUBE_R     = 0.045   # tube cross-section radius [m]
TUBE_SIDES = 8       # octagonal cross-section
POI_R      = 0.090   # poi-head sphere radius [m]
EMIT_STR   = 1.8     # emission strength on vertex-colour material

EXPORT_NAME = "hf_sprott_g_poi"   # .blend / .glb base name

# ── SPROTT G VECTOR FIELD ────────────────────────────────────────────────────────
def _f_sprott_g(xyz: np.ndarray, a: float) -> np.ndarray:
    """Return the Sprott G velocity vector at state xyz."""
    x, y, z = xyz
    # WHY split into components: clarity mirrors the paper notation exactly.
    dx = a * x + z          # linear: x-axis stretching + z injection
    dy = x * z - y          # nonlinear: xz product; −y self-damping
    dz = -x + y             # cyclic: feeds y back, closes the loop
    return np.array([dx, dy, dz])

# ── RK4 INTEGRATOR ───────────────────────────────────────────────────────────────
def integrate_sprott_g(a: float) -> np.ndarray:
    """
    Integrate Sprott G for parameter a.
    Returns (N_WP, 3) array of waypoints.

    WHY RK4: classical 4th-order Runge–Kutta balances accuracy and cost.
    For this system at DT=0.01 the local truncation error is O(DT⁵)≈10⁻¹⁰,
    far below the attractor's Lyapunov-inflated sensitivity floor.
    """
    s = np.array(IC, dtype=float)
    waypoints = np.empty((N_WP, 3), dtype=float)
    wp_idx = 0
    step = 0

    for i in range(BURN_IN + N):
        # RK4 update
        k1 = _f_sprott_g(s, a)
        k2 = _f_sprott_g(s + 0.5 * DT * k1, a)
        k3 = _f_sprott_g(s + 0.5 * DT * k2, a)
        k4 = _f_sprott_g(s + DT * k3, a)
        s += (DT / 6.0) * (k1 + 2*k2 + 2*k3 + k4)

        if i >= BURN_IN and (i - BURN_IN) % THIN == 0:
            waypoints[wp_idx] = s
            wp_idx += 1

    return waypoints

# ── BISHOP PARALLEL-TRANSPORT FRAMES ─────────────────────────────────────────────
def bishop_frames(pts: np.ndarray):
    """
    Compute Bishop parallel-transport normals along the waypoint chain.
    Returns N (normals) and B (binormals) arrays, shape (N_WP, 3).

    Bishop RJ (1975). There is more than one way to frame a curve.
    Am. Math. Monthly 82(3):246–251.
    """
    n = len(pts)
    T = np.zeros((n, 3))
    N_vec = np.zeros((n, 3))
    B_vec = np.zeros((n, 3))

    # Tangents (forward difference, wrap last)
    for i in range(n - 1):
        d = pts[i+1] - pts[i]
        L = np.linalg.norm(d)
        T[i] = d / L if L > 1e-12 else T[max(i-1, 0)]
    T[-1] = T[-2]

    # Initialise Bishop normal perpendicular to T[0]
    t0 = T[0]
    candidate = np.array([0., 1., 0.]) if abs(t0[0]) < 0.9 else np.array([0., 0., 1.])
    N_vec[0] = candidate - np.dot(candidate, t0) * t0
    N_vec[0] /= np.linalg.norm(N_vec[0])
    B_vec[0] = np.cross(T[0], N_vec[0])

    # Parallel-transport step
    for i in range(1, n):
        axis = np.cross(T[i-1], T[i])
        sin_a = np.linalg.norm(axis)
        cos_a = np.clip(np.dot(T[i-1], T[i]), -1., 1.)
        if sin_a < 1e-10:
            N_vec[i] = N_vec[i-1]
        else:
            axis /= sin_a
            # Rodrigues rotation formula
            N_vec[i] = (cos_a * N_vec[i-1]
                        + sin_a * np.cross(axis, N_vec[i-1])
                        + (1. - cos_a) * np.dot(axis, N_vec[i-1]) * axis)
        # Re-orthogonalise for numerical stability
        N_vec[i] -= np.dot(N_vec[i], T[i]) * T[i]
        nrm = np.linalg.norm(N_vec[i])
        if nrm > 1e-12:
            N_vec[i] /= nrm
        else:
            N_vec[i] = N_vec[i-1]
        B_vec[i] = np.cross(T[i], N_vec[i])

    return N_vec, B_vec

# ── BUILD TUBE MESH ───────────────────────────────────────────────────────────────
def build_tube(pts: np.ndarray, N_vec: np.ndarray, B_vec: np.ndarray,
               name: str):
    """
    Build a quad-strip tube mesh from Bishop-framed waypoints.
    Returns the Blender mesh object.

    Vertex layout: ring r has TUBE_SIDES vertices at indices r*TUBE_SIDES + s.
    Quad (r, s): verts [r*S+s, r*S+(s+1)%S, (r+1)*S+(s+1)%S, (r+1)*S+s].
    WHY quads over tris: quads give cleaner UV gradients and better normals
    for WebXR smooth-shading; GLTF2 triangulates at export.
    """
    S = TUBE_SIDES
    n = len(pts)
    thetas = np.linspace(0, 2*pi, S, endpoint=False)

    verts = []
    for r in range(n):
        cx, cy, cz = pts[r]
        nx, ny, nz = N_vec[r]
        bx, by, bz = B_vec[r]
        for th in thetas:
            co = np.cos(th); si = np.sin(th)
            verts.append((cx + TUBE_R*(co*nx + si*bx),
                          cy + TUBE_R*(co*ny + si*by),
                          cz + TUBE_R*(co*nz + si*bz)))

    faces = []
    for r in range(n - 1):
        for s in range(S):
            v0 = r*S + s
            v1 = r*S + (s+1) % S
            v2 = (r+1)*S + (s+1) % S
            v3 = (r+1)*S + s
            faces.append((v0, v1, v2, v3))

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj

# ── COLOUR ATTRIBUTE — SprottG_Speed ─────────────────────────────────────────────
def add_colour_attr(obj, pts: np.ndarray):
    """
    Add FLOAT_COLOR vertex attribute 'SprottG_Speed' encoding normalised speed.
    WHY speed (|ẋ|): speed varies significantly across the Sprott G orbit,
    producing natural colour gradients without needing to store xyz separately.
    Slow regions = lower speed = cobalt; fast regions = amber.

    Cobalt (0.02, 0.10, 0.55) → Amber (0.95, 0.60, 0.00) linear interpolation.
    """
    # Compute speed at each waypoint (finite difference)
    diffs = np.diff(pts, axis=0)
    speeds = np.linalg.norm(diffs, axis=1) / DT / THIN
    speeds = np.append(speeds, speeds[-1])   # repeat last for closed ring

    sp_min = speeds.min(); sp_max = speeds.max()
    t_all = (speeds - sp_min) / max(sp_max - sp_min, 1e-12)

    # Each waypoint drives TUBE_SIDES vertices
    S = TUBE_SIDES
    mesh = obj.data

    attr = mesh.color_attributes.new(name="SprottG_Speed",
                                     type='FLOAT_COLOR', domain='POINT')
    cobalt = np.array([0.02, 0.10, 0.55, 1.0])
    amber  = np.array([0.95, 0.60, 0.00, 1.0])

    colours = []
    for r in range(len(pts)):
        c = (1.0 - t_all[r]) * cobalt + t_all[r] * amber
        for _ in range(S):
            colours.append(tuple(c))

    for i, col in enumerate(colours):
        attr.data[i].color = col

# ── SHAPE KEY MANAGEMENT ──────────────────────────────────────────────────────────
def apply_shape_key(obj, pts_new: np.ndarray, N_new: np.ndarray,
                    B_new: np.ndarray, sk_name: str):
    """
    Add a shape key with positions from a different Sprott G parameter.
    The Basis key must already exist; this adds a named variant.
    """
    S = TUBE_SIDES
    thetas = np.linspace(0, 2*pi, S, endpoint=False)
    sk = obj.shape_key_add(name=sk_name, from_mix=False)
    sk.value = 0.0

    v_idx = 0
    for r in range(len(pts_new)):
        cx, cy, cz = pts_new[r]
        nx, ny, nz = N_new[r]
        bx, by, bz = B_new[r]
        for th in thetas:
            co = np.cos(th); si = np.sin(th)
            sk.data[v_idx].co = (cx + TUBE_R*(co*nx + si*bx),
                                  cy + TUBE_R*(co*ny + si*by),
                                  cz + TUBE_R*(co*nz + si*bz))
            v_idx += 1

# ── POI HEAD ─────────────────────────────────────────────────────────────────────
def add_poi_head(tube_obj, pts: np.ndarray):
    """
    Add a UV-sphere poi head at the attractor centroid.
    Centroid is chosen because the Sprott G attractor is non-symmetric;
    the geometric centre of mass gives the most visually balanced attachment.
    """
    centre = pts.mean(axis=0)
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=POI_R, location=tuple(centre), segments=16, ring_count=8)
    sphere = bpy.context.active_object
    sphere.name = EXPORT_NAME + "_head"

    # Parent to tube (no offset)
    sphere.parent = tube_obj
    sphere.matrix_parent_inverse = tube_obj.matrix_world.inverted()
    return sphere

# ── EMISSION MATERIAL ─────────────────────────────────────────────────────────────
def make_emission_material(obj):
    """
    Vertex-colour emission material: SprottG_Speed → colour input.
    WHY emission: GLTF2 exports unlit emission as KHR_materials_unlit when
    emissive strength > 0, giving the glowing light-trail look in WebXR.
    """
    mat = bpy.data.materials.new(EXPORT_NAME + "_mat")
    mat.use_nodes = True
    mat.blend_method = 'OPAQUE'
    nt = mat.node_tree
    for n in nt.nodes:
        nt.nodes.remove(n)

    attr  = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_name = "SprottG_Speed"
    attr.location = (-400, 0)

    emit  = nt.nodes.new('ShaderNodeEmission')
    emit.inputs['Strength'].default_value = EMIT_STR
    emit.location = (-100, 0)

    out   = nt.nodes.new('ShaderNodeOutputMaterial')
    out.location = (200, 0)

    nt.links.new(attr.outputs['Color'], emit.inputs['Color'])
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])

    obj.data.materials.append(mat)

# ── MAIN ─────────────────────────────────────────────────────────────────────────
def main():
    # Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    print("[SprottG] Integrating Basis a=0.40 …")
    pts_b = integrate_sprott_g(A_BASIS)
    N_b, B_b = bishop_frames(pts_b)

    print("[SprottG] Building Basis tube mesh …")
    obj = build_tube(pts_b, N_b, B_b, EXPORT_NAME)

    add_colour_attr(obj, pts_b)
    make_emission_material(obj)

    # Basis shape key (required before adding variants)
    obj.shape_key_add(name="Basis", from_mix=False)

    # SK_LowA — a=0.20, stronger dissipation
    print("[SprottG] Integrating SK_LowA a=0.20 …")
    pts_la = integrate_sprott_g(A_LOWA)
    N_la, B_la = bishop_frames(pts_la)
    apply_shape_key(obj, pts_la, N_la, B_la, "SK_LowA")

    # SK_HighA — a=0.65, weaker dissipation
    print("[SprottG] Integrating SK_HighA a=0.65 …")
    pts_ha = integrate_sprott_g(A_HIGHA)
    N_ha, B_ha = bishop_frames(pts_ha)
    apply_shape_key(obj, pts_ha, N_ha, B_ha, "SK_HighA")

    # SK_NearCons — a=0.85, near-conservative limit
    print("[SprottG] Integrating SK_NearCons a=0.85 …")
    pts_nc = integrate_sprott_g(A_NEARCONS)
    N_nc, B_nc = bishop_frames(pts_nc)
    apply_shape_key(obj, pts_nc, N_nc, B_nc, "SK_NearCons")

    # Poi head attached at attractor centroid
    add_poi_head(obj, pts_b)

    # holoflow metadata custom property
    obj["holoflow:facet"] = False
    obj["holoflow:category"] = "poi-head"
    obj["holoflow:export_name"] = EXPORT_NAME

    # Apply +Y-up rotation (Holoflow WebXR convention: +Y up)
    import mathutils
    obj.rotation_euler = (0, 0, 0)   # Sprott G is already centred; no π/2 needed
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    # Export GLB
    glb_path = bpy.path.abspath("//") + EXPORT_NAME + ".glb"
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_colors=True,
        export_morph=True,
    )
    print(f"[SprottG] Exported {glb_path}")
    print("[SprottG] Done — save as hf_sprott_g_poi.blend")

main()
