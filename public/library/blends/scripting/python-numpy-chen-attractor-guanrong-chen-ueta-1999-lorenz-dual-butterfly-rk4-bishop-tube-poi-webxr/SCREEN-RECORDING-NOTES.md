# Chen Attractor — Screen-Recording Notes

**Output file**: `public/library/videos/scripting/python-numpy-chen-attractor.../screen.mp4`  
**Target**: 1920 × 1080, 30 fps, 60–90 seconds, audio off.

---

## Before recording

1. Open **Blender 5.1**.
2. Paste or open `blueprint.py` in the **Scripting** workspace.
3. Click **Run Script** — wait for  
   `[chen-attractor] blueprint complete — N vertices`  
   in the system console (≈ 30–60 s depending on hardware).
4. Switch to **Layout** workspace. The poi head should be centred at the origin.
5. Set viewport shading to **Material Preview** (Hold Z → Material Preview, or
   click the shading ball in the header).
6. In the **N-panel → View → Viewport Shading** section, enable **Bloom**.
7. Set **Clip Start** to `0.001 m` so the poi head does not clip the near plane.

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

Start OBS recording *before* touching Blender, so the title bar is captured.

---

## Shot list

| Time | Action |
|---|---|
| 0–10 s | Wide orbit — tumble the view with **MMB** drag to reveal the 3-D double-lobe butterfly. Show that the two lobes are NOT mirror-symmetric (unlike Lorenz). |
| 10–20 s | Zoom in on the saddle-focus bridge between the lobes (Numpad 5 for ortho, then zoom). The cobalt (slow) region near the saddle is the most visually distinctive Chen feature. |
| 20–35 s | Open **Properties → Object Data → Shape Keys**. Scrub **SK_Periodic** value 0 → 1 → 0 slowly. The attractor collapses to a smooth oval limit cycle — this is the Hopf bifurcation at c ≈ 22. |
| 35–50 s | Scrub **SK_Wing** 0 → 1 → 0. The lobes become denser and more symmetric — c = 31 pushes the system deeper into chaos. |
| 50–65 s | Scrub **SK_Lu** 0 → 1 → 0. The Lü bridge attractor (a=36, c=20) has a noticeably different cross-saddle proportion. Note this as the intermediate between Lorenz and Chen in the unified chaotic system. |
| 65–80 s | Return to Basis; slow 360° orbit with Numpad 4 held down. Close on the front view (Numpad 1). |
| 80–90 s | Open the **Scripting** workspace and show `blueprint.py` scrolled to the `_deriv` function — highlight the `+c*y` term that distinguishes Chen from Lorenz. |

---

## Export / rename

After recording, save OBS output as `screen.mp4` and move it to:

```
public/library/videos/scripting/
  python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr/
    screen.mp4
```

The `record.py` script renders `viewport.mp4` automatically via EEVEE Next.
