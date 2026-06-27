# Screen Recording Notes — GN Distribute Points in Volume: Crystalline Geode Interior

Target file: `public/library/videos/geometry-nodes/gn-distribute-points-in-volume-crystal-geode/screen.mp4`

## Software

- **OBS Studio** or Windows Game Bar (`Win + G`)
- Blender 5.1 with `crystal_geode.blend` open
- Output: 1920 × 1080, 30 fps, no audio

## OBS Setup

1. **Add Source → Window Capture** → select Blender
2. **Output**: MP4, x264, 8000 kbps, 30 fps
3. **Save to**: `public/library/videos/geometry-nodes/gn-distribute-points-in-volume-crystal-geode/screen.mp4`

## Blender Window Layout

### Left 60% — 3D Viewport
- **Shading**: Material Preview (shows emission cyan on crystals, grey on shell)
- **View**: Slightly elevated front-left angle so both the geode exterior and the
  interior crystals are visible — use `Numpad 1` then orbit up ~15° and left ~25°
- Hold `Alt + Z` to toggle X-Ray mode on/off during recording to reveal the
  interior crystal distribution

### Right 40% — Geometry Nodes Editor
- Open `GN_DistributeVolumeGeode` node group
- Keep visible: **MeshToVolume** → **DistributePointsInVolume** → **DeleteGeometry** →
  **InstanceOnPoints** → **RealizeInstances** → **JoinGeometry**
- Highlight the `GeometryNodeProximity` node and its `GREATER_THAN` compare so
  viewers can see the surface-depth filter

## Recording Flow (approx. 90 seconds)

1. **[0:00 – 0:10]** Show the geode in Material Preview from the exterior.
   The grey stone shell is visible. Note the warm-grey faceted outer surface.

2. **[0:10 – 0:25]** Toggle X-Ray mode (`Alt + Z`). The cyan crystal inclusions
   appear clustered inside the shell. Point out that there are NO crystals in a
   ~0.2 m rim zone near the inner surface — that is the GeometryProximity filter.

3. **[0:25 – 0:50]** Switch to the GN editor. Walk through the main chain:
   - `MeshToVolume`: point out the `Voxel Size = 0.065` and `Interior Band Width = 8.0`
     settings that fill the whole enclosed interior with density 1.0.
   - `DistributePointsInVolume`: show `mode = DENSITY_RANDOM` and `Density = 4.5`.
     Change Density from 4.5 to 1.0 live — viewers see crystals thin out in the
     viewport immediately. Restore to 4.5.
   - `GeometryProximity` + `Compare(GREATER_THAN, 0.20)` + `DeleteGeometry`:
     explain the safety-margin filter. Change the threshold to 0.0 live to show
     crystals poking through the shell wall, then restore to 0.20.

4. **[0:50 – 1:10]** Back in 3D viewport, switch shading to Rendered (EEVEE Next).
   The cyan emission crystals glow inside the stone shell. Slowly orbit the geode
   a full 360° (`Numpad 4` / mouse drag) so all crystal positions are visible.

5. **[1:10 – 1:30]** Switch the `DistributePointsInVolume.mode` from
   `DENSITY_RANDOM` to `DENSITY_GRID`. Show how the crystals snap to a perfectly
   regular 3-D lattice. Restore to `DENSITY_RANDOM`.

## After Recording

Trim to 60–90 seconds. Save to the target path above.
