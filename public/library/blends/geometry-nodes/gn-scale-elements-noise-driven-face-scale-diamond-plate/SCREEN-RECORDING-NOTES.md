# Screen Recording Notes — Diamond Plate Scale Elements

## Recording target

`public/library/videos/geometry-nodes/gn-scale-elements-noise-driven-face-scale-diamond-plate/screen.mp4`

## Software

- OBS Studio (any recent version) **or** Windows Game Bar (Win+G)
- Blender 5.1 open, `diamond_plate.blend` loaded

## OBS setup

1. **Source** → Add → Window Capture → select **Blender**
2. **Resolution** → 1920 × 1080 (Output → Rescale Output if your display differs)
3. **Frame rate** → 30 fps (Output → Recording → 30)
4. **Audio** → uncheck all audio tracks (this tutorial has no commentary)
5. **Output path** → set to the `videos/geometry-nodes/…` directory above

## What to record (in order)

| # | Action | Why |
|---|---|---|
| 1 | Open **Geometry Nodes** workspace with `diamond_plate.blend` | Orient viewer to the node tree |
| 2 | Pan across the full GN tree slowly (3 seconds) | Show the six-node chain |
| 3 | Click the **diamond_plate** object; switch to **Rendered** viewport shading | Show the pale-steel panel look |
| 4 | Orbit around the grid (mouse-drag) | Show 3D depth of the seams |
| 5 | In the N-Panel (Properties sidebar), find the **Item → Modifier → Scale Min** slider; drag from 0.52 up to 1.0 and back | Show panels closing then reopening live |
| 6 | Open the **Spreadsheet** editor; set domain to **Face** → **Named Attributes** | Show hs_panel_scale values per face |
| 7 | Hold on final material view (2 seconds) then stop |  |

## Tips

- Use **Numpad 5** to toggle Orthographic / Perspective. Orthographic shows the
  seam geometry cleanly; Perspective adds depth.
- **Ctrl+Space** maximises the active editor — useful for the spreadsheet step.
- If the viewport is sluggish in Rendered shading, switch to **Material Preview**
  (LookDev); it still shows the colour-ramp material correctly.

## Duration target

60–90 seconds total. No editing needed — one continuous take is fine.
