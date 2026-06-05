# Screen Recording Notes — Armature IK Robot Arm

## Goal
Capture a 2–3 minute demonstration showing:
1. The robot arm in solid shading — IK_Target sphere visible in the viewport
2. Moving the IK_Target with G to drag it; the arm tracks in real time
3. Moving the IK_Pole empty to show elbow flipping without it, then snapping back
4. Playing the baked animation (IK_Target orbiting in a circle)

## Software
- Blender 5.1
- OBS Studio 30+ (Window Capture source, not Display Capture)

## OBS Settings
| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Canvas resolution | 1920 × 1080 |
| Output resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Encoder | x264, CRF 18 |
| Audio | Disabled (capture commentary separately if desired) |
| Output path | `public/library/videos/rigging/armature-ik-robot-arm/screen.mp4` |

## Blender Viewport Setup
1. Open `robot_arm_ik.blend`.
2. Press `N` to open the sidebar; close it to maximise workspace.
3. Set viewport shading to **Solid** (Z key → Solid) with **Matcap** set to
   the blue metallic sphere preset. This shows the arm segments clearly without
   a full render setup.
4. In the Outliner, confirm `IK_Target` (sphere empty) and `IK_Pole` (arrows
   empty) are visible.
5. Select `IK_Target`, press **G** to grab, move with mouse — arm follows.
6. Press **Escape** to cancel the grab (do not confirm a position change unless
   you want to move the rest keyframe).

## Demonstration Flow
1. **Introduction (0:00–0:20)** — Show the arm at rest, explain the bone chain
   in the Outliner (upper_arm → lower_arm).
2. **Manual IK_Target dragging (0:20–1:00)** — Select IK_Target, grab with G,
   move it slowly in a wide arc. Show the elbow tracking the pole empty. Move
   it close to the shoulder to show the arm bend fully; move it far to show
   extension.
3. **Pole target demo (1:00–1:40)** — Select IK_Pole, grab G, move it to +Y
   (in front). The elbow flips to point forward. Move back to –Y; elbow points
   backward again. This is the key visual payoff of the pole target concept.
4. **Animation playback (1:40–2:20)** — Press Space to play. The IK_Target
   orbits in the horizontal plane and the arm smoothly tracks it for the full
   60 frames. Let it loop twice.
5. **Close-up (2:20–2:40)** — Zoom into the elbow joint region. Pause on a
   frame where the arm is fully bent (around frame 15). Show the joint sphere
   deforming cleanly against the tube segments.

## Notes
- Do NOT record in rendered mode for this screen capture — solid shading is
  faster, shows IK real-time solve clearly, and the metallic matcap reads well.
- If the arm snaps or flips during the manual-drag demo, the pole target may
  need repositioning — move IK_Pole further in –Y (e.g. Y = –1.2) for a
  stronger bias.
- The viewport.mp4 (from record.py / EEVEE) is the polished version for the
  library thumbnail. screen.mp4 is the tutorial walkthrough.
