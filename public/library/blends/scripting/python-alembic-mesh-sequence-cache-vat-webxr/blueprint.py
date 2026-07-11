"""
blueprint.py — Python bpy.ops.wm.alembic_import + Mesh Sequence Cache → VAT for WebXR
Blender 5.1  ·  Holoflow Studio  ·  CC0

TECHNIQUE
=========
Alembic (.abc) is an open geometry-cache interchange format from ILM/Sony
(BSD-3-Clause licence, 2011).  It stores per-frame vertex positions without
rigging, which makes it the production standard for cloth caches, liquid-sim
meshes, and rigid-body debris from Houdini, Maya, and Mantaflow.

Blender reads .abc via the Mesh Sequence Cache (MSC) modifier: it replaces
the mesh data per frame from the .abc timeline, with zero baking overhead.
For WebXR you cannot ship a raw .abc — instead bake the animation to a
Vertex Animation Texture (VAT): a float-32 EXR where width = vertex_count,
height = frame_count, and each texel carries (Δx, Δy, Δz) relative to the
rest pose.  The GPU shader adds the offset at the sampled time coordinate.

PIPELINE
=========
1. Build a synthetic animated source (shape-key wave on a subdivided grid).
2. Export source to .abc with bpy.ops.wm.alembic_export().
3. Clear the scene, import .abc → MSC modifier wired automatically.
4. Sample N_FRAMES of evaluated geometry via obj.evaluated_get(depsgraph).
5. Pack offsets into a FLOAT32 EXR using bpy.data.images pixel buffer.
6. Export rest-pose GLB (Draco-6, WebP textures) + EXR + JSON metadata.

KEY DEPARTURE FROM CLOTH VAT (python-cloth-modifier-sim-bake-vertex-animation-texture-webxr)
 • Source: external .abc file, not Blender's internal ClothModifier cache.
 • Layout: offset-from-rest (local-space Δpos) rather than normalised bbox,
   which avoids the shader-side bbox decode and handles large-amplitude sims.
 • No bpy.ops.ptcache.bake() needed — MSC reads straight from .abc on demand.
"""

import json
import math
import os
import bpy
import bmesh
from mathutils import Vector

# ── parameters ──────────────────────────────────────────────────────────────
ABC_PATH       = "/tmp/holoflow_wave.abc"   # intermediate Alembic cache
EXR_PATH       = "//vat_position.exr"       # output VAT texture (float32)
GLB_PATH       = "//alembic_vat_rest.glb"   # rest-pose GLB for WebXR
META_PATH      = "//alembic_vat_meta.json"  # shader decode parameters
N_FRAMES       = 32          # VAT rows — keep power-of-two for GPU compat
GRID_DIVS      = 8           # grid subdivisions each axis; verts = (D+1)²
WAVE_AMPLITUDE = 0.25        # metres — must fit inside GLB bounding box
WAVE_FREQ      = 2.0         # spatial cycles across the grid per revolution
OBJECT_NAME    = "WaveGrid"


# ── helpers ──────────────────────────────────────────────────────────────────
def clear_scene() -> None:
    """Remove all objects and orphaned data blocks."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)


def build_wave_source(scene: bpy.types.Scene) -> bpy.types.Object:
    """
    Subdivided grid animated via shape keys (rotating wave).

    WHY shape keys over a Displace modifier: shape keys bake positions
    directly into .abc vertex data during alembic_export(), whereas a
    modifier would require Apply Modifiers = True in the exporter — which
    causes issues with the modifier stack order when other modifiers exist.
    """
    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=GRID_DIVS,
        y_subdivisions=GRID_DIVS,
        size=1.0,
        location=(0, 0, 0),
    )
    obj = bpy.context.active_object
    obj.name = OBJECT_NAME
    obj.shape_key_add(name="Basis", from_mix=False)

    verts = obj.data.vertices
    for f in range(N_FRAMES):
        t  = f / max(N_FRAMES - 1, 1)        # 0 → 1 over animation
        sk = obj.shape_key_add(name=f"frame_{f:03d}", from_mix=False)
        for vi, v in enumerate(verts):
            px, py = v.co.x, v.co.y
            # Rotating wave: direction angle sweeps 360° over N_FRAMES
            angle = t * 2 * math.pi
            z = WAVE_AMPLITUDE * math.sin(
                2 * math.pi * WAVE_FREQ * (px * math.cos(angle)
                                           + py * math.sin(angle))
            )
            sk.data[vi].co.z = z

    # Animate: one active key per frame, all others muted
    key_blocks = obj.data.shape_keys.key_blocks
    for f in range(N_FRAMES):
        frame_num = f + 1
        kb = key_blocks[f"frame_{f:03d}"]
        for ff in range(1, N_FRAMES + 1):
            kb.value = 1.0 if ff == frame_num else 0.0
            kb.keyframe_insert("value", frame=ff)

    scene.frame_start = 1
    scene.frame_end   = N_FRAMES
    return obj


def export_alembic(filepath: str, frame_start: int, frame_end: int) -> None:
    """Write selected objects to .abc — shape keys baked into vertex data."""
    bpy.ops.wm.alembic_export(
        filepath     = filepath,
        frame_start  = frame_start,
        frame_end    = frame_end,
        selected     = True,
        triangulate  = False,   # preserve quad topology for GLB
        apply_subdiv = True,    # bake any modifier results into geometry
        flatten      = False,   # keep hierarchy
    )


def import_alembic(filepath: str) -> bpy.types.Object:
    """
    Import .abc into the scene.

    The importer adds a Mesh Sequence Cache modifier automatically.
    Blender resolves the .abc per frame via the modifier — no manual
    frame baking required.  frame_set() + depsgraph.update() is enough
    to evaluate the correct geometry at any point in the timeline.
    """
    bpy.ops.wm.alembic_import(
        filepath          = filepath,
        as_background_job = False,
    )
    for obj in bpy.context.selected_objects:
        if obj.type == 'MESH':
            return obj
    raise RuntimeError("alembic_import returned no MESH object — check filepath")


def sample_vat(
    scene: bpy.types.Scene,
    obj:   bpy.types.Object,
    n_frames: int,
) -> tuple[list[list[Vector]], list[Vector]]:
    """
    Evaluate the MSC-driven mesh at each frame and collect vertex positions.

    Uses obj.evaluated_get(depsgraph) rather than bpy.ops modifiers or
    mesh.update_from_editmode() — the evaluated path is the only way to
    get the post-modifier (i.e., post-MSC) positions reliably in headless
    scripts.  obj.to_mesh() is called on the evaluated copy so the
    original data block is never modified.
    """
    dg = bpy.context.evaluated_depsgraph_get()
    frames_positions: list[list[Vector]] = []
    for f in range(n_frames):
        scene.frame_set(f + 1)
        dg.update()
        obj_eval  = obj.evaluated_get(dg)
        mesh_eval = obj_eval.to_mesh()
        frames_positions.append([v.co.copy() for v in mesh_eval.vertices])
        obj_eval.to_mesh_clear()
    return frames_positions, frames_positions[0]


def write_vat_exr(
    frames_positions: list[list[Vector]],
    rest_positions:   list[Vector],
    exr_path: str,
) -> bpy.types.Image:
    """
    Pack per-frame vertex offsets into a FLOAT32 EXR.

    Layout: width = vertex_count, height = frame_count
    RGBA channels: (Δx, Δy, Δz, 1.0) in object-local space.

    WHY offsets not absolute positions: rest + Δ gives the shader one less
    bbox decode and keeps precision focused on the delta magnitude, which
    is much smaller than the absolute world coordinate.

    WHY EXR not PNG: EXR supports float32 per channel natively.  PNG is
    unsigned 8- or 16-bit — encoding float offsets as colour would require
    a range remap and cost precision.
    """
    n_verts  = len(rest_positions)
    n_frames = len(frames_positions)

    img = bpy.data.images.new(
        name         = "vat_position",
        width        = n_verts,
        height       = n_frames,
        float_buffer = True,
        is_data      = True,
    )
    pixels = [0.0] * (n_verts * n_frames * 4)
    for fi, frame in enumerate(frames_positions):
        for vi, pos in enumerate(frame):
            offset = pos - rest_positions[vi]
            idx    = (fi * n_verts + vi) * 4
            pixels[idx]     = offset.x
            pixels[idx + 1] = offset.y
            pixels[idx + 2] = offset.z
            pixels[idx + 3] = 1.0
    img.pixels[:] = pixels
    img.file_format = 'OPEN_EXR'
    img.colorspace_settings.name = 'Non-Color'
    abs_path = bpy.path.abspath(exr_path)
    img.save_render(abs_path)
    return img


def export_rest_glb(
    obj: bpy.types.Object,
    glb_path: str,
    scene: bpy.types.Scene,
) -> None:
    """Export frame-1 rest-pose geometry as WebXR-ready GLB."""
    scene.frame_set(1)
    bpy.context.evaluated_depsgraph_get().update()
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath         = bpy.path.abspath(glb_path),
        use_selection    = True,
        export_format    = "GLB",
        export_animations = False,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = "WEBP",
    )


def write_meta(path: str, n_verts: int, n_frames: int) -> None:
    data = {
        "generator"   : "holoflow alembic_vat_export 1.0 (Blender 5.1)",
        "vertex_count": n_verts,
        "frame_count" : n_frames,
        "vat_layout"  : "width=vertex_count, height=frame_count",
        "channels"    : "RGBA = (delta_x, delta_y, delta_z, 1.0) local-space",
        "webxr_shader": (
            "vec2 uv = vec2((float(vertex_id) + 0.5) / vertex_count, "
            "(frame_t * (frame_count - 1.0) + 0.5) / frame_count); "
            "vec3 offset = texture(uVAT, uv).xyz; "
            "vec3 world_pos = rest_pos + offset;"
        ),
    }
    with open(bpy.path.abspath(path), "w") as fh:
        json.dump(data, fh, indent=2)


# ── main ────────────────────────────────────────────────────────────────────
def run() -> None:
    scene = bpy.context.scene

    # 1 · Build animated wave source
    clear_scene()
    src = build_wave_source(scene)

    # 2 · Export to Alembic
    bpy.ops.object.select_all(action='DESELECT')
    src.select_set(True)
    export_alembic(ABC_PATH, 1, N_FRAMES)
    print(f"[holoflow] .abc written → {ABC_PATH}")

    # 3 · Clear source, import .abc (MSC modifier wired automatically)
    clear_scene()
    abc_obj = import_alembic(ABC_PATH)
    abc_obj.name = OBJECT_NAME + "_vat"

    # 4 · Sample evaluated positions across all frames
    frames_pos, rest_pos = sample_vat(scene, abc_obj, N_FRAMES)
    n_verts = len(rest_pos)
    print(f"[holoflow] sampled {n_verts} verts × {N_FRAMES} frames")

    # 5 · Pack VAT EXR
    write_vat_exr(frames_pos, rest_pos, EXR_PATH)
    print(f"[holoflow] EXR  → {bpy.path.abspath(EXR_PATH)}")

    # 6 · Export rest-pose GLB
    export_rest_glb(abc_obj, GLB_PATH, scene)
    print(f"[holoflow] GLB  → {bpy.path.abspath(GLB_PATH)}")

    # 7 · Write metadata for WebXR shader
    write_meta(META_PATH, n_verts, N_FRAMES)
    print(f"[holoflow] META → {bpy.path.abspath(META_PATH)}")


if __name__ == "__main__":
    run()
