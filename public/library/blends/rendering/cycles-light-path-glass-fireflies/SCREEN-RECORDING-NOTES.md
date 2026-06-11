# Screen Recording Notes — Cycles Light Path Glass Fireflies

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264) |
| Output path | `public/library/videos/rendering/cycles-light-path-glass-fireflies/screen.mp4` |

## What to record

### Scene preparation (~1 minute)
1. Open Blender 5.1, switch to the **Scripting** workspace.
2. Open `blueprint.py` and click **Run Script**.
3. Switch to the **Layout** workspace.
4. Press <kbd>Z</kbd> → **Rendered** to enter Cycles Rendered viewport.
5. Wait for the first progressive pass to finish (5–10 seconds).

### Take 1 — Fireflies comparison (30 seconds)
1. Open the **Shader Editor** with the glass material selected.
2. Disconnect the `Is Shadow Ray` output from `Mix Shader` Factor (drag it off).
3. Let Cycles accumulate for ~10 seconds — note the bright speckle on the floor.
4. Reconnect the `Is Shadow Ray` link.
5. Let Cycles accumulate for ~10 seconds — note the clean result.

### Take 2 — Node walk (45 seconds)
1. Pan to the full Light Path node in the Shader Editor.
2. Hover over each output socket with the cursor to narrate the ray types.
3. Show the Mix Shader with Is Shadow Ray → Factor → Transparent path.

### Take 3 — Bounce and clamp settings (20 seconds)
1. Open **Properties › Render › Sampling** (expand Light Paths).
2. Hover over `Max Bounces`, `Transmission`, `Transparent Max`.
3. Open **Clamping** and show `Direct Light` and `Indirect Light` values.

### Take 4 — Camera orbit (10 seconds)
1. Back in the 3D Viewport (Rendered mode), orbit the camera slowly around
   the prism with Middle Mouse to show glass refraction from different angles.

## Post-processing
None required.  Trim to ≤ 3 minutes total.  The video is for the tutorial
page on holoflow.co.uk, not a broadcast deliverable.
