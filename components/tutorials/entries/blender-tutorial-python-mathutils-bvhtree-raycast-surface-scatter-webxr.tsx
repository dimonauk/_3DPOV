import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&rsquo;s <code>mathutils.bvhtree.BVHTree</code> is a native C
        extension that builds an axis-aligned bounding-volume hierarchy over any
        triangle soup in O(n log n) time — then answers ray-cast queries in
        O(log n) rather than O(n).  The interface is small: build once via
        <code>BVHTree.FromObject()</code> or <code>BVHTree.FromBMesh()</code>,
        then call <code>bvh.ray_cast(origin, direction)</code> as many times as
        you need.  Each query returns the nearest hit as{" "}
        <code>(location, normal, face_index, distance)</code> — all four are{" "}
        <code>None</code> on a miss.  This tutorial uses that hit data to orient
        small props on a displaced sphere, then derives a convex-hull collision
        proxy from the hit-point cloud for WebXR hit-testing.
      </p>

      <h2>
        <code>FromObject</code> vs <code>FromBMesh</code>
      </h2>
      <p>
        <code>BVHTree.FromObject(obj, depsgraph)</code> evaluates the full
        modifier stack — Subdivision Surface, Displace, Geometry Nodes, all of
        it — before building the tree.{" "}
        <code>BVHTree.FromBMesh(bm)</code> takes raw mesh data with no modifier
        evaluation.  Use <code>FromObject</code> when you want to scatter onto
        the geometry the user actually sees; use <code>FromBMesh</code> when you
        want the unmodified base cage (e.g. to test against a control mesh
        before deformation).  In Blender 5.1 the <code>depsgraph</code>{" "}
        argument is required and cannot be <code>None</code> — passing{" "}
        <code>None</code> raises a <code>TypeError</code>, unlike some 3.x
        builds where it silently fell back to undeformed geometry.
      </p>
      <p>
        Compare the depsgraph usage here to the full evaluated-geometry
        iteration in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export"
          className={lk}
        >
          Depsgraph + GN instance batch-export tutorial
        </Link>
        , which walks every GN instance via{" "}
        <code>depsgraph.object_instances</code> rather than ray-casting.
      </p>

      <h2>Fibonacci hemisphere — why golden-ratio spiral</h2>
      <p>
        A naive (theta, phi) grid places far more samples near the poles than at
        mid-latitudes — the solid angle per sample varies wildly.  The
        golden-ratio Fibonacci spiral distributes N samples near-uniformly
        across the hemisphere, so concave shadow zones get comparable coverage
        to exposed faces.  The spiral formula:{" "}
        <code>phi = π(3 − √5)</code>, <code>y = 1 − i/(n−1)</code> (1 → 0),{" "}
        <code>r = √(1 − y²)</code>, <code>θ = phi × i</code>.  The full sphere
        adds a lower-hemisphere copy with z negated.
      </p>
      <p>
        This is the same distribution used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-multi-view-spherical-camera-rig-gaussian-splat"
          className={lk}
        >
          Fibonacci-sphere multi-camera rig tutorial
        </Link>{" "}
        for Gaussian Splatting capture.
      </p>

      <h2>Normal alignment — why quaternion, not axis-angle</h2>
      <p>
        <code>Matrix.Rotation(angle, 3, axis)</code> requires an explicit axis
        and angle.  Deriving those from two vectors means{" "}
        <code>axis = up.cross(normal)</code> — which has zero length when{" "}
        <code>normal ≈ −up</code>, producing NaN.{" "}
        <code>Vector.rotation_difference(other)</code> returns the quaternion
        that maps <em>self</em> to <em>other</em> by the shortest arc.  It
        handles the antiparallel case cleanly (returns a 180° flip around any
        perpendicular axis).  The result converts to a 3×3 matrix with{" "}
        <code>.to_matrix()</code> and promotes to 4×4 with{" "}
        <code>.to_4x4()</code> for the world-space assignment.
      </p>

      <h2>Convex-hull collision proxy</h2>
      <p>
        A WebXR scene that ray-tests every triangle in the scatter surface is
        impractical.  Instead the hit-point cloud (one point per successful ray)
        feeds <code>bmesh.ops.convex_hull(bm, input=bm.verts)</code>, which
        wraps all points in the smallest convex mesh possible.  At runtime the
        XR engine tests the incoming ray against the proxy&rsquo;s AABB first;
        only on a hit does it refine against the full scatter geometry.  The
        proxy exports as a separate <code>collision_proxy.glb</code> — it can
        carry a custom glTF extra tag (<code>holoflow:collision_only</code>) to
        suppress rendering while remaining present in the physics graph.
      </p>
      <p>
        For scatter workflows that stay entirely in Geometry Nodes, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-instance-on-points"
          className={lk}
        >
          GN Instance on Points tutorial
        </Link>
        .  For particle-based scatter where the props are driven by Blender's
        physics solver, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-particle-system-emitter-hair-instance-webxr"
          className={lk}
        >
          bpy ParticleSystem emitter + hair instance tutorial
        </Link>
        .
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/5.1/mathutils.bvhtree.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            mathutils.bvhtree — Blender 5.1 Python API
          </a>{" "}
          (CC-BY-SA-4.0, Blender Foundation) — canonical reference for
          FromObject, FromBMesh, ray_cast, and find_nearest signatures.
          Related: the{" "}
          <a
            href="https://docs.blender.org/api/5.1/mathutils.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            top-level mathutils module
          </a>{" "}
          documents Vector, Matrix, and Quaternion used throughout.
        </li>
        <li>
          <a
            href="https://github.com/njankowski/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njankowski/blender-scripting
          </a>{" "}
          (MIT, Nick Jankowski) — community examples of bmesh and mathutils
          patterns including ray-cast scatter and hull generation.  Sibling
          repo:{" "}
          <a
            href="https://github.com/njankowski/blenderpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njankowski/blenderpy
          </a>
          .
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-mathutils-bvhtree-raycast-surface-scatter-webxr",
  title:
    "Python mathutils.BVHTree — Ray-Cast Surface Scatter & Collision Proxy for WebXR (Blender 5.1)",
  date: "2026-07-04",
  kind: "tutorial",
  excerpt:
    "Build a BVH acceleration tree from an evaluated mesh, fire 240 inward rays from a Fibonacci hemisphere, orient props at each hit normal, then derive a convex-hull collision proxy for WebXR hit-testing — all via the mathutils.bvhtree C extension.",
  Body,
};

export const entry = buildInstructable(
  {
    time: "one afternoon",
    difficulty: "intermediate",
    cost: "free — Blender 5.1 and this script",
    supplies: {
      materials: [
        "Blender 5.1",
        "blueprint.py from this library entry",
        "record.py for the viewport render",
      ],
      tools: [
        "Blender Text Editor (Shift+F11)",
        "3D Viewport with Wireframe shading for proxy inspection",
        "System Console (Window > Toggle System Console) for hit-count output",
      ],
    },
    steps: [
      {
        title: "Open a fresh file and run blueprint.py",
        description:
          "Open Blender 5.1, File > New > General. Open the Text Editor " +
          "(Shift+F11), paste blueprint.py, and save your .blend to a local " +
          "folder — the // export paths resolve relative to it. Press Alt+P " +
          "to run. Watch the System Console for the hit-count line: " +
          "[BVHTree scatter] 174 props from 240 rays. The displaced sphere " +
          "and all oriented props appear in the 3D Viewport.",
      },
      {
        title: "Understand FromObject vs FromBMesh",
        description:
          "Select ScatterTarget in the Outliner, go to Properties > Modifier " +
          "Properties, and confirm the Displace modifier is present. " +
          "BVHTree.FromObject(target, depsgraph) evaluates this modifier stack " +
          "before building the tree — the tree represents the bumpy surface you " +
          "see, not the undeformed UV sphere. Try replacing FromObject with " +
          "BVHTree.FromBMesh(bmesh.from_edit_mesh(target.data)) and re-run: " +
          "props now scatter onto the flat sphere, proving the distinction.",
      },
      {
        title: "Inspect ray misses and normal rejection",
        description:
          "Add a print() call inside the loop: if location is None: print('miss', direction). " +
          "Re-run and observe which directions miss — these are rays that bypass " +
          "concave indentations where the displaced surface curves away. The " +
          "NORMAL_Z_MIN guard (abs(normal.z) < cos(75°)) additionally rejects " +
          "near-horizontal faces. Raise the angle threshold to 90° and watch " +
          "props appear on vertical faces; lower it to 30° and the underside " +
          "overhangs fill in.",
      },
      {
        title: "Inspect the convex-hull collision proxy",
        description:
          "Select collision_proxy in the Outliner. Switch Viewport Shading to " +
          "Wireframe (Z > Wireframe). The hull wraps the scatter cloud in a " +
          "minimal convex mesh — far fewer triangles than the scatter surface. " +
          "In a WebXR three.js scene import collision_proxy.glb as an invisible " +
          "THREE.Mesh with a physics body; the engine tests incoming rays " +
          "against this mesh's AABB first, then refines. Compare the triangle " +
          "count (Viewport Overlays > Statistics) between collision_proxy and " +
          "scatter_result.",
      },
      {
        title: "Run record.py to produce the reveal animation",
        description:
          "Without closing Blender, open record.py in the Text Editor alongside " +
          "blueprint.py. Press Alt+P. The script creates an orbiting camera, " +
          "keyframes each prop hidden on frame 1 and visible on its reveal frame, " +
          "then calls bpy.ops.render.render(animation=True). The 120-frame EEVEE " +
          "render writes viewport.mp4 to the videos/scripting/... path. Play the " +
          "file in a media player to confirm props reveal sequentially as the " +
          "camera orbits.",
      },
      {
        title: "Adapt for a character mesh",
        description:
          "Replace make_target() with a VRM import call and apply transforms " +
          "(Object > Apply > All Transforms) before building the BVH. Raise " +
          "NORMAL_Z_MIN to cos(60°) so props appear only on near-upward faces " +
          "(shoulders, crown) and not on vertical torso surfaces.",
      },
    ],
    finalResult:
      "A displaced sphere with ~170 oriented prop instances exported as " +
      "scatter_result.glb, plus a collision_proxy.glb convex hull for WebXR " +
      "hit-testing. A 120-frame viewport.mp4 shows the props revealing " +
      "sequentially as the camera orbits.",
    variations: [
      "find_nearest instead of ray_cast: swap bvh.ray_cast() for bvh.find_nearest(point) to drape props from a regular 3D sample grid onto the nearest surface point rather than firing from a bounding sphere.",
      "Per-prop metadata: after orient_to_normal(), assign inst['holoflow:surface_normal'] = list(normal) so the glTF extras hook bakes the original surface normal into each prop's GLB extras — useful for XR shaders.",
      "Poisson-disk rejection: after collecting hit_points, remove any hit closer than a threshold to its nearest neighbour (KD-tree lookup) for a more even distribution without resampling.",
    ],
    troubleshooting: [
      {
        symptom: "TypeError: BVHTree.FromObject() argument 2 must be Depsgraph, not NoneType",
        cause: "depsgraph is None — script ran before objects were fully linked, or in headless mode without an explicit depsgraph.update().",
        fix: "Call bpy.context.evaluated_depsgraph_get() after all objects are added. In headless mode call bpy.context.view_layer.depsgraph.update() first.",
      },
      {
        symptom: "All rays miss — no props appear",
        cause: "RAY_ORIGIN_SCALE is too small (origins inside mesh) or object has unapplied scale.",
        fix: "Apply transforms (Object > Apply > All Transforms), then raise RAY_ORIGIN_SCALE to 3.0.",
      },
      {
        symptom: "CollisionProxy mesh is empty",
        cause: "hit_points has fewer than 4 non-coplanar points; bmesh.ops.convex_hull needs at least 4.",
        fix: "Guard: if len(hit_points) < 4: raise RuntimeError('Too few hits'). Increase N_HEMISPHERE_RAYS or lower NORMAL_Z_MIN.",
      },
      {
        symptom: "Prop scales wrong in the GLB viewer",
        cause: "The viewer ignores glTF node TRS scale; export_apply=True only bakes mesh transforms, not per-object scale overrides.",
        fix: "Before export, select all instances and bpy.ops.object.transform_apply(scale=True) to bake scale into mesh data.",
      },
    ],
  },
  base,
);
