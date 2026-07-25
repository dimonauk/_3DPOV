# Screen Recording Notes — GN Socket Panels

**Target file:** `public/library/videos/geometry-nodes/gn-socket-panels-interface-collapsible-modifier-ui/screen.mp4`

## Setup (OBS Studio or Windows Game Bar)

- **Source:** Window Capture → Blender 5.1
- **Resolution:** 1920 × 1080 (match Blender window)
- **Frame rate:** 30 fps
- **Audio:** Off (no audio needed)
- **Output:** MP4 / H.264, CRF 22

## What to record (~2.5 minutes)

### Part 1 — Running blueprint.py and inspecting panels (60 sec)
1. Open Blender 5.1. Switch to the **Scripting** workspace.
2. Open `blueprint.py`. Press **Run Script**. Watch the helix and ribbon appear in the viewport.
3. Press **N** to close the N-panel if open.
4. Click on the `hf_poi_energy_ribbon` object in the viewport.
5. Open **Properties → Modifier Properties** (spanner icon).
6. Show the modifier panel with its three sections. Click the ▶ triangles to collapse/expand each panel.
7. Linger on "Curve Shape" (expanded), "Noise Displacement" (expanded), "Ribbon" (collapsed by default).

### Part 2 — Live parameter tweaking (50 sec)
8. Expand **Noise Displacement**. Drag the **Noise Scale** slider from 4 to 12. Watch the ribbon surface change in real time.
9. Drag **Noise Strength** from 0.012 to 0.05 and back. Show the ribbon pulsing.
10. Collapse the **Noise Displacement** panel and expand **Ribbon**.
11. Change **Ribbon Radius** from 0.008 to 0.03. Show the tube fattening.

### Part 3 — Python console inspection (40 sec)
12. Open the **Python Console** in Blender (shift-space or separate area).
13. Type and run:
    ```python
    ng = bpy.data.node_groups["HF_PoiEnergyRibbon"]
    for item in ng.interface.items_tree:
        print(item.item_type, getattr(item, 'name', ''))
    ```
14. Show the output listing `PANEL Curve Shape`, `SOCKET Resample Count`, etc.
15. Type:
    ```python
    panel = [i for i in ng.interface.items_tree if getattr(i,'name','')=="Noise Displacement"][0]
    print(type(panel).__name__, panel.default_closed)
    ```
    Show `NodeTreeInterfacePanel False`.

### Part 4 — record.py animation (20 sec)
16. Switch back to the **Scripting** workspace. Open `record.py`. Press **Run Script**.
17. Watch the render progress and the viewport.mp4 being written.

## Tips
- Set Blender viewport shading to **Rendered** before recording Part 2 so the emission glow is visible.
- Keep the Properties panel and viewport both visible side-by-side.
- The Noise Scale animation in `record.py` takes ~20 seconds to render.
