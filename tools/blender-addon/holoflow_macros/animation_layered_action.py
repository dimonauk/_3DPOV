"""
holoflow_macros/animation_layered_action.py
Blender 5.1+

Reusable helper for adding additive animation layers to an existing Action
in the Holoflow export pipeline.  Designed to be called from blueprint scripts
or the holoflow_webxr_exporter add-on after the base Action is built.

Public API:
  build_additive_layer(action, slot, name, blend_mode, fcurve_data, influence)
  ensure_channelbag(strip, slot)
"""

import bpy
from typing import Sequence


def ensure_channelbag(strip, slot):
    """Return the ChannelBag for *slot* in *strip*, creating one if absent.

    channelbag_for_slot() returns None on freshly created strips in some
    Blender 5.x builds.  This wrapper handles both cases.
    """
    bag = strip.channelbag_for_slot(slot)
    if bag is None:
        bag = strip.channelbags.new(slot=slot)
    return bag


def build_additive_layer(
    action,
    slot,
    name: str,
    blend_mode: str = "ADD",
    fcurve_data: Sequence[dict] | None = None,
    influence: float = 1.0,
):
    """Add an additive layer to *action* for the given *slot*.

    Parameters
    ----------
    action:
        bpy.types.Action — the shared action to modify.
    slot:
        bpy.types.ActionSlot — must belong to *action*.
    name:
        Layer name shown in the Action Editor.
    blend_mode:
        "REPLACE" | "ADD" | "COMBINE" | "SUBTRACT" | "MULTIPLY"
    fcurve_data:
        List of dicts, each describing one FCurve:
          {
            "data_path": str,        # e.g. 'pose.bones["ribcage"].scale'
            "index": int,            # channel index (0=X, 1=Y, 2=Z)
            "keyframes": [(frame, value), ...],
            "interpolation": str,    # "BEZIER" | "LINEAR" | "CONSTANT"
          }
        Pass None to create an empty layer shell (caller inserts keyframes).
    influence:
        Layer influence weight, 0.0–1.0.

    Returns
    -------
    (layer, strip, bag) — the created Layer, Strip, and ChannelBag for chaining.
    """
    layer = action.layers.new(name=name)
    layer.blend_mode = blend_mode
    layer.influence  = influence

    strip = layer.strips.new(type="KEYFRAME")
    bag   = ensure_channelbag(strip, slot)

    if fcurve_data:
        for fd in fcurve_data:
            fc = bag.fcurves.new(data_path=fd["data_path"], index=fd.get("index", 0))
            for frame, value in fd.get("keyframes", []):
                kp = fc.keyframe_points.insert(frame=float(frame), value=float(value))
                kp.interpolation = fd.get("interpolation", "BEZIER")
            fc.update()

    return layer, strip, bag


def list_layers(action) -> None:
    """Debug helper: print all layers with their blend mode and influence."""
    for i, l in enumerate(action.layers):
        n_fcurves = sum(
            len(s.channelbag_for_slot(sl).fcurves)
            for s in l.strips
            for sl in action.slots
            if s.channelbag_for_slot(sl) is not None
        )
        print(f"  [{i}] {l.name!r:30s}  {l.blend_mode:10s}  inf={l.influence:.2f}  fcurves={n_fcurves}")
