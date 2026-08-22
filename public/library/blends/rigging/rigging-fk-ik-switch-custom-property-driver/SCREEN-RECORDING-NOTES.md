# Screen Recording Notes — FK/IK Switch

**Target file:** `public/library/videos/rigging/rigging-fk-ik-switch-custom-property-driver/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no system audio) |
| Output format | MP4 / H.264 |
| Bitrate | 6 Mbps |

## What to capture

1. **Open** Blender 5.1 fresh. Load `fk_ik_arm.blend` (saved after blueprint.py).
2. **Properties panel** — press N in the 3D viewport to open the Item panel.
   Show the `fk_ik` slider at 0.0.
3. **FK demo** — select the `forearm` bone in Pose Mode. Press R X, drag to
   rotate ~60°. Show the arm bending freely. Press Escape to undo.
4. **Switch to IK** — drag the `fk_ik` slider to 1.0. The IK target bone
   becomes active.
5. **Move IK target** — grab (G) the `ik_target` bone and move it in Y and Z.
   Show the arm following in real time.
6. **Keyframe the switch** — hover over `fk_ik`, press I to add a keyframe.
   Scrub forward 20 frames, set `fk_ik=0`, press I again. Show the FK/IK
   blend in the timeline.
7. **Graph Editor** — open Graph Editor, show the `fk_ik` F-curve as a step
   function. Explain why Constant interpolation is preferred for mode switches.

## Blender layout tips

- Use **Animation** workspace so the timeline and Graph Editor are visible.
- Set viewport to **Solid** shading, enable **X-Ray** (Alt+Z) so bone
  constraints are visible through any mesh.
- Enable **Show Bone Names** (viewport overlay ▸ Geometry ▸ Bone Names) so
  `ik_target` and `ik_pole` labels appear on screen.
- Keep the N-panel (Item tab) pinned on-screen throughout so the `fk_ik`
  slider reads clearly.

## Duration target

6–8 minutes total. Include a title card at the start and an outro showing the
finished rig with a simple 3-keyframe arm-wave animation.
