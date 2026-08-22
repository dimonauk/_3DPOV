"""
Particle System Emitter — Turbulence Force Field, Face Emission,
Instance Render & Depsgraph GLB Snapshot  (Blender 5.1)

Technique
---------
A Torus emitter throws 300 icosphere shards outward via Newtonian physics.
A Turbulence effector bends trajectories into organic arcs.  At SNAPSHOT_FRAME
the evaluated depsgraph yields alive particle positions and quaternion rotations;
real mesh copies are placed there, joined into a single object, and exported GLB.

The depsgraph read-back (evaluated_get + particle_systems) is the correct
Blender 4.x/5.x path.  bpy.ops.object.duplicates_make_real() is avoided:
it silently no-ops in headless -b mode when no viewport depsgraph manager exists.

Run
---
    blender --background --python blueprint.py
or  Blender Scripting workspace → Run Script (Alt+P)
"""

import bpy
import bmesh
import os
import math

# ──────────────────────────────── parameters ───────────────────────────────────
PARTICLE_COUNT   = 300
EMIT_START       = 1
EMIT_END         = 12         # burst window — all shards launched inside 12 frames
LIFETIME         = 90         # frames alive
LIFETIME_RANDOM  = 0.35       # ±35 % stagger — avoids synchronised pop-out at frame 102
NORMAL_VELOCITY  = 4.0        # outward kick along face normal (m/s)
RANDOM_VELOCITY  = 2.0        # per-particle random velocity component
GRAVITY_WEIGHT   = 0.25       # fraction of default gravity — floaty, not floor-glued
TURB_STRENGTH    = 10.0       # turbulence field kick magnitude
TURB_SIZE        = 0.6        # noise cell size (m) — smaller = finer turbulence
TURB_NOISE       = 0.5        # flow noise 0=laminar, 1=fully stochastic
SNAPSHOT_FRAME   = 35         # frame to freeze for GLB (burst spread, all alive)
SHARD_SUBDIV     = 2          # icosphere subdivisions per shard instance
HERE             = os.path.dirname(os.path.abspath(__file__))
BLEND_PATH       = os.path.join(HERE, "particle_shard_burst.blend")
GLB_PATH         = os.path.join(HERE, "particle_shard_burst.glb")


# ──────────────────────────────── scene reset ──────────────────────────────────
def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE_NEXT'
    sc.frame_start, sc.frame_end = 1, 120
    sc.gravity[2] = -9.81


# ──────────────────────────────── shard instance ───────────────────────────────
def make_shard() -> bpy.types.Object:
    """
    Low-poly elongated icosphere — the object each particle renders as.
    Two material slots: dark metallic body (slot 0) + cyan emissive glow (slot 1).
    Parked at Z=-100 so it's invisible in the render; particle system clones it.
    """
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=SHARD_SUBDIV, radius=0.06)
    # Elongate along Z to read as a crystal chip rather than a sphere
    for v in bm.verts:
        v.co.z *= 1.7
    bm.normal_update()

    mesh = bpy.data.meshes.new("ShardMesh")
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = False     # flat-shaded facets match studio aesthetic

    shard = bpy.data.objects.new("shard_instance", mesh)
    bpy.context.collection.objects.link(shard)
    shard.location = (0, 0, -100)   # off-screen park

    mat_body = bpy.data.materials.new("ShardBody")
    mat_body.use_nodes = True
    bsdf = mat_body.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value  = (0.05, 0.08, 0.20, 1.0)
    bsdf.inputs["Metallic"].default_value    = 0.90
    bsdf.inputs["Roughness"].default_value   = 0.22

    mat_glow = bpy.data.materials.new("ShardGlow")
    mat_glow.use_nodes = True
    nt = mat_glow.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value    = (0.20, 0.80, 1.00, 1.0)
    emit.inputs["Strength"].default_value = 4.0
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])

    shard.data.materials.append(mat_body)
    shard.data.materials.append(mat_glow)
    return shard


# ──────────────────────────────── torus emitter ────────────────────────────────
def make_emitter() -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        major_radius=1.2, minor_radius=0.28,
        major_segments=24, minor_segments=8,
        location=(0, 0, 0),
    )
    emitter = bpy.context.active_object
    emitter.name = "particle_emitter_torus"
    # Transparent material — the emitter itself is invisible at render
    mat_e = bpy.data.materials.new("EmitterGlass")
    mat_e.use_nodes = True
    mat_e.node_tree.nodes["Principled BSDF"].inputs["Alpha"].default_value = 0.0
    mat_e.blend_method = 'BLEND'
    emitter.data.materials.append(mat_e)
    return emitter


# ──────────────────────────────── particle system ──────────────────────────────
def add_particle_system(emitter: bpy.types.Object,
                         shard: bpy.types.Object) -> bpy.types.ParticleSystem:
    """
    obj.modifiers.new('name', 'PARTICLE_SYSTEM') creates BOTH the modifier
    and a ParticleSystem object simultaneously — no bpy.ops.object.particle_system_add()
    needed, which requires an active-object UI context.  mod.particle_system
    references the auto-created ParticleSystem; its .settings is the data-block
    we configure.
    """
    mod  = emitter.modifiers.new("ShardBurst", 'PARTICLE_SYSTEM')
    ps   = mod.particle_system
    pset = ps.settings

    pset.type            = 'EMITTER'
    pset.count           = PARTICLE_COUNT
    pset.frame_start     = float(EMIT_START)
    pset.frame_end       = float(EMIT_END)
    pset.lifetime        = float(LIFETIME)
    pset.lifetime_random = LIFETIME_RANDOM  # stagger: p dies between lifetime*(1-r) and lifetime

    # FACE: proportional to polygon area — dense on wide faces, sparse on narrow ones
    pset.emit_from       = 'FACE'
    pset.use_emit_random = True

    pset.physics_type          = 'NEWTON'   # integrate velocity + forces each frame
    pset.normal_factor         = NORMAL_VELOCITY
    pset.factor_random         = RANDOM_VELOCITY
    pset.angular_velocity_mode   = 'RAND'   # random tumble per shard
    pset.angular_velocity_factor = 2.5

    pset.effector_weights.gravity = GRAVITY_WEIGHT

    # OBJECT render: each particle becomes a positioned clone of shard_instance
    pset.render_type      = 'OBJECT'
    pset.instance_object  = shard
    pset.particle_size    = 1.0
    pset.size_random      = 0.40    # ±40 % size scatter

    pset.display_method   = 'DOT'
    pset.display_size     = 0.05
    return ps


# ──────────────────────────────── turbulence effector ──────────────────────────
def add_turbulence() -> bpy.types.Object:
    """
    effector_add(type='TURBULENCE') creates an empty with field.type pre-assigned.
    TURB_SIZE: 0.6 m places one noise cell across the burst radius — each shard
    gets a distinct arc.  TURB_NOISE=0.5 adds secondary perturbation for organic
    variation without full randomness.
    """
    bpy.ops.object.effector_add(type='TURBULENCE', location=(0, 0, 0))
    turb = bpy.context.active_object
    turb.name              = "turbulence_field"
    turb.field.strength    = TURB_STRENGTH
    turb.field.size        = TURB_SIZE
    turb.field.noise       = TURB_NOISE
    turb.field.use_global_coords = True     # world-space noise — rotation-invariant
    return turb


# ──────────────────────────────── snapshot + export ────────────────────────────
def snapshot_and_export(emitter: bpy.types.Object,
                         shard: bpy.types.Object) -> None:
    """
    Advance to SNAPSHOT_FRAME, read particle state from evaluated depsgraph,
    place real mesh copies, join, apply transforms, export GLB.

    p.rotation is a mathutils.Quaternion (WXYZ).  Assign via rotation_mode='QUATERNION'
    + rotation_quaternion — never convert to Euler: gimbal-lock silently mangles
    fast-tumbling shards (>180°/frame rotation near poles).
    """
    sc = bpy.context.scene
    sc.frame_set(SNAPSHOT_FRAME)

    dg         = bpy.context.evaluated_depsgraph_get()
    eval_obj   = emitter.evaluated_get(dg)
    ps_eval    = eval_obj.particle_systems[0]
    alive      = [p for p in ps_eval.particles if p.alive_state == 'ALIVE']
    print(f"[holoflow] {len(alive)} particles alive at frame {SNAPSHOT_FRAME}")

    if not alive:
        print("[holoflow] WARNING: no alive particles — lower SNAPSHOT_FRAME or increase LIFETIME")
        return

    new_objs = []
    for p in alive:
        cpy      = shard.copy()
        cpy.data = shard.data.copy()
        bpy.context.collection.objects.link(cpy)
        cpy.location            = p.location
        cpy.rotation_mode       = 'QUATERNION'
        cpy.rotation_quaternion = p.rotation    # WXYZ quaternion, no Euler conversion
        s = p.size
        cpy.scale               = (s, s, s)
        new_objs.append(cpy)

    bpy.ops.object.select_all(action='DESELECT')
    for o in new_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = new_objs[0]
    bpy.ops.object.join()
    burst = bpy.context.active_object
    burst.name = "particle_shard_burst"
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print(f"[holoflow] .blend → {BLEND_PATH}")

    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        use_selection=False,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_apply=True,
        export_yup=True,
    )
    print(f"[holoflow] GLB  → {GLB_PATH}")


# ──────────────────────────────── entry point ──────────────────────────────────
reset_scene()
shard_obj   = make_shard()
emitter_obj = make_emitter()
add_particle_system(emitter_obj, shard_obj)
add_turbulence()
snapshot_and_export(emitter_obj, shard_obj)
