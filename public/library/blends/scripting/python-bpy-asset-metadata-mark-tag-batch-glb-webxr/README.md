# AssetMetaData — Studio Asset Tagging & Batch GLB Export

**Blender 5.1 · Python scripting · WebXR pipeline**

`bpy.types.ID.asset_mark()` stamps any data-block as a Blender asset
discoverable by the Asset Browser, without requiring UI context. This
tutorial builds a production tagging pipeline: mark a set of scene
objects programmatically, attach structured studio tags and author
metadata, then batch-export every object carrying the `webxr` tag to
its own Draco-compressed GLB — skipping render-only assets automatically.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Creates four props, marks all as assets, exports the three webxr-tagged ones to GLB + manifest JSON |
| `record.py` | 90-frame turntable viewport animation for `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Artefact manifest |

## Expected output

Run `blueprint.py` inside Blender 5.1 (Text Editor → Run Script or
`blender --background --python blueprint.py`) to produce:

- `asset_library_demo.blend` — four asset-marked objects with tags
- `hf_crate_a.glb` — Draco L6, WebP, Y-up
- `hf_lantern_b.glb`
- `hf_spike_c.glb`
- `asset_manifest.json` — machine-readable export log

Run `record.py` against the `.blend` to produce `viewport.mp4`.

## Key API surface

| Symbol | Notes |
|--------|-------|
| `ob.asset_mark()` | Stamps any ID block; idempotent; no UI context needed |
| `ob.asset_clear()` | Removes asset marking |
| `ob.asset_data` | `AssetMetaData` or `None` |
| `ad.tags.new(name)` | Adds a tag; existing name is silently ignored |
| `ad.description` | Free-text description shown in Asset Browser |
| `ad.author` | Author string |
| `ad.catalog_id` | UUID string mapping to `blender_assets.cats.txt` |

## Catalog assignment (advanced)

Catalogues require a `blender_assets.cats.txt` file in the library root. 
See the CATALOG NOTE at the bottom of `blueprint.py` for the pattern.

## Related studio tutorials

- [Collection link, visibility & batch GLB](/tutorials/blender-tutorial-python-bpy-collection-link-visibility-override-batch-glb-webxr)
- [Context temp-override for headless ops](/tutorials/blender-tutorial-python-bpy-context-temp-override-ops-headless-scripting)
- [KDTree attribute transfer to low-poly proxy](/tutorials/blender-tutorial-python-mathutils-kdtree-nearest-attribute-transfer-webxr)

## Outside references

- Blender Foundation — Asset Library system manual (CC-BY-SA-4.0) —
  https://docs.blender.org/manual/en/5.1/files/asset_libraries/index.html
- KhronosGroup/glTF-Blender-IO (Apache-2.0) —
  https://github.com/KhronosGroup/glTF-Blender-IO
