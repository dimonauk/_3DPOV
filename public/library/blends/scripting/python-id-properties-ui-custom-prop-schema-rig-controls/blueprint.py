"""
Python bpy.types.IDPropertyUIManager — Custom Property Schema for Rig Controls
Blender 5.1 · CC0 · Holoflow Studio

Technique:
  Every Blender ID block (Object, Armature, Mesh, Material …) carries an open
  key/value store accessible as obj["key"] = value.  In Blender 3.3+,
  id_properties_ui("key") returns an IDPropertyUIManager that lets you attach
  soft_min, soft_max, description, step, precision, and subtype hints — all
  serialised into the .blend without requiring a registered add-on class.

  This is the correct mechanism for per-rig slider data that must survive
  library linking, library override, and NLA-baked export.  Compare with
  bpy.props.FloatProperty on a PropertyGroup, which requires the defining add-on
  to be installed in the receiving file to deserialise its property metadata.

Why NOT PropertyGroup for rig controls?
  A bpy.props PropertyGroup is a Python class registered with Blender's RNA.
  That class registration lives only in the add-on's Python session.  When you
  link a character .blend into a shot file, the linked Armature object arrives
  with its custom Property Group values stored as raw integers/floats — but the
  metadata (panel labels, min/max, descriptions) is GONE unless the same add-on
  is also installed and registered in the shot file.

  Custom ID properties are different: the key + value + UIManager schema are
  serialised as a unit inside the ID block.  No external class required.

Outside sources:
  Blender Foundation — IDPropertyUIManager API Reference
    https://docs.blender.org/api/5.1/bpy.types.IDPropertyUIManager.html
    CC-BY-SA 4.0
  Blender Foundation — bpy_struct.id_properties_ui() / id_properties_ensure()
    https://docs.blender.org/api/5.1/bpy.types.bpy_struct.html
    CC-BY-SA 4.0  |  Sibling: https://www.blender.org
"""

import bpy

# ── Constants ─────────────────────────────────────────────────────────────────
RIG_NAME  = "rig_crystal_familiar"
MESH_NAME = "mesh_crystal_familiar"

# (key, default, soft_min, soft_max, description, subtype, step, precision)
# subtype values: NONE | FACTOR | DISTANCE | ANGLE | TIME | VELOCITY | COLOR
FLOAT_SLIDERS = [
    ("wing_spread",  0.0,  0.0, 1.0,
     "How far the wings are extended (0 = folded, 1 = fully open).",
     "FACTOR", 1, 3),
    ("tail_curl",    0.0, -1.0, 1.0,
     "Tail curvature: -1 = coiled, 0 = neutral, 1 = arched up.",
     "FACTOR", 1, 3),
    ("horn_glow",    0.0,  0.0, 1.0,
     "Emission strength of horn crystal clusters, normalised 0-1.",
     "FACTOR", 1, 3),
    ("eye_dilation", 0.5,  0.0, 1.0,
     "Pupil dilation mapped to the eye iris shader.",
     "FACTOR", 1, 3),
    ("breath_phase", 0.0,  0.0, 1.0,
     "Phase of the chest-breath shape key, NLA-driven 0-1.",
     "FACTOR", 1, 3),
]

INT_SELECTORS = [
    ("lod_level",    0, 0, 3,
     "Active LOD level: 0 = full geometry, 3 = billboard proxy.",
     "NONE"),
    ("wing_variant", 0, 0, 4,
     "Wing topology variant: 0 = membrane, 1–3 = feather types, 4 = bat.",
     "NONE"),
]

# Booleans stored as int [0,1] — no native bool ID prop type in bpy.
BOOL_FLAGS = [
    ("export_ready", False,
     "All modifiers applied, UV islands packed, ready for GLB batch export."),
    ("ik_enabled",   True,
     "IK chain active; set False to switch to FK override for mocap retarget."),
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def add_float(target, key, default, soft_min, soft_max, desc,
              subtype="NONE", step=1, precision=3, overridable=True):
    """
    Create or overwrite a float ID property and attach its UIManager schema.

    soft_min/soft_max constrain the slider widget only; the stored value can
    exceed these bounds (useful when animators need to push past the UI range).
    Hard min/max clamp the value in memory — use these for physically impossible
    negatives (DISTANCE subtype: hard_min=0.0).

    is_overridable_library marks the property so that library-override instances
    can set their own value independently.  Without this flag, every linked copy
    of the rig shares the source library value — the slider appears greyed-out
    in linked scenes.
    """
    target[key] = float(default)
    ui = target.id_properties_ui(key)
    ui.update(
        soft_min=soft_min,
        soft_max=soft_max,
        description=desc,
        subtype=subtype,
        step=step,
        precision=precision,
        is_overridable_library=overridable,
    )


def add_int(target, key, default, soft_min, soft_max, desc,
            subtype="NONE", overridable=True):
    target[key] = int(default)
    ui = target.id_properties_ui(key)
    ui.update(
        soft_min=soft_min,
        soft_max=soft_max,
        description=desc,
        subtype=subtype,
        is_overridable_library=overridable,
    )


def add_bool(target, key, default: bool, desc: str, overridable=True):
    """
    Boolean stored as int.  step=1, precision=0 makes the Properties panel
    render a toggle checkbox rather than a numeric spinner when the value is
    in [0, 1] with integer step.
    """
    target[key] = int(default)
    ui = target.id_properties_ui(key)
    ui.update(
        soft_min=0,
        soft_max=1,
        step=1,
        precision=0,
        description=desc,
        is_overridable_library=overridable,
    )


def add_nested_group(target, group_key: str, leaves: dict):
    """
    Create a nested property namespace using id_properties_ensure().

    id_properties_ensure() returns the IDPropertyGroup (a dict-like object)
    at this ID block, creating it if absent.  Assigning a dict to a key inside
    it creates a sub-group.  Sub-groups appear as collapsible rows in the Custom
    Properties panel.

    Limitation: you CANNOT call id_properties_ui() on the sub-group key itself
    — only on leaf (scalar) values.  The sub-group header has no schema.
    """
    root = target.id_properties_ensure()
    root[group_key] = {}
    for k, v in leaves.items():
        root[group_key][k] = v


def dump_schemas(target, label: str):
    """Print every custom property and its schema to the console."""
    print(f"\n── {label} ──")
    for key in target.keys():
        val = target[key]
        try:
            schema = target.id_properties_ui(key).as_dict()
            print(f"  {key:<22} = {str(val):<8}  {schema}")
        except TypeError:
            # Nested IDPropertyGroup: no top-level UIManager schema
            print(f"  {key:<22} = {val!r}  (group — no scalar schema)")


# ── Scene setup ───────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.wm.read_homefile(use_empty=True)
    bpy.context.scene.name = "crystal_familiar_scene"


def make_armature() -> bpy.types.Object:
    arm = bpy.data.armatures.new(RIG_NAME)
    obj = bpy.data.objects.new(RIG_NAME, arm)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def make_mesh() -> bpy.types.Object:
    mesh = bpy.data.meshes.new(MESH_NAME)
    obj  = bpy.data.objects.new(MESH_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


# ── Demo: keyframe a custom property ─────────────────────────────────────────

def keyframe_custom_prop(obj, key: str, frame_value_pairs: list):
    """
    Insert fcurve keyframes on a custom ID property.
    data_path format: '["key"]'  — the square-bracket notation is mandatory.
    Plain dot notation (data_path="key") only works for official RNA properties,
    not ID props.
    """
    dp = f'["{key}"]'
    for frame, value in frame_value_pairs:
        obj[key] = value
        obj.keyframe_insert(data_path=dp, frame=frame)
    # Smooth Bezier interpolation
    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            if fc.data_path == dp:
                for kp in fc.keyframe_points:
                    kp.interpolation = "BEZIER"


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    clear_scene()

    rig  = make_armature()
    mesh = make_mesh()

    # Float sliders on the armature object
    for key, default, smin, smax, desc, subtype, step, prec in FLOAT_SLIDERS:
        add_float(rig, key, default, smin, smax, desc, subtype, step, prec)

    # Integer selectors on the armature object
    for key, default, smin, smax, desc, subtype in INT_SELECTORS:
        add_int(rig, key, default, smin, smax, desc, subtype)

    # Boolean flags on the armature object
    for key, default, desc in BOOL_FLAGS:
        add_bool(rig, key, default, desc)

    # Nested metadata group on the mesh — read by holoflow GLB exporter
    add_nested_group(mesh, "holoflow", {
        "facet":        "faceted",  # holoflow:facet routing flag
        "export_scale": 1.0,        # world-units → metres conversion
        "lod_count":    2,          # number of baked LOD variants
    })

    # Demo animation: wing_spread sweeps 0 → 1 over 60 frames
    bpy.context.scene.frame_end = 60
    keyframe_custom_prop(rig, "wing_spread", [(1, 0.0), (60, 1.0)])

    dump_schemas(rig,  "Armature custom properties")
    dump_schemas(mesh, "Mesh custom properties")

    print("\n[holoflow] Schema setup complete.")
    print("[holoflow] Save the .blend — all schemas survive file reload without add-on.")


if __name__ == "__main__":
    main()
