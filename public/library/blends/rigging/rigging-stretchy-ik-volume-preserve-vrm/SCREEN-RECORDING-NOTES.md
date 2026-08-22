# Screen Recording Notes — Stretchy IK + Volume Preservation
`screen.mp4` companion for `rigging-stretchy-ik-volume-preserve-vrm`

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (mute track) |
| Output codec | H.264 / MP4 |
| Output path | `public/library/videos/rigging/rigging-stretchy-ik-volume-preserve-vrm/screen.mp4` |

## What to record

### Part 1 — Script execution (~2 min)

1. Open Blender 5.1. Switch to the **Scripting** workspace.
2. Load `blueprint.py` (Text → Open).
3. Hit **Run Script**. Watch the arm armature and cylinder appear.
4. Switch to the **3D Viewport**. Press **Numpad 5** (ortho), then **Numpad 1** (front).
5. Select the armature. Switch to **Pose Mode**.
6. Grab the `hand.IK` control bone. Move it upward past the arm's natural reach —
   the chain stretches and the cylinder stays full-width (volume compensation active).
7. In the **Properties** panel (N) show the `volume_preserve` custom property.
   Scrub it from 1.0 → 0.0 to show the tube-thinning artefact; scrub back to 1.0.

### Part 2 — Playback (~30 s)

8. Press **Space** to play the 60-frame animation.
   Show the arm extending (frames 1–30) and retracting (31–60).

### Part 3 — GLB export (~30 s)

9. With the arm and mesh selected, use **File → Export → glTF 2.0**.
10. Enable **Skins**, **Animations**, **Force Sampling** (bakes drivers).
11. Hit **Export glTF 2.0**. Show the file in the OS file browser.

## Editing hints

- Cut between the Script, Viewport, and Properties panels.
- Zoom into the volume_preserve slider scrub for the key pedagogical moment.
- Keep total video length under 5 minutes.
