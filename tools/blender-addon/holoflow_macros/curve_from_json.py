# holoflow_macros/curve_from_json.py
# Studio macro: rebuild Bézier cable curves from JSON exported by the
# Three.js Holoflow spatial editor.
#
# JSON schema:
# {
#   "cables": [
#     {
#       "name": "power_conduit_01",
#       "bevel_depth": 0.04,
#       "bevel_resolution": 4,
#       "points": [
#         {
#           "co": [x, y, z],
#           "type": "VECTOR",          // handle type: VECTOR|AUTO|ALIGNED|FREE
#           "handle_left":  [x, y, z], // used only for FREE / ALIGNED
#           "handle_right": [x, y, z]
#         }
#       ]
#     }
#   ]
# }
#
# Usage (interactive):  run() from the Scripting workspace
# Usage (headless):     blender --background --python curve_from_json.py -- /path/to/cables.json

import bpy
import json
import os
from mathutils import Vector

BEVEL_DEPTH_DEFAULT      = 0.04
BEVEL_RESOLUTION_DEFAULT = 4
RESOLUTION_U_DEFAULT     = 6
VALID_HANDLE_TYPES       = frozenset({'FREE', 'AUTO', 'VECTOR', 'ALIGNED'})


def _load(json_path: str) -> list:
    with open(json_path, 'r', encoding='utf-8') as fh:
        return json.load(fh).get('cables', [])


def _build_one(cable: dict, col: bpy.types.Collection) -> bpy.types.Object | None:
    name = cable.get('name', 'hf_cable')
    pts  = cable.get('points', [])
    if len(pts) < 2:
        print(f"[hf] Skipping '{name}' — fewer than 2 control points.")
        return None

    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions       = '3D'
    cu.bevel_depth      = float(cable.get('bevel_depth', BEVEL_DEPTH_DEFAULT))
    cu.bevel_resolution = int(cable.get('bevel_resolution', BEVEL_RESOLUTION_DEFAULT))
    cu.fill_mode        = 'FULL'
    cu.resolution_u     = RESOLUTION_U_DEFAULT

    spl = cu.splines.new('BEZIER')
    spl.bezier_points.add(len(pts) - 1)

    for i, pd in enumerate(pts):
        ht = pd.get('type', 'AUTO').upper()
        if ht not in VALID_HANDLE_TYPES:
            ht = 'AUTO'
        bp                  = spl.bezier_points[i]
        bp.co               = Vector(pd.get('co', [0, 0, 0]))
        bp.handle_left_type = bp.handle_right_type = ht
        # Explicit handles only meaningful for FREE / ALIGNED;
        # AUTO + VECTOR have their handles recomputed on evaluation.
        if ht in ('FREE', 'ALIGNED'):
            if 'handle_left'  in pd: bp.handle_left  = Vector(pd['handle_left'])
            if 'handle_right' in pd: bp.handle_right = Vector(pd['handle_right'])

    obj = bpy.data.objects.new(name, cu)
    col.objects.link(obj)
    return obj


def run(json_path: str) -> list:
    if not os.path.isfile(json_path):
        raise FileNotFoundError(f"[hf] JSON not found: {json_path}")

    col = bpy.data.collections.get('HF_Cables')
    if col is None:
        col = bpy.data.collections.new('HF_Cables')
        bpy.context.scene.collection.children.link(col)

    built = [_build_one(c, col) for c in _load(json_path)]
    built = [o for o in built if o is not None]
    print(f"[hf] curve_from_json: {len(built)} cable(s) built from {json_path}")
    return built


if __name__ == "__main__":
    import sys
    if '--' not in sys.argv:
        print("Usage: blender --background --python curve_from_json.py -- /path/to/cables.json")
        sys.exit(1)
    run(sys.argv[sys.argv.index('--') + 1])
