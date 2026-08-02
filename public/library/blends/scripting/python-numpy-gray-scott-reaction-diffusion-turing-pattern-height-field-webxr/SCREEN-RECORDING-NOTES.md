# Screen-Recording Notes — Gray-Scott Reaction-Diffusion

## OBS / Game Bar setup

| Setting | Value |
|---|---|
| Window source | Blender 5.1 (full application window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (capture visuals only) |
| Output file | `screen.mp4` — place in `public/library/videos/scripting/python-numpy-gray-scott-reaction-diffusion-turing-pattern-height-field-webxr/` |

## What to record

1. **Open** a fresh Blender session. Scripting workspace visible.
2. **Paste** `blueprint.py` into the text editor. Highlight the `FEED` and
   `KILL` constants near the top — zoom in so text is legible.
3. **Run** the script (`Alt + P` or the ▶ button). The console will print
   progress lines. Keep the console visible in a split panel if possible.
4. **After ~10 seconds** the mesh appears in the 3-D viewport. Orbit it
   to show the height-field ridge pattern. Press `Z` → Solid view to see
   vertex colours; press `Z` → Material Preview for the lit version.
5. **Zoom** into the edge of the pattern where spots transition to
   stripes — this is the most visually striking region.
6. **Scrub** the viewport briefly to show it is a static mesh (not
   animated) before cutting.

## Suggested edit cuts

- 00:00 – 00:03  Script open, constants visible.
- 00:03 – 00:08  Script running, console output visible.
- 00:08 – 00:14  Mesh appears; orbit around it.
- 00:14 – 00:20  Material Preview close-up of spot/stripe boundary.

## Additional: record.py animation pass

After recording `screen.mp4`, open `record.py` in the text editor and
run it to render `viewport.mp4` automatically.  No screen recording
needed for this step — Blender writes the file directly.
