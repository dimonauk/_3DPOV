# Python Alembic Mesh Sequence Cache → VAT for WebXR

**Blender 5.1 · Holoflow Studio · CC0**

## What this does

Reads an Alembic (`.abc`) animated mesh cache into Blender via the **Mesh
Sequence Cache** (MSC) modifier, samples every frame's vertex positions
through the depsgraph, and packs the per-frame offsets into a **float-32 EXR
Vertex Animation Texture** (VAT) for playback in WebXR.

Alembic is the production interchange format for animated geometry without
rigging — cloth caches from Houdini, liquid simulations from Mantaflow,
rigid-body debris from Maya. The MSC modifier lets Blender consume these
without baking.  VAT bridges the gap to WebXR: a GPU shader reads the EXR
at (vertex_id, time_t) and adds the stored delta to the rest-pose mesh.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full pipeline: synthetic .abc source → MSC import → depsgraph sample → EXR + GLB + JSON |
| `record.py` | Viewport animation render (wave animation, 30 fps MP4) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Expected output manifest with cross-references |

## Output artefacts

- `vat_position.exr` — RGBA32F, width = vertex\_count, height = frame\_count, RGBA = (Δx, Δy, Δz, 1.0) local-space
- `alembic_vat_rest.glb` — rest-pose mesh, Draco-6, WebP textures
- `alembic_vat_meta.json` — vertex\_count, frame\_count, GLSL shader snippet

## WebXR shader recipe (GLSL 300 es)

```glsl
uniform sampler2D uVAT;
uniform float     uTime;        // 0.0 → 1.0
uniform float     uFrameCount;
uniform float     uVertexCount;
attribute float   aVertexId;    // 0 → vertex_count - 1

// In vertex shader:
float frame_t = uTime * (uFrameCount - 1.0);
vec2  uv      = vec2(
    (aVertexId + 0.5) / uVertexCount,
    (frame_t   + 0.5) / uFrameCount
);
vec3 offset   = texture(uVAT, uv).xyz;
vec3 world_pos = position + offset;
```

## Running

```bash
blender --background --python blueprint.py
blender <scene.blend> --python record.py
```

## Parameters to tune

| Constant | Default | Effect |
|----------|---------|--------|
| `N_FRAMES` | 32 | VAT height; use powers of two |
| `GRID_DIVS` | 8 | Grid subdivisions; `(D+1)²` vertices |
| `WAVE_AMPLITUDE` | 0.25 m | Peak displacement |
| `WAVE_FREQ` | 2.0 | Spatial cycles across the grid |

## Licence

CC0 (public domain). The Alembic format itself is BSD-3-Clause (ILM/Sony).
