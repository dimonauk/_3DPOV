# Screen Recording Notes
## Calabi-Yau Quintic Poi Head

**Target file:** `public/library/videos/scripting/python-numpy-calabi-yau-quintic-threefold-hanson-slice-poi-webxr/screen.mp4`

---

### Software

| Tool | Setting |
|------|---------|
| OBS Studio (recommended) | Scene → Window Capture → `Blender` |
| Xbox Game Bar (Windows) | Win + G → Capture → This window |
| Screenshot: macOS | `⌘⇧5` → Record selected window → Blender |

---

### OBS Setup

1. **Add Source** → Window Capture → select the Blender window.
2. **Output** → Recording:
   - Container: MKV (remux to MP4 afterwards via File → Remux)
   - Video codec: x264 · CRF 18 · Preset: veryfast
   - Audio: **off** (Tracks → uncheck all)
3. **Video** → Base & Output resolution: **1920 × 1080** · FPS: **30**
4. Do NOT record the OBS toolbar — crop the capture to Blender's viewport area only.

---

### What to Record

| Segment | Duration | Notes |
|---------|----------|-------|
| Open a fresh Blender 5.1 window, switch to Scripting workspace | 10 s | Show the empty text editor |
| Paste `blueprint.py`, click **Run Script** | 20 s | Watch the five-petal mesh appear in the viewport |
| Switch to Material Preview (`Z` → Material Preview) | 5 s | Show the five branch colours |
| Orbit around the mesh with MMB drag | 10 s | Three slow 360° views: top, side, ¾ angle |
| Paste `record.py`, click **Run Script** (starts rendering) | 5 s | Show the render progress bar |
| Show the rendered `viewport.mp4` in Media Preview | 5 s | Scrub through the orbit |

**Total target:** ~55 seconds.  Edit down to ≤ 30 s for the tutorial thumbnail reel.

---

### Blender Viewport Hints

- Set the viewport shading to **Material Preview** (Z key → fourth option) before recording — it shows the metallic vertex-colour material better than Solid mode.
- Enable **Viewport Overlay → Statistics** (top-right Overlays dropdown) to show vertex count on screen: confirms "562 500 total verts across 5 sheets" if you kept U=V=100 but reduced to 5 sheets × 10 000 = **50 000** with the default 100×100 grid.
- The five petals should be clearly distinct: gold (sheet 0), coral (1), sky (2), jade (3), violet (4).

---

### Remux MKV → MP4 (OBS)

File → Remux Recordings → drag the `.mkv` file → **Remux**.  Output: same path with `.mp4` extension.  Move the final `.mp4` to the `videos/…/` directory listed above.
