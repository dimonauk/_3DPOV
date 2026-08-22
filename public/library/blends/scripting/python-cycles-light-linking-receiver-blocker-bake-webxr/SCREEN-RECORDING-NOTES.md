# Screen Recording Notes — Cycles Light Linking

**Target file:** `public/library/videos/scripting/python-cycles-light-linking-receiver-blocker-bake-webxr/screen.mp4`

## Software

- OBS Studio (or Windows Game Bar `Win+G`)
- Capture: **Window Capture → Blender** (not Display Capture)
- Resolution: **1920 × 1080**, Frame rate: **30 fps**
- Audio: **off** (music dubbed in post via VSE if needed)

## Scene setup before pressing Record

1. Run `blueprint.py` from the Text Editor; confirm the terminal prints `[holoflow] Light Linking blueprint complete.`
2. Open the **Outliner**; verify the three lights appear (`light_key`, `light_fill`, `light_rim`).
3. In the **Properties → Object → Light Linking** panel for `light_fill`, confirm **Receiver Collection** shows `ll_recv_fill` with `hero_faceted_gem` listed.
4. For `light_rim`, confirm Receiver = `ll_recv_rim` (hero + accent) and Blocker = `ll_block_rim` (hero only).
5. Switch viewport shading to **Rendered** (Cycles). The fill warmth should be visible on the hero gem but NOT the accent orb.

## Recording beats (script the take)

| Time | Action |
|------|--------|
| 0:00 | Viewport in **Solid** shade — identify the three objects and three lights |
| 0:20 | Switch to **Rendered** shade — show the full key+fill+rim arrangement |
| 0:40 | Select `light_fill` → Properties → Object → **Light Linking panel** — show `ll_recv_fill` collection with hero only |
| 1:00 | **Live demo:** remove hero from `ll_recv_fill` via UI — the fill warmth disappears from hero in viewport |
| 1:20 | Re-add hero; switch to `light_rim` → show Receiver and Blocker collections |
| 1:40 | Open **UV Editor** — show the hero's smart-project UV layout |
| 2:00 | Run `blueprint.py` (or confirm bake image already generated) — show `hero_prop_lightmap.webp` in the Image Editor |
| 2:20 | Open **Text Editor**, scroll through `blueprint.py` — highlight `setup_light_linking()` |
| 2:40 | Switch to **Rendered** and orbit around the scene — rim edge on hero clearly lit, accent orb unaffected by fill |
| 3:00 | End |

## Post-processing

Trim to 3 minutes in the VSE (`blender-tutorial-python-bpy-sequence-editor-vse-script-tutorial-assembly`). Add a title card: **"Cycles Light Linking — Selective Bake for WebXR"**. Export at CRF 23, H.264, `screen.mp4`.
