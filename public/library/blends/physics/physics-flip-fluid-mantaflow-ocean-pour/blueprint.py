"""
FLIP Fluid Mantaflow — Liquid Pour into a Glass Vessel
Blender 5.1 | physics | Holoflow Studio Library

FLIP = Fluid-Implicit-Particle: particles carry velocity; a MAC grid runs a
conjugate-gradient pressure solve each substep; corrected velocities return to
particles (G→P).  Surface extracted via level-set marching cubes.  Mantaflow
(Apache-2.0) is the solver integrated into Blender since 2.82.
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ─── Parameters ──────────────────────────────────────────────────────────────
DOMAIN_SIZE       = 4.0     # World-unit cube side length for the fluid domain
DOMAIN_HEIGHT     = 3.0     # Domain is taller than wide to contain the pour arc
RESOLUTION        = 64      # Voxel count along the longest domain axis.
                             # 32 = fast preview (~5 min), 64 = studio quality (~25 min),
                             # 128 = high-fidelity overnight.
VISCOSITY_VALUE   = 1.0     # Mantaflow stores viscosity as value × 10^(-exponent)
VISCOSITY_EXP     = 3       # Combined: kinematic viscosity = 1 × 10^-3 m²/s ≈ water
SIMULATION_END    = 80      # Frames to bake at 24 fps (≈ 3.3 seconds of pour)
CACHE_DIR         = "//cache/fluid/"  # Relative to the .blend file
POUR_VELOCITY_Z   = -3.0   # m/s downward inflow velocity (negative = -Z world)
MESH_PARTICLE_RAD = 2.0     # Particle radius as cell-size fraction; higher = smoother
VESSEL_RADIUS     = 0.75
VESSEL_HEIGHT     = 1.6


# ─── Helpers ─────────────────────────────────────────────────────────────────
def purge_scene() -> None:
    """Remove all default objects; start clean."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes) + list(bpy.data.materials):
        if block.users == 0:
            bpy.data.batch_remove([block])


def make_domain() -> bpy.types.Object:
    """
    An axis-aligned box defines the simulation boundary.
    Mantaflow discards fluid that leaves the domain on any enabled border face.
    We leave the top border open so the pour stream can enter from above.
    """
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = "Fluid_Domain"
    # Non-uniform scale: taller than wide so the pour stream lands inside
    half_xy = DOMAIN_SIZE * 0.5
    half_z  = DOMAIN_HEIGHT * 0.5
    obj.scale = (half_xy, half_xy, half_z)
    bpy.ops.object.transform_apply(scale=True)
    obj.display_type = 'WIRE'  # domain is invisible; only the fluid mesh renders

    mod = obj.modifiers.new("Fluid", 'FLUID')
    mod.fluid_type = 'DOMAIN'

    ds = mod.domain_settings
    ds.domain_type          = 'LIQUID'
    ds.resolution_max       = RESOLUTION
    ds.use_flip_particles   = True   # enables the FLIP particle system
    ds.use_mesh             = True   # generate fluid surface mesh per frame
    ds.mesh_particle_radius = MESH_PARTICLE_RAD
    ds.cache_directory      = CACHE_DIR
    # REPLAY = re-simulate on scrub; change to 'ALL' before bpy.ops.fluid.bake_all()
    ds.cache_type           = 'REPLAY'
    ds.time_scale           = 1.0
    ds.viscosity_value      = VISCOSITY_VALUE
    ds.viscosity_exponent   = VISCOSITY_EXP
    # Border collision flags — open top so the inflow sphere can drip into domain
    ds.use_collision_border_front  = True
    ds.use_collision_border_back   = True
    ds.use_collision_border_left   = True
    ds.use_collision_border_right  = True
    ds.use_collision_border_top    = False  # open top for inflow entry
    ds.use_collision_border_bottom = True

    return obj


def make_glass_vessel() -> bpy.types.Object:
    """Thin-walled open-top cylinder. Solidify gives inward normals the effector needs."""
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=32,
        radius=VESSEL_RADIUS,
        depth=VESSEL_HEIGHT,
        location=(0, 0, -(DOMAIN_HEIGHT * 0.5 - VESSEL_HEIGHT * 0.5 - 0.05)),
    )
    obj = bpy.context.active_object
    obj.name = "Glass_Vessel"

    # Remove the top face (open mouth of the vessel)
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(obj.data)
    bm.faces.ensure_lookup_table()
    top_z = max(f.calc_center_median().z for f in bm.faces)
    for face in bm.faces:
        face.select = (face.calc_center_median().z > top_z - 0.01)
    bmesh.update_edit_mesh(obj.data)
    bpy.ops.mesh.delete(type='FACE')
    bpy.ops.object.mode_set(mode='OBJECT')

    # Solidify inward: outer silhouette unchanged, inner wall gets correct normals
    sol = obj.modifiers.new("Solidify", 'SOLIDIFY')
    sol.thickness = 0.04
    sol.offset    = -1.0

    bpy.ops.object.shade_smooth()

    # Register as fluid collision surface
    eff = obj.modifiers.new("Fluid", 'FLUID')
    eff.fluid_type = 'EFFECTOR'
    eff.effector_settings.effector_type = 'COLLISION'
    eff.effector_settings.use_effector  = True

    return obj


def make_inflow_source() -> bpy.types.Object:
    """Sphere above vessel rim. INFLOW re-seeds volume each frame (GEOMETRY = fill at t=0)."""
    pour_z = DOMAIN_HEIGHT * 0.5 - 0.3   # near top of domain
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=0.12,
        location=(0.08, -0.12, pour_z),   # off-axis → naturalistic off-centre pour
        segments=8,
        ring_count=6,
    )
    obj = bpy.context.active_object
    obj.name = "Fluid_Source"
    obj.display_type = 'WIRE'

    mod = obj.modifiers.new("Fluid", 'FLUID')
    mod.fluid_type = 'FLOW'

    fs = mod.flow_settings
    fs.flow_type           = 'LIQUID'
    fs.flow_behavior       = 'INFLOW'
    fs.use_initial_velocity = True
    # Negative Z = downward; magnitude controls pour force/spread
    fs.velocity_factor     = POUR_VELOCITY_Z
    fs.use_plane_init      = False  # emit from full sphere volume

    return obj


def make_glass_material() -> bpy.types.Material:
    """Principled BSDF full-transmission glass. IOR 1.47 = borosilicate mid-range."""
    mat = bpy.data.materials.new("Glass_Borosilicate")
    mat.use_nodes                    = True
    mat.use_screen_space_refraction  = True  # EEVEE Next: enables refraction pass
    nt = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    out.location  = (300, 0)
    bsdf.location = (0, 0)
    bsdf.inputs["Base Color"].default_value          = (0.92, 0.97, 1.0, 1.0)
    bsdf.inputs["Roughness"].default_value           = 0.0
    bsdf.inputs["IOR"].default_value                 = 1.47
    bsdf.inputs["Transmission Weight"].default_value = 1.0
    bsdf.inputs["Alpha"].default_value               = 0.12

    mat.blend_method  = 'HASHED'  # avoids order-dependent transparency artefacts
    mat.shadow_method = 'HASHED'
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def make_water_material() -> bpy.types.Material:
    """Water: IOR 1.333 (exact, 20°C). Domain inherits this material to fluid_surface."""
    mat = bpy.data.materials.new("Water_Still")
    mat.use_nodes                   = True
    mat.use_screen_space_refraction = True
    nt = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    out.location  = (300, 0)
    bsdf.location = (0, 0)
    bsdf.inputs["Base Color"].default_value          = (0.50, 0.73, 0.86, 1.0)
    bsdf.inputs["Roughness"].default_value           = 0.015
    bsdf.inputs["IOR"].default_value                 = 1.333
    bsdf.inputs["Transmission Weight"].default_value = 0.88
    bsdf.inputs["Alpha"].default_value               = 0.65

    mat.blend_method  = 'HASHED'
    mat.shadow_method = 'HASHED'
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def setup_lighting() -> None:
    """Key + fill + rim: illuminates the water column and glass caustics."""
    bpy.ops.object.light_add(type='AREA', location=(3.5, -2.5, 4.5))
    key = bpy.context.active_object
    key.name = "Key_Window"
    key.data.energy = 600
    key.data.size   = 2.5
    key.rotation_euler = (math.radians(48), 0, math.radians(32))

    bpy.ops.object.light_add(type='AREA', location=(-2.2, 1.0, 2.5))
    fill = bpy.context.active_object
    fill.name = "Fill_Bounce"
    fill.data.energy = 180
    fill.data.size   = 3.5

    bpy.ops.object.light_add(type='SPOT', location=(0, 2.8, 3.0))
    rim = bpy.context.active_object
    rim.name = "Rim_Accent"
    rim.data.energy     = 250
    rim.data.spot_size  = math.radians(25)
    rim.data.spot_blend = 0.3
    rim.rotation_euler  = (math.radians(60), 0, math.radians(180))

    world = bpy.context.scene.world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value    = (0.06, 0.06, 0.08, 1.0)
        bg.inputs["Strength"].default_value = 0.3


def setup_camera() -> None:
    """Side-above angle; 80 mm telephoto compresses the pour column into a dramatic ribbon."""
    bpy.ops.object.camera_add(location=(4.2, -3.5, 1.0))
    cam = bpy.context.active_object
    cam.name = "Pour_Camera"
    cam.rotation_euler = (math.radians(74), 0, math.radians(50))
    cam.data.lens = 80
    bpy.context.scene.camera = cam


def setup_render() -> None:
    """EEVEE Next with SSR and refraction for real-time glass + water preview."""
    scene   = bpy.context.scene
    render  = scene.render
    render.engine       = 'BLENDER_EEVEE_NEXT'
    render.resolution_x = 1920
    render.resolution_y = 1080
    render.fps          = 24
    scene.frame_start   = 1
    scene.frame_end     = SIMULATION_END

    eevee = scene.eevee
    eevee.use_ssr            = True   # screen-space reflections for water surface glints
    eevee.use_ssr_refraction = True   # refraction pass for glass + water overlap
    eevee.ssr_quality        = 0.75
    eevee.use_gtao           = True   # AO reads under the vessel base


# ─── Main ────────────────────────────────────────────────────────────────────
def main() -> None:
    purge_scene()

    domain = make_domain()
    vessel = make_glass_vessel()
    source = make_inflow_source()  # noqa: F841 — referenced by Mantaflow at bake time

    glass_mat = make_glass_material()
    water_mat = make_water_material()
    vessel.data.materials.append(glass_mat)
    # Assign water material to domain: the fluid mesh object Mantaflow creates
    # at bake time automatically inherits the domain's material slots.
    domain.data.materials.append(water_mat)

    setup_lighting()
    setup_camera()
    setup_render()

    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()

    print("Blueprint built — next steps:")
    print("  1. Select Fluid_Domain → Physics Properties → Fluid → Cache")
    print(f"     Confirm directory = '{CACHE_DIR}'  (relative to .blend)")
    print("  2. Change Cache Type from REPLAY → ALL for a permanent bake.")
    print("  3. Click Bake All (or bpy.ops.fluid.bake_all() in the console).")
    print(f"     At resolution {RESOLUTION}, ~{SIMULATION_END} frames: allow 15–30 min.")
    print("  4. Scrub to frame 35–45 for the best mid-pour splash shape.")
    print("  5. Run record.py (in the same folder) to capture viewport animation.")


if __name__ == "__main__":
    main()
