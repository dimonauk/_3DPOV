# Screen Recording Notes — Cycles Path Guiding + Shadow Caustics

## Target file
`public/library/videos/rendering/cycles-path-guiding-caustics-glass/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic or desktop) |
| Encoder | x264 (software) or NVENC (GPU) |
| Bitrate | 8000 kbps |

## What to record (approx. 3–4 minutes)

### Part 1 — Scene setup (~90 s)
1. Open Blender 5.1 with the `caustic_glass.blend` produced by `blueprint.py`.
2. Orbit the viewport to show the glass sphere, pedestal, and floor in perspective.
3. Select the spot light.  Open Properties → Object Data → Shadow section.
   **Show the "Shadow Caustics" toggle — it must be ON.**
4. Open Render Properties → Sampling → Path Guiding.
   **Show the "Path Guiding" toggle ON and Training Samples = 128.**
5. Open Render Properties → Light Paths → Caustics.
   **Show "Refractive" ticked, "Reflective" unticked.**

### Part 2 — Material setup (~60 s)
1. Select the glass sphere.  Open the Shader Editor.
2. Show the Principled BSDF: Transmission Weight = 1.0, IOR = 1.52, Roughness = 0.0.
3. Note out loud: "Zero roughness = sharp caustic edge; any roughness above 0.02
   smears the focus into a blob."

### Part 3 — Render preview (~60 s)
1. Press F12 to start the Cycles render.
2. Let it run for at least 128 samples (the path guiding training phase).
3. After ~256 samples the caustic ellipse on the floor becomes visible.
   Point to it and note: "That bright ellipse is the refracted focus of the spot."
4. Let it run to ~512 samples to show the caustic brightening and sharpening.
5. Stop the render (Esc).  No need to reach 1024 for the recording.

### Part 4 — Comparison (~30 s)
1. Disable "Shadow Caustics" on the light (uncheck the toggle).
2. Re-render to 128 samples.  Show that the floor is almost uniformly dark —
   no caustic visible.  Re-enable to close the demonstration.

## Trim and export
- Cut dead time between steps.
- Target output: 3–4 minutes total.
- Export: H.264, 1920×1080, 30 fps, no audio.
- Save as `screen.mp4` in `public/library/videos/rendering/cycles-path-guiding-caustics-glass/`.
