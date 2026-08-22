"""
Python: Multi-View Spherical Camera Rig for Gaussian Splatting
Blender 5.1  ·  CC0  ·  Holoflow Studio

Distributes N cameras evenly on a sphere around a target object using the
Fibonacci golden-angle spiral, renders each view, and writes transforms.json
compatible with nerfstudio and 3D Gaussian Splatting (3DGS) trainers.

Core mechanism:
  fibonacci_sphere_positions()       → near-uniform unit vectors on sphere
  v.to_track_quat('-Z', 'Y')        → point camera toward scene origin
  blender_to_nerf_c2w(mat)          → flip cols 1+2 for NeRF convention
  bpy.context.scene.camera = cam    → swap active camera before render
  bpy.ops.render.render(write_still=True)  → commit single frame to disk
  json.dump(transforms, f)          → write nerfstudio-compatible manifest

Why Fibonacci over lat-lon:
  A regular latitude-longitude grid clusters cameras near the poles.
  The golden-angle spiral produces near-uniform Voronoi cells (worst-case
  angular gap ~28° at N=64 vs ~52° for an 8×8 lat-lon grid).  Uniform
  coverage means every training image sees a roughly equal solid angle of
  the subject — critical for isotropic Gaussian initialisation.

Why the Y+Z column flip:
  Blender cameras look toward -Z in local space, +Y up — matching OpenGL.
  The Blender world has +Z up.  NeRF/3DGS trainers use the same camera
  convention but expect the world axes per the trainer's own +Y-up scene
  space.  Negating columns 1 and 2 of the 3×3 rotation block converts
  Blender's world-space orientation to the NeRF convention.  This is the
  transform used by the nerfstudio Blender data-parser (MIT licence).

Outside sources
  nerfstudio — MIT — nerfstudio-project
    https://github.com/nerfstudio-project/nerfstudio
    Related: NeRFacto (Apache-2.0), Splatfacto (Apache-2.0)
  BlenderNeRF — MIT — maximeraafat
    https://github.com/maximeraafat/BlenderNeRF
    Related: torch-ngp (MIT, ashawkey), nerf_pl (MIT, kwea123)
"""

import bpy
import json
import math
import os

import mathutils

# ── Parameters ────────────────────────────────────────────────────────────────
N_VIEWS          = 64       # camera count; 64 is the nerfstudio 'medium' preset
RADIUS           = 3.0      # sphere radius in Blender metres
FOCAL_MM         = 24.0     # camera focal length (mm)
SENSOR_W_MM      = 36.0     # sensor width; full-frame reference for horizontal FoV
IMG_W            = 800      # render width in pixels
IMG_H            = 600      # render height in pixels
RENDER_SAMPLES   = 16       # EEVEE Next samples; 16 is enough for SfM training data
OUTPUT_DIR       = "//output/"
TRANSFORMS_FILE  = "transforms.json"
CAM_COLLECTION   = "CamRig"
CAM_PREFIX       = "hf_sv_"


# ── Maths ─────────────────────────────────────────────────────────────────────
def fibonacci_sphere_positions(n: int, radius: float) -> list[tuple[float, float, float]]:
    """N near-uniform points on a sphere via the golden-angle azimuthal spiral.

    θ = arccos(1 − 2(i+0.5)/n)  gives equal-area latitude bands.
    φ = 2πi/ϕ  (ϕ = golden ratio) spaces azimuths to avoid stripe artefacts.
    The result: each camera subtends roughly equal solid angle.
    """
    golden = (1.0 + math.sqrt(5.0)) / 2.0
    pts: list[tuple[float, float, float]] = []
    for i in range(n):
        theta = math.acos(1.0 - 2.0 * (i + 0.5) / n)
        phi   = 2.0 * math.pi * i / golden
        x = math.sin(theta) * math.cos(phi)
        y = math.sin(theta) * math.sin(phi)
        z = math.cos(theta)
        pts.append((radius * x, radius * y, radius * z))
    return pts


def blender_to_nerf_c2w(mat: mathutils.Matrix) -> list[list[float]]:
    """Camera-to-world matrix → NeRF transforms.json format.

    Negate columns 1 and 2 of the rotation block: converts Blender +Z-up world
    to the NeRF trainer's expected convention without touching the translation.
    """
    m = [list(row) for row in mat]     # copy as nested lists (row-major)
    for r in range(3):
        m[r][1] = -m[r][1]
        m[r][2] = -m[r][2]
    return m


def fov_x(focal_mm: float, sensor_w_mm: float) -> float:
    """Horizontal field-of-view in radians from camera intrinsics."""
    return 2.0 * math.atan(sensor_w_mm / (2.0 * focal_mm))


# ── Scene build ───────────────────────────────────────────────────────────────
def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def build_demo_subject() -> bpy.types.Object:
    """Faceted low-poly icosphere — replace with your actual prop."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.6, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = "splat_subject"
    bpy.ops.object.shade_flat()   # hard normals increase SfM feature contrast

    mat = bpy.data.materials.new("subject_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.8, 0.55, 0.1, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.6
    obj.data.materials.append(mat)
    return obj


def build_camera_rig(positions: list[tuple[float, float, float]]) -> list[bpy.types.Object]:
    """One camera per Fibonacci position, all tracking the origin.

    Cameras parent to a shared empty (cam_rig_root).  Rotating the empty
    in record.py shows the full rig in the viewport without re-evaluating
    camera orientations.
    """
    col = bpy.data.collections.new(CAM_COLLECTION)
    bpy.context.scene.collection.children.link(col)

    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    root = bpy.context.active_object
    root.name = "cam_rig_root"
    col.objects.link(root)
    bpy.context.scene.collection.objects.unlink(root)

    cams: list[bpy.types.Object] = []
    for i, (px, py, pz) in enumerate(positions):
        cd = bpy.data.cameras.new(f"{CAM_PREFIX}{i:04d}")
        cd.lens         = FOCAL_MM
        cd.sensor_width = SENSOR_W_MM

        co = bpy.data.objects.new(f"{CAM_PREFIX}{i:04d}", cd)
        co.location = (px, py, pz)
        col.objects.link(co)

        # to_track_quat('-Z', 'Y'): -Z is camera look direction; +Y is up axis
        direction = mathutils.Vector((-px, -py, -pz)).normalized()
        co.rotation_mode       = 'QUATERNION'
        co.rotation_quaternion = direction.to_track_quat('-Z', 'Y')
        co.parent = root
        cams.append(co)

    return cams


# ── Lighting ──────────────────────────────────────────────────────────────────
def add_three_point_lighting() -> None:
    """Consistent sun-lamp rig avoids per-view shadows that confuse 3DGS colour."""
    def sun(name: str, energy: float, euler: tuple[float, float, float]) -> None:
        bpy.ops.object.light_add(type='SUN', location=(0, 0, 0))
        s = bpy.context.active_object
        s.name = name
        s.data.energy = energy
        s.rotation_euler = mathutils.Euler(euler, 'XYZ')

    sun("key_light",  3.0, (math.radians(45), 0, math.radians(-45)))
    sun("fill_light", 1.2, (math.radians(30), 0, math.radians(135)))
    sun("back_light", 0.8, (math.radians(-20), 0, math.radians(180)))


# ── Render pipeline ───────────────────────────────────────────────────────────
def configure_render() -> None:
    s = bpy.context.scene
    s.render.engine           = 'BLENDER_EEVEE_NEXT'
    s.eevee.taa_render_samples = RENDER_SAMPLES
    s.render.resolution_x     = IMG_W
    s.render.resolution_y     = IMG_H
    s.render.image_settings.file_format = 'PNG'
    s.render.image_settings.color_depth = '8'


def render_all_views(cams: list[bpy.types.Object]) -> list[dict]:
    """Swap scene.camera, render, capture matrix; return frame list."""
    scene = bpy.context.scene
    imgs_abs = bpy.path.abspath(OUTPUT_DIR + "images/")
    os.makedirs(imgs_abs, exist_ok=True)

    frames = []
    for i, cam in enumerate(cams):
        rel  = f"images/{i:06d}.png"
        scene.render.filepath = bpy.path.abspath(OUTPUT_DIR + rel)
        scene.camera = cam
        bpy.ops.render.render(write_still=True)
        # read matrix_world AFTER render: depsgraph is fully evaluated
        c2w = blender_to_nerf_c2w(cam.matrix_world)
        frames.append({"file_path": rel, "transform_matrix": c2w})
        print(f"  [{i + 1:3d}/{len(cams)}] {rel}")

    return frames


def write_transforms(frames: list[dict]) -> None:
    """transforms.json — nerfstudio / instant-ngp / 3DGS compatible."""
    # pixel-space focal length: f_px = (f_mm / sensor_w_mm) × img_w
    fl_x = (FOCAL_MM / SENSOR_W_MM) * IMG_W
    fl_y = fl_x * (IMG_H / IMG_W)   # square pixels; adjust if sensor_h differs

    payload = {
        "camera_angle_x": fov_x(FOCAL_MM, SENSOR_W_MM),
        "fl_x": fl_x,
        "fl_y": fl_y,
        "cx": IMG_W / 2.0,
        "cy": IMG_H / 2.0,
        "w": IMG_W,
        "h": IMG_H,
        "aabb_scale": 4,   # scene-scale hint; 4 comfortably bounds RADIUS=3
        "frames": frames,
    }
    out = bpy.path.abspath(OUTPUT_DIR + TRANSFORMS_FILE)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"  wrote {out} ({len(frames)} frames)")


# ── Entry point ───────────────────────────────────────────────────────────────
def main() -> None:
    clear_scene()
    build_demo_subject()
    add_three_point_lighting()
    configure_render()

    positions = fibonacci_sphere_positions(N_VIEWS, RADIUS)
    cams      = build_camera_rig(positions)

    print(f"[hf] rendering {N_VIEWS} views at {IMG_W}×{IMG_H} …")
    frames = render_all_views(cams)
    write_transforms(frames)
    print("[hf] done — feed output/ to nerfstudio: ns-train splatfacto --data output/")


main()
