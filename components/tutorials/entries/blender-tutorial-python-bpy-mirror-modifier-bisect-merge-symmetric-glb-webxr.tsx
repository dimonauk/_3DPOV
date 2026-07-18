import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>MirrorModifier</code> reflects geometry across one or more
        local axes of the object&apos;s origin (or across a custom{" "}
        <code>mirror_object</code>). Setting{" "}
        <code>use_bisect_axis[n]=True</code> clips any source geometry that
        crosses the mirror plane before reflection — this is the correct
        approach whenever your half-mesh touches or overlaps the seam line
        at 0, preventing Z-fighting and doubled faces at the boundary.{" "}
        <code>use_mirror_merge=True</code> with a small{" "}
        <code>merge_threshold</code> (0.0001 m) then welds the seam into a
        single run of vertices.
      </p>
      <p>
        This tutorial scripts a faceted sci-fi clasp buckle: a single
        quarter-piece in the +X/+Y quadrant is expanded by two stacked{" "}
        <code>MirrorModifier</code> instances — first across X, then across
        Y — into a bilateral, seam-clean hard-surface prop. A live modifier
        stack is preserved on the source object; a throw-away duplicate
        receives applied modifiers before GLB export.
      </p>

      <h2>Bisect vs clip — which to use</h2>
      <p>
        The two "seam-locking" properties serve different purposes:
      </p>
      <pre>{`# use_bisect_axis — geometric clip at mirror plane (correct for export)
mod.use_bisect_axis[0] = True   # clip geometry crossing X=0 before mirror

# use_clip — interactive editing lock (safe to set in scripts too)
mod.use_clip = True             # prevents verts from crossing mirror plane
                                # in interactive sessions; no effect on
                                # the exported mesh shape`}</pre>
      <p>
        Use <code>use_bisect_axis</code> whenever the source half-mesh has
        vertices at or beyond the mirror plane — geometry that sits entirely
        within X &gt; 0 would not need it, but any shared-centre boss,
        central panel bead, or centred pivot requires it.{" "}
        <code>use_clip</code> is a modelling convenience and should always
        be set for <code>.blend</code> reuse even in headless scripts.
      </p>

      <h2>use_axis — the bpy_prop_array pitfall</h2>
      <pre>{`# WRONG — cannot assign a Python tuple directly
mod.use_axis = (True, False, False)   # AttributeError

# CORRECT — index into the bpy_prop_array
mod.use_axis[0] = True    # X axis
mod.use_axis[1] = False   # Y axis
mod.use_axis[2] = False   # Z axis

# Same pattern for use_bisect_axis, use_bisect_flip_axis
mod.use_bisect_axis[0] = True`}</pre>
      <p>
        <code>use_axis</code>, <code>use_bisect_axis</code>, and{" "}
        <code>use_bisect_flip_axis</code> are each{" "}
        <code>bpy_prop_array</code> of length 3, not plain Python tuples.
        Direct assignment raises <code>AttributeError</code>; always index.
      </p>

      <h2>Stacking two mirrors for bilateral symmetry</h2>
      <pre>{`# Mirror X first — builds the right ↔ left half
mirror_x = obj.modifiers.new("Mirror_X", type='MIRROR')
mirror_x.use_axis[0]        = True
mirror_x.use_bisect_axis[0] = True
mirror_x.use_mirror_merge   = True
mirror_x.merge_threshold    = 0.0001
mirror_x.use_clip           = True

# Mirror Y second — builds the front ↔ back half
mirror_y = obj.modifiers.new("Mirror_Y", type='MIRROR')
mirror_y.use_axis[1]        = True
mirror_y.use_bisect_axis[1] = True
mirror_y.use_mirror_merge   = True
mirror_y.merge_threshold    = 0.0001
mirror_y.use_clip           = True`}</pre>
      <p>
        Modifier order matters: the second Mirror operates on the already-
        mirrored output of the first. Swapping X and Y modifiers produces an
        identical result here because both axes bisect at 0, but for
        asymmetric geometry or non-origin pivots the order changes which half
        is treated as the source.
      </p>

      <h2>Off-origin mirror via mirror_object</h2>
      <pre>{`# Place an Empty where you want the mirror plane
pivot = bpy.data.objects.new("ClaspPivot", None)
bpy.context.collection.objects.link(pivot)
pivot.location = (0.08, 0.0, 0.0)   # mirror plane at X = 0.08 m

mod = obj.modifiers.new("Mirror_Offset", type='MIRROR')
mod.use_axis[0]     = True
mod.mirror_object   = pivot          # mirror plane = pivot.matrix_world`}</pre>
      <p>
        When a mesh pivot does not sit at the desired symmetry centre —
        common for character accessories that share a rig pivot — set{" "}
        <code>mirror_object</code> to an Empty placed at the correct
        position. The modifier then mirrors across the Empty&apos;s local XY
        plane (for axis 0 → perpendicular to the Empty&apos;s X). Move the
        Empty; the mirror updates live. See{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-hook-modifier-vertex-bind-empty-deform-vrm-webxr"
        >
          HookModifier — vertex bind to Empty
        </Link>{" "}
        for the complementary pattern of using Empties as transform targets.
      </p>

      <h2>merge_threshold — seam quality</h2>
      <pre>{`mod.merge_threshold = 0.0001  # 0.1 mm — tight weld; correct for scale ≈ 0.1 m
mod.merge_threshold = 0.001   # 1 mm — may swallow near-seam detail on small props
mod.merge_threshold = 0.01    # 10 mm — nearly always too loose; seam bulges`}</pre>
      <p>
        The default threshold is 0.001 m. For props at centimetre scale
        (VRM accessories, clasp buckles) 0.0001 m is safer — it welds only
        boundary vertices that truly coincide while leaving any intentional
        near-seam edge loops intact. See{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-boolean-weld-modifier-union-clean-mesh-glb-webxr"
        >
          BooleanModifier + WeldModifier
        </Link>{" "}
        for how merge-by-distance interacts with junction topology after a
        boolean operation.
      </p>

      <h2>Pre-export apply — duplicate-and-apply pattern</h2>
      <pre>{`# Duplicate the source so its live modifier stack is preserved
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.object.duplicate()
dup = bpy.context.active_object

# Apply each modifier in stack order (Blender 5.1 temp_override)
for mod in list(dup.modifiers):
    with bpy.context.temp_override(
        active_object=dup,
        selected_objects=[dup],
        selected_editable_objects=[dup],
    ):
        bpy.ops.object.modifier_apply(modifier=mod.name)

# Export applied duplicate; then remove it
bpy.ops.export_scene.gltf(
    filepath="//hf_clasp_buckle.glb",
    use_selection=True,
    export_apply=False,  # already applied
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_yup=True,
)
bpy.data.objects.remove(dup, do_unlink=True)`}</pre>
      <p>
        <code>bpy.ops.object.modifier_apply</code> is context-sensitive in
        Blender 5.1: it needs <code>active_object</code>,{" "}
        <code>selected_objects</code>, and{" "}
        <code>selected_editable_objects</code> all pointing to the target in
        the <code>temp_override</code> block. Omitting any of the three
        raises <code>RuntimeError: context is incorrect</code>. See{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-context-temp-override-ops-headless-scripting"
        >
          bpy.context.temp_override — headless operator context injection
        </Link>{" "}
        for the full contract.
      </p>

      <h2>Edge-domain attributes survive the mirror</h2>
      <p>
        Bevel weights, sharp flags, and seam flags set via the{" "}
        <code>&quot;bevel_weight_edge&quot;</code>,{" "}
        <code>&quot;sharp_edge&quot;</code>, and{" "}
        <code>&quot;use_seam&quot;</code> named attributes on the source half
        are propagated to the mirrored copy. The Bevel modifier stacked after
        the mirror therefore reads both the original and mirrored edge
        weights correctly. See{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr"
        >
          sharp_edge / crease_edge / use_seam — edge attribute pipeline
        </Link>{" "}
        for the attribute access pattern and{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-bevel-modifier-hard-surface-edge-chamfer-webxr"
        >
          BevelModifier — edge-weight chamfer
        </Link>{" "}
        for how the bevel reads those attributes after the mirror.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Doubled faces at the seam</strong> — source geometry
          crosses X=0 but <code>use_bisect_axis[0]</code> is False. Enable
          bisect.
        </li>
        <li>
          <strong>Seam gap visible after merge</strong> —{" "}
          <code>merge_threshold</code> too small for the source vertex
          distance from the mirror plane. Check that boundary vertices are
          exactly at 0 (snap to 0 on the mirror axis) or increase threshold.
        </li>
        <li>
          <strong>RuntimeError applying modifier</strong> — missing{" "}
          <code>selected_editable_objects</code> in{" "}
          <code>temp_override</code>. All three context keys are required.
        </li>
        <li>
          <strong>GLB seam visible in three.js</strong> — normal split at
          the mirror seam. The merged seam edge should be marked smooth;
          add a <code>SMOOTH_BY_ANGLE</code> modifier after the mirrors with
          angle_limit below the seam dihedral.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/manual/en/5.1/modeling/modifiers/generate/mirror.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mirror Modifier — Blender 5.1 Manual
          </a>{" "}
          (CC-BY-SA 4.0) — Blender Foundation. Authoritative parameter
          reference for <code>use_bisect_axis</code>,{" "}
          <code>use_clip</code>, and <code>mirror_object</code>. Related:
          Blender Foundation open-source projects at{" "}
          <a
            className={lk}
            href="https://projects.blender.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            projects.blender.org
          </a>
          .
        </li>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/api/current/bpy.types.MirrorModifier.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.MirrorModifier — Blender Python API
          </a>{" "}
          (CC-BY-SA 4.0) — Blender Foundation. Full attribute listing
          including the <code>bpy_prop_array</code> types for axis toggles
          and the <code>merge_threshold</code> minimum. Related:
          KhronosGroup/glTF-Blender-IO (Apache-2.0) — the exporter that
          processes the applied mirror mesh; KhronosGroup/glTF specification
          for normal accessor encoding of the merged seam.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-mirror-modifier-bisect-merge-symmetric-glb-webxr",
  title:
    "Python bpy.types.MirrorModifier — Bisect Seam, Bilateral Stack & Off-Origin Mirror Object: Faceted Clasp Buckle & GLB Export (Blender 5.1)",
  summary:
    "MirrorModifier with use_bisect_axis clips source geometry at the mirror plane before reflecting, producing a geometrically clean seam. This tutorial scripts a faceted sci-fi clasp buckle from a single quarter-piece by stacking two MirrorModifiers (X then Y), demonstrates the mirror_object pattern for off-origin symmetry, explains the bpy_prop_array index-assignment rule for use_axis/use_bisect_axis/use_bisect_flip_axis, and exports a Draco-compressed GLB via the duplicate-and-apply pattern preserving the live modifier stack in .blend.",
  tags: [
    "blender",
    "python",
    "scripting",
    "mirror-modifier",
    "bisect",
    "bilateral-symmetry",
    "hard-surface",
    "modifier",
    "props",
    "webxr",
    "glb",
    "blender-5-1",
  ],
  date: "2026-07-18",
  body: <Body />,
  libraryPath:
    "blends/scripting/python-bpy-mirror-modifier-bisect-merge-symmetric-glb-webxr",
});
