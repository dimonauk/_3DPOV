# Screen Recording Notes
## bmesh.ops Limited Dissolve + Poke — Faceted Ornament

**Target file:** `public/library/videos/scripting/python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr/screen.mp4`

### Software
- OBS Studio (Windows/macOS/Linux) **or** Windows Game Bar (`Win + G`)

### OBS settings
| Setting | Value |
|---|---|
| Source type | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Disabled (no mic, no desktop audio) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

### What to record

1. **Open Blender 5.1** with a blank scene.
2. Open the **Scripting workspace** (top-bar tab).
3. Click **Open** in the text editor and load `blueprint.py`.
4. Press **Run Script** (▶ or `Alt + P`).
   - Console should print `[1] icosphere: 80 faces` through to `[export]`.
5. Switch to the **Layout workspace**.  
   - Select `ornament_faceted`.  You should see the faceted sphere with cobalt + amber materials.
6. Press **Space** to play the 120-frame rotation animation.  
   Let it loop once (4 seconds).
7. Scrub back to frame 1.  In the **Viewport Shading** popover (top-right sphere icons), switch to **Material Preview** (`Z → Material Preview`).
8. Play again — record this second playback as the final clip.

### Timing guide
| Time | Action |
|---|---|
| 0:00 – 0:10 | Scripting workspace, open + run blueprint.py |
| 0:10 – 0:25 | Switch to Layout, show the faceted ornament |
| 0:25 – 0:55 | Material Preview playback — one full rotation |
| 0:55 – 1:00 | Pause, zoom into star fans, end recording |

### Tips
- Use **Numpad 0** to enter camera view before playback for a cleaner shot.
- Disable overlays (`Alt + Shift + Z`) to remove grid, axes, and selection highlights.
- If the viewport is choppy, drop to 720 p in OBS and upscale in the ffmpeg step.
