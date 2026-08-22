import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnDistributePointsGroundCoverScatterBody() {
  return (
    <>
      <p>
        <strong>Distribute Points on Faces</strong> is the primary sampling
        node in Blender 5.1&apos;s Geometry Nodes toolkit — it converts a
        surface mesh into a cloud of points, one per sample, ready to carry
        instances.  Paired with <strong>Instance on Points</strong> (Pick
        Instance mode) and a <strong>Collection Info</strong> node, a single
        node tree can scatter multiple distinct mesh assets across a surface
        with per-point random selection, normal-aligned rotation, and
        vertex-group density control.  This tutorial builds a ground-cover
        field: grass blades and low-poly pebbles scattered across a 4 m
        plane whose density is weight-painted in the viewport.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Random vs Poisson Disk — why it matters</h2>
      <p>
        The node&apos;s <code>distribution_type</code> has two modes.{" "}
        <strong>RANDOM</strong> draws each point from a homogeneous Poisson
        process — successive points are statistically independent, so they can
        land arbitrarily close together.  The result looks planted in tight
        patches.  <strong>POISSON_DISK</strong> enforces a minimum separation
        equal to <code>Distance Min</code> using Mitchell&apos;s best-candidate
        algorithm: it generates several candidate positions per needed point
        and keeps only the one furthest from existing points within the radius.
        Cost is O(n·log n) rather than O(n) — negligible at scene density —
        and the result has the relaxed, unpatterned spacing of real vegetation.
        Set <code>Distance Min</code> to roughly the widest extent of your
        instance (here 0.08 m for grass blades 0.024 m wide with breathing
        room).
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Density fields — Named Attribute as paint mask</h2>
      <p>
        <code>Density Max</code> on the Distribute node accepts a float
        <em>field</em>, not just a scalar.  A field is evaluated per face, so
        you can drive it with a vertex attribute.  The workflow:
      </p>
      <ol className="list-decimal list-inside space-y-1 mt-2">
        <li>
          Add a vertex group (&ldquo;scatter_weight&rdquo;) to the ground plane
          and weight-paint it — dense in the centre, zero at the edges.
        </li>
        <li>
          In the GN tree add a <code>Named Attribute</code> node, set
          Data Type to <strong>Float</strong> and Name to
          &ldquo;scatter_weight&rdquo;.  Its <em>Attribute</em> output is a
          float field sampled via barycentric interpolation across each face.
        </li>
        <li>
          Wire the Attribute output to the <em>Density</em> socket of
          Distribute Points.  The effective density per face is the
          corner-weight average multiplied by <code>Density Max</code>.
        </li>
      </ol>
      <p className="mt-2">
        WHY NOT a Texture node?  Textures require UV coordinates and
        re-baking when the mesh changes.  A vertex group updates live in
        Weight Paint mode with no bake step, and its barycentric interpolation
        is consistent with the mesh subdivision level.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Instance on Points — Pick Instance mode</h2>
      <p>
        The critical flag is <strong>Pick Instance = True</strong>.  When
        unchecked, every point receives the same instance geometry.  When
        checked, an integer field on the <em>Instance Index</em> socket
        selects one geometry from the collection independently per point.
        The pattern:
      </p>
      <ul className="list-disc list-inside space-y-1 mt-2">
        <li>
          <code>Collection Info</code> (Separate Children = True) → outputs
          each child object as a separate entry in the instance list.
        </li>
        <li>
          <code>Random Value</code> (INT, min 0, max n−1) → outputs a random
          integer per point, seeded differently from the density seed to avoid
          correlation.
        </li>
        <li>
          Wire the Random INT to <em>Instance Index</em>.  Each point now
          independently picks GrassBlade or Pebble.
        </li>
      </ul>
      <p className="mt-2">
        This is O(1) per point regardless of collection size — far cheaper
        than chaining multiple Instance on Points nodes or merging separate
        sub-trees.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Align Euler to Vector + random yaw</h2>
      <p>
        <code>Distribute Points on Faces</code> outputs a <em>Normal</em>
        field — the interpolated face normal at each sample point.  Feeding
        this into <code>Align Euler to Vector</code> (Axis = Z, Factor = 1.0)
        produces a rotation that stands each instance upright relative to the
        surface.  On a flat plane this is a no-op; on a curved or sculptured
        terrain it matters enormously — instances lean with the slope rather
        than floating mid-air.
      </p>
      <p className="mt-2">
        A second <code>Random Value</code> (FLOAT_VECTOR, Min/Max range
        0–6.28 rad on Z only) adds a random yaw rotation.  Wire this into the
        <em>Rotation</em> socket of Instance on Points alongside the aligned
        rotation.  The two rotations compose so normal-alignment is preserved
        while azimuth is randomised, breaking visual periodicity.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Realize Instances before GLB export</h2>
      <p>
        GLB writers expect a flat vertex buffer.  Without
        <code>Realize Instances</code>, some exporters write
        <code>EXT_mesh_gpu_instancing</code> — a GPU-instancing extension that
        Three.js and WebXR runtimes may not honour.  Always place{" "}
        <code>Realize Instances</code> as the last node before the Group
        Output when targeting GLB, and use <code>export_apply=True</code> in
        the GLTF exporter to bake the NODES modifier.  See also the sister
        tutorial on per-instance colour attributes:{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-realize-instances-crystal-grotto"
          className={lk}
        >
          GN Realize Instances — Crystal Grotto
        </Link>.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Related studio tutorials</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-rotate-instances-phyllotaxis-sunflower"
            className={lk}
          >
            GN Rotate Instances — Phyllotaxis Sunflower Array
          </Link>{" "}
          — systematic vs random rotation patterns
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-scale-instances-spine-growth"
            className={lk}
          >
            GN Scale Instances — Noise-Driven Organic Spine Growth
          </Link>{" "}
          — random scale variation techniques
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-uv-unwrap-pack-islands-glb"
            className={lk}
          >
            GN UV Unwrap + Pack Islands — Procedural UV for WebXR GLB Export
          </Link>{" "}
          — baking UVs onto scattered geometry before export
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>Blender Foundation</strong> —{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/point/distribute_points_on_faces.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Distribute Points on Faces — Blender Manual
          </a>{" "}
          (CC0) — related:{" "}
          <a
            href="https://www.blender.org/download/releases/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Releases
          </a>
          ,{" "}
          <a
            href="https://studio.blender.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Studio
          </a>{" "}
          (open movie assets CC0)
        </li>
        <li>
          <strong>Jarrod Hasler, Rico Cilliers et al.</strong> —{" "}
          <a
            href="https://polyhaven.com"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Poly Haven
          </a>{" "}
          (CC0) — the canonical source of CC0 plant, rock, and ground-texture
          assets to use as your scatter instances.  Related:{" "}
          <a
            href="https://ambientcg.com"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            AmbientCG
          </a>{" "}
          (CC0 PBR materials, same licence).
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Failure modes</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <strong>No points appear:</strong> check that the Named Attribute
          name exactly matches the vertex group name (case-sensitive).  Also
          confirm the vertex group has non-zero weights — a freshly added group
          defaults all weights to zero.
        </li>
        <li>
          <strong>All instances identical:</strong> Pick Instance is unchecked,
          or Instance Index is not wired.
        </li>
        <li>
          <strong>Instances penetrate the ground:</strong> the instance
          origins are at the mesh centre, not the base.  Move each scatter
          mesh&apos;s origin to its bottom-most vertex (Object → Set Origin →
          Origin to Geometry then manually correct, or use the Python API
          <code>ob.data.transform()</code> to shift verts down).
        </li>
        <li>
          <strong>GLB exports empty:</strong> <code>Realize Instances</code>
          is absent or placed after the Group Output socket.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-gn-distribute-points-ground-cover-scatter",
    title:
      "GN Distribute Points on Faces + Instance on Points — Procedural Ground Cover Scatter (Blender 5.1)",
    date: "2026-06-11",
    topic: "blender",
    kind: "tutorial",
    excerpt:
      "Scatter grass blades and pebbles across a weight-painted ground plane " +
      "using Distribute Points on Faces (Poisson-disk mode), Collection Info " +
      "Pick Instance, Align Euler to Vector, and vertex-group density masking " +
      "— the foundational GN environment workflow in Blender 5.1.",
    summary:
      "Distribute Points on Faces (Poisson-disk) drives spatially-even point " +
      "placement; density is a Named Attribute reading a vertex-group weight " +
      "painted directly in the viewport.  Instance on Points with Pick Instance " +
      "= True selects randomly among grass blades and pebbles from a Collection. " +
      "Align Euler to Vector stands each instance on the surface normal; a " +
      "second Random Value adds yaw variation.  Realize Instances before Group " +
      "Output ensures flat-vertex-buffer GLB export for WebXR delivery.",
    tags: [
      "blender",
      "geometry-nodes",
      "distribute-points",
      "instance-on-points",
      "poisson-disk",
      "scatter",
      "environment",
      "ground-cover",
      "vertex-groups",
      "named-attribute",
      "collection-info",
      "align-euler",
      "realize-instances",
      "gltf",
      "webxr",
    ],
    Body: GnDistributePointsGroundCoverScatterBody,
  },
);
