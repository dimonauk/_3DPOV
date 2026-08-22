"""
holoflow_macros/screw_revolve.py
Reusable helper: attach a Screw + SubDiv modifier stack to an existing object.
Call from a script or a custom operator after building your profile mesh.

Blender 5.1 | CC0
"""

import bpy
import math


def apply_screw_stack(
    obj: bpy.types.Object,
    *,
    axis: str = 'Z',
    steps: int = 48,
    pitch: float = 0.0,
    iterations: int = 1,
    subdiv_levels: int = 2,
) -> tuple[bpy.types.Modifier, bpy.types.Modifier]:
    """
    Attaches Screw → SubDiv to obj and returns (scr_mod, sub_mod).

    Parameters
    ----------
    obj          : Object whose mesh contains the edge-chain profile.
    axis         : Revolution axis — 'X', 'Y', or 'Z'.
    steps        : Faces around circumference (LOD control).
    pitch        : screw_offset in metres per 360° turn; 0 = closed.
    iterations   : Number of full revolutions.
    subdiv_levels: Catmull-Clark levels (0 = no SubDiv).
    """
    scr = obj.modifiers.new("Screw", "SCREW")
    scr.axis                 = axis
    scr.steps                = steps
    scr.render_steps         = steps
    scr.screw_offset         = pitch
    scr.iterations           = iterations
    scr.angle                = math.radians(360)
    scr.use_merge_vertices   = True
    scr.merge_threshold      = 0.0001
    scr.use_smooth_shade     = True
    scr.use_normal_calculate = True
    scr.use_normal_flip      = False

    sub = obj.modifiers.new("SubDiv", "SUBSURF")
    sub.subdivision_type = 'CATMULL_CLARK'
    sub.levels           = subdiv_levels
    sub.render_levels    = max(subdiv_levels, subdiv_levels + 1)
    sub.use_creases      = True

    return scr, sub


def export_selection_glb(path: str, *, draco_level: int = 6) -> None:
    """Export current selection as a Draco-compressed Y-up GLB."""
    bpy.ops.export_scene.gltf(
        filepath=path,
        use_selection=True,
        export_format='GLB',
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=draco_level,
        export_image_format='WEBP',
        export_yup=True,
    )
