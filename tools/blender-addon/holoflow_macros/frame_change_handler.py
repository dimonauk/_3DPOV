"""
holoflow_macros/frame_change_handler.py
Holoflow Studio · Blender 5.1 · CC0

Reusable pattern for registering a @persistent frame_change_post handler.
Import and call register_handler() / unregister_handler() from any macro or add-on.

Usage
-----
  from holoflow_macros.frame_change_handler import register_handler, unregister_handler

  def my_deformer(scene, depsgraph):
      obj = bpy.data.objects.get('MyMesh')
      if obj is None:
          return
      t = scene.frame_current * 0.05
      mesh = obj.data
      flat = [c for v in mesh.vertices for c in (v.co.x, v.co.y, 0.1 * math.sin(t))]
      mesh.vertices.foreach_set('co', flat)
      mesh.update()

  register_handler('my_deformer', my_deformer)
  # later: unregister_handler('my_deformer')

Tutorial: /tutorials/blender-tutorial-python-app-handler-frame-change-depsgraph
"""

import bpy

# Registry: name → handler function.
_REGISTRY: dict = {}


def register_handler(name: str, fn) -> None:
    """Register fn as a @persistent frame_change_post handler under key name."""
    import bpy  # local re-import safe; ensures module is available at call time

    # Remove existing entry with this name to prevent duplicates.
    unregister_handler(name)

    # Wrap in @persistent if not already marked.
    if not getattr(fn, "_bpy_persistent", False):
        fn = bpy.app.handlers.persistent(fn)

    _REGISTRY[name] = fn
    bpy.app.handlers.frame_change_post.append(fn)
    # Fire immediately to prime the mesh at the current frame.
    fn(bpy.context.scene, bpy.context.evaluated_depsgraph_get())


def unregister_handler(name: str) -> bool:
    """Remove handler registered under key name. Returns True if found."""
    fn = _REGISTRY.pop(name, None)
    if fn is None:
        # Fallback: search by __name__ for handlers registered without this module.
        for existing in list(bpy.app.handlers.frame_change_post):
            if getattr(existing, "__name__", "") == name:
                bpy.app.handlers.frame_change_post.remove(existing)
                return True
        return False
    if fn in bpy.app.handlers.frame_change_post:
        bpy.app.handlers.frame_change_post.remove(fn)
    return True


def unregister_all() -> None:
    """Remove all handlers registered via this module. Call from add-on unregister()."""
    for name in list(_REGISTRY.keys()):
        unregister_handler(name)


def list_handlers() -> list:
    """Return names of all currently registered frame_change_post handlers."""
    return [getattr(fn, "__name__", repr(fn)) for fn in bpy.app.handlers.frame_change_post]
