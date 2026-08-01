"""
record.py — Viewport animation render for Möbius Loxodromic Orbits.
Outputs:
    public/library/videos/scripting/
    python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr/
    viewport.mp4

Animates a slow roll so the full braid of 72 logarithmic spiral orbits is
visible from multiple angles.  The sphere uses the loxodromic shape key at
strength 0 → 1 → 0 to demonstrate the vertex migration, while the orbit
curves stay static.  12-second render, 1920×1080, EEVEE Next, 30 fps.

Run:
    blender --python record.py
"""

import bpy, bmesh, numpy as np, math, colorsys, os

# ── Constants (must match blueprint.py) ───────────────────────────────────────
LOG_R      = 0.55
ALPHA      = math.pi / 5
N_ORBITS   = 72
T_MIN      = -2.8
T_MAX      = 2.8
T_STEPS    = 64
POLE_GUARD = 0.98
BEVEL_DIM  = 0.0035
BEVEL_THICK = 0.008
OBJ_SPHERE = "hf_mobius_sphere"
SPHERE_SEG = 32
SPHERE_RNG = 24
FPS        = 30
N_FRAMES   = 360   # 12-second orbit

VIDEO_DIR  = ("//../../videos/scripting/"
              "python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr/")

# ── Copy helpers from blueprint (inline to keep record.py self-contained) ─────

def stereo_fwd(pts):
    denom = 1.0 - pts[:, 2]
    mask  = np.abs(denom) < 1e-7
    denom = np.where(mask, 1.0, denom)
    u = np.where(mask, np.nan, pts[:, 0] / denom)
    v = np.where(mask, np.nan, pts[:, 1] / denom)
    return u, v

def stereo_inv(u, v):
    r2 = u ** 2 + v ** 2
    denom = r2 + 1.0
    return np.column_stack([2 * u / denom, 2 * v / denom, (r2 - 1.0) / denom])

def loxo_apply(u, v, t, log_r=LOG_R, alpha=ALPHA):
    scale  = math.exp(log_r * t)
    cos_a, sin_a = math.cos(alpha * t), math.sin(alpha * t)
    return scale * (cos_a * u - sin_a * v), scale * (cos_a * v + sin_a * u)

def purge_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for blk in list(bpy.data.meshes):    bpy.data.meshes.remove(blk)
    for blk in list(bpy.data.curves):   bpy.data.curves.remove(blk)
    for blk in list(bpy.data.materials): bpy.data.materials.remove(blk)

# ── Build sphere ──────────────────────────────────────────────────────────────

def build_sphere():
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=SPHERE_SEG, v_segments=SPHERE_RNG,
                               radius=1.0)
    me = bpy.data.meshes.new(OBJ_SPHERE)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(OBJ_SPHERE, me)
    bpy.context.collection.objects.link(ob)
    ob.shape_key_add(name='Basis', from_mix=False)
    n_v  = len(me.vertices)
    basis = np.empty(n_v * 3, dtype=np.float64)
    me.vertices.foreach_get('co', basis)
    pts0 = basis.reshape(n_v, 3)
    sk = ob.shape_key_add(name='loxodromic', from_mix=False)
    u, v = stereo_fwd(pts0)
    valid = ~np.isnan(u) & (np.abs(pts0[:, 2]) < POLE_GUARD)
    new_pts = pts0.copy()
    if np.any(valid):
        u2, v2 = loxo_apply(u[valid], v[valid], 1.0)
        sph = stereo_inv(u2, v2)
        new_pts[valid] = sph / np.linalg.norm(sph, axis=1, keepdims=True)
    sk.data.foreach_set('co', new_pts.ravel())
    mat = bpy.data.materials.new("sphere")
    mat.use_nodes = True; mat.blend_method = 'BLEND'
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.62, 0.76, 0.90, 1.0)
    bsdf.inputs["Transmission Weight"].default_value = 0.85
    bsdf.inputs["Alpha"].default_value = 0.18
    bsdf.inputs["Roughness"].default_value = 0.05
    ob.data.materials.append(mat)
    # Animate loxodromic shape key 0 → 1 → 0 over 360 frames
    sk_ref = ob.data.shape_keys.key_blocks['loxodromic']
    sk_ref.value = 0.0; sk_ref.keyframe_insert('value', frame=1)
    sk_ref.value = 1.0; sk_ref.keyframe_insert('value', frame=180)
    sk_ref.value = 0.0; sk_ref.keyframe_insert('value', frame=360)
    return ob

# ── Build orbits ──────────────────────────────────────────────────────────────

def build_orbits():
    t_vals = np.linspace(T_MIN, T_MAX, T_STEPS)
    coll   = bpy.data.collections.new("MobiusOrbits")
    bpy.context.scene.collection.children.link(coll)
    for k in range(N_ORBITS):
        lon0 = 2.0 * math.pi * k / N_ORBITS
        u0, v0 = math.cos(lon0), math.sin(lon0)
        pts3d = []
        for t in t_vals:
            u, v = loxo_apply(np.array([u0]), np.array([v0]), t)
            r_sq = u[0]**2 + v[0]**2
            if abs((r_sq - 1.0) / (r_sq + 1.0)) > POLE_GUARD:
                continue
            pts3d.append(stereo_inv(u, v)[0])
        if len(pts3d) < 4:
            continue
        crv = bpy.data.curves.new(f'orbit_{k:03d}', 'CURVE')
        crv.dimensions = '3D'
        crv.bevel_depth = BEVEL_THICK if k % 8 == 0 else BEVEL_DIM
        crv.bevel_resolution = 2
        spl = crv.splines.new('NURBS')
        spl.points.add(len(pts3d) - 1)
        for i, p in enumerate(pts3d):
            spl.points[i].co = (p[0], p[1], p[2], 1.0)
        spl.use_endpoint_u = True; spl.order_u = 4
        ob_c = bpy.data.objects.new(f'orbit_{k:03d}', crv)
        coll.objects.link(ob_c)
        hue = k / N_ORBITS
        r, g, b = colorsys.hsv_to_rgb(hue, 0.85, 1.0)
        mat = bpy.data.materials.new(f'om_{k:03d}')
        mat.use_nodes = True; mat.node_tree.nodes.clear()
        em  = mat.node_tree.nodes.new('ShaderNodeEmission')
        out = mat.node_tree.nodes.new('ShaderNodeOutputMaterial')
        em.inputs['Color'].default_value = (r, g, b, 1.0)
        em.inputs['Strength'].default_value = 4.5
        mat.node_tree.links.new(em.outputs['Emission'], out.inputs['Surface'])
        ob_c.data.materials.append(mat)

# ── Camera orbit ──────────────────────────────────────────────────────────────

def setup_camera_orbit():
    bpy.ops.object.empty_add(location=(0, 0, 0))
    pivot = bpy.context.object
    pivot.name = "CamPivot"
    bpy.ops.object.camera_add(location=(0, -3.6, 0.5))
    cam = bpy.context.object
    cam.rotation_euler = (math.radians(82), 0, 0)
    bpy.context.scene.camera = cam
    c = cam.constraints.new('CHILD_OF')
    c.target = pivot
    pivot.rotation_euler[2] = 0; pivot.keyframe_insert('rotation_euler', frame=1)
    pivot.rotation_euler[2] = 2 * math.pi
    pivot.keyframe_insert('rotation_euler', frame=N_FRAMES)
    fc = pivot.animation_data.action.fcurves[2]
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'
    bpy.ops.object.light_add(type='SUN', location=(4, -4, 6))
    bpy.context.object.data.energy = 2.5

# ── Render settings ───────────────────────────────────────────────────────────

def configure_render():
    sc = bpy.context.scene
    sc.render.engine       = 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x = 1920
    sc.render.resolution_y = 1080
    sc.render.fps          = FPS
    sc.frame_start = 1; sc.frame_end = N_FRAMES
    sc.eevee.use_bloom     = True
    sc.eevee.bloom_radius  = 4.0
    sc.eevee.bloom_intensity = 0.7

    os.makedirs(bpy.path.abspath(VIDEO_DIR), exist_ok=True)
    sc.render.filepath      = VIDEO_DIR + "viewport"
    sc.render.image_settings.file_format = 'FFMPEG'
    sc.render.ffmpeg.format = 'MPEG4'
    sc.render.ffmpeg.codec  = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'HIGH'

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    purge_scene()
    build_sphere()
    build_orbits()
    setup_camera_orbit()
    configure_render()
    bpy.ops.render.render(animation=True, write_still=False)
    print("[holoflow] record.py complete → viewport.mp4")

if __name__ == "__main__":
    main()
