# FLIP Fluid Mantaflow — Liquid Pour into a Glass Vessel

**Blender 5.1 | Physics | Holoflow Studio Library**

A glass vessel fills with water using Mantaflow's FLIP (Fluid-Implicit-Particle) solver.
The tutorial covers domain voxel resolution, effector collision surfaces, continuous
inflow configuration, Mantaflow cache strategy, EEVEE SSR for water rendering, and
single-frame GLB mesh snapshot export for WebXR prop use.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the full scene: domain, glass vessel, inflow source, materials, lighting, camera, EEVEE Next render settings |
| `record.py` | Viewport animation capture (run after baking the simulation) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Windows Game Bar instructions for screen.mp4 |
| `.expected-artefacts.json` | Artefact registry with cross-references |

## Quick Start

1. Open Blender 5.1 → **Scripting** workspace.
2. Open `blueprint.py` → **Run Script** (Alt+P).
3. Select `Fluid_Domain` → **Physics Properties** → **Fluid** → **Domain** → **Cache**.
4. Set **Cache Type** to **All** (unlocks the Bake All button).
5. Confirm **Cache Directory** shows `//cache/fluid/`.
6. Click **Bake All**. At resolution 64, 80 frames ≈ 15–30 min CPU time.
7. When complete, scrub to **frame 35–45** to inspect the mid-pour splash.
8. Run `record.py` to capture the viewport animation to `videos/`.

## Key Parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `RESOLUTION` | `64` | Voxels along longest domain axis. 32 = fast preview. 128 = overnight high-fidelity. |
| `VISCOSITY_VALUE` | `1.0` | Mantaflow stores ν = value × 10⁻ᵉˣᵖ m²/s |
| `VISCOSITY_EXP` | `3` | Combined: 1×10⁻³ ≈ water. Honey ≈ 1×10⁻¹ (exp=1). |
| `SIMULATION_END` | `80` | Frames baked at 24 fps ≈ 3.3 s of real pour |
| `POUR_VELOCITY_Z` | `-3.0` | Downward pour speed m/s; increase for a harder jet |
| `MESH_PARTICLE_RAD` | `2.0` | Particle radius / cell size: higher = smoother surface |

## Cache Strategy

| Mode | Behaviour | Use when |
|------|-----------|---------|
| **REPLAY** | Re-simulates from t=0 on every scrub | Tuning parameters |
| **MODULAR** | Bakes data, mesh, particles separately | Partial re-bakes needed |
| **ALL** | Full locked bake to disk | Final render / `record.py` |

Switch `ds.cache_type = 'ALL'` in `blueprint.py` before the final bake.

## GLB Snapshot Export

Export a single frozen fluid frame for use as a WebXR prop:

```python
import bpy

TARGET_FRAME = 40  # mid-pour splash

bpy.context.scene.frame_set(TARGET_FRAME)
bpy.context.view_layer.update()

# The fluid mesh object is named "fluid_surface" by Mantaflow
fluid_mesh = bpy.data.objects.get("fluid_surface")
if fluid_mesh:
    bpy.ops.object.select_all(action='DESELECT')
    fluid_mesh.select_set(True)
    bpy.context.view_layer.objects.active = fluid_mesh

    bpy.ops.export_scene.gltf(
        filepath="//fluid_snapshot_frame40.glb",
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
    )
    print("Exported fluid snapshot.")
```

## External References

1. **Blender Manual — Fluid Simulation** (CC-BY-SA-4.0, Blender Foundation)
   <https://docs.blender.org/manual/en/latest/physics/fluid/>
   Full reference for domain, flow, and effector settings; bake UI walkthrough.

2. **Mantaflow** (Apache-2.0, Nils Thuerey, Philipp Jörg, Florian Ferstl et al.)
   <https://github.com/blender/blender/tree/main/intern/mantaflow>
   The solver library integrated into Blender since 2.82. Related upstream project:
   OpenVDB (Mozilla Public License 2.0) — used for volume meshing in conjunction
   with Mantaflow: <https://github.com/AcademySoftwareFoundation/openvdb>

## Tutorial Page

`/tutorials/blender-tutorial-physics-flip-fluid-mantaflow-ocean-pour`
