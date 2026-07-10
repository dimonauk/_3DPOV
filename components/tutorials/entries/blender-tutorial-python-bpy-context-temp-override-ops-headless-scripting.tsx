import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every <code>bpy.ops</code> operator calls a <code>poll()</code>{" "}
        function before executing. That poll reads fields — such as{" "}
        <code>active_object</code>, <code>selected_objects</code>, and{" "}
        <code>scene</code> — from <code>bpy.context</code>. In a headless
        background session, or in the Script Editor when no 3-D View holds
        focus, those fields are often <code>None</code> or empty, and the
        operator raises <code>RuntimeError: poll failed</code>. The old
        workaround of passing a dict as the first positional argument to{" "}
        <code>bpy.ops.*(&#123;...&#125;)</code> was deprecated in Blender 3.2
        and removed in 5.1 — it now raises a <code>TypeError</code>
        immediately, before the operator even runs.
      </p>
      <p>
        The correct 5.1 pattern is{" "}
        <code>bpy.context.temp_override(**fields)</code>: a context manager
        that temporarily patches named attributes on <code>bpy.context</code>{" "}
        for the duration of a <code>with</code>-block, then restores originals
        atomically — even on exception. Nested calls stack correctly; inner
        fields shadow outer ones only within the inner block. The pattern
        underpins every headless operator call in this library, from the rigid
        body scenes in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-rigid-body-physics-bake-trajectory-webxr"
          className={lk}
        >
          rigid body physics tutorial
        </Link>{" "}
        to the collection batch export in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-collection-link-visibility-override-batch-glb-webxr"
          className={lk}
        >
          collection visibility tutorial
        </Link>
        .
      </p>
      <p>
        The preferred alternative is to avoid <code>bpy.ops</code> entirely
        where a direct data-API path exists. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-modifier-stack-pre-export-apply"
          className={lk}
        >
          modifier stack tutorial
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export"
          className={lk}
        >
          depsgraph evaluated geometry tutorial
        </Link>{" "}
        both show patterns that create and read mesh data without touching{" "}
        <code>bpy.ops</code>. Reserve <code>temp_override</code> for operators
        that have no data-API equivalent — <code>convert</code>,{" "}
        <code>shade_smooth</code>, <code>rigidbody.object_add</code>, and{" "}
        <code>export_scene.gltf</code>. Outside references:{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.context.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.context API (CC-BY-SA 4.0)
        </a>
        ;{" "}
        <a
          href="https://wiki.blender.org/wiki/Reference/Release_Notes/3.2/Python_API"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender 3.2 Python API release notes — temp_override introduction (CC-BY-SA 4.0)
        </a>
        ; Nikolai Janakiev&apos;s{" "}
        <a
          href="https://github.com/njanakiev/blender-scripting"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          blender-scripting (MIT)
        </a>
        .
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    supplies: { materials: [], tools: [] },
    steps: [
      {
        title: "See the old dict-override fail, then clear the scene",
        body: `"""
DEPRECATED (3.2) / REMOVED (5.1):
  bpy.ops.object.shade_smooth({'active_object': ob})
  → TypeError: Passing context-dict to operator is deprecated.

The dict was a CPython shim over Blender's C context system.
It was racy, untype-checked, and impossible to validate — removed outright.
"""
import bpy

# Show the error in a try/except so the script doesn't halt
ob_test = bpy.context.active_object
if ob_test:
    try:
        bpy.ops.object.shade_smooth({"active_object": ob_test})
    except TypeError as e:
        print(f"[holoflow] expected in 5.1: {e}")

# Clear scene for a clean start
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob, do_unlink=True)
for me in list(bpy.data.meshes):
    bpy.data.meshes.remove(me)`,
      },
      {
        title: "Build subject geometry with the data API — no context needed",
        body: `"""
Data-API calls (bpy.data.*, ob.modifiers.*, mesh.*, bmesh.ops.*) are
synchronous and context-free.  They work identically in a headless session
and in the interactive Script Editor.  Using them instead of bpy.ops.*
eliminates context dependency entirely for creation and configuration.

bmesh.ops.create_cube avoids bpy.ops.mesh.primitive_cube_add(), which
requires an active 3-D View.  The modifier stack is built purely via
ob.modifiers.new() — also context-free.
"""
import bpy, bmesh

OBJ_NAME   = "hf_ctx_demo"
BEVEL_WIDTH = 0.04
BEVEL_SEGS  = 3

me = bpy.data.meshes.new(OBJ_NAME)
ob = bpy.data.objects.new(OBJ_NAME, me)
bpy.context.scene.collection.objects.link(ob)

bm = bmesh.new()
bmesh.ops.create_cube(bm, size=1.0)
bm.to_mesh(me); bm.free(); me.update()

bevel = ob.modifiers.new("Bevel", "BEVEL")
bevel.width = BEVEL_WIDTH; bevel.segments = BEVEL_SEGS
bevel.limit_method = "ANGLE"; bevel.angle_limit = 0.523599

subdiv = ob.modifiers.new("Subdiv", "SUBSURF")
subdiv.levels = subdiv.render_levels = 1

print(f"[holoflow] '{ob.name}' — {len(ob.modifiers)} modifiers, no context used")`,
      },
      {
        title: "Apply modifiers and shade smooth with temp_override",
        body: `"""
bpy.ops.object.convert(target='MESH') bakes all modifiers into ob.data.
Its poll() requires active_object (non-None) and selected_objects (non-empty).
Always supply both — the exact subset that is strictly required varies between
minor patch versions; over-specifying is safe, under-specifying is fragile.

WHY not use the depsgraph evaluated snapshot instead?
ob.evaluated_get(depsgraph).data is read-only — you cannot replace the
mutable ob.data in-place from it.  For a writable baked mesh you must
call convert() or iterate evaluated geometry into a new mesh manually.

After the operator, call view_layer.update() to flush the depsgraph so
that downstream matrix_world reads and exported vertex positions are current.
"""
import bpy

# Set selection state on the actual context (safe; no operator call yet)
bpy.context.view_layer.objects.active = ob
ob.select_set(True)

with bpy.context.temp_override(active_object=ob, selected_objects=[ob]):
    bpy.ops.object.convert(target="MESH")

bpy.context.view_layer.update()
print(f"[holoflow] {len(ob.data.vertices)} verts after apply")

with bpy.context.temp_override(active_object=ob, selected_objects=[ob]):
    bpy.ops.object.shade_smooth()
print("[holoflow] smooth shading applied")`,
      },
      {
        title: "Nested overrides, rigidbody.object_add, background guard & GLB export",
        body: `"""
Nested temp_override calls stack safely.  The inner block's fields shadow
the outer block's fields only for its own duration; the outer fields
re-emerge when the inner block exits.

rigidbody.world_add polls context.scene.rigidbody_world is None.
rigidbody.object_add polls context.selected_objects non-empty.
Each needs a separate field combination — nested overrides handle this cleanly.

bpy.app.background is True when Blender was launched with --background.
Gate modal and display-dependent operators behind this flag so that the
same script runs safely in both interactive and headless sessions.
"""
import bpy

def add_rigidbody(target_ob):
    if bpy.context.scene.rigidbody_world is None:
        with bpy.context.temp_override(scene=bpy.context.scene):
            bpy.ops.rigidbody.world_add()
    with bpy.context.temp_override(
        active_object=target_ob, selected_objects=[target_ob]
    ):
        bpy.ops.rigidbody.object_add(type="ACTIVE")

add_rigidbody(ob)
print(f"[holoflow] rb type={ob.rigid_body.type}")

if bpy.app.background:
    print("[holoflow] headless — skipping display-only ops")

with bpy.context.temp_override(scene=bpy.context.scene):
    bpy.ops.export_scene.gltf(
        filepath="//context_override_demo.glb",
        export_format="GLB", export_apply=False,
        export_image_format="WEBP",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_yup=True,
    )
bpy.ops.wm.save_as_mainfile(filepath="//context_override_demo.blend")
print("[holoflow] export + save complete")`,
      },
    ],
  },
  {
    slug: "python-bpy-context-temp-override-ops-headless-scripting",
    title:
      "Python bpy.context.temp_override() — Headless Operator Context Injection: Replacing dict-overrides, ViewLayer Focus & Depsgraph Flush (Blender 5.1)",
    description:
      "Fix the TypeError raised by the removed dict-override pattern and drive bpy.ops reliably in headless scripts using the 5.1 temp_override() context manager.",
    image: null,
    body: <Body />,
    tags: ["blender", "python", "scripting", "headless", "webxr"],
  }
);
