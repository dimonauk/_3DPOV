# Screen Recording Notes — EEVEE Next SSR Metal Spheres

## Software

OBS Studio 30+ or Windows Game Bar (Win+G)

## Window source

Blender 5.1 — 3D Viewport maximised to 1920×1080

## Settings

- Resolution: 1920×1080
- Frame rate: 30 fps
- Audio: OFF

## What to capture

1. **Open blend, Material Preview first** — orbit the sphere row in LookDev
   mode (Rendered = off) so viewers can see the raw geometry.
2. **Switch to Rendered mode** (Z key → Rendered). EEVEE activates; SSR floor
   reflections appear under spheres 0–3. Note the visual drop at sphere 4.
3. **Toggle SSR off** — Properties ▸ Render ▸ Screen Space Reflections →
   uncheck. Floor goes dark. Re-enable to restore.
4. **Drag Max Roughness** from 0.45 → 1.0: SSR extends to all spheres.
   Drag to 0.0: only the perfect mirror sphere 0 shows SSR. Reset to 0.45.
5. **Pan camera to screen edge** — orbit so sphere 5 (roughness 1.0) nearly
   exits frame to the right. The reflection on the floor near the edge
   softens → that is border_fade = 0.08 blending to the probe.
6. **Run record.py** in Scripting workspace. Switch back to 3D Viewport
   to show the sphere-drop animation rendering frame by frame.

## Save path

`public/library/videos/rendering/eevee-next-ray-tracing-ssr-glossy/screen.mp4`
