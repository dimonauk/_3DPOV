# Screen Recording Notes
## mathutils.Quaternion — SLERP, Squad & Log-Space Blending

**Output target:** `public/library/videos/scripting/python-mathutils-quaternion-slerp-squad-vrm-retarget/screen.mp4`

---

### Software
- OBS Studio 30+ (or Windows Game Bar `Win + G`)
- Blender 5.1

### OBS Settings
| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Disabled |
| Output | MP4, CRF 23, x264 |

---

### Session to record

1. Open a fresh Blender 5.1 session.
2. Switch to **Scripting** workspace.
3. Open `blueprint.py` in the text editor.
4. Start OBS capture.
5. Run the script (`Alt + P`). Let the spine chain build and animate.
6. Scrub the timeline:
   - Frames 1–14: SLERP sweep (rest → full bend, smooth arc)
   - Frames 17–32: Squad sweep (rest → mid → full, C1 continuity)
   - Final frame: log-space blend pose
7. For each segment, scrub slowly left to right so the viewer can see the bone chain rotating.
8. Switch to **Pose Mode** and use **Item → Rotation** in the N-panel to show the WXYZ channel values changing.
9. Stop OBS capture.

### Editing notes
- Trim to ≤ 90 seconds total.
- Add a title card: "mathutils.Quaternion — SLERP vs Squad" in GIMP/DaVinci.
- No voiceover needed; show the panel values as visual proof.
