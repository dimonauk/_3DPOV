# Screen Recording Notes — Automotive Paint: Three-Layer Shader

**File**: `screen.mp4` → `public/library/videos/shading/shader-automotive-paint-coat-metallic-flake/screen.mp4`

## OBS / Windows Game Bar Settings

| Setting | Value |
|---|---|
| Window source | Blender 5.1 (main window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Encoder | x264 (quality 18) or NVENC |
| Output format | MP4 / H.264 |

## What to Record

### Part 1 — Shader Editor walkthrough (2–3 min)

1. Open `automotive_paint.blend`. Ensure viewport shading is **Rendered (Cycles)**.
2. Split viewport: left panel = 3D Viewport (rendered), right = Shader Editor.
3. In Shader Editor, **select the panel object** (M_AutomotivePaint material loads).
4. Walk through nodes left to right:
   - **Noise Texture A** (Scale 88) → **Color Ramp** (CONSTANT interpolation — note hard step)
   - Highlight the CONSTANT mode: *"This is what makes discrete flakes rather than a blur."*
   - Ramp output → **Principled BSDF Metallic** socket. Toggle coverage slider from 0 → 1 in viewport so viewer sees metal wash in.
   - **Noise Texture B** (same scale, W offset 0.27) → **Bump** → **Normal** socket.
   - Point at Bump node Strength = 1.8: *"This tilts each flake's micro-normal — that's what causes the sparkle to shift as you orbit the camera."*
   - **Mix (float)** node: shows roughness interpolating between 0.48 (base coat) and 0.07 (flake) based on the same metallic mask.
5. Scroll right to **Principled BSDF**. Expand the Coat section:
   - Coat Weight = 1.0, Coat IOR = 1.50, Coat Roughness = 0.018.
   - Scrub Coat Roughness from 0.018 → 0.4 → back: viewer sees coat go from mirror to frosted.

### Part 2 — Live viewport orbit (1 min)

1. Switch to **3D Viewport** full screen, Rendered mode.
2. **Orbit the camera slowly** (middle-mouse drag) from left side of panel to right.
3. Pause at 3–4 positions where key light creates a hot-coat-highlight + surrounding flake sparkle.
4. Demonstrate the two highlights coexisting: large soft blob (coat) + tiny hard points (flakes).

### Part 3 — Run blueprint.py (1 min)

1. Switch to Scripting workspace.
2. Open `blueprint.py`, click Run Script.
3. Show terminal output confirming `.blend` and `.glb` written.
4. Open the GLB in Viewport (File → Import → glTF) and orbit briefly.

### Part 4 — Viewport render playback (30 s)

1. In a new Blender instance with the blend loaded, run `record.py`.
2. Open Video Sequence Editor, load the resulting `viewport.mp4`.
3. Play back — audience sees the camera-orbit sparkle animation.

## Capture Tips

- Switch viewport to **Rendered** (Z key → Rendered, or top-right sphere icon) **before** starting capture — Solid mode will not show flakes.
- Keep ambient world strength low (≤ 0.1) so the specular flake pop reads against a dark background.
- Move the mouse deliberately; jerky orbiting obscures whether sparkle is view-angle-dependent or just noise.
- Avoid recording the node label toolbar area if possible — focus on the actual node network.
