import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>SimpleDeformModifier</code> applies one of four closed-form
        analytical deformations — <strong>TWIST</strong>,{" "}
        <strong>BEND</strong>, <strong>TAPER</strong>, and{" "}
        <strong>STRETCH</strong> — along the object's local Z axis (or the
        local Z of a nominated Empty). Because each operation is a direct
        mathematical formula applied per-vertex rather than a cage or
        lattice interpolation, it is fast, resolution-independent, and
        trivially keyframeable. This tutorial scripts three props that
        showcase the four modes in combination: a twisted hexagonal column, a
        bent horn, and a pulled crystal spike — exported as a single Draco-
        compressed GLB for WebXR delivery.
      </p>
      <p>
        The four modes are not interchangeable analogues of the same idea.
        TWIST rotates each horizontal cross-section by an angle proportional
        to its Z height. BEND arcs the whole object like a curved pipe. TAPER
        scales the cross-section radius linearly from limits.min to
        limits.max. STRETCH does something subtler: it compresses the
        cross-section at the limits boundary using a cosine profile and pulls
        the vertex rows toward that boundary — a volume-preserving-ish pinch
        that produces organic crystal and spike forms TAPER cannot.
      </p>

      <h2>The critical parameter: angle is in radians</h2>
      <p>
        Every beginner's first SimpleDeformModifier mistake is passing a
        degree value to <code>angle</code>. The property stores and reads in
        radians; the Blender UI converts for display. A common symptom is a
        90° twist where 360° was intended:
      </p>
      <pre>{`# WRONG — this gives 90 radians (about 5156°), not 90 degrees
mod.angle = 90

# CORRECT
import math
mod.angle = math.radians(90)   # 90°  → π/2
mod.angle = math.pi * 1.5      # 270° → 3π/2
mod.angle = math.tau           # 360° → 2π`}</pre>
      <p>
        <code>factor</code>, used by TAPER and STRETCH, is a signed float in
        the range [−10, 10] with no angular meaning. Negative TAPER narrows
        the form toward the +Z limit; positive TAPER narrows toward −Z.
      </p>

      <h2>Stacking order: TAPER before TWIST or BEND</h2>
      <p>
        Blender evaluates modifiers top-to-bottom. For a tapered-and-twisted
        column, the correct order is TAPER first:
      </p>
      <pre>{`# Correct stack for the twisted column
taper = ob.modifiers.new("Taper", 'SIMPLE_DEFORM')
taper.deform_method = 'TAPER'
taper.factor        = -0.6
taper.limits        = (0.0, 0.60)    # narrow the lower 60%

twist = ob.modifiers.new("Twist", 'SIMPLE_DEFORM')
twist.deform_method = 'TWIST'
twist.angle         = math.pi * 1.5  # 270°
twist.limits        = (0.0, 1.0)

# Wrong order: TWIST first, TAPER second
# TAPER then squashes the already-spiralled verts unevenly — each
# horizontal band is now at a different angle and taper sees a
# non-circular cross-section. Produces a pinched, broken silhouette.`}</pre>

      <h2>limits — bounding-box fractions, not world metres</h2>
      <p>
        <code>limits</code> is a tuple <code>(min, max)</code> in the range
        [0.0, 1.0]. These are fractions of the object's{" "}
        <em>local bounding box</em> extent along the deformation axis, not
        world-space metres. 0.0 is the −Z face, 1.0 is the +Z face of the
        bounding box:
      </p>
      <pre>{`# Affect only the top 40% of the spike
stretch.limits = (0.60, 1.0)

# Full height (default)
twist.limits   = (0.0, 1.0)

# Lower third only
mod.limits     = (0.0, 0.33)`}</pre>
      <p>
        A common failure is assuming limits are world metres. If the object
        has been scaled non-uniformly without applying transforms, the
        bounding-box fractions map to unexpected world positions — always
        apply scale (<code>bpy.ops.object.transform_apply(scale=True)</code>)
        before setting limits on production props.
      </p>

      <h2>Redirecting the deformation axis with an Empty (origin)</h2>
      <p>
        SimpleDeformModifier always deforms along the{" "}
        <strong>local Z axis</strong> of the modifier object — or the local Z
        of the nominated <code>origin</code> Empty if set. To bend a
        vertically-standing horn outward in the world-X direction, rotate an
        Empty 90° around the world Y axis so its local Z aligns with world X,
        then assign it as the origin:
      </p>
      <pre>{`pivot = bpy.data.objects.new("horn_pivot", None)
bpy.context.collection.objects.link(pivot)
pivot.rotation_euler = (0.0, math.radians(90), 0.0)
pivot.location       = horn_ob.location.copy()

bend = horn_ob.modifiers.new("Bend", 'SIMPLE_DEFORM')
bend.deform_method = 'BEND'
bend.angle         = math.radians(80)
bend.deform_axis   = 'Z'
bend.origin        = pivot   # the modifier reads pivot's LOCAL Z as its axis

# WHY not just rotate the mesh object?
# Rotating the object 90° around Y and then applying transforms resets the
# local axis — correct, but any further modifiers in the stack now see an
# unexpected base orientation. The Empty technique keeps the mesh object
# axis-aligned and readable, with the deviation isolated to the pivot.`}</pre>

      <h2>Vertex subdivision before deformation</h2>
      <p>
        SimpleDeformModifier displaces individual vertices — it does not
        subdivide the mesh. A prism with only two rings of vertices will TWIST
        as a rigid rotation of its top face rather than spiralling smoothly:
      </p>
      <pre>{`# Add longitudinal edge loops before deforming
bmesh.ops.subdivide_edges(
    bm,
    edges         = [e for e in bm.edges if not e.is_boundary],
    cuts          = 8,        # 8 cuts = 10 rings of verts on a height-2 cylinder
    use_grid_fill = True,
)
# Now TWIST has 10 vertex rings to distribute the rotation across — a proper spiral.
# Rule of thumb: at least 1 ring per 20° of TWIST angle, 2 per 10° of BEND.`}</pre>

      <h2>Headless bake via depsgraph</h2>
      <p>
        <code>bpy.ops.object.modifier_apply()</code> requires an active
        VIEW_3D context. In a background or headless script, bake through the
        depsgraph instead:
      </p>
      <pre>{`dg       = bpy.context.evaluated_depsgraph_get()
eval_ob  = obj.evaluated_get(dg)
baked_me = bpy.data.meshes.new_from_object(eval_ob, depsgraph=dg)
obj.modifiers.clear()
obj.data = baked_me
# eval_ob is transient — do not store a reference across frame changes.`}</pre>

      <h2>Faceted shading for GLB</h2>
      <p>
        After baking, mark flat shading and sharp edges using the Blender 5.1
        edge-domain attribute API so the GLTF exporter splits vertex normals
        correctly:
      </p>
      <pre>{`for poly in me.polygons:
    poly.use_smooth = False

attr = me.attributes.get("sharp_edge") or \
       me.attributes.new("sharp_edge", 'BOOLEAN', 'EDGE')
for datum in attr.data:
    datum.value = True
me.update()`}</pre>

      <h2>GLB export</h2>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath                             = bpy.path.abspath("//hf_deform_props.glb"),
    use_selection                        = True,
    export_format                        = 'GLB',
    export_apply                         = True,
    export_yup                           = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = 'WEBP',
    export_normals                       = True,
    export_colors                        = False,
)`}</pre>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>TWIST angle seems wrong (e.g. 90° when 270° expected)</strong>{" "}
          — you are setting degrees, not radians. Use{" "}
          <code>math.radians(270)</code> or <code>math.pi * 1.5</code>.
        </li>
        <li>
          <strong>BEND arcs in the wrong world direction</strong> — add an
          Empty, rotate it so its local Z points in the desired arc axis, and
          assign it to <code>mod.origin</code>.
        </li>
        <li>
          <strong>Pinched or non-uniform TAPER</strong> — the object's scale
          has not been applied. Run{" "}
          <code>
            bpy.ops.object.transform_apply(location=False, rotation=False,
            scale=True)
          </code>{" "}
          before setting limits.
        </li>
        <li>
          <strong>Column looks like a rigid top-face rotation, not a spiral</strong>{" "}
          — insufficient vertex rings. Add at least 8 longitudinal cuts before
          running TWIST.
        </li>
        <li>
          <strong>STRETCH does nothing visible</strong> — the limits range is
          too narrow (e.g. <code>(0.99, 1.0)</code>) or factor is near 0.
          Widen limits to at least 20% of the height for a visible pinch.
        </li>
        <li>
          <strong>Smooth faces in the exported GLB despite flat-shading code</strong>{" "}
          — call <code>me.update()</code> after setting the sharp_edge
          attribute. Without the flush, the exporter reads stale normal tables.
        </li>
      </ul>

      <h2>Animation recipe</h2>
      <p>
        Because <code>angle</code> and <code>factor</code> are standard Blender
        properties, they accept keyframes directly:
      </p>
      <pre>{`bpy.context.scene.frame_set(1)
twist_mod.angle = 0.0
twist_mod.keyframe_insert("angle", frame=1)

bpy.context.scene.frame_set(120)
twist_mod.angle = math.pi * 1.5
twist_mod.keyframe_insert("angle", frame=120)
# → column uncoils from flat to 270° twist over 120 frames.`}</pre>

      <h2>What to try next</h2>
      <ul>
        <li>
          Stack a{" "}
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-array-modifier-object-offset-radial-helix-webxr"
          >
            ArrayModifier in radial mode
          </Link>{" "}
          after TAPER to crown the twisted column with identical copies at
          equal angular offsets.
        </li>
        <li>
          Combine BEND with a{" "}
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-curve-spline-bezier-motion-path-camera-rail-webxr"
          >
            curve-based camera rail
          </Link>{" "}
          to align a follow-cam with a bent-prop arc.
        </li>
        <li>
          Use the TWIST-animated column as a base mesh for{" "}
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-shape-key-data-block-morph-target-vrm-webxr"
          >
            morph-target shape keys
          </Link>{" "}
          — bake a flat and a fully-twisted version as separate keys, then
          drive the blend weight from a VRM expression.
        </li>
        <li>
          Add a{" "}
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-normal-edit-modifier-radial-cel-shade-vrm-glb-webxr"
          >
            NormalEditModifier after TWIST
          </Link>{" "}
          to apply a spherical normal field, giving the spiral a smooth
          cel-shade look without subdividing.
        </li>
        <li>
          Replace the static Empty pivot with a{" "}
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-lattice-cage-deform-morph-bake-webxr"
          >
            Lattice cage
          </Link>{" "}
          to add a second layer of coarse shaping on top of the BEND result.
        </li>
      </ul>

      <h3>External sources</h3>
      <ul>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/api/5.1/bpy.types.SimpleDeformModifier.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.SimpleDeformModifier — Blender Python API 5.1
          </a>{" "}
          (CC BY SA 4.0 · Blender Foundation) — typed property reference for
          all four modes, <code>angle</code>, <code>factor</code>,{" "}
          <code>limits</code>, <code>origin</code>, <code>lock_x</code>,{" "}
          <code>lock_y</code>. Related projects: Blender Python API Working
          Group (developer.blender.org), bf-extensions repository on
          projects.blender.org.
        </li>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/simple_deform.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Simple Deform Modifier — Blender Manual
          </a>{" "}
          (CC BY SA 4.0 · Blender Documentation Team) — user-facing reference
          with axis diagrams, limits illustrations, mode comparison table, and
          the Empty-as-origin technique. Related sibling pages: Lattice
          Modifier, Mesh Deform Modifier, Cast Modifier — all deform-category
          modifiers operating non-destructively.
        </li>
        <li>
          <a
            className={lk}
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO — Khronos Group
          </a>{" "}
          (Apache-2.0) — the bundled GLTF exporter; handles{" "}
          <code>export_apply</code>, Draco compression, and reads the{" "}
          <code>sharp_edge</code> attribute for normal-split decisions at
          export time. Related: KhronosGroup/glTF specification,
          KhronosGroup/glTF-Sample-Assets.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-simple-deform-modifier-twist-bend-taper-prop-webxr",
  title:
    "Python bpy.types.SimpleDeformModifier — TWIST / BEND / TAPER / STRETCH: Three Stylised Props & GLB Export (Blender 5.1)",
  summary:
    "SimpleDeformModifier applies four closed-form analytical deformations — TWIST, BEND, TAPER, STRETCH — along a mesh's local Z axis. This tutorial scripts three WebXR props in Python: a twisted hexagonal column (stacked TAPER + TWIST), a bent horn (TAPER + BEND via Empty pivot), and a pulled crystal spike (TAPER + STRETCH on the upper third). Expert depth covers why angle is in radians, how limits maps to bounding-box fractions, stacking order rules, redirecting the deformation frame with an Empty, vertex density requirements, and headless depsgraph baking.",
  tags: [
    "blender",
    "python",
    "scripting",
    "simple-deform-modifier",
    "twist",
    "bend",
    "taper",
    "stretch",
    "modifier",
    "faceted",
    "low-poly",
    "props",
    "webxr",
    "glb",
    "blender-5-1",
  ],
  date: "2026-07-17",
  body: <Body />,
  libraryPath:
    "blends/scripting/python-bpy-simple-deform-modifier-twist-bend-taper-prop-webxr",
});
