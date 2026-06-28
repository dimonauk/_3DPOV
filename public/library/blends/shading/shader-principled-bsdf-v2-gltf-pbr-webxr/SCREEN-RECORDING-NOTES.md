# Screen Recording Notes — Principled BSDF v2 → glTF PBR WebXR

**OBS / Windows Game Bar setup**

| Setting | Value |
|---|---|
| Window source | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output | `public/library/videos/shading/shader-principled-bsdf-v2-gltf-pbr-webxr/screen.mp4` |

## Shot list

1. **Script editor** — open `blueprint.py`. Pause on the constants block; use a screen-zoom to show every socket name beside its glTF mapping comment. Run the script (Alt+P).
2. **Shader Editor** — click into the material's Shader Editor. Show the Principled BSDF node. Hover each socket group in turn: Base layer, Specular, Coat, Sheen, Emission. The N-Panel sidebar should be closed so the node fills the frame.
3. **Viewport — Material Preview** — tumble around the shard (middle-mouse drag). The blue glow from the Emission socket should be visible. Switch to Rendered (Z → Rendered) to show the Coat layer gloss.
4. **Properties — Material — glTF Settings** — switch to the Properties panel → Material tab. Show the "glTF Material Output" subpanel if visible (it appears when KHR extensions are active).
5. **Script editor — record.py** — open `record.py` and run it. Switch to Timeline to show the keyframes being placed on the material's node tree action. Then let the OpenGL render play out.
6. **File Browser** — navigate to `public/library/videos/shading/…/` to show `viewport.mp4` written to disk. Right-click → Open externally.

## Timing target

- Blueprint run to first rendered view: ≈ 45 s
- Shader Editor walk-through: ≈ 60 s
- Record.py run + playback: ≈ 30 s
- Total raw screen recording: ≈ 3–4 minutes (trim to 60–90 s for the tutorial clip)

## Blender workspace tip

Enable the **Info** editor (top bar) so executed operator names scroll past — this documents which `bpy.ops` the script calls in real time.  Viewers learning the API find this invaluable.
