# Holoflow WebXR exporter — scene validators.
#
# Pure functions that walk the active scene and return a list of message
# dicts. Each message is `{ severity, object_name, message }`. The
# operator collects them and feeds the info bar; future CI hooks can
# call the same functions and fail the build on any "error".
#
# Thresholds cross-reference docs/WEBXR-DEVICE-TARGETS.md, section 3.
# When that doc moves, move these.

import re
from typing import List, Dict


# Message type — a TypedDict would be nicer but the add-on targets
# Blender 4.0+ which ships Python 3.10, and we want zero dep load.
Message = Dict[str, str]


_SLUG_RE = re.compile(r"^[a-z0-9_]+$")


def _mesh_objects(scene):
    return [obj for obj in scene.objects if obj.type == "MESH" and obj.data]


def _evaluated_tri_count(obj, depsgraph) -> int:
    """Count triangles on the *evaluated* mesh — modifiers applied."""
    try:
        eval_obj = obj.evaluated_get(depsgraph)
        mesh = eval_obj.to_mesh()
    except Exception:  # noqa: BLE001 — Blender API quirks vary by version
        return 0

    try:
        mesh.calc_loop_triangles()
        count = len(mesh.loop_triangles)
    finally:
        try:
            eval_obj.to_mesh_clear()
        except Exception:  # noqa: BLE001
            pass
    return count


def validate_tri_count(scene, budget: int) -> List[Message]:
    """Flag any mesh whose evaluated tri-count blows the preset budget.

    The budget is a per-object working ceiling; the whole-scene cap is
    enforced elsewhere (gallery layout, splat-walker scene manifest).
    """
    import bpy

    messages: List[Message] = []
    depsgraph = bpy.context.evaluated_depsgraph_get()
    for obj in _mesh_objects(scene):
        tris = _evaluated_tri_count(obj, depsgraph)
        if tris == 0:
            continue
        if tris > budget:
            messages.append(
                {
                    "severity": "error",
                    "object_name": obj.name,
                    "message": (
                        f"{tris:,} triangles exceeds preset budget of "
                        f"{budget:,}. Decimate or split before export."
                    ),
                }
            )
        elif tris > budget * 0.8:
            messages.append(
                {
                    "severity": "warning",
                    "object_name": obj.name,
                    "message": (
                        f"{tris:,} triangles — within 80% of the "
                        f"{budget:,} budget. Leaves no headroom for siblings."
                    ),
                }
            )
    return messages


def validate_uvs(scene) -> List[Message]:
    """Every mesh that ships materials needs at least one UV layer."""
    messages: List[Message] = []
    for obj in _mesh_objects(scene):
        if not obj.material_slots:
            continue
        has_material = any(slot.material for slot in obj.material_slots)
        if not has_material:
            continue
        if not obj.data.uv_layers:
            messages.append(
                {
                    "severity": "error",
                    "object_name": obj.name,
                    "message": (
                        "Material assigned but no UV layer present. "
                        "Unwrap or strip the material before export."
                    ),
                }
            )
    return messages


def validate_ngons(scene) -> List[Message]:
    """Flag n-gons and zero-area faces.

    glTF tolerates n-gons by triangulating on export, but the studio
    prefers explicit triangulation so the artist sees what the engine
    will see. Zero-area faces are an outright error — they ship as
    invisible junk and lying about the triangle count.
    """
    messages: List[Message] = []
    for obj in _mesh_objects(scene):
        mesh = obj.data
        ngons = 0
        zero_area = 0
        for poly in mesh.polygons:
            if len(poly.vertices) > 4:
                ngons += 1
            if poly.area <= 0.0:
                zero_area += 1
        if ngons:
            messages.append(
                {
                    "severity": "warning",
                    "object_name": obj.name,
                    "message": (
                        f"{ngons} n-gon(s) present. Triangulate before "
                        f"export so the artist controls the topology."
                    ),
                }
            )
        if zero_area:
            messages.append(
                {
                    "severity": "error",
                    "object_name": obj.name,
                    "message": (
                        f"{zero_area} zero-area face(s) found. "
                        f"Merge or delete the degenerate geometry."
                    ),
                }
            )
    return messages


def validate_naming(scene) -> List[Message]:
    """Every root object should be snake_case so the JSON schema reads."""
    messages: List[Message] = []
    seen: Dict[str, str] = {}
    for obj in scene.objects:
        if obj.parent is not None:
            continue
        name = obj.name
        if not _SLUG_RE.match(name):
            messages.append(
                {
                    "severity": "warning",
                    "object_name": name,
                    "message": (
                        "Root object name is not snake_case. Exporter "
                        "will auto-rename, but rename it yourself for a "
                        "predictable git diff."
                    ),
                }
            )
        lower = name.lower()
        if lower in seen and seen[lower] != name:
            messages.append(
                {
                    "severity": "error",
                    "object_name": name,
                    "message": (
                        f"Case-insensitive name collision with "
                        f"'{seen[lower]}'. Public/models/ on case-"
                        f"insensitive file systems will clobber one."
                    ),
                }
            )
        seen[lower] = name
    return messages
