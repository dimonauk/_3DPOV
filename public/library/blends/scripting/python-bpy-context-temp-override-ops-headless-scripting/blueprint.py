"""
bpy.context.temp_override() — Headless Operator Context Injection
Blender 5.1 · Holoflow Studio · CC0

TECHNIQUE
Every bpy.ops operator calls a poll() function before executing. That poll
reads fields from bpy.context — active_object, selected_objects, scene, etc.
In a headless background session or the Script Editor without a 3-D View in
focus, many of those fields are None or empty, causing:

    RuntimeError: Operator bpy.ops.X.y poll failed

The old workaround — passing a dict as the first positional argument:
    bpy.ops.object.convert({'active_object': ob}, target='MESH')
— was deprecated in Blender 3.2 and removed in 5.1. It now raises:

    TypeError: Passing context-dict to operator is deprecated.

The correct pattern since 3.2:
    with bpy.context.temp_override(active_object=ob, selected_objects=[ob]):
        bpy.ops.object.convert(target='MESH')

temp_override() is a context manager that patches named attributes on
bpy.context for the duration of the with-block, then restores originals
atomically — even on exception. Nested calls stack safely.

PREFERRED ALTERNATIVE: where a direct data-API path exists, use it instead
of bpy.ops. Data-API calls (bpy.data.*, ob.modifiers.*, mesh.*, etc.) are
synchronous, context-free, and safe in background mode.
"""

import bpy
import bmesh

# ── PARAMETERS ───────────────────────────────────────────────────────────────
OBJ_NAME     = "hf_ctx_demo"
EXPORT_GLB   = "//context_override_demo.glb"
EXPORT_BLEND = "//context_override_demo.blend"
BEVEL_WIDTH  = 0.04
BEVEL_SEGS   = 3
SUBDIV_LVL   = 1

# ── 0. CLEAR DEFAULT SCENE ───────────────────────────────────────────────────
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob, do_unlink=True)
for me in list(bpy.data.meshes):
    bpy.data.meshes.remove(me)

# ── 1. DATA API — ZERO CONTEXT DEPENDENCY ────────────────────────────────────
# bpy.data.meshes.new() / bpy.data.objects.new() are fully context-free.
# Link into the master collection via scene.collection (always available).
# bmesh.ops.create_cube avoids bpy.ops.mesh.primitive_cube_add() which
# requires an active 3-D View or temp_override(window=..., area=...).
me = bpy.data.meshes.new(OBJ_NAME)
ob = bpy.data.objects.new(OBJ_NAME, me)
bpy.context.scene.collection.objects.link(ob)

bm = bmesh.new()
bmesh.ops.create_cube(bm, size=1.0)
bm.to_mesh(me)
bm.free()
me.update()

# Modifiers added via data API need no context either.
bevel         = ob.modifiers.new("Bevel", "BEVEL")
bevel.width   = BEVEL_WIDTH
bevel.segments = BEVEL_SEGS
bevel.limit_method = "ANGLE"
bevel.angle_limit  = 0.523599   # 30° in radians

subdiv               = ob.modifiers.new("Subdiv", "SUBSURF")
subdiv.levels        = SUBDIV_LVL
subdiv.render_levels = SUBDIV_LVL

print(f"[holoflow] '{ob.name}' — {len(ob.modifiers)} modifiers stacked (data API, no context)")

# ── 2. temp_override — APPLY MODIFIERS ───────────────────────────────────────
# bpy.ops.object.convert(target='MESH') is the standard apply-all-modifiers
# operator. Its poll() requires:
#   ctx.active_object   — non-None, must be the object to convert
#   ctx.selected_objects — non-empty, must include active_object
#   ctx.active_object.type not in {'EMPTY', 'ARMATURE', 'LATTICE', ...}
#
# The evaluated-depsgraph alternative (ob.evaluated_get(depsgraph).data)
# gives a read-only snapshot — useful for inspecting final geometry but
# cannot replace the mutable ob.data in-place without convert().
bpy.context.view_layer.objects.active = ob
ob.select_set(True)

with bpy.context.temp_override(active_object=ob, selected_objects=[ob]):
    bpy.ops.object.convert(target="MESH")

bpy.context.view_layer.update()
print(f"[holoflow] modifiers applied — {len(ob.data.vertices)} verts in final mesh")

# ── 3. SHADE SMOOTH VIA temp_override ────────────────────────────────────────
# shade_smooth is the simplest field-requirement example: selected_objects
# non-empty is sufficient, active_object is technically optional — but always
# supply both; the requirement varies between minor versions.
with bpy.context.temp_override(active_object=ob, selected_objects=[ob]):
    bpy.ops.object.shade_smooth()
print("[holoflow] smooth shading applied")

# ── 4. NESTED OVERRIDE — RIGIDBODY ADD ───────────────────────────────────────
# rigidbody.world_add polls context.scene.rigidbody_world is None.
# rigidbody.object_add polls context.selected_objects non-empty.
# Both work headlessly with the correct temp_override fields.
# Nesting is safe: inner fields shadow outer for the inner block only.

def add_rigidbody(target_ob: bpy.types.Object) -> None:
    if bpy.context.scene.rigidbody_world is None:
        with bpy.context.temp_override(scene=bpy.context.scene):
            bpy.ops.rigidbody.world_add()
    with bpy.context.temp_override(
        active_object=target_ob, selected_objects=[target_ob]
    ):
        bpy.ops.rigidbody.object_add(type="ACTIVE")

add_rigidbody(ob)
print(f"[holoflow] rigid body: type={ob.rigid_body.type}, mass={ob.rigid_body.mass}")

# ── 5. BACKGROUND GUARD — bpy.app.background ─────────────────────────────────
# True when Blender was launched with --background / -b.  Modal operators,
# GPU-draw-based operators, and anything that opens a file dialog will crash
# in background mode; guard them so the same script runs interactively too.
if bpy.app.background:
    print("[holoflow] background mode — skipping interactive-only ops")
else:
    # Example: bpy.ops.wm.window_fullscreen_toggle() would only make sense
    # in interactive mode. Gate it here.
    pass

# ── 6. EXPORT GLB ─────────────────────────────────────────────────────────────
# export_scene.gltf in 5.1 needs no strict context field beyond a valid scene,
# but wrapping is defensive and costs nothing.
with bpy.context.temp_override(scene=bpy.context.scene):
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_GLB,
        export_format="GLB",
        export_apply=False,           # modifiers already applied above
        export_image_format="WEBP",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_yup=True,
    )

bpy.ops.wm.save_as_mainfile(filepath=EXPORT_BLEND)
print(f"[holoflow] GLB  → {EXPORT_GLB}")
print(f"[holoflow] .blend → {EXPORT_BLEND}")

# ── 7. FIELD REFERENCE ────────────────────────────────────────────────────────
# Quick lookup: which fields satisfy which common poll() requirements.
#
# active_object        — most object-level ops (convert, shade_smooth, etc.)
# selected_objects     — ops that iterate selection (shade_smooth, join, etc.)
# scene                — scene-level ops (rigidbody.world_add, export, etc.)
# view_layer           — view-layer ops (collection visibility, etc.)
# area, space_data,
# region               — space-specific ops (node.select_all in NODE_EDITOR,
#                        image.reload in IMAGE_EDITOR). Rare in headless scripts.
#                        Build a fake area via bpy.context.window.screen.areas
#                        or by context.window_manager.windows[0] if needed.
# edit_object          — edit-mode ops; pair with mode_set override.
#
# For ops that genuinely cannot be driven headlessly (modal ops, GPU draw):
# use the data API or pre-bake with frame_set() + view_layer.update().
print("[holoflow] blueprint complete")
