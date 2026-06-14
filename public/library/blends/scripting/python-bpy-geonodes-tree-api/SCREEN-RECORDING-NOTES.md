# Screen Recording Notes — Python bpy GN Tree API

## Software
OBS Studio (free) or Windows Game Bar (Win+G).

## Window source
Blender 5.1 — full window, 1920 × 1080, 30 fps.  
Disable audio capture (we are recording silent technique video).

## Suggested recording flow (~4 minutes)

1. **New file** — File → New → General.  
2. **Scripting workspace** — click the Scripting tab at the top.  
3. **Open blueprint.py** — click Open in the text editor header, navigate to  
   `public/library/blends/scripting/python-bpy-geonodes-tree-api/blueprint.py`.  
4. **Run script** — click the ▶ Run Script button.  
   Camera will briefly pan in the 3D viewport as the spike-ball appears.  
5. **Show result in 3D viewport** — switch to the Layout tab,  
   press Numpad 5 (orthographic/perspective toggle), tumble around the spike-ball.  
6. **Open Properties → Modifier panel** — select the spike-ball,  
   open the blue wrench tab.  Show the `HS_SpikeBall` modifier with its three  
   sliders (Density, Spike Length, Spike Radius).  
7. **Live edit** — drag the Density slider from 2 → 20 slowly so viewers see  
   spikes appearing in real time.  
8. **Show the GN tree** — switch to Geometry Node Editor (shift-click on 3D  
   viewport header → Geometry Node Editor).  Tumble through the tree so viewers  
   can see Group Input → Distribute → Instance → Realize → Join → Output.  
9. **Scripting tab** — return to Scripting, open `record.py`, run it,  
   wait for the render to finish (≈ 60 s).  
10. **Show rendered MP4** — open a file browser, navigate to  
    `public/library/videos/scripting/python-bpy-geonodes-tree-api/viewport.mp4`.  

## Output filename
Save as: `public/library/videos/scripting/python-bpy-geonodes-tree-api/screen.mp4`

## OBS settings
- Format: MP4 (H.264, CRF 20)  
- Resolution: 1920 × 1080  
- Frame rate: 30  
- Encoder: x264 or NVENC (your GPU)  
- Audio: disabled
