# Shader — Parallax Occlusion Mapping: Fake-Depth Brick Wall

**Blender 5.1 · CC0 · Holoflow Studio**

Parallax Occlusion Mapping (POM) offsets UV coordinates based on the view
direction projected into tangent space.  The result: mortar lines appear
recessed, brick faces appear raised — all on a single flat polygon with no
extra geometry.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | 4-step POM shader graph, bakes colour to UV image, exports GLB |
| `record.py` | Camera arc overhead→oblique render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions for `screen.mp4` |
| `output/wall_tile_pom.glb` | Exported GLB with baked colour texture |
| `output/pom_colour_baked.png` | Baked colour (1024×1024 PNG) |

## Core technique

```
Step 1: Decompose view ray into tangent space
  dot_T = dot(Incoming, Tangent)
  dot_B = dot(Incoming, Bitangent)   # Bitangent = Cross(Normal, Tangent)
  dot_N = dot(Incoming, Normal)

Step 2: Compute full UV offset
  ofs_x = (dot_T / dot_N) * HEIGHT_SCALE
  ofs_y = (dot_B / dot_N) * HEIGHT_SCALE

Step 3: Sample 5 UV positions (fractions 0, 0.25, 0.50, 0.75, 1.00)
  h_i = BrickTexture.Fac at UV + frac_i * (ofs_x, ofs_y)

Step 4: Cascade — select last step where h_i >= depth_layer_i
  result_colour = MixRGB(GreaterThan(h1, 0.25), c0, c1)
               → MixRGB(GreaterThan(h2, 0.50), ..., c2)
               → ...
```

## Why tangent space

The camera view ray travels in world space.  UV coordinates exist in tangent
space — a local frame aligned to the mesh surface.  Without transforming the
view ray, the UV offset would be wrong for any rotation of the object.
The three dot products against T, B, and N are a 3×3 matrix multiplication
decomposed into scalar operations, expressible entirely in shader nodes.

## Limitation: 4-step approximation

Blender shader nodes have no iteration primitive.  True steep parallax uses N
steps in a loop; here 4 steps are unrolled at node-graph authoring time.
At very shallow viewing angles (< 15° incidence), the staircase between steps
becomes visible on mortar edges.  Copy-paste `uv_at_step` calls and extend the
`gt_mix` cascade to 8 steps for a cleaner result.

## Export / WebXR

POM does not transfer to glTF 2.0 — the spec has no parallax field.  The
blueprint bakes the POM colour into a UV image and exports that.  For runtime
POM in a WebXR scene, implement it in Three.js TSL which supports real loops;
see `SCREEN-RECORDING-NOTES.md` for a TSL pseudocode sketch.

## Running

1. Open Blender 5.1 with a new file.
2. Open `blueprint.py` in the Text Editor.
3. **Alt+P** (Run Script).  Output writes to `output/`.
4. Run `record.py` separately to produce `viewport.mp4`.

## Cross-references

- Tutorial page: `/tutorials/blender-tutorial-shader-parallax-occlusion-mapping-wall-tile-webxr`
- Triplanar Projection (another view-independent shader): `/tutorials/blender-tutorial-shader-triplanar-projection-no-uv-hard-surface-webxr`
- Baking pipeline: `/tutorials/blender-tutorial-texture-baking-normal-ao`
- glTF PBR export: `/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr`
