# Screen Recording Notes — python-armature-edit-bones-vrm-spine-chain

**Target file:** `public/library/videos/scripting/python-armature-edit-bones-vrm-spine-chain/screen.mp4`

## OBS / Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (silent tutorial) |
| Output format | MP4 / H.264 |

## Recording flow

1. Open a fresh Blender 5.1 session (Scripting workspace).
2. Paste `blueprint.py` into the Text Editor panel and run it (`Alt+P`).
3. Switch to the 3D Viewport. Ensure the armature is visible and in Solid shading.
4. Select the armature → `Tab` into POSE mode. Show custom bone shapes in the
   overlay (Viewport Overlays → Bones → Custom Shapes ✓).
5. Slowly rotate the `chest` and `head` bones to show the spine deforming the
   body proxy cylinder.
6. **Suggested shots:**
   - Wide: full skeleton in rest T-pose (5 s)
   - Close: chest bone selected → Properties panel → Custom Shape field showing `WGT_Spine`
   - Close: Sidebar → Item → Bone Collections panel showing `Spine` / `Shoulders`
   - Animated: pose the spine bow deformation (10 s)
   - Wide: back to rest (3 s)

## Naming convention

Save as `screen.mp4` in the `videos/scripting/python-armature-edit-bones-vrm-spine-chain/`
folder alongside the auto-generated `viewport.mp4`.
