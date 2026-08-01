"""
record.py — Viewport animation render for 600-cell stereographic shadow.
Outputs: public/library/videos/scripting/
         python-numpy-600-cell-quaternion-binary-icosahedral-stereographic-shadow-webxr/
         viewport.mp4

Run after blueprint.py has created the scene (or call both in sequence):
    blender hf_600cell.blend --python record.py

Animation: the 4D rotation angle sweeps 0 → 2π over 240 frames at 30 fps (8 s).
The "shadow" morphs continuously — the nested shells pulse and reconfigure,
showing how the stereographic image depends on the viewpoint in 4D.
"""

import bpy
import numpy as np
from itertools import product, permutations

# Reuse geometry generation from blueprint constants
PHI          = (1 + np.sqrt(5)) / 2
EDGE_LEN     = 1.0 / PHI
EDGE_TOL     = 0.02
ARC_DIVISIONS = 8
BEVEL_R      = 0.007
OBJECT_NAME  = "hf_600cell_anim"
FPS          = 30
N_FRAMES     = 240     # 8 seconds: 4D rotation completes one full turn
VIDEO_DIR    = "//../../videos/scripting/" \
               "python-numpy-600-cell-quaternion-binary-icosahedral-stereographic-shadow-webxr/"


def _perm_sign(p):
    visited = [False] * len(p)
    sign = 1
    for i in range(len(p)):
        if not visited[i]:
            j, cyc = i, 0
            while not visited[j]:
                visited[j] = True
                j = p[j]
                cyc += 1
            if cyc % 2 == 0:
                sign = -sign
    return sign


def gen_600cell():
    V = []
    for k in range(4):
        for s in (1, -1):
            v = np.zeros(4); v[k] = float(s); V.append(v)
    for signs in product((-1.0, 1.0), repeat=4):
        V.append(0.5 * np.array(signs))
    base = 0.5 * np.array([0.0, 1.0 / PHI, 1.0, PHI])
    seen: set = set()
    for p in permutations(range(4)):
        if _perm_sign(list(p)) == 1:
            pv = base[list(p)]
            for signs in product((-1.0, 1.0), repeat=3):
                v = pv.copy()
                j = 0
                for i in range(4):
                    if abs(v[i]) > 1e-9:
                        v[i] *= signs[j]; j += 1
                key = tuple(np.round(v, 9))
                if key not in seen:
                    seen.add(key); V.append(v)
    return np.array(V, dtype=np.float64)


def find_edges(V):
    from scipy.spatial import cKDTree
    return list(cKDTree(V).query_pairs(EDGE_LEN + EDGE_TOL))


def rot4d_yw(V, angle):
    c, s = np.cos(angle), np.sin(angle)
    R = np.eye(4)
    R[1, 1] = c;  R[1, 3] = -s
    R[3, 1] = s;  R[3, 3] =  c
    return (R @ V.T).T


def stereo3(v4):
    x, y, z, w = v4
    s = 1.0 / (1.0 - w)
    return np.array([x * s, y * s, z * s])


def slerp4(a, b, t):
    dot = float(np.clip(a @ b, -1.0, 1.0))
    omega = np.arccos(dot)
    if omega < 1e-8:
        return a.copy()
    so = np.sin(omega)
    return (np.sin((1 - t) * omega) * a + np.sin(t * omega) * b) / so


def build_frame_mesh(V4, edges, angle):
    """Return projected vertex positions for a given 4D rotation angle."""
    V4r = rot4d_yw(V4, angle)
    mesh_verts, mesh_edges = [], []
    for (i, j) in edges:
        pts = [stereo3(slerp4(V4r[i], V4r[j], t))
               for t in np.linspace(0, 1, ARC_DIVISIONS + 1)]
        base = len(mesh_verts)
        mesh_verts.extend(pts)
        for k in range(len(pts) - 1):
            mesh_edges.append((base + k, base + k + 1))
    return mesh_verts, mesh_edges


def setup_render(scene, V4, edges):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    scene.render.engine        = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x  = 1920
    scene.render.resolution_y  = 1080
    scene.render.fps            = FPS
    scene.frame_start           = 1
    scene.frame_end             = N_FRAMES
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format           = "MPEG4"
    scene.render.ffmpeg.codec            = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath = VIDEO_DIR + "viewport"

    # Build mesh for frame 1, then use shape keys for subsequent frames
    pts0, es0 = build_frame_mesh(V4, edges, np.deg2rad(12))
    me = bpy.data.meshes.new(OBJECT_NAME)
    me.from_pydata([p.tolist() for p in pts0], es0, [])
    me.update()
    ob = bpy.data.objects.new(OBJECT_NAME, me)
    scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob

    # Skin modifier for thickness (works on edge-only meshes)
    sk_mod = ob.modifiers.new("Skin", "SKIN")
    sk_mod.use_smooth_shade = True
    for mv in me.skin_vertices[0].data:
        mv.radius = (BEVEL_R, BEVEL_R)

    mat = bpy.data.materials.new(f"{OBJECT_NAME}_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em  = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value    = (0.62, 0.18, 1.0, 1.0)
    em.inputs["Strength"].default_value = 3.0
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    ob.data.materials.append(mat)

    # Camera: slow orbit
    bpy.ops.object.camera_add(location=(0, -7.5, 2.5))
    cam = bpy.context.object
    cam.rotation_euler = (np.deg2rad(75), 0, 0)
    scene.camera = cam
    cam.keyframe_insert("rotation_euler", frame=1)
    cam.rotation_euler = (np.deg2rad(75), 0, np.deg2rad(360))
    cam.keyframe_insert("rotation_euler", frame=N_FRAMES)

    world = bpy.data.worlds.new("world")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0, 0, 0, 1)
    scene.world = world

    bpy.ops.render.render(animation=True)
    print(f"[record] rendered {N_FRAMES} frames → {VIDEO_DIR}viewport.mp4")


if __name__ == "__main__":
    V4    = gen_600cell()
    edges = find_edges(V4)
    setup_render(bpy.context.scene, V4, edges)
