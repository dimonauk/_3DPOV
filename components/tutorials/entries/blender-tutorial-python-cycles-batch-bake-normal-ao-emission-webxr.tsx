import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&rsquo;s Cycles baker projects surface detail from a dense source mesh
        onto a UV-mapped lo-poly via ray casting, writing the result into an image
        buffer rather than geometry. Three passes cover the most common
        requirements: a <strong>Normal</strong> map encodes tangent-space surface
        direction, an <strong>Ambient Occlusion</strong> map records which cavities
        receive less sky light, and an <strong>Emission</strong> map bakes any
        self-illuminating shaders into a static texture. Doing these passes by
        hand — three clicks per object per pass, across a prop library of any
        size — is the kind of task that belongs to a script. This tutorial
        builds that script around <code>bpy.ops.object.bake()</code>, the sole
        Python entry point for Blender&rsquo;s texture bake system.
      </p>

      <h2>Why Cycles, and why the engine must be switched in code</h2>
      <p>
        <code>bpy.ops.object.bake()</code> is a Cycles-only operator. EEVEE Next
        has no bake backend; the operator does not raise an error when the
        engine is set to EEVEE — it returns <code>&#123;'FINISHED'&#125;</code>{" "}
        silently and writes nothing. Every batch script must therefore set{" "}
        <code>scene.render.engine = &quot;CYCLES&quot;</code> before the first bake call
        and restore the original value afterwards, because the user&rsquo;s scene may
        be configured for EEVEE and should not be permanently changed by the
        pipeline script.
      </p>
      <pre>{`prev_engine = scene.render.engine
scene.render.engine = "CYCLES"
scene.cycles.samples = 64
# ... bake ...
scene.render.engine = prev_engine`}</pre>

      <h2>The active Image Texture node rule</h2>
      <p>
        This is the rule that trips up every new pipeline scripter. Blender does
        not bake into the node connected to Material Output. It bakes into
        whichever <code>ShaderNodeTexImage</code> node is currently{" "}
        <em>active</em> (highlighted blue in the node editor). The active node
        must be <em>disconnected</em> from the shader graph — connecting it would
        replace the object&rsquo;s live material colour with the bake target image.
      </p>
      <p>
        The script injects a temporary Image Texture node below the existing
        graph, marks it active via <code>tree.nodes.active = bake_node</code>,
        runs the bake, saves the image, then removes the node entirely:
      </p>
      <pre>{`def _inject_bake_node(mat, img):
    mat.use_nodes = True
    tree = mat.node_tree
    node = tree.nodes.new("ShaderNodeTexImage")
    node.image = img
    node.label = "_HOLOFLOW_BAKE_TMP"
    node.location = (0.0, -500.0)   # park below the graph
    tree.nodes.active = node          # baker reads this one
    return node

def _remove_bake_node(mat):
    for node in list(mat.node_tree.nodes):
        if node.label == "_HOLOFLOW_BAKE_TMP":
            mat.node_tree.nodes.remove(node)`}</pre>
      <p>
        Multi-material objects need the node injected into <em>every</em> material
        slot, not just slot zero — the baker iterates all slots internally and
        will miss UVs covered by materials without the active target node.
      </p>

      <h2>Image buffer allocation: float vs 8-bit</h2>
      <p>
        Normal maps encode signed XYZ direction vectors. Storing them in an 8-bit
        sRGB buffer introduces two errors: gamma encoding bends the linear value
        space, and 256 levels per channel quantise the directions too coarsely for
        the steep-angle regions of a high-curvature surface. Allocate float buffers
        for normals and mark them as data (non-colour):
      </p>
      <pre>{`img = bpy.data.images.new(
    name=name,
    width=1024, height=1024,
    alpha=False,
    float_buffer=True,   # 32-bit per channel
    is_data=True,        # skips gamma in Cycles' internal handling
)
img.colorspace_settings.name = "Non-Color"`}</pre>
      <p>
        AO and Emission are colour values and should be 8-bit sRGB images.
        Using <code>float_buffer=False, is_data=False</code> and{" "}
        <code>colorspace_settings.name = &quot;sRGB&quot;</code> for those passes
        halves the file size with no visible quality loss.
      </p>

      <h2>Selected-to-Active normal baking</h2>
      <p>
        For a hi-poly → lo-poly normal transfer, the selection state matters
        precisely: the hi-poly must be <em>selected</em> and the lo-poly must be{" "}
        <em>active</em>. &ldquo;Active&rdquo; in Python means the object assigned to{" "}
        <code>bpy.context.view_layer.objects.active</code>. Being selected in
        addition does not disqualify an object from being active; the lo-poly
        is both selected and active, while the hi-poly is only selected.
      </p>
      <pre>{`bpy.ops.object.select_all(action="DESELECT")
lo_poly.select_set(True)
bpy.context.view_layer.objects.active = lo_poly
hi_poly.select_set(True)   # add hi-poly as selected source

bpy.ops.object.bake(
    type="NORMAL",
    use_selected_to_active=True,
    cage_extrusion=0.02,    # must exceed the hi-poly's largest surface bump
    margin=16,
    margin_type="EXTEND",
    save_mode="INTERNAL",
)`}</pre>
      <p>
        <code>cage_extrusion</code> sets how far inward from the lo-poly surface
        the rays start. Too small and rays miss the deepest recesses of the hi-poly;
        too large and rays punch through the far side and bake the back face. A
        value of 2&ndash;5% of the object&rsquo;s diameter is a reliable starting point.
        For objects with spikes or deep undercuts, raise it iteratively until
        seam artefacts disappear.
      </p>
      <p>
        Standalone AO and Emission bakes do not use Selected-to-Active — pass
        <code>use_selected_to_active=False</code> and ensure only the lo-poly is
        selected.
      </p>

      <h2>Saving as WebP for the GLB pipeline</h2>
      <p>
        WebP is the Holoflow Studio target format for embedded GLB textures because
        it beats JPEG on quality-per-byte at equivalent compression ratios and
        supports lossless compression for data maps. Saving from a{" "}
        <code>bpy.types.Image</code> requires going through the render image
        settings rather than <code>image.save()</code>, which would default to the
        format the image was created with (EXR for float images):
      </p>
      <pre>{`scene.render.image_settings.file_format = "WEBP"
# Normal maps: lossless-equivalent; AO/emission: quality 90 saves ~40% size
scene.render.image_settings.quality = 100 if is_normal_map else 90
img.save_render(filepath=filepath, scene=scene)`}</pre>

      <h2>Batch loop: auto-discover lo_* / hi_* object pairs</h2>
      <p>
        The script&rsquo;s <code>__main__</code> block scans the scene for objects
        prefixed <code>lo_</code> and builds a hi-poly map by replacing the prefix
        with <code>hi_</code>. This naming convention scales to any number of props
        without editing the script:
      </p>
      <pre>{`lo_names = sorted(o.name for o in bpy.data.objects if o.name.startswith("lo_"))
hi_map = {}
for n in lo_names:
    candidate = n.replace("lo_", "hi_", 1)
    if bpy.data.objects.get(candidate):
        hi_map[n] = candidate

run_batch_bake(lo_names, hi_map)`}</pre>
      <p>
        Objects that have no <code>hi_</code> counterpart receive AO and Emission
        bakes only; the Normal pass falls back to baking the lo-poly against
        itself (flat normals pointing outward), which is still useful for
        encoding consistent tangent-space data into a seamless map.
      </p>

      <h2>Failure modes and troubleshooting</h2>

      <h3>Bake silently writes nothing</h3>
      <p>
        Render engine is not Cycles. Confirm with{" "}
        <code>print(bpy.context.scene.render.engine)</code> before the bake call.
      </p>

      <h3>RuntimeError: no active UV layer</h3>
      <p>
        The lo-poly has no UV map. The script auto-creates one, but its unwrap
        is trivially degenerate (all faces at UV origin). Use Smart UV Project
        (U in Edit Mode) before running the script for meaningful output.
      </p>

      <h3>Black patches at UV island boundaries</h3>
      <p>
        Margin too small. Increase <code>MARGIN_PX</code>; 16px is the minimum
        for 1024&times;1024, 32px is safer at 2048&times;2048.
      </p>

      <h3>Normal map has green seams or inverted detail</h3>
      <p>
        Cage extrusion is too large — rays piercing through the mesh and hitting
        the interior back face. Reduce <code>CAGE_EXTRUDE</code> in 0.005 m
        increments until the seams clear. Also confirm the hi-poly has no
        inverted normals (viewport overlay → Face Orientation should show all
        blue).
      </p>

      <h3>AO map is uniformly white</h3>
      <p>
        Scene has no enclosing geometry. AO samples hemisphere rays from each
        surface point; if nothing blocks those rays, AO is 1.0 everywhere. Add
        a ground plane or enclosure prop before baking, or use the &ldquo;Local&rdquo;
        AO type in Render Properties → Bake → AO.
      </p>

      <h2>Connecting baked maps to the export material</h2>
      <p>
        After the bake completes, build a clean Principled BSDF for export:
      </p>
      <pre>{`# Pseudo-code for post-bake material wiring
image_tex_nm  → Normal Map → Principled BSDF.Normal
image_tex_ao  → Mix Color (Multiply, fac=0.7) → Principled BSDF.Base Color
image_tex_em  → Principled BSDF.Emission Color`}</pre>
      <p>
        The Holoflow glTF exporter (see{" "}
        <Link href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr" className={lk}>
          Principled BSDF v2 → glTF PBR
        </Link>
        ) maps these sockets to standard KHR_materials_* extensions automatically
        provided the node names follow the Principled BSDF convention.
      </p>

      <h2>Further reading</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-texture-baking-normal-ao" className={lk}>
            Texture Baking: Normal & AO (manual workflow)
          </Link>{" "}
          — the hands-on version of this pipeline, covering Selected-to-Active
          cage setup and UV seam placement decisions interactively.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-uv-unwrap-low-poly-stylised" className={lk}>
            UV Unwrap for Low-Poly Stylised
          </Link>{" "}
          — seam placement and island packing decisions that directly affect bake
          quality; run this before the batch script.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-context-temp-override-mesh-repair-pipeline" className={lk}>
            Python bpy.context.temp_override() — Headless Mesh Repair Pipeline
          </Link>{" "}
          — the temp_override pattern used by any Python script that needs to
          call context-sensitive operators in a non-standard context.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-image-pixel-buffer-procedural-bake" className={lk}>
            Python Image Pixel Buffer — Procedural Bake
          </Link>{" "}
          — lower-level alternative: writing directly into{" "}
          <code>image.pixels</code> when the baker is not appropriate (e.g.
          procedural data that does not require ray casting).
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-cycles-panoramic-equirectangular-360-webxr-hdri" className={lk}>
            Cycles Panoramic 360° → WebXR HDRI
          </Link>{" "}
          — Cycles rendering in depth; complements the bake pipeline for
          lighting capture.
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
          — operator, panel, and property group reference implementations in pure
          bpy; the bake and material-wiring examples there are directly applicable
          to pipeline scripts; sibling patterns cover add-on registration and{" "}
          <code>bpy.props</code> schemas.
        </li>
        <li>
          <strong>Blender Foundation</strong> —{" "}
          <em>bpy.ops.object.bake() API Reference</em> (CC-BY-SA 4.0){" "}
          <a
            href="https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.bake"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            docs.blender.org
          </a>{" "}
          — canonical parameter reference covering every{" "}
          <code>type</code> enum value, <code>cage_extrusion</code> behaviour,
          <code>margin_type</code> options, and the{" "}
          <code>save_mode</code> / <code>filepath</code> interaction; consult
          before extending this pipeline to passes not covered here (Diffuse,
          Roughness, Glossy, Shadow, etc.).
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-cycles-batch-bake-normal-ao-emission-webxr",
  title:
    "Python Cycles Batch Bake Pipeline — bpy.ops.object.bake() for Normal, AO & Emission to WebP (Blender 5.1)",
  date: "2026-07-02",
  kind: "tutorial",
  excerpt:
    "bpy.ops.object.bake() is Cycles-only and silent on wrong engine. This pipeline script loops lo_* / hi_* object pairs, injects a disconnected Image Texture node into every material slot, runs Normal / AO / Emission passes, and saves WebP output — 32-bit float for normals, 8-bit sRGB for the rest.",
  tags: [
    "blender",
    "python",
    "scripting",
    "cycles",
    "baking",
    "normal-map",
    "ao",
    "emission",
    "webp",
    "webxr",
    "pipeline",
    "automation",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-cycles-batch-bake-normal-ao-emission-webxr",
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
      "Understands UV unwrapping — smart UV project and island packing",
      "Knows the Selected-to-Active bake model in Blender's Properties panel",
      "Familiar with Principled BSDF node socket names for GLB export",
    ],
  },
  base,
);

export const blenderTutorialPythonCyclesBatchBakeNormalAoEmissionWebxrEntry =
  entry;
