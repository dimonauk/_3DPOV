"""
Reynolds 3D Boids  ·  Blender 5.1  ·  Holoflow Studio
Python bpy + numpy — expert-grade annotated implementation

Three-force steering model (Reynolds 1987, SIGGRAPH):
  Separation   R_SEP = 1.2  —  steer away from nearby neighbours
  Alignment    R_ALI = 2.5  —  match velocity with mid-range neighbours
  Cohesion     R_COH = 4.0  —  steer toward far neighbour centroid

Cone of vision: each agent ignores its rear 60° sector. The threshold is
cos(120°) = -0.5; boid i sees boid j only if dot(i→j, i_heading) > VISION_COS.
This constraint is the primary reason emergent flocks form coherent streams
rather than homogeneous clouds: agents cannot react to stimuli they cannot see.

Output artefacts:
  • boid_flock  — Mesh(N vertices), driven by frame_change_pre handler
  • boid_trails — Mesh(N × TRAIL_LEN edge-polylines), final-frame history
  • hf_boids.glb — Draco-6 GLB of the trail mesh for WebXR / print-preview

Run from Blender Text Editor (or CLI: blender --background --python blueprint.py).
"""

import os

import bmesh
import bpy
import numpy as np
from mathutils import Vector

# ─────────────────────────────── Parameters ──────────────────────────────────
N = 120          # boid count — O(N²) ops; keep ≤ 200 for interactive framerates
FRAMES = 180     # animation length in frames
DT = 0.06        # timestep (Blender units / frame)
BOX = 8.0        # world half-extent — agents reflect off faces of ±BOX cube

R_SEP = 1.2      # separation zone radius (innermost shell)
R_ALI = 2.5      # alignment zone radius  (R_ALI > R_SEP)
R_COH = 4.0      # cohesion zone radius   (R_COH ≥ R_ALI)

W_SEP = 2.0      # separation weight — dominates near-field
W_ALI = 1.0      # alignment weight
W_COH = 0.8      # cohesion weight — gentle global attractor

# Per-frame acceleration cap. Without it, boids can reverse instantaneously.
# Reynolds named this constraint "max_force"; 0.04 gives smooth carving turns.
STEER_LIM = 0.04

SPEED_MIN = 0.04   # lower speed clamp (prevents stalling)
SPEED_MAX = 0.18   # upper speed clamp (prevents runaway acceleration)

# cos(120°) = −0.5.  Agent i sees agent j iff dot(i→j unit, i heading) > VISION_COS.
# At exactly 120° the forward cone covers 2/3 of the sphere — close to the
# ~300° visual field measured in starlings (Ballerini et al. 2008).
VISION_COS = -0.5

TRAIL_LEN = 30     # trail history depth per boid (rolling buffer)
EXPORT_GLB = True
OUTPUT_PATH = "//output/hf_boids.glb"   # relative to the saved .blend
RNG_SEED = 42


# ─────────────────────────────── Simulation ──────────────────────────────────

def _step(pos: np.ndarray, vel: np.ndarray):
    """
    One Reynolds boids step.  All three forces computed as vectorised
    numpy operations over the full (N, N) pairwise interaction matrix.
    For N > ~300, replace dist_sq with a scipy.spatial.cKDTree radius query.

    pos : (N, 3) float64  current positions
    vel : (N, 3) float64  current velocities (already speed-clamped)
    """
    # ── Pairwise difference vectors ───────────────────────────────────────────
    # diff[i, j] = pos[j] − pos[i]  →  "i looks toward j"
    diff = pos[np.newaxis, :, :] - pos[:, np.newaxis, :]   # (N, N, 3)
    dist = np.sqrt((diff * diff).sum(-1))                  # (N, N) Euclidean

    # Unit vector i→j; safe at diagonal (dist == 0)
    unit = diff / np.where(dist > 1e-9, dist, 1.0)[:, :, np.newaxis]  # (N, N, 3)

    # ── Cone-of-vision mask ───────────────────────────────────────────────────
    vel_hat = vel / np.linalg.norm(vel, axis=-1, keepdims=True).clip(min=1e-9)
    # cos_ang[i,j] = dot(unit i→j, heading i)
    cos_ang = (unit * vel_hat[:, np.newaxis, :]).sum(-1)  # (N, N)
    visible = (cos_ang > VISION_COS) & (dist > 1e-9)

    # ── Separation — steer away from near neighbours ──────────────────────────
    sep_m = (dist < R_SEP) & visible
    f_sep = -(unit * sep_m[:, :, np.newaxis]).sum(1) / sep_m.sum(-1, keepdims=True).clip(min=1)

    # ── Alignment — steer toward neighbourhood mean velocity ─────────────────
    # Mid-ring only (R_SEP ≤ d < R_ALI) avoids double-penalising near pairs.
    ali_m = (dist >= R_SEP) & (dist < R_ALI) & visible
    avg_v = (vel[np.newaxis, :, :] * ali_m[:, :, np.newaxis]).sum(1) / ali_m.sum(-1, keepdims=True).clip(min=1)
    f_ali = avg_v - vel

    # ── Cohesion — steer toward neighbourhood centroid ────────────────────────
    coh_m = (dist < R_COH) & visible
    centroid = (pos[np.newaxis, :, :] * coh_m[:, :, np.newaxis]).sum(1) / coh_m.sum(-1, keepdims=True).clip(min=1)
    f_coh = centroid - pos

    # ── Weighted steering + Reynolds max-force clamp ──────────────────────────
    accel = W_SEP * f_sep + W_ALI * f_ali + W_COH * f_coh
    amag = np.linalg.norm(accel, axis=-1, keepdims=True).clip(min=1e-9)
    accel = accel / amag * np.minimum(amag, STEER_LIM)

    # ── Speed clamp ───────────────────────────────────────────────────────────
    vel_new = vel + accel * DT
    spd = np.linalg.norm(vel_new, axis=-1, keepdims=True).clip(min=1e-9)
    vel_new = vel_new / spd * spd.clip(SPEED_MIN, SPEED_MAX)

    # ── Mirror boundary — reflect velocity component on box-face contact ──────
    pos_new = pos + vel_new * DT
    for ax in range(3):
        over = pos_new[:, ax] > BOX
        under = pos_new[:, ax] < -BOX
        vel_new[over | under, ax] *= -1.0
    pos_new = pos_new.clip(-BOX, BOX)

    return pos_new, vel_new


def _simulate():
    rng = np.random.default_rng(RNG_SEED)
    pos = rng.uniform(-BOX * 0.5, BOX * 0.5, (N, 3))
    # Initialise with random unit-sphere velocities scaled to SPEED_MIN
    vel = rng.standard_normal((N, 3))
    vel = vel / np.linalg.norm(vel, axis=-1, keepdims=True) * SPEED_MIN

    # Rolling trail buffer — trail[boid, slot, xyz]; slot 0 = oldest position
    trail = np.broadcast_to(pos[:, np.newaxis, :], (N, TRAIL_LEN, 3)).copy()

    pos_hist, trail_hist = [pos.copy()], [trail.copy()]
    for _ in range(1, FRAMES):
        pos, vel = _step(pos, vel)
        # Shift oldest position out, append current at the end
        trail = np.concatenate([trail[:, 1:, :], pos[:, np.newaxis, :]], axis=1)
        pos_hist.append(pos.copy())
        trail_hist.append(trail.copy())

    return pos_hist, trail_hist


# ─────────────────────────────── Blender setup ───────────────────────────────

def _emit_material(name, layer="Col", strength=3.5):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    attr = nt.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = layer
    emit.inputs["Strength"].default_value = strength
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


def _build_flock_mesh(pos0):
    me = bpy.data.meshes.new("boid_flock")
    me.vertices.add(N)
    me.vertices.foreach_set("co", pos0.flatten())
    me.vertex_colors.new(name="Col")
    obj = bpy.data.objects.new("boid_flock", me)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(_emit_material("boid_flock_mat"))
    return obj


def _build_trail_mesh(trail):
    """
    N polylines of TRAIL_LEN vertices each, colour-coded oldest→newest
    as dark-blue→bright-cyan so temporal direction reads at a glance.
    """
    me = bpy.data.meshes.new("boid_trails")
    bm = bmesh.new()
    col = bm.verts.layers.float_color.new("Col")
    for bi in range(N):
        verts = []
        for ti in range(TRAIL_LEN):
            t = ti / max(TRAIL_LEN - 1, 1)   # 0 = oldest, 1 = newest
            v = bm.verts.new(Vector(trail[bi, ti]))
            v[col] = (t * 0.1, t * 0.55, t, 1.0)
            verts.append(v)
        for ti in range(TRAIL_LEN - 1):
            bm.edges.new((verts[ti], verts[ti + 1]))
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new("boid_trails", me)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(_emit_material("boid_trail_mat", strength=4.0))
    return obj


def _register_handler(pos_hist, flock_obj):
    ns = bpy.app.driver_namespace
    ns["boids_pos_hist"] = pos_hist
    ns["boids_flock_obj"] = flock_obj

    def _on_frame(scene):
        f = max(0, min(scene.frame_current - 1, FRAMES - 1))
        dns = bpy.app.driver_namespace
        obj = dns["boids_flock_obj"]
        obj.data.vertices.foreach_set("co", dns["boids_pos_hist"][f].flatten())
        obj.data.update()

    for h in list(bpy.app.handlers.frame_change_pre):
        if getattr(h, "__name__", "") == "_on_frame":
            bpy.app.handlers.frame_change_pre.remove(h)
    bpy.app.handlers.frame_change_pre.append(_on_frame)


def _export_glb(trail_obj):
    if not EXPORT_GLB:
        return
    path = bpy.path.abspath(OUTPUT_PATH)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    trail_obj.select_set(True)
    bpy.context.view_layer.objects.active = trail_obj
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_apply=True,
        use_selection=True,
    )
    print(f"[boids] GLB → {path}")


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end, sc.render.fps = 1, FRAMES, 24

    print(f"[boids] Simulating {N} agents × {FRAMES} frames …")
    pos_hist, trail_hist = _simulate()
    print("[boids] Simulation complete — building scene")

    flock_obj = _build_flock_mesh(pos_hist[0])
    trail_obj = _build_trail_mesh(trail_hist[-1])
    _register_handler(pos_hist, flock_obj)

    # Camera — slightly above and to one side so the 3D depth reads clearly
    bpy.ops.object.camera_add(location=(0, -24, 7))
    cam = bpy.context.active_object
    cam.rotation_euler = (1.18, 0.0, 0.0)
    sc.camera = cam

    # World — dark background so the emission trails pop
    sc.world = bpy.data.worlds.new("W")
    sc.world.use_nodes = True
    sc.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.02, 0.02, 0.04, 1)

    _export_glb(trail_obj)
    print("[boids] Scene ready — press Space to play animation")


if __name__ == "__main__":
    main()
