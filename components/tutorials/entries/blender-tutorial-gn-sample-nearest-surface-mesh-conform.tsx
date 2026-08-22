import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnSampleNearestSurfaceMeshConformBody() {
  return (
    <>
      <p>
        <strong>Sample Nearest Surface</strong> is one of the few Geometry
        Nodes that crosses the object boundary: given a target{" "}
        <code>Mesh</code> socket and a query <code>Sample Position</code>,
        it returns any field value sampled at the nearest point on that
        surface. <code>Position</code> and <code>Normal</code> are fields
        like any other attribute, so three Sample Nearest Surface passes yield
        snapped position, surface orientation, and a baked latitude float in a
        single topology-aware lookup — no distance falloff, no projection
        correction, no raycasting. This tutorial builds a procedural
        dragon-scale armour: a cloud of hexagonal tiles conformed to a sphere,
        each tile flush to the surface and coloured by latitude.
      </p>

      <h2>Two-context evaluation — the key insight</h2>
      <p>
        Every Sample Nearest Surface node has two independent evaluation
        contexts. The <code>Value</code> field socket evaluates{" "}
        <em>on the target mesh</em>&rsquo;s domains (vertices, faces, corners
        depending on the field&rsquo;s native domain). The{" "}
        <code>Sample Position</code> socket evaluates{" "}
        <em>on the current geometry</em> — whatever is flowing through the
        graph at that node&rsquo;s position. This means a single{" "}
        <code>InputPosition</code> node connected to <code>Value</code> reads
        the target mesh&rsquo;s own vertex coordinates, while a separate{" "}
        <code>InputPosition</code> node connected to{" "}
        <code>Sample Position</code> reads the scatter-point positions on the
        current geometry. Two identical node types, two completely different
        evaluation contexts.
      </p>
      <p>
        The same context-split rule applies to <code>Normal</code>.
        Connecting <code>InputNormal</code> to the <code>Value</code> socket
        returns the target sphere&rsquo;s smooth-interpolated vertex normal at
        the nearest surface point. On a smooth-shaded target, Sample Nearest
        Surface performs barycentric interpolation across the triangle,
        giving a continuously varying normal — not a discrete face normal. If
        the target were flat-shaded, you would get the face normal instead.
        Neither is &ldquo;wrong&rdquo;; the shading mode on the target mesh
        controls which you get.
      </p>

      <h2>Three-SNS architecture</h2>
      <p>
        The blueprint uses three Sample Nearest Surface nodes, each set to a
        different <code>data_type</code>, all sharing one{" "}
        <code>InputPosition</code> node for <code>Sample Position</code>:
      </p>
      <ul>
        <li>
          <strong>SNS #1 (FLOAT_VECTOR)</strong> — <code>Value</code> =
          InputPosition on the target → returns the nearest surface position
          for Set Position.
        </li>
        <li>
          <strong>SNS #2 (FLOAT_VECTOR)</strong> — <code>Value</code> =
          InputNormal on the target → returns the surface outward normal for
          Align Euler to Vector.
        </li>
        <li>
          <strong>SNS #3 (FLOAT)</strong> — <code>Value</code> = Named
          Attribute &ldquo;latitude&rdquo; on the target → returns the
          per-vertex latitude float for the tile colour ramp.
        </li>
      </ul>
      <p>
        Because all three share the same query position, they all report data
        from the <em>same nearest point</em>. The snapped position, the normal
        at that point, and the latitude at that point are perfectly consistent
        — there&rsquo;s no risk of the three lookups hitting slightly different
        triangles, which can happen if the query positions were different.
      </p>
      <p>
        Compare this with{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-geometry-proximity-deform"
          className={lk}
        >
          Geometry Proximity
        </Link>
        , which returns a <em>distance</em> to the nearest element and a
        nearest position, but cannot sample arbitrary attributes from the
        target&rsquo;s geometry. Sample Nearest Surface and Geometry Proximity
        are complementary tools: use Proximity when you want &ldquo;how far am
        I from this mesh,&rdquo; use Sample Nearest Surface when you want
        &ldquo;what is the value of attribute X at the nearest point on this
        mesh.&rdquo;
      </p>

      <h2>Point-before-instance workflow</h2>
      <p>
        The critical ordering decision is: compute everything on the scatter
        points <em>before</em> instancing. Set Position snaps the scatter
        points to the surface. Store Named Attribute tags each point with{" "}
        <code>tile_lat</code>. Align Euler to Vector produces a per-point
        Rotation field from the sampled normal. Instance On Points then reads
        the snapped point positions as instance origins and the rotation field
        for orientation. No Realize Instances is needed anywhere.
      </p>
      <p>
        If instead you tried to rotate instances after instancing (e.g. via
        Rotate Instances on the instances geometry), you would need Realize
        Instances first to get access to per-element attribute data — which
        collapses the instancing and rebuilds the geometry as actual mesh
        topology. At 450 points × 14 vertices each (6 side quads + top/bottom
        hexagons), the realized mesh is only ~6,300 vertices, so it
        would work — but the point-before-instance approach scales to 50,000
        tiles without the realize cost.
      </p>
      <p>
        The <code>tile_lat</code> attribute stored on scatter points
        propagates to instances automatically. In EEVEE, each instance&rsquo;s
        point attribute is available as a per-instance uniform in the shader.
        All six vertices of one hexagonal tile read the same{" "}
        <code>tile_lat</code> float, so the colour ramp result is uniform
        per tile — exactly the effect we want. This is the same pattern used
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
          className={lk}
        >
          Capture Attribute tutorial
        </Link>{" "}
        to freeze attribute values before domain shifts.
      </p>

      <h2>Retargeting to any mesh</h2>
      <p>
        Because the conform target is an Object socket in the group interface,
        swapping it for any mesh with a &ldquo;latitude&rdquo; attribute
        immediately reconforms the armour to the new shape. A VRM body mesh,
        a low-poly rock, or an abstract sculptural form all work the same way
        — the only requirement is that the target has a POINT-domain float
        attribute named &ldquo;latitude.&rdquo; If you want a different colour
        driver, rename the attribute and update the{" "}
        <code>Named Attribute</code> node&rsquo;s string input accordingly.
      </p>
      <p>
        The scatter source is a separate UV sphere with{" "}
        <code>SCATTER_RADIUS = 2.4</code>, slightly larger than the conform
        target at <code>CONFORM_RADIUS = 2.0</code>. This guarantees every
        query point starts outside the target on a convex mesh, making{" "}
        <code>Is_Valid</code> always True. On a concave mesh — a bowl, an
        arch, an interior space — some scatter points would be inside the
        target and still receive valid hits, but the distribution density
        would be uneven. The fix is to scatter on the target itself at a
        slightly offset scale, or to filter by <code>Is_Valid</code> and{" "}
        <code>Delete Geometry</code>.
      </p>

      <h2>Material: attribute to colour ramp</h2>
      <p>
        The shader reads <code>tile_lat</code> via an Attribute node (type =
        GEOMETRY, name = &ldquo;tile_lat&rdquo;). The &ldquo;Fac&rdquo;
        output feeds a three-stop Color Ramp: deep indigo at the south pole
        (0.0), equatorial green at mid-latitude (0.5), warm amber at the
        north pole (1.0). This three-stop ramp is the same cold-warm
        convention used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion"
          className={lk}
        >
          Blur Attribute heat-diffusion tutorial
        </Link>
        , where a diffused float also drives a polar-to-equatorial colour
        gradient. The studio uses this palette consistently for spatial data
        visualisation across the cel-shading pipeline — the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
          className={lk}
        >
          EEVEE toon cel-shader tutorial
        </Link>{" "}
        documents the full ramp-to-toon-outline workflow.
      </p>

      <h2>Troubleshooting</h2>
      <p>
        <strong>Tiles pointing inward.</strong> The{" "}
        <code>FunctionNodeAlignEulerToVector</code> node maps the tile&rsquo;s
        local <code>+Z</code> to the sampled normal. If the target sphere&rsquo;s
        normals are flipped (inverted mesh from sculpt or boolean), the tiles
        point inward. Fix: add a <code>VectorMath(SCALE, -1)</code> between
        the SNS normal output and the Align Euler to Vector Vector input.
      </p>
      <p>
        <strong>Tiles far from the surface.</strong> The Set Position node
        must be <em>downstream</em> of Distribute Points but{" "}
        <em>upstream</em> of Instance On Points. If the order is wrong, the
        instance origins are the original scatter-sphere positions, not the
        snapped ones.
      </p>
      <p>
        <strong>All tiles the same colour.</strong> This usually means{" "}
        <code>tile_lat</code> was not found by the shader. Check: (1) Store
        Named Attribute spelling exactly matches the Attribute node name; (2)
        the attribute domain is POINT; (3) in EEVEE the Attribute node type
        is GEOMETRY, not OBJECT or INSTANCER.
      </p>
      <p>
        <strong>Is_Valid = False on some points.</strong> The scatter source
        sphere is too small and some query points are inside the target. Either
        increase <code>SCATTER_RADIUS</code> or add a{" "}
        <code>Delete Geometry</code> node after Set Position filtered by{" "}
        <code>NOT Is_Valid</code>.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "an afternoon",
    difficulty: "intermediate",
    cost: "free — Blender 5.1",
    supplies: {
      materials: [
        { name: "Blender 5.1", note: "download at blender.org", url: "https://www.blender.org/download/" },
        { name: "blueprint.py", note: "from the library entry blends/geometry-nodes/gn-sample-nearest-surface-mesh-conform/" },
      ],
      tools: [
        { name: "Geometry Nodes editor", note: "built into Blender" },
        { name: "Spreadsheet editor", note: "for inspecting attribute values per-point" },
        { name: "EEVEE Next renderer", note: "built into Blender 5.1" },
      ],
    },
    steps: [
      {
        title: "Run blueprint.py",
        body: "Open a terminal in the library folder and run: blender --background --python blueprint.py. This creates tile_armour.blend with the ConformTarget sphere and TileArmour object.",
      },
      {
        title: "Open the file and inspect the node graph",
        body: "Open tile_armour.blend. Select TileArmour and switch to the Geometry Nodes workspace. Pan left-to-right: Group Input → Object Info → UV Sphere → Distribute Points → three SNS nodes → Set Position → Store Named Attribute → Align Euler to Vector → Cylinder → Instance On Points → Group Output.",
      },
      {
        title: "Understand the two-context rule",
        body: "Select SNS #1 (the position-snap node). Notice it receives two InputPosition nodes: one from the target (upper wire → Value) and one from the current geometry (lower wire → Sample Position). Open the Spreadsheet, set Domain = Point on TileArmour, and observe the Position column showing snapped surface coordinates.",
      },
      {
        title: "Tweak Tile Scale live",
        body: "In Properties → Modifier, scrub Tile Scale from 0.28 to 0.84. Watch the inter-tile gap open and close in real time. The gap emerges purely from scaling the hexagon radius before instancing — no post-instancing transform needed.",
      },
      {
        title: "Swap the conform target",
        body: "Add any mesh object to the scene and bake a 'latitude' POINT attribute onto it (or any float attribute — rename the Named Attribute node to match). Set it as the Conform Target in the modifier. The armour immediately reconforms to the new shape.",
      },
      {
        title: "Export GLB",
        body: "File → Export → glTF 2.0. Enable: Apply Modifiers, Include Custom Attributes. The tile_lat attribute exports as _TILE_LAT. In Three.js, read it via geometry.getAttribute('_TILE_LAT') and feed it to a vertex shader for real-time latitude colouring in WebXR.",
      },
    ],
  },
  {
    slug: "blender-tutorial-gn-sample-nearest-surface-mesh-conform",
    title:
      "GN Sample Nearest Surface — Mesh-Conform Tile Armour",
    date: "2026-06-03",
    kind: "tutorial",
    excerpt:
      "Three Sample Nearest Surface passes snap a hexagonal tile cloud to a sphere — capturing position, surface normal, and latitude in one topology-aware lookup. Point-before-instance keeps it instance-friendly and WebXR-ready.",
    Body: GnSampleNearestSurfaceMeshConformBody,
  },
);
