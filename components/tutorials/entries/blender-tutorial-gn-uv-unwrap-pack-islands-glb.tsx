import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnUvUnwrapPackIslandsBody() {
  return (
    <>
      <p>
        Every GLB you ship to Three.js or a WebXR session needs UV coordinates
        to sample textures. The standard workflow — unwrap manually, then apply
        a Geometry Nodes modifier — collapses the moment the modifier changes
        vertex count or face topology: the UV map is orphaned and you must
        re-unwrap by hand. <strong>GeometryNodeUVUnwrap</strong> and{" "}
        <strong>GeometryNodePackUVIslands</strong> (both added in Blender 4.1,
        stable in 5.1) solve this by generating UV <em>inside</em> the modifier
        stack, after subdivision and displacement. The result is stored as the
        Named Attribute <code>&quot;UVMap&quot;</code> in the{" "}
        <code>CORNER</code> domain — and glTF-Blender-IO automatically maps that
        to the mesh primitive&apos;s <code>TEXCOORD_0</code> accessor, the slot
        every WebXR runtime reads.
      </p>

      <h2>Field nodes with no Geometry socket</h2>
      <p>
        The most confusing thing about UV Unwrap and Pack UV Islands is that
        neither has a Geometry socket. Both are <em>field nodes</em>: they
        evaluate in the mesh context provided by whichever geometry-socket node
        consumes their output downstream. That consuming node is{" "}
        <strong>Store Named Attribute</strong>, which takes both a{" "}
        <code>Geometry</code> input (the mesh) and a <code>Value</code> input
        (the UV field). The mesh topology needed for unwrapping — which edges
        border which faces — is read from the Geometry socket on Store Named
        Attribute, not from a socket on UV Unwrap itself. Wire your geometry
        spine straight from SetShadeSmooth into StoreNamedAttribute, and wire
        the UV field chain (UVUnwrap → PackUVIslands → StoreNamedAttribute
        Value) separately. The two wires meet at the Store node.
      </p>
      <p>
        This architecture mirrors how{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-sample-nearest-surface-mesh-conform"
          className={lk}
        >
          Sample Nearest Surface
        </Link>{" "}
        works — another field node that reads topology from its consumer rather
        than from an explicit Geometry socket. Once the pattern clicks, reading
        any field-node documentation becomes much faster.
      </p>

      <h2>Auto-seam from edge angles</h2>
      <p>
        <strong>GeometryNodeEdgeAngle</strong> is an edge-domain field node that
        returns the dihedral angle between each edge&apos;s two adjacent faces.
        An unsigned angle of 0 means the faces are coplanar; π (180°) means
        they are back-to-back. Connecting the{" "}
        <code>Unsigned Angle</code> output through a{" "}
        <code>GREATER_THAN</code> math node (with the threshold in radians from
        a Radians-conversion node) produces a BOOLEAN field: <code>True</code>{" "}
        where the dihedral exceeds the threshold, <code>False</code> elsewhere.
        That BOOLEAN wires directly into UV Unwrap&apos;s <code>Seam</code>{" "}
        input.
      </p>
      <p>
        For the noise-displaced cube in this tutorial,{" "}
        <code>SEAM_ANGLE_DEG = 42</code> reliably produces convex face islands
        with low distortion. Below 30° the threshold is too tight — hundreds of
        two-face islands appear, wasting UV space. Above 65° large concave
        regions wrap into one island and the UV Unwrap applies heavy angular
        compression to fit them flat. The{" "}
        <em>Seam Angle Degrees</em> socket in the GN modifier lets you adjust
        this live — the UV editor updates immediately as Pack UV Islands
        reruns.
      </p>

      <h2>ANGLE_BASED vs MINIMUM_STRETCH</h2>
      <p>
        UV Unwrap&apos;s <code>method</code> property offers two algorithms:
      </p>
      <ul>
        <li>
          <strong>ANGLE_BASED</strong> (conformal) — minimises angular
          distortion. Circles remain circles in UV space; right angles remain
          right angles. Recommended for organic shapes, curved surfaces, and
          any mesh where texture pattern regularity matters.
        </li>
        <li>
          <strong>MINIMUM_STRETCH</strong> — minimises area distortion. Every
          face covers its proportional share of UV space regardless of shape.
          Better for flat architectural panels where texture pixel density must
          match world-space area.
        </li>
      </ul>
      <p>
        For the crystal geode — an organic, craggy surface — ANGLE_BASED is
        correct. The gradient texture driving the indigo-to-ice-blue colour wash
        needs to flow smoothly across each crystal face without the pinching
        that area-preserving methods introduce at high-curvature edges.
      </p>

      <h2>Pack UV Islands: why it matters for WebXR</h2>
      <p>
        After UV Unwrap, each seam-bounded island occupies its own region in UV
        space, but they may overlap or scatter across coordinates outside [0,1].
        <strong>Pack UV Islands</strong> rearranges all islands to fit inside
        the [0,1] square with minimal wasted space, using a bin-packing
        algorithm. With <code>Rotate = True</code> the packer can rotate islands
        up to 90° for tighter fits — worth enabling for anything going to WebXR,
        since texture memory is a hard constraint in headset environments.
      </p>
      <p>
        Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-uv-unwrap-low-poly-stylised"
          className={lk}
        >
          manual UV unwrap
        </Link>{" "}
        workflow, where you run the equivalent pack in the UV editor. The GN
        node version packs inside the modifier stack — you never touch the UV
        editor for assets built this way, and the pack re-runs automatically
        when geometry changes.
      </p>

      <h2>TEXCOORD_0: the CORNER FLOAT2 contract</h2>
      <p>
        Store Named Attribute must use <code>domain = &apos;CORNER&apos;</code>{" "}
        and <code>data_type = &apos;FLOAT2&apos;</code>. CORNER domain means one
        value per face corner (loop index), which is what UV coordinates require:
        a vertex shared by four faces can have four distinct UV positions —
        one per corner — enabling UV seams. If you use POINT domain instead,
        vertices are forced to share a single UV position across all adjacent
        faces, seams collapse, and the gradient tears at every fold.
      </p>
      <p>
        The name <code>&quot;UVMap&quot;</code> is the convention glTF-Blender-IO
        looks for when writing <code>TEXCOORD_0</code>. A second UV layer named{" "}
        <code>&quot;UVMap.001&quot;</code> would appear as{" "}
        <code>TEXCOORD_1</code>. Custom names (e.g. <code>&quot;_LIGHTMAP&quot;</code>)
        export as custom accessors, not as standard texture coordinate slots.
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          baking tutorial
        </Link>{" "}
        relies on this same naming convention to identify which UV map the baked
        normal map targets.
      </p>

      <h2>export_apply is not optional</h2>
      <p>
        <code>export_apply=True</code> on the glTF exporter applies all
        modifiers before writing the mesh. Without it the GN modifier is skipped
        and the GLB contains no UV attribute — the ShaderNodeUVMap in the
        material reads empty coordinates and the mesh renders grey or white. The{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
          studio GLB export pipeline
        </Link>{" "}
        always sets this flag. Pair it with{" "}
        <code>export_attributes=True</code> specifically for Named Attributes —
        glTF-Blender-IO v4.x exports standard mesh UV layers automatically but
        requires the explicit flag for GN-generated Named Attributes.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>UV Editor shows overlapping islands</strong> — Pack UV Islands
          is not connected or its UV input is unwired. Confirm the pack
          node&apos;s UV input comes from UVUnwrap&apos;s UV output, and its
          output connects to StoreNamedAttribute&apos;s Value socket.
        </li>
        <li>
          <strong>GLB has no TEXCOORD_0 in gltf.report</strong> — either
          export_apply=False, export_attributes=False, or the Named Attribute
          domain is POINT instead of CORNER. Check all three.
        </li>
        <li>
          <strong>Material reads solid indigo across the whole mesh</strong> —
          UV Unwrap&apos;s Seam input is not wired, so all corners map to UV
          (0,0), which is position 0.0 on the colour ramp (deep indigo). Confirm
          the GREATER_THAN → UVUnwrap.Seam link exists.
        </li>
        <li>
          <strong>All islands are a single giant island</strong> — seam angle
          threshold is too high (above 160°). Reduce Seam Angle Degrees until
          multiple islands appear in the UV Editor.
        </li>
        <li>
          <strong>Gradient stretches and tears across individual faces</strong>{" "}
          — domain is POINT, not CORNER on Store Named Attribute. Change it to
          CORNER.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-uv-unwrap-pack-islands-glb",
  title:
    "GN UV Unwrap + Pack Islands — Procedural UV for WebXR GLB Export (Blender 5.1)",
  date: "2026-06-06",
  kind: "tutorial",
  excerpt:
    "GeometryNodeUVUnwrap and GeometryNodePackUVIslands generate UV coordinates inside the modifier stack after displacement and subdivision. Store the result as Named Attribute 'UVMap' in the CORNER FLOAT2 domain and glTF-Blender-IO exports it as TEXCOORD_0 — no manual re-unwrap, no orphaned UV maps.",
  Body: GnUvUnwrapPackIslandsBody,
};

export const entry = buildInstructable(
  {
    time: "one afternoon",
    difficulty: "intermediate",
    cost: "free",
    goal: "Build a noise-displaced crystal geode with fully procedural UV coordinates that export as TEXCOORD_0 in a GLB ready for Three.js and WebXR texture sampling.",
    supplies: {
      software: [
        {
          name: "Blender",
          version: "5.1",
          url: "https://www.blender.org/download/",
          cost: "free",
          platforms: ["windows", "macos", "linux"],
        },
      ],
      materials: [],
      tools: [],
    },
    steps: [
      {
        title: "Run blueprint.py",
        body: "Open Blender 5.1, switch to the Scripting workspace, load blueprint.py, and run it. The script resets the scene, creates the subdivided cube, wires the GN modifier, saves crystal_geode.blend, and exports crystal_geode.glb.",
      },
      {
        title: "Verify UV islands in the UV Editor",
        body: "Switch to the UV Editing workspace. The UV Editor should show multiple face islands packed into the 0–1 square. Press A to select all UVs. If only a single dot or no islands appear, the Store Named Attribute is set to POINT domain instead of CORNER — fix in the GN modifier graph.",
      },
      {
        title: "Test the Seam Angle Degrees slider",
        body: "In the GN modifier properties, drag the Seam Angle Degrees slider from 15° to 75° while watching the UV Editor. At low values many small islands appear; at high values few large distorted ones. Set to 42° for the balanced result.",
      },
      {
        title: "Inspect the Spreadsheet for CORNER FLOAT2",
        body: "Open the Spreadsheet editor, set domain to FACE CORNER. Ctrl+Shift+click the StoreNamedAttribute node to pin the Spreadsheet. You should see a UVMap column with two-component [U, V] values, varying per corner. If you see three-component XYZ, data_type is FLOAT_VECTOR — change it to FLOAT2.",
      },
      {
        title: "Verify TEXCOORD_0 in the GLB",
        body: "Drag crystal_geode.glb into gltf.report (online) or the Khronos glTF-Sample-Viewer. In the mesh primitive attributes section confirm TEXCOORD_0 is listed. If absent, re-export with export_apply=True and export_attributes=True.",
      },
      {
        title: "Run record.py to render the viewport animation",
        body: "Load record.py in the Scripting workspace and run it. It keyframes a 360° rotation over 120 frames and renders via EEVEE to public/library/videos/geometry-nodes/gn-uv-unwrap-pack-islands-glb/viewport.mp4. Expect 3–5 minutes on a mid-range GPU.",
      },
    ],
    troubleshooting: [
      {
        symptom: "GLB has no TEXCOORD_0 — gltf.report shows no UV accessor",
        cause:
          "Either export_apply=False (GN modifier not applied) or export_attributes=False (Named Attributes skipped). Check both flags in the gltf export operator call.",
        fix: "Re-export with export_apply=True and export_attributes=True. If using the File > Export menu, both options are in the right-side panel under Data.",
      },
      {
        symptom: "UV Editor is blank — no islands visible after running blueprint.py",
        cause:
          "The Store Named Attribute uses POINT domain instead of CORNER, or the Named Attribute name is not exactly 'UVMap'. The UV Editor reads standard UV layers, not arbitrary POINT attributes.",
        fix: "In the GN modifier graph, select the StoreNamedAttribute node. Confirm domain='CORNER', data_type='FLOAT2', and name='UVMap' (capital U, capital M, no space). A typo in the name creates a custom attribute that the UV Editor does not display.",
      },
      {
        symptom: "Material shows solid indigo across all faces",
        cause:
          "The Seam BOOLEAN is not wired into UVUnwrap, or the GREATER_THAN output is all-False (threshold above π). UV Unwrap treats all edges as non-seam, collapses everything to a single tiny island at UV (0,0), and the colour ramp returns position 0.0 = deep indigo.",
        fix: "Check the GREATER_THAN → UVUnwrap.Seam link. Use Ctrl+Shift+click (Node Wrangler) on the GREATER_THAN node to preview the boolean field in the Spreadsheet — you should see True values on high-angle edges.",
      },
    ],
  },
  base,
);
