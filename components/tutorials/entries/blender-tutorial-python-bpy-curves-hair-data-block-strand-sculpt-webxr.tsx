import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender has two entirely different &ldquo;curve&rdquo; data types.{" "}
        <code>bpy.types.Curve</code> (type=&lsquo;CURVE&rsquo;) is the classic
        bezier/NURBS path object. <code>bpy.types.Curves</code>{" "}
        (type=&lsquo;CURVES&rsquo;, plural) is the new dedicated hair substrate
        introduced in Blender 3.3 and fully productionised in 5.1. Each strand
        in the new type is a polyline stored as flat arrays in named geometric
        attributes — the same{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mesh-attributes-foreach-set-gn-data-pipeline"
          className={lk}
        >
          foreach_set / foreach_get
        </Link>{" "}
        interface that mesh attributes use, making hair geometry first-class
        data rather than a legacy particle system appendage. The POINT domain
        holds one element per control point across all strands; the CURVE
        domain holds one element per strand (cycle flag, curve type, UV on
        surface). Everything else — position, radius, colour — is a named
        attribute on one of those two domains.
      </p>

      <p>
        The critical design rule is <em>topology before geometry</em>.{" "}
        <code>curves_data.add_curves(counts)</code> declares the strand
        structure by building an integer offset array that partitions the flat
        POINT buffer into individual strands. Only after that call does writing
        to the <code>&apos;position&apos;</code> attribute make sense. A
        common first-contact mistake is trying to set positions before calling{" "}
        <code>add_curves()</code> — the flat buffer has zero length and the
        foreach_set raises a misleading size mismatch error. Compare this with
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-curves-hair-grooming"
          className={lk}
        >
          manual hair grooming tutorial
        </Link>
        , where Blender&rsquo;s sculpt tools handle that declaration for you; here
        Python owns the entire topology declaration.
      </p>

      <p>
        Guide strands created here feed directly into the GN{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-interpolate-curves-strand-hair-vrm"
          className={lk}
        >
          Interpolate Hair Curves modifier
        </Link>{" "}
        — 64 guides interpolated to thousands of render-density strands, each
        following the guide closest to its surface UV. The surface binding
        (<code>curves_data.surface</code>,{" "}
        <code>curves_data.surface_uv_map</code>) is what makes that
        interpolation possible: Blender matches each guide&rsquo;s{" "}
        <code>surface_uv_coordinate</code> attribute (CURVE domain, FLOAT2)
        against the surface mesh&rsquo;s named UV layer, pinning roots exactly
        regardless of object transforms. After grooming, attach{" "}
        <Link
          href="/tutorials/blender-tutorial-vrm-spring-bones-hair-chain"
          className={lk}
        >
          VRM spring-bone constraints
        </Link>{" "}
        to the interpolated result for physics-driven sway at runtime. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-deform-curves-on-surface-vrm-hair"
          className={lk}
        >
          Deform Curves on Surface
        </Link>{" "}
        modifier then lets you reshape the surface mesh (e.g., via a blend
        shape) and have the hair roots follow automatically.
      </p>

      <p>
        <strong>Outside sources.</strong>{" "}
        Blender Foundation —{" "}
        <em>bpy.types.Curves API Reference (5.1)</em>{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.Curves.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          docs.blender.org/api/5.1/bpy.types.Curves.html
        </a>{" "}
        CC-BY-4.0 — full property listing for the Curves data block including
        the <code>curves</code> / <code>points</code> collection accessors,{" "}
        <code>surface</code> and <code>surface_uv_map</code> binding
        properties, and the <code>add_curves()</code> method signature; sibling
        repo{" "}
        <a
          href="https://projects.blender.org/blender/blender-extensions"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          blender/blender-extensions
        </a>{" "}
        (Apache-2.0) — the official extensions platform where add-ons that wrap
        this API are distributed.
        {" "}Blender Foundation —{" "}
        <em>Hair Curves object: developer docs</em>{" "}
        <a
          href="https://developer.blender.org/docs/features/objects/hair/"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          developer.blender.org/docs/features/objects/hair/
        </a>{" "}
        CC-BY-4.0 — explains the attribute-domain data model, the offset array
        encoding used internally by <code>add_curves()</code>, and the surface
        UV binding contract that GN modifiers depend on; related project{" "}
        <a
          href="https://projects.blender.org/blender/blender-addons"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          blender/blender-addons
        </a>{" "}
        — legacy add-on repository that includes the original hair export
        helpers being replaced by the new Curves pipeline.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-bpy-curves-hair-data-block-strand-sculpt-webxr",
  title:
    "Python bpy.types.Curves — Procedural Hair Strand Data Block: add_curves, foreach_set & Surface Binding for WebXR VRM (Blender 5.1)",
  date: "2026-07-05",
  kind: "tutorial",
  excerpt:
    "bpy.types.Curves (plural) is Blender 5.1's dedicated hair substrate — distinct from the bezier Curve type. Topology is declared first via add_curves(counts), then position and radius are written as flat numpy arrays using foreach_set on the POINT domain. The surface_uv_coordinate CURVE-domain attribute pins each strand root to a surface UV for sculpt-mode grooming and the GN Interpolate Hair Curves modifier. Exports guide strands as poly-line edge mesh via depsgraph evaluation for WebXR.",
  tags: [
    "blender",
    "python",
    "scripting",
    "curves",
    "hair",
    "vrm",
    "webxr",
    "glb",
    "foreach-set",
    "attributes",
    "geometry",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-bpy-curves-hair-data-block-strand-sculpt-webxr",
    time: "forty-five minutes",
    difficulty: "intermediate",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable writing bpy Python scripts in the Scripting workspace",
      "Understands foreach_set / foreach_get — see the Mesh Attributes tutorial",
      "Familiar with the concept of geometric attribute domains (POINT, CURVE)",
    ],
    steps: [
      {
        title: "Understand Curves vs Curve — two distinct data types",
        body: "bpy.data.curves.new(name, type='CURVES')  →  bpy.types.Curves  (hair)\nbpy.data.curves.new(name, type='CURVE')   →  bpy.types.Curve   (bezier/NURBS)\n\nBoth live in bpy.data.curves but are fundamentally different IDs.  Curves (plural) has:\n  .curves  — CurvesCurve collection, one element per strand\n  .points  — CurvesPoint collection, one element per control point\n  .attributes — same AttributeGroup as meshes; two domains: POINT and CURVE\n  .surface / .surface_uv_map — binding to a mesh object for grooming\n\nThe old Curve type has .splines, .bevel_depth, etc.  They do not share API.\n\nIn the Python console: type(bpy.data.curves['name']) tells you which you have.\nA Curves block has repr starting with <bpy_struct, Curves(…)> not Curve(…).",
      },
      {
        title: "Declare topology with add_curves(counts)",
        body: "curves_data = bpy.data.curves.new('HF_HairStrands', type='CURVES')\n\n# counts: one int per strand — the number of control points in that strand.\n# Strands can have different lengths.  Here all 64 strands have 7 points.\ncurves_data.add_curves([7] * 64)   # total POINT elements = 64 × 7 = 448\n\n# After add_curves():\n#   curves_data.attributes['position'] EXISTS and has 448 elements (zeroed).\n#   curves_data.curves has 64 elements.\n#   curves_data.points has 448 elements.\n\n# WRONG — doing this before add_curves() gives a zero-length position array:\n# curves_data.attributes['position'].data.foreach_set('vector', arr)  ← FAILS\n\n# add_curves() is the only way to set topology.  Topology cannot be changed\n# after creation without removing the whole block and starting again.",
      },
      {
        title: "Write positions via foreach_set on the POINT domain",
        body: "import numpy as np\n\ntotal_pts = 64 * 7\npos_flat  = np.zeros(total_pts * 3, dtype=np.float32)  # [x0,y0,z0, x1,y1,z1, …]\n\n# … fill pos_flat with strand geometry (see blueprint.py for full gravity loop) …\n\n# 'position' is auto-created — no .new() call.\n# foreach_set('vector', …) expects a flat sequence: len == total_pts × 3.\ncurves_data.attributes['position'].data.foreach_set('vector', pos_flat)\n\n# 'radius' is NOT auto-created.  Wrong: writing before creating.\nrad_attr = curves_data.attributes.new('radius', 'FLOAT', 'POINT')\nrad_flat = np.linspace(0.005, 0.0007, total_pts, dtype=np.float32)\nrad_attr.data.foreach_set('value', rad_flat)\n\n# Property name for foreach_set:\n#   FLOAT_VECTOR attribute → 'vector'\n#   FLOAT attribute        → 'value'\n#   FLOAT2 attribute       → 'vector'  (2-component, still named 'vector')\n#   INT attribute          → 'value'\n# Getting the property name wrong raises AttributeError on the data[0] proxy.",
      },
      {
        title: "Bind to a surface mesh and write surface UV coordinates",
        body: "# curves_data.surface is a pointer to a bpy.types.Object (mesh type).\n# Setting it tells Blender which mesh the strand roots are attached to.\ncurves_data.surface = surface_ob          # the mesh Object, not the mesh data\ncurves_data.surface_uv_map = 'UVMap'      # must match a UV layer name on surface_ob\n\n# surface_uv_coordinate: FLOAT2 on CURVE domain — one UV per strand.\n# The value is the UV of that strand's root on the surface mesh.\n# Blender's grooming tools (Pin to Surface) read this to snap roots.\nuv_flat = np.zeros(64 * 2, dtype=np.float32)  # [u0,v0, u1,v1, …]\n# … compute UVs from sphere normals …\nsuv_attr = curves_data.attributes.new('surface_uv_coordinate', 'FLOAT2', 'CURVE')\nsuv_attr.data.foreach_set('vector', uv_flat)\n\n# CURVE domain for surface_uv_coordinate means 2 floats per STRAND, not per POINT.\n# Confusing POINT with CURVE domain is the most common mistake — the attribute\n# creates fine but foreach_set silently writes the wrong elements.",
      },
      {
        title: "Link the object and verify in the viewport",
        body: "hair_ob = bpy.data.objects.new('HF_HairStrands', curves_data)\nbpy.context.collection.objects.link(hair_ob)\n\n# Select and make active for inspection\nbpy.ops.object.select_all(action='DESELECT')\nhair_ob.select_set(True)\nbpy.context.view_layer.objects.active = hair_ob\n\n# Inspect attribute list in the Python console:\n# for attr in hair_ob.data.attributes: print(attr.name, attr.domain, attr.data_type)\n# Expected output:\n#   position   POINT   FLOAT_VECTOR\n#   radius     POINT   FLOAT\n#   surface_uv_coordinate  CURVE  FLOAT2\n\n# In the viewport: Object Data Properties (green curve icon) → Geometry → Attributes\n# You should see all three listed with correct domain labels.",
      },
      {
        title: "Export as poly-line edge mesh via depsgraph evaluation",
        body: "# The Blender 5.1 GLTF exporter silently skips Curves objects.\n# Headless-safe conversion path: depsgraph evaluation → new_from_object().\n\ndg = bpy.context.evaluated_depsgraph_get()\nev = hair_ob.evaluated_get(dg)\n# new_from_object() on a Curves object returns a Mesh where:\n#   vertices = control points\n#   edges    = consecutive point pairs within each strand\n#   no faces — pure edge mesh (renders as LINE_STRIP in Three.js)\nstrand_mesh = bpy.data.meshes.new_from_object(\n    ev, preserve_all_data_layers=True, depsgraph=dg)\nexport_ob = bpy.data.objects.new('HF_Strands_Export', strand_mesh)\nbpy.context.collection.objects.link(export_ob)\n\nbpy.ops.object.select_all(action='DESELECT')\nexport_ob.select_set(True)\nbpy.ops.export_scene.gltf(\n    filepath='//output/hair_strands_webxr.glb',\n    use_selection=True, export_format='GLB',\n    export_apply=True, export_yup=True,\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n    export_image_format='WEBP',\n)\n# Clean up temp export object\nbpy.data.objects.remove(export_ob, do_unlink=True)\nbpy.data.meshes.remove(strand_mesh, do_unlink=True)",
      },
    ],
  },
  base
);
