import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnSortElementsSequentialFaceRevealBody() {
  return (
    <>
      <p>
        <strong>Sort Elements</strong> (<code>GeometryNodeSortElements</code>) rewrites
        the element order of any domain — vertices, edges, faces, curve points, or
        instances — by a user-supplied float sort weight. After the node, every
        downstream reference to element index reads the <em>rank in sorted order</em>,
        not the original mesh position. This makes index-dependent effects like time
        stagger, sequential animation, and priority selection order-aware without
        touching the underlying mesh geometry.
      </p>
      <p>
        This tutorial sorts an icosphere&rsquo;s 80 triangular faces by centroid Z
        (ascending). Face index 0 is now the bottommost face; face index 79 is the
        topmost. A per-face delay timer{" "}
        <code>face_rank &times; DELAY_FRAMES</code> feeds into a{" "}
        <code>SceneTime.Frame</code> ramp that controls each face&rsquo;s extrusion
        along its normal. The sphere &ldquo;unfurls&rdquo; from bottom to top over 130
        frames, with a dark-blue &#8594; cyan &#8594; white colour gradient showing
        each face&rsquo;s activation state.
      </p>

      <h2>Global reindexing: how Sort Elements differs from Sort Index</h2>
      <p>
        The most important distinction for expert use:{" "}
        <code>Sort Elements</code> rewrites the domain order <em>globally</em> —
        every downstream node that reads an element index sees the sorted order. The{" "}
        <code>Sort Index</code> input on{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-accumulate-field-spiral-tower"
          className={lk}
        >
          AccumulateField
        </Link>{" "}
        is a <em>local</em> sort: it reorders only within that node&rsquo;s prefix-sum
        computation, leaving all other downstream indices unchanged. Choose{" "}
        <code>Sort Elements</code> when the sorted order needs to propagate through
        multiple nodes (here: <code>InputIndex</code>, delay arithmetic,{" "}
        <code>StoreNamedAttribute</code>, and eventually <code>SetPosition</code>).
        Choose <code>AccumulateField.Sort Index</code> when only the prefix sum itself
        needs a custom order.
      </p>
      <p>
        A corollary: once <code>Sort Elements</code> runs, you cannot easily
        &ldquo;unsort&rdquo; within the same modifier tree. If you need the original
        mesh index alongside the sort rank, store it in a named attribute{" "}
        <em>before</em> the Sort Elements node, then read it back afterwards. For
        iterative within-frame accumulation controlled by a custom rank, the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-iterative-lsystem-branch-growth"
          className={lk}
        >
          Repeat Zone
        </Link>{" "}
        offers more control at the cost of O(N×M) evaluations versus Sort Elements&rsquo;
        single O(N log N) sort pass.
      </p>

      <h2>Sort Weight evaluated in domain context</h2>
      <p>
        The <code>Sort Weight</code> socket accepts any float field. When{" "}
        <code>domain = &apos;FACE&apos;</code>, the field is evaluated once per face.
        Wiring <code>InputPosition.Z</code> gives each face the Z-coordinate of its
        centroid — the average of its vertices&rsquo; Z positions. This is because{" "}
        <code>InputPosition</code> evaluated in a FACE context returns the face
        centroid rather than any individual vertex position. The same pattern was used
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-field-at-index-edge-tangent-flow-map"
          className={lk}
        >
          Field at Index — Altitude Gradient
        </Link>{" "}
        tutorial, where domain context determined which geometric quantity each node
        sampled.
      </p>
      <p>
        Any float field works as sort weight: face area (largest-first reveal),
        dot product with a direction vector (frontal reveal), distance from a
        target point (radial bloom), or a painted vertex weight promoted to FACE
        context via <code>Evaluate on Domain</code>. Wiring a noise texture gives a
        random activation order that nevertheless looks procedurally controlled rather
        than arbitrary.
      </p>

      <h2>The delay timer and SceneTime.Frame</h2>
      <p>
        <code>GeometryNodeInputSceneTime.Frame</code> returns the current frame as an
        INT. <code>ShaderNodeMath</code> implicitly converts INT inputs to FLOAT, so
        no explicit cast node is needed. The per-face timer is:
      </p>
      <pre>
        <code>
          {[
            "delay    = face_index × DELAY_FRAMES   # float",
            "t_raw    = Frame - delay               # negative before activation",
            "t        = clamp(t_raw / RAMP_FRAMES, 0, 1)   # 0 = inactive, 1 = fully out",
          ].join("\n")}
        </code>
      </pre>
      <p>
        At frame 70 with <code>DELAY_FRAMES = 1.5</code> and{" "}
        <code>RAMP_FRAMES = 8</code>: face index 0 activated at frame 0 (fully out by
        frame 8); face index 46 activates at frame 69 (just beginning to extrude);
        face indices 47–79 have negative <code>t_raw</code> (clamped to 0, not yet
        active). This produces the 58 % reveal at the export frame. The pattern mirrors
        the frame-stamping approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-dla-crystal-dendrite"
          className={lk}
        >
          DLA Crystal Dendrite Simulation Zone tutorial
        </Link>
        , where <code>agg_frame</code> stored the per-point activation time for
        post-zone colour mapping.
      </p>

      <h2>Promoting face_t to vertex domain for SetPosition</h2>
      <p>
        <code>SetPosition.Offset</code> is evaluated on the POINT (vertex) domain.
        The two-store pattern makes the face-to-vertex promotion explicit:
      </p>
      <ol>
        <li>
          <code>StoreNamedAttribute(&apos;face_t&apos;, FLOAT, FACE)</code>{" "}
          materialises the per-face float into a concrete array.
        </li>
        <li>
          <code>NamedAttribute(&apos;face_t&apos;)</code> read in POINT context returns
          the per-vertex average of adjacent face values — a topology-aware smooth
          interpolation that avoids sharp per-face stepping on the extruded surface.
        </li>
      </ol>
      <p>
        Without the store step, wiring the live{" "}
        <code>t</code> math output directly to <code>SetPosition</code> works because
        the math chain is already evaluated lazily in POINT context — but it would
        evaluate each face&rsquo;s expression per vertex, returning the wrong face_t
        (the one whose index matches the vertex index, not whose faces include the
        vertex). The store forces the FACE-domain evaluation, and the attribute
        read-back produces correct per-vertex interpolated values.
      </p>
      <p>
        The offset vector is <code>InputNormal × face_t × EXTRUDE_HEIGHT</code>
        using <code>VectorMath(SCALE)</code>. Vertex normals on an icosphere point
        radially outward, so each face extrudes along the sphere surface rather than
        purely upward. For a flat grid this would produce a columnar rise; for the
        sphere it produces the organic &ldquo;spines opening&rdquo; visual.
      </p>

      <h2>GLB export and WebXR vertex colour</h2>
      <p>
        <code>export_apply=True</code> realises the GN modifier at{" "}
        <code>EXPORT_FRAME</code> (frame 70). The static snapshot captures 46 fully
        extruded faces and 34 unextruded ones — a permanent record of one animation
        moment. <code>export_colors=True</code> promotes the{" "}
        <code>face_color</code> FLOAT_COLOR attribute to <code>COLOR_0</code> in the
        glTF primitive. In Three.js:
      </p>
      <pre>
        <code>
          {[
            "loader.load('sequential_face_reveal.glb', gltf => {",
            "  const mesh = gltf.scene.children[0];",
            "  mesh.material = new THREE.MeshBasicMaterial({ vertexColors: true });",
            "  // mesh.geometry.attributes.color now contains heat_color per vertex",
            "});",
          ].join("\n")}
        </code>
      </pre>
      <p>
        For a fully animated WebXR version, the delay timer and extrusion would need
        to be baked per-frame (either via a Bake node export or a shader-side morph
        target approach) since glTF animation channels cannot represent arbitrary
        GN field expressions. See the bake node tutorial or the shape-key morph target
        pipeline for those export strategies.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/sort_elements.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sort Elements Node — Blender Manual
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Documentation Team. Authoritative reference for
          domain options, Group ID behaviour (sort independently within groups), Sort
          Weight directionality, and interaction with downstream index operations.
          Related nodes in the same manual section:{" "}
          <em>Separate Elements</em>, <em>Split to Instances</em>,{" "}
          <em>Delete Geometry</em>.
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          · MIT · Nicolas Janakiev. Python scripting patterns for bpy node-tree
          construction and bmesh icosphere generation used throughout{" "}
          <code>blueprint.py</code>.
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
          · Apache-2.0 · Khronos Group. The Blender GLTF exporter that promotes
          FLOAT_COLOR to <code>COLOR_0</code> via <code>export_colors=True</code>.
          Sibling project:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Assets"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Assets
          </a>{" "}
          (CC0 / various) — reference GLBs for verifying vertex-colour round-trips
          in Three.js.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-sort-elements-sequential-face-reveal",
    time: "one session",
    difficulty: "intermediate",
    goal:
      "Sort an icosphere's 80 triangular faces by centroid Z using GeometryNodeSortElements. Use the post-sort face index as a sequential delay timer driven by SceneTime.Frame to extrude faces outward along their normals in strict bottom-to-top order. Store the activation float as a named attribute, promote to vertex domain for smooth SetPosition offsets, colour via ColorRamp, and export the 58%-revealed frame as a WebXR GLB.",
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
      "Understand GN domain context (POINT vs FACE evaluation)",
      "Know StoreNamedAttribute and NamedAttribute two-store pattern",
      "Familiar with SceneTime node and ShaderNodeMath chains",
      "Comfortable with SetPosition and VectorMath SCALE",
    ],
    steps: [
      {
        title: "Build icosphere with bmesh.ops",
        body: "bm = bmesh.new(). bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.5) — creates 80 triangular faces without needing bpy.ops context. bm.to_mesh(me). Link object. This gives a geodesic sphere where each face is a distinct triangle with a unique centroid Z — ideal for bottom-to-top Sort Elements ordering.",
      },
      {
        title: "Sort Elements by centroid Z",
        body: "sort = nodes.new('GeometryNodeSortElements'). sort.domain = 'FACE'. Wire InputPosition.outputs['Position'] → SeparateXYZ → Z → sort.inputs['Sort Weight']. Wire GroupInput.Geometry → sort.inputs['Geometry']. Sort Weight in FACE context = face centroid Z. After this node, InputIndex[face 0] = bottommost face, InputIndex[face 79] = topmost face. Leave Group ID unwired (default 0) — all faces sort as one group.",
      },
      {
        title: "Per-face delay and t ramp",
        body: "InputIndex.outputs[0] (INT) → Math(MULTIPLY, DELAY_FRAMES=1.5) → delay_float. GeometryNodeInputSceneTime.outputs['Frame'] (INT) → Math(SUBTRACT, delay_float) → t_raw. Math(DIVIDE, RAMP_FRAMES=8.0) → t_unclamped. Math(MAXIMUM, 0.0) → Math(MINIMUM, 1.0) → t. ShaderNodeMath accepts INT implicitly; no cast node needed. t = 0 for inactive faces, t = 1 for fully extruded.",
      },
      {
        title: "Store face_t and face_color attributes",
        body: "StoreNamedAttribute('face_t', FLOAT, FACE): Geometry ← sort.Geometry, Value ← t. StoreNamedAttribute('face_color', FLOAT_COLOR, FACE): Geometry ← store_ft.Geometry, Value ← ColorRamp(t) with stops dark-blue(0.0) / cyan(0.5) / white(1.0). Chaining geometry through two StoreNamedAttribute nodes materialises BOTH attributes in one geometry pass.",
      },
      {
        title: "SetPosition with normal-scaled offset",
        body: "NamedAttribute('face_t', FLOAT).outputs['Attribute'] in POINT context → per-vertex average of adjacent face_t values. Math(MULTIPLY, EXTRUDE_HEIGHT=0.55) → scalar. VectorMath(SCALE): Vector=InputNormal, Scale=scalar → displacement vector. SetPosition.Offset ← displacement. Wire store_fc.Geometry → setpos.Geometry. Each vertex moves radially outward proportional to its adjacent faces' activation level.",
      },
      {
        title: "Export GLB at frame 70",
        body: "SetMaterial(material=SR_FaceReveal) → GroupOutput.Geometry. bpy.context.scene.frame_set(70). bpy.ops.export_scene.gltf(export_apply=True, export_colors=True, export_attributes=True, export_draco_mesh_compression_enable=True). export_apply realises the GN modifier at frame 70 state. export_colors promotes face_color to COLOR_0. At frame 70, ~46 of 80 faces are fully extruded, face indices 47–79 are flush.",
      },
    ],
    troubleshooting: [
      {
        symptom: "All faces extrude simultaneously — no sequential delay",
        cause:
          "Sort Elements domain mismatch: domain set to 'POINT' instead of 'FACE'. InputIndex in POINT context returns vertex rank, not face rank, so all 80 faces see the same wrong index value.",
        fix: "Set sort.domain = 'FACE'. Verify in Blender Spreadsheet editor: select the modifier object, switch to Face domain, check that 'face_t' column shows values from 0.0 (bottom) to 1.0 (top) at a mid-animation frame. If all values are the same, the sort is operating on the wrong domain.",
      },
      {
        symptom: "Faces extrude in arbitrary order, not bottom-to-top",
        cause:
          "Sort Weight is not connected or evaluates to 0.0 for all faces. SeparateXYZ node wired to wrong output (X or Y instead of Z).",
        fix: "Confirm SeparateXYZ.outputs[2] (Z) is wired to sort.inputs['Sort Weight']. Open Spreadsheet editor → Face domain → enable 'face_t' column — check that row 0 has the smallest t value (activates first = lowest face). If rows 0 and 79 look inverted, sort.domain or the SeparateXYZ Z/X swap is the cause.",
      },
      {
        symptom: "Faces extrude vertically (world +Z) instead of radially outward",
        body: "SetPosition.Offset wired to a Z-only vector (e.g. CombineXYZ with X=Y=0, Z=face_t) rather than InputNormal × face_t",
        fix: "Use VectorMath(SCALE) with inputs Vector=InputNormal, Scale=(face_t × EXTRUDE_HEIGHT). InputNormal on an icosphere points radially outward from the sphere centre, so SCALE by a per-vertex float produces radial extrusion along the surface. For a truly vertical rise, CombineXYZ is correct but produces a different visual.",
      },
      {
        symptom: "face_color missing in Three.js GLB",
        cause: "export_colors=False omitted from the gltf export call",
        fix: "Add export_colors=True. Verify with: loader.load('glb', g => console.log(Object.keys(g.scene.children[0].geometry.attributes))). Should show 'color' in the list. Set mesh.material = new THREE.MeshBasicMaterial({ vertexColors: true }) to apply it.",
      },
    ],
    voiceMode: "aura",
  },
  {
    slug: "blender-tutorial-gn-sort-elements-sequential-face-reveal",
    title:
      "GN Sort Elements — Sequential Face Reveal: Rank-Ordered Domain Reindexing for Bottom-to-Top Sphere Unfurl Animation",
    date: "2026-06-27",
    kind: "tutorial",
    excerpt:
      "GeometryNodeSortElements rewrites element order globally by a float sort weight so every downstream InputIndex reads the sort rank. Sort 80 icosphere faces by centroid Z, use the rank as a per-face delay timer driven by SceneTime.Frame, extrude along normals sequentially from bottom to top, and export a WebXR GLB snapshot.",
    Body: GnSortElementsSequentialFaceRevealBody,
  },
);
