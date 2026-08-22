# Screen Recording Notes — MetaBall Blob Chain

**Target file:** `public/library/videos/scripting/python-metaball-blob-chain-remesh-webxr/screen.mp4`

## OBS / Game Bar setup

| Setting | Value |
|---|---|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no desktop audio) |
| Output format | MP4 / H.264 |
| CRF / quality | 18–22 (high quality) |

## What to record

1. **Scripting workspace open** — show `blueprint.py` loaded in the text editor.
   Scroll to the `CHAIN_SEGMENTS`, `RADIUS_MID`, `THRESHOLD`, and `FAMILY`
   constants at the top. Point out that `FAMILY = "BlobChain"` is what links
   three separate MetaBall objects into one isosurface.

2. **Run Script** — click Run Script. Switch immediately to Layout workspace
   so the viewer can watch the metaball tessellate in real time. Show the
   three objects in the Outliner (BlobChain, BlobChain.001, BlobChain.002)
   and the single merged isosurface in the viewport.

3. **Properties panel: MetaBall settings** — with BlobChain selected, open
   the Object Data Properties panel (green curve icon). Show `Threshold`,
   `Resolution View`, and `Render Resolution`. Live-drag `Threshold` between
   0.4 and 0.9 to show how the surface swells and contracts — then restore to
   0.60 before continuing.

4. **Convert to mesh** — the script already converted, but explain that this
   step happens automatically. Select BlobCreature (the converted mesh object)
   and show in the Outliner that the three BlobChain.* objects are gone — they
   merged into one mesh at convert time.

5. **Modifier stack** — with BlobCreature selected, open the Wrench tab in
   Properties. Show that the Remesh and Decimate modifiers have already been
   applied. Press Numpad 1 for front view; toggle Wireframe (Alt+Z) to show
   the clean quad topology left by Voxel Remesh.

6. **Material Preview** — press Z → Material Preview. Orbit with Middle Mouse
   to show the smooth surface and the head–body merge region.

7. **UV check** — Tab into Edit Mode, press 3 (face select), A to select all.
   Open a UV Editor alongside the viewport to show Smart UV Project islands.
   Return to Object Mode.

8. **Import the GLB** — File → Import → glTF 2.0, select `blob_chain.glb`.
   Delete the original BlobCreature object. Confirm the imported mesh looks
   identical. This validates the Draco-compressed export pipeline.

## Trim points

- Start: Scripting workspace visible with blueprint.py loaded
- End: after GLB import confirmation in step 8
- Target length: 4–7 minutes uncut
