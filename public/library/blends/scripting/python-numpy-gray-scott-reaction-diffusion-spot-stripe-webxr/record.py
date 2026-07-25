"""
Gray-Scott Reaction-Diffusion — Viewport Recording Script
Blender 5.1 | CC0 | Holoflow Studio 2026-07-25

Outputs: public/library/videos/scripting/
         python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr/
         viewport.mp4  (12 s, 30 fps, 360 frames)

Strategy: snapshot V field at 12 checkpoints during integration and
morph the mesh vertex Z-positions between them over 30 frames each.
This makes the simulation's temporal evolution visible — seed → noise
cluster → emergent spots → mature steady-state labyrinthine network.
"""

import bpy
import numpy as np

# ── CONSTANTS (must match blueprint.py) ──────────────────────────────────────
N          = 128
DU, DV     = 0.16, 0.08
F_RATE     = 0.060
K_RATE     = 0.062
DT         = 1.0
DISP_SCALE = 0.40
MESH_NAME  = "hf_gray_scott_anim"
STEPS_PER_SNAP = 1_000      # simulate 1 000 steps between each snapshot
N_SNAPS        = 10         # 10 snapshots × 1 000 steps = 10 000 total
FRAMES_PER_SNAP = 36        # blender frames per snapshot (36 × 10 = 360 = 12 s @ 30fps)
OUTPUT_PATH = "//../../videos/scripting/python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr/viewport"
# ─────────────────────────────────────────────────────────────────────────────


def _lap(f: np.ndarray) -> np.ndarray:
    return (
        np.roll(f,  1, axis=0) + np.roll(f, -1, axis=0) +
        np.roll(f,  1, axis=1) + np.roll(f, -1, axis=1) -
        4.0 * f
    )


def simulate_snapshots() -> list[np.ndarray]:
    """Return N_SNAPS snapshots of the V field at evenly spaced time points."""
    u = np.ones((N, N), dtype=np.float64)
    v = np.zeros((N, N), dtype=np.float64)

    cx = cy = N // 2
    r = 8
    u[cx - r : cx + r, cy - r : cy + r] = 0.50
    v[cx - r : cx + r, cy - r : cy + r] = 0.25
    rng = np.random.default_rng(seed=42)
    v += rng.uniform(-0.01, 0.01, (N, N))
    np.clip(v, 0.0, None, out=v)

    snaps = [v.copy()]           # snapshot 0: initial seed
    for _ in range(N_SNAPS - 1):
        for __ in range(STEPS_PER_SNAP):
            uvv = u * v * v
            u += DT * (DU * _lap(u) - uvv + F_RATE * (1.0 - u))
            v += DT * (DV * _lap(v) + uvv - (F_RATE + K_RATE) * v)
            np.clip(u, 0.0, 1.0, out=u)
            np.clip(v, 0.0, 1.0, out=v)
        snaps.append(v.copy())
    return snaps


def build_animated_mesh(snaps: list[np.ndarray]) -> bpy.types.Object:
    """
    Create a mesh from the first snapshot, then add shape keys for each
    subsequent snapshot.  A value-driven fcurve steps through shape keys,
    giving a discrete flip per FRAMES_PER_SNAP block rather than a smooth
    interpolation — the discrete jump reads as a simulation timestep tick.
    """
    step = 1.0 / (N - 1)
    half = 0.5

    # Base mesh from snapshot 0
    verts0 = []
    for i in range(N):
        for j in range(N):
            verts0.append((j * step - half, i * step - half,
                           float(snaps[0][i, j]) * DISP_SCALE))

    faces = []
    for i in range(N - 1):
        for j in range(N - 1):
            a = i * N + j
            faces.append((a, a + 1, (i + 1) * N + (j + 1), (i + 1) * N + j))

    me = bpy.data.meshes.new(MESH_NAME)
    me.from_pydata(verts0, [], faces)
    me.update()

    obj = bpy.data.objects.new(MESH_NAME, me)
    bpy.context.scene.collection.objects.link(obj)

    # Add shape keys (Basis + one per remaining snapshot)
    obj.shape_key_add(name="Basis")
    for s_idx, snap in enumerate(snaps[1:], start=1):
        sk = obj.shape_key_add(name=f"Step_{s_idx * STEPS_PER_SNAP}")
        for vert_idx in range(N * N):
            i, j = vert_idx // N, vert_idx % N
            sk.data[vert_idx].co.z = float(snap[i, j]) * DISP_SCALE

    # Animate: each shape key value = 1 only during its block
    for s_idx in range(1, N_SNAPS):
        key_block = obj.data.shape_keys.key_blocks[s_idx]
        key_block.value = 0.0
        start_f = (s_idx - 1) * FRAMES_PER_SNAP + 1
        end_f   =  s_idx      * FRAMES_PER_SNAP

        key_block.keyframe_insert("value", frame=max(1, start_f - 1))
        key_block.value = 1.0
        key_block.keyframe_insert("value", frame=start_f)
        key_block.value = 1.0
        key_block.keyframe_insert("value", frame=end_f)
        key_block.value = 0.0
        key_block.keyframe_insert("value", frame=end_f + 1)

    return obj


def configure_render() -> None:
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end   = N_SNAPS * FRAMES_PER_SNAP
    sc.render.fps   = 30
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format               = "MPEG4"
    sc.render.ffmpeg.codec                = "H264"
    sc.render.ffmpeg.constant_rate_factor = "MEDIUM"
    sc.render.filepath = OUTPUT_PATH
    sc.render.resolution_x = 1280
    sc.render.resolution_y = 720


def main() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    print("Simulating snapshots …")
    snaps = simulate_snapshots()
    print(f"   {len(snaps)} snapshots captured.")

    build_animated_mesh(snaps)
    configure_render()
    bpy.ops.render.render(animation=True)
    print("viewport.mp4 written.")


main()
