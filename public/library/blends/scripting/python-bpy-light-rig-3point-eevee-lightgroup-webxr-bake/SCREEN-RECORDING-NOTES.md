# Screen Recording Notes — 3-Point Light Rig

**Target file:** `public/library/videos/scripting/python-bpy-light-rig-3point-eevee-lightgroup-webxr-bake/screen.mp4`

## OBS / Game Bar setup

| Setting | Value |
|---|---|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |
| CRF | 18–22 (high quality) |

## What to record

1. **Scripting workspace open** — show `blueprint.py` loaded. Scroll to the
   parameter block at the top: `KEY_ENERGY`, `KEY_COLOR`, `FILL_ENERGY`,
   `RIM_CONE_DEG`. Point out that `SUBJECT_RADIUS` scales all distances
   automatically so the rig adapts to any character size.

2. **Run Script** — click Run Script, then immediately switch to Layout
   workspace. Show the Outliner: `LightRig_3Point` Empty with `Key_Area`,
   `Fill_Disk`, and `Rim_Spot` parented to it.

3. **Inspect Key light** — select `Key_Area`, open Object Data Properties
   (green light icon). Show the RECTANGLE shape, 1.2 × 0.6 m dimensions,
   and 800 W. Point out the Spread value.

4. **Inspect Rim light** — select `Rim_Spot`. Show the spot cone angle in
   degrees, Blend value, and `Shadow Soft Size` — contrast with the key
   light where there is no `Shadow Soft Size` (area lights use physical size
   for shadow softness).

5. **Material Preview** — press Z → Material Preview. Orbit with Middle
   Mouse. Show the warm key-side catchlight, the cool fill softening the
   shadow side, and the rim halo separating the sphere from the background.

6. **Rotate the rig** — select `LightRig_3Point`, press R Z 90, Enter. All
   three lights rotate together. This demonstrates the parent-pivot pattern.
   Undo with Ctrl+Z.

7. **Light Groups panel** — open the View Layer Properties (camera icon,
   Layer tab). Scroll to the Light Groups section and show three groups:
   `key`, `fill`, `rim`. Each light's group assignment can be seen in Object
   Properties → Visibility → Light Group.

8. **Open light_rig.json** — open a Text Editor area, click Open and select
   `light_rig.json`. Show the Three.js axis-remapped positions and how the
   SpotLight entry has `angle_rad` (half-angle) not the full Blender
   `spot_size`.

## Trim points

- Start: Scripting workspace with blueprint.py visible
- End: after showing light_rig.json in the Text Editor
- Target length: 5–8 minutes uncut
