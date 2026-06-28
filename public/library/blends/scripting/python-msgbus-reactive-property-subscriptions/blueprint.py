"""
blueprint.py — Python: bpy.msgbus Reactive Property Subscriptions
Blender 5.1 · Holoflow Studio · CC0

Technique: bpy.msgbus lets you subscribe to RNA property changes at zero
per-frame cost — the callback fires ONLY when the subscribed property mutates.
That makes it the correct primitive for a dirty-tracking export pipeline:
mark objects for re-export exactly when they change, not on every frame tick.

Why msgbus instead of frame_change_post?
  frame_change_post fires on every timeline step even if zero relevant
  properties changed — wasteful for export triggers.  An app-handler
  polling loop on frame_change_post at 60 fps = 3 600 calls per minute.
  msgbus fires at MOST once per user edit — the difference is 3 600x.

Two subscription strategies are demonstrated:
  A. Class-level  (bpy.types.SomeType, "prop") — fires for any instance.
     Cheap to register; callback must scan bpy.context to find which object.
  B. Per-object   obj.prop.path_resolve("field", False) as key — fires for
     a specific instance; callback receives the object via args=.
     Costs one subscribe() call per object; required when you need exact identity.

Studio hook: the PropertyGroup adds holoflow.facet (marks mesh as flat-shaded
facet target for the WebXR exporter) and holoflow.dirty (export queue flag).
"""

import bpy
from bpy.props import BoolProperty, PointerProperty

# ── Constants ─────────────────────────────────────────────────────────────────
OWNER_TOKEN  = object()      # module-level sentinel; clear_by_owner() uses it
EXPORT_DIR   = "//output/"   # relative to .blend; resolved to abs at export time

# ── PropertyGroup ─────────────────────────────────────────────────────────────
# Using bpy.props gives each property an RNA descriptor with a stable path —
# a prerequisite for class-level msgbus subscription.  Raw IDProperties
# (obj["key"] = value) do not register RNA descriptors and cannot be subscribed
# to via (type, "name") syntax; they require path_resolve per-instance.
class HoloflowObjectProps(bpy.types.PropertyGroup):
    dirty: BoolProperty(
        name="Export Dirty",
        description="Set to True by msgbus callbacks; cleared after GLB export",
        default=False,
    )
    facet: BoolProperty(
        name="Holoflow Facet",
        description="Mark object for flat-shaded faceted normal treatment in WebXR",
        default=False,
    )


def _register_property_group() -> None:
    """Idempotent: unregister first to allow script re-runs without TypeError."""
    try:
        bpy.utils.unregister_class(HoloflowObjectProps)
    except RuntimeError:
        pass
    bpy.utils.register_class(HoloflowObjectProps)
    # Attach pointer to Object type.  Blender silently skips re-attachment if
    # the attribute already exists, so this is safe to call repeatedly.
    if not hasattr(bpy.types.Object, "holoflow"):
        bpy.types.Object.holoflow = PointerProperty(type=HoloflowObjectProps)


# ── Subscription callbacks ────────────────────────────────────────────────────
def _on_any_facet_change() -> None:
    """Class-level callback for (HoloflowObjectProps, 'facet').

    msgbus callbacks receive ONLY the positional args you passed in args=.
    For a class-level subscription, there is no implicit 'self' — Blender has
    no concept of which instance triggered the call at this level.  The pattern
    is therefore: inspect bpy.context.active_object or iterate bpy.data.objects.

    We mark the active object dirty if it has the property group; this covers
    the common case where the user edits the active object's panel.  Pipelines
    that need exact tracking should prefer strategy B below.
    """
    obj = bpy.context.active_object
    if obj and hasattr(obj, "holoflow"):
        obj.holoflow.dirty = True
        print(f"[holoflow:msgbus] class-level: {obj.name}.holoflow.facet changed"
              f" → dirty=True")


def _make_object_facet_callback(obj: bpy.types.Object):
    """Factory: returns a callback that closes over a specific object reference.

    Strategy B: one subscription per object.  The object is captured in the
    closure so the callback knows exactly which instance changed without any
    context inspection.  Risk: if the object is deleted without first calling
    clear_by_owner(), the subscription becomes a dangling reference.  Blender
    handles this gracefully (calls the callback with a freed StructRNA pointer),
    so always clear subscriptions before rebuilding or on file load.
    """
    def _cb(captured_obj: bpy.types.Object) -> None:
        if captured_obj and captured_obj.name in bpy.data.objects:
            captured_obj.holoflow.dirty = True
            print(f"[holoflow:msgbus] per-object: {captured_obj.name}.facet → dirty")
    return _cb


# ── Subscription registration ─────────────────────────────────────────────────
def register_subscriptions() -> None:
    """Clear stale subscriptions then re-register both strategies.

    Call this:
      - At script startup (before scene setup)
      - In a @persistent load_post handler after file load (objects change)
      - After adding or deleting objects

    options={"PERSISTENT"} means subscriptions survive bpy.ops.wm.read_blend()
    — useful for class-level subscriptions where the key is a type, not a
    per-file object reference.  For per-object subscriptions, PERSISTENT is
    less useful because the object reference itself becomes invalid after load.
    """
    bpy.msgbus.clear_by_owner(OWNER_TOKEN)

    # Strategy A: class-level facet subscription
    bpy.msgbus.subscribe_rna(
        key=(HoloflowObjectProps, "facet"),
        owner=OWNER_TOKEN,
        args=(),
        notify=_on_any_facet_change,
        options={"PERSISTENT"},
    )

    # Strategy B: per-object name subscription (watch rename → mark dirty)
    # bpy.types.Object.name is a built-in RNA string property; class-level key
    # is simply the attribute accessor on the type.
    bpy.msgbus.subscribe_rna(
        key=(bpy.types.Object, "name"),
        owner=OWNER_TOKEN,
        args=(),
        notify=lambda: print("[holoflow:msgbus] an object was renamed"),
        options={"PERSISTENT"},
    )

    # Strategy B (per-object, facet): iterate current objects
    for obj in bpy.data.objects:
        if not hasattr(obj, "holoflow"):
            continue
        # path_resolve("facet", False) returns the RNA (StructRNA, PropertyRNA)
        # pair for this specific instance of HoloflowObjectProps.  As a key,
        # msgbus watches THIS object's facet only — not every object's.
        try:
            rna_key = obj.holoflow.path_resolve("facet", False)
        except ValueError:
            continue  # property not yet on this object's data block
        bpy.msgbus.subscribe_rna(
            key=rna_key,
            owner=OWNER_TOKEN,
            args=(obj,),
            notify=_make_object_facet_callback(obj),
        )

    count = len(bpy.data.objects)
    print(f"[holoflow:msgbus] registered: 2 class-level + {count} per-object subscriptions")


# ── Dirty-export function ─────────────────────────────────────────────────────
def export_dirty_objects() -> list[str]:
    """Export each dirty object as a solo GLB then clear its dirty flag.

    Uses bpy.context.temp_override() (introduced Blender 4.0) rather than the
    deprecated context-dict form.  temp_override supplies a fake context for
    context-sensitive operators without needing a real UI area — correct for
    headless export scripts and background renders.
    """
    exported: list[str] = []
    view_layer = bpy.context.view_layer

    for obj in bpy.data.objects:
        props = getattr(obj, "holoflow", None)
        if props is None or not props.dirty:
            continue

        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        view_layer.objects.active = obj

        outpath = f"{EXPORT_DIR}{obj.name}.glb"

        # export_scene.gltf requires a VIEW_3D area in classic context;
        # temp_override provides one without needing a real window.
        with bpy.context.temp_override(
            active_object=obj,
            selected_objects=[obj],
        ):
            bpy.ops.export_scene.gltf(
                filepath=outpath,
                use_selection=True,
                export_format="GLB",
                export_yup=True,
                export_apply=True,
                export_image_format="WEBP",
                export_draco_mesh_compression_enable=True,
                export_draco_mesh_compression_level=6,
            )

        props.dirty = False
        exported.append(outpath)
        print(f"[holoflow:export] {obj.name} → {outpath}")

    return exported


# ── Persistence handlers ──────────────────────────────────────────────────────
@bpy.app.handlers.persistent
def _on_load_post(_) -> None:
    """Re-register after any file load.

    PERSISTENT subscriptions (class-level) survive load if the key is a type
    object that still exists.  Per-object subscriptions do NOT survive load
    because the object references they closed over are from the previous file
    and are now invalid.  Re-registering all subscriptions here is the safest
    blanket approach regardless of strategy mix.
    """
    _register_property_group()
    register_subscriptions()


def _attach_load_handler() -> None:
    if _on_load_post not in bpy.app.handlers.load_post:
        bpy.app.handlers.load_post.append(_on_load_post)


def _detach_load_handler() -> None:
    if _on_load_post in bpy.app.handlers.load_post:
        bpy.app.handlers.load_post.remove(_on_load_post)


# ── Demo: publish_rna to fire a subscription manually ────────────────────────
def _demo_publish(obj: bpy.types.Object) -> None:
    """bpy.msgbus.publish_rna() fires all subscriptions for a given key without
    actually mutating the property.  Useful for testing: verify your callback
    fires before wiring up real user-facing UI.

    Note: publish_rna takes the same key form as subscribe_rna.
    """
    bpy.msgbus.publish_rna(key=(HoloflowObjectProps, "facet"))
    print(f"[holoflow:msgbus] manually published facet change for {obj.name}")


# ── Scene setup ───────────────────────────────────────────────────────────────
def build_demo_scene() -> None:
    """Wire up the full pipeline in a clean scene and exercise each path."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _register_property_group()
    _attach_load_handler()
    register_subscriptions()

    # Three primitives with distinct holoflow.facet states
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0))
    cube = bpy.context.active_object
    cube.name = "hs_cube"

    bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, location=(3, 0, 0))
    sphere = bpy.context.active_object
    sphere.name = "hs_sphere"
    sphere.holoflow.facet = True   # fires class-level + per-object callback

    bpy.ops.mesh.primitive_cylinder_add(vertices=6, location=(-3, 0, 0))
    cylinder = bpy.context.active_object
    cylinder.name = "hs_cylinder"
    cylinder.holoflow.facet = True  # fires again

    # Demonstrate manual publish — does not mutate, but exercises callback
    _demo_publish(cube)

    # Print dirty state before export
    for obj in bpy.data.objects:
        props = getattr(obj, "holoflow", None)
        print(f"  {obj.name:20s}  facet={getattr(props, 'facet', '?')}"
              f"  dirty={getattr(props, 'dirty', '?')}")

    print("[holoflow:msgbus] demo complete — call export_dirty_objects() to flush")


if __name__ == "__main__":
    build_demo_scene()
