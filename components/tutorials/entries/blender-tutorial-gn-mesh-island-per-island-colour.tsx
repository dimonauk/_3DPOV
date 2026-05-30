import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnMeshIslandPerIslandColourBody() {
  return (
    <>
      <p>
        The <code>Mesh Island</code> node outputs a single integer — the
        index of the connected component each element belongs to — and that
        integer adapts to whatever domain context the downstream node
        expects. There is no CaptureAttribute wrapper, no explicit grouping
        node, no loop. Every vertex, face, and edge in the same island
        already shares an identical index, so wiring it directly to a{" "}
        <code>RandomValue</code> ID socket produces a constant-per-island
        random value at zero overhead.
      </p>
      <p>
        Compare this to the face-index modulo pattern in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-index-face-colour-mosaic"
          className={lk}
        >
          Per-Face Colour Mosaic tutorial
        </Link>
        . That approach buckets faces by their flat integer index — useful
        when tiles are contiguous quads on a single mesh — but it breaks
        the moment topology is modified, because a Triangulate doubles the
        face count and scrambles the bucket mapping. Island Index is
        topology-stable: it reflects connectivity, not insertion order.
      </p>

      <h2>Why IslandIndex needs no CaptureAttribute</h2>
      <p>
        Fields in Blender are lazy expressions — they describe how a value
        is computed, not what it currently is. The field system resolves
        evaluation domain from the first consuming node that declares an
        explicit domain, propagating that context backwards through any
        upstream field nodes. When{" "}
        <code>StoreNamedAttribute(domain=&apos;FACE&apos;)</code> pulls
        from an <code>IslandIndex</code> field, Blender evaluates it once
        per face at face domain. Since every face in a connected component
        shares the same island index, the result is constant per island
        — no manual grouping required.
      </p>
      <p>
        The same rule covers the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
          className={lk}
        >
          CaptureAttribute tutorial
        </Link>
        &apos;s defensive-capture pattern: you reach for CaptureAttribute
        when a node downstream might shift the active domain unexpectedly
        (typically after <em>RealizeInstances</em> or a topology op).
        IslandIndex is safe without it because no topology change can alter
        connectivity-derived island membership mid-tree.
      </p>

      <h2>Building the colour pipeline</h2>
      <p>
        With a 4 × 4 grid of disconnected quads (16 islands), the tree is
        three wires deep:
      </p>
      <pre className="bg-black/40 rounded p-3 text-sm overflow-x-auto">{`MeshIsland.IslandIndex
  → RandomValue(FLOAT_VECTOR, Min=0.2, Max=1.0, Seed=42).ID
    → StoreNamedAttribute("island_colour", FACE, FLOAT_COLOR)`}</pre>
      <p>
        The <code>Min = (0.2, 0.2, 0.2)</code> floor prevents near-black
        tiles that vanish against a dark studio background. <code>Seed=42</code>{" "}
        is a fixed constant — changing it regenerates the entire palette while
        keeping every tile deterministically unique. In the material,{" "}
        <code>ShaderNodeAttribute(name=&quot;island_colour&quot;, attribute_type=&quot;GEOMETRY&quot;)</code>{" "}
        routes the face-constant colour into Principled BSDF Base Color. EEVEE
        Next does not interpolate face-constant attributes across vertices:
        each face stays solid.
      </p>

      <h2>The Z lift and its animation socket</h2>
      <p>
        A second <code>RandomValue(FLOAT, ID=IslandIndex, Seed=99)</code>{" "}
        gives each island a random lift in [0, 0.20]. A{" "}
        <strong>Lift Multiplier</strong> group input (clamped 0–1) scales
        it, so{" "}
        <code>record.py</code> can keyframe the entire reveal animation
        without touching the node tree. The same pattern — exposing a
        scalar multiplier rather than keyframing individual node inputs —
        is used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-weight-painted-scatter"
          className={lk}
        >
          weight-painted scatter tutorial
        </Link>{" "}
        for its density threshold. One socket, one animation curve, zero
        extra re-bakes.
      </p>
      <pre className="bg-black/40 rounded p-3 text-sm overflow-x-auto">{`MeshIsland.IslandIndex
  → RandomValue(FLOAT, Min=0, Max=0.20, Seed=99).ID
    → Math(MULTIPLY) ← GroupInput("Lift Multiplier")
      → CombineXYZ(0, 0, z) → SetPosition.Offset`}</pre>

      <h2>Materialising island_index for SeparateGeometry</h2>
      <p>
        The most powerful extension of this pattern is island selection:
        store <code>island_index</code> as a named INT attribute at FACE
        domain, then read it back downstream with{" "}
        <code>NamedAttribute(data_type=&quot;INT&quot;)</code> + Compare(INT,
        EQUAL, B = target) → SeparateGeometry. This isolates any single
        island by its integer index — the building block of exploded-view
        rigs and destructible prop pipelines. Without materialising the
        field first, SeparateGeometry receives no stable per-face integer
        and the selection falls back to the geometry&apos;s full extent.
      </p>

      <h2>Island Count and normalisation</h2>
      <p>
        The second output of Mesh Island is <code>Island Count</code> — a
        single integer, not domain-specific. Dividing Island Index by
        (Island Count − 1) gives a 0–1 normalised parameter you can feed
        into a ColorRamp instead of RandomValue for a fully controlled
        gradient palette. This is useful when you want tiles to progress
        through a designer-specified colour ramp rather than random RGB
        vectors.
      </p>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>All tiles the same colour</strong> — IslandIndex is
          evaluating at the wrong domain. Confirm{" "}
          <code>StoreNamedAttribute.domain = &apos;FACE&apos;</code>. If
          the attribute is stored at POINT domain, vertex interpolation
          averages the colour across each face, giving a muddy gradient.
        </li>
        <li>
          <strong>Tiles merge into fewer islands than expected</strong> —
          the GAP between tiles is zero and Blender merged adjacent
          vertices during mesh construction. Keep GAP &gt; 0 (0.03+ m) or
          use <em>Mesh &gt; Clean Up &gt; Merge by Distance</em> will
          inadvertently unify tiles. Each tile must have four private
          vertices.
        </li>
        <li>
          <strong>island_colour attribute missing in Three.js</strong> —
          add <code>export_attributes=True</code> to{" "}
          <code>bpy.ops.export_scene.gltf()</code>. The attribute appears
          as <code>_ISLAND_COLOUR</code> in the binary accessor; access
          via{" "}
          <code>geometry.attributes[&apos;_ISLAND_COLOUR&apos;]</code> as a
          Float32Array with itemSize = 4.
        </li>
        <li>
          <strong>SeparateGeometry returns an empty mesh</strong> —
          island_index must be stored as a named attribute before the
          selection node reads it. A raw MeshIsland → Compare wire
          without an intermediate StoreNamedAttribute is a field expression
          that Compare cannot resolve to a stable boolean domain.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          Blender Documentation Team —{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/read/mesh_island.html"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            Mesh Island Node
          </a>
          , Blender Manual, CC-BY-SA 4.0.
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
          , Apache-2.0. The exporter&apos;s{" "}
          <code>export_attributes=True</code> path serialises named GN
          attributes as custom vertex accessors prefixed with{" "}
          <code>_</code> per the glTF extras convention.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-mesh-island-per-island-colour",
  title:
    "GN Mesh Island — Per-Island Colour, Random Offset, and Separation (Blender 5.1)",
  date: "2026-05-30",
  kind: "tutorial",
  excerpt:
    "GeometryNodeInputMeshIsland outputs a connected-component index that adapts to any domain context — wire it directly to RandomValue as an ID and every element in the same island gets an identical random result, with no CaptureAttribute and no explicit grouping.",
  Body: GnMeshIslandPerIslandColourBody,
};

export const entry = buildInstructable(
  {
    goal: "Build a 4×4 mosaic of disconnected quad tiles, colour each island uniquely using IslandIndex-seeded RandomValue, apply a randomised Z lift controllable via a group socket, and materialise the island index as a named INT attribute for SeparateGeometry downstream selection. Export a GLB with custom colour and index attributes.",
    prerequisites: [
      "Blender 5.1 installed",
      "Familiarity with Geometry Nodes modifier basics",
      "Python scripting access (Scripting workspace)",
    ],
    steps: [
      {
        title: "Build the disconnected tile mesh",
        body: "Factory-reset (read_factory_settings), create an empty mesh object, and use bmesh to insert GRID_ROWS × GRID_COLS independent quads. Each tile gets four fresh vertices — never shared with neighbours. Keep GAP > 0 between tiles (0.04 m) so Blender never merges adjacent vertices into the same connected component.",
      },
      {
        title: "Set up the GN tree and sockets",
        body: "Create a GeometryNodeTree, add Geometry IN/OUT sockets and a Float 'Lift Multiplier' input (default 1.0, range 0–1). Create NodeGroupInput and NodeGroupOutput nodes. Add a GeometryNodeInputMeshIsland node — no inputs required.",
      },
      {
        title: "Wire the per-island colour pipeline",
        body: "Add GeometryNodeRandomValue (data_type='FLOAT_VECTOR', Min=(0.2,0.2,0.2), Max=(1.0,1.0,1.0), Seed=42). Connect MeshIsland.outputs['Island Index'] to RandomValue.inputs['ID']. Add StoreNamedAttribute (data_type='FLOAT_COLOR', domain='FACE', name='island_colour'). Wire GroupInput.Geometry → StoreNamedAttribute.Geometry; RandomValue.Value → StoreNamedAttribute.Value.",
      },
      {
        title: "Wire the per-island Z lift",
        body: "Add a second GeometryNodeRandomValue (data_type='FLOAT', Min=0.0, Max=0.20, Seed=99). Wire IslandIndex → this node's ID. Add ShaderNodeMath (MULTIPLY): RandomValue.Value → input[0], GroupInput.Lift_Multiplier → input[1]. Add ShaderNodeCombineXYZ with X=Y=0, Z from the Multiply. Add GeometryNodeSetPosition; wire StoreNamedAttribute.Geometry → SetPosition.Geometry and CombineXYZ.Vector → SetPosition.Offset.",
      },
      {
        title: "Materialise island_index for SeparateGeometry",
        body: "Add a second StoreNamedAttribute (data_type='INT', domain='FACE', name='island_index'). Wire IslandIndex to its Value input and SetPosition.Geometry to its Geometry input. Output to GroupOutput. Without this step, downstream Compare nodes cannot select a specific island by number.",
      },
      {
        title: "Assign material and export GLB",
        body: "Create a Principled BSDF material. Add ShaderNodeAttribute (attribute_name='island_colour', attribute_type='GEOMETRY'). Wire Color output → Base Color. Roughness = 0.88. Call bpy.ops.export_scene.gltf with export_apply=True, export_attributes=True, Draco level 6, WEBP images. Save .blend with save_as_mainfile.",
      },
    ],
    finalResult:
      "A GLB containing 16 flat-shaded quad tiles, each a unique colour derived from its island index and lifted a unique height derived from the same index with a different seed. The .blend retains the live GN modifier with a Lift Multiplier slider. The GLB carries _ISLAND_COLOUR and _ISLAND_INDEX vertex attributes readable in Three.js.",
    variations: [
      "Gradient palette: divide IslandIndex by (IslandCount - 1) to get a 0–1 parameter, feed into ColorRamp instead of RandomValue. Every tile progresses through a designer-specified ramp — useful for heat-map or depth-coded destruction previews.",
      "Exploded view: add NamedAttribute(name='island_index', INT) + Compare(INT, EQUAL, B=N) + SeparateGeometry(FACE) after the final StoreNamedAttribute. Expose N as a group socket. Animating N from 0 to IslandCount peels islands away one at a time.",
      "Voronoi shatter: apply Voronoi fracture in Edit Mode (Cell Fracture add-on or manual bisect planes) to create irregular island shapes, then run this pipeline for colour + scatter. The IslandIndex assignment is topology-derived and requires no manual island labelling.",
    ],
    troubleshooting: [
      {
        symptom: "All tiles render as the same colour",
        cause:
          "StoreNamedAttribute.domain is set to POINT instead of FACE, causing vertex interpolation to average out colour differences between islands.",
        fix: "Set n_store_col.domain = 'FACE'. Each face-constant colour then stays solid across the quad without interpolation.",
      },
      {
        symptom:
          "Island count is lower than expected — some tiles share an index",
        cause:
          "The GAP constant is zero or negative and bmesh vertices from adjacent tiles share the same coordinate, causing Blender to merge them into a single connected component.",
        fix: "Keep GAP >= 0.001 m. Alternatively, after bmesh.to_mesh() call bpy.ops.mesh.select_all() + bpy.ops.mesh.remove_doubles(threshold=0.0001) only if merging is intentional.",
      },
      {
        symptom:
          "Lift Multiplier animation has no effect in the viewport playback",
        cause:
          "record.py keyframes mod['Input_2'] but the socket identifier has shifted because a new socket was inserted before 'Lift Multiplier' in the interface.",
        fix: "Verify socket order in tree.interface.items_tree — Input_1 is always the geometry socket, Input_2 is the first user-defined socket. If a socket was added before Lift Multiplier in blueprint.py, increment the index accordingly.",
      },
    ],
  },
  base,
);
