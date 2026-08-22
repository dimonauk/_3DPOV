"""
Physics — Mantaflow FLIP Liquid: Dam Break over a Step Obstacle
Blender 5.1 · CC0 · Holoflow Studio

Technique: Mantaflow uses the FLIP (Fluid-Implicit-Particle) algorithm — a hybrid
Eulerian/Lagrangian scheme.  Particles carry velocity; a staggered MAC (Marker-and-Cell)
grid solves incompressible pressure.  Each timestep: P2G velocity transfer to grid,
pressure projection (PCG/Gauss-Seidel to enforce ∇·u = 0), G2P velocity correction
back to particles, then Lagrangian particle advection.  Volume is conserved because
the pressure solve enforces incompressibility and effector SDFs prevent particle overlap.

Domain object: defines the MAC grid bounding box.  Resolution Divisions = 64 means
the longest axis has 64 voxels; other axes scale proportionally.  At DOMAIN_W=2 m,
voxel size ≈ 3.1 cm — fine enough to resolve the primary bore, coarse enough to
bake in minutes.

Flow object (GEOMETRY behavior): seeds the rectangular water column at t=0 exactly
once.  Unlike INFLOW (continuous source), GEOMETRY sources run only on initialisation —
a single connected liquid body that collapses purely under gravity.

Step obstacle (EFFECTOR → COLLISION): Mantaflow builds a narrow-band SDF around the
obstacle each substep; particles within SDF < 0 are projected outward and their
normal-direction velocity is zeroed (no-slip).  The 18 cm step forces a two-stage
collapse: primary bore against the step face, then overflow cascade over the top.

Mesh display: domain_settings.use_mesh = True triggers the particle-to-isosurface
conversion.  mesh_particle_radius = 2.0 voxel units inflates each particle to a
~6.2 cm sphere and merges overlapping spheres into a smooth free surface.

Outside sources:
  Blender Manual — Fluid Domain Settings
    https://docs.blender.org/manual/en/latest/physics/fluid/type/domain/index.html
    CC-BY-SA 4.0 · Blender Foundation
  blender-scripting — headless bpy examples
    https://github.com/njanakiev/blender-scripting
    MIT · Nicolas Janakiev
  glTF-Blender-IO — official Khronos glTF exporter
    https://github.com/KhronosGroup/glTF-Blender-IO
    Apache-2.0 · Khronos Group
"""

import bpy
import math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
DOMAIN_W     = 2.0      # domain X extent (metres)
DOMAIN_D     = 1.0      # domain Y extent (metres, depth into screen)
DOMAIN_H     = 1.6      # domain Z extent (metres, height)

WATER_X      = 0.75     # initial water column width — left portion of domain
WATER_H      = 0.96     # initial water column height (DOMAIN_H × 0.6)

STEP_X       = 0.18     # step obstacle X width (narrower than water column for side-flow)
STEP_H       = 0.28     # step obstacle height on domain floor
STEP_POS_X   = 0.30     # step centre offset from domain centre (+X)

RESOLUTION   = 64       # MAC grid divisions along longest axis — quadrupling doubles time
PARTICLE_R   = 2.0      # mesh isosurface threshold: 2.0 = smooth; <1.5 exposes lumps

CACHE_DIR    = "//cache/mantaflow_dam_break/"

SIM_FRAMES   = 120      # 5 s at 24 fps
EXPORT_FRAME = 40       # GLB snapshot at ~peak bore splash (~1.67 s)

WATER_COLOUR = (0.05, 0.28, 0.72, 1.0)   # sRGB deep blue
STEP_COLOUR  = (0.35, 0.32, 0.30, 1.0)   # sRGB concrete grey

BLEND_PATH   = "//dam_break.blend"
EXPORT_GLB   = "//dam_break_splash.glb"


# ── Helpers ───────────────────────────────────────────────────────────────────
def _link(obj: bpy.types.Object) -> None:
    col = bpy.context.scene.collection
    if obj.name not in col.objects:
        col.objects.link(obj)


def _make_mat(name: str, colour: tuple, roughness: float = 0.6) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = colour
        bsdf.inputs['Roughness'].default_value  = roughness
    return mat


def _make_water_mat() -> bpy.types.Material:
    """Refractive water: Principled BSDF, IOR 1.333 (water-air), Transmission 0.92."""
    mat = bpy.data.materials.new("WaterMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value          = WATER_COLOUR
        bsdf.inputs['Roughness'].default_value           = 0.02
        bsdf.inputs['IOR'].default_value                 = 1.333
        bsdf.inputs['Transmission Weight'].default_value = 0.92
    # BLEND mode lets EEVEE Next show transmission in viewport preview
    mat.blend_method = 'BLEND'
    return mat


def _cleanup() -> None:
    prefixes = ("dam_domain", "water_col", "step_obs",
                "DamCam", "DamLight", "WaterMat", "StepMat")
    for ob in list(bpy.data.objects):
        if any(ob.name.startswith(p) for p in prefixes):
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if any(me.name.startswith(p) for p in ("dam_domain", "water_col", "step_obs")):
            bpy.data.meshes.remove(me)
    for ma in list(bpy.data.materials):
        if any(ma.name.startswith(p) for p in ("WaterMat", "StepMat")):
            bpy.data.materials.remove(ma)


# ── Domain ────────────────────────────────────────────────────────────────────
def _build_domain() -> bpy.types.Object:
    """
    Domain cube defines the MAC grid.  Mantaflow divides the longest axis into
    RESOLUTION voxels; all other axes scale proportionally — so a 2×1×1.6 m domain
    at 64 divisions gives 64×32×51 voxels, voxel size ≈ 3.1 cm.
    """
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, DOMAIN_H / 2))
    dom = bpy.context.active_object
    dom.name = "dam_domain"
    dom.scale = (DOMAIN_W / 2, DOMAIN_D / 2, DOMAIN_H / 2)
    bpy.ops.object.transform_apply(scale=True)

    mod = dom.modifiers.new("Fluid", 'FLUID')
    mod.fluid_type = 'DOMAIN'

    ds = mod.domain_settings
    ds.domain_type           = 'LIQUID'
    ds.resolution_max        = RESOLUTION
    ds.use_mesh              = True        # enable particle → isosurface stage
    ds.mesh_particle_radius  = PARTICLE_R  # sphere radius in voxel units
    ds.cache_type            = 'MODULAR'   # separate Bake Data / Bake Mesh passes
    ds.cache_directory       = CACHE_DIR

    dom.hide_render = True   # domain cube geometry is invisible; mesh display renders
    return dom


# ── Initial water column ──────────────────────────────────────────────────────
def _build_water_column() -> bpy.types.Object:
    """
    GEOMETRY flow: fills the mesh interior with particles at t=0 only.
    Unlike INFLOW, no particles are added after initialisation — pure dam break
    with a fixed initial volume and no external source energy.
    """
    cx = -DOMAIN_W / 2 + WATER_X / 2    # left-aligned within domain
    cz = WATER_H / 2
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, 0.0, cz))
    col = bpy.context.active_object
    col.name = "water_col"
    col.scale = (WATER_X / 2, DOMAIN_D / 2 - 0.01, WATER_H / 2)
    bpy.ops.object.transform_apply(scale=True)

    mod = col.modifiers.new("Fluid", 'FLUID')
    mod.fluid_type = 'FLOW'

    fs = mod.flow_settings
    fs.flow_type          = 'LIQUID'
    fs.flow_behavior      = 'GEOMETRY'    # one-shot volume seeding at t=0
    fs.use_initial_velocity = False       # start at rest; gravity drives collapse

    col.hide_render = True   # flow source cube is invisible; only fluid mesh renders
    return col


# ── Step obstacle ─────────────────────────────────────────────────────────────
def _build_step_obstacle() -> bpy.types.Object:
    """
    EFFECTOR COLLISION: a solid rectangular step on the domain floor.
    STEP_X < WATER_X so water wraps around both ends — 3-D interaction, not 2-D bore.
    surface_distance=0.0 uses exact SDF; no artificial clearance buffer.
    """
    cx = STEP_POS_X
    cz = STEP_H / 2
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, 0.0, cz))
    step = bpy.context.active_object
    step.name = "step_obs"
    step.scale = (STEP_X / 2, DOMAIN_D / 2 + 0.02, STEP_H / 2)
    bpy.ops.object.transform_apply(scale=True)

    mod = step.modifiers.new("Fluid", 'FLUID')
    mod.fluid_type = 'EFFECTOR'
    mod.effector_settings.effector_type    = 'COLLISION'
    mod.effector_settings.surface_distance = 0.0

    step.data.materials.append(_make_mat("StepMat", STEP_COLOUR, roughness=0.9))
    for poly in step.data.polygons:
        poly.use_smooth = False   # flat-shaded concrete
    return step


# ── Camera + lighting ─────────────────────────────────────────────────────────
def _setup_camera_lighting() -> None:
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = SIM_FRAMES
    scene.render.fps  = 24

    cam_d = bpy.data.cameras.new("DamCam")
    cam_o = bpy.data.objects.new("DamCam", cam_d)
    _link(cam_o)
    # Front-and-slightly-above framing; 40 mm lens to show full domain width
    cam_o.location       = Vector((0.1, 3.8, 0.85))
    look_tgt             = Vector((0.0, 0.0, 0.55))
    cam_o.rotation_euler = (look_tgt - cam_o.location).normalized().to_track_quat('-Z', 'Y').to_euler()
    scene.camera         = cam_o
    cam_d.lens           = 40.0

    sun_d = bpy.data.lights.new("DamLight", type='SUN')
    sun_d.energy  = 3.5
    sun_d.angle   = math.radians(5)
    sun_o = bpy.data.objects.new("DamLight", sun_d)
    _link(sun_o)
    sun_o.location       = Vector((-1.5, -2.0, 3.5))
    sun_dir              = (Vector((0.0, 0.0, 0.5)) - sun_o.location).normalized()
    sun_o.rotation_euler = sun_dir.to_track_quat('-Z', 'Y').to_euler()

    scene.render.engine          = 'CYCLES'
    scene.render.resolution_x    = 1920
    scene.render.resolution_y    = 1080
    scene.cycles.samples         = 128
    scene.cycles.use_denoising   = True


# ── Post-bake material assignment ─────────────────────────────────────────────
def _assign_water_material() -> None:
    """
    After baking, Mantaflow creates '<domain_name>_mesh' object.
    Apply the water material to it before export.
    """
    mesh_obj_name = "dam_domain_mesh"
    if mesh_obj_name not in bpy.data.objects:
        print(f"  [warn] '{mesh_obj_name}' not found — run Bake All first.")
        return
    fluid_obj = bpy.data.objects[mesh_obj_name]
    water_mat = _make_water_mat()
    if fluid_obj.data.materials:
        fluid_obj.data.materials[0] = water_mat
    else:
        fluid_obj.data.materials.append(water_mat)


# ── GLB export ────────────────────────────────────────────────────────────────
def export_glb() -> None:
    """
    Snapshot at EXPORT_FRAME: peak bore splash (~1.67 s).
    Selects the fluid mesh object + step obstacle; excludes domain cube.
    """
    bpy.context.scene.frame_set(EXPORT_FRAME)
    _assign_water_material()

    for ob in bpy.data.objects:
        ob.select_set(False)
    for name in ("dam_domain_mesh", "step_obs"):
        if name in bpy.data.objects:
            bpy.data.objects[name].select_set(True)

    bpy.ops.export_scene.gltf(
        filepath     = bpy.path.abspath(EXPORT_GLB),
        export_format  = 'GLB',
        use_selection  = True,
        export_apply   = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = 'WEBP',
    )
    print(f"✓ {EXPORT_GLB} written (frame {EXPORT_FRAME})")


# ── Entry point ───────────────────────────────────────────────────────────────
def build_scene() -> None:
    _cleanup()
    _build_domain()
    _build_water_column()
    _build_step_obstacle()
    _setup_camera_lighting()

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_PATH))
    print("✓ dam_break.blend written.")
    print("  Next: open in Blender UI → select dam_domain → Physics → Fluid → Bake All.")
    print("  Baking ~120 frames at Resolution 64 takes 3–10 min on a modern CPU.")
    print("  After bake: run record.py for viewport.mp4, then call export_glb() for GLB.")


if __name__ == '__main__':
    build_scene()
