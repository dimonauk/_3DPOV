import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function PythonIdPropertiesUiBody() {
  return (
    <>
      <p>
        Every Blender ID block — Object, Armature, Mesh, Material, Scene — carries
        an open key/value store accessible as <code>obj[&quot;key&quot;] = value</code>.
        In Blender 3.3+, <code>id_properties_ui(&quot;key&quot;)</code> returns an{" "}
        <code>IDPropertyUIManager</code> that lets you attach <code>soft_min</code>,{" "}
        <code>soft_max</code>, <code>description</code>, <code>subtype</code>,{" "}
        <code>step</code>, <code>precision</code>, and{" "}
        <code>is_overridable_library</code> to any custom property — all serialised
        into the <code>.blend</code> without requiring a registered add-on class.
        The result is rig sliders with correct ranges and tooltips that survive
        library linking, library override, and NLA-baked export — with no Python
        add-on installed in the receiving file.  Compare the PropertyGroup approach
        in the{" "}
        <Link href="/tutorials/blender-tutorial-python-addon-custom-panel-property-group" className={lk}>
          Custom Panel Property Group
        </Link>{" "}
        tutorial for the registered-class alternative, and see how these same
        properties can become fcurve driver targets in{" "}
        <Link href="/tutorials/blender-tutorial-python-fcurve-driver-shape-key-bone-rotation-vrm" className={lk}>
          Bone-Rotation-to-Shape-Key Corrective Blend Shape
        </Link>.
      </p>

      <h2>Custom ID props vs PropertyGroup: which to use when</h2>
      <p>
        A <code>bpy.props</code> PropertyGroup is a Python class registered with
        Blender&rsquo;s RNA.  That registration lives only in the add-on&rsquo;s
        Python session.  When you link a character rig from an asset library into
        a shot file, the armature data-block arrives with its PropertyGroup values
        stored as raw floats or integers — but the metadata (panel labels, min/max
        sliders, descriptions) is absent unless the same add-on is also installed
        and active in the shot file.  During a production where dozens of artists
        open scene files on workstations with different add-on configurations, this
        produces silent data loss.
      </p>
      <p>
        Custom ID properties sidestep this entirely: the key, value, and
        UIManager schema are serialised as a unit inside the ID block&rsquo;s
        storage.  See the full asset-linking pipeline context in{" "}
        <Link href="/tutorials/blender-tutorial-python-library-link-append-blend-files" className={lk}>
          Library Linking, Appending &amp; Override
        </Link>.
        The one thing PropertyGroup <em>can</em> do that ID props cannot is provide{" "}
        <code>update</code> callbacks — a Python function that fires whenever the
        property value changes.  ID props have no such hook.  The workaround is a{" "}
        <code>bpy.app.handlers.depsgraph_update_post</code> handler or a driver
        expression.
      </p>

      <h2>The IDPropertyUIManager API</h2>
      <p>
        Calling <code>obj.id_properties_ui(&quot;wing_spread&quot;)</code> returns an
        opaque manager object.  The only methods you need are:
      </p>
      <ul>
        <li>
          <code>.update(**kwargs)</code> — set any combination of schema fields
          in one call.  If the property does not exist yet, this raises{" "}
          <code>KeyError</code> — you must assign <code>obj[&quot;wing_spread&quot;] = 0.0</code>{" "}
          first.
        </li>
        <li>
          <code>.as_dict()</code> — returns the current schema as a plain Python
          dict, useful for debugging.
        </li>
      </ul>
      <p>
        The full list of <code>update()</code> kwargs in Blender 5.1:
      </p>
      <ul>
        <li><code>soft_min</code>, <code>soft_max</code> — slider widget bounds (stored value can exceed)</li>
        <li><code>min</code>, <code>max</code> — hard clamp on the stored value (default ±inf)</li>
        <li><code>description</code> — tooltip string shown on hover</li>
        <li>
          <code>subtype</code> — controls which unit suffix the UI displays:{" "}
          <code>&quot;NONE&quot;</code>, <code>&quot;FACTOR&quot;</code> (0–1 normalised),{" "}
          <code>&quot;DISTANCE&quot;</code> (metres), <code>&quot;ANGLE&quot;</code> (radians),{" "}
          <code>&quot;TIME&quot;</code> (seconds), <code>&quot;VELOCITY&quot;</code>,{" "}
          <code>&quot;COLOR&quot;</code> (colour picker widget for vector props)
        </li>
        <li><code>step</code> — drag increment (integer, where 100 = 1.0 unit)</li>
        <li><code>precision</code> — decimal places in the display</li>
        <li>
          <code>is_overridable_library</code> — if <code>True</code>, library-override
          instances can set their own value; if <code>False</code> (default), the
          slider is greyed-out in linked scenes
        </li>
      </ul>
      <p>
        The <code>step</code> parameter is in hundredths.  <code>step=1</code>{" "}
        means dragging one pixel changes the value by 0.01; <code>step=100</code>{" "}
        changes it by 1.0.  This is the same unit Blender&rsquo;s built-in
        properties use — confusingly, the displayed value and the step unit are
        different scales.
      </p>

      <h2>Booleans: int in disguise</h2>
      <p>
        There is no native boolean ID property type.  Store booleans as{" "}
        <code>int</code> and set <code>soft_min=0</code>, <code>soft_max=1</code>,{" "}
        <code>step=1</code>, <code>precision=0</code>.  The Properties panel
        renders a [0, 1] integer with step=1 as a toggle checkbox.  If you
        leave the default step (100), the widget becomes a spinner showing
        &ldquo;0.00&rdquo; and &ldquo;1.00&rdquo; — visually confusing for a flag.
        This int/checkbox pattern is what Blender&rsquo;s own built-in drivers use
        internally for muted/enabled flags; it is not a workaround, it is the
        intended API.
      </p>

      <h2>Nested groups via id_properties_ensure()</h2>
      <p>
        <code>id_properties_ensure()</code> returns the root{" "}
        <code>IDPropertyGroup</code> (a dict-like object) for the ID block,
        creating it if absent.  Assigning a plain Python dict to a key inside
        that group creates a sub-namespace.  The Holoflow exporter uses this to
        store per-object routing metadata under the <code>&quot;holoflow&quot;</code> key:
      </p>
      <pre><code>{`obj.id_properties_ensure()["holoflow"] = {
    "facet":        "faceted",
    "export_scale": 1.0,
    "lod_count":    2,
}`}</code></pre>
      <p>
        Sub-groups appear as collapsible rows in the Custom Properties panel.
        Expand them to see the leaves.  One limitation: you cannot call{" "}
        <code>id_properties_ui()</code> on the sub-group key itself — only on
        scalar leaves.  Sub-group headers have no UIManager schema.
      </p>
      <p>
        See how this metadata travels with linked assets in the{" "}
        <Link href="/tutorials/blender-tutorial-python-bpy-collection-property-uilist-export-queue" className={lk}>
          CollectionProperty + UIList Export Queue
        </Link>{" "}
        tutorial for the equivalent registered-class approach, and the
        rig-visual context in{" "}
        <Link href="/tutorials/blender-tutorial-armature-bone-collections-custom-shapes" className={lk}>
          Bone Collections &amp; Custom Shapes
        </Link>{" "}
        for where these sliders surface in a real production rig.
      </p>

      <h2>Animating a custom property via fcurve</h2>
      <p>
        Keyframe any ID property with{" "}
        <code>obj.keyframe_insert(data_path=&apos;[&quot;wing_spread&quot;]&apos;, frame=N)</code>.
        The square-bracket notation in <code>data_path</code> is mandatory —
        plain dot-notation only resolves official RNA properties, not ID props.
        The keyframe creates an <code>FCurve</code> on{" "}
        <code>obj.animation_data.action</code> whose <code>data_path</code>{" "}
        matches the bracket expression.  You can then read and manipulate that
        curve exactly like any other fcurve: set interpolation, add noise
        modifiers, or bake it.  See{" "}
        <Link href="/tutorials/blender-tutorial-python-shape-key-driver-rig-vrm-facial" className={lk}>
          Shape Key Driver Rig for VRM Facial Controls
        </Link>{" "}
        for a worked example of driving shape keys from custom properties via
        driver expressions that reference <code>var.targets[0].data_path</code>.
      </p>
      <p>
        To use an ID property as a driver variable source, set{" "}
        <code>var.type = &quot;SINGLE_PROP&quot;</code>, <code>tgt.id = obj</code>, and{" "}
        <code>tgt.data_path = &apos;[&quot;wing_spread&quot;]&apos;</code>.  The bracket path
        resolves correctly in the driver engine.  This is how the Holoflow
        pipeline wires per-rig sliders to shape key weights without baking
        intermediary fcurves.
      </p>

      <h2>Library override and is_overridable_library</h2>
      <p>
        When a rig is <strong>linked</strong> into a shot scene, the linked
        object is read-only by default — Blender refuses to write new values to
        properties defined in the library source.  Marking a custom property with{" "}
        <code>is_overridable_library=True</code> registers it as a candidate for
        library override.  When the artist then calls{" "}
        <strong>Object → Library Override → Make Override</strong> (or the Python
        equivalent <code>obj.override_library_create(remap_local_usages=True)</code>),
        Blender creates a local override copy where only the flagged properties
        can differ from the library source.  The wing_spread slider becomes live
        and keyframeable in the shot scene; the underlying rig geometry stays
        locked to the asset library.  Unmarked properties remain grey and
        uneditable in the override copy.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>KeyError: id_properties_ui called before the property exists</strong>{" "}
          — Assign the value first: <code>obj[&quot;key&quot;] = 0.0</code>.{" "}
          <code>id_properties_ui()</code> raises <code>KeyError</code> on unknown
          keys.  The assignment must precede the <code>.update()</code> call.
        </li>
        <li>
          <strong>Slider shows &ldquo;0.00&rdquo; / &ldquo;1.00&rdquo; instead of checkbox</strong>{" "}
          — For boolean flags stored as int, ensure <code>step=1</code>{" "}
          (not the default 100) and <code>precision=0</code>.  The checkbox widget
          triggers only when Blender detects a [0, 1] integer with step=1.
        </li>
        <li>
          <strong>Schema disappears after file reload</strong>{" "}
          — The property was assigned via <code>bpy.props</code> PropertyGroup
          rather than a bare ID prop, or the file was saved before{" "}
          <code>id_properties_ui().update()</code> ran.  Confirm by running{" "}
          <code>obj.id_properties_ui(&quot;key&quot;).as_dict()</code> in the Python
          Console before saving.
        </li>
        <li>
          <strong>is_overridable_library has no effect — slider still greyed out</strong>{" "}
          — The override was created before the flag was set.  Delete the override
          (<code>Object → Library Override → Reset All Overrides</code>), run the
          blueprint again to set the flag, then create a fresh override.
        </li>
        <li>
          <strong>keyframe_insert fails with RuntimeError: context is incorrect</strong>{" "}
          — The object is not selected and active.  Call{" "}
          <code>bpy.context.view_layer.objects.active = obj</code> and{" "}
          <code>obj.select_set(True)</code> before <code>keyframe_insert</code>.
          Or use the direct FCurve insertion path:{" "}
          <code>action.fcurves.new(data_path=&apos;[&quot;key&quot;]&apos;).keyframe_points.insert(frame, value)</code>{" "}
          which bypasses the context requirement.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <p>
        Blender Foundation.{" "}
        <em>IDPropertyUIManager — Blender 5.1 Python API</em>.  CC-BY-SA 4.0.{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.IDPropertyUIManager.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          docs.blender.org/api/5.1/bpy.types.IDPropertyUIManager
        </a>
        .  Sibling resource:{" "}
        <a
          href="https://www.blender.org"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          blender.org
        </a>{" "}
        (the Blender project, GPL-licensed application; this tutorial references
        only the CC-BY-SA API documentation, not the application source).
      </p>
      <p>
        Blender Foundation.{" "}
        <em>bpy_struct.id_properties_ui() and id_properties_ensure()</em>.
        Blender 5.1 Python API.  CC-BY-SA 4.0.{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.bpy_struct.html#bpy.types.bpy_struct.id_properties_ui"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          docs.blender.org/api/5.1/bpy.types.bpy_struct
        </a>
        .  The <code>id_properties_ensure()</code> method was added in Blender
        3.0; the full <code>update()</code> kwarg set documented here stabilised
        in 3.3.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-id-properties-ui-custom-prop-schema-rig-controls",
    overview:
      "How to add soft-min, soft-max, subtype, description, and " +
      "is_overridable_library schema to any Blender custom property using " +
      "IDPropertyUIManager — without a registered add-on class.",
  },
  {
    slug: "blender-tutorial-python-id-properties-ui-custom-prop-schema-rig-controls",
    title:
      "Python bpy.types.IDPropertyUIManager — Custom Property Schema for Rig Controls and Asset Metadata (Blender 5.1)",
    date: "2026-07-04",
    kind: "tutorial",
    excerpt:
      "id_properties_ui('key').update(soft_min, soft_max, description, subtype, " +
      "is_overridable_library) attaches UI schema to any custom ID property without " +
      "a registered add-on class. Schema survives library linking and override. " +
      "Covers FACTOR/DISTANCE/ANGLE subtypes, bool-as-int checkbox pattern, nested " +
      "groups via id_properties_ensure(), fcurve keyframing via bracket data_path, " +
      "and SINGLE_PROP driver variables — applied to a VRM rig control panel.",
    tags: [
      "blender",
      "python",
      "scripting",
      "custom-properties",
      "id-properties",
      "rig",
      "vrm",
      "library-override",
      "bpy",
    ],
    Body: PythonIdPropertiesUiBody,
  },
);
