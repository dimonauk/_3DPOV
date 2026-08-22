import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every Blender add-on that surfaces controls in the 3D Viewport is built on
        three types: <code>PropertyGroup</code> for persistent data,{" "}
        <code>bpy.types.Panel</code> for the UI layout, and{" "}
        <code>bpy.types.Operator</code> for actions. Understanding the wiring between
        them — how a property stored on <code>bpy.types.Scene</code> flows through
        a panel into an operator&rsquo;s execute method — is the foundation of every
        production add-on, including the <code>holoflow_webxr_exporter</code> that
        powers Holoflow Studio&rsquo;s asset pipeline. This tutorial builds that
        foundation end-to-end, producing a working <strong>&ldquo;HoloFlow&rdquo; N-Panel
        tab</strong> with four operators and two nested panels.
      </p>

      <h2>Why the N-Panel and not a menu</h2>
      <p>
        The N-Panel (toggled with N in the 3D Viewport) stays visible while you
        work. A File menu entry is modal — it pulls you away from the viewport,
        you choose an option, the dialog closes, and you&rsquo;re back at the
        scene. The N-Panel is additive: the Export Scale slider, the
        facet-tag toggle, and the Export button are all reachable without
        leaving the modelling context. For iterative export-prep — apply
        transforms, check the facet flag, export, compare in the browser,
        return, tweak — that difference in friction compounds across a session.
      </p>

      <h2>bl_idname naming rules</h2>
      <p>
        Blender&rsquo;s class registry uses a strict naming convention that doubles as
        a type hint:
      </p>
      <pre>{`# Operators:  CATEGORY_OT_verb_noun
HOLOFLOW_OT_apply_transforms
HOLOFLOW_OT_tag_facet

# Panels:     CATEGORY_PT_descriptive_name
HOLOFLOW_PT_export_prep
HOLOFLOW_PT_object_props`}</pre>
      <p>
        The prefix segment before <code>_OT_</code> or <code>_PT_</code> must be
        all uppercase and unique to your add-on. Blender uses the full idname as a
        unique key in its global registry — two add-ons with the same{" "}
        <code>bl_idname</code> will conflict and one will silently win.{" "}
        <code>HOLOFLOW_</code> is Holoflow Studio&rsquo;s reserved prefix.
      </p>

      <h2>PropertyGroup: annotations, not attributes</h2>
      <p>
        This is the most common beginner mistake. In Blender 4.x and 5.x, RNA
        properties in a <code>PropertyGroup</code> <strong>must</strong> be
        declared as Python annotations (PEP 526 syntax), not as plain class
        attributes:
      </p>
      <pre>{`# CORRECT — Blender's RNA introspection reads __annotations__
class HoloflowSceneProps(PropertyGroup):
    export_scale: FloatProperty(default=1.0, min=0.001, max=100.0)

# WRONG — silently ignored; the property never appears in the UI
class HoloflowSceneProps(PropertyGroup):
    export_scale = FloatProperty(default=1.0)  # ← plain assignment, not annotation`}</pre>
      <p>
        Blender&rsquo;s C layer reads <code>cls.__annotations__</code> at
        registration time to build the DNA struct. Plain assignments write to
        <code>cls.__dict__</code> and are invisible to that introspection path.
        You will get no error — the property is just absent from the panel.
      </p>

      <h2>PointerProperty and registration order</h2>
      <p>
        Attaching a <code>PropertyGroup</code> to a built-in type requires two
        steps that must happen in the correct order:
      </p>
      <pre>{`def register():
    # 1. Register the group class first
    bpy.utils.register_class(HoloflowSceneProps)
    # 2. Attach it via PointerProperty — only valid after step 1
    bpy.types.Scene.hf_scene = PointerProperty(type=HoloflowSceneProps)

def unregister():
    # Reverse: delete the PointerProperty BEFORE unregistering the class
    del bpy.types.Scene.hf_scene         # ← first
    bpy.utils.unregister_class(HoloflowSceneProps)   # ← then`}</pre>
      <p>
        Unregistering the class first causes a <code>RuntimeError</code> when
        Blender tries to resolve the now-dead type pointer on the scene DNA.
        Always delete PointerProperties before unregistering the group.
      </p>

      <h2>Panel draw() and UILayout</h2>
      <p>
        <code>draw(self, context)</code> receives a{" "}
        <code>bpy.types.Context</code> object every time Blender redraws the
        panel — which happens on every mouse move over the sidebar. Keep draw()
        fast: no filesystem I/O, no heavy computation. Reading a{" "}
        <code>PointerProperty</code> from context is essentially free.
      </p>
      <pre>{`def draw(self, context):
    layout = self.layout
    props = context.scene.hf_scene          # resolves PointerProperty

    layout.use_property_split = True        # labels left, widgets right
    layout.use_property_decorate = False    # hides keyframe-animation dot

    col = layout.column(align=True)
    col.prop(props, "output_dir")
    col.prop(props, "draco_level")

    row = layout.row()
    row.scale_y = 1.4                       # taller = more prominent
    row.operator("holoflow.export_glb", icon="EXPORT")`}</pre>
      <p>
        <code>layout.use_property_split = True</code> is the standard Blender
        style since 2.8: labels anchor left, input widgets anchor right, and
        long labels wrap cleanly. Without it, the label and widget sit on one
        line and the label can be truncated.
      </p>

      <h2>Sub-panels and bl_parent_id</h2>
      <p>
        A sub-panel declares <code>bl_parent_id</code> pointing to its parent
        panel&rsquo;s <code>bl_idname</code>. Blender nests it visually inside the
        parent and adds a collapse arrow. <code>bl_options = &#123;&quot;DEFAULT_CLOSED&quot;&#125;</code>{" "}
        starts it collapsed so the UI isn&rsquo;t overwhelming on first open:
      </p>
      <pre>{`class HOLOFLOW_PT_object_props(Panel):
    bl_idname    = "HOLOFLOW_PT_object_props"
    bl_label     = "Active Object"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category  = "HoloFlow"
    bl_parent_id = "HOLOFLOW_PT_export_prep"   # ← nesting key
    bl_options   = {"DEFAULT_CLOSED"}`}</pre>
      <p>
        Both panels share the same <code>bl_category</code> — they live in the
        same &ldquo;HoloFlow&rdquo; tab but the sub-panel only renders while the parent is
        expanded.
      </p>

      <h2>poll(): the operator enable/disable gate</h2>
      <p>
        Every operator should have a <code>poll()</code> classmethod. It runs
        before <code>execute()</code> and before the button is drawn — if it
        returns <code>False</code>, Blender greys the button and skips the click.
        No try/except required in <code>execute()</code> for context errors that
        poll should have caught:
      </p>
      <pre>{`@classmethod
def poll(cls, context):
    # Only meaningful when at least one mesh is selected in Object Mode.
    # Returning False greys the button; no RuntimeError on accidental click.
    return (
        context.mode == "OBJECT"
        and any(o.type == "MESH" for o in context.selected_objects)
    )`}</pre>
      <p>
        <code>poll()</code> must be a <code>@classmethod</code> — it is called
        on the class, not an instance, because no instance exists yet when the
        button is drawn. The <code>cls</code> argument is the operator class
        itself; you can use it to reach class-level constants but not instance
        state.
      </p>

      <h2>temp_override() for context-sensitive operators</h2>
      <p>
        <code>bpy.ops.object.transform_apply()</code> always acts on{" "}
        <code>context.active_object</code>. To apply transforms on a batch of
        objects without changing the real context permanently, use{" "}
        <code>context.temp_override()</code>:
      </p>
      <pre>{`for obj in meshes:
    with context.temp_override(active_object=obj, selected_objects=[obj]):
        bpy.ops.object.transform_apply(
            location=True, rotation=True, scale=True
        )`}</pre>
      <p>
        Inside the <code>with</code> block, <code>bpy.context.active_object</code>{" "}
        is <code>obj</code>; outside it, the original active object is restored.
        This is the pattern used throughout the{" "}
        <Link href="/tutorials/blender-tutorial-python-context-temp-override-mesh-repair-pipeline" className={lk}>
          headless mesh repair pipeline
        </Link>
        {" "}— and anywhere else you need an operator to act on a specific object
        without side effects on the rest of the scene.
      </p>

      <h2>Custom properties with colons</h2>
      <p>
        The <code>holoflow:facet</code> custom property uses a colon in its key,
        which is valid JSON but not valid Python identifier syntax. You cannot
        write <code>obj.holoflow:facet = 1</code>. Use dict-style assignment:
      </p>
      <pre>{`obj["holoflow:facet"] = 1   # set
del obj["holoflow:facet"]   # clear
"holoflow:facet" in obj     # check`}</pre>
      <p>
        The <code>holoflow:facet</code> key is read by the{" "}
        <code>holoflow_webxr_exporter</code> add-on during GLB export to apply
        flat-shading on a per-object basis — see{" "}
        <code>tools/blender-addon/holoflow_webxr_exporter</code>. The{" "}
        <code>HoloflowObjectProps.facet_flag</code> boolean mirrors this for the
        panel checkbox UI; the operator keeps them in sync by writing both.
      </p>

      <h2>Setting operator properties from the UI</h2>
      <p>
        Operator properties (defined in the operator&rsquo;s{" "}
        <code>__annotations__</code>) can be set by the caller via the reference
        returned by <code>layout.operator()</code>:
      </p>
      <pre>{`row = layout.row(align=True)
op_set = row.operator("holoflow.tag_facet", text="Tag Facet")
op_set.enable = True    # sets HOLOFLOW_OT_tag_facet.enable before execute()

op_clr = row.operator("holoflow.tag_facet", text="Clear")
op_clr.enable = False`}</pre>
      <p>
        This is how a single operator class can power two visually distinct
        buttons with different default parameters. The alternative — two
        separate operator classes with hardcoded defaults — clutters the
        registry and duplicates the logic.
      </p>

      <h2>Export GLB with studio settings</h2>
      <p>
        The <code>HOLOFLOW_OT_export_glb</code> operator reads the scene&rsquo;s{" "}
        <code>hf_scene</code> property group and fires{" "}
        <code>bpy.ops.export_scene.gltf()</code> with the studio-standard flags.
        Three flags are non-obvious:
      </p>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath=out_path,
    use_selection=True,
    export_apply=True,       # bakes modifier stack; without this, base mesh exports
    export_yup=True,         # WebXR requires +Y up; Blender's default is +Z up
    export_draco_mesh_compression_enable=props.draco_level > 0,
    export_draco_mesh_compression_level=props.draco_level,
    export_image_format=props.texture_format,
    export_image_quality=90,
)`}</pre>
      <p>
        <code>export_apply=True</code> is the most commonly forgotten flag — without
        it, the Subdivision Surface, Bevel, and Displace modifiers are all absent
        from the exported GLB. The base unsubdivided mesh is what you get, which
        is rarely production-ready. <code>export_yup=True</code> rotates the
        coordinate system at the GLB level so that WebXR runtimes (which use
        +Y up) see the model upright without applying a -90° X rotation in the
        viewer layer.
      </p>

      <h2>Failure modes and troubleshooting</h2>

      <h3>Panel tab does not appear after running the script</h3>
      <p>
        The most common cause: an error in <code>register()</code> aborted the
        loop partway through. Check the System Console (Window → Toggle System
        Console on Windows, or the terminal you launched Blender from). Any
        <code>RuntimeError: Error registering class ...</code> message points to
        the problem class. Also check that you didn&rsquo;t leave a duplicate{" "}
        <code>bl_idname</code> from a previous partial registration — if the
        script crashed mid-way, some classes may already be registered when you
        re-run it. The <code>try: unregister() / except: pass</code> guard at the
        bottom of <code>if __name__ == &quot;__main__&quot;:</code> handles this.
      </p>

      <h3>AttributeError: 'Scene' object has no attribute 'hf_scene'</h3>
      <p>
        The script ran but <code>register()</code> was never called, or it raised
        before the <code>PointerProperty</code> line. Open the System Console and
        look for the registration error. Also verify you are using annotation
        syntax in <code>HoloflowSceneProps</code> — a plain attribute assignment
        registers successfully but the property silently never attaches.
      </p>

      <h3>Export silently produces no file</h3>
      <p>
        Check <code>props.output_dir</code> — if the blend file has not been
        saved, <code>//</code> (blend-relative) resolves to the current working
        directory, which may be <code>/</code> on Linux or the Blender install
        directory on Windows. Either save the blend first or use an absolute path.
      </p>

      <h3>holoflow:facet is missing from the exported GLB extras</h3>
      <p>
        Custom properties are exported as glTF <code>extras</code> only when the
        GLB exporter&rsquo;s <strong>Extras</strong> toggle is enabled
        (Properties → Scene → glTF Export → Include → Custom Properties).
        The <code>holoflow_webxr_exporter</code> enables this automatically, but{" "}
        a vanilla <code>export_scene.gltf()</code> call may not. Pass{" "}
        <code>export_extras=True</code> to the operator to ensure custom
        properties survive into the binary chunk.
      </p>

      <h2>Further reading</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-python-context-temp-override-mesh-repair-pipeline" className={lk}>
            Python bpy.context.temp_override() — Headless Mesh Repair Pipeline
          </Link>{" "}
          — deep dive on the temp_override pattern used in{" "}
          <code>HOLOFLOW_OT_apply_transforms</code> here; covers edge cases
          around view-layer dependency graphs and operator polling.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-cycles-batch-bake-normal-ao-emission-webxr" className={lk}>
            Python Cycles Batch Bake Pipeline
          </Link>{" "}
          — another pipeline script that makes a natural companion to the
          export operator here; combine the two to produce baked-and-exported
          GLBs from a single N-Panel click.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-library-link-append-blend-files" className={lk}>
            Python bpy.data.libraries.load — Library Linking & Override
          </Link>{" "}
          — extending the add-on built here: instead of exporting from the
          working file, use library-link to pull in a prop from an asset
          library and export it immediately.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr" className={lk}>
            Principled BSDF v2 → glTF PBR for WebXR
          </Link>{" "}
          — the glTF export flags used in <code>HOLOFLOW_OT_export_glb</code>{" "}
          interact directly with which Principled BSDF sockets are preserved;
          this tutorial explains the mapping.
        </li>
        <li>
          <strong>Robert Guetzkow</strong> —{" "}
          <em>blender-python-examples</em> (MIT){" "}
          <a
            href="https://github.com/robertguetzkow/blender-python-examples"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/robertguetzkow/blender-python-examples
          </a>{" "}
          — the canonical open-source add-on reference. The{" "}
          <code>custom_operator/</code>, <code>property_group/</code>, and{" "}
          <code>sidebar_panel/</code> sub-folders each demonstrate the patterns
          this tutorial assembles into a single production add-on. Sibling
          examples cover modal operators, file selectors, and preferences panels
          — useful next steps after this tutorial.
        </li>
        <li>
          <strong>Blender Foundation</strong> —{" "}
          <em>bpy.types.Panel + bpy.types.Operator API Reference</em> (CC-BY-SA 4.0){" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.Panel.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            docs.blender.org/api/current/bpy.types.Panel.html
          </a>{" "}
          — canonical parameter documentation for every{" "}
          <code>bl_*</code> class variable and every UILayout method used in
          this tutorial; the <code>Operator</code> return set values
          (<code>&#123;'FINISHED'&#125;</code>, <code>&#123;'CANCELLED'&#125;</code>,{" "}
          <code>&#123;'PASS_THROUGH'&#125;</code>, <code>&#123;'RUNNING_MODAL'&#125;</code>) are
          also documented there — each has a distinct effect on Blender&rsquo;s
          undo stack and event loop.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-custom-panel-operator-n-panel-sidebar",
  title:
    "Python bpy.types.Panel + Operator — Custom N-Panel Sidebar Add-on for WebXR Export Prep (Blender 5.1)",
  date: "2026-07-02",
  kind: "tutorial",
  excerpt:
    "PropertyGroup annotations, not plain attributes — that is the mistake that trips every add-on beginner. This tutorial builds a complete HoloFlow N-Panel tab with four operators (apply transforms, tag holoflow:facet, batch rename, export GLB) and two nested panels, teaching the bl_idname convention, poll() gating, temp_override() for context-sensitive ops, and PointerProperty deletion order in unregister().",
  tags: [
    "blender",
    "python",
    "scripting",
    "add-on",
    "panel",
    "operator",
    "n-panel",
    "sidebar",
    "bpy.types.Panel",
    "bpy.types.Operator",
    "PropertyGroup",
    "PointerProperty",
    "register",
    "webxr",
    "export",
    "holoflow",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-custom-panel-operator-n-panel-sidebar",
    time: "one to two hours",
    difficulty: "intermediate",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable writing bpy Python scripts from the Scripting workspace",
      "Understands bpy.data, bpy.context, and bpy.ops — knows how to select objects and run operators in Python",
      "Knows how to install an add-on via Preferences → Add-ons → Install",
      "Familiar with Blender's N-Panel sidebar (press N to toggle)",
    ],
  },
  base,
);

export const blenderTutorialPythonCustomPanelOperatorNPanelSidebarEntry =
  entry;
