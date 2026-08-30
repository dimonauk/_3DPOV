# Screen Recording Notes — Kapitza Pendulum Poi Head

These notes are for recording the Blender viewport session to produce
`screen.mp4` alongside the programmatic `viewport.mp4`.

## Target output
- File: `public/library/videos/scripting/python-numpy-kapitza-pendulum-parametric-resonance-mathieu-effective-potential-bishop-tube-poi-webxr/screen.mp4`
- Resolution: 1920 × 1080
- Frame rate: 30 fps
- Audio: **off** (no microphone track needed)
- Duration: ~60 seconds

---

## OBS settings (Windows Game Bar or OBS Studio)

### Window capture
- Source type: **Window Capture**
- Window: `Blender`
- Capture method: Windows 10 (1903+) / BitBlt — whichever shows the 3-D viewport without compositor overlay artefacts
- Crop: clip the top menu bar if Blender is windowed rather than fullscreen

### Encoding
| Setting | Value |
|---|---|
| Encoder | x264 or NVENC H.264 |
| Rate control | CRF 18 (x264) / CQP 20 (NVENC) |
| Keyframe interval | 2 s |
| Audio track | **disabled** |

### Output file
Save directly to the target path above.  Use `.mp4` container, not `.mkv`.

---

## What to record (60-second session)

1. **0 – 8 s**: Open `blueprint.py` in Blender's Text Editor.  Briefly scroll
   through the file so the ODE and parameter block are visible.

2. **8 – 15 s**: Press **Run Script** (Alt+P).  Let the script execute.
   The 3-D viewport should populate with the coiled poi head.

3. **15 – 25 s**: In the 3-D viewport, **rotate** the view (middle-mouse drag)
   to show the tight cobalt/amber coil near the *top* of the sphere — this is
   the Kapitza-stable inverted equilibrium.  Zoom in to show the tube detail.

4. **25 – 35 s**: Open **Properties → Object Data → Shape Keys**.  Click on
   `SK_Fall` and drag its value slider from 0 → 1.  The coil migrates from the
   top (inverted/stabilised) down to the bottom (the pendulum falls below the
   threshold).  Drag the slider back to 0.

5. **35 – 45 s**: Click `SK_Wide` and drag to 1.  Show the wider-loop coil
   (pendulum starting further from inverted).  Return to 0.

6. **45 – 55 s**: Click `SK_Border` and drag to 1.  Show the large-amplitude
   wobble at the Mathieu stability boundary.  Return to 0.

7. **55 – 60 s**: Final orbit in the viewport — hold **NumPad 0** (camera view)
   and let the default viewport spin render play.

---

## Post-processing
- No colour grading needed; the cobalt/amber vertex colours read clearly.
- If the recording exceeds 60 s, trim in DaVinci Resolve / ffmpeg:
  `ffmpeg -i screen_raw.mp4 -t 60 -c copy screen.mp4`
