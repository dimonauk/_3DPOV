# Screen Recording Notes — SCA Branching Coral

**Tutorial**: Python numpy — Space Colonisation Algorithm  
**Output file**: `viewport/screen.mp4` (place alongside `viewport.mp4`)

---

## Setup checklist

1. Open Blender 5.1. Switch to the **Scripting** workspace.
2. Load `blueprint.py` in the Text Editor. Do **not** run it yet.
3. Open OBS Studio (or Windows Game Bar: Win+G).

---

## OBS settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Encoder | x264 (CRF 18) or NVENC |
| Audio | **Off** (mute all tracks) |
| Output | `screen.mp4` |

---

## Recording sequence

1. **Start OBS recording.**
2. In Blender Text Editor, press **Run Script** (▶ or Alt+P).
3. Watch the terminal / Info bar — SCA prints progress lines.  
   The coral object appears in the viewport when `main()` completes (~5–20 s).
4. Once built: switch to the **3D Viewport**, press **Numpad 5** (orthographic off),  
   then **Numpad 4 / 6** to orbit slowly around the coral crown for ~20 s.
5. Press **F12** to render a single still frame — let it finish.
6. **Stop OBS recording.**

---

## Trim targets

| Segment | Duration |
|---|---|
| Script visible before run | 3 s |
| Execution + coral appearing | real-time |
| Orbit reveal | 15–20 s |
| Single-frame F12 render | real-time |
| **Total** | ≈ 30–45 s |

Trim to ≤ 60 s in DaVinci Resolve or ffmpeg before adding captions.

---

## Caption overlay (DaVinci / Premiere)

```
0:00  "blueprint.py — run from Scripting workspace"
0:03  "SCA builds 500 attractor points (coral crown)"
0:08  "280 iterations → branching skeleton"
0:20  "NURBS bevel gives organic tube silhouette"
0:30  "GLB exported with Draco-6 compression"
```
