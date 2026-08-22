import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every pixel Blender shows you is the product of two separate
        pipelines: the <em>scene</em> pipeline that accumulates physical
        light, and the <em>display</em> pipeline that maps those linear-light
        values onto a monitor that only speaks in sRGB. The display pipeline
        is controlled by <code>bpy.context.scene.view_settings</code> and
        the underlying OpenColorIO configuration. Getting it wrong does not
        cause an error — it causes work that looks correct in Blender but
        wrong everywhere else, and baked textures that are subtly
        mis-encoded in ways that are nearly invisible until a client puts the
        asset into a real-time engine. This tutorial builds a reference
        colour chart, wires up the AgX display transform via Python, and
        establishes the bake-safe colorspace rules that prevent these silent
        failures.
      </p>

      <p>
        AgX, introduced as Blender&rsquo;s default display transform in
        4.0, takes a different approach to the tone-mapping problem than
        Filmic. Filmic applies its sigmoid compression per-channel after
        scene-linear values enter the display pipeline; when one channel
        clips before another (e.g. the red channel saturates on a hot skin
        highlight) you get a hue shift toward the unsaturated channels —
        that classic &ldquo;orange at overexposure&rdquo; look. AgX pre-multiplies
        scene-linear values by a 3×3 matrix before the sigmoid, rotating
        the colour primaries into an &ldquo;analogue&rdquo; working space where
        the sigmoid compresses all channels more evenly. The result preserves
        hue at high exposure — the same bright skin tone looks white rather
        than orange. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-world-node-tree-hdri-environment-lighting-rig"
          className={lk}
        >
          HDRI environment lighting rig tutorial
        </Link>{" "}
        covers the upstream lighting decisions that feed into this pipeline.
      </p>

      <h2>The view_settings API</h2>
      <p>
        The core properties are on{" "}
        <code>bpy.context.scene.view_settings</code>:
      </p>
      <ul>
        <li>
          <strong>view_transform</strong> — the named OCIO view transform:{" "}
          <code>&apos;AgX&apos;</code>, <code>&apos;Filmic&apos;</code>,{" "}
          <code>&apos;Standard&apos;</code>, <code>&apos;Raw&apos;</code>,{" "}
          <code>&apos;False Color&apos;</code>. Names are config-specific — the
          bundled Blender config ships these five.
        </li>
        <li>
          <strong>look</strong> — a per-view-transform creative adjustment.
          AgX ships with <code>&apos;None&apos;</code>, <code>&apos;Punchy&apos;</code>{" "}
          (slightly lifted contrast and saturation), and{" "}
          <code>&apos;Greyscale&apos;</code>. Filmic has seven contrast presets.
          Crucially, look names are <em>not shared</em> across transforms —
          switching from Filmic High Contrast directly to AgX raises a{" "}
          <code>RuntimeError</code>. Always set{" "}
          <code>look&nbsp;=&nbsp;&apos;None&apos;</code> before changing{" "}
          <code>view_transform</code>.
        </li>
        <li>
          <strong>exposure</strong> — stops of pre-sigmoid exposure
          correction. +1 doubles scene-linear values before the display
          transform; does not affect render output when baking.
        </li>
        <li>
          <strong>gamma</strong> — a power-function correction applied
          after the display transform. Use sparingly: values other than
          1.0 make the viewport disagree with colour pickers.
        </li>
        <li>
          <strong>use_curve_mapping</strong> — enables a custom CCurveMapping
          that stacks after the display transform. Call{" "}
          <code>curve_mapping.initialize()</code> before accessing curve
          points, or it raises <code>AttributeError</code> on a null C
          pointer.
        </li>
      </ul>

      <h2>The bake-safe colorspace rule</h2>
      <p>
        Baked textures must be stamped with the correct colorspace before the
        bake starts — Blender reads the setting when writing pixel data, not
        when displaying the image, so the viewport can look correct even when
        the encoding is wrong.
      </p>
      <ul>
        <li>
          <strong>Albedo / diffuse colour</strong> →{" "}
          <code>sRGB</code>. Artists pick colours in sRGB; the bake stores
          them in sRGB; the runtime reads them in sRGB. The full circle is
          consistent.
        </li>
        <li>
          <strong>Normal map</strong> →{" "}
          <code>Non-Color</code>. Packed XYZ vectors in the −1…+1 range,
          remapped to 0…1 for storage. If the image is marked sRGB, the
          runtime applies a gamma-decode on load, shifting X/Y/Z and
          producing a surface that shades correctly in Blender (which
          compensates) but incorrectly in Three.js (which does not).
        </li>
        <li>
          <strong>Roughness / metallic / AO / displacement</strong> →{" "}
          <code>Non-Color</code>. All linear physical scalars.
        </li>
        <li>
          <strong>Emission (HDR)</strong> → <code>Linear</code>. High-dynamic-range
          contribution bakes need full float precision;{" "}
          <code>float_buffer=True</code> on image creation, colorspace{" "}
          <code>&apos;Linear&apos;</code>.
        </li>
      </ul>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-cycles-batch-bake-normal-ao-emission-webxr"
          className={lk}
        >
          Cycles batch bake pipeline tutorial
        </Link>{" "}
        shows the operator calls; this tutorial explains <em>why</em> the
        colorspace on each image differs.
      </p>

      <h2>The snapshot/restore pattern</h2>
      <p>
        A batch render job that needs <code>Raw</code> output (scene-linear
        for a lightmap) must switch away from AgX, render, then restore the
        artist&rsquo;s view. Without a restore step, the next person to open
        the file sees Raw-encoded grey instead of the familiar colour-graded
        viewport. The blueprint provides two helpers:
      </p>
      <pre>{`snap = snapshot_view_settings()       # captures transform/look/exposure
configure_color_management('Raw', 'None')
bpy.ops.render.render(write_still=True)
restore_view_settings(snap)           # puts AgX+Punchy back`}</pre>
      <p>
        The restore helper resets look to <code>&apos;None&apos;</code> first,
        then restores <code>view_transform</code>, then look — the only
        order that avoids the cross-transform name collision.
      </p>

      <h2>False Color for exposure diagnostics</h2>
      <p>
        The <code>False Color</code> view transform replaces luminance
        values with a heat-map: blue is underexposed, green/yellow is
        correctly exposed, red is overexposed. It is the fastest way to
        verify that a colour chart is correctly placed on the exposure
        curve before any tone-mapping decision is made. Toggle it with{" "}
        <code>vs.view_transform&nbsp;=&nbsp;&apos;False Color&apos;</code> — note
        that <code>look</code> must be <code>&apos;None&apos;</code> first,{" "}
        <em>and</em> the Raw/False Color restriction means any look assignment
        raises a <code>RuntimeError</code> regardless.
      </p>

      <h2>Reading the loaded OCIO config</h2>
      <p>
        <code>bpy.context.preferences.system.ocio_config_path</code> returns
        the path to the active config file, or an empty string when the
        bundled Blender default is in use. This property is <strong>read-only</strong>{" "}
        in Blender 5.1 — you cannot swap configs from Python. If a user
        reports that a look name does not exist, reading this path and
        comparing it to the expected bundled config location is the first
        diagnostic step. The OCIO configuration is the truth table for every
        <code>view_transform</code> and <code>look</code> name the API accepts;
        mismatches between the expected config and the loaded one are the root
        cause of nearly all &ldquo;invalid view transform&rdquo; errors seen in
        studio automation scripts.
      </p>

      <h2>Pitfalls</h2>
      <ul>
        <li>
          <strong>look must be &apos;None&apos; before view_transform change.</strong>{" "}
          Scripted in the wrong order, the transition raises{" "}
          <code>RuntimeError: bpy_struct: item.attr = val: enum &apos;XYZ&apos; not
          found in (&apos;None&apos;, &apos;Punchy&apos;, &apos;Greyscale&apos;)</code>.
        </li>
        <li>
          <strong>Raw and False Color reject all look values.</strong>{" "}
          These transforms carry no looks in the bundled config. Assigning
          any look string — even <code>&apos;None&apos;</code> — after setting these
          transforms can raise depending on OCIO version; the safe pattern is
          to guard with <code>if view_transform not in (&apos;Raw&apos;, &apos;False Color&apos;)</code>.
        </li>
        <li>
          <strong>display_device names are config-specific.</strong>{" "}
          Attempting to set <code>display_settings.display_device&nbsp;=&nbsp;&apos;P3-D65&apos;</code>{" "}
          on a machine with only the Blender bundled config (which has only{" "}
          <code>&apos;sRGB&apos;</code>) raises a silent no-op or an error depending on
          5.1 sub-version.
        </li>
        <li>
          <strong>Bake colorspace is not the viewport colorspace.</strong>{" "}
          The view_settings pipeline is <em>display-only</em> — it has no
          effect on what values are written to a bake image. Two images with
          identical pixel data but different <code>colorspace_settings.name</code>{" "}
          values will look identical in Blender&rsquo;s image viewer but be
          interpreted differently by Three.js, Godot, or Unreal. The{" "}
          <Link
            href="/tutorials/blender-tutorial-shader-vector-displacement-multires-bake-cycles"
            className={lk}
          >
            vector displacement bake tutorial
          </Link>{" "}
          has the specific gotcha for EXR images: even a float-buffer image
          marked <code>sRGB</code> will be decoded on import, scaling
          displacement by 2.2 and producing an artefact with no error message.
        </li>
        <li>
          <strong>Halftone / stylised shaders need sRGB bake for albedo.</strong>{" "}
          The{" "}
          <Link
            href="/tutorials/blender-tutorial-shader-to-rgb-halftone-cel-shade-webxr"
            className={lk}
          >
            Shader to RGB halftone pipeline
          </Link>{" "}
          bakes the post-cel-shade colour to albedo — the output must be{" "}
          <code>sRGB</code> because the halftone dot colour is an artist-
          authored display value, not a linear physical quantity.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/color_management.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Blender Foundation — Colour Management manual
          </a>{" "}
          (CC-BY-SA-4.0) — authoritative reference for all OCIO integration
          points, AgX design rationale, and the look transform naming
          convention used in the bundled config.
        </li>
        <li>
          <a
            href="https://github.com/AcademySoftwareFoundation/OpenColorIO"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            AcademySoftwareFoundation/OpenColorIO
          </a>{" "}
          (Apache-2.0, Academy Software Foundation) — the open-source colour
          management framework underlying Blender&rsquo;s view_settings pipeline.
          The sibling project{" "}
          <a
            href="https://github.com/AcademySoftwareFoundation/Imath"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            AcademySoftwareFoundation/Imath
          </a>{" "}
          (BSD-3-Clause) provides the half-float and matrix types used in
          OCIO&rsquo;s LUT arithmetic.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-scene-color-management-agx-ocio-bake-safe",
  title:
    "Python scene.view_settings — AgX Colour Management, Look Transforms & Bake-Safe Linear Pipeline (Blender 5.1)",
  libraryPath:
    "blends/scripting/python-scene-color-management-agx-ocio-bake-safe",
  date: "2026-07-05",
  body: Body,
  tags: [
    "blender",
    "python",
    "scripting",
    "color-management",
    "agx",
    "ocio",
    "baking",
    "webxr",
    "filmic",
    "display-transform",
  ],
});
