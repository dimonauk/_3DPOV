"""
Python numpy — Mandelbrot & Julia Fractal — Blender 5.1 Blueprint
Holoflow Studio | CC0 | 2026-07-25

Technique:
  The Mandelbrot set is the locus of complex parameters c for which the
  orbit z_{n+1} = z_n² + c (z_0 = 0) never escapes the radius-2 disc.
  Smooth colouring (Hubbard-Douady, 1982) removes staircase banding by
  extending the integer escape count to a continuous value via the final
  modulus: smooth_n = n − log2(log2(|z_final|)).  The result is mapped
  to vertex colour + Z-displacement on a 256×256 quad mesh and exported
  as a WebXR-ready GLB.  A second mesh shows the Douady-rabbit Julia set
  (c = −0.7269 + 0.1889i), and the Mandelbrot boundary is extracted as
  a NURBS Curve — the default poi light-painting trajectory.

External attribution:
  NumPy — vectorised complex arithmetic — BSD-3-Clause — NumPy Developers
  https://github.com/numpy/numpy

  Blender Python API 5.1 — bpy.types.Attribute / bpy.types.Mesh
  CC-BY-SA-4.0 — Blender Foundation
  https://docs.blender.org/api/5.1/bpy.types.Mesh.html

  Douady & Hubbard (1982) "Étude dynamique des polynômes complexes"
  Université de Paris-Sud — mathematical results, no licence required.
  Related: mandelbrot-py (MIT) https://github.com/alexhernandez/mandelbrot-py
"""

import math
import bpy
import bmesh as bm_mod
import numpy as np

# ── PARAMETERS ───────────────────────────────────────────────────────────────
GRID_N      = 256        # vertices per axis (256² = 65 536 quads)
MAX_ITER    = 128        # escape-time ceiling; raise for finer boundary detail
BAILOUT_R   = 2.0        # escape radius — provably sufficient for Mandelbrot
# Mandelbrot view window (show the full main cardioid + both bulbs)
M_XMIN, M_XMAX = -2.5, 1.0
M_YMIN, M_YMAX = -1.5, 1.5
# Julia parameter — Douady rabbit near period-3 bifurcation point
JULIA_CR    = -0.7269
JULIA_CI    =  0.1889
# Vertical lift: boundary region rises to Z_TOP for the poi path
Z_TOP       = 0.30       # metres
Z_BASE      = 0.02       # metres (interior points still slightly elevated)
# Boundary extraction: smooth_n / MAX_ITER > this → part of boundary curve
BOUNDARY_THRESH = 0.88
MESH_M_NAME = "hf_mandelbrot"
MESH_J_NAME = "hf_julia"
CURVE_NAME  = "hf_boundary_poi_path"
OUTPUT_GLB_M = "//hf_mandelbrot.glb"
OUTPUT_GLB_J = "//hf_julia.glb"
EXPORT_DRACO = True


# ── MATHS ────────────────────────────────────────────────────────────────────

def mandelbrot_smooth(cx: np.ndarray, cy: np.ndarray) -> np.ndarray:
    """Smooth (continuous) escape count for a grid of c = cx + i·cy.

    WHY smooth: integer escape count n produces hard colour bands because
    every vertex in the same 'ring' between orbit escapes at step n and n+1
    shares the same colour.  The Hubbard-Douady formula extends n to a float
    by folding in log2(log2|z_final|), so the colour gradient is C¹-smooth
    across ring boundaries.
    """
    zr = np.zeros_like(cx)
    zi = np.zeros_like(cy)
    count = np.full(cx.shape, MAX_ITER, dtype=np.float32)
    escaped = np.zeros(cx.shape, dtype=bool)

    for i in range(MAX_ITER):
        mask = ~escaped
        zr2 = zr * zr
        zi2 = zi * zi
        mod2 = zr2 + zi2
        newly = mask & (mod2 > BAILOUT_R * BAILOUT_R)
        # Smooth count: n − log2(log2(|z|)) evaluated at escape step
        safe_mod = np.where(newly & (mod2 > 1.0), mod2, 4.0)
        smooth = i - np.log2(np.log2(np.sqrt(safe_mod)))
        count = np.where(newly, smooth, count)
        escaped |= newly
        # z → z² + c  (only for points still inside)
        new_zr = zr2 - zi2 + cx
        new_zi = 2.0 * zr * zi + cy
        zr = np.where(mask, new_zr, zr)
        zi = np.where(mask, new_zi, zi)

    return count.astype(np.float32)


def julia_smooth(zx: np.ndarray, zy: np.ndarray) -> np.ndarray:
    """Smooth escape count for a Julia set with fixed c = JULIA_CR + i·JULIA_CI."""
    zr = zx.copy()
    zi = zy.copy()
    count = np.full(zx.shape, MAX_ITER, dtype=np.float32)
    escaped = np.zeros(zx.shape, dtype=bool)
    cr, ci = JULIA_CR, JULIA_CI

    for i in range(MAX_ITER):
        mask = ~escaped
        zr2 = zr * zr
        zi2 = zi * zi
        mod2 = zr2 + zi2
        newly = mask & (mod2 > BAILOUT_R * BAILOUT_R)
        safe_mod = np.where(newly & (mod2 > 1.0), mod2, 4.0)
        smooth = i - np.log2(np.log2(np.sqrt(safe_mod)))
        count = np.where(newly, smooth, count)
        escaped |= newly
        new_zr = zr2 - zi2 + cr
        new_zi = 2.0 * zr * zi + ci
        zr = np.where(mask, new_zr, zr)
        zi = np.where(mask, new_zi, zi)

    return count.astype(np.float32)


# ── COLOUR MAP ───────────────────────────────────────────────────────────────

def smooth_to_rgba(smooth: np.ndarray) -> np.ndarray:
    """Map smooth iteration count → RGBA float32 [0,1].

    Interior (smooth == MAX_ITER) → black.
    Boundary region → gold-orange ramp.  Exterior → blue → cyan → white.
    WHY HSV spiral: cycling hue with period ~12 iterations gives the
    classic Mandelbrot 'electric' look while keeping each period distinct.
    """
    n = smooth.flatten()
    norm = n / MAX_ITER           # 0..1, interior = 1.0
    interior = (n >= MAX_ITER - 0.5)

    hue = (norm * 8.0) % 1.0     # cycle hue 8 times across the depth
    sat = np.where(interior, 0.0, 0.8)
    val = np.where(interior, 0.0, 0.95)

    # Vectorised HSV → RGB
    h6 = hue * 6.0
    hi = np.floor(h6).astype(int) % 6
    f  = h6 - np.floor(h6)
    p  = val * (1 - sat)
    q  = val * (1 - sat * f)
    t  = val * (1 - sat * (1 - f))
    v  = val

    r = np.select([hi==0, hi==1, hi==2, hi==3, hi==4, hi==5], [v,q,p,p,t,v])
    g = np.select([hi==0, hi==1, hi==2, hi==3, hi==4, hi==5], [t,v,v,q,p,p])
    b = np.select([hi==0, hi==1, hi==2, hi==3, hi==4, hi==5], [p,p,t,v,v,q])
    a = np.ones_like(r)
    return np.stack([r, g, b, a], axis=-1).astype(np.float32)


# ── MESH BUILDER ─────────────────────────────────────────────────────────────

def build_fractal_mesh(
    name: str,
    smooth: np.ndarray,
    xmin: float, xmax: float,
    ymin: float, ymax: float,
) -> bpy.types.Object:
    """Create a GRID_N×GRID_N quad mesh with fractal vertex colour + Z-displacement."""
    N = GRID_N
    verts, faces = [], []

    norm = smooth / MAX_ITER                    # per-vertex normalised count
    norm_clipped = np.clip(norm, 0.0, 1.0)
    # Z: interior black → Z_BASE; near-boundary → Z_TOP (raised for poi path)
    z_vals = Z_BASE + (Z_TOP - Z_BASE) * norm_clipped

    xs = np.linspace(xmin, xmax, N)
    ys = np.linspace(ymin, ymax, N)

    for j in range(N):
        for i in range(N):
            verts.append((xs[i], ys[j], float(z_vals[j, i])))

    for j in range(N - 1):
        for i in range(N - 1):
            a = j * N + i
            verts_face = (a, a + 1, a + N + 1, a + N)
            faces.append(verts_face)

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    # Vertex colour attribute (BYTE_COLOR, domain POINT) → GLB COLOR_0
    attr = mesh.attributes.new("Col", "BYTE_COLOR", "POINT")
    rgba = smooth_to_rgba(smooth)
    flat = rgba.flatten()
    attr.data.foreach_set("color", flat)
    mesh.update()

    # Apply transforms so GLB normals are correct
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Shade flat → faceted look matching holoflow aesthetic
    for poly in mesh.polygons:
        poly.use_smooth = False

    return obj


# ── BOUNDARY CURVE ────────────────────────────────────────────────────────────

def extract_boundary_curve(smooth: np.ndarray) -> bpy.types.Object:
    """Identify near-boundary vertices and create a NURBS Curve from them.

    Near-boundary = escaped within the last 12% of MAX_ITER iterations.
    Sorting by angle from origin gives a rough but visually coherent orbit —
    the poi trajectory spirals around the main cardioid.
    """
    N = GRID_N
    norm = smooth / MAX_ITER
    xs = np.linspace(M_XMIN, M_XMAX, N)
    ys = np.linspace(M_YMIN, M_YMAX, N)
    pts = []

    for j in range(N):
        for i in range(N):
            if norm[j, i] >= BOUNDARY_THRESH and norm[j, i] < 1.0:
                z = float(Z_BASE + (Z_TOP - Z_BASE) * norm[j, i])
                pts.append((xs[i], ys[j], z))

    if not pts:
        return None

    pts.sort(key=lambda p: math.atan2(p[1], p[0]))

    curve_data = bpy.data.curves.new(CURVE_NAME, type="CURVE")
    curve_data.dimensions = "3D"
    spline = curve_data.splines.new("NURBS")
    spline.points.add(len(pts) - 1)
    for k, (x, y, z) in enumerate(pts):
        spline.points[k].co = (x, y, z, 1.0)
    spline.use_cyclic_u = True

    obj = bpy.data.objects.new(CURVE_NAME, curve_data)
    bpy.context.scene.collection.objects.link(obj)
    return obj


# ── GLB EXPORT ───────────────────────────────────────────────────────────────

def export_glb(obj: bpy.types.Object, path: str) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(path),
        use_selection=True,
        export_draco_mesh_compression_enable=EXPORT_DRACO,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )
    print(f"✓  {path} written")


# ── MAIN ─────────────────────────────────────────────────────────────────────

def main() -> None:
    # 1. Clean scene
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes) + list(bpy.data.curves):
        bpy.data.meshes.remove(block) if hasattr(bpy.data.meshes, "remove") else None

    # 2. Build complex-plane grids
    print("Computing Mandelbrot smooth escape count …")
    N = GRID_N
    xs = np.linspace(M_XMIN, M_XMAX, N, dtype=np.float32)
    ys = np.linspace(M_YMIN, M_YMAX, N, dtype=np.float32)
    CX, CY = np.meshgrid(xs, ys)
    smooth_m = mandelbrot_smooth(CX, CY)
    print(f"  smooth_m ∈ [{smooth_m.min():.2f}, {smooth_m.max():.2f}]")

    # Julia uses same spatial window (centred on origin)
    print("Computing Douady-rabbit Julia smooth escape count …")
    JX = np.linspace(-1.5, 1.5, N, dtype=np.float32)
    JY = np.linspace(-1.5, 1.5, N, dtype=np.float32)
    ZX, ZY = np.meshgrid(JX, JY)
    smooth_j = julia_smooth(ZX, ZY)

    # 3. Build meshes
    obj_m = build_fractal_mesh(MESH_M_NAME, smooth_m, M_XMIN, M_XMAX, M_YMIN, M_YMAX)
    obj_j = build_fractal_mesh(MESH_J_NAME, smooth_j, -1.5, 1.5, -1.5, 1.5)
    obj_j.location.x = (M_XMAX - M_XMIN) + 0.4
    extract_boundary_curve(smooth_m)                # poi path around main cardioid
    export_glb(obj_m, OUTPUT_GLB_M)
    export_glb(obj_j, OUTPUT_GLB_J)
    print("Done — open hf_mandelbrot.glb in a WebXR scene to paint with poi.")


main()
