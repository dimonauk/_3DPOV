# Screen Recording Notes — Spline IK Tentacle Rig

## Software
- **OBS Studio** (recommended) or Windows Game Bar (Win + G)

## Blender window setup before recording
1. Open `tentacle_spline_ik.blend`
2. Set viewport to **Solid** shading with **MatCap** (clay look) for the rigging section, switch to **Rendered** (EEVEE) for the animation playback section
3. Split editor: **3D Viewport** (left 70%) | **Properties > Object Constraint** (right 30%)
4. In Properties, navigate to the **Bone Constraints** tab on the tip bone (`Bone.009` in Pose mode) — keep the Spline IK panel visible
5. Set **Overlays → Statistics** ON so triangle count is readable
6. Set timeline frame range 1–60, press **Spacebar** to play

## OBS Settings
| Setting | Value |
|---------|-------|
| Source | Window Capture — Blender |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | OFF (no commentary needed for library archive) |
| Output format | MP4 (H.264) |
| Output file | `public/library/videos/rigging/armature-spline-ik-tentacle/screen.mp4` |

## Shot list (roughly 90 s total)

| Seconds | Action |
|---------|--------|
| 0–10 | Show the Properties panel open at the **Spline IK constraint** — hover over `chain_count`, `xz_scale_mode`, `y_scale_mode` fields |
| 10–20 | In **Pose mode** select the tip bone; show the Spline IK constraint target field pointing at the curve object |
| 20–35 | Switch to **Object mode**, select the curve, Tab into **Edit mode** — grab the mid control point and drag it laterally — watch the armature chain follow in real time |
| 35–50 | Undo back to rest pose; press Spacebar — watch the 60-frame animation play through rest → prey-reach → coiled curl |
| 50–65 | Show **weight paint** on the skin mesh: switch to Weight Paint mode, click through bones to show gradient ring weights |
| 65–80 | Open Python console, paste one line: `bpy.data.objects["tentacle_armature"].pose.bones["Bone.009"].constraints["Spline IK"].chain_count = 5` — show partial-chain result |
| 80–90 | Return chain_count to 10; final beauty render playback |

## Naming convention
Save as: `screen.mp4` in the same folder as `viewport.mp4`.
Both files land at `public/library/videos/rigging/armature-spline-ik-tentacle/`.
