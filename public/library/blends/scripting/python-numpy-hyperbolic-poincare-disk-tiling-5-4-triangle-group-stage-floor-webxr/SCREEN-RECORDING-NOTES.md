# Screen Recording Notes — Hyperbolic {5,4} Tiling Stage Floor

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output | `screen.mp4` |

## Recording sequence

1. **Open Blender** → open `hf_hyp_tiling_5_4.blend`
2. **Viewport** → Viewport Shading: Vertex Colour
3. **Numpad 7** → Top view: show the full disk pattern
4. **Slow orbit** (middle mouse drag): rotate 360° over ~10 seconds, staying
   above the floor so the pentagon structure is visible
5. **Numpad 1** → Front view: show the flat profile
6. **Shape Key demo** (Properties → Data → Shape Keys):
   - Drag `SK_Dome` to 1.0 → pause → 0.0
   - Drag `SK_Bowl` to 1.0 → pause → 0.0  
   - Drag `SK_Ripple` to 1.0 → pause → 0.0
7. **Perspective orbit** (Numpad 5 off): tilted view at ~35° above to
   show the ripple and dome 3D depth

## Tips

- **Increase clipping** (N panel → View → Clip End to 100 m) if the distant
  tiles disappear.
- The **Edge overlay** (header → Overlays → Edge Angle) reveals the subtle
  pentagon geometry.  Turn on with edge colour set to white for the recording.
- The **centred colour gradient** (purple/blue at centre, warm at boundary)
  reads best under the `FLAT` shading light mode — avoid MatCap for this.
