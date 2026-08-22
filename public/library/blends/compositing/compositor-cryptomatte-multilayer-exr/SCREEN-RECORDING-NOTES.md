# Screen Recording Notes — Compositor Cryptomatte + Multi-Layer EXR

Target file: `public/library/videos/compositing/compositor-cryptomatte-multilayer-exr/screen.mp4`

---

## Setup (OBS Studio / Windows Game Bar)

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Format | MP4 / H.264 |

---

## What to record (in order)

1. **Open Blender 5.1.** Show the default scene briefly to establish context.

2. **Open the Text Editor workspace.** Paste or open `blueprint.py`. Narrate the
   PARAMETERS block — point out `RENDER_SAMPLES = 64` and explain that OIDN
   recovers quality from low sample counts.

3. **Run the script** (Alt+P or Run Script button). Switch to 3D Viewport and
   show the scene: faceted teal gem, lavender sphere, dark ground plane, three
   lights.

4. **Switch to the Compositing workspace.** Walk through the node tree from left
   to right:
   - Render Layers → Denoise (point out Normal + Albedo inputs)
   - Cryptomatte node — select the gem by clicking its name in the Matte ID field
   - Gem Extract Multiply → Glare (Fog Glow) → Add Glow back
   - Ellipse Mask → Blur → Invert → Scale → Multiply vignette chain
   - File Output (multi-layer EXR) and Composite output

5. **Open Render Properties.** Show that Cryptomatte Object pass is ticked under
   View Layer, and OIDN is selected under Sampling > Denoising.

6. **Press F12** to render one frame. Watch the render progress bar. Once done,
   show the UV/Image Editor with the Viewer node output — gem glow should be
   visible, corners darkened by vignette.

7. **Open a File Browser** to `//renders/`. Show the `.exr` file and the
   composited `.png`. Open the EXR in the Image Editor, switch channels in the
   header to show DiffDir, GlossDir, Shadow, Depth passes individually.

8. **Back in Compositing workspace**, demonstrate the Cryptomatte matte:
   connect the Cryptomatte `Matte` output to a Viewer node and show the
   greyscale gem mask — clean white on gem, black everywhere else.

---

## Tips

- Zoom in on the Cryptomatte node's `Matte ID` field when typing the object name
  so it is legible on screen.
- Use Ctrl+Shift+Click on any node to route it to the Viewer node — faster than
  rewiring.
- Record the full F12 render if your machine completes a frame in under 3 minutes.
  Otherwise, use a pre-rendered frame and narrate the expected output.
- Pause recording before any long Cycles render; resume when result is visible.
