# Screen Recording Notes
## Python bpy.types.ParticleSystem — Emitter + Hair Instance Scatter (Blender 5.1)

### OBS / Windows Game Bar Setup

| Setting | Value |
|---------|-------|
| Source  | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (music added in post) |
| Output format | MP4 / H.264 |
| Output path | `public/library/videos/scripting/python-bpy-particle-system-emitter-hair-instance-webxr/screen.mp4` |

### Blender Layout Before Recording

1. Open Blender 5.1, new General file.
2. Switch to **Scripting** workspace.
3. Open `blueprint.py` in the Text Editor (`Text → Open` or drag-drop).
4. **Properties** panel on the right: switch to **Particles** tab (the blue person icon) — leave visible for context.
5. Drag the **Timeline** to the bottom third of the screen.

### What to Show

**Segment 1 (0:00–1:30) — Python API walkthrough**
- Narrate `_add_emitter_psys()`: highlight the `modifiers.new("Emitter", "PARTICLE_SYSTEM")` line and explain why modifiers.new is preferred over the bpy.ops route.
- Show `psys.settings` access; hover over `render_type`, `instance_object`, `emit_from`.
- Run `main()` (Alt-P or press Run Script button).

**Segment 2 (1:30–3:00) — Result inspection**
- Switch to **3D Viewport** → set shading to **Material Preview**.
- Scrub to frame 0 in Timeline — instances appear on the plane.
- Open the **Properties → Particles** tab; show `EmitterSettings` with count=120, render_type=OBJECT, instance_object=inst_gem.
- Select `inst_gem` — it shows as a single icosphere. Ctrl-click on the instanced copies to highlight the particle scatter.

**Segment 3 (3:00–4:30) — Hair surface**
- Switch focus to `hair_surface` (2.5 units to the right).
- Properties → Particles: show `HairSettings` (type=HAIR, render_type=PATH, root/tip radius).
- In **Particle Edit** mode, comb a few strands to demonstrate interactive control.

**Segment 4 (4:30–5:00) — Depsgraph capture**
- Back in Script Editor, highlight the `_capture_instances()` function.
- Run it in isolation: show `len(matrices)` printed to the Info bar.
- Show `captured_positions` mesh in the Outliner; Properties → Attributes — `instance_world_pos` FLOAT_VECTOR.

**Segment 5 (5:00–6:00) — WebXR export custom props**
- Show `pos_ob["particle_count"]`, `pos_ob["holoflow:facet"]` in Properties → Object Properties → Custom Properties.
- Explain: these persist in GLB as `mesh.userData` extras for the WebXR loader.

### Post-production Note

Trim dead air; add lo-fi beat at -18 dBFS. Overlay code font captions for the key API names (`modifiers.new`, `psys.settings`, `dg.object_instances`). Export as `screen.mp4` at the path above.
