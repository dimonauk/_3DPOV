# Screen Recording Notes — EEVEE Next Render Configuration

**Target file:** `public/library/videos/scripting/python-eevee-next-shadow-ssr-ao-render-config/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---|---|
| Capture source | Window — Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no commentary) |
| Output format | MP4 (H.264, CRF 18) |

## What to record

1. **Open Blender 5.1** → New General file.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` → click **Run Script**.
4. Press **Z → Rendered** in the 3D Viewport.  
   Show all six spheres with SSR floor reflections and GTAO contact shadow.
5. Open the **Properties → Render** panel (camera icon).  
   Point out: Engine = EEVEE Next, Sampling → TAA, Screen Space Reflections section, Ambient Occlusion section.
6. Open the **Scripting** workspace → Interactive Console.  
   Type `bpy.context.scene.eevee.ssr_max_roughness = 0.0` and press Enter.  
   Show the SSR reflections disappear from all spheres.  
   Reset to `0.50`.
7. Type `bpy.context.scene.eevee.use_gtao = False` and Enter.  
   Show the GTAO contact shadow vanish on the chalk sphere floor crease.  
   Reset to `True`.
8. Open the saved `eevee_preset_holoflow_webxr_preview.json` in a text editor next to Blender — show the values match what's in the Render Properties panel.

## Timing guide

| Segment | Duration |
|---|---|
| Run script, scene appears | 0:00 – 0:20 |
| Rendered viewport — all six spheres | 0:20 – 0:50 |
| Render Properties panel walkthrough | 0:50 – 1:15 |
| Live SSR toggle (ssr_max_roughness = 0) | 1:15 – 1:35 |
| Live GTAO toggle | 1:35 – 1:50 |
| JSON preset sidecar file | 1:50 – 2:10 |

Total target: **~2 minutes**.
