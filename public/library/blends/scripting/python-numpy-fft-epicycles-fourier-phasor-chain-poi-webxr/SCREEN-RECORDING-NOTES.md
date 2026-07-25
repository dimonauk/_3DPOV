# Screen-Recording Notes — FFT Epicycles Phasor Chain

**Target file:** `public/library/videos/scripting/python-numpy-fft-epicycles-fourier-phasor-chain-poi-webxr/screen.mp4`

---

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Window source | Blender (full window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

---

## Scene to show

1. **Open Blender 5.1** and load the saved `.blend` (or run `blueprint.py` fresh).
2. **Set viewport shading** to Material Preview (LookDev ball icon, shortcut `Z → Material Preview`) with world HDRI off so the black background shows.
3. **Zoom** in on the phasor chain. The chain should fill roughly 70 % of the viewport.
4. **Play the animation** (`Spacebar`). The phasor rings rotate and the trail glows.
5. **Record at least 300 frames** (≈ 10 s) — one full period plus a few extra frames.
6. **Show the Scripting workspace briefly** at the start: switch to `Scripting`, scroll to the DFT block, then switch back to 3D Viewport before pressing Play.

---

## What to emphasise on camera

- The nested, concentric rings rotating at different speeds.
- The trail forming the lemniscate (figure-eight) shape as the tip traces out the sum.
- How adding more circles (increase `N_CIRCLES`) brings the reconstruction closer to the original path.

---

## Post-processing

None required. The bloom is baked into the EEVEE viewport render.
