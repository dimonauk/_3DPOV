# Screen Recording Notes — EEVEE Shadow Catcher + Holdout AR Composite

**Output file:** `public/library/videos/rendering/eevee-shadow-catcher-holdout-ar-composite/screen.mp4`

## Setup

| Setting | Value |
|---------|-------|
| Capture | Window — Blender (not display capture) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Format | MP4, H.264, CRF 18 |

**OBS Scene:** Add a "Window Capture" source, select the Blender window.  
**Windows Game Bar:** Win+G → Capture → Record window. Set quality to High.

## Shot list

1. **Properties panel — Object tab** (10 s)  
   Select `shadow_catcher_ground`. Show Object Properties → Visibility section.  
   Highlight the **Shadow Catcher** checkbox (checked). Explain: this is the only flag required.

2. **Render Properties → Film** (10 s)  
   Navigate to Render Properties (camera icon). Scroll to the Film section.  
   Show **Transparent** checkbox enabled. Explain: transparent world = alpha encodes shadows.  
   Show Image Format set to PNG, Colour Mode RGBA.

3. **Render preview — F12** (20 s)  
   Press F12. Watch the EEVEE pass complete.  
   In the Image Viewer: the ground plane is transparent; only the shadow is visible.  
   Toggle the alpha checkerboard (Image > Display Alpha > As Is) to confirm the grey  
   checkerboard beneath the shadow, showing zero alpha outside shadow areas.

4. **Object Properties — Holdout** (8 s)  
   Select `holdout_surround`. Show Object Properties → Visibility → **Holdout** checked.  
   Briefly render again to show the vertical crop card as a transparent rectangle in the output.

5. **Compositor walkthrough** (20 s)  
   Open Compositor (editor type). Walk through three nodes: Render Layers → Alpha Over → Composite.  
   Show the Background Image node feeding the warm-white plate into the bottom of Alpha Over.  
   Hover over the Alpha Over node output to show the composited preview thumbnail.

6. **Swap background to a photo** (15 s, optional)  
   Load any freely-licensed JPG into the Background Image node.  
   Render — the gem floats above the photo with a soft shadow beneath it.  
   This is the "AR product viz" payoff shot.

## File naming

Save the recording as `screen.mp4` in:  
`public/library/videos/rendering/eevee-shadow-catcher-holdout-ar-composite/`
