"""
Soft Body — Squash-and-Stretch Jelly Blob (Blender 5.1)
========================================================
Technique: Blender's Soft Body solver treats every mesh vertex as a point mass
connected to its neighbours by virtual springs (Edge Springs) and optionally
tethered back to its animated rest position (Goal).  Tuning the ratio of spring
stiffness to goal attraction produces the full range from rigid jello to
completely floppy cloth.

Two passes run here:
  1. Physics build     — sphere, weight-painted Goal group, SoftBody modifier,
                         collision floor, gravity drop, disk-cache bake.
  2. Shape-key harvest — at three characteristic frames (rest, max-squash,
                         max-stretch), we snapshot the modifier-evaluated mesh
                         into shape keys so the animation is portable to GLB.
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ── Constants ────────────────────────────────────────────────────────────────
SPHERE_NAME      = "jelly_blob"
FLOOR_NAME       = "collision_floor"
EMPTY_NAME       = "blob_ctrl"          # animated empty for goal target
CACHE_SUBDIR     = "//softbody_cache/"  # relative to .blend file
FRAME_START      = 1
FRAME_END        = 80                   # 80 frames at 24 fps ≈ 3.3 s
FRAME_SQUASH     = 22                   # empirically peak compression
FRAME_STRETCH    = 30                   # empirically peak elongation
FRAME_SETTLE     = 60                   # back near rest after damping
DROP_HEIGHT      = 2.8                  # metres above origin
BLOB_RADIUS      = 0.65                 # blob radius in metres

# Soft Body spring parameters — tune for cartoon jelly feel
GOAL_MIN         = 0.05   # floppy equator / underside
GOAL_MAX         = 0.90   # stiff crown (keeps blob from inverting)
GOAL_SPRING      = 0.5    # spring constant pulling vertex to goal
GOAL_DAMP        = 0.5    # damping on goal spring

EDGE_PULL        = 0.85   # edge spring pull (resist stretching)
EDGE_PUSH        = 0.85   # edge spring push (resist compression)
EDGE_DAMP        = 0.10   # edge spring damping
BEND             = 0.60   # bending stiffness across faces

MASS             = 0.30   # vertex mass (kg) — lighter = bouncier
FRICTION         = 0.30   # aerodynamic drag
STEPS            = 40     # substeps per frame — more = more stable / slower
ITERATIONS       = 10     # constraint solver iterations

# ── Helpers ───────────────────────────────────────────────────────────────────

def purge():
    """Remove objects left over from a previous script run."""
    for name in (SPHERE_NAME, FLOOR_NAME, EMPTY_NAME):
        if name in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)


def set_active(obj):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)


# ── Scene ─────────────────────────────────────────────────────────────────────

def build_scene():
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.frame_set(1)

    # Gravity on — default 9.81 in −Z; leave it.
    scene.gravity = (0.0, 0.0, -9.81)

    # Camera — simple side view
    if "Camera" in bpy.data.objects:
        cam = bpy.data.objects["Camera"]
        cam.location = (0.0, -6.0, 1.5)
        cam.rotation_euler = (math.radians(80), 0.0, 0.0)


# ── Blob ──────────────────────────────────────────────────────────────────────

def build_blob():
    """
    ICO sphere at subdivision 4 gives 642 vertices — enough springs to show
    smooth squash/stretch without dominating the simulation budget.
    UV sphere at ring=24 seg=24 is also fine but produces slightly less
    uniform spring lengths, which can cause visible surface wrinkles under
    heavy Goal constraint.
    """
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=4,
        radius=BLOB_RADIUS,
        location=(0.0, 0.0, DROP_HEIGHT),
    )
    blob = bpy.context.active_object
    blob.name = SPHERE_NAME

    # Subdivision Surface before SoftBody keeps collision geometry smooth.
    # type=SIMPLE avoids catmull-clark shrinkage of the control cage.
    sub = blob.modifiers.new("Subdiv", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 2
    sub.subdivision_type = 'SIMPLE'

    return blob


# ── Weight paint for Goal ─────────────────────────────────────────────────────

def paint_goal_group(blob):
    """
    Goal weight determines how tightly each vertex is pulled back to its
    animated rest position.  Weight=1.0 → rigid (no soft-body deformation).
    Weight=0.0 → fully soft (deformation governed only by spring network).

    Crown at weight 0.9: keeps the top from inverting on hard impacts.
    Equator at weight 0.4: mid deformation zone — shows the squash bulge.
    Underside at weight 0.05: maximum floppy, shows impact splash.
    """
    me = blob.data
    vg = blob.vertex_groups.new(name="soft_body_goal")

    me.calc_normals()
    for v in me.vertices:
        # Normalised Z in blob-local space: +1 = crown, −1 = bottom
        z_norm = v.co.z / BLOB_RADIUS
        if z_norm >= 0.5:
            w = 0.9
        elif z_norm >= -0.2:
            # Linear ramp from 0.9 (top) → 0.1 (equator→bottom)
            t = (z_norm - (-0.2)) / (0.5 - (-0.2))
            w = 0.1 + t * 0.8
        else:
            w = GOAL_MIN

        vg.add([v.index], w, 'REPLACE')

    return vg


# ── Soft Body modifier ────────────────────────────────────────────────────────

def add_soft_body(blob, goal_group):
    """
    Modifier order matters: SUBSURF → SOFT_BODY.
    Blender evaluates modifiers top-to-bottom; soft body runs on the
    SUBDIVIDED vertex count (642), not the control cage (162).  Heavier
    but gives smoother spring distribution.

    CRITICAL: soft_body.settings.vertex_group_goal must be set to the
    vertex group NAME (a string), not the group object itself.
    """
    sb_mod = blob.modifiers.new("SoftBody", "SOFT_BODY")
    sb     = sb_mod.settings     # bpy.types.SoftBodySettings

    # ── Goal ──────────────────────────────────────────────────────────────────
    # Goal "springs" each vertex back toward its rest position (the evaluated
    # position of the mesh WITHOUT the soft body modifier — i.e., the animated
    # position of the object).  This is what gives a Soft Body object memory
    # of its original shape.
    sb.use_goal                = True
    sb.vertex_group_goal       = goal_group.name
    sb.goal_min                = GOAL_MIN
    sb.goal_max                = GOAL_MAX
    sb.goal_spring             = GOAL_SPRING   # Hooke constant for goal spring
    sb.goal_friction           = GOAL_DAMP     # damping on goal spring (not aerodynamic)

    # ── Edge Springs ──────────────────────────────────────────────────────────
    # Edge springs connect mesh vertices along mesh edges.  Pull resists
    # elongation (edges getting longer than rest length), Push resists
    # compression (edges getting shorter).  Setting both to the same value
    # gives symmetric squash/stretch response.
    sb.use_edges               = True
    sb.pull                    = EDGE_PULL
    sb.push                    = EDGE_PUSH
    sb.damp                    = EDGE_DAMP
    sb.use_stiff_quads         = True  # diagonal springs across quads/tris

    # Bending stiffness — virtual springs connecting vertices across two
    # edges.  Without bending, the mesh creases at edge boundaries under
    # heavy deformation.
    sb.bend                    = BEND

    # ── Mass / Damping ────────────────────────────────────────────────────────
    # Per-vertex mass in kg.  Lower mass → faster, springier response.
    # Friction here is aerodynamic drag (velocity-proportional), NOT friction
    # with the collision surface (which lives in the Collision modifier).
    sb.mass                    = MASS
    sb.friction                = FRICTION

    # ── Solver ────────────────────────────────────────────────────────────────
    # step_min and step_max set the adaptive substep range per frame.
    # For a 24fps scene: dt_frame = 1/24 s; each substep dt = dt_frame/steps.
    # More substeps → stable for stiff springs; fewer → faster bake.
    sb.step_min                = 1
    sb.step_max                = STEPS
    sb.use_auto_step           = True

    sb.error_threshold         = 0.30   # default is OK; lower → more accurate, slower
    sb.solver_iterations       = ITERATIONS

    # ── Collision ─────────────────────────────────────────────────────────────
    # Self-collision prevents vertices from passing through the mesh interior
    # on hard impacts.  Ballsize is the per-vertex collision sphere radius;
    # set to about 2–5 % of mesh radius.
    sb.use_self_collision      = True
    sb.ball_size               = BLOB_RADIUS * 0.03
    sb.ball_stiff              = 0.9
    sb.ball_damp               = 0.10

    # ── Cache ─────────────────────────────────────────────────────────────────
    # Disk cache writes one .bphys file per frame to CACHE_SUBDIR.
    # Without disk cache, scrubbing to frame N re-simulates from frame 0
    # (because soft body state is path-dependent).
    pc                         = sb_mod.point_cache
    pc.use_disk_cache          = True
    pc.frame_start             = FRAME_START
    pc.frame_end               = FRAME_END
    pc.filepath                = CACHE_SUBDIR + SPHERE_NAME + "/"

    return sb_mod


# ── Floor collision ───────────────────────────────────────────────────────────

def build_floor():
    """
    Plane at Z=0 with Collision modifier.  Friction and damping on the
    collision surface control how much energy the blob loses per bounce.
    """
    bpy.ops.mesh.primitive_plane_add(size=6.0, location=(0.0, 0.0, 0.0))
    floor = bpy.context.active_object
    floor.name = FLOOR_NAME

    col = floor.modifiers.new("Collision", "COLLISION")
    col.settings.friction_factor  = 0.8   # absorbs tangential velocity
    col.settings.damping          = 0.15  # absorbs normal velocity on contact
    col.settings.cloth_friction   = 0.5

    # White matte floor material
    mat = bpy.data.materials.new("floor_mat")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = \
        (0.85, 0.85, 0.85, 1.0)
    floor.data.materials.append(mat)

    return floor


# ── Blob material ─────────────────────────────────────────────────────────────

def build_blob_material(blob):
    """
    Translucent teal material: transmission > 0 so the jelly look reads in
    EEVEE-Next.  Alpha blend mode required for screen-door transparency.
    Principled BSDF v2 (Blender 4.x+) merges Transmission and Alpha into the
    main shader — no separate 'Transmission' socket routing needed.
    """
    mat = bpy.data.materials.new("jelly_mat")
    mat.use_nodes = True
    mat.blend_method = 'BLEND'        # BLEND for proper alpha sorting
    mat.shadow_method = 'CLIP'

    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value       = (0.15, 0.75, 0.65, 1.0)  # teal
    bsdf.inputs["Roughness"].default_value        = 0.10
    bsdf.inputs["IOR"].default_value              = 1.34   # water-like
    bsdf.inputs["Transmission Weight"].default_value = 0.55  # partial jello translucency
    bsdf.inputs["Alpha"].default_value            = 0.80
    bsdf.inputs["Emission Color"].default_value   = (0.15, 0.75, 0.65, 1.0)
    bsdf.inputs["Emission Strength"].default_value = 0.10  # faint inner glow

    blob.data.materials.clear()
    blob.data.materials.append(mat)


# ── Animate the drop ─────────────────────────────────────────────────────────

def animate_drop(blob):
    """
    The blob is animated from DROP_HEIGHT down to just above the floor so
    soft body's Goal springs have a reference trajectory to follow.

    WHY animate the parent object, not drive velocity directly:
    Soft Body Goal springs pull each vertex toward its ANIMATED (goal) position.
    If the object has no animation, Goal just holds the blob at its origin —
    useful for shape deformation but not for a bounce.  Animating the object
    trajectory gives the Goal system a falling arc to track.

    The key frame sequence below creates a natural ballistic arc:
      Frame 1:  blob at DROP_HEIGHT, Z velocity ≈ 0
      Frame 18: blob just above floor, arrives at ~free-fall speed
      Frame 28: blob back above floor (bounced), damped amplitude
      Frame 50: blob nearly settled at floor contact height
    """
    blob.location.z = DROP_HEIGHT
    blob.keyframe_insert("location", frame=1)

    blob.location.z = BLOB_RADIUS * 0.9   # just resting on floor (radius above 0)
    blob.keyframe_insert("location", frame=20)

    blob.location.z = 0.95               # small bounce
    blob.keyframe_insert("location", frame=32)

    blob.location.z = BLOB_RADIUS * 0.92
    blob.keyframe_insert("location", frame=44)

    blob.location.z = BLOB_RADIUS * 0.90  # settled
    blob.keyframe_insert("location", frame=60)

    # Smooth interpolation
    for fc in blob.animation_data.action.fcurves:
        for kf in fc.keyframe_points:
            kf.interpolation = 'BEZIER'
            kf.easing = 'EASE_IN_OUT'


# ── Shape key harvest ─────────────────────────────────────────────────────────

def harvest_shape_keys(blob):
    """
    After baking, snapshot the evaluated (deformed) mesh at key frames into
    shape keys.  This makes the animation exportable as GLB morph targets.

    Workflow:
      depsgraph.update() → obj.evaluated_get(depsgraph) → new_from_object()
      → copy vertex positions back onto blob's basis mesh.

    The result is:
      'Basis'   — rest shape (frame 1)
      'squash'  — max impact compression (frame FRAME_SQUASH)
      'stretch' — max elongation during bounce (frame FRAME_STRETCH)
      'settle'  — near-rest bounce-settled (frame FRAME_SETTLE)
    """
    scene = bpy.context.scene
    depsgraph = bpy.context.evaluated_depsgraph_get()

    # Ensure shape key block exists
    if not blob.data.shape_keys:
        blob.shape_key_add(name="Basis", from_mix=False)

    def snapshot(frame_num, key_name):
        scene.frame_set(frame_num)
        depsgraph.update()
        eval_obj  = blob.evaluated_get(depsgraph)
        eval_mesh = eval_obj.to_mesh()

        sk = blob.shape_key_add(name=key_name, from_mix=False)
        for i, v in enumerate(eval_mesh.vertices):
            sk.data[i].co = blob.matrix_world.inverted() @ eval_obj.matrix_world @ v.co

        eval_obj.to_mesh_clear()

    snapshot(1,              "Basis")
    snapshot(FRAME_SQUASH,   "squash")
    snapshot(FRAME_STRETCH,  "stretch")
    snapshot(FRAME_SETTLE,   "settle")

    # Animate shape key influences for a looping bounce preview
    _animate_shape_keys(blob)


def _animate_shape_keys(blob):
    sk_data = blob.data.shape_keys.key_blocks

    def key_influence(name, frames_values):
        sk = sk_data[name]
        for frame, val in frames_values:
            sk.value = val
            sk.keyframe_insert("value", frame=frame)

    # Squash pulse
    key_influence("squash",  [(1, 0.0), (FRAME_SQUASH - 3, 0.0),
                               (FRAME_SQUASH, 1.0),
                               (FRAME_SQUASH + 4, 0.0)])

    # Stretch pulse
    key_influence("stretch", [(1, 0.0), (FRAME_STRETCH - 2, 0.0),
                               (FRAME_STRETCH, 0.85),
                               (FRAME_STRETCH + 5, 0.0)])

    # Settle hold
    key_influence("settle",  [(1, 0.0), (FRAME_SETTLE - 5, 0.0),
                               (FRAME_SETTLE, 0.6),
                               (FRAME_END, 0.6)])

    for fc in blob.data.shape_keys.animation_data.action.fcurves:
        for kf in fc.keyframe_points:
            kf.interpolation = 'BEZIER'


# ── GLB export helper ──────────────────────────────────────────────────────────

def export_glb():
    """
    Exports the shape-key blob as a GLB with morph targets.
    The soft body modifier must be DISABLED (or removed) before export so the
    glTF exporter sees the shape-key version, not the baked simulation.
    Shape keys export automatically as morph targets when export_morph=True.
    """
    blob = bpy.data.objects.get(SPHERE_NAME)
    if not blob:
        return

    # Disable soft body modifier for export snapshot
    for mod in blob.modifiers:
        if mod.type == 'SOFT_BODY':
            mod.show_render = False
            mod.show_viewport = False

    set_active(blob)
    bpy.ops.export_scene.gltf(
        filepath         = "//jelly_blob_morphs.glb",
        export_format    = 'GLB',
        export_apply     = True,
        export_morph     = True,         # include shape keys as morph targets
        export_morph_normal = False,     # skip delta normals — saves file size
        export_animations = True,
        export_frame_range = True,
        use_selection    = True,
    )

    for mod in blob.modifiers:
        if mod.type == 'SOFT_BODY':
            mod.show_render = True
            mod.show_viewport = True


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    purge()
    build_scene()

    blob  = build_blob()
    floor = build_floor()
    goal_vg = paint_goal_group(blob)

    build_blob_material(blob)
    add_soft_body(blob, goal_vg)
    animate_drop(blob)

    # ── IMPORTANT ─────────────────────────────────────────────────────────────
    # Shape key harvest requires the simulation to be BAKED first.
    # The next two lines are commented out so the script sets up the scene
    # and exits cleanly.  To harvest shape keys:
    #   1. Run this script once (sets up everything).
    #   2. In Properties → Physics → Soft Body Cache → click Bake.
    #      This takes ~2–5 min depending on machine.
    #   3. Uncomment the lines below and run the script again.
    #
    # harvest_shape_keys(blob)
    # export_glb()
    # ──────────────────────────────────────────────────────────────────────────

    # Position camera for recording
    build_scene()

    print("=== Jelly Blob scene ready ===")
    print(f"Soft Body cache will write to:  {CACHE_SUBDIR}{SPHERE_NAME}/")
    print("Next step: Properties → Physics → Soft Body Cache → Bake")
    print("After bake: uncomment harvest_shape_keys() + export_glb() and re-run")


main()
