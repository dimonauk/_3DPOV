# Armature & Weight Painting — rigging/armature-weight-paint

Technique: four-bone VRM-compatible armature, Automatic Weights parent,
manual weight-paint correction, and glTF skin export with bone influence
capped at four per vertex for WebXR runtime compatibility.

## What this produces

A low-poly torso + upper-arm mesh skinned to a three-bone spine chain and a
shoulder/upper-arm bone. The animated recording shows the arm raising 90° and
returning to rest — the primary quality check for shoulder weight painting.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Build mesh + armature, parent auto-weights, export GLB |
| `record.py` | Keyframe arm pose animation + render to mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for screen capture |
| `.expected-artefacts.json` | CI / QA artefact manifest |

## Running blueprint.py

1. Open Blender 5.1.
2. Open the Text Editor (Shift+F11).
3. Text > Open → select `blueprint.py`.
4. Run Script (Alt+P).
5. `armature_weight_demo.glb` exports to the same folder as the .blend file.
6. Switch to Weight Paint mode (Ctrl+Tab) to inspect and correct the weights.

## Running record.py

1. Open the Text Editor, open `record.py`.
2. Run Script.
3. Ctrl+F12 (Render Animation) → `viewport.mp4` writes to
   `public/library/videos/rigging/armature-weight-paint/viewport.mp4`.

## Key Blender 5.1 notes

- `use_bone_envelopes = False` is critical. Envelopes fight vertex groups and
  produce unpredictable blending at joints. Always use vertex groups only.
- `vertex_group_limit_total(limit=4)` must run before export. glTF caps at 4
  bone influences per vertex; the exporter silently drops excess and the
  deformation changes between Blender and the browser.
- After Limit Total, run `vertex_group_normalize_all` so weights still sum to 1.
- Armature modifier `Preserve Volume` (dual-quaternion blend) prevents
  candy-wrapper twist at the shoulder for bends > 90°.
- VRM 1.0 bone name requirements: Hips, Spine, Chest, UpperArm.R/L,
  LowerArm.R/L, Hand.R/L. This blueprint uses the correct names for the bones
  it creates.

## Sources

**Blender Manual — Armatures**
URL: https://docs.blender.org/manual/en/latest/animation/armatures/index.html
Licence: CC0. Attribution (courtesy): The Blender Documentation Team.

**Blender Manual — Weight Paint**
URL: https://docs.blender.org/manual/en/latest/sculpt_paint/weight_paint/index.html
Licence: CC0. Attribution (courtesy): The Blender Documentation Team.
