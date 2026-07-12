import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The Grease Pencil 3 Line Art modifier traces silhouette, crease,
        contour, and material-boundary edges of any mesh in the scene, then
        deposits the resulting strokes onto a named GP layer every frame.
        Unlike the old GP2 Line Art operator (which was a one-shot destructive
        bake), the GP3 version is a non-destructive modifier that recomputes on
        every frame — meaning a rigged VRM character gets accurate toon outlines
        at every pose without any re-baking. This tutorial scripts the entire
        setup from Python: building a VRM proxy scene, creating the GP3 ink
        object with a bootstrapped material, attaching the Line Art modifier,
        and setting per-object opt-in flags so the outline system is reproducible
        across an entire character library. The UI-based Line Art workflow is
        covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-grease-pencil-3-line-art-toon-outline"
          className={lk}
        >
          GP3 Line Art toon outline tutorial
        </Link>
        ; the GP3 stroke scripting API (drawing strokes by hand rather than
        tracing meshes) lives in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-gp3-stroke-drawing-api-toon-ink-webxr"
          className={lk}
        >
          GP3 stroke drawing tutorial
        </Link>
        .
      </p>

      <h2>Why script the Line Art modifier?</h2>
      <p>
        The Line Art modifier has more than twenty parameters. Reproducing the
        same crease angle, edge-type flags, thickness, and intersection mask
        across twenty VRM characters by hand is error-prone. A Python function
        named <code>apply_lineart_ink(ob)</code> guarantees every character in
        the library gets the same ink treatment — and updating the crease
        threshold studio-wide is a one-line change rather than a tour of twenty
        modifier panels.
      </p>
      <p>
        The technique also feeds the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-armature-bone-collections-vrm-rig-classification-webxr"
          className={lk}
        >
          bone collection classification pipeline
        </Link>
        : once armature bones are categorised, the corresponding mesh objects
        (skin, hair, accessories) can be given different Line Art usage modes —
        hair FORCED_INCLUDE for always-visible strands, accessories EXCLUDE to
        suppress cluttered prop outlines — all driven from the same bone
        metadata.
      </p>

      <h2>Modifier type string — the 4.3 rename</h2>
      <p>
        The single most common GP3 Line Art error when porting from older
        scripts:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`# WRONG — pre-4.3 name, raises RuntimeError in 5.1
gp_ob.modifiers.new("LineArt", "GP_LINEART")

# CORRECT — renamed when GP3 data model shipped in 4.3
gp_ob.modifiers.new("LineArt", "GREASE_PENCIL_LINEART")`}
      </pre>
      <p>
        The same rename applies to the thickness and smooth modifiers:{" "}
        <code>GREASE_PENCIL_THICKNESS</code>,{" "}
        <code>GREASE_PENCIL_SMOOTH</code>, etc. The full list lives in the{" "}
        <code>bpy.types.GreasePencilModifier</code> subclass hierarchy in the
        API reference.
      </p>

      <h2>GP material bootstrap</h2>
      <p>
        A plain Blender material has no GP sub-block until you explicitly
        create it. The bootstrap sequence is strict:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`ink_mat = bpy.data.materials.new("ink_black")
# call BEFORE accessing .grease_pencil — AttributeError otherwise
bpy.data.materials.create_gpencil_data(ink_mat)

ink_mat.grease_pencil.show_stroke = True
ink_mat.grease_pencil.color = (0.0, 0.0, 0.0, 1.0)
ink_mat.grease_pencil.show_fill = False`}
      </pre>
      <p>
        This pattern also appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-gp3-stroke-drawing-api-toon-ink-webxr"
          className={lk}
        >
          GP3 stroke drawing tutorial
        </Link>{" "}
        and is required regardless of whether you plan to use Line Art or manual
        stroke scripting.
      </p>

      <h2>Crease threshold — degrees vs radians</h2>
      <p>
        The Blender UI displays crease threshold in degrees (default 140°). The
        Python API stores it in radians:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`import math

la = gp_ob.modifiers.new("LineArt", "GREASE_PENCIL_LINEART")
# 140° → edges sharper than 40° dihedral get a crease line
la.crease_threshold = math.radians(140)`}
      </pre>
      <p>
        Setting 140° picks up hard-surface folds on armour, belt buckles, and
        shoe soles while ignoring the smooth seams on an organic body mesh. For
        hair card edges (near 180°) you would raise the threshold to 170–175° or
        switch that object to FORCED_INCLUDE usage with intersection disabled.
      </p>

      <h2>Per-object usage modes</h2>
      <p>
        Each mesh object in the scene can independently declare its relationship
        with the Line Art modifier via <code>ob.lineart.usage</code>:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`# INCLUDE — participate in crease + contour tracing (default)
body.lineart.usage = "INCLUDE"
head.lineart.usage = "INCLUDE"

# EXCLUDE — invisible to this Line Art modifier instance
prop.lineart.usage = "EXCLUDE"

# FORCED_INCLUDE — traced even if its collection is excluded
hair.lineart.usage = "FORCED_INCLUDE"

# INHERIT — follow the collection's own usage setting (useful for LOD variants)
lod1.lineart.usage = "INHERIT"`}
      </pre>
      <p>
        The cel-shading look for VRM characters typically uses INCLUDE on skin,
        FORCED_INCLUDE on visible hair strands, and EXCLUDE on scene background
        props to keep ink clutter-free.
      </p>
      <p>
        For context on the broader VRM hierarchy setup, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-armature-bone-collections-vrm-rig-classification-webxr"
          className={lk}
        >
          bone collection classification tutorial
        </Link>
        , which groups mesh objects by deform purpose and can drive these usage
        flags from the classification result.
      </p>

      <h2>Intersection masking</h2>
      <p>
        When two INCLUDE objects overlap — body torso and head sphere, for
        example — the Line Art modifier draws an intersection stroke at the
        penetration boundary. On a VRM character where head and neck interpenetrate
        by design, this produces an unwanted visible seam. Intersection masks
        suppress it:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`# Each object carries a 1-byte bitmask.
# An intersection stroke is drawn only when the two objects share a set bit.
body.lineart.intersection_mask = 0b00000001  # bit 0
head.lineart.intersection_mask = 0b00000010  # bit 1

# body and head share NO common bits → their intersection is suppressed.
# Two sword blades might share bit 2 so their intersection IS drawn.`}
      </pre>
      <p>
        The mask is independent per modifier: if you have a secondary GP ink
        object for coloured outlines, it can have a different intersection policy
        without touching the primary black-ink GP object.
      </p>

      <h2>Layer targeting and depsgraph update</h2>
      <p>
        The modifier must know which GP layer to write to and which material to
        apply:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`ink_layer = gp_ob.data.layers.new("Ink", set_active=True)
ink_layer.use_lights = False  # flat ink — correct for WebXR cel work

la.target_layer    = "Ink"
la.target_material = ink_mat

# After configuring the modifier, force depsgraph eval so strokes exist
bpy.context.view_layer.update()`}
      </pre>
      <p>
        The <code>use_lights = False</code> flag bypasses EEVEE&apos;s GP lighting
        pass, rendering strokes as flat black regardless of scene lights.
        For a WebXR cel scene where Three.js controls all illumination,
        this is the correct starting point — the same principle applies in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-to-rgb-halftone-cel-shade-webxr"
          className={lk}
        >
          halftone cel-shade WebXR tutorial
        </Link>
        .
      </p>

      <h2>Full blueprint script</h2>
      <p>
        The complete <code>blueprint.py</code> in the library (
        <code>
          public/library/blends/scripting/
          python-gp3-lineart-modifier-toon-outline-batch-vrm/blueprint.py
        </code>
        ) builds the full scene, configures all parameters, saves the{" "}
        <code>.blend</code>, and writes a JSON manifest:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`import bpy, bmesh, json, math, os
from mathutils import Vector

# ── scene ───────────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ── proxy meshes ─────────────────────────────────────────────────────────────
def make_body():
    bm = bmesh.new()
    bmesh.ops.create_cylinder(bm, vertices=16,
        radius1=0.35, radius2=0.30, depth=1.0,
        cap_ends=True, cap_tris=False)
    for f in bm.faces: f.smooth = True
    me = bpy.data.meshes.new("body_mesh")
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new("body", me)
    scene.collection.objects.link(ob)
    ob.lineart.usage = "INCLUDE"
    return ob

body = make_body()

# ── GP material ──────────────────────────────────────────────────────────────
ink_mat = bpy.data.materials.new("ink_black")
bpy.data.materials.create_gpencil_data(ink_mat)
ink_mat.grease_pencil.show_stroke = True
ink_mat.grease_pencil.color = (0.0, 0.0, 0.0, 1.0)
ink_mat.grease_pencil.show_fill = False

# ── GP object + layer ────────────────────────────────────────────────────────
gp_data = bpy.data.grease_pencils.new("ink_gp")
gp_ob   = bpy.data.objects.new("ink_gp", gp_data)
scene.collection.objects.link(gp_ob)
gp_ob.data.materials.append(ink_mat)
ink_layer = gp_ob.data.layers.new("Ink", set_active=True)
ink_layer.use_lights = False

# ── Line Art modifier ────────────────────────────────────────────────────────
la = gp_ob.modifiers.new("LineArt", "GREASE_PENCIL_LINEART")
la.use_contour   = True
la.use_crease    = True
la.use_material  = True
la.crease_threshold = math.radians(140)
la.target_layer  = "Ink"
la.target_material = ink_mat
la.thickness     = 10
la.use_back_face_culling = True

bpy.context.view_layer.update()
print("[blueprint] Line Art modifier ready")`}
      </pre>

      <h2>Recording the viewport</h2>
      <p>
        The <code>record.py</code> script drives an OpenGL viewport render at
        1280×720 using <code>bpy.ops.render.opengl(animation=True)</code>. The
        OpenGL path captures the realtime Line Art strokes exactly as they
        appear in a Solid-shaded viewport — no Cycles or EEVEE full render
        required. See{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-sequence-editor-vse-script-tutorial-assembly"
          className={lk}
        >
          the VSE tutorial assembly script
        </Link>{" "}
        for how to cut the resulting <code>viewport.mp4</code> together with a
        screen recording into a finished tutorial video.
      </p>

      <h2>Failure modes and fixes</h2>
      <p>The three traps most people hit when scripting Line Art for the first time:</p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    troubleshooting: [
      {
        symptom: "RuntimeError: Can't find operator in runtime module",
        cause:
          "Modifier type string still uses the pre-4.3 name: 'GP_LINEART'.",
        fix: "Change to 'GREASE_PENCIL_LINEART'. All GP3 modifier type strings use the GREASE_PENCIL_ prefix.",
      },
      {
        symptom: "AttributeError: 'NoneType' object has no attribute 'color'",
        cause:
          "Setting grease_pencil.color before calling bpy.data.materials.create_gpencil_data(mat).",
        fix: "Always call create_gpencil_data() immediately after materials.new(), before accessing any .grease_pencil sub-property.",
      },
      {
        symptom: "Unwanted seam line between body and head objects",
        cause:
          "Intersection strokes are enabled (la.use_intersection=True) and both objects have the same intersection mask bits set.",
        fix: "Assign non-overlapping bitmasks: body.lineart.intersection_mask = 0b01, head.lineart.intersection_mask = 0b10. They share no bits, so no intersection stroke is drawn at their seam.",
      },
      {
        symptom: "Strokes disappear after certain poses",
        cause:
          "bpy.context.view_layer.update() was not called after changing bone positions; the depsgraph holds stale mesh data for the Line Art solver.",
        fix: "Call view_layer.update() after any pose or transform change when driving Line Art from Python rather than from the timeline.",
      },
      {
        symptom: "Line Art modifier present but no strokes in GLB export",
        cause:
          "Three.js / Babylon.js cannot consume raw GreasePencil data. The GP object must be converted to a mesh before export.",
        fix: "Duplicate the GP object, run bpy.ops.object.convert(target='MESH') on the duplicate (requires context.temp_override), export the mesh copy, delete the duplicate.",
      },
    ],
    outsideSources: [
      {
        title: "Blender 5.1 Line Art Modifier Manual",
        author: "Blender Foundation",
        licence: "CC-BY-4.0",
        url: "https://docs.blender.org/manual/en/5.1/grease_pencil/modifiers/generate/lineart.html",
        relatedProjects: [
          "https://projects.blender.org/blender/blender",
          "https://projects.blender.org/blender/blender-extensions",
        ],
      },
      {
        title: "bpy.types.LineartGpencilModifier API Reference (Blender 5.1)",
        author: "Blender Foundation",
        licence: "CC-BY-4.0",
        url: "https://docs.blender.org/api/5.1/bpy.types.LineartGpencilModifier.html",
        relatedProjects: [
          "https://projects.blender.org/blender/blender",
          "https://developer.blender.org/docs/features/grease_pencil/",
        ],
      },
    ],
  },
  {
    slug: "python-gp3-lineart-modifier-toon-outline-batch-vrm",
    title:
      "Python bpy.types.GreasePencilLineArtModifier — GP3 Line Art Batch Toon Outline Setup for VRM (Blender 5.1)",
    description:
      "Script the Grease Pencil 3 Line Art modifier from Python: per-object usage flags, crease threshold in radians, intersection masking to suppress body/head seam lines, and layer targeting — all reproducible across an entire VRM character library.",
    image: null,
    body: <Body />,
    tags: [
      "blender",
      "python",
      "scripting",
      "grease-pencil",
      "gp3",
      "line-art",
      "toon",
      "cel-shading",
      "vrm",
      "webxr",
      "modifier",
    ],
  }
);
