# Screen Recording Notes — Hénon-Heiles Hamiltonian KAM Tori Poi Head

**Blender version**: 5.1  
**Recording software**: OBS Studio (or Windows Game Bar)  
**Target file**: `public/library/videos/scripting/python-numpy-henon-heiles-hamiltonian-kam-tori-poincare-section-poi-webxr/screen.mp4`

---

## OBS Setup

| Setting | Value |
|---|---|
| Window source | Blender 5.1 (main window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

---

## What to record (step by step)

1. **Open Blender 5.1** with a fresh General scene.

2. **Load blueprint** — Scripting workspace → open `blueprint.py` → press **Run Script**.
   - Integration of 48 000 leapfrog steps (3 energies × 16 000 total steps each) takes 2–5 s.
   - Console should print waypoint count and Poincaré section sizes for each energy.
   - Viewport shows the orbit tube glowing with a rainbow vertex colour in (x, px, y) space.

3. **Viewport settings for recording**:
   - Shading: **Solid → Colour: Attribute → Attribute name: HenonAge**
   - Overlay: disable Grid, Axes, and Statistics
   - Background: solid black (Edit → Preferences → Themes → 3D Viewport → Gradient High)

4. **Start OBS recording**.

5. **Demonstrate the phase-space topology** (1–2 min):
   - Orbit with middle-mouse drag — the tube forms a toroidal ribbon in (x, px, y) space.
   - **Numpad 7** (top view): the ribbon projects to an ellipse in the (x, px) Poincaré plane.
   - **Numpad 1** (front): the y-extension of the tube is visible — the orbit oscillates in y.
   - The three coloured Poincaré point clouds (violet, cyan, orange) are visible offset in z:
     violet is the KAM torus (smooth closed curve), orange is the chaotic layer (fractal scatter).

6. **Demonstrate shape keys** — Properties → Object Data → Shape Keys:
   - Drag **Mixed_E0.125** slider to 1.0: the tube deforms from a clean torus-winding to
     a more complex figure-8 pattern with island-chain excursions at the boundary.
   - Drag **Chaotic_E0.165** to 1.0: the tube fills a thicker, irregular shell — the
     orbit explores the full energy surface ergodically, constrained only by H = const.
   - Note: the KAM_E0.083 and Chaotic_E0.165 shapes have identical topology in energy
     surface but fill it differently — this is the KAM theorem in action.

7. **Show the scripting** — scroll through `blueprint.py`:
   - Point out `grad_V()` — the two gradient components from the cubic coupling terms.
   - Show `leapfrog_step()` — the half-kick / drift / half-kick structure and the
     note about symplecticity vs RK4.
   - Show the Poincaré section detection: `prev_y < 0 < s_new[1]` crossing with linear
     interpolation to find the exact y=0 crossing fraction.
   - Show `foreach_set("co", ...)` for the shape key bulk-write.

8. **Run `record.py`** — triggers the automatic 12 s viewport render (watch console for path).

9. **Stop OBS** and trim to ≤ 3 min.

---

## Tips

- If the Poincaré clouds are hard to see, add a Point cloud modifier: select a Poincaré
  object → Properties → Geometry → Point Cloud radius 0.003.
- For the **KAM torus** orbit (E=0.083), pressing Numpad 7 shows a clean ellipse in the
  (x, px) projection — exactly what the Poincaré section shows.
- Energy conservation check: add a Python console driver printing `H = 0.5*(px²+py²) +
  0.5*(x²+y²) + x²y − y³/3` at each step — should stay within ± 3e-5 of initial value.
- Increase `MAX_POINCARE = 1500` for a denser fractal Poincaré cloud at E=0.165; this
  requires a longer orbit (increase `N_STEPS = 40 000`) — roughly 10 s compute time.
- The tube at E=0.165 (Chaotic) appears thicker and irregular: that is correct — the
  orbit ergodically fills the 3D surface H=0.165 = const (bounded by the escape saddles).

---

*Holoflow Studio — Blender Expert Content Mill*
