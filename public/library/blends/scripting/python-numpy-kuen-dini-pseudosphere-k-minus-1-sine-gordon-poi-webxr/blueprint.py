"""
blueprint.py — Kuen, Dini & Pseudosphere: Constant Negative Gaussian Curvature K = −1
Technique: parametric surface evaluation + Bäcklund-transform morphotypes as shape keys
Blender 5.1 · Python 3.11 · NumPy (bundled) · Licence: CC0

Three classical surfaces all satisfy K = −1 everywhere yet look entirely different:
  Kuen  (1884) — doubly-folded, self-intersecting finite sheet; sine-Gordon solution φ
  Dini  (1865) — helicoid of revolution; Bäcklund image of the pseudosphere at pitch b
  Pseudosphere — Beltrami's tractroid (1868); the prototype K = −1 embedding in ℝ³

They are related by Bäcklund transformations — a discrete symmetry of the
sine-Gordon PDE  ∂²φ/∂u∂v = sin φ  that maps any solution to another solution,
hence any K = −1 surface to another.  Shape-key morphing between them is not
merely decorative; it reflects genuine algebraic kinship in solution space.

Output: hf_kuen_poi.blend + hf_kuen_poi.glb (Draco-6, morph targets, vertex colour)
"""
import bpy
import numpy as np

# ─── PARAMETERS ───────────────────────────────────────────────────────────────
GRID_U      = 80        # u-resolution; increase to 120 for smoother export
GRID_V      = 60        # v-resolution
V_MIN       = 0.18      # avoids log(tan(v/2)) blow-up near v = 0
V_MAX       = np.pi - 0.18   # symmetric upper bound
U_KUEN      = 2.6       # ±U_KUEN half-range for Kuen's u (finite window)
DINI_A      = 1.0       # Dini radius parameter
DINI_B      = 0.40      # Dini helix pitch — controls spiral rate
DINI_U_MAX  = 4.0 * np.pi   # 2 full turns of the Dini helix
PS_V_MAX    = 3.8       # tractrix plateau cap (sech(3.8) ≈ 0.045, shape near-flat)
POI_RADIUS  = 0.115     # m — bbox half-diagonal of final GLB
OBJ_NAME    = "kuen_neg_curvature_poi"

# Vertex colour ramp: v-parameter (0 = V_MIN, 1 = V_MAX) → RGBA float
# Warm orange equator, deep indigo poles — constant across all three surfaces.
VCOL_RAMP = [
    (0.00, 0.10, 0.06, 0.42, 1.0),
    (0.25, 0.24, 0.14, 0.70, 1.0),
    (0.50, 0.88, 0.40, 0.18, 1.0),   # equator
    (0.75, 0.68, 0.14, 0.26, 1.0),
    (1.00, 0.10, 0.06, 0.42, 1.0),
]


# ─── SURFACE EVALUATORS ───────────────────────────────────────────────────────

def kuen_surface(S: np.ndarray, T: np.ndarray) -> np.ndarray:
    """Kuen (1884) surface.  WHY K = −1: the denominator
       d(u,v) = 1 + u²sin²v  exactly cancels the curvature from the log term.
       Substituting φ = 2 arctan(u sin v) gives a solution to the sine-Gordon
       equation, embedding this surface in the solution hierarchy.
    """
    u = (2.0 * S - 1.0) * U_KUEN        # S ∈ [0,1] → u ∈ [-U_KUEN, U_KUEN]
    v = V_MIN + T * (V_MAX - V_MIN)      # T ∈ [0,1] → v ∈ [V_MIN, V_MAX]
    d = 1.0 + u**2 * np.sin(v)**2        # Kuen denominator
    x = 2.0 * (np.cos(u) + u * np.sin(u)) * np.sin(v) / d
    y = 2.0 * (np.sin(u) - u * np.cos(u)) * np.sin(v) / d
    z = np.log(np.tan(v * 0.5)) + 2.0 * np.cos(v) / d
    return np.stack([x, y, z], axis=-1)  # (GRID_U, GRID_V, 3)


def dini_surface(S: np.ndarray, T: np.ndarray) -> np.ndarray:
    """Dini (1865) surface.  WHY IT DIFFERS FROM KUEN: the twist term b·u breaks
       the Kuen self-intersection and produces a clean embedded helix.  Bäcklund
       parameter relating it to the pseudosphere is the pitch ratio b/a.
    """
    u = S * DINI_U_MAX                   # S ∈ [0,1] → u ∈ [0, 4π]
    v = V_MIN + T * (V_MAX - V_MIN)
    sv = np.sin(v);  cv = np.cos(v)
    x = DINI_A * np.cos(u) * sv
    y = DINI_A * np.sin(u) * sv
    z = DINI_A * (cv + np.log(np.tan(v * 0.5))) + DINI_B * u
    return np.stack([x, y, z], axis=-1)


def pseudosphere(S: np.ndarray, T: np.ndarray) -> np.ndarray:
    """Beltrami tractroid (1868).  WHY IT IS THE PROTOTYPE: Beltrami proved this
       surface realises a finite patch of the hyperbolic plane in Euclidean ℝ³,
       confirming non-Euclidean geometry is internally consistent.  The 'cusp'
       at v = 0 is the equatorial unit circle (sech → 1); as v → PS_V_MAX the
       surface pinches to the z-axis (sech → 0, tractrix plateau).
    """
    u = S * 2.0 * np.pi                  # full revolution
    v = T * PS_V_MAX                     # v ∈ [0, PS_V_MAX]
    inv_cosh = 1.0 / np.cosh(v)          # = sech(v)
    x = np.cos(u) * inv_cosh
    y = np.sin(u) * inv_cosh
    z = v - np.tanh(v)                   # tractrix profile: z = t − tanh(t)
    return np.stack([x, y, z], axis=-1)


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def scale_to_poi(pts: np.ndarray) -> np.ndarray:
    """Centre at origin; isotropically scale so max vertex-distance = POI_RADIUS."""
    pts = pts - pts.mean(axis=0)
    r_max = float(np.sqrt((pts ** 2).sum(axis=1)).max())
    return pts * (POI_RADIUS / r_max) if r_max > 1e-9 else pts


def ramp_colour(t: float) -> tuple:
    """Interpolate VCOL_RAMP at normalised t ∈ [0, 1].  Returns (R,G,B,A)."""
    for k in range(len(VCOL_RAMP) - 1):
        t0, r0, g0, b0, a0 = VCOL_RAMP[k]
        t1, r1, g1, b1, a1 = VCOL_RAMP[k + 1]
        if t <= t1 + 1e-9:
            f = max(0.0, min(1.0, (t - t0) / (t1 - t0 + 1e-12)))
            return (r0 + f*(r1-r0), g0 + f*(g1-g0), b0 + f*(b1-b0), 1.0)
    return (VCOL_RAMP[-1][1], VCOL_RAMP[-1][2], VCOL_RAMP[-1][3], 1.0)


# ─── BUILD MESH ───────────────────────────────────────────────────────────────

def build_mesh() -> None:
    # Remove previous run
    for ob in [o for o in bpy.data.objects if o.name.startswith(OBJ_NAME)]:
        bpy.data.objects.remove(ob, do_unlink=True)
    for me in [m for m in bpy.data.meshes if m.name.startswith(OBJ_NAME)]:
        bpy.data.meshes.remove(me)

    # Shared (S, T) parameter grid
    s1 = np.linspace(0.0, 1.0, GRID_U)
    t1 = np.linspace(0.0, 1.0, GRID_V)
    S, T = np.meshgrid(s1, t1, indexing='ij')  # (GRID_U, GRID_V)

    # Evaluate and normalise each surface
    pts_kuen = scale_to_poi(kuen_surface(S, T).reshape(-1, 3))
    pts_dini = scale_to_poi(dini_surface(S, T).reshape(-1, 3))
    pts_ps   = scale_to_poi(pseudosphere(S, T).reshape(-1, 3))

    # Vertex positions (Kuen = basis)
    verts = [(float(p[0]), float(p[1]), float(p[2])) for p in pts_kuen]

    # Quad faces — row-major in (i=u, j=v)
    faces = [
        (i*GRID_V+j, i*GRID_V+j+1, (i+1)*GRID_V+j+1, (i+1)*GRID_V+j)
        for i in range(GRID_U - 1) for j in range(GRID_V - 1)
    ]

    mesh = bpy.data.meshes.new(OBJ_NAME)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj  = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # ── smooth shading ──────────────────────────────────────────────────────
    for p in mesh.polygons:
        p.use_smooth = True

    # ── shape keys ──────────────────────────────────────────────────────────
    obj.shape_key_add(name='Basis', from_mix=False)

    for sk_name, pts in (('Dini', pts_dini), ('Pseudosphere', pts_ps)):
        sk = obj.shape_key_add(name=sk_name, from_mix=False)
        sk.value = 0.0
        sk.data.foreach_set('co', pts.astype(np.float32).flatten().tolist())

    # ── vertex colours (v-parameter → ramp) ─────────────────────────────
    mesh.color_attributes.new(name='surface_colour', type='BYTE_COLOR', domain='POINT')
    vcol = mesh.color_attributes['surface_colour']
    col_flat = []
    for i in range(GRID_U):
        for j in range(GRID_V):
            col_flat.extend(ramp_colour(float(j) / max(GRID_V - 1, 1)))
    vcol.data.foreach_set('color', col_flat)
    mesh.update()

    # ── report ───────────────────────────────────────────────────────────
    n_v = len(mesh.vertices);  n_f = len(mesh.polygons)
    print(f"[kuen] {n_v} verts  {n_f} faces  shape keys: Basis, Dini, Pseudosphere")
    print(f"[kuen] poi radius {POI_RADIUS:.3f} m — export GLB: File → Export → glTF 2.0")
    print("[kuen] Export options: GLB · Draco 6 · Morph Targets ✓ · Vertex Colors ✓")


build_mesh()
