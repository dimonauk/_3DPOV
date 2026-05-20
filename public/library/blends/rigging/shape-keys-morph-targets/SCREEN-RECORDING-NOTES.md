# Screen Recording Notes — Shape Keys & Morph Targets

OBS / Game Bar instructions for capturing the screen.mp4 companion.

## Setup

| Setting | Value |
|---|---|
| Window source | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF |
| Output | `public/library/videos/rigging/shape-keys-morph-targets/screen.mp4` |

## Shot list

### Shot 1 — Basis shape key (0:00 – 0:30)
- Open `face_vrm.blend`.
- Properties panel → Object Data → Shape Keys; show the Basis at value 1.0.
- In the 3D viewport, orbit the face proxy so the viewer sees the mesh.
- Zoom in on the Shape Keys panel so the key list is clearly legible.

### Shot 2 — Blink_L in action (0:30 – 1:00)
- Select `Fcl_EYE_Close_L` in the Shape Keys list.
- Drag the Value slider from 0 → 1 slowly.
- Pause at 1.0 so viewers can see the upper-lid verts close in the viewport.
- Return to 0.

### Shot 3 — Happy expression (1:00 – 1:45)
- Select `Fcl_ALL_Joy`.
- Drag Value 0 → 1 slowly.
- While at 1.0, orbit the face slowly to show the brow lift and cheek puff.
- Return to 0.

### Shot 4 — Aa phoneme (1:45 – 2:15)
- Select `Fcl_MTH_A`.
- Drag Value 0 → 1 slowly.
- Pause at 0.5 (half-open) then continue to 1.0.
- Return to 0.

### Shot 5 — Multiple sliders mixed (2:15 – 2:45)
- Set `Fcl_ALL_Joy` to 0.7, `Fcl_EYE_Close_L` to 0.4 simultaneously.
- This demonstrates independent blending — both expressions active at once.
- Orbit to show the combined deformation.

### Shot 6 — glTF export dialog (2:45 – 3:15)
- File → Export → glTF 2.0.
- Pan the OBS capture to show: Format = GLB, Include > Morph Targets = ticked,
  Apply Modifiers = UNTICKED.  Pause here 3 seconds.
- Click Export.  Show the file write dialog completing.

### Shot 7 — GLB in browser viewer (3:15 – end)
- Open a browser, navigate to `gltf-viewer.donmccurdy.com`.
- Drag `face_vrm.glb` onto the viewer.
- Open the viewer's Morph Targets panel (right-side panel → "Morph Targets").
- Drag each slider to demonstrate the expressions play correctly in the browser.

## Notes for Dimona
- Use the N panel (press N) → Item → Shape Keys to keep the slider list
  visible in the 3D viewport during shots 2–5.
- Alternatively, use the Properties panel on the right (green vertex icon →
  Shape Keys).  Both show the same data.
- The `record.py` script produces `viewport.mp4` automatically; `screen.mp4`
  is the manual OBS capture of shots 1–7 above.
