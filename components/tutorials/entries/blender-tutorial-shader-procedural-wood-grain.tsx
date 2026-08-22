import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ShaderProceduralWoodGrainBody() {
  return (
    <>
      <p>
        Wood grain is the product of two biological rhythms locked in the same
        cross-section.  Every spring the tree produces large, thin-walled cells
        that swell quickly — pale <em>earlywood</em>, low density.  Every
        summer it shifts to small, thick-walled cells that pack slowly —
        dark <em>latewood</em>, high density.  Cut through the trunk and you
        see alternating pale and dark concentric rings; cut along the trunk and
        those rings appear as long, gently wavy lines.  This blueprint
        encodes both structures in Blender shader nodes with no image textures
        and no UV painting — only a{" "}
        <code>ShaderNodeTexWave</code>, two{" "}
        <code>ShaderNodeTexNoise</code> nodes, a{" "}
        <code>ShaderNodeValToRGB</code> colour cycle, and the{" "}
        <strong>Anisotropic</strong> lobe of Principled&nbsp;BSDF&nbsp;v2.
        Compare the coordinate-perturbation approach used here for grain
        waviness with the pure-output mixing strategy in the{" "}
        <Link href="/tutorials/blender-tutorial-shader-procedural-woven-fabric" className={lk}>
          woven fabric shader
        </Link>
        , where Math chains combine two Wave outputs directly.
      </p>

      <p>
        The Wave node operates on pre-scaled Object coordinates.  The scale
        vector is <code>(RING_FREQ, RING_FREQ, RING_FREQ&nbsp;&times;&nbsp;LONG_COMPRESS)</code>
        where <code>LONG_COMPRESS&nbsp;=&nbsp;0.06</code>.  Compressing Z by
        a factor of 17 stretches every ring cross-section into a tall ellipse —
        the same ring that looks circular in end-grain reads as a long grain
        line across the face of the plank.  Setting <code>LONG_COMPRESS</code>{" "}
        to 1.0 produces the spherical blob pattern of a lathe-turned handle or
        burl; reducing it toward 0.02 gives the near-perfectly-parallel grain
        of quarter-sawn timber.
      </p>

      <p>
        Grain waviness is injected as a <strong>coordinate perturbation</strong>{" "}
        before the Wave node, not as a mix after it.  A low-frequency Noise
        node evaluates on the scaled coordinates and its{" "}
        <code>Color</code> output — a smooth three-dimensional vector field —
        is scaled by <code>DISTORT_STRENGTH</code> and added to the coordinate
        vector.  This shifts where each ring sample is taken from, bending the
        band boundaries smoothly.  If instead you mixed the Wave output with
        Noise output, the result would average dark and light zones together
        and the periodic colour cycle would collapse toward a uniform mid-tone.
        The same principle appears in the{" "}
        <Link href="/tutorials/blender-tutorial-shader-procedural-worn-metal-edge-wear" className={lk}>
          worn metal shader
        </Link>
        , where combining two signals via <code>Math MAX</code> rather than
        ADD prevents the channels from compounding at overlap zones.
      </p>

      <p>
        Annual ring colour comes from a four-stop{" "}
        <code>B_SPLINE</code> ColorRamp driven by the Wave&rsquo;s{" "}
        <code>Fac</code> output.  A SIN wave oscillates 0&rarr;1&rarr;0 per
        ring pair; the ramp maps 0.0 to dark latewood, 0.42 to light
        earlywood, 0.70 to a mid-tone transition, and 1.0 back to dark —
        producing the characteristic light-on-dark ring appearance of
        face-sawn oak.  The{" "}
        <code>B_SPLINE</code> interpolation is critical here: CONSTANT gives
        hard band edges (unrealistic except for ring-porous woods like oak
        photographed very close); LINEAR gives sharp V-shaped transitions;
        B_SPLINE gives the gradual density shift of a real ring boundary.
      </p>

      <p>
        Real sanded timber has small per-fibre roughness variation: individual
        fibre bundles differ slightly in surface texture.  A second Noise node
        at <code>Scale&nbsp;=&nbsp;55</code> (approximately one noise cycle per
        2&nbsp;cm at 1&nbsp;m scale) maps its <code>Fac</code> through a{" "}
        <code>ShaderNodeMapRange</code> into the roughness range{" "}
        <code>[0.16, 0.44]</code>.  The result looks like slightly raised grain
        — the texture you feel when you run a finger along sanded timber before
        the second coat.  Connect a constant <code>0.30</code> directly to
        Roughness and compare: the plank reads as uniformly smooth plastic.
        The same bake path used in the{" "}
        <Link href="/tutorials/blender-tutorial-texture-baking-normal-ao" className={lk}>
          texture baking tutorial
        </Link>{" "}
        can transfer this procedural roughness variation to a GLB-compatible
        image texture when you need offline-rendered precision rather than
        real-time procedural evaluation.
      </p>

      <p>
        <strong>Anisotropy</strong> is the defining visual quality of sanded
        timber under a single light source.  An isotropic material scatters
        the highlight in a radially symmetric blob; an anisotropic material
        elongates it into a band aligned with the micro-structure direction.
        In wood that direction is the grain — along the X axis of the plank.
        Principled BSDF&nbsp;v2 takes a{" "}
        <code>Tangent</code> input vector that defines the highlight axis.  A{" "}
        <code>ShaderNodeTangent</code> node with{" "}
        <code>direction_type=&#39;UV_MAP&#39;</code> reads the U derivative
        from the UV map: the Cube Projection UV has its U direction aligned
        with the long face of the plank, which is the grain direction.  Set{" "}
        <code>Anisotropic&nbsp;=&nbsp;0.68</code> and orbit to a near-grazing
        viewing angle — a bright band sweeps across the plank parallel to the
        grain, exactly as it would on a real piece of oak under a spotlight.
        See the{" "}
        <Link href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence" className={lk}>
          Principled BSDF v2 transmission &amp; iridescence tutorial
        </Link>{" "}
        for the full socket catalogue that this same shader family shares.
      </p>

      <p>
        <strong>GLB export and KHR_materials_anisotropy</strong>.  When
        Principled BSDF v2 has <code>Anisotropic&nbsp;&gt;&nbsp;0</code> and a
        Tangent node connected,{" "}
        <code>bpy.ops.export_scene.gltf()</code> writes the{" "}
        <code>KHR_materials_anisotropy</code> extension block automatically,
        encoding <code>anisotropyStrength</code> and{" "}
        <code>anisotropyRotation</code>.  Three.js{" "}
        <code>r153+</code> reads both values via{" "}
        <code>MeshPhysicalMaterial.anisotropy</code> and{" "}
        <code>anisotropyRotation</code>, so the grain highlight renders
        correctly in a WebXR atelier scene at real-time frame rates.  The
        procedural ring pattern itself does not survive export — it evaluates
        only inside Blender&rsquo;s shader engine.  For GLB use, run the
        Cycles bake from the{" "}
        <Link href="/tutorials/blender-tutorial-texture-baking-normal-ao" className={lk}>
          baking tutorial
        </Link>{" "}
        to transfer the ring colour to a <code>BaseColor</code> image texture
        before calling the exporter.  The Anisotropy and IOR parameters export
        natively without baking.  For proper UV coverage before baking, see
        the{" "}
        <Link href="/tutorials/blender-tutorial-gn-uv-unwrap-pack-islands-glb" className={lk}>
          GN UV Unwrap and Pack Islands tutorial
        </Link>
        .
      </p>

      <p>
        Outside references for this tutorial:
      </p>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/shader_nodes/textures/wave.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Wave Texture Node
          </a>{" "}
          (CC-BY-SA&nbsp;4.0, Blender Foundation) — complete reference for
          all wave types, band directions, profile shapes, and distortion
          parameters used in this shader.
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_anisotropy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KhronosGroup/glTF — KHR_materials_anisotropy
          </a>{" "}
          (Apache-2.0, Khronos Group) — the glTF extension specification
          that Blender&rsquo;s GLTF exporter implements; defines
          anisotropyStrength, anisotropyRotation, and the anisotropyTexture
          channels.  Related projects in the same org:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Viewer"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Viewer
          </a>{" "}
          (WebGL reference renderer, Apache-2.0) and{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          (the Blender plugin that writes this extension, Apache-2.0).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-shader-procedural-wood-grain",
  title:
    "Shader: Procedural Wood Grain — Wave-Band Annual Rings, Anisotropic Fibre Sheen & KHR_materials_anisotropy GLB Export",
  tags: ["blender", "shader", "procedural", "wood", "anisotropy", "pbr", "glb", "webxr"],
  category: "tutorial",
  publishedOn: "2026-06-10",
  summary:
    "No-texture wood grain shader for Blender 5.1. ShaderNodeTexWave BANDS with coordinate-perturbation waviness models annual ring colour. " +
    "Principled BSDF v2 Anisotropic + UV-mapped Tangent recreates the characteristic along-grain highlight of sanded timber. " +
    "Exports via KHR_materials_anisotropy so the grain sheen is preserved in real-time WebXR.",
  body: ShaderProceduralWoodGrainBody,
  libraryPath: "blends/shading/shader-procedural-wood-grain",
});
