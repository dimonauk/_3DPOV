"""
Foucault Pendulum · Berry Phase · Hannay Angle —
Coriolis-Frame Analytic Solution z(t)=A·cos(ω₀t)·exp(−iΩ_z t),
Geometric Phase γ=2π·sinλ per Sidereal Day, Closed 7-Petal Rosette
& Cobalt–Amber FLOAT_COLOR Parallel-Transport Tube Poi Disc for WebXR
blueprint.py · Blender 5.1 · Holoflow Studio · CC0
═══════════════════════════════════════════════════════════════════════════════

The Foucault Pendulum — three sentences
────────────────────────────────────────
Léon Foucault suspended a 28 kg iron ball on a 67 m wire from the dome
of the Panthéon in Paris in 1851 and let it swing. Over the course of the
day the plane of oscillation appeared to rotate clockwise (in the northern
hemisphere), completing one full turn in 31.8 h at latitude 48.9°. The
rotation is not caused by any torque on the pendulum: it is the ground
that rotates, and the pendulum's plane is fixed relative to the stars.

Rotating-Frame Equations of Motion
────────────────────────────────────
In the Earth's rotating frame, two fictitious forces act on the bob:
centrifugal (absorbed into effective gravity) and Coriolis (2m ω×v).
For small-amplitude swings in the horizontal xy-plane:

  ẍ =  2·Ω_z·ẏ − ω₀²·x
  ÿ = −2·Ω_z·ẋ − ω₀²·y

where ω₀=√(g/L) is the natural frequency and Ω_z = Ω_Earth·sinλ is
the vertical component of Earth's rotation at latitude λ.

Analytic Solution — Complex Notation
──────────────────────────────────────
Writing z = x + iy the system collapses to one second-order ODE:
  z̈ + 2i·Ω_z·ż + ω₀²·z = 0

With initial condition z(0)=A, ż(0)=0 the exact solution is:
  z(t) = A·cos(ω′·t)·exp(−i·Ω_z·t)     where ω′ = √(ω₀² + Ω_z²) ≈ ω₀

The factor exp(−i·Ω_z·t) is pure precession: the swing axis rotates at
angular velocity Ω_z (Foucault precession). The envelope A·cos(ω′·t)
is the oscillating amplitude. Together they trace the closed rosette
  x(t) = A·cos(ω₀·t)·cos(Ω_z·t)
  y(t) = −A·cos(ω₀·t)·sin(Ω_z·t)
which closes after exactly one precession period T_prec = 2π/Ω_z.

Berry Phase / Hannay Angle
──────────────────────────
Berry (1984) and Hannay (1985) showed that the Foucault precession is a
geometric phase: the holonomy of parallel transport around a latitude
circle on S². As Earth rotates, the pendulum's parameter (the zenith
direction in space) traces a latitude circle — a closed loop on the
sphere of all possible zeniths.

The geometric phase accumulated per sidereal day is:
  γ = Ω_solid = 2π·sin(λ)   [radians]

For Paris (λ=48.9°): γ = 2π·sin(48.9°) ≈ 4.74 rad ≈ 271.5°.
Period of one full precession: T = 2π/γ × 24 h ≈ 31.8 h.
At the North Pole (λ=90°): γ = 2π, T = 24 h (one full turn per day).
At the equator (λ=0°): γ = 0, T = ∞ (no precession).

Connection to poi: A performer walking in a tight circle while swinging
poi overhead accumulates exactly the same Hannay angle — the poi plane
precesses relative to the lab frame by 2π·sin(tilt_angle). This is not
an approximation; it is the same parallel-transport holonomy.

Visual Parameters (scaled for visual clarity)
──────────────────────────────────────────────
Real Foucault pendulums make ~10,000 oscillations per precession period,
producing a dense disc. Here we scale Ω_z = ω₀/N_PETALS so that N_PETALS
oscillations fit one precession cycle. The shape keys sample λ-equivalents
at 5, 7, 9, 12 petals:
  N=5 petals  →  "Arctic"      (λ≈65°, T_prec≈26.5 h)
  N=7 petals  →  "London"      (λ≈51°, T_prec≈30.8 h)  [Basis]
  N=9 petals  →  "Subtropical" (λ≈30°, T_prec≈48.0 h)
  N=12 petals →  "Tropical"    (λ≈22°, T_prec≈63.9 h)

Outside Sources
────────────────
1. Léon Foucault, "Démonstration physique du mouvement de rotation de
   la Terre au moyen du pendule", Comptes Rendus de l'Académie des
   Sciences, vol. 32, pp. 135–138, 1851.
   Public Domain (published 175 years ago, no copyright).
   Digitised facsimile: https://gallica.bnf.fr (Bibliothèque nationale
   de France, public-domain digitisation project).
   Related: Comptes Rendus 1852 follow-up on gyroscope (also PD);
   Wikipedia "Foucault pendulum" (CC BY-SA 4.0) full derivation.

2. SciPy community, "scipy.integrate.solve_ivp" reference documentation,
   BSD-3-Clause licence, https://docs.scipy.org/doc/scipy/reference/.
   We derive the analytic solution instead of using solve_ivp (no
   external dep), but the derivation matches the reference ODE form
   exactly. Related upstream: https://github.com/scipy/scipy (BSD-3);
   https://github.com/numpy/numpy (BSD-3-Clause).
"""

import bpy, bmesh, math
import numpy as np
from pathlib import Path

# ── CONSTANTS ─────────────────────────────────────────────────────────────────
SLUG      = ("python-numpy-foucault-pendulum-berry-phase-hannay-angle"
             "-parallel-transport-poi-webxr")
OBJ_NAME  = "hf_foucault_poi"
GLB_PATH  = str(Path(__file__).parent / "hf_foucault_poi.glb")
MAT_NAME  = "HoloflowFoucaultMat"

OMEGA_0    = 1.0     # natural frequency (rad/s, scaled to 1 for simplicity)
BASE_PET   = 7       # petals for Basis shape (N_PETALS = ω₀/Ω_z)
AMPLITUDE  = 0.070   # poi head outer radius (m)
TUBE_R     = 0.0028  # Bishop tube cross-section radius (m)
TUBE_SIDES = 8       # octagonal cross-section
N_TRAJ     = 2800    # trajectory samples (400 per petal for BASE_PET=7)

# Shape key configs: [name, n_petals]
SHAPE_KEYS = [
    ("SK_Arctic",      5),
    ("SK_Subtropical", 9),
    ("SK_Tropical",   12),
]

# Cobalt → amber colour ramp: time ∈ [0, 1]
_COL_A = np.array([0.00, 0.20, 0.95, 1.0])   # cobalt
_COL_B = np.array([1.00, 0.55, 0.00, 1.0])   # amber


def lerp_colour(t):
    return _COL_A + (_COL_B - _COL_A) * t


def trajectory(n_petals):
    """
    Analytic Foucault rosette: z(t) = A·cos(ω₀t)·exp(−iΩ_z t).
    WHY endpoint=False: the rosette is closed (z(T_prec) = z(0)),
    so we omit the duplicate endpoint to keep the tube seamlessly
    closed under modular indexing.
    """
    omega_z = OMEGA_0 / n_petals                         # Ω_z = ω₀/N
    T_prec  = 2.0 * math.pi / omega_z                   # one precession period
    t  = np.linspace(0.0, T_prec, N_TRAJ, endpoint=False)
    x  =  AMPLITUDE * np.cos(OMEGA_0 * t) * np.cos(omega_z * t)
    y  = -AMPLITUDE * np.cos(OMEGA_0 * t) * np.sin(omega_z * t)
    z  = np.zeros_like(t)
    t_norm = t / T_prec                                  # ∈ [0, 1)
    return np.c_[x, y, z].astype(np.float64), t_norm


def bishop_tube(pts):
    """
    Build a closed parallel-transport (Bishop) tube around pts.
    WHY Bishop over Frenet-Serret: Frenet frames flip at inflection
    points where curvature → 0; Bishop transport is always smooth and
    never introduces twist, which is correct for a physical pendulum
    whose 'up' direction is simply perpendicular to the plane.
    """
    N  = len(pts)
    # Tangent vectors for closed curve (wrap-around on last element)
    T  = np.empty_like(pts)
    T[:-1] = pts[1:] - pts[:-1]
    T[-1]  = pts[0]  - pts[-1]
    ln = np.linalg.norm(T, axis=1, keepdims=True)
    T /= np.where(ln < 1e-14, 1.0, ln)

    # WHY up = ẑ: the path is planar in z=0, so ẑ is always perpendicular
    # to the tangent and the Bishop normal stays near ẑ throughout.
    up  = np.array([0.0, 0.0, 1.0])
    Nr  = np.empty_like(pts)
    Br  = np.empty_like(pts)
    n0  = up - np.dot(up, T[0]) * T[0]
    ln0 = np.linalg.norm(n0)
    Nr[0] = n0 / (ln0 if ln0 > 1e-14 else 1.0)
    Br[0] = np.cross(T[0], Nr[0])

    for i in range(1, N):
        t0, t1 = T[i-1], T[i]
        c = float(np.clip(np.dot(t0, t1), -1.0, 1.0))
        if c > 0.9999:
            Nr[i] = Nr[i-1]; Br[i] = Br[i-1]; continue
        ax  = np.cross(t0, t1)
        s   = np.linalg.norm(ax)
        if s < 1e-14:
            Nr[i] = Nr[i-1]; Br[i] = Br[i-1]; continue
        ax /= s
        n   = Nr[i-1]
        Nr[i] = n*c + np.cross(ax, n)*s + ax*float(np.dot(ax, n))*(1-c)
        ln  = np.linalg.norm(Nr[i])
        Nr[i] /= (ln if ln > 1e-14 else 1.0)
        Br[i] = np.cross(T[i], Nr[i])

    ang = np.linspace(0.0, 2.0*math.pi, TUBE_SIDES, endpoint=False)
    ca, sa = np.cos(ang), np.sin(ang)

    rings = []
    for i in range(N):
        r = pts[i] + ca[:, None]*Nr[i]*TUBE_R + sa[:, None]*Br[i]*TUBE_R
        rings.append(r)
    verts = np.vstack(rings)

    # WHY quad faces not tris: fewer faces, easier UV layout, cleaner GLB.
    faces = []
    for i in range(N):
        j = (i + 1) % N
        b0, b1 = i*TUBE_SIDES, j*TUBE_SIDES
        for k in range(TUBE_SIDES):
            l = (k + 1) % TUBE_SIDES
            faces.append([b0+k, b0+l, b1+l, b1+k])
    return verts, faces


def build_scene():
    # ── Clear existing scene ──────────────────────────────────────────────────
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for me in list(bpy.data.meshes):
        bpy.data.meshes.remove(me)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)

    # ── Basis geometry ────────────────────────────────────────────────────────
    pts_basis, t_norm = trajectory(BASE_PET)
    verts, faces      = bishop_tube(pts_basis)
    N_V = len(verts)

    me = bpy.data.meshes.new(OBJ_NAME)
    me.from_pydata(verts.tolist(), [], faces)
    me.update()
    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # ── FLOAT_COLOR: phase along precession cycle (POINT domain) ─────────────
    # WHY FLOAT_COLOR over vertex_colors: bpy 4.x+ uses generic Attribute API;
    # FLOAT_COLOR on POINT domain maps per-vertex and exports cleanly to GLB.
    attr = me.attributes.new("Foucault_Phase", 'FLOAT_COLOR', 'POINT')
    cols = np.empty((N_V, 4), dtype=np.float32)
    for i in range(N_TRAJ):
        cols[i*TUBE_SIDES:(i+1)*TUBE_SIDES] = lerp_colour(t_norm[i])
    attr.data.foreach_set("color", cols.ravel().tolist())

    # ── Material ──────────────────────────────────────────────────────────────
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    atn = nt.nodes.new("ShaderNodeAttribute")
    atn.attribute_name = "Foucault_Phase"
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = 0.35
    bsdf.inputs["Metallic"].default_value  = 0.85
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(atn.outputs["Color"],  bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
    me.materials.append(mat)

    # ── Custom properties ─────────────────────────────────────────────────────
    obj["holoflow:facet"]      = True
    obj["holoflow:category"]   = "poi-disc"
    obj["holoflow:type"]       = "foucault-rosette"
    obj["holoflow:n_petals"]   = BASE_PET
    obj["holoflow:berry_phase"]= f"2π·sin(λ) rad/day"

    # ── Shape keys ────────────────────────────────────────────────────────────
    obj.shape_key_add(name="Basis", from_mix=False)
    for sk_name, n_pet in SHAPE_KEYS:
        pts_sk, _ = trajectory(n_pet)
        v_sk, _   = bishop_tube(pts_sk)
        sk = obj.shape_key_add(name=sk_name, from_mix=False)
        for vi, pos in enumerate(v_sk):
            sk.data[vi].co = pos.tolist()

    # ── Export GLB ────────────────────────────────────────────────────────────
    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        use_selection=True,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_morph=True,
        export_morph_normal=False,
        export_yup=True,
    )
    print(f"✓ Exported → {GLB_PATH}")


build_scene()
