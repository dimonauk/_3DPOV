# Screen Recording Notes — Riemann Zeta Stage Floor

**OBS Studio / Game Bar settings for `screen.mp4`**

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264) |
| Bitrate | 8000 kbps |

---

## Steps to record

1. Open `hf_riemann_zeta.blend` in Blender 5.1.
2. Switch to **Layout** workspace; set viewport shading to **Material Preview** (Lookdev, press Z → Material Preview).
3. In the top-right Scene Properties, confirm render engine = **EEVEE Next**.
4. Set the Timeline to frame 0.  Press **Numpad 0** to enter Camera view.
5. Start OBS recording (or Win+G → Record).
6. In Blender: press **Space** — the viewport will sit still (no animation keyframes on
   the floor mesh itself).  Manually orbit with Middle-Mouse to show:
   - The full floor from the west (σ=0) side
   - A tight zoom over the critical line (golden spine at x=0)
   - A close pass over each of the five red zero-marker cylinders
   - The high-curvature spike near t=0, σ→1 (the s=1 simple pole neighbourhood)
   - A final elevated view showing the bilateral symmetry across σ=½
7. Stop recording after ~30–60 seconds.
8. Save as `screen.mp4` → `public/library/videos/scripting/python-numpy-riemann-zeta-critical-strip-nontrivial-zeros-euler-product-stage-floor-webxr/screen.mp4`.

## Viewport tips

- **Overlay → Statistics** helps confirm vertex/face count in the recording.
- Drag the golden critical-line spine into view first — it orients the viewer.
- The five red cylinders mark t = 14.13, 21.02, 25.01, 30.42, 32.94; narrate
  each one if recording voice-over.
- `record.py` produces `viewport.mp4` automatically (orbital camera pass).
  `screen.mp4` is the *manual* Blender session capture for the tutorial video.
