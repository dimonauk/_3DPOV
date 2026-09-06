# Screen-Recording Notes — Liu Attractor (2004)

These instructions produce the `screen.mp4` companion to the programmatic
`viewport.mp4`. Screen.mp4 shows a human working inside Blender — running
the script, watching the mesh appear, and manually exploring shape keys.

---

## Software

| Tool | Setting |
|------|---------|
| **OBS Studio** (free) | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **OFF** — no microphone needed |
| Output format | MP4 / H.264, CRF 18 |

*Windows alternative:* Xbox Game Bar (`Win + G` → Record) at 1080p 30 fps.

---

## What to capture (target: 3–5 minutes)

1. **Open Blender 5.1** — new General file, Scripting workspace.
2. **Paste `blueprint.py`** into the Text Editor and hit **Run Script**.
   - Show the console output confirming vertex / face / shape-key counts.
3. **Switch to 3D Viewport** (Solid mode first, then Material Preview).
   - Slowly orbit the object with Middle-Mouse to reveal the butterfly wings.
4. **Open Properties → Object Data → Shape Keys panel.**
   - Drag the `SK_LoB` slider from 0→1: wings contract toward z=28.
   - Drag back to 0 then drag `SK_HiB` to 1: wings expand, orbit taller.
   - Try `SK_SoftZ` to 1: subtler orbit reshaping (slower z-decay).
5. **Switch to Rendered viewport (EEVEE Next)** — the cobalt–amber glow
   from the Liu_Speed colour attribute becomes vivid.
6. **Close** — end recording here.

---

## Output path

Place the finished file at:

```
public/library/videos/scripting/
  python-numpy-liu-attractor-2004-lorenz-variant-x-squared-z-driving-z2-symmetry-constant-divergence-rk4-bishop-tube-poi-webxr/
    screen.mp4
```

---

## Tips

- Keep the Blender window maximised; collapse the sidebar (`N`) before recording.
- Zoom in on the shape-key panel when adjusting sliders so the values are legible.
- A slow, deliberate orbit (hold Shift to slow down) looks better than a fast spin.
- The Liu attractor's z-axis is quite tall in Blender space — tilt the viewport
  ~30° down from horizontal to see both wings and the origin bridge simultaneously.
