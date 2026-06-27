import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnDeformCurvesOnSurfaceVrmHairBody() {
  return (
    <>
      <p>
        <code>GeometryNodeDeformCurvesOnSurface</code> re-positions HairCurves
        control points every frame so they track the deformation of a bound
        surface mesh. When an Armature modifier tilts the scalp, the strands
        lean with it — purely kinematically, no physics solver, no re-simulation,
        zero per-frame CPU overhead beyond the depsgraph evaluation. The binding
        is implicit: set two properties on the HairCurves data block and the
        modifier does the rest.
      </p>
      <p className="mt-3">
        This technique sits between{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-interpolate-curves-strand-hair-vrm"
          className={lk}
        >
          Interpolate Curves
        </Link>{" "}
        (which <em>generates</em> strands from guide curves) and{" "}
        <Link
          href="/tutorials/blender-tutorial-vrm-spring-bones-hair-chain"
          className={lk}
        >
          VRM Spring Bones
        </Link>{" "}
        (which add runtime physics bounce). The two systems compose: you can
        run Interpolate Curves to fill a scalp with strands, then add a Deform
        Curves on Surface modifier on the same object to make those strands
        follow the rig. For GLB export the strands are converted to a triangle
        mesh — the workflow mirrors{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-surface-deform-vrm-cloth-binding"
          className={lk}
        >
          Surface Deform cloth binding
        </Link>
        , the key difference being that Surface Deform targets a regular mesh
        while Deform Curves on Surface targets the HairCurves data type.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        The two bind properties
      </h2>
      <p>
        The entire bind step is two assignments on the{" "}
        <code>bpy.types.Curves</code> data block — note the plural, which
        distinguishes the new HairCurves system from the legacy Bézier{" "}
        <code>bpy.types.Curve</code> type:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`hc = bpy.data.hair_curves.new("HF_GuideHair")
obj = bpy.data.objects.new("HF_GuideHair", hc)
bpy.context.collection.objects.link(obj)

# Bind to the scalp mesh in its REST pose
hc.surface        = scalp_obj   # Object reference — not a string
hc.surface_uv_map = "UVMap"    # Must match a UV layer name on scalp_obj`}</pre>
      <p className="mt-3">
        The UV map is non-optional. On every evaluation the node locates each
        curve root&apos;s UV coordinate, finds the corresponding face on the
        surface, and reads the three vertex positions of that face to compute
        a weighted average position for the root. Without a UV map the lookup
        fails silently and all strands remain in their rest-pose positions.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Creating HairCurves with bpy
      </h2>
      <p>
        <code>hc.add_curves(sizes)</code> takes a list of integers — one per
        curve, giving the number of control points for that curve. All points
        live in a single flat array; the sizes list tells Blender where each
        curve ends. Positions are written to the <code>position</code> attribute
        directly, using <code>Vector</code> values:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`GUIDE_PTS  = 6
NUM_GUIDES = 12

hc.add_curves([GUIDE_PTS] * NUM_GUIDES)   # 72 total points

pos_attr = hc.attributes["position"]
pt_idx   = 0

for lat_deg, lon_deg in GUIDE_SPECS:
    root   = _spherical(lat_deg, lon_deg, SCALP_RADIUS)
    normal = root.normalized()
    tip_dir = (normal * 0.85 + Vector((0, 0, -0.55))).normalized()

    for step in range(GUIDE_PTS):
        t       = step / max(GUIDE_PTS - 1, 1)
        droop_z = t * t * STRAND_LENGTH * 0.12   # quadratic gravity bias
        pos     = root + tip_dir * (STRAND_LENGTH * t) - Vector((0, 0, droop_z))
        pos_attr.data[pt_idx].vector = pos
        pt_idx += 1`}</pre>
      <p className="mt-3">
        The quadratic droop term (<code>t²</code>) ensures the tip bends more
        than the mid-point — the visual signature of hair hanging under gravity
        without running a solver. A linear term would give a bent stick; cubic
        gives an S-shape used for ringlets.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        The Deform Curves on Surface modifier
      </h2>
      <p>
        The node lives under <strong>Curve → Deform Curves on Surface</strong>{" "}
        in the GN Add menu (Blender 5.1 node identifier:{" "}
        <code>GeometryNodeDeformCurvesOnSurface</code>). It takes one input:
        the incoming curves geometry. No surface Object Info node is needed —
        the node reads <code>hc.surface</code> from the curves data block
        automatically, which is why the modifier interface is intentionally
        minimal:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`ng = bpy.data.node_groups.new("HF_DeformCurvesOnSurface", 'GeometryNodeTree')
ng.is_modifier = True

ng.interface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
ng.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

n_in  = ng.nodes.new('NodeGroupInput')
n_out = ng.nodes.new('NodeGroupOutput')
n_def = ng.nodes.new('GeometryNodeDeformCurvesOnSurface')

ng.links.new(n_in.outputs['Geometry'],  n_def.inputs['Curves'])
ng.links.new(n_def.outputs['Curves'],   n_out.inputs['Geometry'])

mod            = guide_obj.modifiers.new("DeformCurvesOnSurface", 'NODES')
mod.node_group = ng`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        How the per-frame tracking works
      </h2>
      <p>
        At first evaluation the node walks each curve root&apos;s UV coordinate
        to its corresponding face on the rest-pose mesh and records the
        barycentric weights <em>(u, v, 1−u−v)</em>. Every subsequent frame it
        reads the three <strong>deformed</strong> vertex positions of that same
        face, recomputes the weighted position for the root, then constructs a
        local tangent frame from the deformed face normal and compares it to the
        rest-pose tangent frame. The rotation difference is applied to every
        control point on that strand — this is what makes the hair lean sideways
        when the head rotates, not merely follow the root point&apos;s translation.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Converting to mesh for GLB export
      </h2>
      <p>
        GLTF has no native Curves primitive. A second GN tree on a separate
        mesh object reads the HairCurves via <code>ObjectInfo</code> and sweeps
        a profile along each strand:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# ObjectInfo reads the deformed curves (after DeformCurvesOnSurface ran)
n_oi = ng.nodes.new('GeometryNodeObjectInfo')
n_oi.inputs['Object'].default_value = guide_obj
n_oi.transform_space = 'RELATIVE'   # coordinates relative to the output object

# Pentagon cross-section: 5 sides gives round silhouette at low triangle cost
n_circle = ng.nodes.new('GeometryNodeCurvePrimitiveCircle')
n_circle.mode = 'POINTS'
n_circle.inputs['Vertices'].default_value = 5
n_circle.inputs['Radius'].default_value   = 0.0018   # 1.8 mm radius

# Fill Caps False: open tips look like hair, not capped cable ends
n_c2m = ng.nodes.new('GeometryNodeCurveToMesh')
n_c2m.inputs['Fill Caps'].default_value = False

# Triangulate for GLB compatibility
n_tri = ng.nodes.new('GeometryNodeTriangulateMesh')`}</pre>
      <p className="mt-3">
        <code>export_apply=True</code> in the GLTF exporter realises the GN
        modifier and the Armature deformation together, so the exported GLB
        shows the mesh at the posed frame. For a rest-pose export, set{" "}
        <code>bpy.context.scene.frame_set(1)</code> before calling the exporter.
        See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-nla-bake-ik-fk-action-push"
          className={lk}
        >
          NLA bake tutorial
        </Link>{" "}
        for baking the full animation to an Action before export if you need
        the animation embedded in the GLB rather than a single-frame snapshot.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Deform Curves on Surface vs VRM Spring Bones: when to use which
      </h2>
      <ul className="list-disc list-inside space-y-2 text-sm mt-2">
        <li>
          <strong>DeformCOS</strong> — zero runtime cost, skeleton-exact tracking,
          works in any GLTF viewer regardless of VRM physics support. Use for
          LOD-1, mobile WebXR, or any context where secondary motion is
          unimportant.
        </li>
        <li>
          <strong>VRM Spring Bones</strong> — adds inertia lag and bounce at
          runtime, but costs CPU each frame and only activates in viewers that
          implement the VRM specification. Use for hero characters on desktop
          WebXR where secondary motion matters.
        </li>
        <li>
          <strong>Combining both</strong> — apply the DeformCOS modifier to bake
          a posed or animated base shape, then export with Spring Bone metadata.
          The physics layer adds secondary motion on top of the skeleton-driven
          base.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Troubleshooting</h2>
      <ul className="list-disc list-inside space-y-2 text-sm mt-2">
        <li>
          <strong>Strands do not move when armature poses change</strong> —{" "}
          <code>hc.surface</code> is not set, or it points to the armature object
          rather than the scalp mesh. Confirm{" "}
          <code>hc.surface = scalp_obj</code> where <code>scalp_obj.type ==
          &apos;MESH&apos;</code>.
        </li>
        <li>
          <strong>All strands collapse to world origin on first evaluation</strong>{" "}
          — the UV layer is absent or named incorrectly.
          Run <code>scalp_obj.data.uv_layers[0].name</code> in the console and
          update <code>hc.surface_uv_map</code> to match exactly.
        </li>
        <li>
          <strong>GeometryNodeDeformCurvesOnSurface not found in Add menu</strong>{" "}
          — you have a legacy <code>bpy.data.curves</code> object selected, not
          a HairCurves object. The node only appears when the active modifier&apos;s
          host object has type <code>&apos;CURVES&apos;</code>. Check{" "}
          <code>obj.type</code>.
        </li>
        <li>
          <strong>hc.add_curves() raises AttributeError</strong> — the data
          block was created with <code>bpy.data.curves.new()</code> (legacy Curve)
          instead of <code>bpy.data.hair_curves.new()</code> (HairCurves). Verify{" "}
          <code>type(hc).__name__ == &apos;Curves&apos;</code> (plural S).
        </li>
        <li>
          <strong>ObjectInfo reads rest-pose positions, ignoring armature</strong>{" "}
          — the depsgraph evaluation order matters. The ObjectInfo node in the
          Curve-to-Mesh tree must evaluate AFTER the DeformCOS modifier on the
          HairCurves object. Add a Geometry Nodes modifier to the mesh output
          object rather than to the HairCurves object itself to ensure the
          dependency chain is respected.
        </li>
        <li>
          <strong>pos_attr.data[i].vector raises IndexError</strong> — the
          running <code>pt_idx</code> exceeds the allocated count.
          <code>add_curves([6]*12)</code> allocates 72 points; any index ≥ 72
          is out of range. Verify <code>len(GUIDE_SPECS) × GUIDE_PTS</code>{" "}
          equals the sum passed to <code>add_curves()</code>.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside references</h2>
      <ul className="list-disc list-inside space-y-1 text-sm mt-2">
        <li>
          <strong>Blender Manual — Deform Curves on Surface</strong> (CC-BY-SA
          4.0, Blender Documentation Team):{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/deform_curves_on_surface.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.blender.org
          </a>
          . Authoritative source for socket names, the surface binding
          properties, and the UV-barycentric lookup mechanism.
        </li>
        <li>
          <strong>
            Jacques Lucke / Blender Institute — &ldquo;New Hair in Blender
            3.3&rdquo;
          </strong>{" "}
          (CC-BY-SA 4.0, 2022):{" "}
          <a
            href="https://code.blender.org/2022/08/new-hair-in-blender-3-3/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            code.blender.org
          </a>
          . Explains the design rationale for the HairCurves data type
          (<code>bpy.data.hair_curves</code>) and why surface binding uses UV
          coordinates rather than mesh proximity. Related project: the Blender
          source tree (GPL-2.0 — the blog post itself is CC-BY-SA).
        </li>
        <li>
          <strong>Khronos Group — glTF-Blender-IO</strong> (Apache-2.0):{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/KhronosGroup/glTF-Blender-IO
          </a>
          . The GLTF exporter used by <code>bpy.ops.export_scene.gltf()</code>.
          Related: glTF-Sample-Assets (CC0) —{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Assets"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/KhronosGroup/glTF-Sample-Assets
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    steps: [
      {
        title: "Build the scalp hemisphere",
        body: "Run _make_scalp(): add a UV sphere (16 U × 10 V segments, radius 0.11 m), delete all verts with Z < 0, run Smart UV Project in Edit mode, rename the UV layer to 'UVMap'. The UV map is non-optional — the Deform Curves on Surface node uses it for barycentric root lookup.",
      },
      {
        title: "Add a single-bone armature",
        body: "Run _make_armature(): create an armature with one 'Head' bone (head at origin, tail at Z=0.22 m). Parent the scalp to the armature via an Armature modifier, add all scalp verts to a 'Head' vertex group at weight 1.0. Keyframe the bone at rest (frame 1) and tilted 25 ° forward (frame 30).",
      },
      {
        title: "Create and bind the HairCurves",
        body: "Run _make_guide_curves(scalp): create a bpy.data.hair_curves block, call hc.add_curves([6]*12) to allocate 72 points across 12 curves. Iterate GUIDE_SPECS (lat/lon pairs) to place root-to-tip positions using a quadratic droop. Set hc.surface = scalp_obj and hc.surface_uv_map = 'UVMap'. These two lines are the complete bind step.",
      },
      {
        title: "Add the Deform Curves on Surface modifier",
        body: "Run _add_deform_modifier(guides): create a GeometryNodeTree marked is_modifier=True. Add GroupInput, GroupOutput, and GeometryNodeDeformCurvesOnSurface nodes. Wire GroupInput.Geometry → node.Curves → GroupOutput.Geometry. Assign the node group as a NODES modifier on the HairCurves object.",
      },
      {
        title: "Build the Curve-to-Mesh output object",
        body: "Run _make_hair_mesh_gn(guides): on a separate empty mesh object, create a second GN tree. ObjectInfo reads the HairCurves geometry (transform_space='RELATIVE'); a 5-vertex circle (radius 0.0018 m) is swept along each strand via CurveToMesh (Fill Caps = False); TriangulateMesh converts quads to tris for GLB.",
      },
      {
        title: "Save blend file and export posed GLB",
        body: "Run _export(hair_mesh): advance to frame 30 (posed), save deform_curves_demo.blend, then call bpy.ops.export_scene.gltf with export_apply=True (realises GN + armature at the current pose), Draco 6 compression, WebP images. GLB lands as deform_curves_demo_posed.glb.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Strands do not move when the armature poses",
        cause:
          "hc.surface is not set, or points to the armature object instead of the scalp mesh. The node only tracks a surface of type MESH.",
        fix: "Confirm hc.surface = scalp_obj where scalp_obj.type == 'MESH'. Check Object Data Properties → Surface Binding in the Blender UI.",
      },
      {
        symptom: "All strands collapse to world origin on first evaluation",
        cause:
          "The UV layer name stored in hc.surface_uv_map does not match any UV layer on hc.surface. The node silently fails the barycentric lookup.",
        fix: "Run scalp_obj.data.uv_layers[0].name in the Python console and set hc.surface_uv_map to exactly that string.",
      },
      {
        symptom: "GeometryNodeDeformCurvesOnSurface not found in the GN Add menu",
        cause:
          "The modifier host object is a legacy Curve (type='CURVE'), not a HairCurves object (type='CURVES'). The node only appears for the HairCurves type.",
        fix: "Verify obj.type == 'CURVES'. Create the data block with bpy.data.hair_curves.new(), not bpy.data.curves.new().",
      },
      {
        symptom: "ObjectInfo in the Curve-to-Mesh tree shows rest-pose curves ignoring deformation",
        cause:
          "Evaluation order: the Curve-to-Mesh modifier on the output mesh object evaluates before the DeformCOS modifier on the HairCurves object in the depsgraph.",
        fix: "Keep the Curve-to-Mesh GN tree on a separate mesh object (not on the HairCurves object). Blender evaluates the referenced object first, ensuring DeformCOS has already run.",
      },
    ],
    finalResult:
      "A VRM-scale scalp dome parented to a single 'Head' bone, with 12 HairCurves guide strands bound via hc.surface + hc.surface_uv_map. A DeformCurvesOnSurface GN modifier makes the strands track the armature pose. A second GN tree converts the curves to a triangle mesh (5-vert pentagon profile, open tips). deform_curves_demo.blend saved. deform_curves_demo_posed.glb exported at the tilted frame 30 with Draco 6 compression, demonstrating kinematic hair tracking without physics.",
  },
  {
    slug: "blender-tutorial-gn-deform-curves-on-surface-vrm-hair",
    title:
      "GN Deform Curves on Surface — Hair Strand Binding: Mesh-Pinned Strands That Follow Armature Deformation (Blender 5.1)",
    date: "2026-06-27",
    kind: "tutorial",
    excerpt:
      "Use GeometryNodeDeformCurvesOnSurface to make HairCurves strands track a skinned scalp mesh without physics or re-simulation. Covers the two-line bind step (hc.surface + hc.surface_uv_map), the UV-barycentric tracking mechanism, Curve-to-Mesh output for GLB export, and when to choose this over VRM Spring Bones.",
    Body: GnDeformCurvesOnSurfaceVrmHairBody,
  },
);
