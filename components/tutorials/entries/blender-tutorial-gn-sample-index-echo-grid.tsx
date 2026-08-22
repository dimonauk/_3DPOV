import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnSampleIndexEchoGridBody() {
  return (
    <>
      <p>
        Every field node in Geometry Nodes — <code>Position</code>,{" "}
        <code>Index</code>, <code>Named Attribute</code> — evaluates at the
        element currently being processed. <code>Sample Index</code> breaks
        that rule: you pass it an explicit integer, and it reads the field
        at <em>that</em> index on a geometry you supply. This tutorial uses
        the gap to build a wave-interference deformation on a 15 × 15 grid.
        Each vertex receives its own noise-driven Z displacement plus the
        noise value from the vertex one full row ahead — index offset by{" "}
        <code>ROW_OFFSET = 15</code>. Where the two phases align, crests
        stack; where they oppose, troughs cancel. One noise evaluation, two
        deformation phases, zero simulation nodes.
      </p>
      <p>
        The attribute pipeline links directly to the store / read-back
        pattern covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
          className={lk}
        >
          Capture Attribute tutorial
        </Link>{" "}
        and the domain-context rules explored in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-geometry-proximity-deform"
          className={lk}
        >
          Geometry Proximity tutorial
        </Link>
        . The index arithmetic — accumulate, then modulo — is the same
        building block used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-accumulate-field-spiral-tower"
          className={lk}
        >
          Accumulate Field spiral tower
        </Link>
        .
      </p>

      <h2>Sample Index vs. Named Attribute: the index jump</h2>
      <p>
        <code>InputNamedAttribute("src_z")</code> reads the stored float at
        the <em>current</em> vertex — the one GN is evaluating right now.
        <code>SampleIndex(geometry, InputNamedAttribute("src_z"), echo_idx)</code>{" "}
        reads it at <code>echo_idx</code> instead. The geometry socket is
        mandatory: it pins which mesh the attribute is looked up on,
        separating the <em>evaluation context</em> (the geometry flowing
        downstream) from the <em>lookup target</em> (the frozen pre-
        deformation mesh passed explicitly). Pass the same geometry to both
        and the distinction is invisible at runtime, but architecturally it
        is what allows arbitrary index traversal.
      </p>
      <p>
        <code>SampleIndex</code> has a <code>domain</code> property
        (POINT/EDGE/FACE/CORNER) and a <code>data_type</code> property.
        Set both to match the stored attribute: <code>domain="POINT"</code>,{" "}
        <code>data_type="FLOAT"</code>. The <code>Clamp</code> boolean input
        defaults to False here because modulo wrapping already guarantees
        the index is in range — clamping would make the last row repeat
        rather than wrap.
      </p>

      <h2>Why StoreNamedAttribute must precede SetPosition</h2>
      <p>
        GN evaluates field nodes lazily inside their geometric context.
        The <code>Position</code> node used to feed the Noise Texture reads
        whichever positions the geometry has <em>at the point the field is
        consumed</em>. If <code>StoreNamedAttribute</code> sat after
        SetPosition, the stored <code>src_z</code> values would already
        contain the deformed Z — and the echo lookup would compound the
        deformation recursively, producing a completely different result.
        Placing the store immediately after <code>GroupInput</code>, before
        any SetPosition, freezes the flat-grid noise values once. Both the
        own-Z and echo-Z reads then draw from the same stable reference,
        and the SetPosition call applies only one controlled sum.
      </p>
      <p>
        The same reasoning applies to the <code>Position</code> node reused
        for the final <code>CombineXYZ</code>: because SetPosition has not
        yet fired in the evaluation order of its own sub-tree, Position
        still yields the flat XY coordinates, which is precisely what keeps
        the horizontal layout intact while only the Z moves.
      </p>

      <h2>Row-offset arithmetic and modulo wrapping</h2>
      <p>
        Blender's <code>primitive_grid_add</code> lays out vertices row by
        row, X varying fastest: index 0 is the bottom-left corner, index
        N_COLS − 1 is the bottom-right, index N_COLS begins row 1. So{" "}
        <code>ROW_OFFSET = N_COLS</code> steps exactly one row forward in
        the +Y direction. The modulo operation —{" "}
        <code>ShaderNodeMath(MODULO, index + ROW_OFFSET, TOTAL_POINTS)</code>{" "}
        — wraps the last row back to row 0, giving a seamless periodic
        boundary. Change ROW_OFFSET to 1 and the echo steps one vertex to
        the right (+X); set it to N_COLS / 2 and peaks run diagonally. The
        only constraint is that ROW_OFFSET must stay below TOTAL_POINTS, or
        the modulo reduces it to an equivalent smaller offset anyway.
      </p>
      <p>
        <code>ShaderNodeMath</code> operates in floats; the integer output
        of <code>GeometryNodeInputIndex</code> is automatically promoted.
        The float result of MODULO is truncated to INT when it enters the{" "}
        <code>SampleIndex.Index</code> socket — Blender performs these
        implicit conversions silently in GN 5.x. If you need exact integer
        semantics (e.g. for very large grids where float precision degrades),
        use <code>FunctionNodeInputInt</code> constants and wire through a
        dedicated integer math node instead.
      </p>

      <h2>Wave interference in practice</h2>
      <p>
        <code>final_Z = own_Z + echo_Z × ECHO_SCALE</code> is a linear
        superposition of two noise samples shifted by one row. When the
        noise is smooth (low Distortion), adjacent rows are similar, so
        ECHO_SCALE ≈ 0.70 produces gentle constructive peaks ~1.70× taller
        than the base. Crank Distortion to 0.80 and the rows become more
        independent — interference becomes genuinely random, with sharp
        spikes and flat nulls across the grid. ECHO_SCALE above 1.0 can
        invert the dominant phase; at ECHO_SCALE = 2.0 the echo is twice
        the base and the interference pattern fully overrides the original
        noise shape. All of this is a live parameter on the modifier panel —
        no re-run of blueprint.py required.
      </p>
      <p>
        For baking the final displaced mesh for WebXR, the workflow mirrors
        the approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          Normal / AO baking tutorial
        </Link>
        : apply the GN modifier first (Object → Apply → All Modifiers), then
        bake normals to a 512 × 512 texture for efficient fragment-level
        detail. The <code>export_apply=True</code> flag in the GLB export
        call already realises the modifier output, so the GLB mesh reflects
        the deformed positions without a manual apply step.
      </p>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          Blender Documentation Team —{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/sample/sample_index.html"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            Sample Index Node
          </a>
          , Blender Manual, CC-BY-SA 4.0. Covers the Geometry, Value,
          Index, and Clamp inputs; the domain property; and the difference
          between Sample Index and the deprecated Evaluate at Index. Related
          nodes in the same section: <em>Sample Nearest</em> and{" "}
          <em>Sample Nearest Surface</em>.
        </li>
        <li>
          Nicolas Janakiev —{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            blender-scripting
          </a>
          , MIT. A library of bpy scripting examples covering primitive
          creation, modifier workflows, and batch export patterns — the same
          style of direct data-API usage (avoiding ops where possible) that
          blueprint.py follows. Related: <em>bpybb</em> (MIT, rich geometry
          helpers) and <em>blender-python-gallery</em> (MIT, visual
          showcase).
        </li>
        <li>
          Khronos Group —{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            glTF-Blender-IO
          </a>
          , Apache-2.0. <code>export_apply=True</code> realises the GN
          modifier output so the GLB binary accessors contain the fully
          deformed vertex positions.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-sample-index-echo-grid",
  title:
    "GN Sample Index — Echo-Grid Interference Deformation (Blender 5.1)",
  date: "2026-06-02",
  kind: "tutorial",
  excerpt:
    "Sample Index reads a field at an arbitrary element index rather than the current one. This tutorial freezes per-vertex noise as 'src_z', then looks it up at index (i + ROW_OFFSET) % TOTAL to build a two-phase wave-interference deformation — constructive peaks where phases align, destructive troughs where they oppose.",
  Body: GnSampleIndexEchoGridBody,
};

export const entry = buildInstructable(
  {
    goal: "Build a 15 × 15 grid mesh with a GN modifier that uses Sample Index to create a two-phase wave-interference deformation: freeze noise Z as 'src_z', look it up at a row-offset index, and add the echo displacement to the base noise. Export a Draco-compressed GLB with the interference pattern baked into vertex positions.",
    blenderVersion: "5.1",
    libraryPath: "blends/geometry-nodes/gn-sample-index-echo-grid",
    time: "1–2 hours",
    difficulty: "intermediate",
    prerequisites: [
      "Blender 5.1 installed",
      "Geometry Nodes modifier basics — adding a GN modifier, navigating the node editor",
      "Familiarity with StoreNamedAttribute and InputNamedAttribute (covered in the Capture Attribute tutorial)",
      "Python scripting access (Scripting workspace or terminal)",
    ],
    steps: [
      {
        title: "Create the flat grid and material",
        body: "Run reset_scene(), then bpy.ops.mesh.primitive_grid_add(x_subdivisions=14, y_subdivisions=14, size=3.0, enter_editmode=False). Name it 'EchoGrid'. Build the EchoGrid material: ShaderNodeAttribute(attribute_type='GEOMETRY', attribute_name='src_z') → ShaderNodeMapRange(From -0.5→+0.5, To 0→1) → ShaderNodeMixRGB(deep teal / ivory) → Principled BSDF. The material reads the frozen src_z attribute for the gradient, making constructive peaks visually bright.",
      },
      {
        title: "Create the GN tree and group sockets",
        body: "bpy.data.node_groups.new('EchoGridGN', 'GeometryNodeTree'). Add OUTPUT Geometry and INPUT Geometry via nt.interface.new_socket(). Add INPUT 'Echo Scale' (NodeSocketFloat, default=0.70, range 0–2) and INPUT 'Row Offset' (NodeSocketInt, default=15). Add NodeGroupInput and NodeGroupOutput nodes.",
      },
      {
        title: "Phase 1 — noise Z at flat positions",
        body: "Add GeometryNodeInputPosition — this evaluates at the flat-grid coordinates because no SetPosition has fired yet. Add ShaderNodeTexNoise (noise_dimensions='3D', Scale=0.9, Detail=3.0, Roughness=0.55, Distortion=0.20). Add ShaderNodeMapRange (clamp=True, From 0→1, To -0.50→+0.50). Wire: Position.Position → Noise.Vector; Noise.Fac → MapRange.Value.",
      },
      {
        title: "Phase 2 — freeze noise Z as 'src_z'",
        body: "Add GeometryNodeStoreNamedAttribute (data_type='FLOAT', domain='POINT', Name='src_z'). Wire: GroupInput.Geometry → Store.Geometry; MapRange.Result → Store.Value. This node is the freeze boundary: all downstream attribute reads reference the flat-grid noise values regardless of what SetPosition does later.",
      },
      {
        title: "Phase 3 — echo index arithmetic",
        body: "Add GeometryNodeInputIndex. Add ShaderNodeMath (operation='ADD'); wire Index.Index → Math_add.inputs[0], GroupInput.Row Offset → Math_add.inputs[1]. Add ShaderNodeMath (operation='MODULO'); wire Math_add.Value → Math_mod.inputs[0]; set Math_mod.inputs[1].default_value = 225.0 (TOTAL_POINTS). The float output feeds into SampleIndex's INT Index socket — Blender truncates automatically.",
      },
      {
        title: "Phase 4 — Sample Index lookup",
        body: "Add GeometryNodeInputNamedAttribute (data_type='FLOAT', Name='src_z') — this is the VALUE field passed to SampleIndex. Add GeometryNodeSampleIndex (data_type='FLOAT', domain='POINT', Clamp=False). Wire: Store.Geometry → SampleIndex.Geometry; NamedAttr_echo.Attribute → SampleIndex.Value; Math_mod.Value → SampleIndex.Index. SampleIndex.Value now outputs src_z at vertex (i + 15) % 225.",
      },
      {
        title: "Phase 5 — own Z + scaled echo Z",
        body: "Add a second GeometryNodeInputNamedAttribute (data_type='FLOAT', Name='src_z') for the current vertex's own Z. Add ShaderNodeMath (MULTIPLY); wire SampleIndex.Value → Multiply.inputs[0], GroupInput.Echo Scale → Multiply.inputs[1]. Add ShaderNodeMath (ADD); wire NamedAttr_own.Attribute → Add_final.inputs[0], Multiply.Value → Add_final.inputs[1]. This is final_Z = own_Z + echo_Z × ECHO_SCALE.",
      },
      {
        title: "Phase 6 — set position and export",
        body: "Add ShaderNodeSeparateXYZ; wire Position.Position → Separate.Vector. Add ShaderNodeCombineXYZ; wire Separate.X → X, Separate.Y → Y, Add_final.Value → Z. Add GeometryNodeSetPosition; wire Store.Geometry → SetPosition.Geometry, Combine.Vector → SetPosition.Position. Add GeometryNodeSetMaterial. Wire SetPosition → SetMaterial → GroupOutput. Attach the GN tree as modifier 'GNEchoGrid'. Update view layer, save as echo_grid.blend, export GLB with export_apply=True, Draco level 6, WebP, export_yup=True.",
      },
    ],
    finalResult:
      "A .blend with a 15 × 15 grid under a GN modifier producing a two-phase wave-interference deformation: deep teal valleys, ivory peaks, live Echo Scale and Row Offset sockets on the modifier panel. A Draco-compressed GLB with the interference baked into vertex positions for WebXR delivery.",
    variations: [
      "Three-phase interference: add a second SampleIndex looking up src_z at (i + 2 × ROW_OFFSET) % TOTAL. Add it to the final Z with a second ECHO_SCALE socket — the three phases create richer interference patterns including isolated spikes.",
      "Animated wave propagation: instead of animating Echo Scale, keyframe Row Offset from 0 to N_COLS over 60 frames. The interference peak location sweeps across the grid like a wave front — use record.py as a base and replace the ECHO_KEY keyframes.",
      "Colour from interference: add a second StoreNamedAttribute storing the echo difference (echo_Z − own_Z) as 'interference'. Use ShaderNodeAttribute('interference') in the material to map negative differences to blue, positive to red — makes the phase relationship visible as a hue gradient.",
    ],
    troubleshooting: [
      {
        symptom: "Flat grid — no deformation visible",
        cause:
          "StoreNamedAttribute 'src_z' Name string is empty or mismatched with the InputNamedAttribute nodes. A mismatched name reads as attribute-not-found → 0 for both own_Z and echo_Z → final_Z = 0 everywhere.",
        fix: "Open the GN editor, select the StoreNamedAttribute node, confirm Name = 'src_z' (exact case). Do the same for both InputNamedAttribute nodes. Use the Spreadsheet (Ctrl+Shift+click the StoreNamedAttribute node) to verify src_z is present at POINT domain with non-zero values.",
      },
      {
        symptom: "Deformation exists but the echo has no effect — peaks look like base noise only",
        cause:
          "GroupInput.Echo Scale socket is 0.0, or the SampleIndex node is not connected to the ADD node. Check Math_multiply.inputs[1] is connected to GroupInput.Echo Scale, not a constant 0.",
        fix: "In the modifier panel, confirm Echo Scale is 0.70. In the GN editor, verify the wire from GroupInput's Echo Scale output reaches Math_multiply.inputs[1].",
      },
      {
        symptom: "SampleIndex raises an 'index out of range' warning in the console",
        cause:
          "Clamp is set to False and the modulo is not working — the echo index exceeds TOTAL_POINTS. This happens if Math_mod.inputs[1].default_value was set to 0 or left unset (defaults to 0 in ShaderNodeMath).",
        fix: "Select Math_mod in the GN editor, set inputs[1].default_value = 225.0 (or TOTAL_POINTS for your grid). Alternatively set Clamp=True on SampleIndex for safety — the last row will repeat rather than wrap, which is a visible but harmless artefact.",
      },
      {
        symptom: "GLB is flat — no deformation in Three.js / WebXR viewer",
        cause:
          "export_apply=True was omitted from the gltf export call. GN modifiers are not evaluated by glTF runtimes; only the base flat mesh was exported.",
        fix: "Pass export_apply=True to bpy.ops.export_scene.gltf. Re-export and reload in the viewer.",
      },
    ],
  },
  base,
);
