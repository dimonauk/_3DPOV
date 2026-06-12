# Screen Recording Notes — Soft Body Jelly Blob

## Window setup

1. Open Blender 5.1.  Load `blueprint.py` from the Scripting workspace and run it.
2. Workspace: **Layout** (default).
3. 3D Viewport shading: **Rendered** (Z → Rendered, or click the sphere icon in the header).
4. Timeline visible at the bottom — drag the top edge upward if it's too thin.
5. Properties panel visible on the right — pin to **Physics** tab (wrench-looking icon → person icon).

## Window/capture settings

- **OBS / Windows Game Bar**: window capture, target = Blender
- Resolution: **1920 × 1080**
- Frame rate: **30 fps**
- Audio: **off** (no mic, no system audio needed)
- Output: `screen.mp4` — save next to `viewport.mp4`

## What to record (in order)

1. **(0:00 – 0:20)**  
   Run `blueprint.py` from the Scripting workspace.  Show the terminal output
   confirming "Jelly Blob scene ready."  Switch to Layout.

2. **(0:20 – 0:50)**  
   Show the Properties panel → Physics tab with the Soft Body modifier expanded.
   Scroll through Goal, Edge Springs, Solver settings slowly so the viewer can
   read the values.

3. **(0:50 – 1:10)**  
   Switch to **Weight Paint** mode (Ctrl+Tab → Weight Paint).  Show the painted
   goal group on the blob — crown in red (high), underside in blue (low).
   Return to Object mode.

4. **(1:10 – 1:30)**  
   In Properties → Physics → Soft Body → Cache, click **Bake All Dynamics**.
   Keep recording while the progress bar fills.  Narrate: *"The solver runs
   40 substeps per frame — you can see the progress bar advancing."*

5. **(1:30 – 2:00)**  
   Play the animation (Space).  Watch the blob fall, squash flat on impact,
   stretch upward on rebound, and damp to rest.  Let it loop twice.

6. **(2:00 – 2:30)**  
   Scrub to frame 22 (max squash) and hold for 3 seconds.  Then scrub to
   frame 30 (max stretch) and hold.  Point out the volume preservation
   (blob wider on squash, narrower on stretch, roughly equal volume).

7. **(2:30 – 3:00)**  
   Show the Shape Keys panel (Object Data Properties → Shape Keys) populated
   after running the harvest step.  Scrub the Squash key value from 0 → 1
   to show the squash shape key in isolation.

8. **(3:00 – 3:30)**  
   Run `record.py` from the Scripting workspace.  Show the render progress
   in the Info bar at the top.

## Cuts to make in post

- Trim the bake wait to 10 seconds of real time (speed-ramp or cut).
- Add a title card at the start: **"Soft Body Physics — Blender 5.1"**.
- Add a lower-third label at each step matching the section headers above.

## File naming

Save the raw capture as `screen_raw.mp4` alongside `viewport.mp4`, then export
the edited version as `screen.mp4` in the same folder.
