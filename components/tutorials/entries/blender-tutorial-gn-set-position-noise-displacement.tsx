import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnSetPositionNoiseDisplacementBody() {
  return (
    <>
      <p>
        <strong>Set Position</strong> is Geometry Nodes&rsquo; primary vertex
        displacement tool. Its <code>Offset</code> socket <em>adds</em> a
        vector to each vertex&rsquo;s existing position, so a sphere stays
        spherical while each vertex travels outward along its own normal.
        The <code>Position</code> socket <em>replaces</em> positions absolutely
        &mdash; wiring a noise texture there destroys the base shape immediately.
        This tutorial builds a breathing blob planet: two stacked 4D Noise
        Texture layers displace a UV sphere along normals, a scene-frame driver
        advances the W axis for continuous morphing, and a frozen elevation
        attribute keeps the colour ramp locked to topology.
      </p>

      <h2>Offset vs Position &mdash; the founding choice</h2>
      <p>
        For surface displacement, always use <code>Offset</code>. It operates
        as a delta: current_position + offset. The sphere base radius is
        preserved; you only control how much each vertex departs from it. The{" "}
        <code>Position</code> socket overrides absolutely: every vertex moves
        to exactly the supplied value, which on a sphere means the spherical
        shape vanishes the moment a noise vector is wired there.
      </p>
      <p>
        Normal-direction displacement is the natural pairing: multiply the
        combined noise scalar by <code>InputNormal</code> via VectorMath
        SCALE, then feed the resulting vector into Offset. Every vertex moves
        along its own outward surface normal, so the sphere stays roughly
        spherical regardless of displacement magnitude.
      </p>

      <h2>4D Noise Texture and the W axis</h2>
      <p>
        Noise Texture in <code>4D</code> mode adds a fourth axis W orthogonal
        to XYZ. As W advances, the noise field morphs smoothly without
        discontinuity or loop. This is the correct tool for breathing
        animations: UV coordinates, mesh connectivity, and material assignments
        remain unchanged while the noise value at each vertex drifts. Animating{" "}
        <code>Scale</code> only zooms in or out of the same static field; 3D
        mode has no W socket.
      </p>
      <p>
        A SCRIPTED driver on the <code>W_Anim</code> group socket evaluates{" "}
        <code>frame * (1/24)</code>, advancing W at 1.0 unit per second at
        24&nbsp;fps. The macro and micro layers each add a constant seed offset
        (3.0 and 17.0) before their W inputs, so the layers breathe at
        independent rhythms rather than pulsing in unison.
      </p>

      <h2>Dual-scale frequency layering</h2>
      <p>
        A single noise layer produces either broad lumps or fine detail, never
        both. Two layers mixed additively give the full range:
      </p>
      <ul>
        <li>
          <strong>Macro</strong> &mdash; Scale&nbsp;1.5, Detail&nbsp;2,
          Roughness&nbsp;0.40, Amplitude&nbsp;0.28&nbsp;m. Large continental
          bulges. Low detail keeps it smooth.
        </li>
        <li>
          <strong>Micro</strong> &mdash; Scale&nbsp;9.0, Detail&nbsp;5,
          Roughness&nbsp;0.65, Amplitude&nbsp;0.055&nbsp;m. Surface ripple.
          High roughness gives fractal roughness; zero distortion keeps
          the ripple crisp.
        </li>
      </ul>
      <p>
        Each noise Fac is centred before scaling:{" "}
        <code>(Fac &minus; 0.5) &times; 2</code> maps [0,&nbsp;1] to
        [&minus;1,&nbsp;+1], then multiplication by the amplitude socket
        gives [&minus;AMP,&nbsp;+AMP]. The planet breathes symmetrically
        rather than only expanding outward.
      </p>

      <h2>Freeze-before-deform</h2>
      <p>
        The combined displacement scalar is normalised to [0,&nbsp;1] and
        stored as <code>elevation_fac</code> (Float, POINT domain) via{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
          className={lk}
        >
          StoreNamedAttribute
        </Link>{" "}
        <em>upstream</em> of SetPosition. The material reads this stored
        value via ShaderNodeAttribute, feeding a three-stop colour ramp
        (indigo → green → gold) into Principled BSDF Base Color.
      </p>
      <p>
        Without the freeze, the material would re-derive colour from
        post-deformation geometry &mdash; typically via world-space Z, which
        flickers as W advances. Storing before deform evaluates the colour
        once per modifier pass on pre-displaced topology and leaves it stable
        in vertex data. This is the same discipline used throughout the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-attribute-statistic-evaluate-on-domain"
          className={lk}
        >
          Attribute Statistic
        </Link>{" "}
        and{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion"
          className={lk}
        >
          Blur Attribute
        </Link>{" "}
        tutorials.
      </p>

      <h2>Bench steps</h2>
      <ol>
        <li>New file. Delete default cube. Add UV Sphere: 64 segments, 64 rings, radius 1.0. Shade Smooth.</li>
        <li>Add a Geometry Nodes modifier named <code>BlobPlanet</code>. Open the GN editor. Group sockets: <code>W_Anim</code> (Float, default&nbsp;0), <code>Macro_Amplitude</code> (Float, 0.28), <code>Micro_Amplitude</code> (Float, 0.055).</li>
        <li>Two <strong>Math ADD</strong> nodes with constants 3.0 and 17.0. Wire <code>W_Anim</code> → both inputs[0]. These are the W seed offsets.</li>
        <li>Two <strong>Noise Texture</strong> nodes, both <code>4D</code> mode. Macro: Scale 1.5 / Detail 2 / Roughness 0.40 / Distortion 0.08. Micro: Scale 9.0 / Detail 5 / Roughness 0.65 / Distortion 0.0. Connect <strong>Input → Position</strong> → both Vector inputs. Connect ADD outputs → W inputs.</li>
        <li>For each noise layer: <strong>Math SUBTRACT 0.5</strong> → <strong>Math MULTIPLY 2.0</strong> → <strong>Math MULTIPLY</strong> (connected to the amplitude group socket). Centres the Fac and scales by the controllable amplitude.</li>
        <li><strong>Math ADD</strong> the two amplitude outputs → combined displacement scalar.</li>
        <li>Normalise for elevation: <strong>Math ADD 0.335</strong> (MAX_LIFT) → <strong>Math DIVIDE 0.67</strong> (2&times;MAX_LIFT), clamp on. Wire through <strong>Store Named Attribute</strong> (Float, POINT, name <code>elevation_fac</code>). Group Input Geometry → Store Geometry in.</li>
        <li><strong>Input → Normal</strong>. <strong>Vector Math SCALE</strong>: Normal → input[0], combined scalar → Scale. This is the offset vector.</li>
        <li><strong>Geometry → Set Position</strong>: Store Geometry out → Set Position Geometry. Scale vector → Offset. Set Position Geometry → Group Output.</li>
        <li>Animate: right-click <code>W_Anim</code> in the modifier panel → Add Driver. Type = Scripted Expression, expression <code>frame * 0.04167</code>.</li>
        <li>Material: ShaderNode Attribute (GEOMETRY, <code>elevation_fac</code>) → ColorRamp Fac (indigo at 0, green at 0.45, gold at 1.0) → Principled BSDF Base Color. Roughness 0.75.</li>
        <li>Play timeline. Blob breathes. Adjust amplitude sockets to taste. Export GLB with Draco level 6, Apply Modifiers, Export Custom Attributes.</li>
      </ol>

      <h2>Failure modes</h2>
      <p>
        <strong>Surface only expands, never contracts</strong>: Fac not centred.
        Add the SUBTRACT 0.5 step before multiplying by amplitude.
      </p>
      <p>
        <strong>Colour does not match deformation</strong>: StoreNamedAttribute
        is downstream of SetPosition. Move the Store node upstream.
      </p>
      <p>
        <strong>GLB elevation_fac attribute absent</strong>: enable{" "}
        <em>Export Custom Attributes</em> (<code>export_attributes=True</code>)
        in the glTF exporter. Without it, the named attribute is silently
        dropped and Three.js has no elevation data.
      </p>

      <h2>Going further</h2>
      <p>
        Pair with a{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal"
          className={lk}
        >
          Simulation Zone
        </Link>{" "}
        to accumulate frame-to-frame displacement as a secondary effect on top
        of the noise base. Tie the W speed to a custom property via an{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-drivers-parametric-shader"
          className={lk}
        >
          animation driver
        </Link>{" "}
        for live speed control. For terrain instead of a closed sphere, replace
        the UV sphere with a Subdivided Grid and use only the Z component of
        the offset vector rather than scaling the full Normal.
      </p>
      <p>
        The frozen <code>elevation_fac</code> attribute survives GLB export as
        a custom accessor (<code>_ELEVATION_FAC</code>) readable in Three.js
        r152+ for GPU elevation-mapped shading without re-deriving height in
        the vertex shader &mdash; the same pattern underlying the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-attribute-statistic-evaluate-on-domain"
          className={lk}
        >
          Attribute Statistic heat map
        </Link>.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/write/set_position.html"
            target="_blank" rel="noopener noreferrer" className={lk}
          >
            Set Position Node &mdash; Blender Manual
          </a>{" "}
          (CC-BY-SA 4.0, Blender Documentation Team)
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            target="_blank" rel="noopener noreferrer" className={lk}
          >
            njanakiev/blender-scripting
          </a>{" "}
          (MIT, Nicolas Janakiev) &mdash; related:{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting/blob/master/scripts/noise_landscape.py"
            target="_blank" rel="noopener noreferrer" className={lk}
          >
            noise_landscape.py
          </a>
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            target="_blank" rel="noopener noreferrer" className={lk}
          >
            KhronosGroup/glTF-Blender-IO
          </a>{" "}
          (Apache-2.0, Khronos Group) &mdash; custom attribute export spec
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-geometry-proximity-deform" className={lk}>
            GN Geometry Proximity Deform
          </Link>{" "}
          &mdash; distance-based displacement vs noise-based; complementary tools
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute" className={lk}>
            Capture Attribute + Named Attribute
          </Link>{" "}
          &mdash; freeze-before-deform discipline in depth
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-eevee-toon-cel-shader" className={lk}>
            EEVEE Toon Cel Shader
          </Link>{" "}
          &mdash; attribute-driven colour ramp technique
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-animation-drivers-parametric-shader" className={lk}>
            Animation Drivers + Parametric Shader
          </Link>{" "}
          &mdash; scene-frame drivers for continuous animation
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal" className={lk}>
            GN Simulation Zone Wave Reveal
          </Link>{" "}
          &mdash; pairing noise displacement with frame-accumulating simulation
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-gn-set-position-noise-displacement",
  title: "GN Set Position + Noise Texture — Animated Blob Planet",
  category: "blender",
  date: "2026-06-05",
  goal: "Displace a UV sphere along vertex normals using dual-scale 4D Noise Texture, animate via W-axis scene-frame driver, and freeze an elevation attribute before deformation for stable colour mapping.",
  tags: [
    "blender",
    "geometry-nodes",
    "set-position",
    "noise-texture",
    "displacement",
    "animation",
    "drivers",
    "attributes",
    "blender-5-1",
  ],
  body: GnSetPositionNoiseDisplacementBody,
});
