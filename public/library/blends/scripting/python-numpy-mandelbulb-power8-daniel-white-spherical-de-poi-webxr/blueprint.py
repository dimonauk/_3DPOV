"""
Mandelbulb Power-8 Fractal — Blender 5.1 Blueprint
=====================================================
Technique: Distance Estimation (DE) sphere-tracing on a spherical UV grid.

The Mandelbulb extends the Mandelbrot iteration z → z² + c into ℝ³ by
interpreting complex multiplication as spherical-coordinate rotation:

    r_{n+1}  = r_n^power
    θ_{n+1}  = power · θ_n       (polar angle, from +Z)
    φ_{n+1}  = power · φ_n       (azimuthal angle)
    z_{n+1}  = spherical(r_{n+1}, θ_{n+1}, φ_{n+1}) + c

At power=8 (Daniel White & Paul Nylander, 2009) the fractal shows eight
radial lobes and extraordinary surface detail. This blueprint ray-marches
inward from a bounding sphere to find the isosurface via the
Douady-Hubbard-style derivative lower-bound formula (Inigo Quilez, CC0).

Trade-off note: the THETA_N × PHI_N lat-lon grid captures only the outermost
hull. Interior caves and overhangs are invisible from outside — they require
volumetric or screen-space ray-marching inside a shader, not a static mesh.
For WebXR display this outer-hull mesh is the correct first choice.
"""

# ─── Parameters ───────────────────────────────────────────────────────────────
POWER        = 8        # canonical White-Nylander order (8-lobed)
THETA_N      = 80       # latitude rings (excludes poles; poles added separately)
PHI_N        = 120      # longitude columns (wraps)
MARCH_STEPS  = 60       # radial scan steps from outside → centre
MARCH_R0     = 1.45     # outer scan radius (fractal extent ≈ 1.2 at power 8)
MARCH_RMIN   = 0.08     # inner radius guard — give up past here
DE_HIT       = 0.004    # distance threshold: surface "hit"
MAX_ITER_DE  = 18       # DE accumulation depth
BAILOUT_R    = 2.0      # escape radius for iteration
POI_SCALE    = 0.42     # scale fractal to metres for WebXR poi-head
ROOT_NAME    = "mandelbulb_poi"
ATTR_NAME    = "Mandelbulb_Depth"   # FLOAT_COLOR attribute
COBALT       = (0.06, 0.14, 0.66, 1.0)   # inner valleys
AMBER        = (0.88, 0.52, 0.04, 1.0)   # outer peaks

# ─── Imports ──────────────────────────────────────────────────────────────────
import bpy, math, os, numpy as np

# ─── Distance Estimator (vectorised) ─────────────────────────────────────────
def de_batch(pts: np.ndarray, power: int = POWER) -> np.ndarray:
    """
    Mandelbulb DE lower bound over (M, 3) array of candidate points.

    Formula (Inigo Quilez, CC0 — iquilezles.org/articles/mandelbulb):
        DE(c) = 0.5 · |z_final| · ln|z_final| / |dz_final|

    |dz| accumulates via the chain rule in spherical coordinates:
        |dz'| = power · r^(power-1) · |dz| + 1

    Why "+1": at the first iteration dz/dc = 1 (c perturbs the orbit by 1).
    Subsequent iterations multiply by the Jacobian power·r^(power-1).

    Returns: (M,) float array.  Positive → outside; negative → interior.
    """
    x  = pts[:, 0].copy();  y  = pts[:, 1].copy();  z  = pts[:, 2].copy()
    cx = pts[:, 0].copy();  cy = pts[:, 1].copy();  cz = pts[:, 2].copy()
    dr  = np.ones(len(pts), dtype=np.float64)
    esc = np.zeros(len(pts), dtype=bool)

    for _ in range(MAX_ITER_DE):
        r2  = x*x + y*y + z*z
        esc |= (r2 > BAILOUT_R * BAILOUT_R)
        act  = ~esc
        if not act.any():
            break
        ra  = np.sqrt(r2[act])
        dr[act] = power * ra ** (power - 1) * dr[act] + 1.0
        th  = np.arctan2(np.sqrt(x[act]**2 + y[act]**2), z[act])
        ph  = np.arctan2(y[act], x[act])
        rn  = ra ** power
        x[act] = rn * np.sin(power * th) * np.cos(power * ph) + cx[act]
        y[act] = rn * np.sin(power * th) * np.sin(power * ph) + cy[act]
        z[act] = rn * np.cos(power * th)                       + cz[act]

    r_f = np.sqrt(x*x + y*y + z*z)
    return np.where(
        esc,
        0.5 * np.log(np.maximum(r_f, 1e-12)) * r_f / np.maximum(dr, 1e-12),
        -DE_HIT,   # interior sentinel: negative
    )


# ─── Surface scanner ──────────────────────────────────────────────────────────
def scan_surface(power: int = POWER):
    """
    Radial scan from MARCH_R0 → MARCH_RMIN along each (θ, φ) direction.
    Records the radius of first DE < DE_HIT hit per ray.

    Returns
    -------
    pos   : (THETA_N, PHI_N, 3)  surface positions in unit fractal coords
    t_dep : (THETA_N, PHI_N)     depth cue ∈ [0,1], 0=inner / 1=outer
    """
    # Exclude exact poles (θ=0, θ=π) to avoid degenerate quads
    th = np.linspace(0, math.pi, THETA_N + 2)[1:-1]
    ph = np.linspace(0, 2 * math.pi, PHI_N, endpoint=False)
    TH, PH = np.meshgrid(th, ph, indexing='ij')      # (T, P)
    dirs = np.stack([
        np.sin(TH) * np.cos(PH),
        np.sin(TH) * np.sin(PH),
        np.cos(TH),
    ], axis=-1)                                        # (T, P, 3)
    flat = dirs.reshape(-1, 3)                         # (T*P, 3)

    radii  = np.linspace(MARCH_R0, MARCH_RMIN, MARCH_STEPS)
    hit_r  = np.full(len(flat), MARCH_RMIN)
    hit_ok = np.zeros(len(flat), dtype=bool)

    for r in radii:
        still = ~hit_ok
        if not still.any():
            break
        de = de_batch(flat[still] * r, power)
        new_idx = np.where(still)[0][de < DE_HIT]
        hit_r[new_idx]  = r
        hit_ok[new_idx] = True

    positions = flat * hit_r[:, None]
    t_depth   = (hit_r - MARCH_RMIN) / (MARCH_R0 - MARCH_RMIN)
    return positions.reshape(THETA_N, PHI_N, 3), t_depth.reshape(THETA_N, PHI_N)


# ─── Mesh builder ────────────────────────────────────────────────────────────
def build_mesh(pos: np.ndarray, name: str) -> bpy.types.Mesh:
    """lat-lon quad mesh from (THETA_N, PHI_N, 3) surface positions."""
    verts = (pos * POI_SCALE).reshape(-1, 3).tolist()
    faces = []
    for i in range(THETA_N - 1):
        for j in range(PHI_N):
            a = i * PHI_N + j
            b = i * PHI_N + (j + 1) % PHI_N
            c = (i + 1) * PHI_N + (j + 1) % PHI_N
            d = (i + 1) * PHI_N + j
            faces.append((a, b, c, d))
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    return me


# ─── Vertex colour ────────────────────────────────────────────────────────────
def apply_depth_colour(me: bpy.types.Mesh, t: np.ndarray) -> None:
    """FLOAT_COLOR POINT: cobalt (inner) → amber (outer) by surface radius."""
    attr  = me.attributes.new(name=ATTR_NAME, type='FLOAT_COLOR', domain='POINT')
    t_f   = np.clip(t.ravel(), 0, 1).astype(np.float32)
    co    = np.array(COBALT, dtype=np.float32)
    am    = np.array(AMBER,  dtype=np.float32)
    rgba  = co[None, :] * (1 - t_f[:, None]) + am[None, :] * t_f[:, None]
    attr.data.foreach_set('color', rgba.ravel())


# ─── Material ─────────────────────────────────────────────────────────────────
def make_material() -> bpy.types.Material:
    mat = bpy.data.materials.new(ROOT_NAME)
    mat.use_nodes = True
    nt  = mat.node_tree;  nd = nt.nodes;  lk = nt.links
    nd.clear()
    out  = nd.new('ShaderNodeOutputMaterial')
    bsdf = nd.new('ShaderNodeBsdfPrincipled')
    att  = nd.new('ShaderNodeAttribute')
    att.attribute_name  = ATTR_NAME
    att.attribute_type  = 'GEOMETRY'
    bsdf.inputs['Metallic'].default_value          = 0.55
    bsdf.inputs['Roughness'].default_value         = 0.22
    bsdf.inputs['Emission Strength'].default_value = 1.6
    lk.new(att.outputs['Color'], bsdf.inputs['Base Color'])
    lk.new(att.outputs['Color'], bsdf.inputs['Emission Color'])
    lk.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat


# ─── Main build ───────────────────────────────────────────────────────────────
for ob in list(bpy.data.objects):
    if ob.name.startswith(ROOT_NAME):
        bpy.data.objects.remove(ob, do_unlink=True)
for me in list(bpy.data.meshes):
    if me.name.startswith(ROOT_NAME):
        bpy.data.meshes.remove(me)

print(f"[Mandelbulb] scanning power-{POWER} surface ({THETA_N}×{PHI_N} rays, {MARCH_STEPS} steps)…")
pos8, t8 = scan_surface(POWER)

me = build_mesh(pos8, ROOT_NAME)
ob = bpy.data.objects.new(ROOT_NAME, me)
bpy.context.scene.collection.objects.link(ob)
apply_depth_colour(me, t8)
me.materials.append(make_material())

# holoflow metadata
ob['holoflow:facet']    = True
ob['holoflow:category'] = 'poi-head'
ob['holoflow:topic']    = 'mandelbulb-power8'

# Shape keys — power 6 and power 4 variants
ob.shape_key_add(name='Basis')
for sk_pow, sk_name in [(6, 'SK_Power6'), (4, 'SK_Power4')]:
    print(f"[Mandelbulb] scanning power-{sk_pow} surface for {sk_name}…")
    pos_sk, _ = scan_surface(sk_pow)
    sk = ob.shape_key_add(name=sk_name)
    co = (pos_sk.reshape(-1, 3) * POI_SCALE).ravel().astype(np.float32)
    sk.data.foreach_set('co', co)

# +Y up for WebXR export
ob.rotation_euler = (math.pi / 2, 0, 0)
bpy.ops.object.select_all(action='DESELECT')
ob.select_set(True)
bpy.context.view_layer.objects.active = ob
bpy.ops.object.transform_apply(rotation=True)

# Export GLB
SLUG = "python-numpy-mandelbulb-power8-daniel-white-spherical-de-poi-webxr"
glb_dir = os.path.join(
    os.path.dirname(bpy.data.filepath) or os.getcwd(),
    "public", "library", "glbs", "scripting", SLUG,
)
os.makedirs(glb_dir, exist_ok=True)
glb_path = os.path.join(glb_dir, "mandelbulb_poi.glb")
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
print(f"[Mandelbulb] → {glb_path}")
