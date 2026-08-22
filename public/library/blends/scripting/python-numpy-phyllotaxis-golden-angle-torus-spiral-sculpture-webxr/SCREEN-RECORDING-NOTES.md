# Screen Recording Notes — Phyllotaxis Golden Angle Spiral

**Software**: OBS Studio 30+ or Windows Game Bar  
**Source**: Window Capture → Blender 5.1  
**Resolution**: 1920 × 1080  
**Frame rate**: 30 fps  
**Audio**: Off  
**Output**: `screen.mp4` alongside `viewport.mp4`

---

## What to capture

The script produces two sculptures: a Vogel sunflower disk and a torus
wound with a golden-angle lattice. The recording should show:

1. **Run blueprint.py** (Scripting workspace → Run Script).
   - Console prints `[hf] disk florets: 500  torus florets: 300`.
   - Both meshes appear in viewport — disk at X=+3.2, torus at origin.

2. **Switch to Rendered viewport** (Z → Rendered) in EEVEE Next.
   - Bloom makes the emission florets glow — warm gold disk, cyan-magenta torus.
   - Top-down view of disk: count the clockwise/counter-clockwise spirals —
     you should see 13 and 21 arms (consecutive Fibonacci numbers).

3. **Orbit around torus** using middle-mouse drag.
   - Show the golden lattice covering the torus surface without gaps.
   - Note how florets near the inner equator are denser than the outer edge
     (smaller radius → higher poloidal curvature → apparent closer packing).

4. **Zoom into disk centre** — where florets are smallest and densest,
   showing the square-root area-density law working correctly.

5. **Run record.py** — let the 120-frame animation render; capture the
   render progress bar in Blender's header.

---

## Clip structure (tutorial cut)

| Clip | Duration | Content |
|------|----------|---------|
| intro | 8 s | Top-down disk in Rendered view, counting spirals |
| golden-angle | 12 s | Annotate golden angle ≈ 137.5° in the scripting window |
| torus orbit | 15 s | Slow orbit around torus showing lattice coverage |
| both objects | 8 s | Wide two-shot of disk + torus, pull back |
| render | 7 s | record.py running, viewport.mp4 output in file manager |

---

## OBS Scene setup

```
Scene: BlenderPhyllotaxis
├── Window Capture: Blender
└── (optional) Image Overlay: Holoflow watermark bottom-right
```

Hotkeys: Start F9, Stop F9. Save output as `screen.mp4` in:
`public/library/videos/scripting/python-numpy-phyllotaxis-golden-angle-torus-spiral-sculpture-webxr/`
