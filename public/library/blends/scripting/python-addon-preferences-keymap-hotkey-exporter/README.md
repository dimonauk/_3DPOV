# Python AddonPreferences + KeyMap Registration
**Blender 5.1 | Scripting | CC0**

Persistent user-level settings panel and custom hotkey for the Holoflow WebXR
exporter — no scene custom properties, no polling, no hard-coded shortcuts.

---

## What this builds

A minimal Holoflow add-on module that:

1. Registers a `bpy.types.AddonPreferences` subclass so the user's export root,
   Draco level, WebP flag, and verbose mode survive across every .blend file
   and every Blender restart.
2. Registers `Ctrl+Shift+E` (3D View) via `wm.keyconfigs.addon` so the user
   can rebind it from the Keymap editor without touching the add-on source.
3. Exposes `get_prefs()` — a tiny helper any other operator can call to
   read the live preferences without knowing the add-on's module name.

---

## Key concepts

### AddonPreferences vs scene custom properties

| Concern             | AddonPreferences              | Scene custom prop         |
|---------------------|-------------------------------|---------------------------|
| Scope               | Per-user, cross-blend         | Per .blend file           |
| Location            | user config dir (userpref)    | `bpy.context.scene`       |
| UI location         | Edit > Prefs > Add-ons panel  | Properties > Scene panel  |
| Access              | `preferences.addons[id].preferences` | `scene["key"]`   |
| Survives blend reload | Yes                        | No (belongs to the scene) |

### KeyMap hierarchy

```
bpy.context.window_manager.keyconfigs
  ├── default     — factory keybindings (read-only)
  ├── user        — the user's overrides (Edit > Preferences > Keymap)
  └── addon       — add-on registrations (our target)
```

Registering to `keyconfigs.addon` means the default factory map is never
modified.  The user can always inspect, rebind, or disable the shortcut
from the Keymap editor.

### The lifecycle

```
register()
  └── register_class(HOLOFLOW_Preferences)
  └── register_class(HOLOFLOW_OT_quick_webxr_export)
  └── _register_keymap()
        └── kc.keymaps.new('3D View')
        └── km.keymap_items.new('holoflow.quick_webxr_export', ...)
        └── store (km, kmi) in _keymap_items[]

unregister()
  └── _unregister_keymap()   ← must run BEFORE unregister_class()
        └── km.keymap_items.remove(kmi) for each stored item
  └── unregister_class(...)
```

If you unregister the operator before removing keymap items referencing it,
Blender logs a warning about dangling references.  Always unregister keymaps
first.

---

## Running the blueprint

```
Scripting workspace → Open blueprint.py → Run Script
```

After running:

- Edit > Preferences > Add-ons > search "Holoflow" → expand to see Preferences
- 3D View → Ctrl+Shift+E to trigger a quick export
- Python Console: `bpy.context.preferences.addons[__name__].preferences.export_root`

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full add-on: Preferences class, operator, keymap |
| `record.py`    | Viewport animation — idle → export flash |
| `SCREEN-RECORDING-NOTES.md` | OBS takes for screen.mp4 |

Videos land in `public/library/videos/scripting/python-addon-preferences-keymap-hotkey-exporter/`
when Dimona runs `record.py` locally.
