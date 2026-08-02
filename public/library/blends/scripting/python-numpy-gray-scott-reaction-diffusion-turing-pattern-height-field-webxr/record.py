"""
record.py — Viewport animation for Gray-Scott Reaction-Diffusion
Blender 5.1  |  CC0

Animates the simulation evolving from a blank field to a mature Turing
pattern — the emergence of order from a spatially uniform state.

How it works:
  • We pre-compute snapshots of V_field at 12 checkpoints across the
    integration (frames 0, 500, 1000, … 6000).
  • Each frame rebuilds the mesh Z-coordinates from the checkpoint data
    using a pre-handler callback, then renders.
  • Output: viewport.mp4 via Blender's OpenGL animation render.
    Run from: Render → Render Animation  (or bpy.ops.render.opengl(animation=True))
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ── constants ──────────────────────────────────────────────────
GRID_N       = 64
DT           = 1.0
DU           = 0.210
DV           = 0.105
FEED         = 0.035
KILL         = 0.060
SEED_R       = 3
HEIGHT_SCALE = 0.80
MESH_SIZE    = 5.0
CHECKPOINTS  = 12         # number of frames to keyframe
TOTAL_STEPS  = 6000
STEPS_PER_CP = TOTAL_STEPS // CHECKPOINTS
OUTPUT_PATH  = "//../../videos/scripting/python-numpy-gray-scott-reaction-diffusion-turing-pattern-height-field-webxr/viewport"
FPS          = 12
OBJ_NAME     = "hf_gray_scott_anim"


def _laplacian(field):
    return (
        np.roll(field, +1, axis=0) + np.roll(field, -1, axis=0) +
        np.roll(field, +1, axis=1) + np.roll(field, -1, axis=1) -
        4.0 * field
    )


def collect_snapshots():
    """Run the simulation and return V-field snapshots at CHECKPOINTS frames."""
    rng = np.random.default_rng(42)
    U = np.ones((GRID_N, GRID_N))
    V = np.zeros((GRID_N, GRID_N))
    cx, cy = GRID_N // 2, GRID_N // 2
    U[cx-SEED_R:cx+SEED_R, cy-SEED_R:cy+SEED_R] = 0.50
    V[cx-SEED_R:cx+SEED_R, cy-SEED_R:cy+SEED_R] = 0.25
    pts = rng.integers(0, GRID_N, size=(GRID_N // 4, 2))
    V[pts[:, 0], pts[:, 1]] += rng.uniform(0.01, 0.05, size=GRID_N // 4)
    np.clip(U, 0, 1, out=U)
    np.clip(V, 0, 1, out=V)

    snapshots = [V.copy()]   # frame 0 — blank start

    for cp in range(CHECKPOINTS - 1):
        for _ in range(STEPS_PER_CP):
            lap_U = _laplacian(U)
            lap_V = _laplacian(V)
            uvv = U * V * V
            U += DT * (DU * lap_U - uvv + FEED * (1.0 - U))
            V += DT * (DV * lap_V + uvv - (FEED + KILL) * V)
            np.clip(U, 0, 1, out=U)
            np.clip(V, 0, 1, out=V)
        snapshots.append(V.copy())

    return snapshots


def build_base_mesh():
    """Create the grid mesh once; subsequent frames only update Z coords."""
    n = GRID_N
    step = MESH_SIZE / (n - 1)
    me = bpy.data.meshes.new(OBJ_NAME)
    bm = bmesh.new()
    verts = []
    for i in range(n):
        row = []
        for j in range(n):
            x = j * step - MESH_SIZE / 2
            y = i * step - MESH_SIZE / 2
            row.append(bm.verts.new(Vector((x, y, 0.0))))
        verts.append(row)
    for i in range(n - 1):
        for j in range(n - 1):
            bm.faces.new([verts[i][j], verts[i][j+1],
                          verts[i+1][j+1], verts[i+1][j]])
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)

    mat = bpy.data.materials.new("GrayScottAnimMat")
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()
    vc   = tree.nodes.new("ShaderNodeVertexColor")
    bsdf = tree.nodes.new("ShaderNodeBsdfDiffuse")
    out  = tree.nodes.new("ShaderNodeOutputMaterial")
    vc.layer_name = "Col"
    tree.links.new(vc.outputs["Color"], bsdf.inputs["Color"])
    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    obj.data.materials.append(mat)

    col_attr = me.color_attributes.new(name="Col", type="BYTE_COLOR", domain="POINT")
    return obj, col_attr


def update_mesh(obj, col_attr, V_snapshot):
    """Push new Z heights and vertex colours from a V-field snapshot."""
    n = GRID_N
    me = obj.data
    for i in range(n):
        for j in range(n):
            vi = i * n + j
            z = float(V_snapshot[i, j]) * HEIGHT_SCALE
            me.vertices[vi].co.z = z
            v_val = float(V_snapshot[i, j])
            col_attr.data[vi].color = (v_val, 1.0 - v_val, v_val * 0.5, 1.0)
    me.update()


def setup_camera_and_render():
    """Orbit camera, light, and OpenGL render settings."""
    cam_data = bpy.data.cameras.new("RecordCam")
    cam = bpy.data.objects.new("RecordCam", cam_data)
    cam.location = (6.0, -6.0, 5.0)
    cam.rotation_euler = (1.0, 0.0, 0.785)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    sun_data = bpy.data.lights.new("Sun", type="SUN")
    sun = bpy.data.objects.new("Sun", sun_data)
    sun.location = (3, -3, 8)
    bpy.context.collection.objects.link(sun)

    scene = bpy.context.scene
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath = OUTPUT_PATH
    scene.render.fps = FPS
    scene.frame_start = 1
    scene.frame_end = CHECKPOINTS
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720


def main():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    print("[record] collecting simulation snapshots …")
    snapshots = collect_snapshots()

    obj, col_attr = build_base_mesh()
    setup_camera_and_render()

    print("[record] inserting shape-key-equivalent per-frame Z …")
    scene = bpy.context.scene
    for frame_idx, snap in enumerate(snapshots):
        scene.frame_set(frame_idx + 1)
        update_mesh(obj, col_attr, snap)
        # insert visual key so timeline scrub shows the state
        obj.keyframe_insert("location", frame=frame_idx + 1)

    print("[record] rendering animation → ", OUTPUT_PATH)
    bpy.ops.render.opengl(animation=True)
    print("[record] done.")


if __name__ == "__main__":
    main()
