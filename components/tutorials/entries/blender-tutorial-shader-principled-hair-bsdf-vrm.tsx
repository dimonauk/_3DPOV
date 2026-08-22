import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ShaderPrincipledHairBsdfVrmBody() {
  return (
    <>
      <p>
        The <strong>Principled Hair BSDF</strong> (Blender 4.0+, production-stable
        in 5.1) replaces the older Hair BSDF with a full implementation of the
        Chiang et al. 2016 hair scattering model — the same model used in
        production renderers such as pbrt-v4, Renderman, and Arnold. Unlike the
        regular Principled BSDF, which treats surfaces as flat, this node
        treats each hair strand as a cylinder with a tilted cuticle and a
        cortex with a defined refractive index. Understanding the three
        scattering lobes is the key to controlling the result: blind
        parameter-tweaking without the lobe model produces plausible hair that
        is never quite right.
      </p>

      <h2>The R / TT / TRT lobe model</h2>
      <p>
        Every photon hitting a hair strand can take one of three paths through
        the Chiang model. The <strong>R</strong> lobe (specular Reflection off
        the cuticle surface) produces the bright, narrow highlight you see
        looking straight at the hair. The <strong>TT</strong> lobe
        (Transmission Through the cortex) is the soft glow you see when a
        strand is backlit — light passes through the melanin pigment layer and
        exits the far side. The <strong>TRT</strong> lobe
        (Transmission–Reflection–Transmission, the glint) is what makes
        hair shimmer from behind: light enters the strand, reflects off the
        concave back wall of the cortex, and exits toward the camera. This is
        the bright rim you see when sunlight hits hair from behind. Each lobe
        has its own angular distribution controlled by the Roughness and Radial
        Roughness sliders; they are not the same parameter and should not be
        tuned together. Compare this to the single specular lobe in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence"
          className={lk}
        >
          Principled BSDF transmission tutorial
        </Link>
        , where the iridescence effect is a far simpler thin-film model.
      </p>

      <h2>Melanin, Tint, and unnatural colours</h2>
      <p>
        The <strong>MELANIN parametrisation</strong> models hair pigment as a
        physically measured absorption coefficient. Melanin 0 = fully bleached
        (white); Melanin 1 = black. Melanin Redness 0 = cool ash tones;
        Melanin Redness 1 = warm copper. The <strong>Tint</strong> socket is
        a colour multiplier applied on top of the melanin absorption — it does
        not replace it. Setting Melanin to 0 (fully bleached) removes all
        pigment absorption, so Tint becomes the sole colour influence. This is
        the standard VRM trick for anime hair: the Melanin=0 + Tint approach
        keeps the physically correct highlight positioning from the lobe model
        while allowing any solid colour. Setting Melanin to 0.6 and leaving
        Tint at white gives warm brown human hair; reducing Melanin Redness to
        0 shifts it toward cool platinum blonde. For natural VRM colours the
        correct workflow is Melanin=0, then wire a colour swatch into Tint
        rather than the Direct Colouring parametrisation, which bypasses the
        lobe model entirely. This is covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-curves-hair-grooming"
          className={lk}
        >
          Curves Hair Grooming tutorial
        </Link>
        , where per-strand colour attributes flow into the Tint socket.
      </p>

      <h2>The Offset parameter and cuticle tilt</h2>
      <p>
        Real hair cuticle scales tilt approximately 2–3° toward the root of the
        strand. The <strong>Offset</strong> input (in radians) models this tilt
        by rotating the azimuthal frame of the R lobe. A negative value shifts
        the specular highlight toward the roots; a positive value shifts it
        toward the tips. The physical default is approximately{" "}
        <code>−math.radians(3)</code>. Setting Offset to 0 moves the highlight
        to the top of the strand — correct for a hypothetical smooth cylinder
        but wrong for hair. Setting Offset to +5° shifts the highlight above
        the geometric peak; it looks synthetic. For anime hair specifically,
        reducing the magnitude to −1° or 0° produces the exaggerated
        high-placed specular characteristic of cel shading — compare with the
        specular band placement in the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
          className={lk}
        >
          Eevee toon cel shader tutorial
        </Link>
        .
      </p>

      <h2>Coat, Radial Roughness, and per-strand variation</h2>
      <p>
        The <strong>Coat</strong> socket adds a smooth clear coat over the
        cuticle surface — equivalent to the effect of silicone-based hair
        products on natural hair. Values above 0.3 produce the wet-look shine
        common in K-pop and anime. <strong>Radial Roughness</strong> (distinct
        from longitudinal Roughness) controls how far the TT and TRT lobes
        spread azimuthally around the strand circumference. Low values
        concentrate the TRT glint into a narrow rim; high values spread it
        into a broad glow. For silk or anime hair, Radial Roughness 0.2–0.35
        is the correct range; realistic curly hair is 0.5–0.7.{" "}
        <strong>Random Color</strong> adds per-strand melanin variation, which
        on natural brown hair gives each strand a slightly different absorption
        depth — the natural &ldquo;depth&rdquo; effect of a full head of hair.
        Keep it below 0.05 for anime or VRM use, where tonal uniformity is
        expected.
      </p>

      <h2>Hair cards for WebXR export</h2>
      <p>
        The Principled Hair BSDF has no glTF material extension equivalent:
        there is no <code>KHR_materials_hair</code> in the glTF 2.0
        specification. Exporting a scene containing this shader produces a
        plain opaque material with no lobe behaviour in Three.js or Babylon.js.
        The correct WebXR production path is the <strong>hair card</strong>{" "}
        workflow: bake the Cycles-rendered hair colour to a transparent PNG
        texture atlas (one row of the atlas per major hair direction), apply
        the atlas to flat ribbon planes that follow the flow of the hair
        volume, and export those planes as a standard GLB with
        <code>KHR_materials_unlit</code> or a Principled BSDF with
        <code>alphaMode: BLEND</code>. The baking step is covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          Texture Baking tutorial
        </Link>
        . For VRM characters specifically, the hair-card mesh must also carry
        spring-bone weights so it can be driven by the spring physics chain
        described in the{" "}
        <Link
          href="/tutorials/blender-tutorial-vrm-spring-bones-hair-chain"
          className={lk}
        >
          VRM Spring Bones tutorial
        </Link>
        .
      </p>

      <h2>Failure modes</h2>
      <p>
        <strong>Hair renders solid black.</strong> The Principled Hair BSDF
        requires Cycles; it evaluates to black in Eevee (including Eevee Next).
        Switch to Cycles or use a Principled BSDF as a fallback for Eevee
        previews.
      </p>
      <p>
        <strong>No TRT glint visible.</strong> The glint requires a relatively
        point-like light source behind the hair. A large area light or an
        HDRI-only setup diffuses the TRT peak below visibility. Add a spot or
        point light behind the head with energy at least 2× the key light.
      </p>
      <p>
        <strong>
          <code>hair_n.inputs["Melanin"]</code> KeyError.
        </strong>{" "}
        The MELANIN parametrisation must be set before accessing melanin
        inputs. Some builds expose the inputs only after{" "}
        <code>hair_n.parametrization = &apos;MELANIN&apos;</code> is assigned.
        Set the parametrisation first, then write the socket values.
      </p>
      <p>
        <strong>GLB exports flat grey hair.</strong> Expected — there is no
        glTF equivalent. Use the hair-card bake workflow described above for
        WebXR.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/hair_principled.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Principled Hair BSDF — Blender Manual
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Documentation Team. The canonical reference
          for all socket descriptions, parametrisation options, and
          Eevee/Cycles behaviour differences.
        </li>
        <li>
          <a
            href="https://github.com/mmp/pbrt-v4"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            pbrt-v4
          </a>{" "}
          · Apache-2.0 · Matt Pharr, Wenzel Jakob, Greg Humphreys. The
          reference implementation of the Chiang 2016 hair scattering model
          (see <code>src/pbrt/bxdfs/hair.h</code> and{" "}
          <code>src/pbrt/bxdfs/hair.cpp</code>) — reading this alongside the
          Blender shader makes the R/TT/TRT lobe positions and the offset
          geometry precise. Sister project:{" "}
          <a
            href="https://github.com/mmp/pbrt-book"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            pbrt-book
          </a>{" "}
          (CC-BY-SA 4.0) contains the full chapter on hair scattering theory.
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          · Apache-2.0 · Khronos Group. The exporter that determines which
          Blender material nodes map to glTF extensions — and therefore why
          the Hair BSDF does not survive GLB export. See also its sibling{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Models"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Models
          </a>{" "}
          for reference GLBs demonstrating the supported material range.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath: "blends/shading/shader-principled-hair-bsdf-vrm",
    time: "one session",
    difficulty: "intermediate",
    goal:
      "Set up a Principled Hair BSDF on a particle-hair head cap in Blender 5.1, understand the R/TT/TRT lobe model, tune an anime-blue VRM colour using the melanin-zero + tint trick, and understand the hair-card bake path required for WebXR GLB export.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    prerequisites: [
      "Comfortable with Blender's Shader Editor and the Principled BSDF",
      "Understand the difference between Cycles and Eevee render engines",
      "Familiar with UV unwrapping for texture baking (see texture-baking tutorial)",
    ],
    steps: [
      {
        title: "Create scalp hemisphere",
        body: "Add a UV Sphere (16 segments, 10 rings, radius 0.12 m). In bmesh, delete all faces whose centre.z is below −0.006 m, leaving the top cap. Name the object 'vrm_scalp'. Apply a pale Principled BSDF as material slot 0.",
      },
      {
        title: "Add Principled Hair BSDF material",
        body: "In the Shader Editor, add a new material 'VRM_Hair'. Remove the default Principled BSDF. Add ShaderNodeBsdfHairPrincipled — note: this is a different node type from ShaderNodeBsdfPrincipled. Set parametrization = MELANIN. Wire its BSDF output to Material Output Surface.",
      },
      {
        title: "Set MELANIN = 0 and Tint for cartoon colour",
        body: "Set Melanin to 0.0 (fully bleached). Set Melanin Redness to 0.30. Set Tint to your target colour (e.g. anime blue: R=0.03, G=0.45, B=0.92). IOR = 1.55. Roughness = 0.12. Radial Roughness = 0.30. Coat = 0.35. Offset = −0.052 radians (≈ −3°).",
      },
      {
        title: "Add particle system hair",
        body: "In Object Properties → Particles, add a new Hair particle system. Set Count = 300, Hair Length = 0.22 m, Hair Step = 5, Render Type = Path. Set Material to slot 2 (hair_mat). Enable Advanced Hair. Set Kink = Curl, Amplitude = 0.015 for light volume.",
      },
      {
        title: "Set up 3-point lighting with boosted back light",
        body: "Add a Key Area light (600 W) at (0.35, −0.55, 0.45), a Fill Point light (100 W) at (−0.40, −0.25, 0.20), and a Back Spot light (1200 W) at (0.0, 0.50, 0.25), rotated to face the head. The back light must be brighter than the key to make the TRT glint visible. Set Render Engine to Cycles, Samples = 64.",
      },
      {
        title: "Observe each lobe and export",
        body: "In Cycles preview: front view = R lobe specular band. Rear view = TRT glint from the back light. Side view = TT translucent glow on backlit strands. To export for WebXR, follow the hair-card bake workflow in the README — bake Cycles diffuse to a transparent PNG atlas, apply to ribbon planes, export as GLB.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Hair renders black or invisible",
        cause: "Principled Hair BSDF is a Cycles-only shader",
        fix: "Switch Render Engine to Cycles. In Eevee the node returns black. Use a standard Principled BSDF as an Eevee fallback by mixing on a is_cycles_ray driver if needed.",
      },
      {
        symptom: "No TRT glint at the rear",
        cause: "Back light is too dim or too large (area light diffuses the glint)",
        fix: "Use a Spot or Point light behind the head at 2–3× the key light energy. The TRT peak is narrow — it disappears with large soft sources.",
      },
      {
        symptom: "parametrization = 'MELANIN' raises AttributeError",
        cause: "Attribute must be set before reading MELANIN-specific input sockets",
        fix: "Set hair_n.parametrization = 'MELANIN' immediately after creating the node, before accessing inputs. Some Blender builds conditionally expose sockets after parametrisation is set.",
      },
      {
        symptom: "Offset has no visible effect",
        cause: "Roughness is too high, smearing the R lobe across the full strand",
        fix: "Reduce Roughness to 0.08–0.15 range. At Roughness > 0.4 the R lobe broadens so much that its angular shift is invisible.",
      },
    ],
    voiceMode: "aura",
  },
  {
    slug: "blender-tutorial-shader-principled-hair-bsdf-vrm",
    title:
      "Shader — Principled Hair BSDF: VRM Anime Hair with the R / TT / TRT Lobe Model",
    date: "2026-06-09",
    kind: "tutorial",
    excerpt:
      "Master Blender 5.1's Principled Hair BSDF by understanding the three scattering lobes (R specular, TT transmitted, TRT glint), use the melanin-zero + tint trick for anime VRM colours, and learn why the shader requires a hair-card bake for WebXR GLB export.",
    Body: ShaderPrincipledHairBsdfVrmBody,
  },
);
