# Screen Recording Notes — Analytical 2-Joint IK in GN

**Target file:** `public/library/videos/geometry-nodes/gn-rotation-math-analytical-2joint-ik-law-cosines-poi-arm/screen.mp4`

## Setup

1. Open `hf_2joint_ik.blend` in Blender 5.1.
2. Set the viewport to **3D Viewport** in **Solid** or **LookDev** shading.
3. Split the editor: keep 3D Viewport on the left, open the **Geometry Node Editor** on the right so the IK node tree is visible.

## OBS settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Format | MP4 (H.264, CRF 18) |

## What to record (≈ 60 seconds)

1. **(0–10 s)** Select `PoiTarget` empty. Use **G → X** or **G → Y** to drag it
   slowly into different regions — show the arm tracking smoothly.
2. **(10–25 s)** Drag the target outside the reach envelope (d > 2.7 m) —
   show the arm extending straight (singularity clamping in action).
3. **(25–40 s)** Switch to the Geometry Node Editor pane. Highlight the
   `cos_θe` → clamp → `θ_e` chain and the `α` / `β` branch.
4. **(40–55 s)** Play the pre-keyed figure-8 animation (Space Bar) —
   watch the arm trace the Lemniscate path.
5. **(55–60 s)** Return to the solid viewport overview shot.

## Tips

- Enable **Overlay → Statistics** so poly count is visible.
- Use a **dark theme** (Edit → Preferences → Themes → Blender Dark).
- Zoom the GN editor enough that `HF_2JointIK` node labels are legible at 1080p.
