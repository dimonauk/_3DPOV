"""
blueprint.py — Python bpy.types.ParticleSystem
Scripted Emitter + Hair Capture for WebXR Instance Scatter (Blender 5.1)

TECHNIQUE
=========
Particle systems in Blender 5.1 are a *legacy* but fully functional API sitting
alongside the newer Geometry Nodes scatter/hair approach. Understanding when each
matters: particles own physics (dynamics, forces, collisions, fluid interaction)
that GN Simulation Zones cannot yet replicate at the same maturity. For static
scatter or hair styling, GN is preferred. For boids, Mantaflow-coupled emitters,
or collision-deflected hair, the particle API still wins.

The scripted path (modifiers.new + psys.settings) is preferable to
bpy.ops.object.particle_system_add() because operators depend on an active
context object that may not be set correctly in batch scripts or render farms.

PARAMETERS
==========
"""

import bpy
import bmesh
import mathutils

# ── scene identity ──────────────────────────────────────────────────────────
SLUG        = "python-bpy-particle-system-emitter-hair-instance-webxr"
COLLECTION  = "ParticleDemo"

# ── emitter particle settings ────────────────────────────────────────────────
EMIT_COUNT      = 120          # instance count (keep low for fast depsgraph)
EMIT_SEED       = 42
EMIT_LIFETIME   = 1            # frames; set to 1 for a static frame-0 scatter
EMIT_FRAME_END  = 1
EMIT_FROM       = "FACE"       # VERT / EDGE / FACE / VOLUME
EMIT_DIST       = "RAND"       # JIT / RAND / GRID

# ── hair particle settings ───────────────────────────────────────────────────
HAIR_COUNT      = 200
HAIR_SEED       = 7
HAIR_LENGTH     = 0.25         # Blender units root-to-tip

# ── instance object for emitter ──────────────────────────────────────────────
INST_RADIUS     = 0.05

# ── outside sources (permissive / CC-BY-SA-4.0 docs; original code CC0) ─────
# Blender Foundation — bpy.types.ParticleSettings API reference
#   https://docs.blender.org/api/5.1/bpy.types.ParticleSettings.html
#   CC-BY-SA 4.0
# Blender Foundation — bpy.types.DepsgraphObjectInstance
#   https://docs.blender.org/api/5.1/bpy.types.DepsgraphObjectInstance.html
#   CC-BY-SA 4.0
# Blender open-data particle test files (CC0)
#   https://download.blender.org/demo/test/particle_tests/


def _clean_scene():
    """Remove everything in COLLECTION; leave other collections untouched."""
    if COLLECTION in bpy.data.collections:
        col = bpy.data.collections[COLLECTION]
        for ob in list(col.objects):
            bpy.data.objects.remove(ob, do_unlink=True)
        bpy.data.collections.remove(col)
    # Orphan data-blocks left over from the previous run
    for mesh in list(bpy.data.meshes):
        if not mesh.users:
            bpy.data.meshes.remove(mesh)
    for psys in list(bpy.data.particles):
        if not psys.users:
            bpy.data.particles.remove(psys)


def _make_collection() -> bpy.types.Collection:
    col = bpy.data.collections.new(COLLECTION)
    bpy.context.scene.collection.children.link(col)
    return col


# ── helpers ──────────────────────────────────────────────────────────────────

def _add_plane(col: bpy.types.Collection, name: str, size: float = 2.0):
    """Emit surface: a subdivided plane for good face-distribution coverage."""
    me = bpy.data.meshes.new(name + "_mesh")
    ob = bpy.data.objects.new(name, me)
    col.objects.link(ob)

    bm = bmesh.new()
    # 4×4 grid gives 16 faces — enough for even FACE distribution
    bmesh.ops.create_grid(bm, x_segments=4, y_segments=4, size=size / 2)
    bm.to_mesh(me)
    bm.free()
    return ob


def _add_instance_object(col: bpy.types.Collection) -> bpy.types.Object:
    """
    The instance object for OBJECT render_type.  Must live in a collection
    that the particle system can see — linking it to the same col works, but
    it should also be in the scene's object list (link to scene collection is
    handled automatically when col is parented to scene.collection).
    """
    me = bpy.data.meshes.new("inst_gem_mesh")
    ob = bpy.data.objects.new("inst_gem", me)
    col.objects.link(ob)

    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=INST_RADIUS)
    bm.to_mesh(me)
    bm.free()

    # Hide from final render — visible only as a particle instance source
    ob.hide_render = True
    ob.hide_viewport = False
    return ob


# ── particle system builders ──────────────────────────────────────────────────

def _add_emitter_psys(
    surface: bpy.types.Object,
    instance_ob: bpy.types.Object,
) -> bpy.types.ParticleSystem:
    """
    ParticleSystem is always owned by the modifier, never created directly.

    Key trap: bpy.data.particles.new() creates a *settings* data-block, not
    a system. The system data-block is only accessible via the modifier.
    Always use modifiers.new("name", "PARTICLE_SYSTEM") and then reach the
    settings via mod.particle_system.settings.
    """
    mod = surface.modifiers.new("Emitter", "PARTICLE_SYSTEM")
    psys: bpy.types.ParticleSystem = mod.particle_system
    s: bpy.types.ParticleSettings = psys.settings

    # Identity
    s.name      = "EmitterSettings"
    s.type      = "EMITTER"                 # vs HAIR

    # Count and timing — frame_end controls when emitter stops, frame_start when it begins
    s.count         = EMIT_COUNT
    s.lifetime      = EMIT_LIFETIME         # in frames; 1 = born at frame 0 only
    s.frame_start   = 0
    s.frame_end     = EMIT_FRAME_END
    s.seed          = EMIT_SEED

    # Emission shape
    s.emit_from         = EMIT_FROM         # FACE distributes across face area
    s.distribution      = EMIT_DIST         # RAND = purely random placement

    # ── CRITICAL: render type for instance scattering ──
    # OBJECT copies the instance_object at each particle position.
    # HALO, PATH (hair), COLLECTION are the other useful types.
    # Setting render_type before instance_object avoids an RNA type mismatch
    # that prints "wrong type" warnings into the console.
    s.render_type       = "OBJECT"
    s.instance_object   = instance_ob

    # Physics: NEWTON for realistic motion, NONE keeps particles frozen at
    # their emit position (ideal for static scatter)
    s.physics_type      = "NONE"
    s.particle_size     = 1.0
    s.size_random       = 0.4              # ±40 % size variation per particle

    return psys


def _add_hair_psys(surface: bpy.types.Object) -> bpy.types.ParticleSystem:
    """
    Hair particles: type='HAIR', no lifetime, path rendering.
    In Blender 5.1 the GN Curves approach (Add → Curves → Hair Curves) is
    the preferred authoring path; legacy hair particles remain for baking,
    physics interactions, and existing asset pipelines.
    """
    mod = surface.modifiers.new("Hair", "PARTICLE_SYSTEM")
    psys: bpy.types.ParticleSystem = mod.particle_system
    s: bpy.types.ParticleSettings = psys.settings

    s.name      = "HairSettings"
    s.type      = "HAIR"

    s.count         = HAIR_COUNT
    s.seed          = HAIR_SEED
    s.hair_length   = HAIR_LENGTH

    # PATH render: draws strands as tapered curves (the classic hair look)
    s.render_type   = "PATH"
    s.path_start    = 0.0
    s.path_end      = 1.0

    # Root thicker than tip — gives volume without extra geometry
    s.root_radius   = 0.012
    s.tip_radius    = 0.001

    # RAND distribution spreads roots across the surface
    s.emit_from         = "FACE"
    s.distribution      = "RAND"
    s.use_advanced_hair = True             # expose per-strand control in UI

    return psys


# ── depsgraph capture ─────────────────────────────────────────────────────────

def _capture_instances(
    surface: bpy.types.Object,
    dg: bpy.types.Depsgraph,
) -> list[mathutils.Matrix]:
    """
    Walk dg.object_instances to collect the world matrices of every particle
    instance whose parent is our surface.  The inst object is a transient
    DepsgraphObjectInstance view — copy its matrix immediately; the reference
    becomes invalid on the next iteration.
    """
    matrices: list[mathutils.Matrix] = []
    for inst in dg.object_instances:
        if not inst.is_instance:
            continue
        if inst.parent is None:
            continue
        if inst.parent.original is surface:
            matrices.append(inst.matrix_world.copy())
    return matrices


def _store_positions_as_attribute(
    matrices: list[mathutils.Matrix],
    col: bpy.types.Collection,
) -> bpy.types.Object:
    """
    Store captured instance positions on a point-cloud mesh so they survive
    the depsgraph and can be exported as a named attribute via GLB extras.
    The receiving mesh has one vertex per captured instance.
    """
    n = len(matrices)
    me = bpy.data.meshes.new("captured_positions_mesh")
    ob = bpy.data.objects.new("captured_positions", me)
    col.objects.link(ob)

    # Allocate vertex buffer
    me.vertices.add(n)
    for i, mx in enumerate(matrices):
        me.vertices[i].co = mx.translation

    # Named float-vector attribute: WebXR loader reads "instance_world_pos"
    attr = me.attributes.new("instance_world_pos", "FLOAT_VECTOR", "POINT")
    for i, mx in enumerate(matrices):
        attr.data[i].vector = mx.translation

    me.update()
    return ob


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    _clean_scene()
    col = _make_collection()

    # Surface A: emitter scatter
    surface_emit = _add_plane(col, "emitter_surface", size=2.0)
    inst_ob      = _add_instance_object(col)
    _add_emitter_psys(surface_emit, inst_ob)

    # Surface B: hair/fur (separate plane, slightly offset)
    surface_hair = _add_plane(col, "hair_surface", size=1.0)
    surface_hair.location.x = 2.5
    _add_hair_psys(surface_hair)

    # Trigger particle evaluation at frame 0
    bpy.context.scene.frame_set(0)
    dg = bpy.context.evaluated_depsgraph_get()

    # Capture emitter instance positions
    matrices = _capture_instances(surface_emit, dg)
    pos_ob   = _store_positions_as_attribute(matrices, col)

    # Tag custom properties on pos_ob for GLB extras
    pos_ob["holoflow:facet"]    = 0
    pos_ob["particle_count"]    = len(matrices)
    pos_ob["emit_seed"]         = EMIT_SEED
    pos_ob["capture_frame"]     = 0

    print(f"[{SLUG}] emitter instances captured: {len(matrices)}")
    print(f"[{SLUG}] position mesh: {pos_ob.name}")
    print(f"[{SLUG}] done — scene ready for GLB export")


if __name__ == "__main__":
    main()
