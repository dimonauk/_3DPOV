"""
holoflow_macros/addon_preferences_keymap.py
Blender 5.1 — reusable helpers for AddonPreferences + KeyMap lifecycle.

Import in any Holoflow add-on module:
    from holoflow_macros.addon_preferences_keymap import (
        make_preferences_class, register_keymap, unregister_keymap
    )

Licence: CC0
"""

from __future__ import annotations
import bpy


def get_addon_prefs(module_name: str):
    """
    Return the AddonPreferences instance for *module_name*.

    Usage:
        prefs = get_addon_prefs(__name__)
        output_path = bpy.path.abspath(prefs.export_root)
    """
    return bpy.context.preferences.addons[module_name].preferences


def register_keymap(
    op_idname: str,
    key: str,
    ctrl: bool = False,
    shift: bool = False,
    alt: bool = False,
    space_type: str = 'VIEW_3D',
    keymap_name: str = '3D View',
    store: list | None = None,
) -> tuple:
    """
    Register a keyboard shortcut for *op_idname* in the addon keyconfig.

    Returns (km, kmi) and, if *store* is a list, appends to it for later
    unregister.

    WHY addon keyconfig?  Registering to keyconfigs.addon means the user can
    rebind or disable the shortcut from Edit > Preferences > Keymap without
    the add-on source being touched, and unregister() can cleanly remove it.
    """
    wm = bpy.context.window_manager
    kc = wm.keyconfigs.addon
    if not kc:
        return (None, None)

    km  = kc.keymaps.new(name=keymap_name, space_type=space_type)
    kmi = km.keymap_items.new(
        idname = op_idname,
        type   = key,
        value  = 'PRESS',
        ctrl   = ctrl,
        shift  = shift,
        alt    = alt,
    )
    kmi.active = True
    if store is not None:
        store.append((km, kmi))
    return (km, kmi)


def unregister_keymap(store: list) -> None:
    """
    Remove all (km, kmi) pairs recorded in *store* and clear the list.
    Call this BEFORE unregister_class() to avoid dangling references.
    """
    for km, kmi in store:
        try:
            km.keymap_items.remove(kmi)
        except ReferenceError:
            pass
    store.clear()
