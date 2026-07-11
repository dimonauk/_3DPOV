# Screen Recording Notes — GP3 Toon Ink Wave

**Target file**: `public/library/videos/scripting/python-gp3-stroke-drawing-api-toon-ink-webxr/screen.mp4`

## OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic needed) |
| Output format | MP4 / H.264 |

## What to Record

1. **Open the Scripting workspace.** Show the blank Text editor.
2. **Paste blueprint.py** (or open it via Text → Open). Scroll to the top so `OUT` and the parameters block are visible.
3. **Run Script** (`Alt + P`). Let it complete. Switch to the 3D Viewport.
4. **Zoom to the GP object.** Press `Numpad 0` to enter camera view — the two sine-wave stroke layers should be visible in the orthographic framing.
5. **Scrub the timeline** (drag the frame counter from 1 → 5 → 10). The wave should phase-shift visibly between each keyframe.
6. **Hover over the Properties panel → GP Modifiers tab.** Show the Thickness and Smooth modifiers listed there.
7. **Open a File Browser** and show the output directory: `gp3_toon_ink/` containing `gp3_toon_wave.glb` and `gp3_meta.json`.
8. **End the recording.**

## Trim Points

- Cut any compile-pause between Run Script and 3D Viewport switch.
- Hold on frame 1 for ≥ 1 second before scrubbing.
- No need to record the GLB import into a viewer — a file-browser shot is sufficient.

## Total target length: 60–90 seconds
