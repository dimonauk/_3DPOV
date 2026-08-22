"""
blueprint.py — Kuramoto Coupled Oscillator Phase Synchronisation
Holoflow Studio · Blender 5.1
Licence: CC0-1.0

Simulates N oscillators with heterogeneous natural frequencies coupled via
sin(θⱼ − θᵢ). As coupling K surpasses the critical value K_c = 2γ
(Lorentzian half-width γ) the system undergoes the Kuramoto phase transition:
from a stationary incoherent state (r≈0) to a macroscopic rotating wave (r→1).

Animation schedule:
  Frames   1–80   K = 0           (free rotation, all phases wander)
  Frames  81–160  K ramps 0→K_FINAL (synchronisation onset)
  Frames 161–240  K = K_FINAL     (coherent travelling wave)

Each oscillator is a small emissive sphere on a ring of radius RING_R.
Its angular position φᵢ = θᵢ; its emissive colour cycles hue = θᵢ/(2π).
A central ORDER sphere is scaled proportional to r(t) so you can see the
order parameter grow in real time.

Run from Blender 5.1 Text Editor → Run Script.
Requires: numpy (bundled with Blender 5.1), colorsys (stdlib).
"""

import math
import colorsys

import bpy
import numpy as np

# ── parameters ────────────────────────────────────────────────────────────

N = 64                  # number of oscillators (powers of 2 work best)
RING_R = 5.0            # ring radius (Blender units)
SPHERE_R = 0.18         # individual oscillator sphere radius
ORDER_SCALE = 0.9       # max radius of the order-parameter indicator

GAMMA = 1.0             # Lorentzian frequency distribution half-width
# K_c = 2·γ = 2.0 for Lorentzian distribution; we run to 2×K_c for full sync
K_FINAL = 4.0

FPS = 24
FRAMES_FREE = 80
FRAMES_RAMP = 80
FRAMES_SYNC = 80
TOTAL_FRAMES = FRAMES_FREE + FRAMES_RAMP + FRAMES_SYNC

# RK4 sub-steps per Blender frame; 4 keeps max |ω|·dt ≈ 0.05 rad per sub-step
SUB_STEPS = 4
DT = 1.0 / (FPS * SUB_STEPS)

RNG_SEED = 42

# ── scene setup ──────────────────────────────────────────────────────────


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat, do_unlink=True)
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = TOTAL_FRAMES
    bpy.context.scene.render.fps = FPS


def make_mat(name: str, rgb: tuple, strength: float) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    bsdf.inputs["Emission Color"].default_value = (*rgb, 1.0)
    bsdf.inputs["Emission Strength"].default_value = strength
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.location, out.location = (0, 0), (300, 0)
    return mat


def spawn_sphere(name: str, r: float, mat: bpy.types.Material) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=8, ring_count=6)
    ob = bpy.context.active_object
    ob.name = ob.data.name = name
    ob.data.materials.append(mat)
    return ob


# ── physics ───────────────────────────────────────────────────────────────


def lorentzian_frequencies(n: int, gamma: float, rng: np.random.Generator) -> np.ndarray:
    """
    Inverse-CDF of the Cauchy/Lorentzian distribution: ω = γ·tan(π(u − 0.5)).
    This is the canonical Kuramoto frequency distribution; it gives a closed-form
    K_c = 2γ from the Ott–Antonsen ansatz. Clip to ±5γ to avoid outliers that
    force extremely small dt for stability.
    """
    u = rng.uniform(0.001, 0.999, n)
    omega = gamma * np.tan(math.pi * (u - 0.5))
    return np.clip(omega, -5 * gamma, 5 * gamma)


def deriv(theta: np.ndarray, omega: np.ndarray, K: float, n: int) -> np.ndarray:
    """
    dθᵢ/dt = ωᵢ + (K/N)·Σⱼ sin(θⱼ − θᵢ)

    Broadcasting: diff[i,j] = θ[j] − θ[i] so axis-1 sum gives mean-field coupling
    on each oscillator. O(N²) — fine for N ≤ 512 on modern hardware.
    """
    diff = theta[np.newaxis, :] - theta[:, np.newaxis]
    return omega + (K / n) * np.sum(np.sin(diff), axis=1)


def rk4_step(theta: np.ndarray, omega: np.ndarray, K: float, n: int, dt: float) -> np.ndarray:
    """
    4th-order Runge-Kutta. Use RK4 rather than Euler because the sin coupling
    introduces frequency-dependent phase errors that accumulate in Euler over 240
    frames; RK4 global error is O(dt⁴) vs O(dt) for Euler.
    """
    k1 = deriv(theta, omega, K, n)
    k2 = deriv(theta + 0.5 * dt * k1, omega, K, n)
    k3 = deriv(theta + 0.5 * dt * k2, omega, K, n)
    k4 = deriv(theta + dt * k3, omega, K, n)
    return theta + (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)


def order_parameter(theta: np.ndarray) -> float:
    """
    r = |⟨exp(iθ)⟩|  ∈ [0, 1].
    r ≈ 0: phases uniformly distributed on S¹ (incoherent).
    r → 1: all phases bunched together (full synchronisation).
    """
    return float(np.abs(np.mean(np.exp(1j * theta))))


def phase_to_rgb(phase: float) -> tuple:
    hue = (phase % (2 * math.pi)) / (2 * math.pi)
    return colorsys.hsv_to_rgb(hue, 0.85, 1.0)


# ── bake ─────────────────────────────────────────────────────────────────


def bake_node_color(mat: bpy.types.Material, rgb: tuple, frame: int) -> None:
    """Insert colour keyframes on the Principled BSDF inside mat."""
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    rgba = (*rgb, 1.0)
    for slot in ("Base Color", "Emission Color"):
        bsdf.inputs[slot].default_value = rgba
        bsdf.inputs[slot].keyframe_insert("default_value", frame=frame)


def linearise_fcurves(ob: bpy.types.Object) -> None:
    """Remove Bézier easing from all location/scale fcurves."""
    if ob.animation_data and ob.animation_data.action:
        for fc in ob.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"


# ── main ─────────────────────────────────────────────────────────────────


def build() -> None:
    clear_scene()
    rng = np.random.default_rng(RNG_SEED)

    theta = rng.uniform(0, 2 * math.pi, N)
    omega = lorentzian_frequencies(N, GAMMA, rng)

    # Create oscillator objects
    oscillators: list[bpy.types.Object] = []
    mats: list[bpy.types.Material] = []
    for i in range(N):
        rgb = phase_to_rgb(theta[i])
        mat = make_mat(f"osc_{i:03d}", rgb, 4.0)
        ob = spawn_sphere(f"osc_{i:03d}", SPHERE_R, mat)
        oscillators.append(ob)
        mats.append(mat)

    order_mat = make_mat("order_ring", (1.0, 1.0, 1.0), 2.0)
    order_ob = spawn_sphere("order_param", ORDER_SCALE, order_mat)

    scene = bpy.context.scene
    for frame in range(1, TOTAL_FRAMES + 1):
        scene.frame_set(frame)
        f0 = frame - 1

        if f0 < FRAMES_FREE:
            K = 0.0
        elif f0 < FRAMES_FREE + FRAMES_RAMP:
            K = K_FINAL * (f0 - FRAMES_FREE) / FRAMES_RAMP
        else:
            K = K_FINAL

        for _ in range(SUB_STEPS):
            theta = rk4_step(theta, omega, K, N, DT)

        r = order_parameter(theta)

        for i, ob in enumerate(oscillators):
            phi = theta[i]
            ob.location = (RING_R * math.cos(phi), RING_R * math.sin(phi), 0.0)
            ob.keyframe_insert("location", frame=frame)
            bake_node_color(mats[i], phase_to_rgb(phi), frame)

        # Order parameter sphere grows from near-zero to 1 as sync emerges
        s = max(0.04, r)
        order_ob.scale = (s, s, s)
        order_ob.keyframe_insert("scale", frame=frame)

    for ob in oscillators + [order_ob]:
        linearise_fcurves(ob)
        # Colour fcurves are on material data-blocks; linearise those too
    for mat in mats:
        for node in mat.node_tree.nodes:
            if node.animation_data and node.animation_data.action:
                for fc in node.animation_data.action.fcurves:
                    for kp in fc.keyframe_points:
                        kp.interpolation = "LINEAR"

    # Camera looking straight down +Z
    bpy.ops.object.camera_add(location=(0, 0, 20))
    cam = bpy.context.active_object
    cam.rotation_euler = (0, 0, 0)
    scene.camera = cam

    # Dark world
    world = bpy.data.worlds["World"]
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = (0.008, 0.008, 0.015, 1.0)
    bg.inputs["Strength"].default_value = 0.0

    print(f"Kuramoto build complete — {N} oscillators, {TOTAL_FRAMES} frames, K_c = {2*GAMMA:.2f}.")


build()
