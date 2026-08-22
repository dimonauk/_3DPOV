# Weight Painting — Automatic Weights + Mirror + Smooth: VRM Deformation Envelope

**Blender 5.1 · Rigging · CC0**

Weight painting is what turns a rigid armature into a living skin. Each
vertex stores a floating-point influence (0–1) per bone; the renderer
linearly interpolates the bone-space positions and sums the result (Linear
Blend Skinning). Poor weights produce candy-wrapper twists at the elbow,
volume collapse at the shoulder, and pinching at the waist — all visible
within seconds of your first test pose.

## Technique

1. **Heat diffusion auto-weights** (`Parent → Armature → Automatic Weights`) —
   seeds each vertex group with a Laplacian heat field radiating outward from
   each bone. Better than Envelope mode for complex topology.

2. **Smooth** (`Object Data → Vertex Groups → Smooth`) — Laplacian passes
   across vertex adjacency remove sharp influence boundaries left by heat
   diffusion at bone intersections.

3. **Normalise All** — enforces sum-to-1 per vertex; required for volume
   conservation in Linear Blend Skinning.

4. **Limit Total (4)** — the glTF 2.0 spec and GPU hardware both impose a
   maximum of 4 bone influences per vertex (JOINTS_0 / WEIGHTS_0 are `vec4`).
   Anything beyond the top 4 is silently discarded at export.

5. **Mirror X** (`Vertex Groups → Mirror`) — reflects `.L` vertex group
   values to mirrored `.R` groups; requires X-symmetric topology and
   `.L` / `.R` bone naming.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds torso + armature, parents, cleans weights, exports GLB |
| `record.py` | Renders a 90-frame deformation test animation as `viewport.mp4` |
| `weight_paint_vrm.glb` | GLB with skinning data (4-influence limit applied) |

## Running

```bash
blender --background --python blueprint.py
# produces weight_paint_vrm.glb alongside this file

blender --background --python record.py
# produces public/library/videos/rigging/weight-paint-vrm-deformation-envelope/viewport.mp4
```

## Related Studio Tutorials

- [B-Bone Cartoon Spine for VRM](/tutorials/blender-tutorial-rigging-bbone-cartoon-spine-vrm)
- [FK/IK Switch with Custom Property](/tutorials/blender-tutorial-rigging-fk-ik-switch-custom-property-driver)
- [Corrective Shape Keys + Driver](/tutorials/blender-tutorial-rigging-corrective-shape-keys-driver)
- [VRM Spring Bones Hair Chain](/tutorials/blender-tutorial-vrm-spring-bones-hair-chain)

## External References

- Blender Manual — Weight Paint Mode (CC-BY-SA-4.0, Blender Documentation Team)
  <https://docs.blender.org/manual/en/latest/sculpt_paint/weight_paint/>
- VRM Specification — Humanoid Skinning (MIT, VRM Consortium)
  <https://github.com/vrm-c/vrm-specification>
  Related: three-vrm (MIT, pixiv) <https://github.com/pixiv/three-vrm>
