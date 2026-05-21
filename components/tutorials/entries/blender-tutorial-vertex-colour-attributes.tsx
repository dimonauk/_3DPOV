import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function VertexColourAttributesBody() {
  return (
    <>
      <p>
        Blender&rsquo;s <code>mesh.vertex_colors</code> API dates from 2.79.
        Since 3.x it has been superseded by{" "}
        <code>mesh.color_attributes</code>, which introduces an explicit
        choice of domain and data type. The domain choice is the load-bearing
        decision: <strong>CORNER</strong> stores one colour entry per
        face-corner loop index, so adjacent faces can carry different colours
        with a hard boundary between them &mdash; the correct domain for a
        faceted, cel-shaded palette mesh. <strong>POINT</strong> domain stores
        one entry per vertex and averages values at shared vertices, producing
        unwanted colour gradients across palette zone boundaries. The data type
        choice is simpler: <strong>BYTE_COLOR</strong> (unsigned byte,
        0&ndash;255) produces a compact <code>COLOR_0 UNSIGNED_BYTE</code>{" "}
        accessor in the GLB at roughly 4 bytes per vertex; <strong>
        FLOAT_COLOR</strong> produces a <code>COLOR_0 FLOAT</code> accessor at
        16 bytes per vertex. For a palette of four hues the quantisation
        difference in BYTE_COLOR is invisible.
      </p>

      <p>
        The shader side is intentionally minimal:{" "}
        <code>ShaderNodeVertexColor</code> (with <code>layer_name</code> set
        to match the attribute name exactly) feeds into an{" "}
        <code>Emission</code> BSDF rather than Principled. Faceted palette
        assets for WebXR must not respond to scene lighting &mdash; the colour
        is the colour, and any shading variation caused by a point light would
        look like an error rather than art direction. This is the same reasoning
        behind the Emission output in the{" "}
        <Link href="/tutorials/blender-tutorial-flat-shaded-faceted-normals" className={lk}>
          flat-shaded faceted normals tutorial
        </Link>
        . The{" "}
        <Link href="/tutorials/blender-tutorial-uv-unwrap-low-poly-stylised" className={lk}>
          UV unwrap tutorial
        </Link>{" "}
        covers when you do need UV maps &mdash; principally when a texture
        requires sub-face detail that vertex colours cannot resolve.
      </p>

      <p>
        The GLB export requires one flag that is easy to miss:{" "}
        <code>export_colors=True</code>. Without it the glTF-Blender-IO
        exporter silently omits the <code>COLOR_0</code> accessor even when a
        Color Attribute is present and set as the render attribute. The GLB
        loads fine in Don McCurdy&rsquo;s viewer, the mesh renders in its
        material colour, but Three.js&rsquo;s <code>vertexColors</code> flag
        has nothing to read. See the{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
          Blender-to-site asset pipeline
        </Link>{" "}
        for how to verify that <code>COLOR_0</code> arrived in the scene graph,
        and the{" "}
        <Link href="/tutorials/blender-tutorial-faceted-custom-split-normals" className={lk}>
          custom split normals tutorial
        </Link>{" "}
        for the complementary per-face normal technique that sharpens the
        facet silhouette alongside the colour boundary.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-vertex-colour-attributes",
  title:
    "Vertex Colour Attributes: per-face palette painting without UV maps in Blender 5.1",
  date: "2026-05-21",
  kind: "tutorial",
  excerpt:
    "How to paint a four-colour directional palette onto a faceted icosphere using mesh.color_attributes (CORNER domain, BYTE_COLOR type), wire it to an Emission shader, and export the COLOR_0 accessor to a GLB for textureless WebXR rendering.",
  Body: VertexColourAttributesBody,
  related: [
    {
      href: "/tutorials/blender-tutorial-faceted-custom-split-normals",
      label: "Custom split normals — per-face normal control",
    },
    {
      href: "/tutorials/blender-tutorial-uv-unwrap-low-poly-stylised",
      label: "UV unwrap for low-poly stylised meshes",
    },
    {
      href: "/tutorials/blender-tutorial-flat-shaded-faceted-normals",
      label: "Flat-shaded faceted normals + cel-shading",
    },
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Blender → site asset pipeline",
    },
  ],
};

export const entry = buildInstructable(
  {
    time: "45 minutes",
    difficulty: "intermediate",
    prerequisites: [
      "Comfortable running a Python script from the Blender Scripting workspace",
      "Familiar with the Shader Editor: adding nodes, making links",
      "Understands the difference between UV-based textures and vertex-level data",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "BLENDER_EEVEE_NEXT engine required for the record.py render step.",
      },
    ],
    steps: [
      {
        title: "Understand CORNER vs POINT domain before writing any code",
        body: "Open a new Blender file, select the default cube, and go to Properties → Object Data → Color Attributes. Press the + button and create two test attributes: one with domain Face Corner, one with domain Vertex. Switch to Vertex Paint mode and paint a stripe across a face boundary on each. The Face Corner attribute shows a crisp edge; the Vertex attribute bleeds across the boundary because values average at the shared vertices.\n\nThis is the foundational decision: for a palette mesh where different faces must carry different colours with no bleed between them, CORNER is mandatory. For a smooth gradient across a mesh (sky sphere, sky dome), POINT is the right choice. The blueprint uses CORNER throughout.",
      },
      {
        title: "Create the icosphere via bmesh and flat-shade every polygon",
        body: "bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0) produces 80 triangular faces in headless mode without a viewport context. bpy.ops.mesh.primitive_ico_sphere_add() would also work but requires an active 3D viewport — use the bmesh route for --background scripts.\n\nAfter calling bm.to_mesh(mesh), set poly.use_smooth = False on every polygon. This is a prerequisite for the palette to read correctly: use_smooth=True enables Gouraud shading that interpolates normals across the face, which makes the shading vary within a face even when the colour is constant. Flat-shading keeps the normal (and therefore any lighting response) constant per face, so the only variation the viewer sees is the colour itself.",
      },
      {
        title: "Create the CORNER BYTE_COLOR attribute and paint per-face",
        body: "attr = mesh.color_attributes.new(name='Col', type='BYTE_COLOR', domain='CORNER')\n\nFor each polygon, call pick_colour(poly.normal) to select one of the four palette tuples, then write it to every loop index in poly.loop_indices:\n\n  for loop_idx in poly.loop_indices:\n      attr.data[loop_idx].color = colour\n\nattr.data is indexed by loop index — the same integer space as mesh.loops. A triangle has three loop indices; a quad has four. All corners of the same face receive the same tuple here, making the face appear solid. Adjacent faces differ because CORNER stores values per-corner independently.\n\nAfter filling the data, set both active_color_index and render_color_index to mesh.color_attributes.find('Col'). EEVEE reads from the active attribute in Vertex Paint mode; the glTF exporter reads from the render attribute. They must point to the same attribute or the viewer and the GLB will show different colours.",
      },
      {
        title: "Wire the Vertex Color node into Emission — not Principled",
        body: "In the material node tree:\n\n  vcol = nodes.new('ShaderNodeVertexColor')\n  vcol.layer_name = 'Col'   # case-sensitive, must match exactly\n  emit = nodes.new('ShaderNodeEmission')\n  links.new(vcol.outputs['Color'], emit.inputs['Color'])\n  links.new(emit.outputs['Emission'], out.inputs['Surface'])\n\nvcol.layer_name must match the string passed to color_attributes.new(name=…) exactly, including capitalisation. If it does not match, the node silently shows (1, 1, 1) white rather than the attribute data.\n\nEmission BSDF is the correct choice for flat cel assets: it outputs the stored colour with no lighting calculation. For a Principled-shaded version, replace Emission with a Principled BSDF node and connect vcol.outputs['Color'] to Principled.inputs['Base Color'] — this keeps the vertex colour as the albedo but allows scene lights to shade it, giving a slightly plastic faceted look.",
      },
      {
        title: "Export with export_colors=True and verify COLOR_0 in the GLB",
        body: "bpy.ops.export_scene.gltf(filepath=str(GLB_OUT), export_format='GLB', use_selection=True, export_colors=True, export_normals=True, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6)\n\nexport_colors=True is the single flag that controls whether the COLOR_0 accessor is written. It defaults to True in recent glTF-Blender-IO builds, but the blueprint passes it explicitly to guard against future default changes.\n\nVerify in Don McCurdy's glTF Viewer (https://gltf-viewer.donmccurdy.com): drag the GLB, expand Meshes → vertex_colour_demo → Primitives [0] and confirm COLOR_0 is listed. In Three.js, set material.vertexColors = true and confirm the mesh renders with the four palette zones visible without any texture load.",
      },
    ],
    finalResult:
      "A GLB containing a flat-shaded icosphere with 80 triangular faces painted in a four-colour directional palette (amber top cap, teal / rose equatorial band, indigo bottom cap). The COLOR_0 accessor is present, Draco-compressed, and readable by Three.js vertexColors with no UV map or image texture. The source .blend retains the live Color Attribute for in-Blender Vertex Paint editing.",
    variations: [
      "Random palette per face: replace the directional _pick() function with random.choice(PALETTE) seeded by a constant. This produces a mosaic look rather than banded zones. Use random.seed(42) before the loop so results are deterministic across runs.",
      "Five-colour gradient with ColorRamp: add a ShaderNodeValToRGB (ColorRamp) set to CONSTANT interpolation between the Vertex Color node and the Emission input. Wire a ShaderNodeSeparateColor → G channel between vcol and the ColorRamp Factor input to isolate the green channel as a luminance proxy. This lets you define the palette bands in the shader rather than in the attribute data, keeping the attribute as a single float channel instead of RGB.",
      "Animated palette swap: keyframe mesh.color_attributes.render_color_index over a timeline with two attributes ('Col_A', 'Col_B') holding different palettes. The glTF exporter picks up only the render attribute at export time — render_color_index is a Python property, not an animatable ID property, so this technique is for in-Blender animation previews, not GLB output.",
    ],
    troubleshooting: [
      {
        symptom: "COLOR_0 is absent from the GLB mesh primitives",
        cause:
          "export_colors=False or not passed (was False in older glTF-Blender-IO builds), or render_color_index was not set to the 'Col' attribute index before export.",
        fix: "Pass export_colors=True explicitly. Confirm mesh.color_attributes.render_color_index == mesh.color_attributes.find('Col') before calling the export operator. Re-export and re-check in glTF Viewer.",
      },
      {
        symptom:
          "Vertex Color node shows white (1, 1, 1) in rendered view despite the attribute being present",
        cause:
          "vcol.layer_name does not match the color_attributes name. Blender silently falls back to white rather than erroring.",
        fix: "Print mesh.color_attributes['Col'].name in the Python console to confirm the exact string, then set vcol.layer_name to that string. Case-sensitive match required.",
      },
      {
        symptom:
          "Colour bleeds across face boundaries — adjacent faces share a blurred edge colour",
        cause:
          "Color Attribute was created with domain='POINT' instead of domain='CORNER'.",
        fix: "Delete the POINT attribute and create a new one with domain='CORNER'. There is no in-place domain conversion; you must recreate and repaint. The blueprint uses CORNER throughout to avoid this.",
      },
    ],
  },
  base,
);
