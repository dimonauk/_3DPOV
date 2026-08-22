"""
Physics — Particle System Emitter: Spark Trail, Wind Force + Deflector Collision
Blender 5.1  ·  bpy direct data API  ·  CC0

Technique: Newtonian emitter particles (OBJECT render type) with a Wind effector
and Vortex effector drive 500 spark instances along arcing trajectories. Ground
plane and sphere carry Collision modifiers — particles deflect and scatter on
impact. Instance object is a thin elongated box with an Emission material,
producing the flying-ember look classic to fire-and-sparks effects work.

WHY Newtonian, not Boids or Fluid?
  Newtonian integrates F = ma per particle each sub-step. Force field objects add
  external impulses at each step via effector weight attenuation. Boids solve
  steering behaviours (cohesion, separation, alignment) — wrong register for
  physical effects. Fluid type uses an SPH pressure kernel — correct for liquid
  simulations, roughly 20× heavier per particle than Newtonian at equal count.
  Newtonian at 500 particles with 2 quality sub-steps runs real-time on any GPU
  with Cycles or EEVEE.

WHY effector_weights instead of just scene gravity?
  Scene gravity (bpy.context.scene.gravity) applies to every physics system
  simultaneously. effector_weights on the particle settings block attenuates or
  amplifies each field type for THIS system only. Setting weight 0.0 for gravity
  makes smoke-style particles float; 1.0 makes sparks fall hard. The wind and
  vortex effector objects are each weighted independently, so one system can be
  dominated by wind while another ignores it entirely.
"""

import bpy
import bmesh

# ─── CONSTANTS ────────────────────────────────────────────────────────────────
PARTICLE_COUNT    = 500
PARTICLE_LIFETIME = 80      # frames before a particle dies
EMIT_START        = 1
EMIT_END          = 40      # emission window in frames
NORMAL_VEL        = 3.0     # m/s initial velocity along emitter face normal
RANDOM_VEL        = 1.5     # m/s isotropic random component
PARTICLE_SIZE     = 0.04    # instance object scale multiplier per particle
WIND_STRENGTH     = 8.0     # N/kg — force per unit mass applied by wind field
WIND_NOISE        = 0.8     # 0–1 turbulence noise on top of steady wind
VORTEX_STRENGTH   = 2.5     # N/kg
SIM_END           = 120     # total frame range for cache


# ─── HELPERS ──────────────────────────────────────────────────────────────────
def purge_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for coll in (bpy.data.meshes, bpy.data.particles, bpy.data.materials):
        for blk in list(coll):
            if blk.users == 0:
                coll.remove(blk)


def link(ob):
    bpy.context.collection.objects.link(ob)
    return ob


# ─── SPARK INSTANCE GEOMETRY ──────────────────────────────────────────────────
def make_spark_instance():
    """
    Thin elongated box: 4 cm × 4 cm × 18 cm.
    Oriented along Z so rotation_mode='VEL' aligns the long axis to velocity.
    Hidden in viewport and render — only visible as a particle instance.
    """
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= 0.04
        v.co.y *= 0.04
        v.co.z *= 0.18
    me = bpy.data.meshes.new("SparkMesh")
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("spark_instance", me)
    link(ob)
    ob.hide_render   = True   # direct rendering suppressed — instancing only
    ob.hide_viewport = True
    return ob


def make_spark_material():
    mat = bpy.data.materials.new("SparkEmission")
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()
    out  = tree.nodes.new('ShaderNodeOutputMaterial')
    emit = tree.nodes.new('ShaderNodeEmission')
    # Orange-white ember colour; strength 10 to bloom visibly in EEVEE
    emit.inputs['Color'].default_value    = (1.0, 0.45, 0.05, 1.0)
    emit.inputs['Strength'].default_value = 10.0
    tree.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat


# ─── SCENE OBJECTS ────────────────────────────────────────────────────────────
def make_emitter():
    bpy.ops.mesh.primitive_plane_add(size=0.4, location=(0.0, 0.0, 3.0))
    ob = bpy.context.active_object
    ob.name = "spark_emitter"
    return ob


def make_ground_deflector():
    bpy.ops.mesh.primitive_plane_add(size=10.0, location=(0.0, 0.0, 0.0))
    ob = bpy.context.active_object
    ob.name = "ground_deflector"
    ob.rotation_euler.x = 0.087   # ~5° tilt → sparks scatter laterally on impact
    coll = ob.modifiers.new("Collision", type='COLLISION')
    # thickness_outer: the shell around the surface where deflection begins (m)
    coll.settings.thickness_outer  = 0.02
    coll.settings.damping_factor   = 0.65   # absorbs normal-direction velocity
    coll.settings.friction_factor  = 0.80   # bleeds tangential velocity (rough ground)
    return ob


def make_sphere_deflector():
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.55, location=(0.2, 0.0, 1.3))
    ob = bpy.context.active_object
    ob.name = "sphere_deflector"
    coll = ob.modifiers.new("Collision", type='COLLISION')
    coll.settings.thickness_outer = 0.01    # tight — convex hull already safe
    coll.settings.damping_factor  = 0.30    # springy bounce off sphere
    coll.settings.friction_factor = 0.20
    return ob


def make_wind():
    bpy.ops.object.effector_add(type='WIND', location=(-3.5, 0.0, 1.8))
    ob = bpy.context.active_object
    ob.name = "wind_force"
    # Wind emits along the empty's -Z axis.
    # Rotating 90° around Y makes -Z point in the +X direction into the scene.
    ob.rotation_euler.y    = 1.5708
    ob.field.strength      = WIND_STRENGTH
    ob.field.noise         = WIND_NOISE    # turbulence layer over steady-state wind
    ob.field.use_min_distance = True
    ob.field.distance_min  = 0.5          # no effect inside 0.5 m radius
    return ob


def make_vortex():
    bpy.ops.object.effector_add(type='VORTEX', location=(0.0, 0.0, 0.8))
    ob = bpy.context.active_object
    ob.name = "vortex_force"
    ob.field.strength = VORTEX_STRENGTH
    ob.field.flow     = 0.6    # air-resistance drag — limits orbital speed
    return ob


# ─── PARTICLE SYSTEM ──────────────────────────────────────────────────────────
def add_particle_system(emitter, spark_ob, spark_mat):
    ps_mod = emitter.modifiers.new("Sparks", type='PARTICLE_SYSTEM')
    s      = ps_mod.particle_system.settings
    s.name = "SparkTrailSettings"

    # Emission
    s.count           = PARTICLE_COUNT
    s.lifetime        = PARTICLE_LIFETIME
    s.frame_start     = EMIT_START
    s.frame_end       = EMIT_END
    s.emit_from       = 'FACE'
    s.use_emit_random = True

    # Newton integration params
    s.physics_type    = 'NEWTON'
    s.mass            = 0.001     # ~1 gram — very light embers
    s.particle_size   = PARTICLE_SIZE
    s.size_random     = 0.40      # 40% size variance for visual variety

    # Initial velocity components
    s.normal_factor   = NORMAL_VEL
    s.factor_random   = RANDOM_VEL
    s.tangent_factor  = 0.3

    # Effector weights — attenuates each field type for this system
    s.effector_weights.gravity = 1.0
    s.effector_weights.wind    = 1.0
    s.effector_weights.vortex  = 1.0

    # Render: instance the spark shard on each particle
    s.render_type           = 'OBJECT'
    s.instance_object       = spark_ob
    # Align instance long axis (Z) to particle velocity direction
    s.rotation_mode         = 'VEL'
    s.use_dynamic_rotation  = True

    # Viewport preview — dots for performance while baking
    s.display_method = 'DOT'
    s.display_size   = 0.025
    s.display_count  = 200

    spark_ob.data.materials.clear()
    spark_ob.data.materials.append(spark_mat)


# ─── LIGHTING + CAMERA ────────────────────────────────────────────────────────
def setup_stage():
    bpy.ops.object.camera_add(location=(4.5, -5.5, 2.8))
    cam = bpy.context.active_object
    cam.name              = "render_cam"
    cam.rotation_euler    = (1.10, 0.0, 0.68)
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type='AREA', location=(2.0, -2.0, 5.0))
    key = bpy.context.active_object
    key.name              = "key_light"
    key.data.energy       = 800
    key.rotation_euler    = (0.8, 0.0, 0.5)


# ─── TIMELINE ─────────────────────────────────────────────────────────────────
def configure_scene():
    sc             = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end   = SIM_END
    sc.frame_set(1)
    sc.gravity     = (0.0, 0.0, -9.81)   # default value made explicit


# ─── ENTRY POINT ──────────────────────────────────────────────────────────────
def main():
    purge_scene()
    configure_scene()

    spark   = make_spark_instance()
    mat     = make_spark_material()
    emitter = make_emitter()
    make_ground_deflector()
    make_sphere_deflector()
    make_wind()
    make_vortex()

    add_particle_system(emitter, spark, mat)
    setup_stage()

    print("[HoloFlow] Spark trail scene built.")
    print("[HoloFlow] Next: Physics ▸ Bake All Dynamics.")
    print(f"[HoloFlow] Sim range: frames 1–{SIM_END}. Hero frame ≈ 55.")


main()
