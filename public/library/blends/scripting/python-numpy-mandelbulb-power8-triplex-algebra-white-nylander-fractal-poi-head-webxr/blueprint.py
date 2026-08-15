# ─────────────────────────────────────────────────────────────────────
# blueprint.py — Mandelbulb Power-8: White–Nylander Triplex Algebra,
#                Smooth Escape-Time, Marching Tetrahedra & Sphere↔Bulb
#                Shape-Key Poi Head for WebXR  (Blender 5.1)
# ─────────────────────────────────────────────────────────────────────
# TECHNIQUE
# The Mandelbulb is a 3D analogue of the Mandelbrot set built from
# the "triplex" power operation (White 2007, Nylander 2009).  For a
# vector z = (x, y, z), write it in spherical coordinates:
#
#   r  = sqrt(x²+y²+z²)
#   θ  = atan2(sqrt(x²+y²), z)   — polar angle from +z axis
#   φ  = atan2(y, x)             — azimuthal angle in xy-plane
#
# Then z^n is defined as:
#   z^n = r^n · ( sin(n·θ)·cos(n·φ),  sin(n·θ)·sin(n·φ),  cos(n·θ) )
#
# Iteration: z_{k+1} = z_k^n + c,   z_0 = (0,0,0)
# Escape:    |z| > BAIL = 2.0
#
# Smooth iteration count (Quílez 2015):
#   smooth = i − log₂(log₂ |z_escape|)
# cancels the discrete step artefact, giving a continuous field that
# shows smooth gradients near the surface boundary.
#
# ISOSURFACE  Marching Tetrahedra (Doi & Koide 1991) on an N³ grid
# covering [−1.25, 1.25]³.  The scalar field φ = 0 for trapped points
# (inside) and φ = smooth_iter ≥ 1 for escaped (outside); isosurface
# at ISO = 0.5 traces the Mandelbulb boundary.
#
# SHAPE KEYS
#   Basis     — vertices projected to a unit sphere of radius POI_RADIUS
#   Mandelbulb — actual marching-tet extracted positions
# record.py drives a shape-key Action: sphere collapses into fractal.
#
# COLOUR  Vertex attribute "Col" (BYTE_COLOR, POINT) maps normalised
# z-height to a HSV sweep: cool violet at the bottom, fiery red-orange
# at the top, matching the Holoflow poi light-trail palette.
# ─────────────────────────────────────────────────────────────────────

import os
import bpy
import bmesh
import math
import numpy as np
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────
SLUG          = "hf_mandelbulb"
POWER         = 8           # triplex exponent; 8 gives the canonical bulb
MAX_ITER      = 14          # iteration cap; more → sharper filaments
BAIL          = 2.0         # escape radius (standard for Mandelbulb)
N             = 26          # grid resolution per axis (N³ voxels)
EXTENT        = 1.25        # bounding cube half-edge (units before scaling)
ISO           = 0.5         # isosurface threshold (0=inside, >0=outside)
POI_RADIUS    = 0.082       # 8.2 cm poi head in metres
MAT_NAME      = "hf_mandelbulb_mat"
OUT_DIR       = os.path.join(os.path.dirname(__file__), "../../..",
                             "glbs", "scripting",
                             "python-numpy-mandelbulb-power8-triplex-algebra"
                             "-white-nylander-fractal-poi-head-webxr")

# Six tetrahedra per voxel sharing the body-diagonal edge v₀=(0,0,0)→v₆=(1,1,1).
# Each row is a tuple of four vertex-index offsets into the 8-corner cube.
CUBE_TETS = (
    (0, 1, 5, 6),
    (0, 1, 2, 6),
    (0, 2, 3, 6),
    (0, 3, 7, 6),
    (0, 4, 7, 6),
    (0, 4, 5, 6),
)
# Cube corner offsets in the order 0…7 that CUBE_TETS index into.
CUBE_OFF = np.array(
    [(0,0,0),(1,0,0),(1,1,0),(0,1,0),
     (0,0,1),(1,0,1),(1,1,1),(0,1,1)],
    dtype=np.float64,
)

# ── Triplex field (numpy vectorised) ─────────────────────────────────
def mandelbulb_field(N, extent, power, max_iter, bail):
    """
    Returns scalar field (N,N,N) where 0 = trapped and smooth_iter > 0
    = escaped.  Entire computation is NumPy-vectorised for speed.

    WHY vectorise the inner loop here:
      The grid has N³ ~ 17,000 sample points (N=26).  A Python for-loop
      over these while iterating 14 times each would take ~2 minutes.
      Broadcasting the triplex multiplication over the flattened array
      cuts this to ~0.4 seconds.
    """
    coords = np.linspace(-extent, extent, N)
    cx, cy, cz = np.meshgrid(coords, coords, coords, indexing='ij')
    cx = cx.ravel(); cy = cy.ravel(); cz = cz.ravel()

    zx = np.zeros_like(cx)
    zy = np.zeros_like(cy)
    zz = np.zeros_like(cz)

    # smooth_field: 0 = trapped, smooth_iter > 0 = escaped
    smooth = np.zeros(len(cx), dtype=np.float64)
    trapped = np.ones(len(cx), dtype=bool)  # True while still inside

    for i in range(1, max_iter + 1):
        r   = np.sqrt(zx*zx + zy*zy + zz*zz)
        th  = np.arctan2(np.sqrt(zx*zx + zy*zy), zz)
        phi = np.arctan2(zy, zx)
        rn  = r ** power

        # Triplex power: z^n in spherical coordinates
        new_zx = rn * np.sin(power * th) * np.cos(power * phi) + cx
        new_zy = rn * np.sin(power * th) * np.sin(power * phi) + cy
        new_zz = rn * np.cos(power * th)                       + cz

        zx = new_zx; zy = new_zy; zz = new_zz

        r2 = zx*zx + zy*zy + zz*zz
        escaped_now = trapped & (r2 > bail * bail)

        if escaped_now.any():
            # Quílez smooth colouring: removes the hard step at each iteration
            r_esc = np.sqrt(r2[escaped_now])
            # Guard against log(0): r_esc >= bail > 1, so log > 0 always.
            smooth[escaped_now] = float(i) - np.log2(np.log2(r_esc.clip(1.001)))
            trapped[escaped_now] = False

        if not trapped.any():
            break

    # Trapped points remain 0; escaped points have smooth ≥ 1.
    return smooth.reshape(N, N, N)

# ── Marching Tetrahedra ───────────────────────────────────────────────
def _lerp(va, vb, fa, fb, iso):
    """Linear interpolation to the iso-crossing on edge (va→vb)."""
    t = np.clip((iso - fa) / (fb - fa + 1e-30), 0.0, 1.0)
    return va + t * (vb - va)

def _march_cube(cv, cf, iso):
    """Extract triangles from one cube; returns list of (3,3) ndarray."""
    tris = []
    for ti in CUBE_TETS:
        vs = cv[list(ti)]   # (4,3)
        fs = cf[list(ti)]   # (4,)
        ins = fs < iso      # inside = trapped = small field value
        n_in = int(ins.sum())
        if n_in == 0 or n_in == 4:
            continue
        cuts: dict = {}
        for a in range(4):
            for b in range(a + 1, 4):
                if ins[a] != ins[b]:
                    cuts[(a, b)] = _lerp(vs[a], vs[b], fs[a], fs[b], iso)
        if n_in == 1 or n_in == 3:
            tris.append(np.array(list(cuts.values())))
        else:
            iv = [k for k in range(4) if ins[k]]
            ov = [k for k in range(4) if not ins[k]]
            i0, i1 = iv; j0, j1 = ov
            q = [cuts[(min(i0,j0), max(i0,j0))],
                 cuts[(min(i0,j1), max(i0,j1))],
                 cuts[(min(i1,j1), max(i1,j1))],
                 cuts[(min(i1,j0), max(i1,j0))]]
            tris.append(np.array([q[0], q[1], q[2]]))
            tris.append(np.array([q[0], q[2], q[3]]))
    return tris

def extract_isosurface(field, N, extent, iso):
    """
    Run marching tetrahedra over the field.
    Returns (verts: (V,3) ndarray, faces: list of 3-int-lists).
    Only processes active cells (sparse pass via numpy mask).
    """
    step = 2.0 * extent / (N - 1)
    corners = np.stack(
        [field[a:a+N-1, b:b+N-1, c:c+N-1]
         for a, b, c in [(0,0,0),(1,0,0),(1,1,0),(0,1,0),
                         (0,0,1),(1,0,1),(1,1,1),(0,1,1)]],
        axis=0,
    )  # (8, N-1, N-1, N-1)
    active = np.argwhere((corners.min(axis=0) < iso) & (corners.max(axis=0) > iso))

    verts_out: list = []
    faces_out: list = []
    idx_map: dict   = {}

    for ix, iy, iz in active:
        base = np.array([ix, iy, iz], dtype=np.float64) * step - extent
        cv   = base + CUBE_OFF * step
        cf   = corners[:, ix, iy, iz]
        for tri in _march_cube(cv, cf, iso):
            face = []
            for pt in tri:
                key = tuple(np.round(pt, 8))
                if key not in idx_map:
                    idx_map[key] = len(verts_out)
                    verts_out.append(pt)
                face.append(idx_map[key])
            faces_out.append(face)

    return (np.array(verts_out) if verts_out else np.zeros((0, 3))), faces_out

# ── Vertex colour by z-height (HSV sweep) ────────────────────────────
def _height_colours(verts):
    """
    HSV: hue = 0.66 (cool violet, bottom) → 0.0 (warm red, top).
    Returns float32 RGBA, shape (V, 4).
    """
    z = verts[:, 2]
    z_min, z_max = z.min(), z.max()
    t = (z - z_min) / max(z_max - z_min, 1e-8)   # 0…1 bottom→top
    hue = 0.66 * (1.0 - t)                        # 0.66 (violet) → 0.0 (red)
    colours = np.zeros((len(verts), 4), dtype=np.float32)
    for vi, (h, ti) in enumerate(zip(hue, t)):
        # Manual HSV → RGB (hue in [0, 1], S=1, V=1 for full-saturation)
        hi = int(h * 6.0)
        f  = h * 6.0 - hi
        p, q_, t_ = 0.0, 1.0 - f, f
        hi %= 6
        rgb = [(1.0, t_, p), (q_, 1.0, p), (p, 1.0, t_),
               (p, q_, 1.0), (t_, p, 1.0), (1.0, p, q_)][hi]
        colours[vi] = [*rgb, 1.0]
    return colours

# ── Material ─────────────────────────────────────────────────────────
def _make_mat():
    mat = bpy.data.materials.get(MAT_NAME)
    if mat:
        return mat
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    mat.shadow_method = "NONE"   # emissive poi — no shadow casting
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out  = nodes.new("ShaderNodeOutputMaterial")
    emit = nodes.new("ShaderNodeEmission")
    attr = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "Col"
    emit.inputs["Strength"].default_value = 3.0
    links.new(attr.outputs["Color"], emit.inputs["Color"])
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat

# ── Mesh builder ─────────────────────────────────────────────────────
def build_mandelbulb_poi():
    # 1. Compute scalar field
    print("[mandelbulb] computing escape-time field …")
    field = mandelbulb_field(N, EXTENT, POWER, MAX_ITER, BAIL)
    print(f"[mandelbulb] trapped fraction: {(field == 0).sum() / field.size:.3f}")

    # 2. Extract isosurface
    print("[mandelbulb] marching tetrahedra …")
    raw_verts, raw_faces = extract_isosurface(field, N, EXTENT, ISO)
    V = len(raw_verts)
    F = len(raw_faces)
    print(f"[mandelbulb] verts={V}  faces={F}")
    if V == 0:
        raise RuntimeError("No vertices extracted — check N/ISO/MAX_ITER.")

    # 3. Scale to poi diameter
    span = raw_verts.ptp(axis=0).max()
    scale = 2.0 * POI_RADIUS / span
    mandelbulb_positions = raw_verts * scale  # world-space bulb positions

    # Sphere positions: project each vertex to radius POI_RADIUS
    dirs  = raw_verts / (np.linalg.norm(raw_verts, axis=1, keepdims=True) + 1e-12)
    sphere_positions = dirs * POI_RADIUS

    # 4. Create Blender mesh from the sphere (Basis shape key)
    mesh = bpy.data.meshes.new(SLUG)
    mesh.from_pydata(sphere_positions.tolist(), [], raw_faces)
    mesh.update()

    ob = bpy.data.objects.new(SLUG, mesh)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)

    # 5. Shape keys
    ob.shape_key_add(name="Basis", from_mix=False)
    sk_bulb = ob.shape_key_add(name="Mandelbulb", from_mix=False)
    for vi, pos in enumerate(mandelbulb_positions):
        sk_bulb.data[vi].co = Vector(pos.tolist())

    # 6. Vertex colour (height gradient) on the Mandelbulb positions
    colours = _height_colours(mandelbulb_positions)
    vcol = mesh.color_attributes.new(name="Col", type="BYTE_COLOR", domain="POINT")
    for vi, c in enumerate(colours):
        vcol.data[vi].color = c.tolist()

    # 7. Material + flat shading
    mat = _make_mat()
    mesh.materials.append(mat)
    for poly in mesh.polygons:
        poly.use_smooth = False

    # 8. +Y-up rotation (studio convention)
    ob.rotation_euler[0] = math.radians(-90)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    # 9. Export GLB
    os.makedirs(OUT_DIR, exist_ok=True)
    out_path = os.path.join(OUT_DIR, f"{SLUG}.glb")
    bpy.ops.export_scene.gltf(
        filepath        = out_path,
        use_selection   = True,
        export_format   = "GLB",
        export_apply    = False,
        export_morph    = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = "WEBP",
    )
    print(f"[mandelbulb] GLB written → {out_path}")
    return ob

build_mandelbulb_poi()
