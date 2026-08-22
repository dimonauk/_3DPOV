import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ShaderPrincipledTransmissionIridescenceBody() {
  return (
    <>
      <p>
        The Principled BSDF underwent a significant rename and extension pass
        in Blender 4.0 — and those socket names carry unchanged into 5.1.
        Three of the additions combine into something that has no clean name in
        the shader-node documentation but is immediately recognisable when
        rendered: a holographic gem that refracts light, changes colour with
        viewing angle, and carries a surface polish overcoat, all from one
        material node with no custom node groups, no add-ons, no post-processing
        compositing pass.
      </p>

      <p>
        The first ingredient is <strong>Transmission Weight</strong> — the
        socket that was called simply{" "}
        <code>&apos;Transmission&apos;</code> in every 3.x tutorial you may
        have followed. It routes a fraction of incoming light through the
        surface using a full dielectric Fresnel model.{" "}
        <em>Alpha</em>, by contrast, just makes the geometry transparent: it
        discards the fragment. Transmission preserves the surface, evaluates
        refraction through the IOR-specified dielectric interface, and in Cycles
        produces the total-internal-reflection pattern that makes polished stone
        visually distinct from frosted plastic. At{" "}
        <code>Roughness &lt; 0.08</code> the specular lobe is tight enough that
        the gem reads as polished. Above <code>0.15</code> it reads as satin
        glass. The transition is sharp and intentional.
      </p>

      <p>
        The second ingredient is <strong>Iridescence Thickness</strong> (nm).
        Thin-film interference is the physics of soap bubbles and butterfly
        wings: when light travels through a film with a different refractive
        index from the surrounding medium, the portion that reflects from the
        far face of the film either constructively or destructively reinforces
        the portion reflecting from the near face. Which wavelength interferes
        constructively depends on the film thickness — blue for a thin film,
        red/amber for a thicker one. In a gem, this effect appears at cleaved
        surfaces and polished pavilion facets. The physically correct way to
        produce a rainbow that sweeps across the gem is to{" "}
        <em>vary the Thickness across the surface</em>, not to drive
        Iridescence Weight from a colour texture. This tutorial wires a{" "}
        <strong>Wave Texture → Map Range → Iridescence Thickness</strong> chain
        so that each band position corresponds to a different nm value, and
        therefore to a different spectral peak. For the cel-shading approach that
        fakes colour bands without physical basis, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
          className={lk}
        >
          EEVEE toon cel-shader tutorial
        </Link>
        .
      </p>

      <p>
        The third ingredient is <strong>Coat Weight</strong> (formerly{" "}
        <code>Clearcoat</code> in 3.x). It models the superficial polish layer
        of a cut gem — a smooth lacquer above the Transmission path. The Coat
        adds a second specular lobe without coupling into the Transmission
        integral, so both the sharp surface reflection and the deep glass
        refraction are independently controllable. Setting Coat Roughness to
        0.02 makes the polish mirror-sharp while leaving Roughness at 0.04 for
        the underlying gem body. This is the same physical layering as the{" "}
        <Link
          href="/tutorials/blender-tutorial-faceted-gem-webxr"
          className={lk}
        >
          faceted gem WebXR tutorial
        </Link>{" "}
        except built entirely in Principled BSDF rather than from separate
        BSDF mix nodes.
      </p>

      <p>
        For the gem mesh, the blueprint uses an icosphere at subdivision level 3
        (1 280 triangles). The triangular facets read better than quads for
        iridescence interpolation across sharp edge angles, and the inherent
        variation in face orientation across the icosphere ensures the
        thin-film interference looks different at every facet — the same reason
        a cut gem looks different from a smooth sphere. For the full treatment
        of custom split normals to control how flat vs smooth a faceted gem
        reads, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-faceted-custom-split-normals"
          className={lk}
        >
          faceted custom split normals tutorial
        </Link>
        .
      </p>

      <p>
        For WebXR delivery, the exported GLB carries two Khronos extensions:{" "}
        <code>KHR_materials_transmission</code> (Three.js r150+) and{" "}
        <code>KHR_materials_iridescence</code> (Three.js r152+). Both are
        written automatically by Blender&apos;s built-in glTF-IO exporter when
        the corresponding Principled BSDF inputs are non-zero — no manual
        extension flag is required. If the target runtime does not support these
        extensions, the fallback is the base colour plus specular, which reads as
        an opaque gemstone rather than a glass one. To bake the full EEVEE
        Transmission+Iridescence render to a plain colour texture for older
        runtimes, the pipeline is in the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          texture baking tutorial
        </Link>
        .
      </p>

      <p>
        One design note on the Voronoi texture in the node tree: the blueprint
        uses <strong>F2 mode</strong> (distance to the second nearest point)
        rather than F1 or Distance to Edge. F2 creates a bright ring around each
        Voronoi cell with a darker interior, analogous to the crystal planes
        inside a cut gem that scatter light along cleavage faces. This internal
        structure is visible through the Transmission window at low blend weight
        (0.24) and disappears at zero — it is the difference between a gem and a
        glass marble. For alternative colour-attribute approaches to internal
        structure, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-vertex-colour-attributes"
          className={lk}
        >
          vertex colour attributes tutorial
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-shader-principled-transmission-iridescence",
  title:
    "Principled BSDF v2 — Transmission + Iridescence: holographic gem shader in Blender 5.1",
  date: "2026-06-03",
  kind: "tutorial",
  excerpt:
    "How to wire Transmission Weight, Iridescence Thickness (nm), and Coat Weight to build a physically correct holographic gem material — with Wave Texture driving the thin-film spectrum sweep, Voronoi F2 adding internal crystal planes, and Noise Bump for micro-surface scattering. GLB exports KHR_materials_transmission + KHR_materials_iridescence automatically.",
  Body: ShaderPrincipledTransmissionIridescenceBody,
  related: [
    {
      href: "/tutorials/blender-tutorial-faceted-gem-webxr",
      label: "Tutorial — Faceted gem WebXR",
      note: "The gem mesh this material targets — faceted icosphere prepared and exported for the WebXR pipeline.",
    },
    {
      href: "/tutorials/blender-tutorial-eevee-toon-cel-shader",
      label: "Tutorial — EEVEE toon / cel-shader",
      note: "Alternative shading approach using Shader to RGB + CONSTANT ColorRamp — same EEVEE Next engine context, different physical model.",
    },
    {
      href: "/tutorials/blender-tutorial-texture-baking-normal-ao",
      label: "Tutorial — Texture baking (Normal + AO)",
      note: "Bake the Transmission + Iridescence render to a colour texture for runtimes that do not support KHR_materials_iridescence.",
    },
    {
      href: "/tutorials/blender-tutorial-faceted-custom-split-normals",
      label: "Tutorial — Faceted custom split normals",
      note: "Control facet sharpness with custom split normals — the prerequisite geometry step before applying this material.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/principled.html",
      label:
        "Blender Manual — Principled BSDF (CC-BY-SA 4.0 — Blender Foundation contributors)",
      note: "Full socket reference with the 4.0 rename table. Key detail: Iridescence Thickness range is clamped to 0–1000 nm internally; the Map Range node must constrain Wave.Fac to a physically meaningful sub-range. Related projects: blender/blender (GPL-2.0, not used here), OpenPBR Initiative (Apache-2.0) — the upstream physical basis for Principled BSDF v2.",
    },
    {
      href: "https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_iridescence",
      label:
        "KHR_materials_iridescence spec (Apache-2.0 — Khronos Group contributors)",
      note: "Defines iridescenceThicknessMinimum and iridescenceThicknessMaximum as the nm range, with iridescenceTexture driving the 0–1 interpolation. Blender's exporter writes iridescenceThicknessMinimum from the Map Range To Min value and Maximum from To Max. Related sibling specs: KHR_materials_transmission (r150+), KHR_materials_ior (r152+), KHR_materials_specular — all exported automatically by Blender's glTF-IO when the corresponding Principled BSDF sockets are non-zero.",
    },
    {
      href: "https://github.com/KhronosGroup/glTF-Blender-IO",
      label:
        "glTF-Blender-IO (Apache-2.0 — Khronos Group contributors)",
      note: "The source exporter included with Blender. io_scene_gltf2/blender/exp/material/extensions/gltf2_blender_gather_materials_iridescence.py maps 'Iridescence Weight', 'Iridescence IOR', and 'Iridescence Thickness' sockets to their glTF JSON counterparts. Related sibling repos: KhronosGroup/glTF-Sample-Models (Apache-2.0), KhronosGroup/glTF-Sample-Viewer (BSD-2-Clause).",
    },
  ],
};

const entry: Entry = buildInstructable(
  {
    time: "one to two hours",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Comfortable with the Shader Editor and node trees in Blender.",
      "Blender 5.1 installed; can run a .py script via Text Editor or --background.",
      "Familiar with bpy.data.materials.new() and mat.use_nodes = True.",
      "Optional: familiarity with the faceted-gem-webxr tutorial for the mesh context.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Principled BSDF v2 with Iridescence sockets requires Blender 4.0+. Cycles for production render; EEVEE Next for real-time preview with SSR refraction enabled.",
      },
    ],
    steps: [
      {
        title: "Understand Transmission Weight vs Alpha",
        body: "Both sockets make geometry look transparent, but the physics differ entirely:\n\n  Alpha = 0         → fragment discarded; geometry invisible\n  Transmission = 1  → Fresnel-weighted refraction; geometry keeps surface\n\nAt Transmission = 0.92, 92% of light that hits the surface is refracted through it according to Snell's law at the given IOR. The Fresnel term further increases surface reflection at grazing angles — so the gem rim appears reflective and the centre appears glassy, just like a physical stone. Setting Alpha < 1 on the same material would cause both effects to overlap incorrectly: you'd get Fresnel reflection AND an alpha hole at the same point.\n\nIn EEVEE Next, screen-space refraction must be enabled for Transmission to show any content behind the mesh:\n\n  scene.eevee.use_ssr            = True\n  scene.eevee.use_ssr_refraction = True\n\nIn Cycles, no extra flag is needed; the path tracer handles bidirectional glass traversal natively.\n\nNote: 'Transmission Weight' is the 4.0+ socket name. Using 'Transmission' (the 3.x name) raises KeyError in Blender 5.1. The blueprint documents both names to catch this migration error.",
      },
      {
        title: "Drive Iridescence Thickness (nm) from a Wave Texture",
        body: "A common mistake: wiring a colour texture to Iridescence Weight. That brightens or dims the iridescence effect — it does not sweep the spectrum. To get a rainbow, the film *thickness* must vary, because constructive interference wavelength = f(thickness).\n\nThe node chain:\n\n  1. Wave Texture.Fac   → outputs greyscale 0–1 across the surface\n  2. Map Range           → maps 0–1 to physical nm range (e.g. 270–680)\n  3. Principled BSDF.Iridescence Thickness\n\nMap Range setup:\n\n  n_mr = nodes.new('ShaderNodeMapRange')\n  n_mr.inputs['From Min'].default_value = 0.0\n  n_mr.inputs['From Max'].default_value = 1.0\n  n_mr.inputs['To Min'].default_value   = 270.0   # violet\n  n_mr.inputs['To Max'].default_value   = 680.0   # red\n\nWhy 270–680 nm: this is the visible spectrum (380–700 nm) narrowed slightly toward the blue end to bias the gem toward the studio's sapphire palette. Raising To Min to 400 shifts the bias toward green/yellow. Raising To Max to 900 adds infrared overlap, which broadens the red band and reduces colour saturation.\n\nWave Texture settings:\n\n  n_wave.wave_type       = 'BANDS'\n  n_wave.bands_direction = 'DIAGONAL'\n  n_wave.wave_profile    = 'SIN'\n\nDIAGONAL direction is critical: HORIZONTAL and VERTICAL create bands parallel to the icosphere's latitude/longitude lines, which look like a rendering artefact rather than natural diffraction. DIAGONAL reads as organic.",
      },
      {
        title: "Build the Voronoi F2 internal crystal structure",
        body: "The Voronoi node in F2 mode returns the distance to the second nearest Voronoi point. This creates a bright ring around each cell with a darker interior:\n\n  n_vor = nodes.new('ShaderNodeTexVoronoi')\n  n_vor.voronoi_dimensions = '3D'\n  n_vor.feature            = 'F2'\n  n_vor.distance           = 'EUCLIDEAN'\n  n_vor.inputs['Scale'].default_value      = 13.0\n  n_vor.inputs['Randomness'].default_value = 0.80\n\nF1 would return a smooth blob-per-cell. DISTANCE_TO_EDGE would return only the cell edge as a thin line. F2 is the middle ground: a visible gradient from cell interior to boundary, analogous to how crystal planes in a real sapphire catch and scatter light.\n\nThe F2 Distance output (0 = centre, 1 = far edge) is wired to the Factor input of a Mix Color node:\n\n  n_mix.data_type  = 'RGBA'\n  n_mix.blend_type = 'MIX'\n  n_mix.inputs['A'].default_value = BASE_COLOUR        # deep blue\n  n_mix.inputs['B'].default_value = (0.86, 0.93, 1.0, 1.0)  # ice blue\n  links.new(n_vor.outputs['Distance'], n_mix.inputs['Factor'])\n\nNote: ShaderNodeMix with data_type='RGBA' is the Blender 4.0+ API. The older ShaderNodeMixRGB still works in 5.1 but is deprecated. If you see tutorials using MixRGB, the node identifier and input names are slightly different — Factor vs Fac, A/B vs Color1/Color2.\n\nAt Factor 0.0 (cell interior) the Base Colour shows. At Factor ~1.0 (cell boundary) the ice-blue bleeds in. Because these colour shifts are visible through the Transmission window from inside the gem, they read as depth variation rather than surface colour variation — a subtle but important spatial cue.",
      },
      {
        title: "Noise Bump for micro-surface scattering",
        body: "A perfectly smooth gem (Bump Strength = 0) renders a mathematically perfect specular lobe. Real gems have micro-scratches and surface chemistry variations that scatter the specular highlight into a soft glow. The Bump node implements this without adding geometry:\n\n  n_bump = nodes.new('ShaderNodeBump')\n  n_bump.inputs['Strength'].default_value = 0.22\n  n_bump.inputs['Distance'].default_value = 0.002   # 2 mm\n  links.new(n_noise.outputs['Fac'], n_bump.inputs['Height'])\n  links.new(n_bump.outputs['Normal'], n_pbsdf.inputs['Normal'])\n\nWHY bump not displacement: Displacement raises actual geometry and would create micro-spikes on the icosphere silhouette, visibly disrupting the gem outline. Bump perturbs the normal vector used in BSDF evaluation only — the geometry stays smooth, but the specular lobe is scattered as if the surface were rough.\n\nKeep Bump Strength low (< 0.3) on a transmissive gem. High bump strength causes the Transmission rays to refract in random directions, producing a caustic-like noise pattern that destroys the smooth glass appearance.\n\nNoise Texture setup for micro-scale imperfections:\n\n  n_noise.noise_dimensions               = '3D'\n  n_noise.inputs['Scale'].default_value     = 48.0\n  n_noise.inputs['Detail'].default_value    = 8.0\n  n_noise.inputs['Roughness'].default_value = 0.55\n\nScale 48 corresponds to features roughly 2 cm across on a 0.7 m icosphere — barely visible as surface texture, but enough to soften the specular highlight edge.",
      },
      {
        title: "Set Principled BSDF v2 socket values and export GLB",
        body: "With all the input nodes built, the Principled BSDF receives:\n\n  n_pbsdf.inputs['Base Color'].default_value             → from Mix node\n  n_pbsdf.inputs['IOR'].default_value                  = 1.77\n  n_pbsdf.inputs['Roughness'].default_value             = 0.04\n  n_pbsdf.inputs['Metallic'].default_value              = 0.0\n  n_pbsdf.inputs['Transmission Weight'].default_value   = 0.92\n  n_pbsdf.inputs['Iridescence Weight'].default_value    = 0.78\n  n_pbsdf.inputs['Iridescence IOR'].default_value       = 1.40\n  n_pbsdf.inputs['Iridescence Thickness'].default_value → from Map Range\n  n_pbsdf.inputs['Coat Weight'].default_value           = 0.35\n  n_pbsdf.inputs['Coat Roughness'].default_value        = 0.02\n  n_pbsdf.inputs['Normal'].default_value                → from Bump node\n\nIOR material reference: water = 1.33, glass = 1.52, quartz = 1.54, sapphire = 1.77, diamond = 2.42. Higher IOR = more Fresnel reflection at steep angles, less transmission at grazing. Diamond at 2.42 produces almost total external reflection at angles past ~25°.\n\nGLB export:\n\n  bpy.ops.export_scene.gltf(\n      filepath=str(GLB_OUT),\n      export_format='GLB',\n      use_selection=True,\n      export_apply=True,\n      export_materials='EXPORT',\n      export_image_format='WEBP',\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n  )\n\nThe exporter detects Transmission Weight > 0 and writes KHR_materials_transmission with transmissionFactor = 0.92. It detects Iridescence Weight > 0 and writes KHR_materials_iridescence with iridescenceFactor = 0.78, iridescenceIor = 1.40, iridescenceThicknessMinimum = 270.0, iridescenceThicknessMaximum = 680.0 (from the Map Range node). The IOR value also triggers KHR_materials_ior with ior = 1.77 — all three extensions in one export.",
      },
    ],
    finalResult:
      "A holographic sapphire-blue gem material on a 1 280-triangle icosphere, with Wave-driven iridescence sweeping the visible spectrum across the surface, Voronoi F2 internal crystal planes visible through the transmission window, and a Coat polish overcoat. The GLB (Draco-6) exports KHR_materials_transmission + KHR_materials_iridescence + KHR_materials_ior for full Three.js r152+ WebXR delivery.",
    variations: [
      "Diamond: IOR = 2.42, Roughness = 0.01, COAT_WT = 0.6, BASE_COLOUR = (0.96, 0.97, 1.0, 1.0). At IOR 2.42, total internal reflection becomes visible at steep view angles — the gem darkens at the rim and glows at the centre, the opposite of glass. Keep Wave Scale at 4 for broad spectral bands; tight bands at high IOR look too busy.",
      "Opal (diffuse iridescence): Transmission = 0.0, ROUGHNESS = 0.35, IRIDESCENCE_WT = 0.9, BASE_COLOUR = (0.88, 0.82, 0.74, 1.0) milky white. Without transmission the effect reads as surface diffraction on a matte white body. Use VORONOI_MIX_FAC = 0.6 and F2 feature to exaggerate the cell pattern — it reads as the play-of-colour in a natural opal.",
      "Shifting spectrum at runtime (WebXR): add a driver to the Map Range To Min value: bpy.data.materials['HolographicGem'].node_tree.nodes['Map Range'].inputs['To Min'].driver_add('default_value'). In Three.js, update the iridescenceThicknessMinimum uniform via KHR_materials_iridescence extension access on the MeshPhysicalMaterial for animated iridescence without a re-export.",
    ],
    troubleshooting: [
      {
        symptom: "KeyError: 'Transmission Weight' when setting PBSDF inputs",
        cause: "The script is running in Blender 3.x where the socket is named 'Transmission'. The rename happened in 4.0.",
        fix: "Confirm bpy.app.version >= (4, 0, 0). In 3.x, replace 'Transmission Weight' with 'Transmission', 'Coat Weight' with 'Clearcoat', 'Coat Roughness' with 'Clearcoat Roughness', and 'Emission Color' with 'Emission'.",
      },
      {
        symptom: "Gem renders as a black void in EEVEE — no transmission visible",
        cause: "SSR (Screen Space Reflections + Refraction) is disabled. EEVEE Next requires it for Transmission to show anything behind the surface.",
        fix: "Set scene.eevee.use_ssr = True and scene.eevee.use_ssr_refraction = True in the script, or enable in Properties → Render → Screen Space Reflections → Refraction.",
      },
      {
        symptom: "Iridescence shows a single colour band, not a rainbow sweep",
        cause: "Wave Texture Fac is not connected to Map Range — or Map Range is connected to Iridescence Weight rather than Iridescence Thickness.",
        fix: "Verify: links.new(n_wave.outputs['Fac'], n_mr.inputs['Value']) and links.new(n_mr.outputs['Result'], n_pbsdf.inputs['Iridescence Thickness']). Iridescence Weight should have a constant float value (0.78), not a texture connection.",
      },
      {
        symptom: "GLB opens in Three.js but iridescence is invisible",
        cause: "Three.js version is below r152, which added KHR_materials_iridescence support.",
        fix: "Update Three.js to r152+. Verify the extension is present by inspecting the GLB JSON: strings 'KHR_materials_iridescence' should appear in extensionsUsed and in the material's extensions object.",
      },
      {
        symptom: "Mix Color node raises AttributeError on data_type = 'RGBA'",
        cause: "The script is using ShaderNodeMixRGB instead of ShaderNodeMix, or is running in Blender below 3.4 where the unified Mix node does not exist.",
        fix: "In 5.1, nodes.new('ShaderNodeMix') creates the unified Mix node with data_type attribute. The legacy ShaderNodeMixRGB still works in 5.1 (uses 'Fac', 'Color1', 'Color2' socket names) but will be removed in a future release.",
      },
    ],
  },
  base,
);

export { entry };
