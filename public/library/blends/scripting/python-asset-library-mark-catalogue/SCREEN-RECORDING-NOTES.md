# Screen Recording Notes — Python Asset Library API
## Blender 5.1 | Holoflow Studio

### Software
- **OBS Studio** (recommended) or Windows Game Bar (Win + G)
- Window source: Blender 5.1 application window
- Resolution: 1920 × 1080
- Frame rate: 30 fps
- Audio: OFF (no mic/desktop audio for this tutorial)
- Output: `public/library/videos/scripting/python-asset-library-mark-catalogue/screen.mp4`

---

### What to capture (shot list)

**Beat 1 — Setup (0:00–0:25)**
1. Open Blender 5.1, new General scene.
2. Open the Scripting workspace (top tab bar → Scripting).
3. In the Text Editor, press **New**, paste `blueprint.py`, save as `blueprint.py`.
4. Hit **Run Script** (▶ button or Alt + P).
5. *Show the Info header* — confirm no errors appear.

**Beat 2 — Inspect the Marked Materials (0:25–1:00)**
1. Switch to the **Asset Browser** (Editor Type dropdown → Asset Browser).
2. In the Asset Browser top-left, set Source to **Current File**.
3. Show the four materials appearing: HF_Faceted_Flat, HF_Toon_Cel, HF_Glass_Clear, HF_Emissive_Grid.
4. Click each material, show the **Metadata panel** on the right:
   - Description text
   - Tags list
   - Catalog path (should show Holoflow/Materials/PBR or NPR)

**Beat 3 — The .cats.txt file (1:00–1:20)**
1. Open a file manager (or Blender's File Browser) to `~` (home dir).
2. Show `holoflow_asset_lib.cats.txt` — open in a text editor, walk the UUID lines.
3. *Narrate*: "These UUIDs are the stable keys Blender uses to link materials to categories across file saves."

**Beat 4 — Registering as an External Library (1:20–2:00)**
1. In Blender: **Edit → Preferences → File Paths → Asset Libraries**.
2. Press **+** to add a new library.
3. Set the path to `~/` (home dir, where `holoflow_asset_lib.blend` was saved).
4. Name it **Holoflow Studio**.
5. Click **Save Preferences**.
6. Go back to Asset Browser → Source → **Holoflow Studio**.
7. Show the materials appearing in the library panel — now accessible from any .blend.

**Beat 5 — Drag-and-Drop Usage (2:00–2:30)**
1. Open a new .blend (File → New → General).
2. Open Asset Browser alongside the 3D Viewport (drag-split the viewport).
3. In Asset Browser, navigate to Holoflow Studio → Materials → PBR.
4. Drag `HF_Faceted_Flat` onto the default cube in the 3D Viewport.
5. Show the material appearing in the Material Properties slot.

**Beat 6 — Batch Re-run (2:30–2:45)**
1. Modify a tag in blueprint.py (e.g., add `"2026"` to the faceted material tags).
2. Re-run the script.
3. Show the Asset Browser refreshing — the new tag appears without losing the catalog assignment.

---

### OBS settings checklist
- [ ] Scene created, Blender window added as Window Capture source
- [ ] Resolution: 1920 × 1080, FPS: 30 (fixed, not VFR)
- [ ] Bitrate: 8000 kbps CQP or CBR
- [ ] Recording format: MP4 (H.264)
- [ ] Audio tracks: ALL disabled
- [ ] Test recording runs before main take
