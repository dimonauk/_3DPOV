# Screen Recording Notes — Chladni Figures Standing Wave Eigenmodes

Target file: `public/library/videos/scripting/python-numpy-chladni-figures-standing-wave-eigenmodes-nodal-lines-height-field-webxr/screen.mp4`

## OBS Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Disabled** (desktop audio off) |
| Output format | MP4 (H.264 / AAC) |
| Bitrate | 8 000 kbps |

## Recording sequence (~4 minutes)

1. **Open Blender 5.1** — show the default splash / startup scene (10 s).
2. **Switch to Scripting workspace** — click the workspace tab (5 s).
3. **Open blueprint.py** — Text → Open → navigate to the file (10 s).
4. **Run blueprint.py** — press Alt+P. Let console output scroll (~8 s).  
   Confirm `[chladni] ✓ exported //hf_chladni.glb` appears.
5. **Switch to 3D Viewport** — press Z → Material Preview.  
   The cyan-magenta-white Chladni pattern appears on the floor mesh (10 s).
6. **Pan around the mesh** — orbit to show the ridge-and-valley structure
   from a 45° angle. The white nodal lines divide the floor into cyan and
   magenta lobes (30 s).
7. **Top-down view** — press Numpad 7. The 12-lobe ψ⁺(2,3) symmetry is
   clearest from directly above. Hold 15 s.
8. **Shape key demonstration** — open Object Properties → Shape Keys panel.  
   Slowly drag `mode_1_2_plus` from 0 → 1. The 12-lobe basis collapses to the
   4-lobe diagonal cross. Return to 0 (30 s).  
   Then drag `mode_3_4_minus` from 0 → 1. The 24-lobe starburst emerges.
   Return to 0 (30 s).
9. **Open record.py** — load from Text menu, press Alt+P. Show progress
   bar as Workbench renders 90 frames (20–30 s).
10. **Play the viewport animation** — open Image Editor → play `viewport.mp4`
    showing the morph sequence (15 s).

## Post-processing

None required. Trim the start/end slate and export at 1920 × 1080 / 30 fps.
