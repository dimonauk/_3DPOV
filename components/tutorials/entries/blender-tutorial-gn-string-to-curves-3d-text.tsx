import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnStringToCurves3dTextBody() {
  return (
    <>
      <p>
        Blender&#39;s <strong>String to Curves</strong> node is the
        Geometry Nodes-native text pipeline.  Unlike the traditional Text
        Object — which lives outside GN and cannot be driven by group inputs
        — <code>GeometryNodeStringToCurves</code> exposes the string as a
        group socket.  That socket can be set from a Python script, swept by a
        driver expression, or read from a custom object property, making it
        suitable for generative workflows where label text changes per instance.
        The node accepts a <code>bpy.types.VectorFont</code> data-block via its
        <code>font</code> property; Blender&#39;s built-in BFont (Apache-2.0)
        loads without touching the filesystem via{" "}
        <code>bpy.data.fonts.load("&lt;builtin&gt;")</code>.  For custom
        lettering, any .ttf or .otf loaded by the same call works identically —
        the{" "}
        <a
          href="https://github.com/rsms/inter"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Inter typeface (OFL 1.1, Rasmus Andersson)
        </a>{" "}
        and the{" "}
        <a
          href="https://github.com/google/fonts"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Fonts collection (Apache-2.0 / OFL)
        </a>{" "}
        both provide high-quality geometric sans letterforms that extrude
        cleanly without spiky corner artefacts.
      </p>

      <p>
        The critical subtlety of <code>StringToCurves</code> is its output
        socket type: the node produces <strong>Curve Instances</strong>, not a
        flat merged curve.  Each character is a separate instance carrying its
        own curve splines.  <code>FillCurve</code> operates on splines — it
        cannot fill an instances container and silently returns an empty mesh if
        fed one directly.  The fix is{" "}
        <code>GeometryNodeRealizeInstances</code> between the two: it collapses
        all character instances into one flat curve geometry with real splines
        that <code>FillCurve</code> can iterate over.  This is the same
        realise-before-operate discipline required whenever you pass instance
        geometry to a node that expects a concrete domain — compare the
        realise step at the end of the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-mesh"
          className={lk}
        >
          Curve to Mesh tutorial
        </Link>
        , where instances must be realised before GLB export to write a
        full vertex buffer rather than only the single prototype curve.
      </p>

      <p>
        After <code>FillCurve</code> produces a flat face-per-letter mesh,{" "}
        <strong>
          <code>ExtrudeMesh</code>
        </strong>{" "}
        in <code>FACES</code> mode converts it to solid letters.  The
        distinction between <em>Individual Faces</em> on and off is non-obvious
        until you hit it: with the flag off, Blender treats all filled faces as
        a single slab and extrudes only the outer boundary of the entire string
        — leaving the gaps between characters hollow and joining adjacent
        letters into a single connected lump.  With Individual Faces on, every
        polygon extrudes independently, so each letter gets its own side walls
        and back face.  This is the same per-face independence used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-extrude-mesh-panel-lines"
          className={lk}
        >
          Extrude Mesh panel-lines tutorial
        </Link>{" "}
        to keep adjacent panels topologically separate.  The{" "}
        <code>Offset</code> input receives a{" "}
        <code>ShaderNodeCombineXYZ</code> with only the Z channel wired from
        the group&#39;s <em>Depth</em> input — this constrains the extrusion
        to the letter&#39;s normal direction (world +Z for a face-up text
        mesh) without needing a face-normal field.
      </p>

      <p>
        Hard machine-cut letter edges look flat under any directional light
        regardless of the Roughness or Metallic values in the Principled BSDF.
        A small <code>BevelMesh</code> pass — 0.008 m, 2 segments, operating
        on all edges — creates the narrow specular highlight rim that reads as
        a physically plausible manufactured edge.  Two segments produce a
        45°-fillet approximation; adding more segments approaches a true round
        but multiplies edge-loop count.  For WebXR delivery, 2 segments is the
        sweet spot: the visual difference versus a true round is imperceptible
        at typical viewing distances, and the vertex budget stays modest enough
        for Draco level 6 to compress efficiently.  This is the same reasoning
        behind the procedural edge-wear ramp in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-procedural-worn-metal-edge-wear"
          className={lk}
        >
          worn-metal shader tutorial
        </Link>
        — that approach achieves the highlight in the shader without adding
        mesh topology; this approach bakes it into topology so it works under
        any shading model including unlit WebXR viewers.  For rounded letter
        corners (as opposed to edge chamfers), see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-fillet-curve-neon-sign"
          className={lk}
        >
          Fillet Curve neon sign tutorial
        </Link>
        , which rounds curve-corner points <em>before</em> filling — a
        complementary technique that softens the outline rather than the edge.
      </p>

      <p>
        <strong>String animation limitation.</strong> Blender has no STRING
        interpolation mode — the timeline cannot tween between two string
        values, and F-curve keyframes are unavailable on String sockets.  To
        animate text, bind a custom String property on the object to the GN
        group input via a Python driver, then keyframe the custom property via
        the standard interface.  Alternatively, bake each frame from a script:{" "}
        <code>{'mod["Socket_0"] = f"FRAME {i:02d}"'}</code> inside a loop over the
        frame range followed by <code>bpy.ops.wm.save_as_mainfile</code>.  The
        GLB export uses <code>export_apply=True</code> to bake the GN modifier
        before writing — without this flag the exporter writes the empty carrier
        mesh rather than the evaluated letter geometry, exactly as described in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-uv-unwrap-pack-islands-glb"
          className={lk}
        >
          UV Unwrap and Pack Islands GLB export tutorial
        </Link>
        .  See the{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/text/string_to_curves.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender String to Curves node reference
        </a>{" "}
        (CC-BY-SA 4.0, Blender Foundation) for the full socket and property
        listing.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-string-to-curves-3d-text",
  title: "GN String to Curves — Procedural 3D Text Generator",
  kind: "tutorial",
  date: "2026-06-10",
  excerpt:
    "Convert any string into solid, bevelled 3D letter geometry entirely inside Geometry Nodes: StringToCurves → RealizeInstances → FillCurve → ExtrudeMesh → BevelMesh, exported as a WebXR-ready GLB.",
  tags: [
    "blender",
    "geometry-nodes",
    "string-to-curves",
    "fill-curve",
    "extrude-mesh",
    "bevel-mesh",
    "text",
    "typography",
    "webxr",
    "glb",
    "procedural",
  ],
  Body: GnStringToCurves3dTextBody,
  furtherReading: [
    {
      label:
        "String to Curves Node — Blender 5.1 Manual (CC-BY-SA 4.0, Blender Foundation)",
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/text/string_to_curves.html",
    },
    {
      label:
        "Inter Typeface — OFL 1.1, Rasmus Andersson (geometric sans for clean 3D extrusion)",
      href: "https://github.com/rsms/inter",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "40 minutes",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    blenderVersion: "5.1",
    prerequisites: [
      "Familiar with the Geometry Nodes editor: can add nodes, connect sockets, set properties.",
      "Blender 5.1 installed and can run a .py script via the Text Editor workspace.",
      "Understands the Realize Instances node — know when instances must be realised before further operations.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "GeometryNodeStringToCurves is stable since Blender 3.4. GeometryNodeBevelMesh is stable since Blender 4.0. Both are present and unchanged in 5.1.",
      },
    ],
    finalResult:
      'Solid, bevelled 3D letters spelling "HOLOFLOW" in studio teal, driven by a three-socket GN modifier (Text / Depth / Size). Exports as a Draco-compressed GLB with a Principled BSDF metallic material and a 60-frame camera-arc animation.',
    variations: [
      "Swap the built-in BFont for any .ttf: bpy.data.fonts.load('/path/to/font.ttf'). Geometric sans fonts (Inter, Manrope) extrude cleanly; script typefaces require higher Bevel Segments to avoid corner spikes.",
      "Wire the 'Top' output of ExtrudeMesh into BevelMesh's 'Selection' socket to bevel only the leading face edges, leaving the back and side edges sharp — gives a chamfered-front, flat-back look suitable for wall-mount signage.",
      "Set n_fill.mode = 'TRIANGLES' for a fully triangulated manifold mesh before sending to a 3D-print slicer — NGONS can produce non-manifold quads that some slicers reject.",
      "Add a GeometryNodeInputString node connected to a Value node driven by a frame expression to create a per-frame string that changes as the timeline advances — requires re-baking per frame.",
    ],
    troubleshooting: [
      {
        symptom: "FillCurve returns an empty mesh — viewport shows nothing",
        cause:
          "StringToCurves output was connected directly to FillCurve without a RealizeInstances node in between. FillCurve receives an instances container with no curve splines.",
        fix: "Insert GeometryNodeRealizeInstances between the 'Curve Instances' output of StringToCurves and the 'Curve' input of FillCurve.",
      },
      {
        symptom:
          "Letters extrude as a single slab — gaps between characters are missing",
        cause:
          "ExtrudeMesh Individual Faces is False (or the socket is not wired), treating all faces as one boundary.",
        fix: "Set n_extr.inputs['Individual Faces'].default_value = True.",
      },
      {
        symptom: "GLB exports but Three.js shows an empty scene",
        cause:
          "export_apply=True was not set — the NODES modifier was not evaluated before export.",
        fix: "Re-export with export_apply=True in the bpy.ops.export_scene.gltf call.",
      },
      {
        symptom:
          "Non-ASCII characters (accents, CJK) render as boxes or are missing",
        cause:
          "The built-in BFont only covers basic Latin, digits, and common punctuation.",
        fix: "Load a Unicode-complete font: font = bpy.data.fonts.load('/path/to/NotoSans-Regular.ttf'); n_s2c.font = font.",
      },
    ],
  },
  base,
);
