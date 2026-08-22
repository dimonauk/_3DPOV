# Screen Recording Notes — N-Body Star Cluster

**Target file:** `public/library/videos/scripting/python-nbody-gravity-star-cluster-leapfrog-light-painting/screen.mp4`

## OBS Setup

| Setting | Value |
|---------|-------|
| Source type | Window Capture |
| Window | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 (H.264) |
| CRF | 18 (near-lossless) |

## Capture procedure

1. Run `blueprint.py` in the Scripting workspace.
2. Switch to the **3D Viewport** and set shading to **Rendered** (EEVEE Next).
3. Maximise the viewport with `Ctrl + Space`.
4. In OBS, start recording.
5. Press **Space** to play from frame 1 to 400.
6. Stop OBS recording after playback ends.
7. Rename output to `screen.mp4` and place in the target directory above.

## What to show

**Frames 1–80**: all 24 neon trails start from the tight Plummer disk.  Inner
stars (brighter, moving faster) already show curvature; outer stars are still
nearly radial.  The bloom halos overlap into a bright central glow.

**Frames 80–200**: differential rotation is visible — inner-orbit stars have
completed a partial loop while outer stars have barely moved.  The disk stretches
into a pinwheel of coloured streaks.

**Frames 200–400**: streaming arms fully extended.  Some stars on highly
eccentric orbits plunge through the centre and re-emerge on the far side.
The overall pattern resembles a slow-exposure photograph of a barred irregular
dwarf galaxy.  Pause at frame 340 for the most photogenic arm spread.

## Tips

- **Numpad 7** (top-down orthographic) shows the rotational structure most clearly.
- **Numpad 1** (front view) reveals the thin-disk vertical thickness and any
  stars that were scattered out of the plane by close encounters.
- For a dramatic close-up, zoom into the core during frames 60–120 when the
  inner stars pass through pericentre and the bloom halos merge into a single
  white flash before splitting into individual coloured threads.
