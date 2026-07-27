# Screen Recording Notes
## python-numpy-halton-sequence-fibonacci-sphere-lattice-scatter-poi-webxr

### Target file
`public/library/videos/scripting/python-numpy-halton-sequence-fibonacci-sphere-lattice-scatter-poi-webxr/screen.mp4`

### Software
OBS Studio (Windows/Mac/Linux) — free, open-source.  
Alternative on Windows: Xbox Game Bar (Win + G → Capture).

### OBS settings
| Setting | Value |
|---|---|
| Source | Window Capture → Blender (exact window, not display) |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Encoder | x264, CRF 18 |
| Audio | Disabled (no commentary needed for the blueprint run) |
| Output format | MP4 |

### What to record
1. **Open** a fresh Blender 5.1 session.  Set workspace to **Scripting**.
2. **Load blueprint.py** — paste the contents into a new text block.  Confirm the text editor shows the full script.
3. **Run Script** — click the ▶ button or press Alt+P.  Hold the frame on the 3D viewport while the script executes (~2–5 s).  Zoom to Frame (Numpad `.`) so all three clusters fill the viewport.
4. **Reveal the Halton cluster** — numpad `1` for front view, then orbit with middle-mouse to show the blue poi-head sphere.  Pause 3 s.
5. **Compare to Fibonacci** — pan to the centre cluster (gold).  Orbit slowly to highlight the sunflower spiral pattern visible from the side.  Pause 3 s.
6. **Top-down comparison** — numpad `7` for top view.  All three clusters visible.  The Fibonacci cluster should show the recognisable spiral arms; the Halton cluster shows a subtly more uniform grid; the Random cluster shows visible gaps and clumps.  Hold 5 s.
7. **Open the GLB** — File → Import → glTF.  Or drag `hf_scatter.glb` into a browser with the Babylon.js Sandbox (sandbox.babylonjs.com).  Show the three clusters loading in the WebXR preview.
8. **Stop recording**.

### Runtime
Target total: **60–90 seconds**.  The top-down comparison is the money shot — linger there.

### Post-processing (optional)
Trim the start/end in Blender's VSE or DaVinci Resolve.  Add a simple title card: "Halton vs Fibonacci vs Random — sphere scatter comparison".  Export at 1080p H.264 CRF 18.
