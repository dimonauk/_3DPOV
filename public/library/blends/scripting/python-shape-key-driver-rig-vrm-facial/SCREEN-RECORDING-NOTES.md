# Screen Recording Notes — Shape Key Driver Rig

## Target file
`public/library/videos/scripting/python-shape-key-driver-rig-vrm-facial/screen.mp4`

## Software
OBS Studio (recommended) or Windows Game Bar (Win+G).

## OBS setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Canvas | 1920 × 1080 |
| Output | 1920 × 1080 |
| FPS | 30 |
| Encoder | x264 or NVENC |
| Bitrate | 6 000 kbps |
| Audio | Disabled (no microphone needed) |

## What to record

**Part 1 — Script execution (≈60 s)**
1. Open Blender 5.1. New General file.
2. Switch top-right editor to **Scripting** workspace.
3. New text → paste `blueprint.py` → Run Script.
4. Watch the 3D Viewport: sphere appears, armature is built.
5. Switch to **Timeline** — scrub 1 → 90 to show shape key value curves animating.

**Part 2 — Driver inspection (≈45 s)**
6. Select `face_mesh` → Properties → Object Data → Shape Keys.
7. Select `brow_raise_l` → click the driver dot (purple diamond) next to the value slider.
8. Switch editor to **Drivers** (Graph Editor → Drivers). Show the scripted expression and the bone variable target.
9. Pose the `brow_l` bone in Pose Mode — the shape key value should move live.

**Part 3 — Corrective key (≈30 s)**
10. Select `sad_corrective` shape key → open driver.
11. Show the two-variable product expression.
12. Pose BOTH brow bones downward simultaneously — sad_corrective rises to 1.0.

**Part 4 — GLB verification (≈30 s)**
13. Open the exported `face_driver_rig.glb` in a second Blender window or drag into gltf.report.
14. Show Animations panel — morph weight track visible for frames 1-90.
15. Scrub the timeline — morph targets animate correctly.

## Trim to ≈ 3 minutes total. Export MP4 H.264.
