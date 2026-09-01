# Screen-Recording Notes — RTI Stage Floor

**Output target:** `public/library/videos/scripting/<slug>/screen.mp4`

---

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Encoder | x264 / NVENC (any) |
| Audio | Disabled |
| Output format | mp4 |

---

## Recording script (step-by-step)

1. Open Blender 5.1 with a **fresh General** scene.
2. Open the **Scripting** workspace (top tab-bar).
3. Paste `blueprint.py` into the text editor and press **Run Script**.
   - Console prints: `RTI: Simulating A=0.50 snapshots at t=[2.0, 4.5, 7.0] …`
   - After ~2–3 s the stage floor appears.  Vertex colour shows vorticity.
4. Switch to **Layout** workspace.
5. Set **Viewport Shading → Solid → Vertex** (vertex-colour display).
6. Press **Numpad 7** for top-down view; tilt slightly with **Numpad 8** (3 presses).
7. **Start recording** in OBS.
8. Slowly orbit the floor with Middle-Mouse drag (10–15 s of steady orbit).
9. Press **N** to open sidebar, select shape key **SK_Fingers** → value 1.0 (8 s).
10. Slide **SK_Mushroom** to 1.0 (SK_Fingers back to 0.0) — hold 8 s.
11. Slide **SK_HighA** to 1.0 — hold 8 s.  Return to Basis.
12. Pan around to show side profile (mushroom-cap depth) — 10 s.
13. **Stop recording** in OBS.
14. Trim to ≤ 90 s, export as `screen.mp4`.

---

## Viewport settings for best visuals

- **Shading → Light → Flat** (removes directional lighting; pure vertex colour).
- **Shading → Background → Theme** (dark grey background).
- **Overlay → Statistics** OFF (less clutter).
- **Clip Start** 0.01 m so the floor doesn't clip when zoomed in.

---

## What to highlight on camera

- **Basis (t=2)**: gently corrugated interface — linear-regime waves.
- **SK_Fingers (t=4.5)**: clear finger competition; some modes dominate.
- **SK_Mushroom (t=7)**: fully formed mushroom-cap spikes in cobalt/amber.
- **SK_HighA (A=0.85)**: compressed, rapidly growing fingers at same t=4.5.
- Side view shows **asymmetric heights** — spikes plunge deeper than bubbles rise
  (classic nonlinear RT asymmetry: terminal bubble velocity < spike terminal velocity).
