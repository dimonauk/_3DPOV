# Screen Recording Notes — Anisotropic BSDF: Brushed Metal & Circular-Titanium Disc

**Target file:** `public/library/videos/shading/shader-anisotropic-bsdf-brushed-metal/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

## Sequence to record (~8–10 minutes of source; edit to 2–3 min)

1. **Open Blender 5.1** → New General → open the Scripting workspace.
   Paste and run `blueprint.py`.  Switch to the 3D Viewport.  Both objects should
   appear: the rectangular panel on the left, the disc on the right.

2. **Switch to Rendered mode (Z → Rendered) with EEVEE Next.**
   Point out the rendered highlight on the panel — a single elongated streak across
   the long axis.  Note how it differs from the round hot-spot you'd see on a Principled
   BSDF with Roughness=0.14.

3. **Open the Shader Editor (split viewport).**  Select the panel and show the node tree:
   - `ShaderNodeTexCoord` → `Noise` → two `Math` nodes → `Roughness` socket
   - `ShaderNodeTangent` (UV_MAP mode) → `Tangent` socket
   - `ShaderNodeBsdfAnisotropic` — point out `Anisotropy = 0.88`, `distribution = GGX`
   - `ShaderNodeOutputMaterial`

4. **Select the disc.** Show its material tree — identical structure but `Tangent` is
   set to `RADIAL / Z`.  Scrub the timeline or orbit the viewport to show the ring-shaped
   highlight circling the disc face.

5. **Live demo — change Anisotropy.**
   Click the `Anisotropy` socket value on the Anisotropic BSDF node.
   - Set to 0.0 — watch the highlight shrink to a normal round point.
   - Set to 1.0 — watch the highlight become a thin line across the full object.
   - Reset to 0.88.

6. **Live demo — change Tangent direction (panel).**
   Select the panel's Tangent node.  Change `direction_type` from UV_MAP to RADIAL/Z.
   The linear streak should rotate to circle the panel's perimeter.  Undo.

7. **Orbit comparison.**
   Middle-mouse orbit around both objects slowly while in Rendered mode.  Point out:
   - Panel: the streak stays pinned to the surface, moving only as the light angle changes.
   - Disc: the ring stays concentric regardless of camera position.
   - Compare to an isotropic sphere: add a UV sphere temporarily, assign Principled BSDF
     Roughness=0.14, Metallic=1.0 — its highlight tracks the reflection vector;
     the anisotropic streak does not.

8. **Switch to Cycles** (Render Properties → Cycles).
   Wait for sample accumulation.  Point out the sharper, more physically accurate streak.
   The GGX distribution in Cycles is the reference implementation; EEVEE SSR is an
   approximation that reads well but lacks the characteristic Fresnel fringe at the
   streak edges visible in Cycles.

## File naming

| File | Path |
|---|---|
| Screen recording (raw) | `screen_raw.mp4` (desktop) |
| Edited final | `public/library/videos/shading/shader-anisotropic-bsdf-brushed-metal/screen.mp4` |

## Post-editing notes

- Trim dead time at script execution.
- Add lower-thirds text when mentioning node names: "ShaderNodeBsdfAnisotropic", "RADIAL tangent".
- Zoom in on the Anisotropy value slider during the live demo.
- Aim for total runtime under 3 minutes for the tutorial embed.
