# May–Leonard Cyclic Competition — Screen-Recording Notes

**Output file**: `public/library/videos/scripting/python-numpy-may-leonard.../screen.mp4`  
**Target**: 1920 × 1080, 30 fps, 60–90 seconds, audio off.

---

## Before recording

1. Open **Blender 5.1**.
2. Paste or open `blueprint.py` in the **Scripting** workspace.
3. Click **Run Script** — wait for  
   `[may-leonard] blueprint complete — N vertices`  
   in the system console (≈ 20–40 s depending on hardware).
4. Switch to **Layout** workspace. The tube should appear as a triangular-spiral  
   poi head centred at the origin, cobalt-to-amber gradient.
5. Set viewport shading to **Material Preview** (Z → Material Preview).
6. In the **N-panel → View → Viewport Shading**, enable **Bloom**, intensity ≈ 0.3.
7. Orbit the view (MMB drag) to find a 3/4 angle showing the triangular simplex  
   structure — you should see the tube spiraling along three edges.

---

## OBS settings

| Setting | Value |
|---|---|
| Source | **Window Capture** → Blender (not Display Capture) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** — untick all audio tracks |
| Output format | MP4 / H.264 |
| Bitrate | 8–12 Mbps |

Start OBS recording *before* touching Blender.

---

## Shot list

| Time | Action |
|---|---|
| 0–12 s | Wide orbit (MMB drag) around the poi head. The tube traces a triangular spiral — identify the three "corners" where the tube slows and piles up (heteroclinic saddles near each vertex). |
| 12–25 s | Pause at a 3/4 view; slowly zoom in on one saddle corner. The cobalt stripe there shows species 1 near-zero — the "waiting room" before the heteroclinic transition. |
| 25–40 s | Open **Properties → Object Data → Shape Keys**. Scrub **SK_Coexist** value 0→1→0 slowly. The triangular spiral collapses inward to a tight knot near the interior fixed point — this is the stable coexistence case (α+β < 2). |
| 40–55 s | Scrub **SK_Reverse** 0→1→0. The direction of the dominance cycle reverses — cobalt and amber stripes swap corners, and the triangular orientation flips. Show that the mathematics predicts exactly one such mirror-image attractor for α↔β. |
| 55–70 s | Scrub **SK_Inner** 0→1→0. With IC near the interior equilibrium, many more cycles complete before reaching the boundary — the tube is denser and shows the spiral-out structure more clearly. |
| 70–82 s | Back to Basis shape. Return to a wide orbit. Comment on the heteroclinic cycle speed: each pass near a corner takes exponentially longer than the last (Shilnikov-type slowing). |
| 82–90 s | Switch to **Scripting** workspace and show `blueprint.py` scrolled to `_deriv`. Highlight the cyclic shift of the competition matrix row — the mathematical reason the system has rock–paper–scissors dominance. |

---

## Export / rename

After recording, save OBS output as `screen.mp4` and move it to:

```
public/library/videos/scripting/
  python-numpy-may-leonard-3species-cyclic-competition-heteroclinic-simplex-bishop-tube-poi-webxr/
    screen.mp4
```

The `record.py` script renders `viewport.mp4` automatically via EEVEE Next.
