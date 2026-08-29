"""
Mandelbox Fractal — Blender 5.1 Blueprint
==========================================
Technique: box-fold / ball-fold iterated map with derivative-tracked distance
estimation, radial-scan hull extraction, lat-lon quad mesh.

The Mandelbox (Tom Lowe, 2010) replaces the Mandelbulb's spherical-coordinate
power law with two Cartesian fold operations applied each iteration:

  1. boxFold — each axis component is reflected about ±FOLD:
               if  v > FOLD:  v ← 2·FOLD − v
               if  v < −FOLD: v ← −2·FOLD − v
               (a piecewise-linear "tent" map; preserves derivative magnitude)

  2. ballFold — the full vector is scaled by fixedR²/r², analogous to inversion
               in a sphere of radius MAX_R, then clamped near the origin:
               if |z|² < MIN_R²: z ← z · (MAX_R²/MIN_R²)  [inner amplification]
               elif |z|² < MAX_R²: z ← z · (MAX_R²/|z|²)  [inversion sphere]
               else:              z unchanged               [outer identity]

  3. z ← scale · z + c   (c = the test point; scale is the key free parameter)

The cubic symmetry of boxFold (it reflects each axis independently) means the
Mandelbox has octahedral symmetry rather than the Mandelbulb's approximate
spherical symmetry.  At scale ≈ −1.5, the boundary looks like a coral reef or
Gothic cathedral; at scale ≈ −2.0 the spines lengthen dramatically.

Distance estimation uses the chain-rule derivative magnitude (Hubbard-Douady,
adapted for Mandelbox by Knighty / Syntopia):
    dr ← |ballFoldFactor| · dr · |scale| + 1   (after each z update)
    DE(c) = |z_escape| / dr_escape              (lower bound, positive outside)
"""

# ─── Parameters ───────────────────────────────────────────────────────────────
SCALE_BASIS = -1.5   # classic Tom Lowe 2010 parameter
SCALE_SK2   = -2.0   # shape-key 2: longer dendritic spines
SCALE_SK125 = -1.25  # shape-key 3: compact, rounder boundary
FOLD        =  1.0   # boxFold half-width (clamp threshold)
MIN_R       =  0.5   # ballFold inner radius (r < MIN_R → amplify)
MAX_R       =  1.0   # ballFold fixed radius (inversion sphere)
MAX_ITER    =  20    # orbit cap before treating point as interior
BAILOUT     = 100.0  # escape radius (Mandelbox stays ~<2.5 at scale=-1.5)
DE_HIT      =  0.010 # DE threshold: orbit counted as "on surface"
THETA_N     =  80    # latitude rings on spherical UV grid
PHI_N       = 120    # longitude columns (wraps)
MARCH_R0    =  2.8   # outer scan radius (safely outside set in all directions)
MARCH_RMIN  =  0.08  # inner scan guard
MARCH_STEPS =  55    # radial steps per ray
POI_SCALE   =  0.42  # scale fractal extent to poi radius in metres
ROOT_NAME   = "mandelbox_poi"
ATTR_NAME   = "Mandelbox_DE"     # FLOAT_COLOR vertex attribute
COBALT      = (0.06, 0.14, 0.66, 1.0)  # fine-grained interior boundary
AMBER       = (0.88, 0.52, 0.04, 1.0)  # outer hull peaks

import bpy, math, os
import numpy as np

# ─── Distance estimator ──────────────────────────────────────────────────────
def de_mandelbox(pts: np.ndarray, scale: float) -> np.ndarray:
    """
    Mandelbox DE lower bound for an (M, 3) array of candidate points.

    All M points are processed simultaneously (vectorised NumPy).
    Escaped points get  DE = |z_final| / |dr_final|  (positive → outside).
    Non-escaped points get −DE_HIT (interior sentinel; will be treated as hull
    in the radial scan only if they're encountered deep inside, which shouldn't
    happen if MARCH_R0 is safely outside the set).

    WHY ballFoldFactor affects dr: the sphere fold is a smooth, nonlinear map
    whose Jacobian ∂(fold(z))/∂z has magnitude equal to the scalar factor f.
    Chain rule: d(f·z)/dz = f · I (scalar factor times identity).  The box
    fold's Jacobian is ±I (reflection) so its magnitude is always 1 — it
    contributes nothing to |dr|.
    """
    cx = pts[:, 0].copy(); cy = pts[:, 1].copy(); cz = pts[:, 2].copy()
    zx = np.zeros_like(cx); zy = np.zeros_like(cy); zz = np.zeros_like(cz)
    dr = np.ones(len(pts), dtype=np.float64)
    esc = np.zeros(len(pts), dtype=bool)
    bail2 = BAILOUT * BAILOUT
    mn2 = MIN_R * MIN_R;  mx2 = MAX_R * MAX_R

    for _ in range(MAX_ITER):
        # ① boxFold — component-wise tent reflect (no dr contribution)
        zx[:] = np.where(zx > FOLD, 2*FOLD - zx, np.where(zx < -FOLD, -2*FOLD - zx, zx))
        zy[:] = np.where(zy > FOLD, 2*FOLD - zy, np.where(zy < -FOLD, -2*FOLD - zy, zy))
        zz[:] = np.where(zz > FOLD, 2*FOLD - zz, np.where(zz < -FOLD, -2*FOLD - zz, zz))

        # ② ballFold — scalar per-point factor, tracks Jacobian magnitude
        r2 = zx*zx + zy*zy + zz*zz
        f  = np.where(r2 < mn2,
                      mx2 / mn2,           # inner: amplify by MAX_R²/MIN_R² = 4
                      np.where(r2 < mx2,
                               mx2 / np.maximum(r2, 1e-30),   # inversion
                               1.0))                           # outer: identity
        zx *= f;  zy *= f;  zz *= f
        dr  = dr * f   # Jacobian accumulation (before scale)

        # ③ affine step:  z ← scale·z + c,  dr ← |scale|·dr + 1
        zx = scale * zx + cx
        zy = scale * zy + cy
        zz = scale * zz + cz
        dr = np.abs(scale) * dr + 1.0

        # escape check
        r2 = zx*zx + zy*zy + zz*zz
        esc |= (r2 > bail2)

    r_f = np.sqrt(np.maximum(zx*zx + zy*zy + zz*zz, 1e-30))
    return np.where(esc, r_f / np.maximum(dr, 1e-30), -DE_HIT)


# ─── Hull scanner ────────────────────────────────────────────────────────────
def scan_hull(scale: float) -> tuple:
    """
    Radial scan from MARCH_R0 → MARCH_RMIN along each (θ, φ) direction.

    The Mandelbox is star-shaped from the origin for scale values near −1.5
    (any inward ray from |c|=MARCH_R0 crosses the fractal boundary once).
    Corner directions extend further, which is why MARCH_R0=2.8 is used.

    Returns
    -------
    pos   : (THETA_N, PHI_N, 3)  surface positions in fractal coordinates
    t_col : (THETA_N, PHI_N)     normalised depth cue ∈ [0,1] for colour
    """
    th = np.linspace(0, math.pi, THETA_N + 2)[1:-1]   # exclude exact poles
    ph = np.linspace(0, 2 * math.pi, PHI_N, endpoint=False)
    TH, PH = np.meshgrid(th, ph, indexing='ij')        # (THETA_N, PHI_N)
    dirs = np.stack([
        np.sin(TH) * np.cos(PH),
        np.sin(TH) * np.sin(PH),
        np.cos(TH),
    ], axis=-1)                                         # (THETA_N, PHI_N, 3)
    flat = dirs.reshape(-1, 3)                          # (THETA_N*PHI_N, 3)

    radii  = np.linspace(MARCH_R0, MARCH_RMIN, MARCH_STEPS)
    hit_r  = np.full(len(flat), MARCH_RMIN)
    hit_ok = np.zeros(len(flat), dtype=bool)

    for r in radii:
        still = ~hit_ok
        if not still.any():
            break
        de = de_mandelbox(flat[still] * r, scale)
        new = de < DE_HIT
        idx = np.where(still)[0][new]
        hit_r[idx]  = r
        hit_ok[idx] = True

    pos   = flat * hit_r[:, None]
    t_col = (hit_r - MARCH_RMIN) / (MARCH_R0 - MARCH_RMIN)  # 0=deep, 1=outer
    return pos.reshape(THETA_N, PHI_N, 3), t_col.reshape(THETA_N, PHI_N)


# ─── Mesh + quad topology ────────────────────────────────────────────────────
def build_mesh(pos: np.ndarray, name: str) -> bpy.types.Mesh:
    """Lat-lon quad mesh from (THETA_N, PHI_N, 3) surface positions."""
    verts = (pos * POI_SCALE).reshape(-1, 3).tolist()
    faces = []
    for i in range(THETA_N - 1):
        for j in range(PHI_N):
            a = i * PHI_N + j
            b = i * PHI_N + (j + 1) % PHI_N
            c = (i + 1) * PHI_N + (j + 1) % PHI_N
            d = (i + 1) * PHI_N + j
            faces.append((a, b, c, d))    # winding: consistent outward normal
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    return me


# ─── Vertex colour ────────────────────────────────────────────────────────────
def apply_colour(me: bpy.types.Mesh, t: np.ndarray) -> None:
    """
    FLOAT_COLOR POINT attribute: cobalt (inner, fine-grained boundary) →
    amber (outer, broad features).  The gradient encodes surface depth:
    deep-inward verts correspond to early-hit rays (short march = small hit_r
    = t_col ≈ 0 = cobalt); outer verts correspond to late-hit rays (large hit_r
    = t_col ≈ 1 = amber).
    """
    attr = me.attributes.new(name=ATTR_NAME, type='FLOAT_COLOR', domain='POINT')
    t_f  = np.clip(t.ravel(), 0, 1).astype(np.float32)
    co   = np.array(COBALT, dtype=np.float32)
    am   = np.array(AMBER,  dtype=np.float32)
    rgba = co[None, :] * (1 - t_f[:, None]) + am[None, :] * t_f[:, None]
    attr.data.foreach_set('color', rgba.ravel())


# ─── Material ─────────────────────────────────────────────────────────────────
def make_mat() -> bpy.types.Material:
    mat = bpy.data.materials.new(ROOT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree;  nd = nt.nodes;  lk = nt.links
    nd.clear()
    out  = nd.new('ShaderNodeOutputMaterial')
    bsdf = nd.new('ShaderNodeBsdfPrincipled')
    att  = nd.new('ShaderNodeAttribute')
    att.attribute_name = ATTR_NAME;  att.attribute_type = 'GEOMETRY'
    bsdf.inputs['Metallic'].default_value          = 0.65
    bsdf.inputs['Roughness'].default_value         = 0.18
    bsdf.inputs['Emission Strength'].default_value = 1.8
    lk.new(att.outputs['Color'], bsdf.inputs['Base Color'])
    lk.new(att.outputs['Color'], bsdf.inputs['Emission Color'])
    lk.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat


# ─── Main ─────────────────────────────────────────────────────────────────────
for ob in list(bpy.data.objects):
    if ob.name.startswith(ROOT_NAME):
        bpy.data.objects.remove(ob, do_unlink=True)
for me in list(bpy.data.meshes):
    if me.name.startswith(ROOT_NAME):
        bpy.data.meshes.remove(me)

print("[Mandelbox] scanning Basis surface (scale=−1.5)…")
pos_b, t_b = scan_hull(SCALE_BASIS)

me = build_mesh(pos_b, ROOT_NAME)
ob = bpy.data.objects.new(ROOT_NAME, me)
bpy.context.scene.collection.objects.link(ob)
apply_colour(me, t_b)
me.materials.append(make_mat())

# Holoflow metadata (WebXR export pipeline)
ob['holoflow:facet']    = True
ob['holoflow:category'] = 'poi-head'
ob['holoflow:topic']    = 'mandelbox-scale-1-5'

# Basis shape key
ob.shape_key_add(name='Basis')

# Shape key: scale=−2.0 (longer spines, more complex boundary)
print("[Mandelbox] scanning SK_Scale2 (scale=−2.0)…")
pos_s2, _ = scan_hull(SCALE_SK2)
sk2 = ob.shape_key_add(name='SK_Scale2')
sk2.data.foreach_set('co', (pos_s2.reshape(-1, 3) * POI_SCALE).ravel().astype(np.float32))

# Shape key: scale=−1.25 (compact, rounded boundary)
print("[Mandelbox] scanning SK_Scale125 (scale=−1.25)…")
pos_s125, _ = scan_hull(SCALE_SK125)
sk125 = ob.shape_key_add(name='SK_Scale125')
sk125.data.foreach_set('co', (pos_s125.reshape(-1, 3) * POI_SCALE).ravel().astype(np.float32))

# shade_flat — each quad reads as a planar facet (studio standard)
bpy.ops.object.select_all(action='DESELECT')
ob.select_set(True)
bpy.context.view_layer.objects.active = ob
bpy.ops.object.shade_flat()

# +Y-up: rotate 90° X → apply (WebXR convention)
ob.rotation_euler = (math.pi / 2, 0, 0)
bpy.ops.object.transform_apply(rotation=True)

# GLB export
SLUG    = "python-numpy-mandelbox-box-fold-ball-fold-lowe-2010-fractal-de-poi-head-webxr"
glb_dir = os.path.join(
    os.path.dirname(bpy.data.filepath) or os.getcwd(),
    "public", "library", "glbs", "scripting", SLUG,
)
os.makedirs(glb_dir, exist_ok=True)
glb_path = os.path.join(glb_dir, "mandelbox_poi.glb")
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    use_selection=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_morph=True,
    export_colors=True,
    export_yup=True,
    export_skins=False,
    export_animations=False,
)
print(f"[Mandelbox] → {glb_path}")
