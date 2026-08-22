import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        In Blender&rsquo;s field system every node evaluates in an{" "}
        <em>implicit domain context</em> set by whatever downstream node
        consumes it. Wire <code>FunctionNodeRandomValue</code> into{" "}
        <code>StoreNamedAttribute(domain=&lsquo;POINT&rsquo;)</code> and
        Random evaluates <em>per vertex</em> — a different random per vertex,
        not per face. The <strong>Interpolate Domain</strong> node (
        <code>GeometryNodeFieldOnDomain</code>) breaks this coupling: it forces
        the connected field to evaluate in a <em>specified</em> domain, then
        exposes the result so downstream nodes in a different domain receive an
        interpolated (averaged) version of those values. This tutorial builds
        two passes — per-face random hue and face-normal toon lighting — then
        blends them into a single <code>BYTE_COLOR</code> vertex attribute for
        flat-shaded WebXR export.
      </p>

      <h2>Domain evaluation without Interpolate Domain</h2>
      <p>
        Fields in GN have no fixed domain; they re-evaluate in whatever context
        they&rsquo;re consumed. This is powerful but creates the{" "}
        <em>domain ambiguity trap</em>: connecting a face-keyed field (e.g. a
        random seeded by face index) into a POINT-domain output causes it to
        re-key by vertex index — producing a completely different random pattern
        that coincidentally <em>looks</em> per-face on regular grids but falls
        apart on irregular meshes. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
          className={lk}
        >
          Capture Attribute
        </Link>{" "}
        node solves this by <em>writing</em> a field into stored attribute
        data. Interpolate Domain solves it by <em>re-evaluating</em> the field
        in a locked domain and then interpolating the result across the domain
        boundary — no storage needed, fully procedural.
      </p>

      <h2>Unweighted vs weighted vertex normals for toon shading</h2>
      <p>
        <code>InputNormal</code> consumed directly in POINT domain gives
        Blender&rsquo;s built-in angle-weighted vertex normal:{" "}
        <code>&Sigma;(face_normal &times; face_angle_at_vertex) / &Sigma;angle</code>.
        Routing it through{" "}
        <code>FieldOnDomain(domain=&lsquo;FACE&rsquo;)</code> instead gives an{" "}
        <strong>unweighted</strong> average:{" "}
        <code>&Sigma; face_normal / N</code>. For toon cel-shading the
        unweighted version avoids over-darkening near acute-angle faces (narrow
        triangles contribute small angles and so de-weight the face normal in
        Blender&rsquo;s formula). The unweighted average reads as a more
        intentionally&nbsp;&ldquo;painted&rdquo; gradient — compare this to the
        topology-walk technique in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-corners-of-vertex-offset-corner-in-face-topology-chamfer"
          className={lk}
        >
          GN Corners of Vertex — Topology Chamfer
        </Link>
        , which manually navigates the CORNER domain to read per-face data at
        adjacent faces.
      </p>

      <h2>Two-pass domain transfer + watercolour mosaic</h2>
      <p>
        The final vertex colour blends per-face hue (from Pass A) and per-face
        normal lighting (from Pass B). Because both use{" "}
        <code>FieldOnDomain(FACE)</code>, vertices shared between two faces of
        different hues receive the <em>average</em> of those hues — producing a
        watercolour bleed at shared edges that reads as intentional when the
        object is flat-shaded. The technique is closely related to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge"
          className={lk}
        >
          GN Store Named Attribute — Shader Data Bridge
        </Link>{" "}
        pattern: both write GN-computed data into named attributes that
        materials can read; this tutorial adds the domain-crossing step that
        the shader bridge tutorial omits.
      </p>
      <p>
        The vertex colour is stored as <code>BYTE_COLOR</code> (4 &times;
        uint8 per vertex) rather than <code>FLOAT_COLOR</code> (4 &times;
        float32). Both export as{" "}
        <code>COLOR_0</code> in GLB; <code>BYTE_COLOR</code> keeps the
        attribute at ¼ the memory footprint, which matters for WebXR mobile
        bandwidth. See{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr"
          className={lk}
        >
          Principled BSDF v2 — Full glTF 2.0 PBR Parameter Map
        </Link>{" "}
        for how the GLB accessor layout differs between colour attribute types.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Blender Foundation.{" "}
          <em>Geometry Nodes: Interpolate Domain</em>, Blender Manual 4.3.{" "}
          <a
            href="https://docs.blender.org/manual/en/4.3/modeling/geometry_nodes/utilities/field/interpolate_domain.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.blender.org
          </a>
          . Licence: CC-BY-SA 4.0. Related studio project: the entire GN
          tutorial series in this library.
        </li>
        <li>
          Nikolai Janakiev.{" "}
          <em>blender-scripting</em> (MIT Licence).{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/njanakiev/blender-scripting
          </a>
          . General Blender Python patterns referenced for modifier-apply and
          material-node wiring idioms. Sibling projects: njanakiev/openstreetmap-heatmap
          (MIT), njanakiev/fractals (MIT).
        </li>
      </ul>
    </>
  );
}

const base = {
  slug: "blender-tutorial-gn-interpolate-domain-face-normal-vertex-colour-toon",
  title: "GN Interpolate Domain — Face Normal to Vertex Colour: Smooth Toon Gradient on Flat-Shaded Faceted Mesh (Blender 5.1)",
  date: "2026-07-02",
  kind: "tutorial" as const,
  excerpt: "Use GeometryNodeFieldOnDomain to lock FunctionNodeRandomValue to face evaluation, transfer face normals unweighted to vertices, and bake a watercolour-mosaic toon gradient into BYTE_COLOR vertex colour for WebXR GLB export.",
  Body,
};

const entry = buildInstructable(
  {
    time: "two hours",
    difficulty: "intermediate",
    cost: "open-source",
    software: [
      {
        name: "Blender",
        version: "≥ 4.0",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "GeometryNodeFieldOnDomain (Interpolate Domain) available since 4.0. ShaderNodeCombineColor HSV mode since 3.3. BYTE_COLOR StoreNamedAttribute since 3.4. All tested in 5.1.",
      },
    ],
    steps: [
      {
        title: "Create the icosphere and apply flat shading",
        body: "import bpy\n\nbpy.ops.wm.read_factory_settings(use_empty=True)\nbpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0)\nobj = bpy.context.active_object\nobj.name = 'toon_gem_faceted'\n\n# Flat shading: every polygon uses its constant geometric normal.\n# WHY: the FieldOnDomain(FACE) pass reads geometric face normals,\n# not custom split normals.  Flat shading makes the faceted aesthetic\n# visible and lets the vertex colour gradient do all the shading work.\nfor poly in obj.data.polygons:\n    poly.use_smooth = False",
      },
      {
        title: "Build the GN group interface",
        body: "ng    = bpy.data.node_groups.new('HS_InterpolateDomainToon', 'GeometryNodeTree')\nni    = ng.interface\nnodes = ng.nodes\nlinks = ng.links\n\nni.new_socket('Geometry',   in_out='OUTPUT', socket_type='NodeSocketGeometry')\nni.new_socket('Geometry',   in_out='INPUT',  socket_type='NodeSocketGeometry')\ns_ld = ni.new_socket('Light Dir',  in_out='INPUT',  socket_type='NodeSocketVector')\ns_sc = ni.new_socket('Shadow Col', in_out='INPUT',  socket_type='NodeSocketColor')\ns_ld.default_value = (0.5, 0.3, 1.0)\ns_sc.default_value = (0.10, 0.05, 0.20, 1.0)  # purple shadow\n\ng_in  = nodes.new('NodeGroupInput');  g_in.location  = (-1800,   0)\ng_out = nodes.new('NodeGroupOutput'); g_out.location  = (  400,   0)",
      },
      {
        title: "Branch A — per-face random hue via FieldOnDomain(FACE)",
        body: "# WHY FieldOnDomain is essential:\n#   Without it, RandomValue wired into StoreNamedAttribute(POINT)\n#   re-evaluates per-VERTEX, giving per-vertex random — not per-face.\n#   FieldOnDomain(domain='FACE') locks evaluation so each face gets\n#   one stable float; StoreNamedAttribute(POINT) then averages adjacent\n#   faces per vertex — the inter-face watercolour bleed.\n\nn_rnd = nodes.new('FunctionNodeRandomValue')\nn_rnd.data_type              = 'FLOAT'\nn_rnd.inputs[0].default_value = 0.0  # Min\nn_rnd.inputs[1].default_value = 1.0  # Max\nn_rnd.location = (-1500, 350)\n\nn_fi_rnd = nodes.new('GeometryNodeFieldOnDomain')\nn_fi_rnd.domain    = 'FACE'   # force face-domain evaluation\nn_fi_rnd.data_type = 'FLOAT'  # must match connected field\nn_fi_rnd.location  = (-1250, 350)\nlinks.new(n_rnd.outputs[1], n_fi_rnd.inputs[0])\n\n# Map 0-1 float → full HSV spectrum; SAT/VAL constant so faces differ in hue only.\nn_hsv = nodes.new('ShaderNodeCombineColor')\nn_hsv.mode = 'HSV'\nn_hsv.inputs[1].default_value = 0.75  # Saturation\nn_hsv.inputs[2].default_value = 0.90  # Value/brightness\nn_hsv.location = (-1000, 350)\nlinks.new(n_fi_rnd.outputs[0], n_hsv.inputs[0])  # Hue",
      },
      {
        title: "Branch B — unweighted face-normal toon gradient via FieldOnDomain(FACE)",
        body: "# WHY two FieldOnDomain calls instead of one:\n#   Pass A and Pass B transfer DIFFERENT data types (FLOAT vs FLOAT_VECTOR)\n#   from the same source domain.  Each FieldOnDomain node handles one type.\n#   Their outputs are consumed together only in the final Mix node.\n\nn_nor = nodes.new('GeometryNodeInputNormal')\nn_nor.location = (-1500, -80)\n\nn_fi_nor = nodes.new('GeometryNodeFieldOnDomain')\nn_fi_nor.domain    = 'FACE'\nn_fi_nor.data_type = 'FLOAT_VECTOR'\nn_fi_nor.location  = (-1250, -80)\nlinks.new(n_nor.outputs['Normal'], n_fi_nor.inputs[0])\n\n# Re-normalise: averaging unit vectors can yield sub-unit results near\n# valence transitions (5-valent vs 6-valent vertices on an ico sphere).\nn_norm = nodes.new('ShaderNodeVectorMath')\nn_norm.operation = 'NORMALIZE'\nn_norm.location  = (-1000, -80)\nlinks.new(n_fi_nor.outputs[0], n_norm.inputs[0])\n\nn_dot = nodes.new('ShaderNodeVectorMath')\nn_dot.operation = 'DOT_PRODUCT'\nn_dot.location  = (-750, -80)\nlinks.new(n_norm.outputs['Vector'],  n_dot.inputs[0])\nlinks.new(g_in.outputs['Light Dir'], n_dot.inputs[1])\n\nn_map = nodes.new('ShaderNodeMapRange')\nn_map.inputs['From Min'].default_value = -1.0\nn_map.inputs['From Max'].default_value =  1.0\nn_map.inputs['To Min'].default_value   =  0.0\nn_map.inputs['To Max'].default_value   =  1.0\nn_map.location = (-500, -80)\nlinks.new(n_dot.outputs['Value'], n_map.inputs['Value'])",
      },
      {
        title: "Blend branches and store as BYTE_COLOR vertex attribute",
        body: "# Shadow side collapses to flat purple; lit side reveals the face hue.\n# ShaderNodeMix RGBA socket layout: inputs[0]=Factor, inputs[6]=A, inputs[7]=B.\nn_mix = nodes.new('ShaderNodeMix')\nn_mix.data_type  = 'RGBA'\nn_mix.blend_type = 'MIX'\nn_mix.location   = (-230, 130)\nlinks.new(n_map.outputs['Result'],    n_mix.inputs[0])   # Factor\nlinks.new(g_in.outputs['Shadow Col'], n_mix.inputs[6])   # A (shadow)\nlinks.new(n_hsv.outputs['Color'],     n_mix.inputs[7])   # B (hue)\n\n# BYTE_COLOR (4×uint8) exports as COLOR_0 in GLB — 4× smaller than FLOAT_COLOR.\nn_store = nodes.new('GeometryNodeStoreNamedAttribute')\nn_store.domain    = 'POINT'\nn_store.data_type = 'BYTE_COLOR'\nn_store.location  = (100, 0)\nn_store.inputs['Name'].default_value = 'toon_col'\nlinks.new(g_in.outputs['Geometry'],    n_store.inputs['Geometry'])\nlinks.new(n_mix.outputs['Result'],     n_store.inputs['Value'])\nlinks.new(n_store.outputs['Geometry'], g_out.inputs['Geometry'])",
      },
      {
        title: "Apply modifier, create vertex-colour material, export GLB",
        body: "from pathlib import Path\n\nmod = obj.modifiers.new('HS_InterpolateDomainToon', 'NODES')\nmod.node_group = ng\nbpy.ops.object.modifier_apply(modifier=mod.name)\n\n# Material: vertex colour node feeds Principled BSDF Base Color.\nmat  = bpy.data.materials.new('toon_gem_vcol')\nmat.use_nodes = True\nnt   = mat.node_tree\nnt.nodes.clear()\nvcol = nt.nodes.new('ShaderNodeVertexColor'); vcol.layer_name = 'toon_col'\nbsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')\nbsdf.inputs['Roughness'].default_value = 0.95\nout  = nt.nodes.new('ShaderNodeOutputMaterial')\nnt.links.new(vcol.outputs['Color'], bsdf.inputs['Base Color'])\nnt.links.new(bsdf.outputs['BSDF'],  out.inputs['Surface'])\nobj.data.materials.append(mat)\n\nHERE    = Path(bpy.data.filepath).parent if bpy.data.filepath else Path('.')\nGLB_OUT = HERE / 'toon_gem_faceted.glb'\nbpy.ops.export_scene.gltf(\n    filepath     = str(GLB_OUT),\n    export_format = 'GLB',\n    export_apply  = True,\n    export_colors = True,\n    export_draco_mesh_compression_enable = True,\n    export_draco_mesh_compression_level  = 6,\n)\nprint(f'GLB exported: {GLB_OUT}')",
      },
    ],
    troubleshooting: [
      {
        symptom: "Vertex colours appear uniform — no gradient between faces",
        cause:
          "FieldOnDomain domain is set to 'POINT' instead of 'FACE', so RandomValue re-evaluates per-vertex rather than per-face, and there is nothing to average across the domain boundary.",
        fix:
          "Select the GeometryNodeFieldOnDomain node in the GN editor and confirm its domain dropdown reads 'Face'. In Python: assert n_fi_rnd.domain == 'FACE'. Also confirm StoreNamedAttribute.domain == 'POINT' (not 'FACE') — if both are FACE, vertices get a sampled face value, not an average.",
      },
      {
        symptom: "Toon gradient looks identical to regular smooth shading",
        cause:
          "The mesh is smooth-shaded (Phong normals) rather than flat-shaded. In smooth-shaded mode the geometric face normals that FieldOnDomain reads are angle-averaged per vertex by Blender before GN even sees them — Blender's smoothing and FieldOnDomain produce identical results.",
        fix:
          "Set all polygons to flat shading: for poly in obj.data.polygons: poly.use_smooth = False. In the viewport: select object → Object Data Properties → Normals → Clear Custom Split Normals, then right-click → Shade Flat.",
      },
      {
        symptom: "GLB has no COLOR_0 attribute — vertex colours missing in Three.js",
        cause:
          "export_colors=False (default) or the apply step was skipped so the modifier is still live on the object and no vertex colour data exists in the base mesh.",
        fix:
          "Pass export_colors=True to bpy.ops.export_scene.gltf(). Also confirm export_apply=True. Validate with gltf-validator: mesh.primitives[0].attributes should include COLOR_0.",
      },
      {
        symptom: "TypeError: Cannot set data_type on GeometryNodeFieldOnDomain",
        cause:
          "Blender version earlier than 4.0. Interpolate Domain was added in Blender 4.0 alongside the full field system refactor.",
        fix:
          "Check Help → About Blender. Upgrade to Blender 4.0 or later (5.1 recommended). There is no workaround in 3.x — the node does not exist.",
      },
    ],
  },
  base,
);

export { entry };
