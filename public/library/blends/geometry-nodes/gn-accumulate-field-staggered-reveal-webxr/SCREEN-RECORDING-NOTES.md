# Screen-Recording Notes
## gn-accumulate-field-staggered-reveal-webxr

Target file: `public/library/videos/geometry-nodes/gn-accumulate-field-staggered-reveal-webxr/screen.mp4`

---

### Before you start

1. Open `stagger_reveal.blend` in Blender 5.1.
2. In the modifier panel (wrench icon), verify the **StaggerReveal** GN modifier
   is active.  You should see three sliders: Density, Stagger Duration, Rise Time.
3. Set the timeline to frame 0 and confirm no pillars are visible (they all have
   Z scale = 0 at t = 0).
4. Press **Spacebar** to confirm the reveal wave plays — pillars should rise
   left-to-right over roughly 3 seconds.
5. Set Blender to **EEVEE** (Properties → Render → Render Engine → EEVEE Next).

---

### OBS Studio setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no narration needed for library) |
| Output format | MP4 / H.264 |
| Output path | (save to desktop, rename after) |

Hotkey suggestion: **Alt+F9** start, **Alt+F10** stop.

---

### What to record (approx. 90 seconds)

1. **(0–10 s)** Show the Geometry Nodes modifier panel.  Point to the three
   exposed inputs (Density, Stagger Duration, Rise Time).

2. **(10–20 s)** Open the GN node editor.  Pan to show the full node graph:
   left side (grid → distribute → position chain → Accumulate Field),
   right side (scene time math → clamp → instance).

3. **(20–35 s)** Select the **Accumulate Field** node.  In the header, the node
   reads `Type: Float`.  Point to **Sort Index** input (wired from the floor node)
   and explain: "this socket controls sort order — lower integer = rises first."

4. **(35–55 s)** Press **Spacebar** from frame 0.  Let the full reveal wave play.
   Repeat once.

5. **(55–75 s)** With playback paused at frame 45 (mid-wave), change **Stagger
   Duration** from 3.0 → 1.0.  Scrub back to 0 and play again — much faster wave.
   Change back to 3.0.

6. **(75–90 s)** Change **Density** from 5.0 → 2.0 → 10.0.  Show how pillar
   count changes without altering the wave behaviour.

---

### After recording

Rename the file to `screen.mp4` and place at:
```
public/library/videos/geometry-nodes/gn-accumulate-field-staggered-reveal-webxr/screen.mp4
```

Commit the video separately:
```
git add public/library/videos/geometry-nodes/gn-accumulate-field-staggered-reveal-webxr/screen.mp4
git commit -m "feat(video): screen recording — gn-accumulate-field-staggered-reveal-webxr"
```
