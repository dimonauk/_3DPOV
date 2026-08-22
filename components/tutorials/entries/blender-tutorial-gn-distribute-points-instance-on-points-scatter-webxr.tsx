import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <strong>Distribute Points on Faces</strong> samples point positions
        across a mesh surface. <strong>Instance on Points</strong> then pins a
        mesh — or a randomly chosen member of a collection — to each sampled
        position. Together these two nodes form the canonical Geometry Nodes
        scatter pattern: one GN modifier, zero duplicated objects, and a
        realized mesh that compresses cleanly with Draco L6 for WebXR
        delivery.
      </p>
      <p>
        This tutorial builds a procedural crystal garden: three hexagonal spike
        variants are scattered across a hexagonal terrain tile using Poisson
        Disk distribution. Each instance inherits the surface normal for
        orientation (crystals grow perpendicular to the ground), and a{" "}
        <code>FunctionNodeRandomValue</code> node drives per-instance scale
        variation so the garden reads as organic rather than stamped.
      </p>

      <h2>Poisson Disk vs Random</h2>
      <p>
        <code>RANDOM</code> mode places points with uniform probability per unit
        area. At moderate densities this produces credible scatter, but at high
        densities instances begin to overlap because the algorithm has no memory
        of where it last placed a point.
      </p>
      <p>
        <code>POISSON_DISK</code> adds one extra constraint: every new point
        must be at least <em>Distance Min</em> metres away from every existing
        point. The algorithm draws candidate positions at random, then rejects
        any that violate the constraint. The result is{" "}
        <strong>blue-noise distribution</strong> — visually uniform without
        being perfectly regular, which is exactly what natural crystal clusters
        look like. The practical trade-off is that{" "}
        <code>Density Max</code> is now an upper ceiling on candidates, not a
        final count; the realized point count is always lower.
      </p>
      <pre><code>{`dist = nodes.new("GeometryNodeDistributePointsOnFaces")
# Set BEFORE linking — the property switches which sockets are active
dist.distribute_method = 'POISSON_DISK'
# Density Max: candidate budget for the Poisson solver (not the final count)
dist.inputs["Density Max"].default_value = 200.0
# Distance Min: minimum gap between any two instances in metres
dist.inputs["Distance Min"].default_value = 0.12
dist.inputs["Seed"].default_value = 7`}</code></pre>

      <h2>Rotation from the surface normal</h2>
      <p>
        The <code>Distribute Points on Faces</code> node outputs a{" "}
        <code>Rotation</code> socket (a proper Rotation type in Blender 5.x,
        not an Euler vector). This rotation aligns the Z-axis of each
        distributed point to the face normal. Wired directly to{" "}
        <code>Instance on Points.Rotation</code>, it makes every crystal spike
        grow perpendicular to the terrain surface — no{" "}
        <code>AlignEulerToVector</code> node needed on flat meshes, though on
        curved terrain the socket value automatically carries the correct
        per-point normal rotation.
      </p>
      <pre><code>{`links.new(dist.outputs["Rotation"], inst.inputs["Rotation"])
# ↑ Each instance Z-axis aligns to its face normal automatically.
# On a flat plane all rotations are (0,0,0). On a curved mesh they differ
# per point — the distribute node handles the maths internally.`}</code></pre>

      <h2>Collection-based instance picking</h2>
      <p>
        Rather than three separate{" "}
        <code>Instance on Points</code> nodes, a single node can pick from a
        pool of meshes using <code>Pick Instance = True</code> and an integer
        index. The pool comes from a{" "}
        <code>GeometryNodeCollectionInfo</code> node pointed at a Blender
        collection containing the three crystal variants.
      </p>
      <pre><code>{`col_info = nodes.new("GeometryNodeCollectionInfo")
col_info.inputs["Collection"].default_value = crystal_col
col_info.transform_space  = 'RELATIVE'  # instances keep their own origins
col_info.inputs["Separate Children"].default_value = True

# FunctionNodeRandomValue with data_type='INT' produces a stable per-point
# integer seeded by the point's stable ID attribute. min/max select which
# collection item to use (0-indexed, so 0..2 for three objects).
rand_idx = nodes.new("FunctionNodeRandomValue")
rand_idx.data_type = 'INT'
rand_idx.inputs["Min"].default_value = 0
rand_idx.inputs["Max"].default_value = 2
rand_idx.inputs["Seed"].default_value = SEED + 2   # independent RNG stream

inst.inputs["Pick Instance"].default_value = True
links.new(col_info.outputs["Instances"], inst.inputs["Instance"])
links.new(rand_idx.outputs["Value"],     inst.inputs["Instance Index"])`}</code></pre>

      <h2>Scale variation</h2>
      <p>
        A second <code>FunctionNodeRandomValue</code> with{" "}
        <code>data_type='FLOAT'</code> provides per-instance scale. The{" "}
        <code>Scale</code> socket on <code>Instance on Points</code> accepts a
        Vector, but connecting a Float promotes it to a uniform XYZ scale — no
        separate math node needed. Keeping <code>SCALE_MIN</code> above 0.3
        prevents instances from being so small they disappear at WebXR viewing
        distances.
      </p>
      <pre><code>{`rand_scale = nodes.new("FunctionNodeRandomValue")
rand_scale.data_type = 'FLOAT'
rand_scale.inputs["Min"].default_value = SCALE_MIN   # 0.35
rand_scale.inputs["Max"].default_value = SCALE_MAX   # 1.15
rand_scale.inputs["Seed"].default_value = SEED + 1   # independent stream
links.new(rand_scale.outputs["Value"], inst.inputs["Scale"])
# Float → Vector socket: Blender promotes scalar to (s, s, s) uniformly.`}</code></pre>

      <h2>Realize Instances before GLB export</h2>
      <p>
        The <code>Instances</code> geometry output from{" "}
        <code>Instance on Points</code> is a GN{" "}
        <em>reference geometry</em> — it stores one copy of the crystal mesh
        plus a list of transforms, not duplicated vertex data.{" "}
        <code>GeometryNodeRealizeInstances</code> expands this into real
        per-instance vertex data. Without it, the glTF exporter sees an empty
        mesh: the instance references are a Blender-internal concept that has
        no direct glTF equivalent (glTF <code>EXT_mesh_gpu_instancing</code>{" "}
        is out of scope for the Khronos exporter&apos;s default path).
      </p>
      <p>
        The Realize step does increase file size compared to native glTF
        instancing, but it makes the file universally compatible with every
        Three.js <code>GLTFLoader</code> without extension handling. For
        production scenes where draw-call count matters, see the glTF{" "}
        <code>EXT_mesh_gpu_instancing</code> extension — but that requires a
        custom exporter or post-processing step.
      </p>
      <pre><code>{`real = nodes.new("GeometryNodeRealizeInstances")
links.new(inst.outputs["Instances"], real.inputs["Geometry"])

# Join terrain + realized crystals so both appear in the same GLB node
join = nodes.new("GeometryNodeJoinGeometry")
links.new(gi.outputs["Geometry"],   join.inputs["Geometry"])
links.new(real.outputs["Geometry"], join.inputs["Geometry"])
links.new(join.outputs["Geometry"], go.inputs["Geometry"])`}</code></pre>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>GLB appears empty</strong> — <code>RealizeInstances</code> is
          missing or placed after <code>GroupOutput</code>. The modifier chain
          must be: DistributePoints → InstanceOnPoints →{" "}
          <strong>RealizeInstances</strong> → GroupOutput.
        </li>
        <li>
          <strong>Crystals all overlap</strong> — you are in{" "}
          <code>RANDOM</code> mode with a high density. Switch to{" "}
          <code>POISSON_DISK</code> and set <code>Distance Min</code> to at
          least half the widest crystal base radius.
        </li>
        <li>
          <strong>Crystals point sideways, not up</strong> — the crystal
          geometry&apos;s local Z-axis is not its growth axis. Rotate the
          crystal objects 90° in Edit Mode (or use{" "}
          <code>GeometryNodeTransformGeometry</code> before the
          CollectionInfo feeds in) so local Z aligns with the spike tip.
        </li>
        <li>
          <strong>
            <code>CollectionInfo</code> outputs nothing
          </strong>{" "}
          — the collection is linked to the scene but its objects may be in a
          hidden viewport layer. Unhide all objects in the crystal collection
          (<code>H</code> / <code>Alt+H</code>).
        </li>
        <li>
          <strong>Pick Instance ignores the index</strong> — confirm{" "}
          <code>inst.inputs["Pick Instance"].default_value = True</code> is set
          in script, or enable the checkbox in the node&apos;s header in the
          node editor.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-join-geometry-transform-multi-part-assembly-lantern-webxr"
            className={lk}
          >
            GN Join Geometry + Transform — Faceted Lantern Assembly
          </Link>{" "}
          — the companion GN tutorial that covers multi-stream joins and
          per-stream material index assignment, which applies here when
          distinguishing terrain from crystals inside one GLB node.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-convex-hull-pointcloud-crystal-gem-webxr"
            className={lk}
          >
            bmesh.ops.convex_hull — Fibonacci Point-Cloud Crystal Gem
          </Link>{" "}
          — builds the individual crystal geometry that would serve as a
          scatter instance; understanding hull topology explains why the
          spike base radius matters for overlap prevention.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-build-modifier-face-reveal-crystal-growth-webxr"
            className={lk}
          >
            Build Modifier — Face-Reveal Crystal Growth
          </Link>{" "}
          — procedural crystal appearance via face sequencing; pairs with this
          scatter tutorial when animating a growing crystal garden.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-wireframe-edge-tube-crystal-cage-webxr"
            className={lk}
          >
            bmesh.ops.wireframe — Crystal Cage Lattice
          </Link>{" "}
          — wireframe cage variant that can be added as a fourth collection
          member for scatter variety.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-remesh-modifier-voxel-sharp-topology-clean-glb-webxr"
            className={lk}
          >
            RemeshModifier — Voxel SDF & Sharp Dual-Contouring
          </Link>{" "}
          — for cleaning up realized scatter geometry before baking normals or
          running a decimation pass on a dense scatter field.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/point/distribute_points_on_faces.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Distribute Points on Faces — Blender Manual
          </a>{" "}
          (CC-BY-SA 4.0, Blender Documentation Team). Primary reference for
          Poisson Disk parameters and socket layout in 5.x. Related projects:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender/blender
          </a>{" "}
          (GPL-3.0 for application source, CC-BY-SA for docs);{" "}
          <a
            href="https://projects.blender.org/blender/blender-addons"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender/blender-addons
          </a>{" "}
          (GPL-3.0).
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO — Khronos Group
          </a>{" "}
          (Apache-2.0). Defines <code>export_apply=True</code> behaviour that
          collapses GN modifiers (including Realize Instances) before
          serialising vertex buffers. Related projects:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KhronosGroup/glTF
          </a>{" "}
          (Apache-2.0 spec);{" "}
          <a
            href="https://github.com/mrdoob/three.js"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            mrdoob/three.js
          </a>{" "}
          (MIT) — the runtime loader that consumes the exported GLB.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
    {
      time: "an afternoon",
      difficulty: "intermediate",
      cost: "free",
      supplies: {
        materials: [
          "Blender 5.1",
          "blueprint.py from this library entry",
          "hf_crystal_scatter.blend (generated by blueprint.py)",
        ],
        tools: [
          "Blender Geometry Nodes editor",
          "Blender Python console (for verifying socket types)",
          "OBS Studio or Windows Game Bar for screen.mp4",
        ],
      },
      steps: [
        {
          title: "Run blueprint.py headless",
          body: (
            <p>
              <code>blender --background --python blueprint.py</code>
              <br />
              This creates the three crystal variants in the HF_Crystals
              collection, the hexagonal terrain pad, the GN node tree with
              Distribute Points → Instance on Points → Realize Instances, saves
              the blend file, and exports <code>hf_crystal_scatter.glb</code>.
            </p>
          ),
        },
        {
          title: "Inspect the node tree",
          body: (
            <p>
              Open <code>hf_crystal_scatter.blend</code>. Select the terrain
              object, open the Geometry Node Editor. Confirm the node chain:
              GroupInput → DistributePointsOnFaces (mode: POISSON_DISK) →
              InstanceOnPoints → RealizeInstances → JoinGeometry → GroupOutput.
              The N panel (Properties sidebar) shows Min Distance and Seed
              sliders wired to the group interface.
            </p>
          ),
        },
        {
          title: "Tune distribution",
          body: (
            <p>
              Adjust Min Distance from 0.05 to 0.25. Observe how the crystal
              density changes without any overlapping below 0.12 m. Change Seed
              to regenerate the layout while keeping the same spacing. Note that
              the point count varies with Min Distance but stays within the
              Density Max ceiling.
            </p>
          ),
        },
        {
          title: "Add Z-spin variation (optional)",
          body: (
            <p>
              Insert a <code>FunctionNodeRandomValue</code> (FLOAT, 0 to 6.28)
              between Distribute and Instance. Add a{" "}
              <code>FunctionNodeEulerToRotation</code> set to Z-only, then{" "}
              <code>FunctionNodeRotateRotation</code> (Space: LOCAL) to combine
              the surface rotation with the Z-spin. Wire the result to
              Instance&apos;s Rotation socket. Each crystal now spins randomly
              about its own growth axis while still aligning to the normal.
            </p>
          ),
        },
        {
          title: "Record viewport animation",
          body: (
            <p>
              <code>blender hf_crystal_scatter.blend --background --python record.py</code>
              <br />
              Renders a 6-second viewport.mp4 with a slow camera orbit and seed
              animation. Then follow SCREEN-RECORDING-NOTES.md for the
              interactive screen.mp4 using OBS.
            </p>
          ),
        },
      ],
    },
    {
      slug: "blender-tutorial-gn-distribute-points-instance-on-points-scatter-webxr",
      title:
        "GN Distribute Points on Faces + Instance on Points — Procedural Crystal Garden Scatter (Blender 5.1)",
      date: "2026-07-20",
      topics: ["blender", "geometry-nodes", "webxr", "scripting"],
      description:
        "Build a Poisson-disk crystal scatter in one GN modifier: DistributePointsOnFaces drives blue-noise placement, InstanceOnPoints picks from a three-variant collection, and RealizeInstances prepares the output for Draco-compressed GLB.",
      body: <Body />,
    }
  );
