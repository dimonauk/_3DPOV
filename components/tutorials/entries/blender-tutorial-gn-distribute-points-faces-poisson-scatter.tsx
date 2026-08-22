import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnDistributePointsFacesPoissonScatterBody() {
  return (
    <>
      <p>
        Distribute Points on Faces in Poisson Disc mode is Geometry Nodes&rsquo;
        principal scatter primitive. It guarantees that no two output points are
        closer than a minimum separation, which prevents the clustering that
        plagues uniform-random distributions — a 300-rock field stays legible
        rather than piling into greeble heaps. The density field socket accepts
        any GN expression as input; wiring a vertex-group Named Attribute gives
        you brush-level art direction over where things land with no extra
        geometry or UV layer required.
      </p>
      <p className="mt-3">
        The technique builds directly on the displacement workflow from the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-image-texture-heightmap-terrain"
          className={lk}
        >
          GN Image Texture heightmap terrain tutorial
        </Link>{" "}
        — the same terrain mesh can receive both a height-displacement modifier
        and this scatter modifier in the same stack. The vertex-group density
        mask relies on weight-painting skills from the{" "}
        <Link
          href="/tutorials/blender-tutorial-weight-paint-vrm-deformation-envelope"
          className={lk}
        >
          weight paint VRM deformation envelope tutorial
        </Link>
        . The GN tree interface API (
        <code>ng.interface.new_socket()</code>) is the same pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-bevel-mesh-edge-angle-chamfer"
          className={lk}
        >
          GN Bevel Mesh chamfer tutorial
        </Link>
        . For collection-based instance picking, compare the Menu Switch approach
        from the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-menu-switch-tile-variant-kit"
          className={lk}
        >
          GN Menu Switch tile variant kit tutorial
        </Link>
        .
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Poisson Disc vs Random — when each matters
      </h2>
      <p>
        The <strong>Random</strong> mode samples faces by area and places each
        point independently: fast, uniform per-face density, but clustering is
        inherent (two points can be arbitrarily close). Use it for particles or
        effects where overlap is acceptable and maximum throughput matters.
      </p>
      <p className="mt-2">
        <strong>Poisson Disc</strong> (also called Poisson Disc Sampling or
        Bridson&rsquo;s algorithm in its 2D form) enforces a minimum
        inter-point separation called <em>Distance Min</em>. The algorithm
        maintains an active-list of candidate points, tries up to{" "}
        <em>k</em> neighbours per candidate, and rejects any that land inside
        an existing point&rsquo;s exclusion disc. The theoretical optimum
        packing of hard-disc circles on a plane ({"π√3/6 ≈ 0.9069"}) is the
        density ceiling — <em>Density Max</em> controls how close to that
        ceiling the distribution is filled.
      </p>
      <p className="mt-2">
        Choose Poisson Disc whenever visual separation matters: foliage, rocks,
        props, tile decorations. The extra compute cost is negligible for meshes
        with fewer than 10 000 faces; for truly large terrains, split into
        tiles and use Geometry Nodes instance-on-instances.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        The density field chain
      </h2>
      <p>
        <code>Distribute Points on Faces</code> accepts its{" "}
        <em>Density Max</em> socket as a <em>field</em> — a value that varies
        per face. Any GN expression can drive it. The Holoflow chain uses:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# Named Attribute reads vertex-group weight as a per-vertex float field.
# Blender's field evaluation engine auto-interpolates vertex → face domain,
# averaging the weights of the face's three or four corner vertices.
n_attr = nodes.new("GeometryNodeInputNamedAttribute")
n_attr.data_type                    = "FLOAT"
n_attr.inputs["Name"].default_value = "scatter_density"

# Multiply weight (0–1) × Density Max (group input) → effective density/m².
# At weight 0 the face gets zero points; at weight 1 it gets full Density Max.
n_mul           = nodes.new("ShaderNodeMath")
n_mul.operation = "MULTIPLY"

# Distribute Points on Faces in Poisson Disc mode
n_dist                   = nodes.new("GeometryNodeDistributePointsOnFaces")
n_dist.distribute_method = "POISSON"

links.new(n_attr.outputs["Attribute"],  n_mul.inputs[0])
links.new(n_in.outputs["Density Max"],  n_mul.inputs[1])
links.new(n_mul.outputs["Value"],       n_dist.inputs["Density Max"])
links.new(n_in.outputs["Min Distance"], n_dist.inputs["Distance Min"])`}</pre>

      <p className="mt-3">
        Domain interpolation is free here — you paint vertex weights, and
        Blender averages them to produce a per-face scalar without any explicit
        Transfer Attribute node. The downside: a face with two weight-1 vertices
        and two weight-0 vertices receives an effective density of 0.5×max, not
        a hard boundary. For crisp scatter edges, bevel or subdivide the seam
        loop before painting.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Instance variation — rotation, scale, and variant pick
      </h2>
      <p>
        <code>Distribute Points on Faces</code> outputs a <em>Rotation</em>{" "}
        socket (available since Blender 4.0) whose value at each point is an
        Euler rotation that aligns the instance&rsquo;s local Z axis to the
        face normal. No Align Euler to Vector node is needed — the distribute
        node bakes that step for you.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# Add random yaw on top of face-normal rotation via Rotate Euler.
# AXIS_ANGLE + LOCAL: "rotate around this instance's own Z by this angle."
n_rote        = nodes.new("FunctionNodeRotateEuler")
n_rote.type   = "AXIS_ANGLE"
n_rote.space  = "LOCAL"
n_rote.inputs["Axis"].default_value = (0.0, 0.0, 1.0)

n_ryaw              = nodes.new("FunctionNodeRandomValue")
n_ryaw.data_type    = "FLOAT"
n_ryaw.inputs["Min"].default_value = 0.0
n_ryaw.inputs["Max"].default_value = math.tau

links.new(n_dist.outputs["Rotation"], n_rote.inputs["Rotation"])
links.new(n_ryaw.outputs["Value"],    n_rote.inputs["Angle"])

# Uniform scale: same random float on X/Y/Z keeps the rock proportional.
n_rscl = nodes.new("FunctionNodeRandomValue"); n_rscl.data_type = "FLOAT"
n_cxyz = nodes.new("ShaderNodeCombineXYZ")
links.new(n_rscl.outputs["Value"], n_cxyz.inputs["X"])
links.new(n_rscl.outputs["Value"], n_cxyz.inputs["Y"])
links.new(n_rscl.outputs["Value"], n_cxyz.inputs["Z"])

# Random integer picks one of the three rock variants.
# Collection Info Separate Children=True + Pick Instance=True is the pair.
n_rpick = nodes.new("FunctionNodeRandomValue"); n_rpick.data_type = "INT"
n_rpick.inputs["Min"].default_value = 0
n_rpick.inputs["Max"].default_value = 2   # three variants: 0, 1, 2

n_col = nodes.new("GeometryNodeCollectionInfo")
n_col.inputs["Separate Children"].default_value = True

n_iop = nodes.new("GeometryNodeInstanceOnPoints")
n_iop.inputs["Pick Instance"].default_value = True
links.new(n_rpick.outputs["Value"],   n_iop.inputs["Instance Index"])`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        GLB export — realising instances
      </h2>
      <p>
        The GLB exporter&rsquo;s <code>export_apply=True</code> flag runs all
        modifiers through the depsgraph before writing, which calls{" "}
        <em>Realize Instances</em> internally. Every scatter instance becomes
        an actual mesh triangle in the output file. For a dense rock field this
        can produce large vertex counts — keep Density Max below 4/m² for
        WebXR targets, or pass the GLB through a mesh-decimation pass first.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`bpy.ops.export_scene.gltf(
    filepath                             = GLB_OUT,
    use_selection                        = True,
    export_apply                         = True,   # realises all GN instances
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = "WEBP",
)`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">Failure modes</h2>
      <ul className="list-disc list-inside text-sm space-y-2 mt-2">
        <li>
          <strong>No scatter points appear despite Density Max &gt; 0.</strong>{" "}
          The vertex group &ldquo;scatter_density&rdquo; does not exist on the
          mesh. The Named Attribute node returns 0.0 for unknown attributes,
          making the product 0. Create the vertex group and paint weights before
          running the script.
        </li>
        <li>
          <strong>Scatter looks identical across Seed changes.</strong> All
          three Random Value nodes share the same Seed input, which is
          intentional — they produce independent sequences because each node has
          a different internal ID. If the layout looks identical, check that{" "}
          <code>n_rpick.data_type = &quot;INT&quot;</code> is set before any
          links are created; changing data_type after linking silently
          disconnects sockets.
        </li>
        <li>
          <strong>Instances all pile at the origin.</strong>{" "}
          <code>Collection Info</code> received an empty or None collection
          reference. Verify <code>scatter_col.name</code> matches the actual
          collection name — collections can be renamed by Blender when name
          clashes occur.
        </li>
        <li>
          <strong>
            GLB file contains only the flat terrain, no rocks.
          </strong>{" "}
          The modifier was not evaluated before export. Confirm{" "}
          <code>export_apply=True</code> and that the modifier is enabled
          (eyeball icon on in Properties panel).
        </li>
        <li>
          <strong>
            Face-normal rotation is ignored — all rocks face the same direction.
          </strong>{" "}
          You connected Normal output to Instance on Points directly instead of
          via Rotate Euler. Instance on Points expects an Euler, not a vector.
          The Distribute&rsquo;s <em>Rotation</em> socket (not Normal) is the
          correct input to Rotate Euler.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Sources</h2>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/point/distribute_points_on_faces.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual &mdash; Distribute Points on Faces
          </a>{" "}
          &mdash; CC-BY-SA&nbsp;4.0, Blender Documentation Team. Covers Poisson
          Disc mode, Distance Min, Density Max field, Rotation and Normal
          outputs. Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/instances/instance_on_points.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Instance on Points
          </a>{" "}
          and{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/rotation/rotate_euler.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Rotate Euler
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender-scripting &mdash; Nicolas Janakiev
          </a>{" "}
          &mdash; MIT. bmesh patterns used in the rock-variant construction.
          Related:{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting/tree/master/scripts"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            scripts directory
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/geometry-nodes/gn-distribute-points-faces-poisson-scatter",
    time: "twenty to thirty-five minutes",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1"],
      tools: [
        "Scripting workspace — Text Editor",
        "Geometry Nodes workspace — node graph",
        "Properties ▸ Modifier — HF_ScatterDensityMask panel",
        "Weight Paint mode — draw density mask on terrain",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py",
        body: "Scripting workspace → open blueprint.py → Run Script (Alt+P). Three rock variants appear hidden in the HF_ScatterCollection, and a 4 m terrain plane receives the HF_ScatterDensityMask modifier. Rocks scatter across the two painted density lobes.",
      },
      {
        title: "Inspect the GN tree",
        body: "Select scatter_terrain. Open Geometry Nodes workspace. Trace left-to-right: Group Input → [Named Attribute × Density Max] → Multiply → Distribute Points on Faces (Poisson) → Rotate Euler → Instance on Points → Group Output. The Collection Info node sits above, feeding the Instance socket.",
      },
      {
        title: "Live-tune density parameters",
        body: "Properties ▸ Modifier → HF_ScatterDensityMask. Drag Density Max from 0 to 12 — rocks densify until Poisson packing saturates. Drag Min Distance from 0.05 to 0.8 — separation widens and count drops. Return both to defaults (6 and 0.25).",
      },
      {
        title: "Paint a new scatter zone",
        body: "Select scatter_terrain → switch to Weight Paint mode. Pick the Draw brush (weight 1.0, radius 50). Paint a new blob in an unpainted corner. Return to Object mode — new rocks appear inside the painted area immediately. The vertex group drives density in real time.",
      },
      {
        title: "Change the seed",
        body: "In the modifier panel, increment Seed. All three random streams (yaw, scale, pick) reseed simultaneously — every rock shuffles to a new layout while respecting the density mask.",
      },
      {
        title: "Verify face-normal alignment",
        body: "The terrain is flat, so all normals point up (+Z). To test alignment, add a subdivided sphere, assign the HF_ScatterDensityMask modifier using the holoflow_macros/gn_scatter_density_mask.py helper. Rocks on the curved surface should tilt to sit flush against each face.",
      },
      {
        title: "Run record.py",
        body: "Scripting workspace → open record.py → Run Script. Renders 150 frames (5 s at 30 fps) to public/library/videos/geometry-nodes/gn-distribute-points-faces-poisson-scatter/viewport.mp4: frames 1–60 grow density 0 → 6, frames 91–150 orbit 360°.",
      },
    ],
    troubleshooting: [
      {
        symptom: "No rocks appear despite non-zero Density Max",
        cause:
          "The 'scatter_density' vertex group does not exist. Named Attribute returns 0.0 for unknown groups, making the Multiply output zero.",
        fix: "In Properties ▸ Object Data ▸ Vertex Groups, create a group named 'scatter_density' and paint weights, or re-run blueprint.py which creates it automatically.",
      },
      {
        symptom: "All instances pile at world origin",
        cause:
          "Collection Info received a None collection reference — the HF_ScatterCollection was renamed or deleted.",
        fix: "Check bpy.data.collections for a collection containing the rock objects and update the Collection Info node's Collection socket.",
      },
      {
        symptom: "Rocks don't follow face normals on curved surfaces",
        cause:
          "Instance on Points received the Normal vector socket instead of the Rotation euler socket from Distribute Points on Faces.",
        fix: "Connect n_dist.outputs['Rotation'] to n_rote.inputs['Rotation'], not n_dist.outputs['Normal'].",
      },
    ],
    finalResult:
      "A 4 m terrain plane with HF_ScatterDensityMask modifier: rocks scatter via Poisson Disc over two painted density lobes, aligned to face normals with random yaw and scale variation. Density Max, Min Distance, Scale, and Seed are live modifier-panel controls. GLB exported with realised instances, Draco 6 compression. A 150-frame viewport animation shows density growing from zero and the field rotating 360°.",
  },
  {
    slug: "blender-tutorial-gn-distribute-points-faces-poisson-scatter",
    title:
      "GN Distribute Points on Faces — Poisson Disc Scatter with Density Attribute Mask + Instance Variation (Blender 5.1)",
    date: "2026-06-19",
    kind: "tutorial",
    excerpt:
      "Scatter faceted rock variants across a terrain using Geometry Nodes Distribute Points on Faces in Poisson Disc mode. A vertex-group Named Attribute drives per-face density, giving brush-level art direction. Instance on Points places randomly-picked collection members with face-normal rotation, random yaw, and uniform scale variation.",
    Body: GnDistributePointsFacesPoissonScatterBody,
  },
);
