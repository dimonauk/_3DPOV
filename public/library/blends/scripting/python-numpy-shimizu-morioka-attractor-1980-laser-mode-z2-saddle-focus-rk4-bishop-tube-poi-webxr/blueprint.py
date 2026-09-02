"""
Shimizu–Morioka Attractor (1980) — Blender 5.1 / bpy — Holoflow Studio
=========================================================================
Source:
  Shimizu T & Morioka N (1980) "On the bifurcation of a symmetric limit
  cycle to an asymmetric one in a simple model"
  Physics Letters A 76(3–4):201–204
  DOI 10.1016/0375-9601(80)90466-1

  Sprott JC (2010) Elegant Chaos: Algebraically Simple Chaotic Flows,
  World Scientific ISBN 978-981-283-881-0.
  MIT companion code: https://sprott.physics.wisc.edu/chaos/elegantchaos.htm

TECHNIQUE
─────────
The Shimizu–Morioka system is a Lorenz-type two-scroll strange attractor
with constant divergence −(a+b) and Z₂ symmetry (x,y,z) → (−x,−y,z).
It was derived as a minimal model for two-mode competition in a semiconductor
laser cavity: x encodes the field amplitude difference, y its rate of change,
and z a slow population-inversion variable.  The origin is an unstable saddle;
the symmetric pair P± = (±√b, 0, 1) are saddle-foci with one stable real
eigenvalue and two unstable complex-conjugate eigenvalues, driving trajectories
in wide spirals that are eventually re-injected through the saddle at the
origin — the same switching topology as the Lorenz butterfly, but with a
strikingly different orbit morphology (wide outer loops, compressed inner
passages) owed to the simpler nonlinearity (only a single x² term).

RK4 integrates 80 000 steps at dt=0.015.  A Bishop parallel-transport
frame is carried along 3 000 thinned waypoints to produce a twist-free tube.
Orbital speed encodes a cobalt→amber FLOAT_COLOR attribute.  Four shape
keys explore the (a, b) parameter space via full reintegration.

EQUATIONS
──────────
  ẋ =  y                     (pure velocity, no nonlinearity)
  ẏ =  x − a·y − x·z        (position restoring, damped, multiplicative braking)
  ż = −b·z + x²              (slow variable: driven by x², decays at rate b)

  Canonical: a = 0.375, b = 0.8

CONSTANT DIVERGENCE
────────────────────
  ∂ẋ/∂x = 0     ∂ẏ/∂y = −a    ∂ż/∂z = −b
  ∇·F = −(a + b) = −1.175   (constant, independent of position)

  Liouville identity: λ₁ + λ₂ + λ₃ = ∇·F
    ≈ +0.115 + 0.000 − 1.290 = −1.175  ✓
  Kaplan–Yorke dimension: D_KY = 2 + λ₁/|λ₃| ≈ 2.089

EQUILIBRIA
───────────
  Origin O = (0, 0, 0):
    J|_O block-diagonal: [[0,1],[1,-a]] ⊕ [-b]
    λ_O1 ≈ +0.830  (unstable — the saddle's separatrix drives wing switching)
    λ_O2 ≈ −1.205  (stable)
    λ_O3 =  −0.800 (stable = −b)

  Symmetric pair P± = (±√b, 0, 1) = (±0.8944, 0, 1):
    Characteristic polynomial: λ³ + (a+b)λ² + abλ + 2b = 0
    Roots (a=0.375, b=0.8):
      λ_real    ≈ −1.610                  (stable)
      λ_complex ≈ +0.2175 ± 0.977i       (unstable saddle-focus)
    P± are unstable saddle-foci: trajectories spiral OUTWARD around each
    wing.  The Hopf bifurcation stabilising P± occurs at a_Hopf = 1.070
    (for b=0.8); above that value, P± become stable equilibria.

Z₂ SYMMETRY
────────────
  The map S: (x, y, z) → (−x, −y, z) leaves the vector field invariant:
    Sẋ = −y = ẋ(−x,−y,z) ✓    Sẏ = −(x−ay−xz) = ẏ(−x,−y,z) ✓
    Sż =  z²-equivariant: x² = (−x)² ✓
  The two wings are exact mirror images related by S.

Run from Blender's Text Editor or headless:
  blender --background --python blueprint.py
Requires: bpy (built-in), numpy (bundled with Blender 4.2+/5.x)
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector
import math

# ── INTEGRATION PARAMETERS ───────────────────────────────────────────────────
DT       = 0.015   # WHY 0.015: nonlinearity is x² which stays O(1) for
                    # |x|<2; RK4 global error O(DT⁴) ≈ 5×10⁻⁸ — adequate
N_WARMUP = 3_000   # 3000×0.015=45 time units ≫ τ=1/0.115≈8.7 Lyapunov times
N_STEPS  = 80_000  # 80000×0.015=1200 time units ≈ 138 Lyapunov times
THIN     = 27      # keep every 27th step → 2963 waypoints (≈3000)

# ── SHIMIZU–MORIOKA PARAMETERS ────────────────────────────────────────────────
A_BASIS  = 0.375   # canonical damping coefficient (Shimizu & Morioka 1980)
B_BASIS  = 0.800   # canonical z-decay rate
A_LOWA   = 0.200   # SK_LowA: lower damping → wider orbit, slower switching
A_HIGA   = 0.600   # SK_HiA: higher damping, approaching Hopf boundary at 1.07
B_LOWB   = 0.500   # SK_LowB: slower z-relaxation, equilibria closer in (√0.5≈0.707)

# ── TUBE GEOMETRY ─────────────────────────────────────────────────────────────
TUBE_SEGS   = 8      # octagonal cross-section — good silhouette at poi scale
TUBE_RADIUS = 0.042  # metres; chosen so the poi fits within ~0.6m sphere
POI_RADIUS  = 0.090  # output POI head radius (scales the centred trajectory)
COLOUR_NAME = "SM_Speed"  # FLOAT_COLOR attribute driven by orbital speed

# ── COLOURS ───────────────────────────────────────────────────────────────────
COBALT = np.array([0.06, 0.14, 0.66, 1.0], dtype=np.float32)  # slow
AMBER  = np.array([0.88, 0.52, 0.04, 1.0], dtype=np.float32)  # fast


# ─────────────────────────────────────────────────────────────────────────────
# 1. ODE AND INTEGRATION
# ─────────────────────────────────────────────────────────────────────────────

def _deriv(xyz, a, b):
    """Return (ẋ, ẏ, ż) for the Shimizu–Morioka system.

    WHY this factored form: a and b are per-shape-key constants, so passing
    them as arguments (rather than closing over globals) lets us reuse this
    function unchanged for every shape key without reassigning module-level
    names.
    """
    x, y, z = xyz
    dx = y
    dy = x - a * y - x * z   # restoring term x, damping -ay, braking -xz
    dz = -b * z + x * x      # slow variable: x² drives it up, decay at rate b
    return np.array([dx, dy, dz], dtype=np.float64)


def _rk4_step(xyz, a, b, dt):
    """Single fourth-order Runge–Kutta step."""
    k1 = _deriv(xyz,            a, b)
    k2 = _deriv(xyz + 0.5*dt*k1, a, b)
    k3 = _deriv(xyz + 0.5*dt*k2, a, b)
    k4 = _deriv(xyz +     dt*k3, a, b)
    return xyz + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)


def integrate(a, b, dt=DT, n_warmup=N_WARMUP, n_steps=N_STEPS, thin=THIN):
    """Integrate the Shimizu–Morioka ODE; return (waypoints, speeds).

    Initial condition IC=(0.5, 0.5, 0.5) is well off the z-axis so the
    trajectory does not linger near the unstable saddle at the origin.

    Returns:
        pts   : (N, 3) float64 array of 3-D waypoints
        speeds: (N,)   float64 array of |ẋ| at each waypoint
    """
    xyz = np.array([0.5, 0.5, 0.5], dtype=np.float64)

    # burn-in: shed the transient so we start ON the attractor
    for _ in range(n_warmup):
        xyz = _rk4_step(xyz, a, b, dt)

    pts    = []
    speeds = []
    for i in range(n_steps):
        k1  = _deriv(xyz, a, b)          # evaluate once per step for colour
        xyz = _rk4_step(xyz, a, b, dt)
        if i % thin == 0:
            pts.append(xyz.copy())
            speeds.append(float(np.linalg.norm(k1)))

    return np.array(pts, dtype=np.float64), np.array(speeds, dtype=np.float64)


# ─────────────────────────────────────────────────────────────────────────────
# 2. BISHOP PARALLEL-TRANSPORT FRAMES
# ─────────────────────────────────────────────────────────────────────────────

def bishop_frames(pts):
    """Compute Bishop (rotation-minimising) frames along an open curve.

    WHY Bishop instead of Frenet: Frenet frames blow up where curvature
    vanishes (straight segments) and twist whenever the curve bends; Bishop
    frames accumulate no unnecessary twist, giving a smooth tube around
    trajectories that occasionally straighten.

    Returns:
        T : (N, 3) unit tangent vectors
        N : (N, 3) normal vectors (rotation-minimising, perpendicular to T)
        B : (N, 3) binormal vectors = T × N
    """
    n   = len(pts)
    T   = np.zeros((n, 3))
    N   = np.zeros((n, 3))
    B   = np.zeros((n, 3))

    # tangent: central differences, endpoints use forward/backward difference
    T[0]    = pts[1]  - pts[0]
    T[-1]   = pts[-1] - pts[-2]
    T[1:-1] = pts[2:] - pts[:-2]
    norms   = np.linalg.norm(T, axis=1, keepdims=True)
    norms   = np.where(norms < 1e-12, 1.0, norms)
    T      /= norms

    # seed the first normal perpendicular to T[0]
    seed = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], seed)) > 0.95:
        seed = np.array([0.0, 1.0, 0.0])
    N[0] = np.cross(T[0], seed)
    N[0] /= np.linalg.norm(N[0])
    B[0]  = np.cross(T[0], N[0])

    # propagate via Rodrigues rotation in each segment's rotation plane
    for i in range(1, n):
        axis   = np.cross(T[i-1], T[i])
        sin_a  = np.linalg.norm(axis)
        cos_a  = np.clip(np.dot(T[i-1], T[i]), -1.0, 1.0)

        if sin_a < 1e-10:                  # nearly parallel — no rotation
            N[i] = N[i-1]
        else:
            ax     = axis / sin_a
            # Rodrigues: rotate N[i-1] by the angle between T[i-1] and T[i]
            N[i]  = (cos_a * N[i-1]
                     + sin_a * np.cross(ax, N[i-1])
                     + (1.0 - cos_a) * np.dot(ax, N[i-1]) * ax)
            norm_n = np.linalg.norm(N[i])
            if norm_n > 1e-12:
                N[i] /= norm_n
            else:
                N[i] = N[i-1]

        B[i] = np.cross(T[i], N[i])
        b_n  = np.linalg.norm(B[i])
        if b_n > 1e-12:
            B[i] /= b_n

    return T, N, B


# ─────────────────────────────────────────────────────────────────────────────
# 3. TUBE MESH BUILDER
# ─────────────────────────────────────────────────────────────────────────────

def build_tube(pts, N_frames, B_frames, radius, segs):
    """Build vertices and quad faces for a round tube along a polyline.

    WHY quads not triangles: GLB export with Draco requires a well-formed mesh;
    quads export cleanly and yield half the face count of a triangulated mesh
    for the same visual quality, saving GPU vertex-fetch bandwidth in WebXR.

    Returns:
        verts : (n_pts * segs, 3) float32 array (absolute positions)
        faces : list of 4-tuples (quad indices)
    """
    angles = np.linspace(0.0, 2.0 * math.pi, segs, endpoint=False)
    cos_a  = np.cos(angles)
    sin_a  = np.sin(angles)

    n      = len(pts)
    verts  = np.zeros((n * segs, 3), dtype=np.float32)

    for i in range(n):
        base = i * segs
        for j in range(segs):
            verts[base + j] = (pts[i]
                               + radius * (cos_a[j] * N_frames[i]
                                           + sin_a[j] * B_frames[i]))

    # ring-to-ring quad faces
    faces = []
    for i in range(n - 1):
        r0 = i * segs
        r1 = (i + 1) * segs
        for j in range(segs):
            j1 = (j + 1) % segs
            faces.append((r0 + j, r0 + j1, r1 + j1, r1 + j))

    return verts, faces


# ─────────────────────────────────────────────────────────────────────────────
# 4. COLOUR ATTRIBUTE
# ─────────────────────────────────────────────────────────────────────────────

def make_color_array(speeds, segs, cobalt, amber):
    """Map speeds to a cobalt→amber FLOAT_COLOR array (per vertex, POINT domain).

    WHY normalise with percentile: the speed distribution has a long tail near
    the saddle at the origin (where the trajectory slows dramatically before
    switching wings).  Using pct99 rather than max prevents a handful of slow
    passages from washing out the colour range of the main attractor body.
    """
    p1  = float(np.percentile(speeds, 1))
    p99 = float(np.percentile(speeds, 99))
    rng = max(p99 - p1, 1e-9)
    t   = np.clip((speeds - p1) / rng, 0.0, 1.0)   # shape (n_pts,)

    # repeat segs times so each ring vertex gets the ring's colour
    t_rep  = np.repeat(t, segs)                      # shape (n_pts * segs,)
    cols   = np.outer(1.0 - t_rep, cobalt) + np.outer(t_rep, amber)
    return cols.astype(np.float32)                    # (n_verts, 4)


# ─────────────────────────────────────────────────────────────────────────────
# 5. MAIN BUILD FUNCTION
# ─────────────────────────────────────────────────────────────────────────────

def build_attractor_mesh(name, pts, speeds, tube_r=TUBE_RADIUS,
                         segs=TUBE_SEGS, poi_r=POI_RADIUS):
    """Centre, scale, frame, and mesh the trajectory; add colour attribute.

    Returns the created bpy.types.Object.
    """
    # --- centre and scale to fit POI_RADIUS sphere ---
    centre   = pts.mean(axis=0)
    pts_c    = pts - centre
    max_norm = np.linalg.norm(pts_c, axis=1).max()
    scale    = poi_r / max(max_norm, 1e-6)
    pts_s    = pts_c * scale

    # --- Bishop frames ---
    T, N_fr, B_fr = bishop_frames(pts_s)

    # --- geometry ---
    verts, faces = build_tube(pts_s, N_fr, B_fr,
                              radius=tube_r, segs=segs)
    colours = make_color_array(speeds, segs, COBALT, AMBER)

    # --- bmesh assembly ---
    bm = bmesh.new()
    bverts = [bm.verts.new(Vector(v)) for v in verts]
    bm.verts.ensure_lookup_table()
    for f in faces:
        try:
            bm.faces.new([bverts[i] for i in f])
        except ValueError:
            pass  # duplicate face guard

    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()

    # --- FLOAT_COLOR vertex attribute ---
    attr = me.color_attributes.new(COLOUR_NAME, "FLOAT_COLOR", "POINT")
    flat = colours.ravel().tolist()
    attr.data.foreach_set("color", flat)

    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob, pts_s, speeds


# ─────────────────────────────────────────────────────────────────────────────
# 6. SHAPE KEYS
# ─────────────────────────────────────────────────────────────────────────────

def add_shape_key(ob, key_name, pts_new, speeds_new,
                  basis_len, tube_r=TUBE_RADIUS, segs=TUBE_SEGS, poi_r=POI_RADIUS):
    """Fully reintegrate a shape key variant and add it to the object.

    WHY full reintegration per key: interpolating two different attractors
    with different orbit lengths is topologically meaningless — the tube
    connectivity comes from the Basis trajectory, so each key simply
    relocates the same vertex grid to a new attractor at the same scale.
    Padding/trimming to Basis length keeps the vertex count fixed.
    """
    # centre and scale the new trajectory independently
    centre = pts_new.mean(axis=0)
    pts_c  = pts_new - centre
    max_n  = np.linalg.norm(pts_c, axis=1).max()
    pts_s  = pts_c * (poi_r / max(max_n, 1e-6))

    n_new = len(pts_s)
    n_old = basis_len
    if n_new >= n_old:
        pts_trim = pts_s[:n_old]
    else:
        # tile to fill up (attractor is quasi-periodic so repetition is fine)
        reps     = (n_old // n_new) + 1
        pts_trim = np.tile(pts_s, (reps, 1))[:n_old]

    T, N_fr, B_fr = bishop_frames(pts_trim)
    verts, _ = build_tube(pts_trim, N_fr, B_fr, radius=tube_r, segs=segs)

    sk = ob.shape_key_add(name=key_name, from_mix=False)
    co = np.array([v for row in verts for v in row], dtype=np.float32)
    sk.data.foreach_set("co", co)


# ─────────────────────────────────────────────────────────────────────────────
# 7. MATERIAL
# ─────────────────────────────────────────────────────────────────────────────

def make_material(ob, colour_name=COLOUR_NAME):
    """Principled BSDF wired to the SM_Speed FLOAT_COLOR attribute.

    WHY emission on top of base colour: in WebXR EEVEE, unlit shading
    is achieved via emission; the moderate metallic+roughness values keep
    the mesh readable when scene lighting is present.
    """
    mat = bpy.data.materials.new("SM_Mat")
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out  = tree.nodes.new("ShaderNodeOutputMaterial")
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled")
    attr = tree.nodes.new("ShaderNodeAttribute")

    attr.attribute_name = colour_name
    attr.attribute_type = "GEOMETRY"

    bsdf.inputs["Metallic"].default_value  = 0.42
    bsdf.inputs["Roughness"].default_value = 0.26
    # Emission gives glow visible from both sides in WebXR
    bsdf.inputs["Emission Strength"].default_value = 1.85

    tree.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    tree.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    tree.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])

    ob.data.materials.append(mat)


# ─────────────────────────────────────────────────────────────────────────────
# 8. ORCHESTRATION
# ─────────────────────────────────────────────────────────────────────────────

def main():
    # clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # --- Basis trajectory ---
    pts_b, spd_b = integrate(A_BASIS, B_BASIS)
    ob, pts_s, spd_s = build_attractor_mesh("hf_shimizu_morioka_poi",
                                             pts_b, spd_b)
    n_basis = len(pts_s)

    # add Basis shape key
    ob.shape_key_add(name="Basis", from_mix=False)

    # --- SK_LowA: reduced damping (a=0.200) — wider, slower-switching orbit ---
    pts_la, spd_la = integrate(A_LOWA, B_BASIS)
    add_shape_key(ob, "SK_LowA", pts_la, spd_la, n_basis)

    # --- SK_HiA: increased damping (a=0.600), approaching the Hopf boundary ---
    pts_ha, spd_ha = integrate(A_HIGA, B_BASIS)
    add_shape_key(ob, "SK_HiA", pts_ha, spd_ha, n_basis)

    # --- SK_LowB: slower z-relaxation (b=0.500), equilibria at (±0.707,0,1) ---
    pts_lb, spd_lb = integrate(A_BASIS, B_LOWB)
    add_shape_key(ob, "SK_LowB", pts_lb, spd_lb, n_basis)

    # --- material ---
    make_material(ob)

    # --- Holoflow export metadata ---
    ob["holoflow:facet"]    = False
    ob["holoflow:category"] = "poi-head"
    ob["holoflow:topic"]    = "shimizu-morioka-attractor"
    ob["holoflow:version"]  = "5.1"
    ob["export_name"]       = "hf_shimizu_morioka_poi"

    # --- +Y-up transform for WebXR ---
    # Blender is +Z-up; rotating −90° around X maps Z→Y for glTF convention
    ob.rotation_euler[0] = -math.pi / 2.0
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(rotation=True)

    print("[Shimizu-Morioka] Build complete.")
    print(f"  Basis waypoints : {n_basis}")
    print(f"  Vertex count    : {len(ob.data.vertices)}")
    print(f"  Face count      : {len(ob.data.polygons)}")
    print(f"  Shape keys      : {[sk.name for sk in ob.data.shape_keys.key_blocks]}")


main()
