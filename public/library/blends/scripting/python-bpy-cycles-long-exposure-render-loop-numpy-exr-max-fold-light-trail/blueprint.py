"""
Cycles Long-Exposure Accumulation — Emissive Double-Helix Poi Trail
blueprint.py  ·  Blender 5.1  ·  Holoflow Studio  ·  CC0
──────────────────────────────────────────────────────────────────
A real long-exposure photograph accumulates photons across the full
shutter window.  This blueprint replicates that mechanic in Cycles:
  1. Build a double-helix emissive scene (two NURBS strands, orange + cyan).
  2. Orbit the camera 360° in N_SUBFRAMES steps; render each as float32 EXR.
  3. Fold all EXR frames with numpy np.maximum — whichever frame caught
     bright emission at a pixel wins.  Result: a single image showing the
     helix projected from every angle simultaneously, just as a real camera
     records a spinning poi light trail over a long exposure.

MAX vs ADD (controlled by ACCUM_MODE):
  MAX → peak-hold; ideal for dark-background emissive scenes; no tone-map needed.
  ADD → true summation; divide by N_SUBFRAMES to normalise; better for complex lit.

Run this script from the Scripting workspace.  It builds the scene and exports a
static GLB immediately.  To execute the full render pipeline, call:
    build_long_exposure()
from the Python Console or the last block in this file (uncomment).
"""

import bpy
import math
import os
import tempfile
import numpy as np
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
HELIX_R       = 0.9    # helix tube radius (distance from Z-axis to centreline)
HELIX_PITCH   = 0.22   # vertical rise per full revolution (metres)
HELIX_TURNS   = 4.0    # total revolutions
N_CTRL        = 128    # NURBS control points per strand
BEVEL_RADIUS  = 0.016  # strand tube cross-section radius

COL_A         = (1.00, 0.45, 0.08)   # strand A: poi-orange
COL_B         = (0.08, 0.72, 0.96)   # strand B: cyan arc
EMIT_STR      = 20.0   # Principled BSDF emission_strength

CAM_RADIUS    = 5.8    # camera orbit radius
CAM_HEIGHT    = 1.0    # camera elevation above helix midpoint
N_SUBFRAMES   = 60     # orbit steps (60 × 6° = 360° composite)
CYCLES_SAMP   = 4      # samples per subframe; emission paths are short so 4 suffices
RES_X, RES_Y  = 960, 540
ACCUM_MODE    = 'MAX'  # 'MAX' or 'ADD'

GLB_OUT  = "//hf_longexp_helix.glb"
PNG_OUT  = "//hf_longexp_composite.png"


# ── Scene helpers ─────────────────────────────────────────────────────────────

def _clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = 'METRIC'


def _make_strand(name: str, phase_offset: float, color: tuple) -> bpy.types.Object:
    """NURBS helix strand: phase_offset (radians) separates the two strands."""
    cu = bpy.data.curves.new(name, type='CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = BEVEL_RADIUS
    cu.bevel_resolution = 4   # 4 segments per cross-section ring (8-sided tube)
    cu.use_fill_caps = True   # closed end-caps for manifold GLB

    sp = cu.splines.new('NURBS')
    sp.points.add(N_CTRL - 1)  # splines start with 1 point; add N-1 more
    sp.use_endpoint_u = True   # curve passes through first and last control point
    sp.use_smooth = True

    helix_height = HELIX_TURNS * HELIX_PITCH
    for i, pt in enumerate(sp.points):
        t = i / (N_CTRL - 1)
        theta = t * HELIX_TURNS * 2 * math.pi + phase_offset
        x = HELIX_R * math.cos(theta)
        y = HELIX_R * math.sin(theta)
        z = t * helix_height - helix_height * 0.5  # centre the helix at Z=0
        pt.co = (x, y, z, 1.0)  # NURBS points are homogeneous (W=1)

    obj = bpy.data.objects.new(name, cu)
    mat = _make_mat(f"mat_{name}", color)
    cu.materials.append(mat)
    bpy.context.collection.objects.link(obj)
    return obj


def _make_mat(name: str, color: tuple) -> bpy.types.Material:
    """Emission material using Principled BSDF (v2 emission sub-block, 5.1+)."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()

    out  = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

    # Zero base colour (dark) so the strand only contributes via emission
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Metallic'].default_value = 0.0
    bsdf.inputs['Roughness'].default_value = 1.0
    bsdf.inputs['Emission Color'].default_value = (*color, 1.0)
    bsdf.inputs['Emission Strength'].default_value = EMIT_STR
    return mat


def _setup_camera() -> bpy.types.Object:
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 35
    cam_obj = bpy.data.objects.new("cam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    # TrackTo target at helix midpoint (origin)
    target = bpy.data.objects.new("cam_target", None)
    bpy.context.collection.objects.link(target)

    ct = cam_obj.constraints.new('TRACK_TO')
    ct.target = target
    ct.track_axis = 'TRACK_NEGATIVE_Z'
    ct.up_axis = 'UP_Y'
    return cam_obj


def _setup_world():
    """Pure black world — ensures the background stays 0.0 in EXR accumulation."""
    scene = bpy.context.scene
    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (0.0, 0.0, 0.0, 1.0)
    bg.inputs['Strength'].default_value = 0.0


def _setup_render(scene):
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = CYCLES_SAMP
    scene.cycles.use_denoising = False   # denoising at 4 samp would smear bright trails
    scene.render.resolution_x = RES_X
    scene.render.resolution_y = RES_Y
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'OPEN_EXR'
    scene.render.image_settings.color_mode = 'RGB'
    scene.render.image_settings.color_depth = '32'  # float32 — preserve overbright emission


# ── Render loop ───────────────────────────────────────────────────────────────

def _render_subframes(scene, cam_obj, tmp_dir: str) -> list:
    """Orbit camera 360°, render N_SUBFRAMES EXR files. Returns path list."""
    helix_mid_z = 0.0  # helix is centred at origin
    paths = []
    win = bpy.context.window_manager.windows[0]

    for i in range(N_SUBFRAMES):
        angle = (i / N_SUBFRAMES) * 2 * math.pi
        cam_obj.location = Vector((
            CAM_RADIUS * math.cos(angle),
            CAM_RADIUS * math.sin(angle),
            CAM_HEIGHT + helix_mid_z,
        ))
        bpy.context.view_layer.update()   # recalculate TrackTo

        path = os.path.join(tmp_dir, f"sub_{i:04d}.exr")
        scene.render.filepath = path
        with bpy.context.temp_override(window=win):
            bpy.ops.render.render(write_still=True)
        paths.append(path)
        print(f"  rendered subframe {i+1}/{N_SUBFRAMES}")

    return paths


# ── Accumulation ──────────────────────────────────────────────────────────────

def _accumulate(paths: list) -> np.ndarray:
    """Load EXR files via bpy.data.images, fold into float32 array."""
    accum = None

    for path in paths:
        img = bpy.data.images.load(path, check_existing=False)
        # pixels are stored as a flat RGBA sequence, bottom-left origin
        pix = np.array(img.pixels[:], dtype=np.float32).reshape(RES_Y, RES_X, 4)
        bpy.data.images.remove(img)   # free GPU/CPU memory immediately

        if accum is None:
            accum = pix.copy()
        elif ACCUM_MODE == 'MAX':
            np.maximum(accum, pix, out=accum)
        else:  # ADD
            accum += pix

    if accum is not None and ACCUM_MODE == 'ADD':
        # Normalise so peak emission lands near 1.0 (tone-map for 8-bit PNG save)
        peak = accum[:, :, :3].max()
        if peak > 0:
            accum[:, :, :3] /= peak
        accum[:, :, 3] = np.clip(accum[:, :, 3], 0.0, 1.0)

    return accum


# ── Output ────────────────────────────────────────────────────────────────────

def _write_png(accum: np.ndarray, png_path: str):
    img = bpy.data.images.new("longexp_result", width=RES_X, height=RES_Y,
                              float_buffer=True, alpha=False)
    # Flatten back to RGBA (alpha=1) for Blender image API
    result = np.ones((RES_Y, RES_X, 4), dtype=np.float32)
    result[:, :, :3] = np.clip(accum[:, :, :3], 0.0, 1.0)
    img.pixels.foreach_set(result.flatten())   # foreach_set is ~30× faster than [:]
    img.file_format = 'PNG'
    img.filepath_raw = bpy.path.abspath(png_path)
    img.save()
    bpy.data.images.remove(img)
    print(f"Saved composite → {png_path}")


# ── GLB export ────────────────────────────────────────────────────────────────

def _export_glb():
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_OUT),
        export_format='GLB',
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_materials='EXPORT',
        export_texcoords=True,
        export_normals=True,
        export_colors=False,
    )
    print(f"GLB exported → {GLB_OUT}")


# ── Public entry point ────────────────────────────────────────────────────────

def build_long_exposure():
    """Run the full 60-subframe orbit render and save PNG + GLB."""
    tmp_dir = tempfile.mkdtemp(prefix="hf_exr_")
    print(f"Temp EXR dir: {tmp_dir}")
    scene = bpy.context.scene
    cam_obj = scene.camera

    print(f"Rendering {N_SUBFRAMES} subframes @ {CYCLES_SAMP} samples each …")
    paths = _render_subframes(scene, cam_obj, tmp_dir)
    print("Accumulating …")
    accum = _accumulate(paths)
    _write_png(accum, PNG_OUT)

    # Clean up temp EXR files
    for p in paths:
        try:
            os.remove(p)
        except OSError:
            pass
    os.rmdir(tmp_dir)


# ── Build scene (runs on script execute) ─────────────────────────────────────

_clear()
sc = bpy.context.scene
sc.name = "hf_longexp"
_setup_world()

strand_a = _make_strand("hf_strand_a", phase_offset=0.0,          color=COL_A)
strand_b = _make_strand("hf_strand_b", phase_offset=math.pi,      color=COL_B)

cam = _setup_camera()
cam.location = Vector((CAM_RADIUS, 0.0, CAM_HEIGHT))
bpy.context.view_layer.update()

_setup_render(sc)
sc.render.filepath = PNG_OUT

_export_glb()
print("Scene built. Call build_long_exposure() to run the render pipeline.")

# Uncomment the line below to run the full pipeline automatically:
# build_long_exposure()
