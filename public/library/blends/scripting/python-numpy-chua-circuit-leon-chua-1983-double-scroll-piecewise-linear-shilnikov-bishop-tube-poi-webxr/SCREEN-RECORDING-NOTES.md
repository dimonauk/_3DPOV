# Screen-Recording Notes — Chua's Circuit Double-Scroll Attractor

Capture a screen recording of the Blender viewport whilst `record.py` renders,
or record yourself working through `blueprint.py` interactively.

## Software

| Tool | Setting |
|------|---------|
| OBS Studio ≥ 30 / Xbox Game Bar | Window capture → **Blender** |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no mic / system audio) |
| Codec | H.264 CRF 18 (OBS: quality "High") |

## OBS scene setup

1. **Sources → Add → Window Capture** → select the running Blender window.
2. Resize canvas to 1920 × 1080 if not already set.
3. Set **Output → Recording path** to  
   `public/library/videos/scripting/python-numpy-chua-circuit-leon-chua-1983-double-scroll-piecewise-linear-shilnikov-bishop-tube-poi-webxr/screen.mp4`

## What to capture

| Segment | Blender action |
|---------|---------------|
| 0–30 s | Open `blueprint.py` in the Scripting workspace; read through the header comment on piecewise linearity and the Shilnikov condition |
| 30–90 s | Run the script; watch the double-scroll tube appear in the 3D Viewport — note the two distinct lobes (one around P₊, one around P₋) |
| 90–120 s | Switch to Material Preview; rotate to show how cobalt (slow, inner) transitions to amber (fast, outer breakpoints) |
| 120–160 s | Open the Shape Key panel; manually scrub from Basis → SK_HighAlpha to show the tighter double-scroll, then SK_SpiralChua for the single-lobe topology change |
| 160–200 s | Open Shading workspace; show the `Chua_Speed` attribute node chain driving emission strength |
| 200–240 s | Run `record.py`; watch the animation frames render in the Image Editor |

## Key talking points for the recording

- Point out the **x = ±1 breakpoints** where the mesh changes curvature
  sharply — that is where the Chua diode switches conductance sign.
- Highlight how SK_SpiralChua (α=9.5) produces only **one lobe** — the
  orbit no longer crosses from P₊ to P₋, showing the pre-bifurcation regime.
- The **cobalt inner / amber outer** colouring maps directly to the
  divergence sign: blue (slow, near origin) = local expansion; amber
  (fast, outer region) = strong dissipation.

## Blender viewport settings for recording

- **Viewport shading**: Material Preview (sphere icon) with HDRI lighting
- **Overlays**: off (clean mesh only)
- **Gizmo**: off
- **Header**: visible (shows Blender version)
- **Theme**: Dark (default)

## File destination

`public/library/videos/scripting/python-numpy-chua-circuit-leon-chua-1983-double-scroll-piecewise-linear-shilnikov-bishop-tube-poi-webxr/screen.mp4`

Do **not** commit `.mp4` files — they are listed in `.gitignore`.  
Upload separately to the media CDN and reference by URL in the tutorial page.
