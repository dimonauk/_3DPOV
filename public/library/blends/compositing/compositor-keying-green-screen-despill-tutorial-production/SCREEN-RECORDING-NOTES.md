# Screen Recording Notes — Chroma Key & Despill

**Target file:** `public/library/videos/compositing/compositor-keying-green-screen-despill-tutorial-production/screen.mp4`

## OBS Settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Optional — narrate steps live or add voiceover in post-VSE |
| Output format | MP4 / H.264 |
| Bitrate | 6 000 kbps |

## Session flow to record

### 1. Show the source scene (≈ 1 min)
- Run `blueprint.py` from Scripting workspace.
- Switch to **Layout** workspace. Orbit around the faceted amber host-stand
  against the solid green World background. Emphasise how even the rim light
  picks up green cast on the back edge.
- Press **F12** — show the raw rendered frame in the Image Editor (green
  background fully present). This is the "plate" the Keying node will process.

### 2. Walk the compositor tree (≈ 2 min)
- Switch to **Compositing** workspace. Enable **Use Nodes** + **Backdrop**
  (shows live render as background).
- Pan the node editor from left to right:
  - **Render Layers** → raw RGBA frame with green bg
  - **Keying** — open the node properties sidebar: point out
    `Key Color`, `Clip Black / White`, `Despill Factor`, `Feather Distance`.
  - **Matte output** → `Dilate/Erode` → `Matte Blur`: this branch refines the
    alpha channel without touching the colour.
  - **Set Alpha** — swaps in the cleaned matte. Toggle **mute** on this node
    to show the difference.
  - **Alpha Over** — background feed from the BG Colour node; foreground from
    SetAlpha.
  - **Colour Balance** — mild blue warmth for ambience matching.
  - **Composite** + **Viewer**.

### 3. Render and compare (≈ 1 min)
- Press **F12**. Let EEVEE Next render (32 samples, ~3–8 s on GPU).
- In the Image Editor, toggle the **Compositing** tick (N-panel → View) OFF
  and ON to compare: raw green screen ↔ keyed composite.
- Show the output PNG in File Browser (`output/frame_0001.png`).

### 4. Tweak key colour live (≈ 1 min)
- In the Keying node header, click the green swatch for `Key Color`.
- Use the eyedropper on the rendered backdrop. Show how sampling slightly
  off-centre (more saturated pixel) tightens the matte.
- Change `Clip White` from 0.85 → 0.90 → observe how more of the edge becomes
  opaque. Re-render.
- Change `Despill Factor` from 0.7 → 1.0 → re-render; show the green colour
  cast disappearing from edge hair/rim pixels.

### 5. Virtual background swap (≈ 30 s)
- Select the **BG Colour** Mix node. Change `Color1` from deep-space black to
  a bright studio orange `(0.9, 0.4, 0.05)`. Re-render to demonstrate a
  warm replacement background.

### 6. Run the animation demo (≈ 30 s)
- Open `record.py` in a second Text Editor slot. Alt+R.
- Ctrl+F12 — Blender renders the 60-frame three-stage comparison to
  `viewport.mp4`. Show the progress bar then play the completed video.

## Tips

- Use **Window → Toggle Fullscreen** on the Compositing workspace for clean framing.
- Zoom the compositor so node labels are readable — each node should be at least
  150 px wide in the recording.
- The **Viewer** node shows a real-time preview in the Image Editor background
  without requiring a full F12 render — handy for demonstrating parameter tweaks.
- If render is slow, drop EEVEE samples to 8 for the live demo; note that
  for production keying you typically render Cycles at 64+ samples for clean
  depth-of-field on the subject edges.
