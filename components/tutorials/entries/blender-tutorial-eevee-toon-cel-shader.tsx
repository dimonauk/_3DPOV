import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function EeveeToonCelShaderBody() {
  return (
    <>
      <p>
        Cel-shading in Blender 5.1 is a two-node trick: <strong>Shader to
        RGB</strong> extracts EEVEE&rsquo;s per-fragment diffuse intensity as a
        plain colour channel, and a <strong>ColorRamp set to CONSTANT
        interpolation</strong> snaps that 0&ndash;1 value to hard colour bands.
        The result is the flat, graphically clean shading found in animated
        films and stylised games — no post-processing, no compositing pass, no
        custom render engine.
      </p>

      <p>
        The critical constraint is that <em>Shader to RGB only works in EEVEE
        Next</em>. EEVEE evaluates diffuse shading analytically per fragment and
        can expose the result as a scalar. Cycles has no equivalent: it
        accumulates stochastic light paths, and the BSDF is a probability
        distribution, not a readable scalar. Running this node tree in a Cycles
        scene returns black. The technique is therefore deliberate to the
        real-time pipeline — useful for viewport previews, game assets, and
        WebXR delivery after a bake step.
      </p>

      <p>
        This tutorial packages the shader into a reusable{" "}
        <code>ShaderNodeTree</code> node group named{" "}
        <code>HoloflowToonShader</code>, built entirely via{" "}
        <code>bpy.data</code> — no <code>bpy.ops</code>, no UI context, no
        modal operators. The group exposes six named inputs (Base Colour, Shadow
        Colour, Lit Colour, Rim Colour, Toon Step, Rim Threshold) so each
        material can override colours without touching the shared node graph.
        The rim highlight uses a dot product between{" "}
        <code>Geometry.Incoming</code> and <code>Geometry.Normal</code> to paint
        a hard-edged glow along every silhouette — the same principle used in
        hand-drawn ink line production. For the flat-polygon geometry that the
        rim reads best on, see the{" "}
        <Link href="/tutorials/blender-tutorial-flat-shaded-faceted-normals" className={lk}>
          flat-shaded faceted normals tutorial
        </Link>
        : flat shading amplifies the toon step edge at each polygon border,
        which is the studio&rsquo;s signature look. For baking this EEVEE
        material to a texture so the result survives the glTF pipeline into
        WebXR, the full pipeline is in the{" "}
        <Link href="/tutorials/blender-tutorial-texture-baking-normal-ao" className={lk}>
          texture baking tutorial
        </Link>
        . An alternative delivery route — painting the toon bands as vertex
        colours directly onto the mesh — is covered in the{" "}
        <Link href="/tutorials/blender-tutorial-vertex-colour-attributes" className={lk}>
          vertex colour attributes tutorial
        </Link>
        . The cobalt-palette faceted gem that the studio&rsquo;s EEVEE rendering
        is set up for appears in the{" "}
        <Link href="/tutorials/blender-tutorial-faceted-gem-webxr" className={lk}>
          faceted gem WebXR tutorial
        </Link>
        , where the same EEVEE Next engine setting is used.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-eevee-toon-cel-shader",
  title:
    "EEVEE Next toon / cel-shader node group: Shader to RGB + CONSTANT ColorRamp in Blender 5.1",
  date: "2026-05-22",
  kind: "tutorial",
  excerpt:
    "How to build a reusable HoloflowToonShader node group using Shader to RGB and a CONSTANT-interpolation ColorRamp to create hard toon bands, plus a rim-light pass from Geometry.Incoming — built entirely via bpy.data with no bpy.ops dependency.",
  Body: EeveeToonCelShaderBody,
  related: [
    {
      href: "/tutorials/blender-tutorial-flat-shaded-faceted-normals",
      label: "Tutorial — Flat-shaded faceted normals",
      note: "Flat shading per polygon amplifies the toon step edge at every polygon border — the prerequisite geometry setup for this shader.",
    },
    {
      href: "/tutorials/blender-tutorial-texture-baking-normal-ao",
      label: "Tutorial — Texture baking (Normal + AO)",
      note: "Bake the EEVEE toon render to a colour texture for glTF-compliant WebXR delivery — the necessary pipeline step after building this shader.",
    },
    {
      href: "/tutorials/blender-tutorial-vertex-colour-attributes",
      label: "Tutorial — Vertex colour attributes",
      note: "Paint toon colour bands directly as vertex colours — an alternative to the EEVEE Shader to RGB approach that exports cleanly to GLB without a bake.",
    },
    {
      href: "/tutorials/blender-tutorial-faceted-gem-webxr",
      label: "Tutorial — Faceted gem WebXR",
      note: "Studio gem with EEVEE Next cobalt palette — shows the same engine context this toon shader targets.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/shader_to_rgb.html",
      label:
        "Blender Manual — Shader to RGB node (CC-BY-SA 4.0 — Blender Foundation contributors)",
      note: "Full socket reference. Key detail: the Shader input accepts any BSDF, but the output colour encodes the EEVEE-evaluated diffuse factor only — specular and emission components are not separated. Related projects: blender/blender source tree (GPL-2.0, not used here), blender-extensions-platform.",
    },
    {
      href: "https://docs.blender.org/manual/en/latest/render/shader_nodes/converter/color_ramp.html",
      label:
        "Blender Manual — ColorRamp node (CC-BY-SA 4.0 — Blender Foundation contributors)",
      note: "CONSTANT vs LINEAR interpolation modes; element insertion via elements.new(position); the alpha channel output (useful as the rim blend factor in this tutorial). Related: Blender Manual — Shader Editor reference.",
    },
    {
      href: "https://github.com/KhronosGroup/glTF-Blender-IO",
      label: "glTF-Blender-IO (Apache-2.0 — Khronos Group contributors)",
      note: "Source for the KHR_materials_emissive_strength mapping. io_scene_gltf2/blender/exp/gltf2_blender_gather_materials.py maps ShaderNodeEmission to the emissive factor and the extension's strength multiplier. Related sibling repos: KhronosGroup/glTF-Sample-Models (Apache-2.0), KhronosGroup/glTF-Sample-Viewer (BSD-2-Clause).",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "one to two hours",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Comfortable with Blender's node editor and the Shader Editor workspace.",
      "Blender 5.1 installed and able to run blueprint.py headlessly (--background mode).",
      "Familiar with bpy.data.materials.new() and mat.use_nodes = True.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Render engine must be BLENDER_EEVEE_NEXT. Shader to RGB returns black in Cycles.",
      },
    ],
    steps: [
      {
        title: "Create the ShaderNodeTree node group",
        body: "Node groups for shading use type='ShaderNodeTree', not 'GeometryNodeTree':\n\n  tree = bpy.data.node_groups.new(type='ShaderNodeTree', name='HoloflowToonShader')\n\nDeclare the interface sockets using the 4.0+ API:\n\n  tree.interface.new_socket('Shader', in_out='OUTPUT', socket_type='NodeSocketShader')\n  tree.interface.new_socket('Base Colour', in_out='INPUT', socket_type='NodeSocketColor')\n  tree.interface.new_socket('Toon Step', in_out='INPUT', socket_type='NodeSocketFloat')\n\nSocket insertion order matters: the first OUTPUT is Shader (index 0); the first INPUT is Base Colour (index 0). When a ShaderNodeGroup node in a material references this group, its inputs array mirrors this order. NodeSocketShader as output type is mandatory — the Material Output node only accepts Shader connections.\n\nNote: the older API tree.outputs.new('NodeSocketShader', 'Shader') was removed in Blender 4.0. Any tutorial using it will raise AttributeError on the first execution.",
      },
      {
        title: "Wire the Diffuse BSDF → Shader to RGB → CONSTANT ColorRamp",
        body: "These three nodes form the core of the cel-shader:\n\n  n_diff  = nodes.new('ShaderNodeBsdfDiffuse')\n  n_s2rgb = nodes.new('ShaderNodeShaderToRGB')\n  n_toon  = nodes.new('ShaderNodeValToRGB')\n  n_toon.color_ramp.interpolation = 'CONSTANT'\n\nConnect Base Colour from the Group Input to the Diffuse BSDF:\n\n  links.new(n_in.outputs['Base Colour'], n_diff.inputs['Color'])\n  links.new(n_diff.outputs['BSDF'], n_s2rgb.inputs['Shader'])\n  links.new(n_s2rgb.outputs['Color'], n_toon.inputs['Fac'])\n\nShader to RGB outputs two sockets: 'Color' (the diffuse factor as greyscale, 0–1) and 'Alpha' (the transparency factor). Connect 'Color' to the ColorRamp's 'Fac' input.\n\nSet the ColorRamp stops:\n\n  cr = n_toon.color_ramp\n  cr.elements[0].position = 0.0        # shadow band starts at black\n  cr.elements[0].color    = SHADOW_COLOUR\n  cr.elements[1].position = TOON_STEP  # lit band starts at TOON_STEP\n  cr.elements[1].color    = LIT_COLOUR\n\nWith CONSTANT interpolation, every Fac value below TOON_STEP maps to elements[0].color (shadow), and every value at or above maps to elements[1].color (lit). The hard boundary between them is the toon shadow edge.",
      },
      {
        title: "Build the rim-light pass with Geometry.Incoming",
        body: "The rim uses the angle between the surface normal and the camera's incident direction:\n\n  n_geo = nodes.new('ShaderNodeNewGeometry')\n  n_dot = nodes.new('ShaderNodeVectorMath')\n  n_dot.operation = 'DOT_PRODUCT'\n  n_add = nodes.new('ShaderNodeMath')\n  n_add.operation = 'ADD'\n  n_add.inputs[1].default_value = 1.0\n\n  links.new(n_geo.outputs['Normal'],   n_dot.inputs[0])\n  links.new(n_geo.outputs['Incoming'], n_dot.inputs[1])\n  links.new(n_dot.outputs['Value'],    n_add.inputs[0])\n\nDOT_PRODUCT in ShaderNodeVectorMath outputs a scalar to outputs['Value'] (index 1), not to outputs['Vector'] (index 0). Connecting outputs[0] instead silently passes a zero vector and the rim will never appear — this is the most common wiring mistake for this technique.\n\nThe dot product of Normal and Incoming is –1 for a surface facing the camera (normal toward camera, incoming away) and 0 at the silhouette (perpendicular). Adding 1.0 shifts the range to [0, 1]: 0 = front-facing, 1 = silhouette edge. A CONSTANT ColorRamp with threshold at RIM_THRESHOLD creates a hard rim band of configurable width. The rim ramp's Alpha output is used as the MixRGB blend factor.",
      },
      {
        title: "Combine toon colour and rim, output via Emission",
        body: "MixRGB blends the toon colour (Color1) toward the rim colour (Color2) wherever the rim mask = 1:\n\n  n_mix = nodes.new('ShaderNodeMixRGB')\n  n_mix.blend_type = 'MIX'\n  n_mix.use_clamp  = True\n\n  links.new(n_toon.outputs['Color'],      n_mix.inputs['Color1'])\n  links.new(n_rim_ramp.outputs['Alpha'],  n_mix.inputs['Fac'])\n  links.new(n_in.outputs['Rim Colour'],   n_mix.inputs['Color2'])\n\nUsing the rim ramp's Alpha rather than Color output: in a two-stop CONSTANT ramp, Alpha follows the same quantised pattern as Color but returns 0.0 or 1.0 as a scalar, which is a cleaner blend factor than a colour vector.\n\nEmission bypasses PBR:\n\n  n_emit = nodes.new('ShaderNodeEmission')\n  n_emit.inputs['Strength'].default_value = 1.0\n  links.new(n_mix.outputs['Color'], n_emit.inputs['Color'])\n  links.new(n_emit.outputs['Emission'], n_out.inputs['Shader'])\n\nUsing Principled BSDF instead of Emission would apply a second EEVEE lighting pass to the already-computed toon colour, destroying the flat-band look: the shadow band would receive a further greyscale modulation from EEVEE's indirect lighting. Emission renders whatever colour it receives, unmodified.",
      },
      {
        title: "Apply the group to a material and export",
        body: "Create a material that instances the shared group:\n\n  mat = bpy.data.materials.new(name='ToonDemoMaterial')\n  mat.use_nodes = True\n  mat.node_tree.nodes.clear()\n\n  n_out   = mat.node_tree.nodes.new('ShaderNodeOutputMaterial')\n  n_group = mat.node_tree.nodes.new('ShaderNodeGroup')\n  n_group.node_tree = bpy.data.node_groups['HoloflowToonShader']\n\n  # Per-material colour overrides (do not touch the shared group)\n  n_group.inputs['Shadow Colour'].default_value = SHADOW_COLOUR\n  n_group.inputs['Rim Colour'].default_value    = RIM_COLOUR\n  n_group.inputs['Toon Step'].default_value     = TOON_STEP\n\n  mat.node_tree.links.new(n_group.outputs['Shader'], n_out.inputs['Surface'])\n\nExport:\n\n  bpy.ops.export_scene.gltf(\n      filepath=str(GLB_OUT),\n      export_format='GLB',\n      use_selection=True,\n      export_apply=True,\n      export_materials='EXPORT',\n      export_image_format='WEBP',\n  )\n\nThe GLB will use KHR_materials_emissive_strength. For WebXR delivery, follow up with the texture-baking tutorial to convert the toon render to a Principled BSDF Emission texture.",
      },
    ],
    finalResult:
      "A reusable HoloflowToonShader node group stored in bpy.data.node_groups, applied to a flat-shaded icosphere as ToonDemoMaterial. The source .blend exposes all toon parameters as named group inputs editable in the Shader Editor. The GLB exports the shape with Emission-based material via KHR_materials_emissive_strength, ready for further bake-to-texture if WebXR PBR compliance is required.",
    variations: [
      "Three-band toon (shadow / mid-tone / lit): call cr.elements.new(position=0.70) to add a third stop to the toon ColorRamp, then set its colour to a mid-value between shadow and lit. CONSTANT interpolation will use the stop at position 0.0 for Fac < 0.45, the new stop for 0.45 ≤ Fac < 0.70, and the lit stop at Fac ≥ 0.70. A third band around 0.90 with a brighter, slightly desaturated colour creates a specular glint without a separate specular pass.",
      "Coloured rim: change the Rim Colour group input to a warm amber or magenta to suggest a backlight or sunset rim. Because the rim is blended via MixRGB rather than Add, it replaces the toon colour at the silhouette rather than overexposing it — correct for a hard cel style. For an additive glow rim, replace the MixRGB blend_type='MIX' with 'ADD' and reduce Rim Colour brightness to avoid overexposure.",
      "Multiple materials sharing one group: create a second material with make_toon_material(name='ToonVariant', lit_colour=(0.8, 0.2, 0.1, 1.0)). Both materials point to the same HoloflowToonShader datablock. Editing the ColorRamp inside the group — e.g. changing the toon step position — updates both materials instantly. Per-material shadow and rim colours remain independent because they are set on each material's Group node inputs, not inside the shared group.",
    ],
    troubleshooting: [
      {
        symptom: "Viewport renders black even with EEVEE selected",
        cause: "The render engine is set to BLENDER_EEVEE (legacy EEVEE), not BLENDER_EEVEE_NEXT. Shader to RGB requires the NEXT variant available since Blender 4.2.",
        fix: "Set bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT' in the script. In the UI: Properties → Render → Render Engine → EEVEE. If the option is not available, the Blender version is below 4.2.",
      },
      {
        symptom: "Rim highlight never appears — sphere looks flat two-tone only",
        cause: "The DOT_PRODUCT outputs['Value'] is not connected; the Vector output (index 0) was wired instead.",
        fix: "Change n_dot.outputs['Value'] to the explicit outputs[1] if using index access, or use the string key 'Value'. The DOT_PRODUCT result is always a scalar at outputs['Value']. Confirm by opening the Shader Editor and verifying that the Math Add node receives a live scalar, not a zero-vector default.",
      },
      {
        symptom: "AttributeError: 'NodeTreeInterface' has no attribute 'new'",
        cause: "The script uses tree.inputs.new() or tree.outputs.new() — the pre-Blender-4.0 API that was removed.",
        fix: "Replace all tree.inputs.new() calls with tree.interface.new_socket(name, in_out='INPUT', socket_type='NodeSocketFloat'). The blueprint.py in this entry uses the correct 5.1 API throughout.",
      },
      {
        symptom: "GLB loads in Three.js but the sphere emits no colour — it is black",
        cause: "KHR_materials_emissive_strength is not supported in older Three.js versions or the emissive factor is (0,0,0) because the Emission Colour defaulted to black.",
        fix: "Confirm that n_emit.inputs['Color'] is connected to the MixRGB output before export. In Three.js r149+, KHR_materials_emissive_strength is handled; below r149, set MeshStandardMaterial.emissive manually. For a guaranteed-clean pipeline, bake the EEVEE render to a texture and apply it as a plain emissive map — see the texture-baking-normal-ao tutorial.",
      },
    ],
  },
  base,
);
