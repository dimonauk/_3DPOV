# Screen Recording Notes
## Python load_post + driver_namespace — Production .blend Package

**File:** `public/library/videos/scripting/python-load-post-driver-namespace-blend-package-setup/screen.mp4`
**Tool:** OBS Studio or Xbox Game Bar
**Settings:** Source = Blender window · 1920×1080 · 30 fps · Audio off

---

### Part 1 — Scripting workspace: run blueprint.py (≈ 45 seconds)

1. Open Blender 5.1 → Scripting workspace.
2. `Text > Open` → navigate to `blueprint.py` and open it.
3. Zoom into the **`register_handlers()`** function so both it and the
   `@bpy.app.handlers.persistent` decorators are on screen.
4. Press **Alt+P** (Run Script). Watch the Info bar at the top for
   `[Holoflow] Saved: ...` messages.
5. Zoom out to show the full script; pause 3 seconds.

### Part 2 — Python Console: inspect handlers and driver_namespace (≈ 40 seconds)

1. Switch one area to **Python Console** (⌄ menu in any area header).
2. Type and run:
   ```python
   [h.__name__ for h in bpy.app.handlers.load_post]
   ```
   Show the output — `holoflow_load_post` should appear.
3. Then type:
   ```python
   [k for k in bpy.app.driver_namespace if k.startswith('hs_')]
   ```
   Show `['hs_breathe', 'hs_blink', 'hs_orbit']`.

### Part 3 — Graph Editor: driver expression on the crystal (≈ 30 seconds)

1. Click the hex-cylinder crystal in the 3D Viewport.
2. Open a **Graph Editor** area.
3. With the crystal selected, press **N** to open the side panel,
   click **Drivers** sub-tab (or filter by `scale.z`).
4. Zoom into the F-Curve for `Scale Z` — the oscillation should be visible.
5. Show the driver expression panel: `hs_breathe(frame, 0.04, 30.0)`.

### Part 4 — Reload demo: close and reopen the .blend (≈ 25 seconds)

1. `File > Open` → open `holoflow_package_demo.blend`.
2. Immediately open the Python Console and run:
   ```python
   [k for k in bpy.app.driver_namespace if k.startswith('hs_')]
   ```
   Show that `hs_breathe` is **already registered** — the `load_post`
   handler fired automatically on open.
3. Run:
   ```python
   bpy.context.scene.get('hs_package_version')
   ```
   Show `'1.0.0'`.

---

**Total target duration:** ≈ 2 minutes 20 seconds. Trim silences in VSE.
Save as `screen.mp4` in the `videos/` path above.
