# Screen Recording Notes
## DEC Harmonic 1-Form on Perturbed Torus

**Target file:** `screen.mp4`  
**Resolution:** 1920 × 1080 @ 30 fps  
**Audio:** off

---

### OBS Studio (Windows / Linux)

1. **Sources panel → + → Window Capture**
   - Window: `[blender.exe] Blender`
   - Capture method: `DXGI Desktop Duplication` (Windows) or `XComposite` (Linux)

2. **Output settings:**
   - Container: MKV → remux to MP4 after recording
   - Encoder: `NVENC H.264` (GPU) or `x264` (CPU, CRF 18)
   - Bitrate: 8 000 kbps

3. **Canvas:** 1920 × 1080. If Blender window is smaller, downscale in OBS.

4. **What to capture:**

   | Clip | Duration | Action |
   |------|----------|--------|
   | 0–15 s | Open Blender Text Editor, show `blueprint.py` — scroll slowly through the DEC theory block at the top | |
   | 15–45 s | Select all code, press **Run Script** — watch the Python console print DEC diagnostics | |
   | 45–75 s | Switch to 3D Viewport in `Material Preview` mode — tumble the rainbow-striped torus with middle-mouse orbit | |
   | 75–105 s | Press `N` → Item tab, show vertex count; open `Shader Editor` and show the Attribute → Emission node tree | |
   | 105–120 s | Open `Spreadsheet Editor`, set Domain to `Point`, show `harmonic_phase` attribute column | |

5. **After recording:**
   ```
   ffmpeg -i raw.mkv -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p screen.mp4
   ```

---

### Windows Game Bar (Win + G)

1. Open Blender → press **Win + G → Start Recording** (Win + Alt + R)
2. Follow the same shot list above
3. Clips land in `Videos\Captures\`; rename to `screen.mp4`

---

### Viewport.mp4 (separate — automated)

Run `record.py` from the Blender command line after the mesh is built:
```
blender --background hf_dec_torus.blend --python record.py
```
Then assemble:
```
ffmpeg -r 30 -i /path/to/output/%04d.png -c:v libx264 -pix_fmt yuv420p viewport.mp4
```
Place both `viewport.mp4` and `screen.mp4` in:
`public/library/videos/scripting/python-numpy-scipy-dec-hodge-star-harmonic-1form-perturbed-torus-webxr/`
