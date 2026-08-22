import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnExtrudeMeshCityBlockBody() {
  return (
    <>
      <p>
        <strong>Extrude Mesh</strong> has two modes that most documentation
        treats as equivalent variants: connected and individual.  They are
        not.  Connected mode (<code>use_individual_faces = False</code>)
        extrudes all selected faces as a single unified volume — adjacent
        selections share side walls, and the result has one top cap regardless
        of how many faces were selected.  Individual mode (
        <code>use_individual_faces = True</code>) extrudes each face in
        isolation: four new side-wall quads and one new top cap per face,
        no shared geometry between neighbours.  Changing one boolean produces
        entirely different topology.
      </p>
      <p>
        The second hidden capability is the{" "}
        <strong>Offset Scale socket</strong>.  Its default value is 1.0, which
        multiplies the Offset vector uniformly.  But it accepts a per-face
        FLOAT field — meaning you can wire a noise texture, a named attribute,
        or any other field expression directly to it and every face extrudes to
        its own independent height.  This tutorial uses that socket to build a
        low-poly city block: a 12&thinsp;×&thinsp;12 grid of building lots,
        each raised to a White Noise&ndash;sampled height between 0.5 m and
        6 m, with 25% of lots left flat as parks.  The{" "}
        <code>Top</code> and <code>Side</code> boolean field outputs then drive
        three-material assignment without any selection bookkeeping.
      </p>

      <h2>Pipeline</h2>
      <pre>{`Grid(size=10 m, 12×12) → 144 face lots

WhiteNoiseH (1D, W=face_index)
  → MapRange([0,1] → [0.5, 6.0])
  → ExtrudeMesh.Offset Scale

WhiteNoiseP (1D, W=face_index + 10 000)
  → Compare(GREATER_THAN, 0.25)
  → ExtrudeMesh.Selection

ExtrudeMesh(mode='FACES', Individual=True)
  .Top  → SetMaterialIndex(2)  → hs_rooftop
  .Side → SetMaterialIndex(1)  → hs_wall
  (remaining faces)            → mat index 0 = hs_ground

→ city_block.blend · city_block.glb (Draco 6, 3 mats, WebP)`}</pre>

      <h2>Why Individual mode changes everything</h2>
      <p>
        When <code>use_individual_faces = True</code> the extrusion algorithm
        treats each selected face as a separate manifold: it duplicates the
        face in place and connects the original perimeter to the duplicate with
        four new quads (for a quad face).  The topology is{" "}
        <em>per-face</em>: a 12&thinsp;×&thinsp;12 grid with all 144 faces
        selected produces 144&thinsp;×&thinsp;(4 side quads + 1 top cap) =
        720 new faces.  Connected mode on the same grid produces far fewer new
        faces because the shared interior edges between adjacent selected faces
        are collapsed — the perimeter shrinks to the outer ring only.
      </p>
      <p>
        The practical consequence is that with Individual mode you can give
        adjacent lots <em>different heights</em> without producing T-junctions
        or non-manifold edges between them.  Each tower is a watertight column;
        gaps between towers at different heights are ground-level gaps — valid
        geometry that WebXR renderers handle correctly.  Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-extrude-mesh-panel-inset-procedural"
          className={lk}
        >
          panel-inset approach
        </Link>{" "}
        in which adjacent panels share their side-wall topology and a
        Subdivision Surface modifier then reads crease attributes on the
        hinges — the opposite architectural idiom.
      </p>

      <h2>The Offset Scale field socket</h2>
      <p>
        The default Offset vector is computed from each face&rsquo;s normal
        (0, 0, 1 for a flat grid).  <code>Offset Scale</code> multiplies that
        vector.  Because it is a FLOAT field, Blender evaluates it once per
        face during extrusion: face 0 gets scale&thinsp;=&thinsp;WhiteNoise(W=0),
        face 1 gets scale&thinsp;=&thinsp;WhiteNoise(W=1), and so on.  The
        height of each tower in metres equals the face&rsquo;s Offset Scale
        value, because the face normal on a flat grid is exactly +Z with
        magnitude 1.0.
      </p>
      <p>
        For a non-flat surface — a sphere, a terrain mesh — the Offset vector
        follows each face&rsquo;s local normal, so Offset Scale becomes
        &ldquo;how far does this face extrude along its own normal&rdquo; rather
        than a world-space Z displacement.  This is the correct behaviour for
        radial spike arrays, cobblestone relief, and hull-plate extrusions.
        If you want world-space-Z-only heights on a curved surface, wire a
        custom Offset vector instead (e.g. <code>0, 0, height</code> via a
        Combine XYZ), setting Offset Scale back to its default 1.0.
      </p>

      <h2>White Noise in the FACE domain</h2>
      <p>
        <code>ShaderNodeTexWhiteNoise</code> with{" "}
        <code>noise_dimensions=&apos;1D&apos;</code> hashes its W float input
        to a uniform scalar in <code>[0, 1)</code>.  The W socket accepts a
        field — wiring <code>GeometryNodeInputIndex</code> to W evaluates the
        hash once per current-domain element.  Because both{" "}
        <code>ExtrudeMesh.Selection</code> and{" "}
        <code>ExtrudeMesh.Offset&thinsp;Scale</code> are FACE-domain sockets,
        the Input Index node returns face indices (0…143 for a 12&thinsp;×&thinsp;12
        grid) when evaluated in their field context.  The same Input Index
        node wired into a vertex-domain socket would return vertex indices
        instead.
      </p>
      <p>
        The park-selection noise uses W&thinsp;=&thinsp;face_index&thinsp;+&thinsp;10 000
        rather than face_index alone.  This separation is not cosmetic.  If
        both noise nodes read the same W range, a face whose height hash(index)
        = 0.30 and whose park hash(same_index) = 0.30 would produce a spurious
        correlation — parks clustering precisely where mid-range towers appear.
        Shifting SEED_PARK to 10 000 puts the two W ranges
        (0&thinsp;&ndash;&thinsp;143 vs 10 000&thinsp;&ndash;&thinsp;10 143) in
        entirely non-overlapping space, eliminating the correlation entirely.
        This is a general rule: whenever two White Noise nodes feed different
        attributes on the same geometry, offset one seed by at least the
        element count.
      </p>

      <h2>Top and Side as downstream selectors</h2>
      <p>
        The <code>Top</code> and <code>Side</code> outputs of Extrude Mesh are
        boolean fields that record the identity of faces the node{" "}
        <em>created</em>.  Blender evaluates them lazily — they remain valid
        as field inputs to any node that appears later in the same tree.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-set-material-index-voronoi-cell-zones"
          className={lk}
        >
          SetMaterialIndex
        </Link>{" "}
        node reads Top and Side as its Selection socket: only newly-created cap
        faces receive index 2 (hs_rooftop), only newly-created side-wall quads
        receive index 1 (hs_wall).  Every other face — the original grid quads
        that were not selected for extrusion (parks) plus the gaps between towers
        — keeps the default material index 0 (hs_ground).
      </p>
      <p>
        Top and Side are disjoint: no face can be simultaneously a cap and a
        side wall.  Chaining SetMaterialIndex in rooftop&thinsp;→&thinsp;wall
        order is therefore safe; the wall pass will never overwrite the rooftop
        assignment.  For multi-tier extrusions (as in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-extrude-mesh-panel-inset-procedural"
          className={lk}
        >
          panel-inset tutorial
        </Link>
        ) you can AND Top with a second random field to select a subset of cap
        faces for a further tier, then extrude those caps a second time with a
        smaller Offset Scale — the inner tower extrusion inherits the FACE
        domain evaluation correctly.
      </p>
      <p>
        For WebXR delivery you should pass the result through a{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-triangulate-mesh-webxr-tri-safe-export"
          className={lk}
        >
          Triangulate Mesh node
        </Link>{" "}
        before export, because the side-wall quads are coplanar (they&rsquo;re
        extruded from a flat grid) and GLTF renderers may tessellate them
        differently to how Blender exports them.
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>All towers the same height</strong> — the Offset Scale socket
          received a uniform value rather than a field.  Confirm you wired a
          field node (White Noise, Noise Texture, Named Attribute) into it, not
          a raw float.  The socket must receive a connection, not rely on the
          default value, because the default is always uniform.
        </li>
        <li>
          <strong>Towers fused into a single slab</strong> — the{" "}
          <code>use_individual_faces</code> property is False.  Tick the{" "}
          <em>Individual</em> checkbox in the node header, or set
          <code>ext.use_individual_faces = True</code> in Python.
        </li>
        <li>
          <strong>All 144 lots extruded (no parks)</strong> — the Compare node
          feeds Selection but the threshold is at or below 0 (every face has
          park_noise &gt; 0, so all pass).  Increase{" "}
          <code>PARK_THRESHOLD</code> or verify the compare node&rsquo;s
          operation is <code>GREATER_THAN</code> not <code>LESS_THAN</code>.
        </li>
        <li>
          <strong>GLB has no material colours</strong> — the GN modifier must
          be applied before export (<code>export_apply=True</code>).  Without
          apply, the GLB exporter sees the pre-modifier base mesh with all faces
          at material index 0.  The SetMaterialIndex nodes only take effect
          after modifier evaluation.
        </li>
        <li>
          <strong>White Noise returns 0 for all faces</strong> — the W socket
          is disconnected or the noise_dimensions property is still &apos;3D&apos;
          (which ignores the W input and evaluates a constant-zero vector for
          a 1D wire).  Set <code>noise_dimensions = &apos;1D&apos;</code> and
          confirm the wire from Input Index is present.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/extrude_mesh.html"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            Blender Manual — Extrude Mesh node
          </a>
          {" "}· CC-BY-SA 4.0 · Blender Foundation
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            njanakiev/blender-scripting
          </a>
          {" "}· MIT · Nicolas Janakiev — bpy geometry and GN scripting examples.
          Related:{" "}
          <a
            href="https://github.com/njanakiev/blender-jupyter"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            blender-jupyter
          </a>{" "}
          (MIT).
        </li>
        <li>
          <a
            href="https://github.com/cityjson/cjio"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            cityjson/cjio
          </a>
          {" "}· MIT · 3D Geoinformation Research Group, TU Delft — Python I/O
          for the CityJSON 3D city model format, which defines the
          building-footprint + LoD-height data model this tutorial procedurally
          generates.  Related:{" "}
          <a
            href="https://github.com/cityjson/cityjson-spec"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            cityjson/cityjson-spec
          </a>{" "}
          (CC-BY 4.0).
        </li>
      </ul>
    </>
  );
}

const entry = buildInstructable({
  title:
    "GN Extrude Mesh — City Block: Per-Face Noise-Height Tower Extrusion for WebXR (Blender 5.1)",
  slug: "blender-tutorial-gn-extrude-mesh-city-block-attribute-height",
  date: "2026-06-27",
  tags: ["blender", "geometry-nodes", "procedural", "webxr", "low-poly", "architecture"],
  libraryPath:
    "blends/geometry-nodes/gn-extrude-mesh-city-block-attribute-height",
  body: GnExtrudeMeshCityBlockBody,
});

export { entry };
