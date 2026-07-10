# Screen Recording Notes — Python Rigid Body Physics & Trajectory JSON

**Tutorial**: Python bpy.types.RigidBodyObject — Scripted Physics Scene & Trajectory JSON for WebXR  
**Output file**: `public/library/videos/scripting/python-rigid-body-physics-bake-trajectory-webxr/screen.mp4`

---

## Setup

- **Software**: OBS Studio (or Windows Game Bar `Win+G`)
- **Capture source**: Window capture → Blender 5.1
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: OFF (no mic capture needed)

---

## Scene layout before recording

1. Open Blender → New General file
2. Open the Script Editor (top-right dropdown → `Script`)
3. Paste or load `blueprint.py` — do **not** run it yet
4. Split the viewport: keep 3-D Viewport on the left, Script Editor on the right
5. In the 3-D Viewport, set shading to **Material Preview** (Sphere icon, Z shortcut)

---

## Recording sequence

| Timestamp | Action |
|-----------|--------|
| 0:00 | Start OBS capture. Show blueprint.py in the Script Editor — scroll through each function briefly. |
| 0:30 | Click **Run Script** (▶ or Alt+P). Watch the console for progress lines. |
| 1:00 | After script completes (~20 s), scrub the timeline slider left→right — show sphere trajectory and toppling boxes in the viewport. |
| 1:30 | Open the **Output Properties** (printer icon) and show the trajectory.json path. Open a file manager overlay or the Blender **Text Editor** and load `trajectory.json` — show one frame's position/quaternion entry. |
| 2:00 | Show the **Physics Properties** panel (wrench icon on an active box) — rigid_body.type=ACTIVE, collision_shape=BOX, mass=1.0. |
| 2:30 | Press **Space** to play the simulation back in the viewport. Show the boxes scattering. |
| 3:00 | Stop recording. |

---

## Post-processing

- **Trim** first 3 s if OBS capture delay causes a black open.
- **No colour grade** needed — Material Preview is clear enough.
- **Export** as H.264 MP4, CRF 23, 1920 × 1080.
- Save to `public/library/videos/scripting/python-rigid-body-physics-bake-trajectory-webxr/screen.mp4`.
