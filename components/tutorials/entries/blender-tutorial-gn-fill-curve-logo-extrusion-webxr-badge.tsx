import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnFillCurveLogoExtrusionBody() {
  return (
    <>
      <p>
        Most Geometry Nodes curve tutorials end at the surface of the mesh —
        a tube swept along a path, beads threaded on a spline, text converted to
        geometry. <strong>Fill Curve</strong> does something different: it fills
        the <em>interior</em> of a closed cyclic spline with a flat face mesh.
        That face mesh is the 2-D starting point for badge extrusion, letterform
        depth, architectural cross-sections, and any shape that begins life as a
        designer-drawn outline. The GN pipeline is always the same:{" "}
        <code>Fill Curve → Extrude Mesh → Smooth by Angle → GLB</code>. What
        varies is what goes <em>into</em> Fill Curve — and that is where{" "}
        <strong>Set Spline Type</strong> becomes indispensable.
      </p>

      <p>
        The central lesson of this tutorial is the spline-type interaction with
        Fill Curve. Send a six-point bezier hexagon directly into Fill Curve
        at curve resolution&nbsp;12 and the fill receives 72&nbsp;outline
        vertices — a near-perfect circle, nowhere near the intended crisp six
        sides. Place <strong>Set Spline Type</strong> (set to{" "}
        <code>POLY</code>) between the curve object and Fill Curve, and the
        fill receives exactly the six control points: a precise hexagon with
        straight edges. The bezier curve data in the scene is untouched —
        you retain smooth editing handles — while the GN tree operates on the
        polygon that those handles <em>imply</em>. This separation of
        &ldquo;design intent (bezier)&rdquo; from &ldquo;fill geometry
        (poly)&rdquo; is the correct pattern for logo-to-3D pipelines in
        Blender 5.1.
      </p>

      <h2>Fill Curve modes: TRIANGLES vs NGONS</h2>
      <p>
        The <code>mode</code> property on Fill Curve is the first decision you
        make:
      </p>
      <ul>
        <li>
          <strong>TRIANGLES</strong> — the fill mesh is fully triangulated via
          Blender&rsquo;s constrained Delaunay routine. Safe for WebXR GLB export
          because WebGL requires triangles; no ambiguity in the exporter&rsquo;s
          own triangulation pass. A convex hexagon produces eight triangles (six
          fan triangles from a central vertex, four for the centre quad). For the{" "}
          <Link
            href="/tutorials/blender-tutorial-gn-triangulate-mesh-webxr-tri-safe-export"
            className={lk}
          >
            WebXR tri-safe export pipeline
          </Link>
          , always prefer this mode.
        </li>
        <li>
          <strong>NGONS</strong> — the fill is a single n-gon face. Cleaner for
          chaining into further GN operations: a Subdivide Mesh on an n-gon
          distributes new vertices more evenly than on a pre-triangulated mesh
          because the subdivision algorithm uses the face&rsquo;s natural
          centre. Also better for then running Extrude Mesh, since the single top
          cap remains one face (addressable as a single material zone without
          boolean logic). Use NGONS when the badge will undergo more GN
          operations before export; use TRIANGLES when the fill is the final
          polygon geometry.
        </li>
      </ul>

      <h2>Why Set Spline Type is not optional</h2>
      <p>
        A bezier spline in Blender has a <code>resolution_u</code> property: the
        number of subdivisions per segment between control points. At the default
        value of 12, a six-segment cyclic hexagon evaluates to{" "}
        <code>6 × 12 = 72</code> outline vertices. Fill Curve receives these 72
        evaluated points and triangulates them — producing a 72-sided polygon
        that looks like a circle. Changing <code>resolution_u</code> to 1 would
        give the correct six-sided result, but it also affects how the curve
        looks in every other context (viewport display, Curve to Mesh, animation
        paths). That is a destructive change.{" "}
        <code>Set Spline Type → POLY</code> converts only within the GN tree,
        at evaluation time. The scene-level curve keeps its resolution; the fill
        sees only the six control points. This is the non-destructive solution.
      </p>
      <p>
        The other valid use of Set Spline Type is converting to <code>NURBS</code>
        for downstream nodes that require uniform-weight rational splines, or
        converting <em>from</em> NURBS to POLY when you need exact vertex
        placement. In practice, POLY conversion is the most common: it
        &ldquo;locks&rdquo; a curve&rsquo;s outline for fill, weld, or
        triangulation. Compare Set Spline Type to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-fillet-curve-neon-sign"
          className={lk}
        >
          Fillet Curve node
        </Link>
        , which adds rounding <em>after</em> the control points: Fillet modifies
        the poly outline, Set Spline Type converts the type before any
        modification.
      </p>

      <h2>Extrude Mesh on a flat Fill Curve output</h2>
      <p>
        Fill Curve produces a flat face mesh (all vertices at Z&nbsp;=&nbsp;0
        when the source spline is in the XY plane). Extrude Mesh in{" "}
        <code>FACES</code> mode takes this face and extrudes it along the
        supplied offset vector. With offset <code>(0, 0, −0.20)</code> the badge
        acquires 0.20&nbsp;m of depth. Two boolean field outputs are the key to
        material assignment:
      </p>
      <ul>
        <li>
          <strong>Top</strong> — True on the new face created at the end of the
          extrusion (the back cap, at Z&nbsp;=&nbsp;−0.20).
        </li>
        <li>
          <strong>Side</strong> — True on the six newly created side-wall quads.
        </li>
        <li>
          <strong>Neither</strong> — the original fill face at Z&nbsp;=&nbsp;0
          (the &ldquo;front&rdquo; of the badge, the gold emission face). Select
          it with <code>NOT(Top) AND NOT(Side)</code> using two Boolean Math
          nodes.
        </li>
      </ul>
      <p>
        The same Top / Side outputs used here appear in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-extrude-mesh-city-block-attribute-height"
          className={lk}
        >
          City Block attribute-height extrusion
        </Link>{" "}
        tutorial, where they assign rooftop and wall materials to towers. The
        per-face field pattern is identical; only the offset direction and scale
        differ.
      </p>

      <h2>Smooth by Angle on a hexagonal badge</h2>
      <p>
        In a regular hexagon the interior angle at each vertex is 120°. The
        dihedral angle between two adjacent side quads (the angle between their
        face normals) is therefore 60° — below the default smooth-by-angle
        threshold of 30° used here. This means adjacent side quads retain a hard
        edge between them, giving the six flat-shaded faces their distinct
        faceted look. The edges between the top/bottom caps and the side walls
        are 90° — also above the threshold, so they shade flat too. The only
        smooth shading happens across the triangulated faces of the cap itself,
        where the normal difference between adjacent triangles is essentially 0°.
        For a complete treatment of how this threshold controls hard vs soft
        normals, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-smooth-by-angle-normal-split"
          className={lk}
        >
          Smooth by Angle — Normal Split
        </Link>{" "}
        tutorial, which this node replaces in Blender 4.1+ (the legacy
        Auto Smooth checkbox is no longer available as a mesh property).
      </p>

      <h2>GLB for WebXR spatial badges</h2>
      <p>
        The badge mesh exports cleanly because it has no UV-dependent textures —
        both materials drive colour through node colour inputs, not image
        textures. The GLB file stores two glTF materials: one PBR metallic
        (side/back) and one KHR_materials_emissive_strength (front face, handled
        by Blender&rsquo;s exporter via the emission node). The front emission
        colour renders in Three.js without a light source, making it suitable for
        WebXR environments where scene lighting may be absent or minimal.{" "}
        <code>export_apply=True</code> is mandatory: it realises the GN modifier
        before the exporter sees the mesh. Without it, the exporter serialises
        the original bezier curve object with zero faces. For the full export
        pipeline including Draco compression and WebP textures, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-triangulate-mesh-webxr-tri-safe-export"
          className={lk}
        >
          Triangulate Mesh — WebXR Tri-Safe Export
        </Link>{" "}
        tutorial. For an alternative approach to organic 2-D-to-3-D shapes (not
        outline-based but SDF volume-based), compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-to-volume-sdf-blob-fusion"
          className={lk}
        >
          Mesh to Volume SDF Blob Fusion
        </Link>{" "}
        tutorial — that route handles topology-unsafe input geometry that Fill
        Curve cannot triangulate.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/fill_curve.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Fill Curve Node — Blender Manual
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Documentation Team. Authoritative reference for
          the mode parameter (TRIANGLES vs NGONS), the Group ID socket
          (independent fills per spline group — useful for compound shapes with
          holes), and the constraint that input splines must be cyclic. Related
          nodes in the same manual section:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/write/set_spline_type.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Set Spline Type
          </a>
          ,{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/write/set_spline_cyclic.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Set Spline Cyclic
          </a>
          ,{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/fillet_curve.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Fillet Curve
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KhronosGroup/glTF-Blender-IO
          </a>{" "}
          · Apache-2.0 · Khronos Group. The GLB exporter responsible for
          converting Blender&rsquo;s emission node into the glTF{" "}
          <code>KHR_materials_emissive_strength</code> extension and for the
          <code>export_apply=True</code> modifier realisation step. Sibling:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Assets"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Assets
          </a>{" "}
          (CC0) — reference GLBs with emissive materials for verifying badge
          appearance in Three.js and Babylon.js viewers before WebXR deployment.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-fill-curve-logo-extrusion-webxr-badge",
    time: "one session",
    difficulty: "intermediate",
    goal:
      "Use Set Spline Type (POLY) before Fill Curve to convert a 6-point cyclic bezier hexagon into an exact 6-sided polygon fill, then extrude with Extrude Mesh to produce a faceted gold badge with separate front-emission and metallic-side materials, exported as a WebXR-ready GLB.",
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
      "Understand GN modifier setup and NodeGroupInput / NodeGroupOutput",
      "Know what a cyclic spline is (use_cyclic_u = True in bpy)",
      "Familiar with Extrude Mesh node and its Top / Side bool outputs",
      "Comfortable with SetMaterialIndex and BooleanMath (NOT, AND) nodes",
    ],
    steps: [
      {
        title: "Build the bezier hexagon curve",
        body: "bpy.data.curves.new('badge_outline', type='CURVE'). curves.splines.new('BEZIER'); sp.bezier_points.add(5) for 6 total. sp.use_cyclic_u = True — mandatory for Fill Curve. Set each pt.co at angle=tau*i/6 on a circle of BADGE_RADIUS. pt.handle_left_type = pt.handle_right_type = 'AUTO' for smooth arcs (makes BEZIER vs POLY difference visually clear). Add the curve to the scene collection and set as active object.",
      },
      {
        title: "Add GN modifier and wire Set Spline Type",
        body: "ng = bpy.data.node_groups.new('GN_FillCurve_Badge', 'GeometryNodeTree'). mod = obj.modifiers.new('GN_Badge', 'NODES'); mod.node_group = ng. GroupInput.outputs[0] → GeometryNodeSetSplineType.inputs['Curve']. sst.spline_type = 'POLY'. With POLY: Fill Curve receives exactly 6 vertices and produces a hexagon. With BEZIER (remove this node or change type): Fill Curve receives 6×resolution_u=72 vertices and produces a near-circle.",
      },
      {
        title: "Wire Fill Curve",
        body: "GeometryNodeFillCurve. fill.mode = 'TRIANGLES' for WebXR-safe output. SetSplineType.outputs['Curve'] → FillCurve.inputs['Curve']. FillCurve.outputs['Mesh'] proceeds to Extrude Mesh. The output is a flat triangulated hexagonal face at Z=0. NGONS mode: produces a single 6-gon (better for further GN processing); TRIANGLES: 8 triangles (safe for WebXR export).",
      },
      {
        title: "Extrude Mesh for badge depth",
        body: "GeometryNodeExtrudeMesh. extrude.mode = 'FACES'. extrude.inputs['Offset'].default_value = (0, 0, -BADGE_DEPTH). FillCurve.outputs['Mesh'] → ExtrudeMesh.inputs['Mesh']. Outputs used: 'Top' (Bool: True on back cap at Z=−DEPTH), 'Side' (Bool: True on 6 side walls). Original front face at Z=0 is neither Top nor Side — select it with NOT(Top) AND NOT(Side) using two FunctionNodeBooleanMath nodes (operation NOT, then AND).",
      },
      {
        title: "Assign materials via boolean field selection",
        body: "Two BooleanMath nodes: not_top (NOT, input=ext.Top), not_side (NOT, input=ext.Side). and_face (AND, inputs=not_top.out, not_side.out) → GeometryNodeSetMaterialIndex(index=1, Selection=and_face.out). This selects exactly the front fill face. obj.data.materials: index 0 = MAT_Badge_Side (Principled, metallic=0.95, gold base), index 1 = MAT_Badge_Face (Emission, gold, strength=2.8).",
      },
      {
        title: "Smooth by Angle + export GLB",
        body: "GeometryNodeSmoothByAngle. smooth.inputs['Angle'].default_value = math.radians(30). At 30°: the 60° dihedral between hexagon side walls stays hard-shaded (6 distinct flat faces); 90° edges at cap boundaries also stay hard. Gives faceted metallic look. GeometryNodeStoreNamedAttribute('holoflow:facet', FACE, FLOAT, 1.0) marks for Holoflow pipeline. bpy.ops.export_scene.gltf(export_apply=True, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6, export_image_format='WEBP').",
      },
    ],
    troubleshooting: [
      {
        symptom: "Fill Curve produces no mesh output — badge is invisible",
        cause:
          "The source spline is not cyclic (use_cyclic_u = False). Fill Curve only fills CLOSED splines. Open splines produce zero faces.",
        fix: "In Python: sp.use_cyclic_u = True before building the GN tree. In the UI: select the curve, go to Object Data Properties → Spline → check 'Cyclic'. Alternatively, add a Set Spline Cyclic node in the GN tree with Value=True — this overrides the scene-level setting inside the modifier.",
      },
      {
        symptom: "Badge is a circle, not a hexagon",
        cause:
          "Set Spline Type node is missing or set to BEZIER. With AUTO handles and resolution_u=12, a 6-point bezier hexagon evaluates to 72 near-circular outline vertices.",
        fix: "Add GeometryNodeSetSplineType between GroupInput and FillCurve. Set spline_type = 'POLY'. This converts at GN evaluation time without changing the scene-level curve data. Confirm in Spreadsheet: select curve output of SetSplineType, check Point count — should be 6 for POLY mode.",
      },
      {
        symptom: "Front face not getting mat index 1 — all faces use mat 0",
        cause:
          "The AND logic selects no faces, or SetMaterialIndex Selection is always False. Most common cause: the boolean fields from Extrude Mesh are being evaluated outside the Extrude Mesh's output geometry context.",
        fix: "Verify that the boolean math nodes (NOT, AND) receive their inputs directly from ExtrudeMesh.outputs['Top'] and ExtrudeMesh.outputs['Side'], not from any intermediate geometry node. The field must evaluate in the context of the geometry flowing into SetMaterialIndex.inputs['Geometry'], which must be ExtrudeMesh.outputs['Mesh'] (or a downstream geometry that still has those face attributes).",
      },
      {
        symptom: "export_apply=True raises a TypeError or the GLB has zero vertices",
        cause:
          "The GN modifier errored during evaluation (check the Info bar for red GN errors) — a broken node connection prevents realisation.",
        fix: "Open the GN editor, look for red connection lines or missing socket links. A common cause: GeometryNodeSmoothByAngle.inputs['Mesh'] wired to the wrong socket (it takes a Mesh geometry, not a Curve geometry). Ensure Fill Curve output is wired before SetMaterialIndex and the chain reaches SmoothByAngle correctly.",
      },
      {
        symptom: "Side walls shade smoothly instead of showing distinct flat faces",
        cause:
          "Smooth by Angle threshold is above 60° — the dihedral between adjacent hexagon walls is exactly 60°, so thresholds above 60° smooth across those edges.",
        fix: "Set SMOOTH_ANGLE to any value below 60 (e.g. 30°). At 30°: hexagon sides stay hard (60° > 30°), top/bottom cap edges stay hard (90° > 30°), only co-planar adjacent triangles shade smooth (0° < 30°). If you want everything hard-shaded, set SMOOTH_ANGLE to 0.",
      },
    ],
    voiceMode: "aura",
  },
  {
    slug: "blender-tutorial-gn-fill-curve-logo-extrusion-webxr-badge",
    title:
      "GN Fill Curve + Set Spline Type — 2-D Outline to Extruded Hexagonal Badge for WebXR",
    date: "2026-06-27",
    kind: "tutorial",
    excerpt:
      "Set Spline Type (POLY) converts a 6-point bezier hexagon to an exact polygon before Fill Curve fills its interior. Extrude Mesh adds depth, NOT/AND boolean field logic targets the gold-emission front face, Smooth by Angle facets the metallic walls, and the badge exports as a WebXR GLB.",
    Body: GnFillCurveLogoExtrusionBody,
  },
);
