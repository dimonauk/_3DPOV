# Screen Recording Notes — SSS Stylised Skin

**Output target:** `public/library/videos/shading/shader-subsurface-scattering-stylised-skin/screen.mp4`

---

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off (no mic input needed) |
| Output format | MP4 / H.264 |
| Bitrate | 8000 kbps |

---

## Recording sequence (approx. 4 minutes)

### 1 — Open Properties › Material › Principled BSDF (0:00–0:45)
- Open `sss_skin.blend` (run `blueprint.py` if starting from scratch)
- Select the **head** object
- Open **Properties** panel → **Material** tab
- Expand the Principled BSDF node group
- Pan camera slowly over the **Subsurface** section to show all six inputs:
  Weight · Radius (R/G/B) · Scale · IOR · Anisotropy · Method dropdown

### 2 — Switch SSS Method live (0:45–1:30)
- With the head selected and a rim light pointing behind it:
  - **Set Method = BURLEY** → render a viewport preview (Numpad 0, Z-key for render preview)
    — note the ears appear grey/opaque
  - **Set Method = RANDOM_WALK_SKIN** → same view
    — ears glow warm red-orange. Pause on this contrast.
- This is the key visual beat: show the diff clearly before moving on.

### 3 — Adjust Subsurface Weight live (1:30–2:15)
- Select head, go to Shader Editor (Shift+F3 or header icon)
- Find the Principled BSDF node
- Drag **Subsurface Weight** from 0 → 1 → 0.55 in real-time (EEVEE preview)
- Narrate: "0 is pure diffuse, 1 is full translucent jelly. Anime skin sits around 0.5–0.6"

### 4 — Inspect Radius channels (2:15–3:00)
- On the Subsurface Radius input, show it is a **colour/vector** input
- Click to expand and set individual R/G/B channels
- Demonstrate: set B=0 → deep blue loss; set R=0 → no warmth in the glow
- Restore to `(1.0, 0.42, 0.25)` for the final look

### 5 — Final rotating render preview (3:00–4:00)
- In the 3D viewport, set shading to **Rendered** (Z → Rendered)
- Press **Space** to play the 120-frame rotation animation
- Camera stays fixed; head, ears, lips rotate 360°
- At frame ~60 (back-lit position) the ears should show visible warm glow
- Let it play through once, then stop and trim the recording

---

## Naming the output file
Save as: `screen.mp4` and place at:
`public/library/videos/shading/shader-subsurface-scattering-stylised-skin/screen.mp4`

Do **not** commit `.mp4` files to git — they are listed in `.gitignore`.
Place them in the `public/library/videos/` path for local preview only.
