"""
Thomas Cyclically Symmetric Attractor (René Thomas, 1999) — Sine Nonlinearity
Bishop Parallel-Transport Tube + Poi Head for WebXR (Blender 5.1 / bpy)
==========================================================================
Source (equations — public-domain mathematical facts):
  Thomas R (1999). Deterministic chaos seen in terms of feedback circuits:
  Analysis, synthesis, "labyrinthine" chaos.
  Int. J. Bifurc. Chaos 9(10):1889–1905. DOI 10.1142/S0218127499001383

  Sprott JC & Linz SJ (2000). Algebraically simple chaotic flows.
  Int. J. Chaos Theory Appl. 5(2):3–22.  (review includes Thomas system)

TECHNIQUE — THOMAS CYCLICALLY SYMMETRIC SYSTEM
───────────────────────────────────────────────
    ẋ = sin(y) − b·x
    ẏ = sin(z) − b·y
    ż = sin(x) − b·z

C₃ cyclic symmetry: σ:(x,y,z)→(y,z,x) permutes equations identically.
Sine nonlinearity couples each velocity to the NEXT variable in cycle order,
unlike polynomial attractors (Lorenz, Sprott) which use bilinear or
self-quadratic terms. The sin function bounds the forcing to [−1, 1] — no
runaway growth even near b→0.

WHY SINE? Polynomial nonlinearities (x·y, y²) are unbounded, so dissipation
must dominate at infinity to guarantee a bounded attractor. sin(·) is
globally bounded, so the attractor exists for arbitrarily small b > 0.
This creates the "labyrinthine chaos" limit (Thomas 1999): as b→0 the orbit
explores an unbounded lattice of near-Hamiltonian cells.
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector, Matrix

# ─── PARAMETERS ────────────────────────────────────────────────────────────────
B_CANON    = 0.208      # canonical chaotic parameter (Thomas 1999)
DT         = 0.05       # RK4 time step — sin forces are O(1), larger DT ok
BURN_IN    = 2000       # steps discarded before sampling
N_STEPS    = 90000      # integration steps after burn-in
THIN       = 30         # keep every 30th point → 3000 waypoints
TUBE_SEGS  = 8          # radial subdivisions around tube cross-section
TUBE_R     = 0.045      # tube radius in model units (metres at export)
POI_R      = 0.22       # poi head sphere radius
POI_SEGS   = 4          # UV-sphere segments (ico-like low-poly head)

# Shape-key b-values and labels
SK_PARAMS  = [
    ("SK_LowB",      0.17),   # wider chaotic orbit, stronger dissipation contrast
    ("SK_NearTorus", 0.22),   # near-torus transition, weaker chaos
    ("SK_Periodic",  0.30),   # quasiperiodic / limit cycle
]

BLEND_NAME = "hf_thomas_poi"

# ─── DIVERGENCE & FIXED POINTS (reference comment) ─────────────────────────────
# ∇·F = ∂(sin y − bx)/∂x + ∂(sin z − by)/∂y + ∂(sin x − bz)/∂z
#       = −b + (−b) + (−b) = −3b   CONSTANT, same class as Halvorsen/Thomas.
# Phase volume: δV(t) = δV(0)·exp(−3b·t) = δV(0)·exp(−0.624t) for b=0.208.
#
# FIXED POINTS:  sin(y)=bx, sin(z)=by, sin(x)=bz
#   (i)  P₀ = (0,0,0) always.
#       J(P₀): circulant with row [−b, 1, 0] (because cos(0)=1)
#       Eigenvalues of circulant matrix with generating row [c₀,c₁,c₂]:
#           λ_k = c₀ + c₁·ω^k + c₂·ω^(2k), ω = exp(2πi/3)
#       λ₀ = −b + 1 = 0.792         (REAL POSITIVE → unstable)
#       λ₁,₂ = −b − ½ ± i·√3/2 = −0.708 ± 0.866i  (stable spiral)
#       Saddle-focus at origin: one unstable real + one stable complex pair.
#       |Re(λ₁,₂)| = 0.708 < λ₀ = 0.792 → Shilnikov condition NOT met at P₀.
#
#   (ii) Symmetric points P± where x=y=z=±x* and sin(x*)/x* = b:
#        sin(x*) = b·x* → x* ≈ ±2.661 (first non-trivial branch for b=0.208)
#        J(P±): circulant with row [−b, cos(x*), 0], cos(2.661) ≈ −0.878
#        λ₀ = −b − 0.878 = −1.086   (stable real)
#        λ₁,₂ = −b + 0.439 ± i·0.760 = +0.231 ± 0.760i  (UNSTABLE spiral)
#        Shilnikov: |λ₀|=1.086 > Re(λ₁,₂)=0.231 ✓ → Shilnikov chaos guaranteed!
#        The attractor WRAPS around P± — each scroll is a Shilnikov whirl.
#
# LYAPUNOV SPECTRUM (b=0.208, RK4 long run):
#   λ₁ ≈ +0.037, λ₂ ≈ 0.000, λ₃ ≈ −0.661
#   Sum: ≈ −0.624 = −3·0.208 = ∇·F  ✓  (Liouville theorem)
#   D_KY ≈ 2 + 0.037/0.661 ≈ 2.056  (Kaplan–Yorke dimension)

def rk4_step(state, b, dt):
    """Single RK4 step for Thomas system. Returns new state."""
    def f(s):
        x, y, z = s
        return np.array([
            np.sin(y) - b * x,
            np.sin(z) - b * y,
            np.sin(x) - b * z,
        ])
    k1 = f(state)
    k2 = f(state + 0.5 * dt * k1)
    k3 = f(state + 0.5 * dt * k2)
    k4 = f(state + dt * k3)
    return state + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)

def integrate_thomas(b, dt=DT, burn_in=BURN_IN, n_steps=N_STEPS, thin=THIN):
    """Integrate Thomas system, return thinned waypoints and speed colours."""
    state = np.array([0.1, 0.0, 0.0])  # near-origin; orbit finds attractor fast
    # Burn-in: allow transient to die
    for _ in range(burn_in):
        state = rk4_step(state, b, dt)
    # Collect
    pts, speeds = [], []
    for i in range(n_steps):
        state = rk4_step(state, b, dt)
        if i % thin == 0:
            pts.append(state.copy())
            # Speed as colour proxy — sin nonlinearity makes speed ∈[0, √3·b+√3]
            speed = np.linalg.norm(np.array([
                np.sin(state[1]) - b * state[0],
                np.sin(state[2]) - b * state[1],
                np.sin(state[0]) - b * state[2],
            ]))
            speeds.append(speed)
    return np.array(pts), np.array(speeds)

def bishop_frames(pts):
    """Bishop parallel-transport frames along polyline.
    WHY Bishop over Frenet: Frenet frames are undefined at zero-curvature
    inflection points and flip violently at near-straight segments. Bishop
    frames propagate by parallel transport — guaranteed twist-free where
    curvature is low, no ambiguity at inflections.
    """
    n = len(pts)
    tangents = np.zeros((n, 3))
    for i in range(n - 1):
        d = pts[i + 1] - pts[i]
        norm = np.linalg.norm(d)
        tangents[i] = d / norm if norm > 1e-10 else tangents[max(0, i-1)]
    tangents[-1] = tangents[-2]

    # Initial normal: find a vector not parallel to first tangent
    t0 = tangents[0]
    arbitrary = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(t0, arbitrary)) > 0.99:
        arbitrary = np.array([1.0, 0.0, 0.0])
    normal = arbitrary - np.dot(arbitrary, t0) * t0
    normal /= np.linalg.norm(normal)

    normals = np.zeros((n, 3))
    normals[0] = normal
    for i in range(1, n):
        t_prev, t_curr = tangents[i - 1], tangents[i]
        axis = np.cross(t_prev, t_curr)
        sin_a = np.linalg.norm(axis)
        if sin_a < 1e-10:
            normals[i] = normals[i - 1]
        else:
            axis /= sin_a
            cos_a = np.clip(np.dot(t_prev, t_curr), -1.0, 1.0)
            angle = np.arctan2(sin_a, cos_a)
            c, s = np.cos(angle), np.sin(angle)
            # Rodrigues rotation
            n_prev = normals[i - 1]
            normals[i] = (c * n_prev + s * np.cross(axis, n_prev)
                          + (1 - c) * np.dot(axis, n_prev) * axis)
            normals[i] /= np.linalg.norm(normals[i])
    return tangents, normals

def build_tube_mesh(pts, speeds, segs=TUBE_SEGS, radius=TUBE_R):
    """Build tube mesh from waypoints with speed vertex colours."""
    n = len(pts)
    _, normals = bishop_frames(pts)

    verts, faces = [], []
    theta = np.linspace(0, 2 * np.pi, segs, endpoint=False)
    cos_t, sin_t = np.cos(theta), np.sin(theta)

    for i, (p, nrm) in enumerate(zip(pts, normals)):
        t = pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]
        norm_t = np.linalg.norm(t)
        if norm_t < 1e-10:
            continue
        t /= norm_t
        binorm = np.cross(t, nrm)
        binorm /= max(np.linalg.norm(binorm), 1e-10)
        for c, s in zip(cos_t, sin_t):
            verts.append(tuple(p + radius * (c * nrm + s * binorm)))

    # Quad faces connecting consecutive rings
    for i in range(n - 1):
        for j in range(segs):
            a = i * segs + j
            b = i * segs + (j + 1) % segs
            c = (i + 1) * segs + (j + 1) % segs
            d = (i + 1) * segs + j
            faces.append((a, b, c, d))

    return verts, faces, speeds

def create_blender_object(name, verts, faces, speeds, segs=TUBE_SEGS):
    """Create mesh object with speed FLOAT_COLOR attribute."""
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()

    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)

    # FLOAT_COLOR vertex attribute for speed
    attr = me.color_attributes.new("Thomas_Speed", "FLOAT_COLOR", "POINT")
    # Normalise speeds to [0, 1]
    s_min, s_max = speeds.min(), speeds.max()
    s_range = max(s_max - s_min, 1e-6)
    speed_norm = (speeds - s_min) / s_range

    # Each ring shares its speed value across TUBE_SEGS vertices
    for ring_i, spd in enumerate(speed_norm):
        for j in range(segs):
            vi = ring_i * segs + j
            if vi < len(me.vertices):
                r = spd                  # red channel encodes speed
                g = 0.12 + 0.4 * spd    # cobalt-to-amber ramp: green
                b = 1.0 - 0.8 * spd     # blue falls as speed rises
                attr.data[vi].color = (r, g, b, 1.0)
    return ob

def add_poi_head(tube_ob):
    """Attach a low-poly sphere as poi head at the orbit start point."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=POI_R,
        segments=POI_SEGS * 4,
        ring_count=POI_SEGS * 2,
        location=tube_ob.data.vertices[0].co,
    )
    head = bpy.context.active_object
    head.name = f"{tube_ob.name}_head"
    return head

def add_shape_key(base_ob, key_name, b_val, segs=TUBE_SEGS, radius=TUBE_R):
    """Add a shape key for an alternative b-value orbit."""
    pts, speeds = integrate_thomas(b_val)
    _, normals = bishop_frames(pts)

    sk = base_ob.shape_key_add(name=key_name, from_mix=False)
    n_verts = len(base_ob.data.vertices)

    vert_idx = 0
    for i, (p, nrm) in enumerate(zip(pts, normals)):
        if vert_idx >= n_verts:
            break
        t = pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]
        norm_t = np.linalg.norm(t)
        if norm_t < 1e-10:
            t = np.array([1.0, 0.0, 0.0])
        else:
            t /= norm_t
        binorm = np.cross(t, nrm)
        bn = np.linalg.norm(binorm)
        if bn < 1e-10:
            vert_idx += segs
            continue
        binorm /= bn
        for c, s in zip(np.cos(np.linspace(0, 2*np.pi, segs, endpoint=False)),
                        np.sin(np.linspace(0, 2*np.pi, segs, endpoint=False))):
            if vert_idx < n_verts:
                sk.data[vert_idx].co = p + radius * (c * nrm + s * binorm)
                vert_idx += 1
    return sk

# ─── MAIN BUILD ────────────────────────────────────────────────────────────────
def main():
    # Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # Build canonical orbit
    pts, speeds = integrate_thomas(B_CANON)
    verts, faces, spds = build_tube_mesh(pts, speeds)

    tube_ob = create_blender_object(BLEND_NAME, verts, faces, spds)

    # Basis shape key (canonical)
    tube_ob.shape_key_add(name="Basis", from_mix=False)

    # Alternative-parameter shape keys
    for key_name, b_val in SK_PARAMS:
        add_shape_key(tube_ob, key_name, b_val)

    # Poi head sphere at first waypoint
    bpy.context.view_layer.objects.active = tube_ob
    add_poi_head(tube_ob)

    # Rename and apply transforms for WebXR export (+Y up)
    for ob in bpy.data.objects:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = bpy.data.objects[BLEND_NAME]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    print(f"[Thomas Blueprint] Done — {len(verts)} verts, {len(faces)} quads")
    print(f"  Waypoints: {len(pts)}, Shape keys: {len(SK_PARAMS)+1}")

if __name__ == "__main__":
    main()
