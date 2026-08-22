# Python USD Export — USDZ Pipeline for Spatial Computing
**Blender 5.1 · Scripting · CC0**

Demonstrates the complete Blender-to-USDZ delivery pipeline:

1. **Build a representative scene** — faceted gem, floor plane, area light, orbit camera with a turntable animation.
2. **Register a `bpy.types.USDHook`** — stamps every exported USD prim with `holoflow:` namespace metadata (facet flags, export source, material class) using the `pxr` Python bindings bundled with Blender.
3. **Export `.usdc`** — calls `bpy.ops.wm.usd_export()` with explicit production settings: `generate_preview_surface=True` (required for Apple RealityKit), `convert_orientation=True` (Blender Z-up → USD Y-up), `use_instancing=True` (GN instances → USD PointInstancer), `export_textures=True`.
4. **Package `.usdz`** — wraps the `.usdc` + exported textures into a USDZ archive using Python's `zipfile` module with `ZIP_STORED` (no compression, required by Apple's Quick Look parser).
5. **Write an export manifest** — JSON sidecar listing USDC/USDZ paths, frame range, up-axis, and spatial target platforms.

## Key decisions

| Decision | Chosen | Alternative | Why |
|---|---|---|---|
| `generate_preview_surface` | `True` | `False` | Apple RealityKit reads USDPreviewSurface; without it meshes render grey |
| `merge_transform_and_shape` | `True` | `False` | Simpler prim hierarchy; trade-off: no independent composition override |
| `convert_orientation` | `True` | `False` | visionOS expects Y-up; Blender is Z-up |
| Zip compression | `ZIP_STORED` | `ZIP_DEFLATED` | USDZ spec requires no compression for streaming random-access |
| Packaging | Manual `zipfile` | `pxr.UsdUtils.CreateNewUsdzPackage` | Manual is portable; UsdUtils rewrites relative texture paths automatically (prefer in production) |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full pipeline: scene build → USDHook → USDC export → USDZ package |
| `record.py` | Viewport render: turntable animation to `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Outputs (generated at runtime)

```
usd_export/
├── scene_export.usdc
├── textures/
│   ├── gem_glass_baseColor.png
│   └── floor_mat_baseColor.png
├── holoflow_scene.usdz
└── export_manifest.json
```

## Outside sources

- **Blender Foundation** — USD Export documentation (CC-BY-4.0)
  <https://docs.blender.org/manual/en/5.1/files/import_export/usd.html>
- **PixarAnimationStudios/OpenUSD** — `pxr` Python API reference (Apache-2.0)
  <https://github.com/PixarAnimationStudios/OpenUSD>
  — Related: **usd-wg/usd-working-group** (Apache-2.0)
  <https://github.com/usd-wg/usd-working-group>
