"""
blueprint.py — Möbius Transformation Gallery: PSL(2,ℂ) & Loxodromic Spirals
Blender 5.1 · Python 3.11 · CC0

A Möbius transformation is any map f(w) = (aw + b)/(cw + d) with a,b,c,d ∈ ℂ,
ad − bc ≠ 0.  The group PSL(2,ℂ) = SL(2,ℂ)/{±I} acts on ℂ∪{∞} (the Riemann
sphere) and, via stereographic projection, on S² itself.  Every non-identity
element falls into exactly one conjugacy class — elliptic, hyperbolic, parabolic,
or loxodromic — determined by tr(M)²:

    tr² ∈ [0, 4) real   → elliptic   (rotation-like, two conjugate fixed pts on S²)
    tr² ∈ (4, ∞) real   → hyperbolic (pure scaling, two real fixed pts)
    tr² = 4              → parabolic  (one fixed pt, tangent vector preserved)
    tr² ∈ ℂ \ [0, ∞)    → loxodromic (rotation + scaling combined)

The LOXODROMIC case is visually richest: its orbits are logarithmic spirals on
S², converging at one fixed point and diverging from the other.  Choosing fixed
points at the poles and parameterising the family f_t(w) = λ^t · w  (λ ∈ ℂ,
|λ| > 1, arg(λ) ≠ 0) gives orbits that simultaneously spiral and drift —
identical in character to the path a poi light traces on the sphere of its
reachable positions during a corkscrew spin.

Outside sources
---------------
Henri Poincaré (1882) "Théorie des groupes fuchsiens". Public Domain.
    https://archive.org/details/actamathematica01stockholmgoog
    Related: https://en.wikipedia.org/wiki/Möbius_transformation

David Mumford, Caroline Series, David Wright (2002) "Indra's Pearls". CC0 preview.
    https://archive.org/details/indraspearlsthev0000mumf
    Related: https://github.com/jfb3615/ACP-Examples (MIT)

Run inside Blender ≥ 5.1:
    blender --python blueprint.py
"""

import bpy, bmesh, numpy as np, math, colorsys

# ── Named constants ───────────────────────────────────────────────────────────
SLUG        = "hf_mobius"
# Sphere backdrop
SPHERE_SEG  = 32          # longitude divisions (UV sphere)
SPHERE_RNG  = 24          # latitude rings
SPHERE_R    = 1.0         # radius
# Loxodromic family: f_t(w) = λ^t · w, λ = exp(LOG_R + i·ALPHA)
LOG_R       = 0.55        # Re(log λ): drift rate — |λ^t| = e^(LOG_R·t)
ALPHA       = math.pi / 5 # Im(log λ): rotation — 36° per unit t
# Orbit sampling
N_ORBITS    = 72          # curves on the sphere surface
T_MIN       = -2.8        # parameter start (near south pole)
T_MAX       = 2.8         # parameter end   (near north pole)
T_STEPS     = 64          # points per NURBS orbit
POLE_GUARD  = 0.98        # |z_sphere| must be < POLE_GUARD (clip near infinity)
BEVEL_DIM   = 0.0035      # tube radius for orbit curves
BEVEL_THICK = 0.008       # tube radius for every 8th "guide" orbit
# Shape key labels for the four conjugacy classes
SK_LABELS   = [("elliptic",   0.0,  math.pi / 2),    # pure rotation (LOG_R=0)
               ("hyperbolic", 0.7,  0.0),             # pure scaling  (ALPHA=0)
               ("loxodromic", LOG_R, ALPHA)]           # the main family
# Export
EXPORT_GLB  = "//hf_mobius_loxodromic.glb"
OBJ_SPHERE  = "hf_mobius_sphere"

# ── Stereographic projection (from north pole) ────────────────────────────────

def stereo_fwd(pts: np.ndarray) -> tuple:
    """S² → ℂ: (N,3) xyz → (N,) u, (N,) v.  North-pole pts yield (nan, nan)."""
    denom = 1.0 - pts[:, 2]
    mask  = np.abs(denom) < 1e-7
    denom = np.where(mask, 1.0, denom)   # avoid /0; masked values set to nan below
    u = np.where(mask, np.nan, pts[:, 0] / denom)
    v = np.where(mask, np.nan, pts[:, 1] / denom)
    return u, v

def stereo_inv(u: np.ndarray, v: np.ndarray) -> np.ndarray:
    """ℂ → S²: (N,) u, (N,) v → (N,3) xyz."""
    r2    = u ** 2 + v ** 2
    denom = r2 + 1.0
    return np.column_stack([2 * u / denom, 2 * v / denom, (r2 - 1.0) / denom])

# ── Loxodromic one-parameter family ──────────────────────────────────────────

def loxo_apply(u: np.ndarray, v: np.ndarray, t: float,
               log_r: float = LOG_R, alpha: float = ALPHA) -> tuple:
    """Complex multiplication by λ^t = exp((log_r + i·alpha)·t).
    w → w · e^{(log_r + iα)t}  ≡  rotate-then-scale in the complex plane.
    WHY complex multiplication? Because f_t(w) = λ^t w, and λ^t = e^{log(λ)·t}.
    """
    scale  = math.exp(log_r * t)
    angle  = alpha * t
    cos_a, sin_a = math.cos(angle), math.sin(angle)
    u2 = scale * (cos_a * u - sin_a * v)
    v2 = scale * (cos_a * v + sin_a * u)
    return u2, v2

# ── Scene teardown ────────────────────────────────────────────────────────────

def purge_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for blk in list(bpy.data.meshes):   bpy.data.meshes.remove(blk)
    for blk in list(bpy.data.curves):   bpy.data.curves.remove(blk)
    for blk in list(bpy.data.materials): bpy.data.materials.remove(blk)

# ── Build Riemann sphere with shape keys ──────────────────────────────────────

def build_sphere():
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=SPHERE_SEG, v_segments=SPHERE_RNG,
                               radius=SPHERE_R)
    me = bpy.data.meshes.new(OBJ_SPHERE)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(OBJ_SPHERE, me)
    bpy.context.collection.objects.link(ob)

    # Basis shape key (identity)
    ob.shape_key_add(name='Basis', from_mix=False)
    n_v = len(me.vertices)
    basis = np.empty(n_v * 3, dtype=np.float64)
    me.vertices.foreach_get('co', basis)
    pts0 = basis.reshape(n_v, 3)

    # Three conjugacy-class shape keys
    for label, lr, al in SK_LABELS:
        sk = ob.shape_key_add(name=label, from_mix=False)
        u, v = stereo_fwd(pts0)
        valid = ~np.isnan(u) & (np.abs(pts0[:, 2]) < POLE_GUARD)
        new_pts = pts0.copy()
        if np.any(valid):
            u2, v2 = loxo_apply(u[valid], v[valid], 1.0, log_r=lr, alpha=al)
            # Renormalise back to unit sphere (Möbius maps circles to circles,
            # so all transformed points are already on S² — renorm is numerical cleanup)
            sph = stereo_inv(u2, v2)
            new_pts[valid] = sph / np.linalg.norm(sph, axis=1, keepdims=True)
        sk.data.foreach_set('co', new_pts.ravel())

    # Pale blue-grey glass material
    mat = bpy.data.materials.new("mobius_sphere")
    mat.use_nodes = True
    mat.blend_method = 'BLEND'
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value   = (0.62, 0.76, 0.90, 1.0)
    bsdf.inputs["Metallic"].default_value     = 0.0
    bsdf.inputs["Roughness"].default_value    = 0.05
    bsdf.inputs["Transmission Weight"].default_value = 0.85
    bsdf.inputs["Alpha"].default_value        = 0.18
    ob.data.materials.append(mat)
    return ob

# ── Build logarithmic spiral orbit curves ─────────────────────────────────────

def build_orbits():
    """72 NURBS tubes, one per starting longitude.

    Each orbit starts at the equator (t=0, |w|=1 in stereographic coords),
    then the loxodromic map f_t carries it:
      - t < 0 → spirals toward south pole  (pole at w=0, z_sphere=-1)
      - t > 0 → spirals toward north pole  (pole at w=∞, z_sphere=+1)
    Because log_r > 0, orbits converge at the north pole as t→+∞.
    """
    t_vals = np.linspace(T_MIN, T_MAX, T_STEPS)
    coll   = bpy.data.collections.new("MobiusOrbits")
    bpy.context.scene.collection.children.link(coll)

    for k in range(N_ORBITS):
        lon0 = 2.0 * math.pi * k / N_ORBITS
        # Start on unit circle |w|=1 (equator under north-pole stereographic)
        u0, v0 = math.cos(lon0), math.sin(lon0)

        pts3d = []
        for t in t_vals:
            u, v = loxo_apply(np.array([u0]), np.array([v0]), t)
            r_sq = u[0]**2 + v[0]**2
            # Skip if outside visible globe (very near pole)
            z_sph = (r_sq - 1.0) / (r_sq + 1.0)
            if abs(z_sph) > POLE_GUARD:
                continue
            pts3d.append(stereo_inv(u, v)[0])

        if len(pts3d) < 4:
            continue

        # Build NURBS-4 spline
        crv = bpy.data.curves.new(f'orbit_{k:03d}', 'CURVE')
        crv.dimensions  = '3D'
        # Every 8th orbit is a thicker "guide" orbit (visual hierarchy)
        crv.bevel_depth = BEVEL_THICK if k % 8 == 0 else BEVEL_DIM
        crv.bevel_resolution = 2

        spl = crv.splines.new('NURBS')
        spl.points.add(len(pts3d) - 1)
        for i, p in enumerate(pts3d):
            spl.points[i].co = (p[0], p[1], p[2], 1.0)
        spl.use_endpoint_u = True
        spl.order_u = 4      # cubic NURBS

        ob_c = bpy.data.objects.new(f'orbit_{k:03d}', crv)
        coll.objects.link(ob_c)

        # Emissive material: hue sweeps full spectrum around the sphere
        hue = k / N_ORBITS
        r, g, b = colorsys.hsv_to_rgb(hue, 0.85, 1.0)
        mat = bpy.data.materials.new(f'orbit_mat_{k:03d}')
        mat.use_nodes = True
        mat.node_tree.nodes.clear()
        em   = mat.node_tree.nodes.new('ShaderNodeEmission')
        out  = mat.node_tree.nodes.new('ShaderNodeOutputMaterial')
        em.inputs['Color'].default_value    = (r, g, b, 1.0)
        em.inputs['Strength'].default_value = 4.5
        mat.node_tree.links.new(em.outputs['Emission'], out.inputs['Surface'])
        ob_c.data.materials.append(mat)

    return coll

# ── Camera + lighting ─────────────────────────────────────────────────────────

def setup_camera():
    bpy.ops.object.camera_add(location=(0, -3.8, 0.6))
    cam = bpy.context.object
    cam.rotation_euler = (math.radians(80), 0, 0)
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type='SUN', location=(3, -3, 5))
    sun = bpy.context.object
    sun.data.energy = 2.5

# ── Export GLB ────────────────────────────────────────────────────────────────

def export_glb():
    # Convert curves to meshes during export; apply all transforms for +Y-up
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_GLB,
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    print(f"[holoflow] Exported: {EXPORT_GLB}")

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    purge_scene()
    build_sphere()
    build_orbits()
    setup_camera()

    # EEVEE bloom for emissive glow
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'
    bpy.context.scene.eevee.use_bloom     = True
    bpy.context.scene.eevee.bloom_radius  = 3.5
    bpy.context.scene.eevee.bloom_intensity = 0.6

    bpy.ops.wm.save_as_mainfile(filepath=f"//{SLUG}.blend")
    export_glb()
    print("[holoflow] Blueprint complete.")

if __name__ == "__main__":
    main()
