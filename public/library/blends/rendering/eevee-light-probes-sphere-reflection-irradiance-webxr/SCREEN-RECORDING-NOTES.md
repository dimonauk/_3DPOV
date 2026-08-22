# Screen Recording Notes — EEVEE Next Light Probes

**Output file:** `public/library/videos/rendering/eevee-light-probes-sphere-reflection-irradiance-webxr/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Format | MP4 (H.264) |

## Recommended walkthrough sequence (~5–8 min)

1. **Open probe_scene.blend.** Show the scene in Solid view — flat, grey without
   reflections. Switch to Material Preview (Z → 3) and then Rendered view (Z → 8).
   Note that the chrome sphere may look dark or show only the world gradient.

2. **Probe properties — Sphere probe.** Select `refl_sphere_probe`. In Properties →
   Object Data Properties (the green probe icon), show Influence Distance (3.5 m)
   and Falloff (0.15). Scrub this live to show how the influence sphere gizmo changes.

3. **Bake the probes.** In Render Properties (camera icon), scroll to the
   **Light Probes** section. Click **Bake All Light Probes**. A progress bar appears
   in the header. Wait for completion (~10–30 s depending on GPU). Show the viewport
   updating — the chrome sphere now shows a reflection of the area lights and back wall.

4. **Compare Sphere probe vs world-only.** With the probe selected, toggle its
   visibility (H to hide). The chrome sphere falls back to the world gradient only
   (flat teal/dark). Un-hide (Alt+H). The local environment returns.

5. **Irradiance Volume properties.** Select `irradiance_vol_probe`. Show the 4×4×2
   grid of sample points as orange dots in the viewport. In Object Data Properties
   show grid_resolution settings. Increase Z to 4 — re-bake — diffuse colour
   bleeding from the blue box onto the floor becomes more accurate.

6. **GLB export.** File → Export → glTF 2.0. Output path: `probe_scene.glb`.
   Settings: Include → Mesh Data, Materials. Under **Bake** — note that probe
   caches are NOT exported (no glTF probe extension exists). Confirm geometry
   and materials export correctly. Drag the GLB into a Three.js viewer to show
   the difference (Three.js provides its own env map).

7. **Raytracing comparison (optional).** Enable Render Properties → EEVEE →
   Raytracing. F12 render the scene. Reflections are now ray-traced in real time
   — much sharper than the probe cubemap. Explain the trade-off: raytracing
   requires a GPU with hardware RT support and is slower; probes work on any GPU.

## File save location

Save the screen recording to:
```
public/library/videos/rendering/eevee-light-probes-sphere-reflection-irradiance-webxr/screen.mp4
```
