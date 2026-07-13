# Library Override: Link, Override & Propagate Linked Hero Assets for WebXR
## Blender 5.1 — Python `bpy.types.IDOverrideLibrary`

**Topic**: scripting  
**API surface**: `bpy.types.IDOverrideLibrary`, `ID.override_create()`, `ID.override_library_property_add()`, `bpy.ops.wm.link()`, `bpy.ops.outliner.liboverride_resync_hierarchy_enforce()`  
**Blender version**: 5.1  
**Licence**: CC0

---

### What this demonstrates

A studio asset library holds a canonical hero prop — here a faceted gem — saved
in `hero_library.blend`.  A composition scene links that prop with
`bpy.ops.wm.link()` (a live reference, not a copy) then calls
`ID.override_create(remap_local_usages=True)` to produce a **local override**:
an editable proxy whose position and material colour diverge from the library
while remaining structurally tied to it.

When `hero_library.blend` is updated (new topology, new default shader), a resync
via `bpy.ops.outliner.liboverride_resync_hierarchy_enforce()` re-reads the
library and applies only the *non-overridden* properties — location and tint
remain exactly as authored in the composition scene.

### Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full Python pipeline: build library → link → override → export GLB |
| `record.py` | Viewport animation setup for `bpy.ops.render.opengl(animation=True)` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the companion screen recording |
| `hero_library.blend` | *(generated)* canonical hero prop source |
| `library_override_demo.blend` | *(generated)* composition scene with live override |
| `override_composed.glb` | *(generated)* Draco-compressed GLB for WebXR |
| `override_meta.json` | *(generated)* manifest of overridden RNA paths |

### Running

Open Blender 5.1 → Scripting workspace → open `blueprint.py` → Run Script.

The script:
1. Saves `hero_library.blend` at the blend file's directory.
2. Resets to a blank scene via `bpy.ops.wm.read_homefile(use_empty=True)`.
3. Links `gem_hero` from the library, creates an override, enforces location + material.
4. Exports `override_composed.glb` and `override_meta.json`.
5. Saves `library_override_demo.blend`.

### Key API notes (Blender 5.1)

- `ID.override_library` is `None` on a plain linked or local ID; the block only
  exists after `override_create()`.
- `override_create(remap_local_usages=True)` remaps ALL existing uses of the
  linked ID in the current file to the new override.  Omit this flag only if you
  intentionally want both the linked original and the override in the same file.
- `id_override_library_property_add(rna_path, init_from_final=True)` registers a
  property as forcibly overridden.  Without this call, Blender may still RESET the
  property from the library on resync if the override value was never different
  from the library value at resync time.
- The GLB exporter evaluates the depsgraph with overrides fully applied — the
  runtime (Three.js / WebXR) sees the final composed values, not the library defaults.

### Tutorial

`/tutorials/blender-tutorial-python-library-override-id-override-library-webxr`
