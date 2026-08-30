# Screen Recording Notes — Rössler Attractor

## Target file
`public/library/videos/scripting/python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr/screen.mp4`

## Software
OBS Studio (Windows/macOS/Linux) or Xbox Game Bar (Windows 11, Win+G).

## OBS settings
| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Output format | MP4 (H.264) |
| Audio | **Off** (silent tutorial) |
| Bitrate | 8 000 kbps |

## What to record

### Part 1 — Blueprint walkthrough (~2 min)
1. Open Blender 5.1. New General scene.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` via Text Editor → Open.
4. Scroll slowly through sections 1-4 so viewers can read the comments.
5. Press **Run Script** (▶). Watch the Info bar: integration takes ~10 s on a
   mid-range CPU.
6. Switch to **3D Viewport**. Press Numpad 5 (Orthographic off), then Middle-Mouse
   drag to inspect the single-scroll band topology.
7. Switch Viewport shading to **Vertex Colours** (top-right sphere icon →
   Viewport Shading → Color: Vertex).

### Part 2 — Shape key demo (~90 s)
1. With `Rossler_A` selected, open the **Properties** panel → Object Data → Shape
   Keys.
2. Set **Value** of `SK_Periodic` to 1.0 → attractor collapses to a clean oval
   limit cycle. This is c=4.0, before the first period-doubling bifurcation.
3. Set `SK_Periodic` back to 0, set `SK_Period2` to 1.0 → two interlocked loops
   (c=5.0, first bifurcation).
4. Set `SK_Period2` to 0, set `SK_Dense` to 1.0 → wider, denser spiral (a=0.3).
5. Return all to Basis.

### Part 3 — GLB export (~45 s)
1. File → Export → glTF 2.0.
2. In the export panel: ✓ Draco Compression (level 6), ✓ WebP Textures,
   ✓ Include Morph Targets.
3. Export to `public/library/glbs/scripting/<slug>/hf_rossler_poi.glb`.

## Xbox Game Bar (quick option)
- Win+G → Start Recording.
- Focus the Blender window.
- Record the same three parts above in one continuous take.
- Win+G → Stop. Clip lands in `Videos/Captures/`.
- Rename to `screen.mp4` and copy to the target path.

## After recording
Place `screen.mp4` in the `videos/scripting/<slug>/` directory.  The MANIFEST
row and tutorial page both reference it.
