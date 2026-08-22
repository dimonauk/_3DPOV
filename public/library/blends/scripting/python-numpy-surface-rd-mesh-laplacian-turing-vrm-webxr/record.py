"""
Surface Reaction-Diffusion via Mesh Laplacian — Viewport Recording Script
Blender 5.1 | CC0 | Holoflow Studio 2026-07-26

Outputs:
  public/library/videos/scripting/
  python-numpy-surface-rd-mesh-laplacian-turing-vrm-webxr/
  viewport.mp4  (10 s, 30 fps, 300 frames)

Strategy:
  Capture V field at 10 checkpoints (every 1 200 steps) and bake each
  snapshot into a relative shape key.  At each key's peak frame the sphere
  shows the corresponding Turing stage; LINEAR-interpolated fcurves morph
  the surface between stages.  The animation shows nucleation at the north
  pole → spreading reaction front → mature hexagonal spot lattice.
"""

import bpy
import bmesh
import numpy as np

# ── CONSTANTS (must match blueprint.py) ───────────────────────────────────────
SUBDIVISIONS     = 4
SPHERE_R         = 0.15
DU, DV           = 0.16, 0.08
F_RATE, K_RATE   = 0.060, 0.062
DT               = 0.50
SEED             = 42
DISP_SCALE       = 0.045
MESH_NAME        = "hf_surface_rd_anim"
STEPS_PER_SNAP   = 1_200   # 10 snaps × 1 200 = 12 000 total steps
N_SNAPS          = 10
FRAMES_PER_SNAP  = 30      # 10 × 30 = 300 frames = 10 s @ 30 fps
OUTPUT_PATH = (
    "//../../videos/scripting/"
    "python-numpy-surface-rd-mesh-laplacian-turing-vrm-webxr/viewport"
)
# ──────────────────────────────────────────────────────────────────────────────


def _build_adj(n, tris):
    adj = [set() for _ in range(n)]
    for a, b, c in tris:
        adj[a].add(b); adj[a].add(c)
        adj[b].add(a); adj[b].add(c)
        adj[c].add(a); adj[c].add(b)
    deg = np.array([len(adj[i]) for i in range(n)], dtype=np.float64)
    rs, cs = [], []
    for i in range(n):
        for j in sorted(adj[i]):
            rs.append(i); cs.append(j)
    return deg, np.array(rs, np.int32), np.array(cs, np.int32)


def _lap(u, deg, rows, cols, n):
    sums = np.zeros(n, dtype=np.float64)
    np.add.at(sums, rows, u[cols])
    return sums / deg - u


def simulate_snapshots(n, verts, deg, rows, cols):
    """Run simulation and return V-field snapshots at STEPS_PER_SNAP intervals."""
    u = np.ones(n,  dtype=np.float64)
    v = np.zeros(n, dtype=np.float64)
    north = verts[:, 2] > SPHERE_R * 0.8
    u[north] = 0.50
    v[north] = 0.25
    rng = np.random.default_rng(SEED)
    v  += rng.uniform(-0.01, 0.01, n)
    np.clip(v, 0.0, None, out=v)

    snaps = [v.copy()]
    for _ in range(N_SNAPS - 1):
        for __ in range(STEPS_PER_SNAP):
            Lu  = _lap(u, deg, rows, cols, n)
            Lv  = _lap(v, deg, rows, cols, n)
            uvv = u * v * v
            u  += DT * (DU * Lu - uvv + F_RATE * (1.0 - u))
            v  += DT * (DV * Lv + uvv - (F_RATE + K_RATE) * v)
            np.clip(u, 0.0, 1.0, out=u)
            np.clip(v, 0.0, 1.0, out=v)
        snaps.append(v.copy())
    return snaps


def build_anim_mesh(verts, tris, snaps):
    """
    Create the animation sphere, add Basis + N_SNAPS shape keys.
    Each shape key SK_i stores the ABSOLUTE displaced positions for snapshot i.
    When SK_i=1-t and SK_{i+1}=t (linear fcurves), Blender computes:
      pos = Basis + (1-t)·(SK_i − Basis) + t·(SK_{i+1} − Basis)
           = lerp(displaced_i, displaced_{i+1}, t)
    which is the correct morphing between simulation states.
    """
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=SUBDIVISIONS, radius=SPHERE_R)
    bpy.ops.object.shade_flat()
    obj = bpy.context.active_object
    obj.name      = MESH_NAME
    obj.data.name = MESH_NAME
    me  = obj.data

    norms = verts / (np.linalg.norm(verts, axis=1, keepdims=True) + 1e-12)

    # Basis key = original sphere (no displacement)
    obj.shape_key_add(name="Basis", from_mix=False)

    for idx, v_snap in enumerate(snaps):
        sk      = obj.shape_key_add(name=f"S{idx:02d}", from_mix=False)
        disp_co = (verts + norms * v_snap[:, None] * DISP_SCALE).ravel()
        sk.data.foreach_set("co", disp_co.tolist())

    return obj


def animate_shape_keys(obj, n_snaps):
    """
    Insert LINEAR-interpolation keyframes so one shape key peaks at a time.
    Frame layout:  1 … 30 … 60 … … 270 … 300
                   S00^  S01^  S02^     S09^
    """
    sk_keys = obj.data.shape_keys.key_blocks[1:]   # skip Basis

    for snap_idx in range(n_snaps):
        frame = 1 + snap_idx * FRAMES_PER_SNAP
        for ki, key in enumerate(sk_keys):
            key.value = 1.0 if ki == snap_idx else 0.0
            key.keyframe_insert("value", frame=frame)

    # Set LINEAR interpolation on all shape-key fcurves
    action = obj.data.shape_keys.animation_data.action
    for fcurve in action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = "LINEAR"


def setup_render():
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = N_SNAPS * FRAMES_PER_SNAP
    scene.render.fps  = 30
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec  = "H264"
    scene.render.filepath      = OUTPUT_PATH


# ── MAIN ──────────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

# Temporary sphere to extract topology (delete after extraction)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=SUBDIVISIONS, radius=SPHERE_R)
tmp = bpy.context.active_object
bm  = bmesh.new()
bm.from_mesh(tmp.data)
bm.verts.ensure_lookup_table()
bm.faces.ensure_lookup_table()
n     = len(bm.verts)
verts = np.array([v.co[:] for v in bm.verts], dtype=np.float64)
tris  = np.array([[v.index for v in f.verts] for f in bm.faces], dtype=np.int32)
bm.free()
bpy.ops.object.delete()

deg, rows, cols = _build_adj(n, tris)
print("Simulating surface RD snapshots …")
snaps = simulate_snapshots(n, verts, deg, rows, cols)

obj = build_anim_mesh(verts, tris, snaps)
animate_shape_keys(obj, N_SNAPS)
setup_render()
print("record.py done — Render > Render Animation (F12) to produce viewport.mp4")
