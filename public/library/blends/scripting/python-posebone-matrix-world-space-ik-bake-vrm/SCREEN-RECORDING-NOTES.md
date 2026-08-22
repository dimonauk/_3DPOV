# Screen Recording Notes — PoseBone Matrix World-Space IK Bake

Target file: `public/library/videos/scripting/python-posebone-matrix-world-space-ik-bake-vrm/screen.mp4`

## Software
- Blender 5.1
- OBS Studio (Window Capture) **or** Windows Game Bar (Win+G → Record)

## OBS Settings
| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920×1080 |
| Frame rate | 30 fps |
| Audio | Disabled (tutorial is silent) |
| Output format | MP4 (H.264) |
| Bitrate | 8 000 kbps |

## Blender Setup Before Recording
1. Open Blender 5.1 → **Scripting** workspace.
2. Paste the contents of `blueprint.py` into the text editor.
3. In the **Properties** panel → **Output** tab:
   - Set frame range 1–48, FPS 24.
4. Split the 3D Viewport into a second window alongside the Script editor.
5. In the 3D Viewport header, set shading to **Solid** and enable **Bone Axes** (`Armature Properties → Viewport Display → Axes`).
6. Orbit the viewport to **Numpad 3** (Right ortho) — this looks along +Y so the XZ IK plane is face-on.
7. Zoom to fit: **Numpad .** with nothing selected, then **Numpad 5** for orthographic.

## Recording Flow (approx 3 min)
1. **Hit Record** in OBS.
2. Run `blueprint.py` — show the arm being built and keyframed in one pass (Script Editor → Run Script ▶).
3. Scrub the timeline 1–48 to show the figure-8 IK motion; the forearm should bend convincingly.
4. Open the **Dope Sheet** (`Action Editor` mode) to show `ArmIKBaked` action populated with 48 frames × 2 bones × 4 quaternion channels.
5. Open the **NLA Editor** to show the `IK_Baked` strip.
6. Switch to the **Info** editor — confirm the GLB export message appears.
7. **Stop Recording**.

## Trim
Cut to 10–15 seconds: keep
- Build moment (1–2 s)
- IK playback (3–5 s at 2× speed)
- Dope Sheet flash (2 s)
- Export confirmation (1 s)

Export final cut to `screen.mp4` at the above settings and drop into
`public/library/videos/scripting/python-posebone-matrix-world-space-ik-bake-vrm/`.
