import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnSampleGridVolumeFieldProbeLatticeBody() {
  return (
    <>
      <p>
        <strong>Sample Grid</strong> (
        <code>GeometryNodeSampleGrid</code>) is the inverse of{" "}
        <Link href="/tutorials/blender-tutorial-gn-volume-cube-procedural-cloud" className={lk}>
          Volume Cube
        </Link>
        .  Where Volume Cube <em>writes</em> a field (noise texture, maths,
        colour ramp) into a voxel grid during GN evaluation, Sample Grid{" "}
        <em>reads</em> that grid back at an arbitrary 3-D position you supply,
        returning the trilinearly interpolated scalar or vector value.  The node
        is the bridge between the volume domain and every other domain — it lets
        mesh vertices, scattered points, or curve control points ask the question
        "what is the density at my position?"
      </p>
      <p>
        This tutorial scatters a uniform sensor lattice inside a noise-density
        volume using{" "}
        <Link href="/tutorials/blender-tutorial-gn-distribute-points-in-volume-crystal-geode" className={lk}>
          Distribute Points in Volume (DENSITY_GRID mode)
        </Link>
        , samples the density at each lattice point via Sample Grid, deletes
        sensors below a threshold, and colour-codes the survivors on a
        blue&thinsp;→&thinsp;cyan&thinsp;→&thinsp;white ramp scaled by density
        magnitude.  The result is a WebXR-ready GLB constellation that reveals
        the internal cloud structure without any volume rendering.
      </p>

      <h2>The coordinate-space trap</h2>
      <p>
        <code>SampleGrid.Position</code> is interpreted in the{" "}
        <strong>volume object&rsquo;s local space</strong>.  A probe
        object&rsquo;s <code>Position</code> node yields positions in the{" "}
        <em>probe object&rsquo;s</em> local space.  When both objects sit at
        world origin with no scale or rotation these spaces are identical — the
        tutorial exploits that to keep the maths simple.  The moment you move
        the volume object, every sensor samples the wrong point.  The fix is a
        matrix multiply: convert probe local → world → volume local using
      </p>
      <pre>{`# Python, evaluated each frame or baked into a socket:
inv_vol = vol_ob.matrix_world.inverted()
probe_world_pos = probe_ob.matrix_world @ Vector(local_pos)
vol_local_pos = inv_vol @ probe_world_pos`}</pre>
      <p>
        In a GN tree you can expose this as a &ldquo;Transform Matrix&rdquo;
        socket and compute the inverse on the Python side, passing it in as a
        4x4 matrix field.
      </p>

      <h2>Pipeline overview</h2>
      <pre>{`SG_Volume object  →  HS_SG_VolumeField GN modifier
  ShaderNodeTexNoise (3D, Scale=1.3, Detail=5)
  → ShaderNodeMapRange([0.30, 0.78] → [0, 1], SMOOTHSTEP)
  → GeometryNodeVolumeCube (Resolution 48³, Min/Max ±2 m)
  → Volume geometry  (grid name: "density")

SG_Probe object  →  HS_SG_FieldProbe GN modifier
  GeometryNodeObjectInfo(SG_Volume, ORIGINAL)
  → GeometryNodeDistributePointsInVolume(DENSITY_GRID, Spacing=0.13 m)
  → ~29 000 lattice sensor points

  GeometryNodeSampleGrid(
      Volume  = ObjectInfo.Geometry,
      Grid    = "density",
      Position = GeometryNodeInputPosition
  ) → density: Float  (per-point field)

  density < 0.38  → GeometryNodeDeleteGeometry  (removes sparse haze)
  density → MapRange([0.38, 1.0] → [0, 1])
          → ShaderNodeValToRGB (blue → cyan → white)
          → GeometryNodeStoreNamedAttribute("Col", FLOAT_COLOR)

  density × 3.8 → CombineXYZ → GeometryNodeInstanceOnPoints.Scale
  GeometryNodeMeshUVSphere(R=0.022 m) → Instance

  GeometryNodeRealizeInstances → GLB output`}</pre>

      <h2>Why DENSITY_GRID, not DENSITY_RANDOM?</h2>
      <p>
        <code>DENSITY_RANDOM</code> samples positions with probability
        proportional to voxel density, so it naturally clusters in dense
        regions.  After Sample Grid filtering those clusters would be dense
        twice over — the combination is redundant and hides the sparse-region
        boundary shape.
      </p>
      <p>
        <code>DENSITY_GRID</code> places a point at <em>every</em> voxel
        centre regardless of density, then Sample Grid reports the true density
        at each uniform position.  The threshold cut in Sample Grid then
        sculpts the boundary cleanly: sensors at the iso-surface of the cloud
        survive at exactly the right density contour.  This is analogous to
        marching cubes — uniform sampling followed by a threshold is better than
        pre-biased sampling followed by the same threshold.
      </p>

      <h2>Grid Name: the underdocumented socket</h2>
      <p>
        Volume Cube always names its output grid <code>&quot;density&quot;</code>.
        Imported VDB files carry their own name conventions:
      </p>
      <ul>
        <li><code>&quot;density&quot;</code> — fog/smoke density (most common)</li>
        <li><code>&quot;temperature&quot;</code> — fire temperature</li>
        <li><code>&quot;velocity&quot;</code> — motion vector (FLOAT_VECTOR data type)</li>
        <li><code>&quot;flame&quot;</code> — flame mask</li>
        <li><code>&quot;shadow&quot;</code> — pre-computed shadow cache</li>
      </ul>
      <p>
        To introspect an imported VDB in the Blender Python console:
      </p>
      <pre>{`import bpy
dg = bpy.context.evaluated_depsgraph_get()
vol_eval = bpy.data.objects["SG_Volume"].evaluated_get(dg)
print(list(vol_eval.data.grids.keys()))
# → ['density']`}</pre>

      <h2>Colour ramp design</h2>
      <p>
        The ramp maps normalised density (0 = just above threshold, 1 = maximum)
        to a blue&thinsp;→&thinsp;cyan&thinsp;→&thinsp;white progression.  Blue
        sensors sit at the cloud perimeter where density is thin; white sensors
        occupy the core.  This is the same encoding used in{" "}
        <Link href="/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge" className={lk}>
          Store Named Attribute for shader-data bridging
        </Link>
        {" "}— the <code>&quot;Col&quot;</code> attribute is stored as{" "}
        <code>FLOAT_COLOR</code> so it exports as <code>COLOR_0</code> in the
        GLB and reads directly in the Holoflow atelier Three.js scene via{" "}
        <code>THREE.MeshBasicMaterial({`{ vertexColors: true }`})</code>.
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>All sensors black / zero density</strong> — the probe and
          volume objects are not at the same origin, so the Position node gives
          out-of-bounds coordinates.  Apply the matrix correction above.
        </li>
        <li>
          <strong>No points generated</strong> — <code>DENSITY_GRID</code>{" "}
          requires the volume to have active voxels above the Threshold.  If
          Threshold is &gt; 0, voxels with low density are excluded before
          SampleGrid can see them.  Keep Threshold at 0 on the Distribute node
          and let SampleGrid do the filtering.
        </li>
        <li>
          <strong>RealizeInstances missing</strong> — without it the GLB
          exporter sees only the probe object&rsquo;s empty mesh (instances are
          not geometry until realised).  Always place RealizeInstances before
          the Group Output.
        </li>
        <li>
          <strong>Sample Grid data_type mismatch</strong> — if the grid stores
          vectors (e.g. <code>&quot;velocity&quot;</code>) but{" "}
          <code>data_type</code> is <code>&apos;FLOAT&apos;</code>, Blender
          returns the magnitude silently.  Set <code>data_type=&apos;FLOAT_VECTOR&apos;</code>{" "}
          and use a <em>Vector Length</em> math node if you need the magnitude
          explicitly.
        </li>
      </ul>

      <h2>Contrast with sibling patterns</h2>
      <p>
        <Link href="/tutorials/blender-tutorial-gn-field-at-index-edge-tangent-flow-map" className={lk}>
          Field at Index
        </Link>
        {" "}reads a value from <em>another element in the same geometry</em>
        (mesh/curve domain) at an integer index.  Sample Grid reads from a{" "}
        <em>volume grid</em> at a world (local) position.  They solve
        complementary problems: Field at Index is for geometry self-reference;
        Sample Grid is for external volumetric data.
      </p>
      <p>
        <Link href="/tutorials/blender-tutorial-physics-dynamic-paint-canvas-brush-wetness-trail" className={lk}>
          Dynamic Paint
        </Link>
        {" "}also maps an environmental signal onto geometry, but via the physics
        cache rather than a live field evaluation.  Dynamic Paint is
        frame-accurate but CPU-heavy and non-procedural; Sample Grid is instant,
        fully procedural, and GPU-evaluated.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/volume/sample_grid.html"
            target="_blank" rel="noopener noreferrer" className={lk}
          >
            Blender Manual — Sample Grid node
          </a>
          {" "}· CC-BY-SA 4.0 · Blender Foundation
        </li>
        <li>
          <a
            href="https://github.com/AcademySoftwareFoundation/openvdb"
            target="_blank" rel="noopener noreferrer" className={lk}
          >
            AcademySoftwareFoundation/openvdb
          </a>
          {" "}· Apache-2.0 · ASWF / DreamWorks Animation.
          Related:{" "}
          <a
            href="https://github.com/AcademySoftwareFoundation/openvdb/tree/master/nanovdb"
            target="_blank" rel="noopener noreferrer" className={lk}
          >
            NanoVDB
          </a>
          {" "}(real-time GPU-native VDB format used in Blender&rsquo;s viewport)
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            target="_blank" rel="noopener noreferrer" className={lk}
          >
            njanakiev/blender-scripting
          </a>
          {" "}· MIT · Nicolas Janakiev — bpy volume and GN scripting examples
        </li>
      </ul>
    </>
  );
}

const entry = buildInstructable({
  title:
    "GN Sample Grid — Volume Field Probe: Lattice Sensor Constellation (Blender 5.1)",
  slug: "blender-tutorial-gn-sample-grid-volume-field-probe-lattice",
  date: "2026-06-27",
  tags: ["blender", "geometry-nodes", "volume", "vdb", "webxr", "procedural"],
  libraryPath:
    "blends/geometry-nodes/gn-sample-grid-volume-field-probe-lattice",
  body: GnSampleGridVolumeFieldProbeLatticeBody,
});

export { entry };
