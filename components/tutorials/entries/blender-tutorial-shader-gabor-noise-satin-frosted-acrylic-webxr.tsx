import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ShaderGaborNoiseSatinFrostedAcrylicBody() {
  return (
    <>
      <p>
        The standard Noise Texture is an amplitude-modulated function — each
        sample is a blend of random scalars.  The{" "}
        <code>ShaderNodeTexGabor</code> (added in Blender 4.1, available in
        5.1) works differently: it scatters a bank of oriented sinusoidal
        kernels across space and sums their contributions.  The result is a
        frequency-space noise — one that carries a preferred direction and a
        specific spatial frequency.  This is the mathematical structure of spun
        acrylic, brushed resin, satin fabric, and geological bedding planes:
        not random amplitude variation but <em>directional frequency
        variation</em>.  This tutorial builds a PMMA acrylic wall panel whose
        roughness and micro-normal are driven entirely by Gabor Texture, then
        bakes the result to WebP for WebXR runtime.  Compare the coordinate
        perturbation approach used in the{" "}
        <Link href="/tutorials/blender-tutorial-shader-procedural-wood-grain" className={lk}>
          procedural wood grain shader
        </Link>{" "}
        (Wave Texture + Noise distortion) and the Wave chain approach in the{" "}
        <Link href="/tutorials/blender-tutorial-shader-procedural-woven-fabric" className={lk}>
          woven fabric shader
        </Link>{" "}
        — Gabor replaces both with a single node that encodes direction
        natively.
      </p>

      <h2>The two outputs: Value and Phase Offset</h2>
      <p>
        <code>ShaderNodeTexGabor</code> exposes two distinct sockets.{" "}
        <strong>Value</strong> is the real-part sum of all kernels at the
        sample point, ranging roughly −1 … +1.  It looks like noise.{" "}
        <strong>Phase Offset</strong> is the instantaneous phase derivative of
        the same kernel field — mathematically the height map from which Value
        was derived.  Feeding Phase Offset directly into a Bump node gives
        micro-surface normals without any extra UV bake or Normal Map texture.
        This makes Gabor unusual among texture nodes: its derivative is
        available as an explicit output, not something you need to compute via
        finite differences with a Bump node in Height mode.
      </p>
      <p>
        Because Value is signed, pipe it through a <code>Math › ABSOLUTE</code>{" "}
        node before a Color Ramp.  Without Absolute, the Color Ramp treats
        values below 0 as a second monotone band and you get doubled stripe
        frequency.  With Absolute, positive and negative kernel peaks both
        map to the Ramp&rsquo;s right end — the result is symmetric striae
        of consistent spacing.
      </p>

      <h2>Stochastic vs coherent Gabor</h2>
      <p>
        The <code>gabor_type</code> enum has two options.{" "}
        <strong><code>GABOR_STOCHASTIC</code></strong> distributes kernels at
        random Poisson-disk positions — no two kernels occupy the same cell.
        The result is an aperiodic directional texture: consistent average
        density across the surface, no repetition.  This matches spun or
        brushed materials where the process is mechanically repetitive but
        positionally random.{" "}
        <strong><code>GABOR</code></strong> (coherent) places kernels on a
        regular grid and sums with coherent phase — a precise grating, sharp
        and periodic.  Use it for holographic foil, CD-surface diffraction, or
        laser-etched metal where the pattern truly is periodic.  This tutorial
        uses Stochastic for the acrylic panel; swap to coherent to replicate
        a security hologram inlay.
      </p>

      <h2>Frequency and Anisotropy — tuning the striae</h2>
      <p>
        <strong>Frequency</strong> controls how many kernel oscillations fit
        within one Scale unit.  At Scale 2 and Frequency 600, you get
        600 × 2 = 1200 striae per world-unit length — at 1 m panel width that
        is 1200 stripes, well above the 300–800 µm fibre spacing of real
        spun acrylic.  Tune: 200 Hz for velvet, 400 Hz for felt, 600 Hz for
        polished acrylic, 1200 Hz for fine-ground optical glass.
      </p>
      <p>
        <strong>Anisotropy</strong> is the key distinguishing parameter.  At 0
        the kernel bank is isotropic — each kernel points in a random direction,
        the sum looks like white noise.  At 1 all kernels are co-directional,
        producing razor-sharp striae aligned to the Orientation angle.  Values
        between 0.7 and 0.92 are the most useful: distinct directional
        character while preserving the organic irregularity of a real surface.
        The <code>record.py</code> animation sweeps Anisotropy 0 → 1 → 0 over
        10 seconds — watching this transition is the fastest way to understand
        what Gabor is doing that Noise Texture cannot.
      </p>

      <h2>Orientation — defeating Moiré</h2>
      <p>
        Gabor kernels point along the angle set by the{" "}
        <strong>Orientation</strong> input (radians, 2D).  At 0° or 90° the
        striae are axis-aligned with the UV grid; at 1920×1080 export they
        can create Moiré fringes with the pixel grid.  The blueprint uses 22.5°
        — the classic half-angle of the four-colour halftone rosette.  It is
        close enough to horizontal to read as horizontal striae but far enough
        to eliminate grid-aligned aliasing.  For rotated panels or tilted wall
        tiles, add the panel&rsquo;s surface-normal angle to this value.
      </p>

      <h2>Material: Principled BSDF for milky acrylic</h2>
      <p>
        PMMA acrylic stock (IOR 1.49) sits between glass (1.52) and water
        (1.33).  Milky or frosted acrylic transmits light but scatters it —
        model this with Transmission Weight 0.78 rather than a pure Glass
        BSDF.  In Blender 5.1 Principled BSDF uses the{" "}
        <code>inputs["Transmission Weight"]</code> socket (not the old{" "}
        <code>inputs["Transmission"]</code> scalar from 3.x).  The{" "}
        <Link href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence" className={lk}>
          Principled Transmission tutorial
        </Link>{" "}
        covers the full socket name migration.  The Gabor-driven roughness
        (0.04 – 0.38) means the transmission is focused in polished zones
        and scattered in satin zones — visually: bright halos where the
        fibre alignment is tightest, diffuse backlit glow where it opens.
      </p>

      <h2>Baking to WebP for WebXR</h2>
      <p>
        Gabor Texture evaluates on the GPU in both Cycles and Eevee Next (5.1),
        but GLB files cannot embed procedural node graphs — only image
        textures.  The blueprint bakes two passes: a Roughness map and a Normal
        map, each at 1024 × 1024 WebP.  The Normal map uses a float buffer
        (HDR) to avoid banding in the blue channel.  Bake quality requires
        only 32 Cycles samples per texel — Gabor is a smooth analytical
        function, not a noisy estimator, so there is almost no variance between
        paths.  Compare the 64-sample recommendation in the{" "}
        <Link href="/tutorials/blender-tutorial-python-cycles-batch-bake-normal-ao-emission-webxr" className={lk}>
          batch bake pipeline tutorial
        </Link>{" "}
        — that uses SSS and emission which need more paths to converge.
      </p>
      <p>
        The exported GLB maps the Principled BSDF Transmission to{" "}
        <code>KHR_materials_transmission</code> and IOR to{" "}
        <code>KHR_materials_ior</code>.  Three.js 167+ supports both
        extensions — in WebXR the panel will refract correctly under
        environment lighting.  The{" "}
        <Link href="/tutorials/blender-tutorial-shader-anisotropic-bsdf-brushed-metal" className={lk}>
          anisotropic brushed metal tutorial
        </Link>{" "}
        covers how <code>KHR_materials_anisotropy</code> exports work when you
        want the directional sheen to carry through to the runtime rather than
        being baked into the normal map.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Gabor node not found in Add › Texture menu</strong> — you are
          in Blender 4.0 or earlier.  The node was added in 4.1.  Check
          version: <code>bpy.app.version &gt;= (4, 1, 0)</code>.
        </li>
        <li>
          <strong>Phase Offset is constant grey</strong> — Orientation input
          is 0 and Anisotropy is 0.  Both must be non-zero for the derivative
          field to vary spatially.  Set Anisotropy ≥ 0.1 first.
        </li>
        <li>
          <strong>Doubled stripe frequency in roughness</strong> — the
          Color Ramp input is receiving signed Value without the Absolute node.
          Insert <code>Math › ABSOLUTE</code> between Gabor Value and the Ramp.
        </li>
        <li>
          <strong>Bake produces solid grey Normal map</strong> — the active
          node in the material is not the Image Texture node.  In the blueprint,{" "}
          <code>nt.nodes.active = img_node</code> sets this; confirm it runs
          before <code>bpy.ops.object.bake()</code>.
        </li>
        <li>
          <strong>GLB renders as opaque in Three.js</strong> — Three.js requires{" "}
          <code>material.transparent = true</code> in addition to{" "}
          <code>KHR_materials_transmission</code>.  Blender&rsquo;s exporter
          sets this automatically when Blend Mode is HASHED or BLEND — set it
          in Material › Settings › Blend Mode before exporting.
        </li>
      </ul>

      <p>Outside references for this tutorial:</p>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/shader_nodes/textures/gabor.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Foundation — Gabor Texture Node Manual
          </a>{" "}
          (CC-BY-4.0, Blender Foundation) — complete parameter reference for
          Gabor Type, Frequency, Anisotropy, and Orientation, with visual
          examples of each.
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_transmission"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KhronosGroup/glTF — KHR_materials_transmission
          </a>{" "}
          (Apache-2.0, Khronos Group) — the glTF extension that carries
          Principled BSDF Transmission Weight to the WebXR runtime.  Related
          projects in the same organisation:{" "}
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
          (Blender&rsquo;s GLTF exporter plugin, Apache-2.0).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-shader-gabor-noise-satin-frosted-acrylic-webxr",
  title:
    "Shader: Gabor Noise Texture — Directional Kernel Field for Satin Frosted Acrylic (Blender 5.1)",
  tags: [
    "blender",
    "shader",
    "gabor",
    "noise",
    "procedural",
    "acrylic",
    "transmission",
    "pbr",
    "glb",
    "webxr",
  ],
  category: "tutorial",
  publishedOn: "2026-07-03",
  summary:
    "ShaderNodeTexGabor (Blender 4.1+) drives Roughness and Bump on a PMMA acrylic wall panel. " +
    "Stochastic mode at 600 Hz and 0.88 Anisotropy produces satin striae; Phase Offset feeds a Bump " +
    "node for micro-normals without a second bake pass. Material uses Principled BSDF Transmission 0.78 " +
    "+ IOR 1.49 for milky glass, baked to 1024 WebP for KHR_materials_transmission GLB export.",
  body: ShaderGaborNoiseSatinFrostedAcrylicBody,
  libraryPath:
    "blends/shading/shader-gabor-noise-satin-frosted-acrylic-webxr",
});
