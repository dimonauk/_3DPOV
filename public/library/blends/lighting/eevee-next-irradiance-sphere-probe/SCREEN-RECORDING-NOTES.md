# Screen Recording Notes — EEVEE Next Irradiance Volume + Sphere Probe

**Output file:** `public/library/videos/lighting/eevee-next-irradiance-sphere-probe/screen.mp4`

## OBS Studio settings

| Setting | Value |
|---|---|
| Source type | Window Capture |
| Window | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | None (no mic) |
| Output format | MP4 / H.264 |
| CRF | 18 (high quality) |

## Scene to capture

Run `blueprint.py` from Blender's Scripting workspace.  The script builds the
room, chrome sphere, irradiance volume, and sphere probe objects.  Probes
are NOT yet baked — recording the bake is the central educational moment.

## Recording sequence (aim for 3–5 minutes)

1. **Show the unbaked state** — switch 3D Viewport to Rendered mode with EEVEE Next.
   The chrome sphere reflects only the World environment (grey).  The red and green
   walls show no colour bleeding onto the floor.  This is the baseline.

2. **Open Indirect Lighting panel** — Properties › Render › Indirect Lighting.
   Show the Irradiance Volume and Sphere Probe listed.  Point out the resolution
   settings (`gi_cubemap_resolution = 256`, `gi_irradiance_pool_size = 32`).

3. **Bake** — click **Bake Indirect Lighting**.  The status bar shows progress
   as each probe voxel is captured.  Let the recording run during the bake —
   the real-time progress bar is instructive.

4. **Show the baked result** — after baking, the chrome sphere now reflects
   coloured room geometry.  Pan the camera: the red wall bleeds pink-red GI onto
   the floor and ceiling near it; the green panel bleeds cool green on the right.
   The pedestal under the sphere shows warm-to-cool gradient from area light vs fill.

5. **Probe toggle demo** — select the Sphere Probe object, press `H` to hide it
   (removes its influence; EEVEE rebuilds realtime).  The chrome ball snaps back to
   world-only reflection.  Press `Alt+H` to unhide — reflections return.

6. **Influence boundary** — select the Irradiance Volume, tab into Properties ›
   Object Data.  Increase `Clip End` from 10 to 15 m — no visual change (room is
   only 4 m deep); reduce `Intensity` to 0.3 — diffuse GI dims everywhere within
   the volume.  Set back to 1.0.

7. **Save and export** — File › Save (preserves bake cache), then
   File › Export › glTF 2.0 with Draco compression.  Show that the GLB is smaller
   than the .blend because probe cache data is not included.

## Common mistakes to narrate

- Adding a probe but forgetting to bake — the most common beginner error
- Placing the Sphere Probe far from the reflective object — reflection data from the
  wrong room position creates impossible-looking reflections
- Setting `clip_start` to 0 — causes self-intersection artefacts on the probe cubemap
  (dark patches or black rings on the chrome sphere)
