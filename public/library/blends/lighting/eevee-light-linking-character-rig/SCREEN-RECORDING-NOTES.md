# Screen Recording Notes — EEVEE-Next Light Linking Character Rig

## Software
OBS Studio (Windows: Game Bar also works) or Kooha (Linux).

## Source
Window Capture → select the Blender 5.1 application window.

## Output settings
- Resolution: 1920 × 1080
- Frame rate: 30 fps
- Format: MP4 / H.264
- Audio: OFF (no commentary track for this recording)

## Save path
`public/library/videos/lighting/eevee-light-linking-character-rig/screen.mp4`

---

## What to record

### Part 1 — before / after in Rendered viewport (≈ 60 seconds)

1. Open `light_linking_hero.blend` in Blender 5.1.
2. Switch the 3D Viewport to **Rendered** shading mode
   (`Z` → Rendered, or click the sphere icon in the viewport header).
3. Show the scene as-is. Point out:
   - The rim light currently illuminates the character only.
   - The backdrop behind the character is dark — only the fill light reaches it.
4. In the **Outliner**, select `light_rim`.
5. In **Object Properties → Light Linking**, clear the Receiver Collection
   (remove `col_rim_recv`). The rim now hits everything.
   - Camera should show the backdrop flaring bright behind the character.
   - This is the "without linking" state — rim spill ruins depth.
6. Re-assign `col_rim_recv` to the Receiver Collection.
   - Backdrop drops dark, character rim halo restored. Clean separation visible.

### Part 2 — shadow linking demo (≈ 30 seconds)

1. Select `light_key`.
2. Object Properties → Shadow Linking → show that `col_key_blk` is assigned.
3. Add `env_backdrop` to `col_key_blk`. Render. The backdrop now casts a
   soft shadow onto the floor — usually undesirable for a portrait.
4. Remove `env_backdrop` from `col_key_blk`. Clean floor shadow restored.

### Part 3 — Python API inspector (≈ 20 seconds)

1. Open the Python console (Scripting workspace or bottom-left icon).
2. Type:
   ```python
   bpy.data.objects['light_rim'].light_linking.receiver_collection
   ```
   Show the Collection returned.
3. Show:
   ```python
   bpy.data.objects['light_key'].shadow_linking.blocker_collection
   ```

---

## Trim and export
Trim the recording to remove setup.
Export as `screen.mp4` into the folder above.
Do NOT include audio.
