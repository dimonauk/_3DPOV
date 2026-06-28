import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every Blender studio eventually reaches the moment where export is too
        slow to run on every save, so someone writes a polling loop — a
        <code>frame_change_post</code> handler that checks a flag sixty times
        per second, or a modal operator that spins waiting for a property to
        flip. Both are wrong. The correct primitive is{" "}
        <code>bpy.msgbus</code>: Blender&apos;s publish-subscribe system for
        RNA property changes. Subscribe once; your callback fires synchronously
        the instant a property mutates, and never otherwise.
      </p>

      <p>
        The comparison with{" "}
        <Link
          href="/tutorials/blender-tutorial-python-app-handler-frame-change-depsgraph"
          className={lk}
        >
          frame_change_post
        </Link>{" "}
        is instructive. A handler registered there fires on every timeline step
        — 60 calls per second during playback, whether or not anything relevant
        changed. <code>bpy.msgbus</code> fires at most once per user edit. For
        heavy operations — GLB export, pixel-buffer bake, mesh analysis — that
        difference matters. The pipeline built here marks objects for re-export
        exactly when their <code>holoflow.facet</code> flag changes, then
        flushes only dirty objects on the next explicit export call.
      </p>

      <p>
        <strong>Two subscription strategies</strong> exist and both are
        demonstrated. Strategy A is a class-level key:{" "}
        <code>(HoloflowObjectProps, &quot;facet&quot;)</code>. This fires for
        any object whose <code>facet</code> property changes, but the callback
        receives no object reference — you must inspect{" "}
        <code>bpy.context.active_object</code> to infer which one changed.
        Strategy B is a per-object key from{" "}
        <code>obj.holoflow.path_resolve(&quot;facet&quot;, False)</code>. This
        watches a specific object&apos;s property; the object is passed via{" "}
        <code>args=</code>, so the callback knows exactly what changed. Strategy
        B costs one <code>subscribe_rna()</code> call per object and requires
        re-registration after file load. Both strategies are governed by the
        same <code>OWNER_TOKEN</code> sentinel, which means{" "}
        <code>clear_by_owner(OWNER_TOKEN)</code> cleans up everything in one
        call.
      </p>

      <p>
        The <code>PropertyGroup</code> approach is essential here. Raw
        IDProperties — <code>obj[&quot;key&quot;] = value</code> — store data
        but do not register RNA descriptors. Without an RNA descriptor, there is
        no class-level <code>(type, &quot;prop_name&quot;)</code> key to
        subscribe to; you must use <code>path_resolve</code> per instance and
        lose the convenience of class-level broadcast. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-addon-custom-panel-property-group"
          className={lk}
        >
          Custom Panel + PropertyGroup tutorial
        </Link>{" "}
        covers the full registration pattern; here we use the same{" "}
        <code>bpy.utils.register_class()</code> /{" "}
        <code>bpy.types.Object.holoflow = PointerProperty(...)</code> idiom.
      </p>

      <p>
        Persistence across file loads requires two cooperating mechanisms. The{" "}
        <code>options=&#123;&quot;PERSISTENT&quot;&#125;</code> flag on a
        class-level subscription tells Blender to keep that subscription across{" "}
        <code>bpy.ops.wm.open_mainfile()</code>. Per-object subscriptions
        cannot be persistent in the same way because the closed-over object
        references belong to the previous file&apos;s data blocks. The correct
        pattern is a <code>@bpy.app.handlers.persistent</code> handler on{" "}
        <code>load_post</code> that calls <code>clear_by_owner()</code> then
        re-registers everything against the new file&apos;s objects. Compare
        with the same <code>@persistent</code> pattern in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-app-handler-frame-change-depsgraph"
          className={lk}
        >
          frame_change_post tutorial
        </Link>
        , where the decorator is needed to survive file load; the same
        principle applies here.
      </p>

      <p>
        The export function uses <code>bpy.context.temp_override()</code>
        (Blender 4.0+) rather than the deprecated context-dictionary form.
        <code>temp_override</code> supplies a fake context that satisfies
        context-sensitive operators — specifically{" "}
        <code>export_scene.gltf</code> — without requiring a real{" "}
        <code>VIEW_3D</code> area. This is the correct headless-export pattern
        and the same approach used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          Batch GLB Exporter tutorial
        </Link>
        . The export settings follow Holoflow conventions: <code>+Y up</code>,{" "}
        <code>export_apply=True</code>, Draco level 6, WebP textures. Objects
        whose <code>holoflow.dirty</code> flag is <code>False</code> are
        skipped entirely.
      </p>

      <p>
        One diagnostic tool surprises most users:{" "}
        <code>bpy.msgbus.publish_rna(key=...)</code>. It fires all subscribers
        for a key without mutating the property — call it from the Python
        Console to verify the subscription chain is intact before wiring real
        UI. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-shape-key-driver-rig-vrm-facial"
          className={lk}
        >
          Shape Key Driver Rig tutorial
        </Link>{" "}
        shows the complementary pattern: RNA drivers propagate property changes
        through the dependency graph rather than Python callbacks — preferable
        when the transformation is expressible as a curve or expression.
        Outside sources:{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.msgbus.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.msgbus API reference
        </a>{" "}
        (Blender Foundation, CC-BY-SA 4.0) and the{" "}
        <a
          href="https://developer.blender.org/docs/features/message_bus/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Message Bus developer notes
        </a>{" "}
        (Blender Foundation, CC-BY-SA 4.0); sibling reference:{" "}
        <a
          href="https://github.com/njanakiev/blender-scripting"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          njanakiev/blender-scripting
        </a>{" "}
        (MIT, Nicolas Janakiev).
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-msgbus-reactive-property-subscriptions",
  title:
    "Python: bpy.msgbus — Reactive Property Subscriptions & Dirty-Export Pipeline (Blender 5.1)",
  date: "2026-06-28",
  kind: "tutorial",
  excerpt:
    "Subscribe to RNA property changes with zero per-frame overhead using bpy.msgbus. Build a dirty-export pipeline that re-GLBs only the objects whose holoflow.facet flag has changed since the last export.",
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/scripting/python-msgbus-reactive-property-subscriptions/",
    time: "one focused hour",
    difficulty: "advanced",
    software: [{ name: "Blender", version: "5.1", url: "https://www.blender.org/download/", cost: "free" }],
    prerequisites: [
      "Comfortable reading bpy Python scripts",
      "Understands PropertyGroup and bpy.props",
      "Has run a basic frame_change_post handler",
    ],
    steps: [
      {
        title: "Register the PropertyGroup",
        body: `Define HoloflowObjectProps with two BoolProperty fields and attach it to bpy.types.Object:

  class HoloflowObjectProps(bpy.types.PropertyGroup):
      dirty: BoolProperty(name="Export Dirty", default=False)
      facet: BoolProperty(name="Holoflow Facet", default=False)

  bpy.utils.register_class(HoloflowObjectProps)
  bpy.types.Object.holoflow = PointerProperty(type=HoloflowObjectProps)

PropertyGroup registration gives each field an RNA descriptor — prerequisite for class-level msgbus subscription via (Type, "prop_name"). Without it, only path_resolve per-instance subscriptions are possible. Guard registration with try/except RuntimeError to allow re-running the script.`,
      },
      {
        title: "Subscribe: class-level and per-object",
        body: `Register two distinct subscription types:

Strategy A — class-level (fires for ANY object):
  bpy.msgbus.subscribe_rna(
      key=(HoloflowObjectProps, "facet"),
      owner=OWNER_TOKEN,
      args=(),
      notify=_on_any_facet_change,
      options={"PERSISTENT"},
  )

Strategy B — per-object (fires for ONE object, passes it via args):
  rna_key = obj.holoflow.path_resolve("facet", False)
  bpy.msgbus.subscribe_rna(
      key=rna_key,
      owner=OWNER_TOKEN,
      args=(obj,),
      notify=lambda o: _mark_dirty(o),
  )

OWNER_TOKEN is a module-level object() used as a group key. bpy.msgbus.clear_by_owner(OWNER_TOKEN) removes all subscriptions that share this owner in one call — no per-subscription tracking needed.`,
      },
      {
        title: "Write the dirty-export flush",
        body: `Iterate bpy.data.objects, skip non-dirty, export, clear:

  for obj in bpy.data.objects:
      props = getattr(obj, "holoflow", None)
      if props is None or not props.dirty:
          continue
      with bpy.context.temp_override(
          active_object=obj,
          selected_objects=[obj],
      ):
          bpy.ops.export_scene.gltf(
              filepath=f"//output/{obj.name}.glb",
              use_selection=True,
              export_yup=True,
              export_apply=True,
              export_draco_mesh_compression_enable=True,
              export_draco_mesh_compression_level=6,
          )
      props.dirty = False

temp_override() replaces the deprecated context-dict form. It does not require a real VIEW_3D area; Blender resolves the active window from the registered screen, which exists even in the Scripting workspace.`,
      },
      {
        title: "Persist across file loads",
        body: `Per-object subscriptions close over old object references after load_post. Fix with:

  @bpy.app.handlers.persistent
  def _on_load_post(_):
      _register_property_group()
      register_subscriptions()   # clear_by_owner then re-subscribe

  bpy.app.handlers.load_post.append(_on_load_post)

Class-level PERSISTENT subscriptions technically survive load, but clear_by_owner + re-register is the safest blanket approach. @persistent is critical — without it Blender silently drops the handler on any file load.`,
      },
      {
        title: "Test with publish_rna",
        body: `Verify the subscription chain without touching the UI:

  bpy.msgbus.publish_rna(key=(HoloflowObjectProps, "facet"))

This fires all subscribers for the key without mutating any property. In the Blender System Console (Window > Toggle System Console) you should see the callback print lines appear. Use this before wiring the pipeline to real user panels to confirm the plumbing works.`,
      },
    ],
    troubleshooting: [
      {
        symptom: "Callback never fires after toggling facet in the N-panel",
        cause:
          "The N-panel Custom Properties section edits raw IDProperties (obj['facet']), not the PropertyGroup field (obj.holoflow.facet) — different RNA paths.",
        fix: "Write obj.holoflow.facet = True from the Python Console, or add a bpy.types.Panel that binds to the PropertyGroup field. The subscription watches the RNA property, not the raw IDProperty.",
      },
      {
        symptom: "TypeError: already registered on second script run",
        cause: "bpy.utils.register_class() raises if the class is already registered.",
        fix: "Guard with: try: bpy.utils.unregister_class(HoloflowObjectProps) / except RuntimeError: pass — then register fresh.",
      },
      {
        symptom: "Subscriptions stop firing after File > Open",
        cause: "Per-object subscriptions close over old object references that become invalid after load.",
        fix: "Attach a @bpy.app.handlers.persistent load_post handler that calls clear_by_owner then register_subscriptions. The @persistent decorator is required — without it the handler is silently dropped.",
      },
      {
        symptom: "export_scene.gltf raises context error",
        cause: "Deprecated context-dict override requires a specific area type.",
        fix: "Use bpy.context.temp_override(active_object=obj, selected_objects=[obj]) — resolves the window from the active screen without a manually constructed area.",
      },
    ],
  },
  base,
);
