"""
Hopf Fibration — Holoflow Blueprint (Blender 5.1)
==================================================
TECHNIQUE  In 1931 Heinz Hopf constructed the first example of a map
S³ → S² that cannot be continuously deformed to a constant map — a
non-trivial homotopy class (π₃(S²) = ℤ).  The fibre over every point
of S² is a great circle on S³; stereographic projection of S³ → ℝ³
maps each fibre to a circle in ℝ³.  Any two distinct fibres are
*Hopf-linked*: each passes through the interior of the other exactly
once.  The fibres over a latitude circle on S² sweep out a torus in ℝ³;
the equatorial latitude produces the conformal Clifford torus (R = √2,
r = 1 in the normalised projection).

PARAMETRISATION  Write S³ ⊂ ℂ² as
  (z₁, z₂) = (cos(α)·e^{iu}, sin(α)·e^{iv}),  α = θ₀/2
where (θ₀, φ₀) ∈ S² base point, ξ fibre parameter, and
  u = ξ + φ₀/2,  v = ξ − φ₀/2.

Stereographic projection from north pole (0,0,0,1) of S³:
  X = cos(α)·cos(u) / (1 − sin(α)·sin(v))
  Y = cos(α)·sin(u) / (1 − sin(α)·sin(v))
  Z = sin(α)·cos(v) / (1 − sin(α)·sin(v))

TUBE MESH  Each fibre is a smooth closed circle in ℝ³.  A tube of
radius R_TUBE is swept along it using parallel-transport framing
(Bishop frame) — avoids the Frenet twist discontinuity at inflection
points and keeps the cross-section aligned with the poi axis.

SHAPE KEYS  Three latitude samplings demonstrate how the fibres fill
space: equatorial band (Clifford torus) → upper hemisphere → full
sphere.  Shape keys are absolute (from_mix=False).

POI BALL  All fibres scaled to fit a sphere of diameter POI_DIAM.
Vertex colour encodes the latitude band; emission material.
"""

import bpy, bmesh, math, numpy as np
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
SLUG       = "hf_hopf"
N_LAT      = 6     # latitude bands on S² per shape key
N_LON      = 10    # fibres per latitude band
N_FIBER    = 24    # sample points around each fibre circle
N_TUBE     = 8     # cross-section polygon sides (octagon tube)
R_TUBE     = 0.003 # tube radius (metres) — visible at poi scale
POI_DIAM   = 0.10  # 10 cm diameter poi ball
EMIT_STR   = 3.0
COL_LAYER  = "HopfBand"
MAT_NAME   = "HoloHopf"

# Three latitude configs for basis / shape-key variants
# Each is a list of (N_LAT, lat_lo_frac, lat_hi_frac) (fraction of π)
VARIANTS = [
    # Basis: equatorial band, 6 bands centred near π/2
    dict(lo=0.30, hi=0.70),
    # Key "Hemisphere": upper + lower 75°
    dict(lo=0.15, hi=0.85),
    # Key "Full": near-full sphere (avoid exact poles → singularity)
    dict(lo=0.06, hi=0.94),
]

π = math.pi

# ── Utility: one Hopf fibre in ℝ³ ─────────────────────────────────────────────
def hopf_fiber(theta0: float, phi0: float, n: int = N_FIBER) -> np.ndarray:
    """Return (n, 3) float64 — fibre over (θ₀, φ₀) ∈ S² via stereo-projection."""
    xi  = np.linspace(0.0, 2*π, n, endpoint=False)
    α   = theta0 / 2.0
    u   = xi + phi0 / 2.0
    v   = xi - phi0 / 2.0
    den = 1.0 - math.sin(α) * np.sin(v)
    # clamp denominator away from zero (pathological near south-pole fibres)
    den = np.where(np.abs(den) < 1e-6, 1e-6, den)
    X   = math.cos(α) * np.cos(u) / den
    Y   = math.cos(α) * np.sin(u) / den
    Z   = math.sin(α) * np.cos(v) / den
    return np.stack([X, Y, Z], axis=1)

# ── Utility: Bishop-frame tube around a closed polyline ───────────────────────
def tube_verts_faces(path: np.ndarray, r: float, k: int):
    """Parallel-transport (Bishop) tube.  path is (N,3) closed curve."""
    N    = len(path)
    tang = (np.roll(path, -1, axis=0) - np.roll(path, 1, axis=0))
    norm = np.linalg.norm(tang, axis=1, keepdims=True)
    norm = np.where(norm < 1e-12, 1.0, norm)
    tang /= norm

    # Seed normal: orthogonal to first tangent
    t0  = tang[0]
    ref = np.array([0.0, 0.0, 1.0]) if abs(t0[2]) < 0.9 else np.array([1.0, 0.0, 0.0])
    n0  = ref - np.dot(ref, t0) * t0
    n0 /= np.linalg.norm(n0)

    normals = np.empty((N, 3))
    normals[0] = n0
    for i in range(1, N):               # parallel transport step
        proj = normals[i-1] - np.dot(normals[i-1], tang[i]) * tang[i]
        ln   = np.linalg.norm(proj)
        normals[i] = proj / ln if ln > 1e-12 else normals[i-1]

    s_ang = np.linspace(0.0, 2*π, k, endpoint=False)
    verts = []
    for i in range(N):
        b = np.cross(tang[i], normals[i])
        for s in s_ang:
            verts.append(path[i] + r*(math.cos(s)*normals[i] + math.sin(s)*b))

    faces = []
    for i in range(N):
        ni = (i + 1) % N
        for j in range(k):
            nj = (j + 1) % k
            faces.append([i*k+j, ni*k+j, ni*k+nj, i*k+nj])
    return np.array(verts, dtype=np.float32), faces

# ── Geometry builder for one variant ──────────────────────────────────────────
def build_variant(lo_frac: float, hi_frac: float):
    """Return (verts_np, faces, band_indices) for N_LAT bands."""
    lats = np.linspace(lo_frac*π, hi_frac*π, N_LAT)
    lons = np.linspace(0.0, 2*π, N_LON, endpoint=False)

    all_v, all_f, all_band = [], [], []
    offset = 0
    for ith, th in enumerate(lats):
        for ph in lons:
            fiber = hopf_fiber(th, ph, N_FIBER)
            tv, tf = tube_verts_faces(fiber, R_TUBE, N_TUBE)
            all_v.append(tv)
            all_f.extend([[idx + offset for idx in face] for face in tf])
            all_band.extend([ith] * len(tv))
            offset += len(tv)
    return np.concatenate(all_v, axis=0), all_f, np.array(all_band)

# ── Normalise to POI_DIAM ──────────────────────────────────────────────────────
def normalise(verts: np.ndarray) -> np.ndarray:
    r_max = np.max(np.linalg.norm(verts, axis=1))
    return verts * (POI_DIAM / 2.0) / r_max if r_max > 1e-9 else verts

# ── Scene setup ───────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.objects):
    for item in list(blk):
        blk.remove(item, do_unlink=True)

# ── Build basis geometry (variant 0: equatorial band) ─────────────────────────
v0, f0, band0 = build_variant(**VARIANTS[0])
v0_norm = normalise(v0)

me = bpy.data.meshes.new(SLUG)
me.from_pydata(v0_norm.tolist(), [], f0)
me.update()
obj = bpy.data.objects.new(SLUG, me)
bpy.context.scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj

# ── Vertex colour (latitude band → cool-to-warm gradient) ──────────────────────
attr = me.color_attributes.new(COL_LAYER, 'FLOAT_COLOR', 'POINT')
# Hue: 0.65 (violet) → 0.10 (orange) as band index increases
palette = []
for ith in range(N_LAT):
    t = ith / max(N_LAT - 1, 1)
    h = 0.65 - t * 0.55   # violet(0.65) … orange(0.10)
    r, g, b = [x for x in (
        abs(h*6-3)-1, 2-abs(h*6-2), 2-abs(h*6-4))]
    r, g, b = max(0.0, min(1.0, r)), max(0.0, min(1.0, g)), max(0.0, min(1.0, b))
    palette.append((r, g, b, 1.0))
flat_cols = []
for idx in band0:
    flat_cols.extend(palette[idx])
attr.data.foreach_set('color', flat_cols)

# ── Material: emission driven by vertex colour ─────────────────────────────────
mat = bpy.data.materials.new(MAT_NAME)
mat.use_nodes = True
nodes, links = mat.node_tree.nodes, mat.node_tree.links
nodes.clear()
attr_n = nodes.new('ShaderNodeAttribute'); attr_n.attribute_name = COL_LAYER
emit_n = nodes.new('ShaderNodeEmission');  emit_n.inputs['Strength'].default_value = EMIT_STR
out_n  = nodes.new('ShaderNodeOutputMaterial')
links.new(attr_n.outputs['Color'], emit_n.inputs['Color'])
links.new(emit_n.outputs['Emission'], out_n.inputs['Surface'])
me.materials.append(mat)

# ── Shape keys (absolute positions for each variant) ──────────────────────────
obj.shape_key_add(name='Basis', from_mix=False)
for vi, var_name in enumerate(['Hemisphere', 'FullSphere']):
    v_i, _, _ = build_variant(**VARIANTS[vi + 1])
    v_i_norm  = normalise(v_i)
    sk = obj.shape_key_add(name=var_name, from_mix=False)
    # N_TUBE*N_FIBER*N_LON*N_LAT vertices — same count across all variants
    sk.data.foreach_set('co', v_i_norm.flatten().tolist())

# ── Export GLB ────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
out_path = bpy.path.abspath(f"//../../glbs/scripting/"
    f"python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr/"
    f"{SLUG}.glb")
bpy.ops.export_scene.gltf(
    filepath     = out_path,
    use_selection= True,
    export_format= 'GLB',
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_colors = True,
    export_morph  = True,
    export_image_format = 'WEBP',
)
print(f"[Hopf] wrote {out_path}")
