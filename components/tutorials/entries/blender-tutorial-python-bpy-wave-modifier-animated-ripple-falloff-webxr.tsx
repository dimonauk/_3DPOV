import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&apos;s <code>WaveModifier</code> applies a travelling sinusoidal
        displacement to mesh vertices over time using a small set of explicit
        controls: amplitude, wavelength, crest sharpness, travel speed, and
        phase offset. Where the{" "}
        <Link href="/tutorials/blender-tutorial-python-bpy-ocean-modifier-beaufort-wave-spectrum-foam-seascape-webxr" className={lk}>
          OceanModifier
        </Link>{" "}
        sums hundreds of FFT sinusoids drawn from a statistical power spectrum,
        Wave is a single, fully deterministic sine — ideal for effects that need
        to be predictable and controllable: pond ripples, speaker-cone vibration,
        a flag hem in a constant breeze, a cape edge oscillating at a fixed
        frequency.
      </p>

      <h2>What Wave actually computes</h2>
      <p>
        At each frame Blender evaluates a travelling-wave function for every
        mesh vertex. For a wave travelling along +X the displacement{" "}
        <code>dZ</code> at position <code>x</code> and time <code>t</code> is:
      </p>
      <pre>{`dZ = height × sin( 2π × (x - speed×t - start_position_x) / width )^narrowness`}</pre>
      <p>
        The exponent <code>narrowness</code> is the part most guides skip. At
        1.0 the envelope is a smooth cosine bell — a broad rolling swell. At
        3.0–4.0 the crest becomes a knife-edge ridge; the troughs widen and
        flatten while the peak stays sharp. This makes narrowness the primary
        knob for &quot;pond ripple vs ocean wave vs corrugated roof sheet.&quot;
      </p>
      <p>
        <code>width</code> is the wavelength — the crest-to-crest distance in
        metres — <em>not</em> the wave width in any colloquial sense. Setting{" "}
        <code>width = 0.30</code> means a new crest appears every 30 cm.
        Setting a high <code>narrowness</code> at wide <code>width</code>{" "}
        produces a sparse sequence of sharp spikes; low <code>narrowness</code>{" "}
        at tight <code>width</code> produces a dense corrugated sheet.
      </p>

      <h2>The vertex group inversion</h2>
      <p>
        The Wave modifier&apos;s <code>vertex_group</code> property suppresses
        displacement where weight is high — the opposite of every other modifier
        that reads a vertex group. Weight <code>1.0</code> means amplitude × 0
        (no displacement). Weight <code>0.0</code> means full amplitude.
      </p>
      <p>
        This inversion is undocumented at the top level and has tripped up
        production rigs countless times. The pattern to remember: assign weight{" "}
        <code>1.0</code> to the region you want <em>still</em>, weight{" "}
        <code>0.0</code> to the region you want <em>moving</em>. A linear
        gradient from the anchored edge inward produces a natural fade-in of the
        wave as it travels away from the boundary.
      </p>
      <p>
        In the blueprint, a 15 % border strip at both ±Y edges carries weight{" "}
        <code>1.0</code> (fully suppressed), fading to <code>0.0</code> at 15 %
        depth inward. This pins the &quot;hem&quot; of the ripple surface — the
        visual equivalent of tacking down a tablecloth at its edges — while the
        centre undulates freely. Without this anchor, the border vertices jump
        discontinuously as the wave exits the mesh, producing an artefact that
        reads as a bug rather than a physical boundary.
      </p>

      <h2>use_normal and use_cyclic</h2>
      <p>
        Two boolean flags alter the displacement direction and boundary
        behaviour:
      </p>
      <ul>
        <li>
          <strong>use_normal = False</strong> (default) — displacement is along
          global +Z. Correct for a horizontal ripple surface.{" "}
          <strong>use_normal = True</strong> — displacement follows each
          vertex&apos;s face normal. Use this when the base mesh is curved (a
          bowl, a sphere, a cylinder) and you want the wave to pulsate
          outward rather than rising and falling in world space.
        </li>
        <li>
          <strong>use_cyclic = True</strong> — the wave phase wraps at the mesh
          boundary so the leading edge of the wave re-enters from the opposite
          side with no visible discontinuity. Mandatory for tiling floor panels
          or looping WebXR environment textures; counterproductive for bounded
          props where you want the wave to exit and not return.
        </li>
      </ul>

      <h2>time_offset and start position</h2>
      <p>
        <code>time_offset</code> shifts the wave phase at frame 0. A value of
        0.0 means the wave origin sits at <code>start_position_x</code> on frame
        0 with zero displacement. A negative value — <code>−0.4</code> in the
        blueprint — means the wave has already been travelling for 0.4 seconds
        when the timeline begins. This prevents the abrupt wall of motion at
        frame 1 that makes an animation read as &quot;scripted&quot; rather than
        continuous.
      </p>
      <p>
        <code>start_position_x</code> controls where on the mesh the wave
        originates. Placing it at <code>−GRID_SIZE / 2.0</code> makes the wave
        enter from the left edge — the natural reading direction for a surface
        the viewer watches from the front. Shifting it to the mesh centre
        produces a standing-wave interference pattern (combined with a mirror
        along X) that is useful for speaker-cone or pond-drop effects.
      </p>

      <h2>Headless snapshot for GLB</h2>
      <p>
        The Wave modifier is an animated deformer — the mesh changes every frame.
        For a static GLB asset the blueprint captures the peak-displacement pose
        at frame 20 using{" "}
        <code>bpy.data.meshes.new_from_object(ev, depsgraph=dg)</code>. This
        call resolves the full modifier stack via the dependency graph and returns
        a frozen <code>Mesh</code> data-block — no 3D Viewport context required.
      </p>
      <p>
        The snapshot is bound to a temporary export object (so the live animated
        object is undisturbed in the .blend file), exported as a Draco-compressed
        GLB with <code>export_yup=True</code>, and then removed. Compare this
        with the{" "}
        <Link href="/tutorials/blender-tutorial-python-bpy-displace-modifier-texture-height-terrain-glb-webxr" className={lk}>
          DisplaceModifier terrain tutorial
        </Link>
        , which uses the same headless snapshot pattern for a static height field
        — but the Wave blueprint additionally preserves the modifier-animated
        original so the .blend file stays live for further iteration.
      </p>

      <h2>Parameter interaction cheatsheet</h2>
      <pre>{`height      = 0.12   # amplitude (metres)
width       = 0.30   # wavelength, crest-to-crest (metres)
narrowness  = 1.8    # crest sharpness: 1=rolling swell, 4=knife ridge
speed       = 0.55   # travel speed (metres/second)
time_offset = -0.4   # negative = pre-started; avoids frame-0 pop

# VG inversion rule (always invert your intuition):
# weight 1.0 → fully suppressed (zero displacement)
# weight 0.0 → full displacement`}</pre>

      <h2>Connecting to the Geometry Nodes approach</h2>
      <p>
        The{" "}
        <Link href="/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal" className={lk}>
          GN Simulation Zone wave-reveal tutorial
        </Link>{" "}
        achieves a similar travelling-wave effect by accumulating per-vertex
        offsets across simulation frames. The two approaches have different
        trade-offs:{" "}
      </p>
      <ul>
        <li>
          Wave modifier — deterministic formula, no simulation cache, restartable
          at any frame, zero render-time overhead. Cannot produce branching or
          reaction-diffusion effects.
        </li>
        <li>
          GN Simulation Zone — arbitrary logic per-frame, can accumulate history,
          can interact with other attributes. Requires a simulation cache; cannot
          be seeked backwards without re-simulating from frame 0.
        </li>
      </ul>
      <p>
        For a simple periodic ripple the Wave modifier is almost always the
        correct choice — cheaper, more predictable, and easier to control
        parametrically from a Python script.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Mesh too coarse to resolve wave</strong> — the sine becomes
          jagged stair-steps. Rule of thumb: ≥ 8 vertices per wavelength
          (GRID_X=64 at GRID_SIZE=2 m gives ~9 verts/wavelength at
          WAVE_WIDTH=0.30 m).
        </li>
        <li>
          <strong>Border vertices jumping</strong> — falloff vertex group not
          assigned, or weights set the wrong way round (0.0 at border). Check
          weight paint: border should be red (1.0).
        </li>
        <li>
          <strong>No motion at frame 0</strong> — wave origin is within the mesh
          at time 0 and hasn&apos;t reached most vertices yet. Either increase
          <code>|time_offset|</code> or move <code>start_position_x</code>
          further into negative territory.
        </li>
        <li>
          <strong>GLB exports flat mesh</strong> — snapshot taken at frame 0
          before the wave has displaced anything. Increase{" "}
          <code>PEAK_FRAME</code> or reduce <code>|time_offset|</code> so the
          desired displacement is active at the snapshot frame.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Blender Wave Modifier Manual</strong> — Blender Foundation,{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/wave.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.blender.org
          </a>{" "}
          (CC-BY-SA-4.0). The authoritative reference for all modifier properties.
          Related projects:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            projects.blender.org
          </a>{" "}
          and the{" "}
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.WaveModifier.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.WaveModifier API ref
          </a>
          .
        </li>
        <li>
          <strong>KhronosGroup/glTF-Blender-IO</strong> — Khronos Group,{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/KhronosGroup/glTF-Blender-IO
          </a>{" "}
          (Apache-2.0). The official Blender GLB exporter, which handles
          Draco compression, +Y-up convention, and normals export. Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF specification
          </a>
          .
        </li>
      </ul>

      <h2>Further study in this library</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-displace-modifier-texture-height-terrain-glb-webxr"
            className={lk}
          >
            DisplaceModifier + bpy.data.textures — procedural height-field terrain
          </Link>{" "}
          — static texture-driven displacement vs the Wave modifier&apos;s
          time-animated sine; same headless-snapshot GLB export pattern.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-ocean-modifier-beaufort-wave-spectrum-foam-seascape-webxr"
            className={lk}
          >
            OceanModifier — Beaufort Scale FFT Wave Spectrum & Foam Attribute
          </Link>{" "}
          — when you need stochastic, physically-plausible seas instead of a
          single periodic wave.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal"
            className={lk}
          >
            GN Simulation Zone — wave reveal
          </Link>{" "}
          — accumulating per-vertex history in a simulation zone for a
          directional &quot;reveal&quot; sweep effect.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-vertex-weight-proximity-modifier-distance-mask-physics-vrm"
            className={lk}
          >
            VertexWeightProximityModifier — distance-driven mask & cloth physics VRM
          </Link>{" "}
          — another modifier that reads a vertex group to spatially modulate its
          effect; useful to compare against the Wave modifier&apos;s inverted
          convention.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-wave-modifier-animated-ripple-falloff-webxr",
  title:
    "Python bpy.types.WaveModifier — Sinusoidal Ripple Displacement, Falloff Vertex Group & Peak-Frame GLB for WebXR (Blender 5.1)",
  description:
    "Script a 64×64 grid with a travelling sine wave, pin the hem edges via an inverted falloff vertex group, and bake a peak-displacement GLB snapshot for WebXR — with expert coverage of narrowness vs width, use_normal, use_cyclic, and time_offset.",
  date: "2026-07-18",
  topic: "scripting",
  tags: [
    "blender",
    "python",
    "scripting",
    "modifier",
    "wave",
    "ripple",
    "animation",
    "vertex-group",
    "falloff",
    "webxr",
    "glb",
    "deform",
  ],
  libraryPath:
    "blends/scripting/python-bpy-wave-modifier-animated-ripple-falloff-webxr",
  Body,
  keyInsights: [
    "narrowness controls crest sharpness (1=rolling swell, 4=knife-edge ridge); width is wavelength — they are independent and commonly confused",
    "The Wave modifier inverts the vertex group convention: weight 1.0 = zero displacement, weight 0.0 = full displacement — opposite of every other modifier",
    "use_normal=True displaces along face normals rather than global Z; essential for curved surfaces where you want outward pulsation",
    "use_cyclic=True wraps the phase at mesh boundaries for seamless tiling; counterproductive for bounded props",
    "time_offset < 0 starts the wave mid-travel at frame 0, preventing the frame-1 pop that reads as 'scripted'",
    "bpy.data.meshes.new_from_object(ev, depsgraph=dg) snapshots the evaluated mesh at any frame headlessly — no 3D Viewport context required",
  ],
});
