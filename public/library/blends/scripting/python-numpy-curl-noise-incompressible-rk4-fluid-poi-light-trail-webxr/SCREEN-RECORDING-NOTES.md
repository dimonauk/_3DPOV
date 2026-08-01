# Screen Recording Notes — Curl Noise Poi Light Trails

## OBS / Xbox Game Bar setup

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (narration added in post) |
| Output file | `screen.mp4` |
| Codec | H.264 / AAC, CRF 18 |

## What to record

### Take 1 — Python console run (≈ 90 s)
1. Open Blender 5.1 → new General scene.
2. Switch top-right editor to **Scripting** workspace.
3. Click **New** to create a blank text block.
4. Paste `blueprint.py` in full.
5. Start OBS recording.
6. Click **Run Script** (▶). Wait for the console to print `[curl-noise] ✓ …`.
7. Switch viewport shading to **Rendered** (EEVEE Next).
8. Press **Numpad 0** → camera view → orbit to show the full trail cluster.
9. Stop OBS recording.

### Take 2 — Viewport playback (≈ 15 s)
1. With the scene from Take 1 still open, press **Space** to play the
   viewport.  (There is no animation on the curves — this demonstrates
   the static swirl structure from multiple angles using manual orbit.)
2. Orbit slowly with **Middle Mouse** while OBS records.

### Take 3 — GLB in browser (≈ 30 s)
1. Open <https://gltf.report> in the browser (keep Blender visible behind it).
2. Drag the exported `hf_curl_noise_poi.glb` onto the site.
3. Click the **Scene** tab → inspect primitive count and material list.
4. Rotate the model in the viewer while recording.

## Post-production checklist
- [ ] Cut talking-head intro (15 s) before each take
- [ ] Add chapter markers: `0:00 Theory`, `1:30 Code`, `3:00 Result`
- [ ] Export as H.264 MP4, 1920×1080, 30 fps, CRF 18
- [ ] Drop finished file at:
  `public/library/videos/scripting/python-numpy-curl-noise-incompressible-rk4-fluid-poi-light-trail-webxr/screen.mp4`
