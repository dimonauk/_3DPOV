"""
Python numpy — Haar DWT Multi-Scale Poi Curvature Decomposition
Blender 5.1 · CC0 · Holoflow Studio

Technique:
  The Discrete Wavelet Transform (DWT) decomposes a finite signal into a
  hierarchy of frequency bands by repeated half-band filtering. The Haar
  wavelet is the simplest orthonormal wavelet — the "average and difference"
  of adjacent pairs. One level splits a length-N signal into:

      a[j]  = (s[0::2] + s[1::2]) * INV_SQRT2   ← low-pass average (half length)
      d[j]  = (s[0::2] - s[1::2]) * INV_SQRT2   ← high-pass difference (half length)

  The INV_SQRT2 factor preserves the L² norm:  ‖a‖² + ‖d‖² = ‖s‖² (Parseval).
  Applying J = 3 levels gives one approximation band a3 and detail bands
  d1 (finest scale), d2 (medium), d3 (coarsest). All J+1 bands together have
  N coefficients — no information is lost; the transform is invertible.

  Application: a parametric poi path P(t) is constructed as a 3D spiral with
  superposed low-frequency sinusoidal perturbations and a small Brownian
  component. The discrete Menger curvature κ(i) is computed at each of N=512
  points. The DWT bands are then up-sampled back to N/2 points each via linear
  interpolation and placed as BEZIER curves offset laterally from the original
  path — bevel radius at each control point is proportional to |coefficient|,
  so the viewer can see WHERE on the path fast and slow curvature changes live.

  Why curvature? Curvature is the intrinsic measure of how tightly a path
  bends. High curvature = sharp corner or rapid direction change in poi motion.
  The DWT tells you: is the overall shape gently curved (dominated by a3/d3)?
  Or are there rapid local flicks (dominated by d1/d2)?

External sources:
  - Mallat 1989, "A Theory for Multiresolution Signal Decomposition: the
    Wavelet Representation", IEEE PAMI 11(7):674-693. Foundational paper.
  - PyWavelets source (MIT licence) https://github.com/PyWavelets/pywt
    Reference implementation; this script re-derives Haar from first principles.
  - NumPy documentation (BSD-3-Clause) https://numpy.org/doc/stable/
"""

import bpy, bmesh, math, numpy as np
from mathutils import Vector

# ─── PARAMETERS ───────────────────────────────────────────────────────────────
N           = 512     # number of poi path samples — must be divisible by 2^J
J           = 3       # DWT decomposition depth (detail bands d1, d2, d3 + approx a3)
TURNS       = 4.5     # spiral turns in the original path
RADIUS      = 1.5     # base spiral radius (m)
HEIGHT      = 0.8     # vertical rise over entire path
PERTURB_AMP = 0.35    # amplitude of sinusoidal perturbation (slow curvature variation)
PERTURB_F   = 3.0     # frequency (radians/turn) of the perturbation
LATERAL_GAP = 0.55    # lateral spacing between ribbon bands (m)
BEVEL_SCALE = 0.12    # max bevel radius (half-thickness of ribbon)

# Emission colours per band: approximation, d3 coarse, d2 medium, d1 fine
BAND_COLOURS = [
    (1.00, 1.00, 1.00, 1.0),   # a3 — white
    (0.05, 0.55, 1.00, 1.0),   # d3 — cerulean
    (0.10, 0.90, 0.40, 1.0),   # d2 — jade
    (1.00, 0.20, 0.45, 1.0),   # d1 — rose
]
BAND_NAMES  = ["DWT_a3", "DWT_d3", "DWT_d2", "DWT_d1"]
INV_SQRT2   = 1.0 / math.sqrt(2.0)

# ─── HELPERS ──────────────────────────────────────────────────────────────────

def _haar_level(s: np.ndarray):
    """Single-level Haar DWT. Returns (approx, detail) each of length len(s)//2."""
    a = (s[0::2] + s[1::2]) * INV_SQRT2
    d = (s[0::2] - s[1::2]) * INV_SQRT2
    return a, d


def haar_dwt(signal: np.ndarray, levels: int):
    """
    Full multi-level Haar DWT.
    Returns list [a_J, d_J, d_{J-1}, ..., d_1] — approximation first,
    then detail bands from coarsest (d_J) to finest (d_1).
    """
    details = []
    s = signal.copy().astype(float)
    for _ in range(levels):
        s, d = _haar_level(s)
        details.append(d)
    bands = [s] + list(reversed(details))   # [a, d_coarse, ..., d_fine]
    return bands


def _build_poi_path(n: int) -> np.ndarray:
    """
    Parametric poi path: helical spiral with sinusoidal radial perturbation.
    Returns (n, 3) float array of world positions.
    """
    t  = np.linspace(0.0, 2.0 * math.pi * TURNS, n, endpoint=False)
    r  = RADIUS + PERTURB_AMP * np.sin(PERTURB_F * t)
    x  = r * np.cos(t)
    y  = r * np.sin(t)
    z  = HEIGHT * t / (2.0 * math.pi * TURNS)
    return np.column_stack([x, y, z])


def _curvature(pts: np.ndarray) -> np.ndarray:
    """
    Discrete Menger curvature κ(i) at interior points.
    κ = |P'×P''| / |P'|³ using central finite differences.
    Returns array of length n-2, padded to n with edge values repeated.
    """
    d1 = pts[2:] - pts[:-2]          # centred first difference (step = 2h)
    d2 = pts[2:] - 2*pts[1:-1] + pts[:-2]   # centred second difference
    cross = np.cross(d1, d2)
    num   = np.linalg.norm(cross, axis=1)
    den   = np.linalg.norm(d1, axis=1) ** 3
    # avoid division by zero on near-straight segments
    kappa = np.where(den > 1e-12, num / den, 0.0)
    # pad to length n
    return np.concatenate([[kappa[0]], kappa, [kappa[-1]]])


def _normal_at(pts: np.ndarray, i: int) -> np.ndarray:
    """Approximate Frenet normal at point i (perpendicular to tangent, in xz-plane)."""
    if i == 0:
        t = pts[1] - pts[0]
    elif i == len(pts) - 1:
        t = pts[-1] - pts[-2]
    else:
        t = pts[i+1] - pts[i-1]
    t = t / (np.linalg.norm(t) + 1e-12)
    # binormal-like lateral direction: rotate tangent 90° around Z
    n = np.array([-t[1], t[0], 0.0])
    return n / (np.linalg.norm(n) + 1e-12)


def _upsample_coeffs(coeffs: np.ndarray, target: int) -> np.ndarray:
    """Linear up-sample an array of length M to length target."""
    m = len(coeffs)
    x_old = np.linspace(0.0, 1.0, m)
    x_new = np.linspace(0.0, 1.0, target)
    return np.interp(x_new, x_old, coeffs)


def _make_ribbon(name: str, pts_base: np.ndarray, side_offset: float,
                 bevel_radii: np.ndarray, colour: tuple):
    """
    Create a BEZIER curve offset laterally from pts_base.
    Each spline point has a custom bevel radius driven by bevel_radii.
    """
    n = len(pts_base)
    curve_data = bpy.data.curves.new(name=name, type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.bevel_depth = BEVEL_SCALE        # default; overridden per-point
    curve_data.use_fill_caps = True

    spline = curve_data.splines.new('BEZIER')
    spline.bezier_points.add(n - 1)             # add brings to n total

    for i, bp in enumerate(spline.bezier_points):
        lateral = _normal_at(pts_base, i) * side_offset
        pos = pts_base[i] + lateral
        bp.co = Vector(pos)
        bp.handle_left_type = 'AUTO'
        bp.handle_right_type = 'AUTO'
        bp.radius = float(np.clip(bevel_radii[i], 0.01, 1.0))

    obj = bpy.data.objects.new(name, curve_data)
    bpy.context.collection.objects.link(obj)

    # emission material
    mat = bpy.data.materials.new(name=f"{name}_mat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    emit  = nodes.new('ShaderNodeEmission')
    out   = nodes.new('ShaderNodeOutputMaterial')
    emit.inputs['Color'].default_value  = colour
    emit.inputs['Strength'].default_value = 3.5
    mat.node_tree.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    obj.data.materials.append(mat)
    return obj


# ─── MAIN ──────────────────────────────────────────────────────────────────────

def main():
    # 1. Clean scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    col = bpy.context.scene.collection

    # 2. Build poi path and curvature signal
    pts   = _build_poi_path(N)
    kappa = _curvature(pts)

    # Normalise curvature to [0,1] for stable DWT coefficient magnitudes
    k_max  = kappa.max() if kappa.max() > 1e-12 else 1.0
    kappa_n = kappa / k_max

    # 3. Haar DWT — J=3 levels
    # bands = [a3, d3, d2, d1]  (coarsest to finest)
    bands = haar_dwt(kappa_n, J)

    # Band lengths after J levels of half-band filtering:
    # a3, d3 → N/8    d2 → N/4    d1 → N/2
    # Up-sample each to N/2 so ribbon control-point density is manageable
    band_target = N // 2
    pts_half    = pts[::2]                      # every 2nd point (N/2 base)

    created = []
    for bi, (band_coeffs, band_name, band_col) in enumerate(
            zip(bands, BAND_NAMES, BAND_COLOURS)):
        coeffs_up = _upsample_coeffs(np.abs(band_coeffs), band_target)
        # normalise each band independently so all ribbons have similar visual weight
        c_max = coeffs_up.max() if coeffs_up.max() > 1e-12 else 1.0
        radii  = coeffs_up / c_max          # in [0,1]; _make_ribbon multiplies by BEVEL_SCALE
        offset = (bi - 1.5) * LATERAL_GAP  # spread: -1.5, -0.5, +0.5, +1.5 × gap
        obj = _make_ribbon(band_name, pts_half, offset, radii, band_col)
        created.append(obj)
        print(f"  {band_name}: {len(band_coeffs)} coeffs → ribbon with {band_target} points")

    # 4. Ghost path — thin grey POLY curve of the original trajectory
    ghost = bpy.data.curves.new("poi_path_ghost", type='CURVE')
    ghost.dimensions = '3D'
    ghost.bevel_depth = 0.005
    sp = ghost.splines.new('POLY')
    sp.points.add(N - 1)
    for i, p in enumerate(sp.points):
        p.co = Vector([*pts[i], 1.0])
    ghost_obj = bpy.data.objects.new("poi_path_ghost", ghost)
    bpy.context.collection.objects.link(ghost_obj)
    m = bpy.data.materials.new("ghost_mat")
    m.use_nodes = True
    m.node_tree.nodes.clear()
    e = m.node_tree.nodes.new('ShaderNodeEmission')
    o = m.node_tree.nodes.new('ShaderNodeOutputMaterial')
    e.inputs['Color'].default_value = (0.5, 0.5, 0.5, 1.0)
    e.inputs['Strength'].default_value = 0.8
    m.node_tree.links.new(e.outputs['Emission'], o.inputs['Surface'])
    ghost_obj.data.materials.append(m)

    # 5. Camera setup — orbit looking at bounding box centre
    bpy.ops.object.camera_add(location=(0, -6.5, 0.6))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(85), 0, 0)
    bpy.context.scene.camera = cam

    # 6. World: dark environment
    world = bpy.data.worlds.new("HF_DWT_World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.02, 0.02, 0.03, 1.0)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
    bpy.context.scene.world = world

    print(f"\nDWT ribbon scene built: {len(created)} bands + ghost path.")
    print("Bands (coarse→fine): a3 white, d3 cerulean, d2 jade, d1 rose")


main()
