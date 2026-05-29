import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnIndexFaceColourMosaicBody() {
  return (
    <>
      <p>
        <code>GeometryNodeInputIndex</code> is one of the few GN nodes with no
        inputs at all — it is a pure field expression that expands to 0, 1,
        2&hellip;&nbsp;N-1 at whatever domain is currently being evaluated. When
        a downstream <code>StoreNamedAttribute</code> node runs at FACE domain,
        Index expands once per face. Pipe that integer through{" "}
        <code>Math(MODULO)</code> to extract a column bucket and{" "}
        <code>Math(DIVIDE)</code> to normalise it to a hue float, then feed the
        result into <code>ShaderNodeCombineColor(HSV)</code> and you have one
        distinct colour per face — with zero UV, zero texture, zero bake step.
      </p>

      <p>
        The critical difference from the{" "}
        <Link
          href="/tutorials/blender-tutorial-vertex-colour-attributes"
          className={lk}
        >
          vertex colour attributes tutorial
        </Link>{" "}
        is the storage domain. That tutorial writes to VERTEX domain, which
        means EEVEE interpolates the attribute smoothly across triangle edges —
        useful for gradients. This tutorial writes to FACE domain.
        Face-domain attributes are constant within each quad: no interpolation,
        no colour bleed, hard boundaries. The result looks exactly like pixel
        art projected onto geometry, which is precisely what a mosaic or
        hard-surface panel palette requires.
      </p>

      <p>
        The field laziness principle from the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
          className={lk}
        >
          Capture Attribute tutorial
        </Link>{" "}
        explains why the Index node is safe here. Because
        StoreNamedAttribute forces evaluation at FACE domain,{" "}
        <code>InputIndex</code> expands correctly as a face index (not a vertex
        index or instance index) without any explicit domain override or
        CaptureAttribute wrapper. The domain context propagates from the
        consumer — StoreNamedAttribute — back through the field graph to the
        producer — InputIndex.
      </p>

      <p>
        The Emission material follows the same pattern established in the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
          className={lk}
        >
          EEVEE toon cel-shader tutorial
        </Link>
        : light-independent colour so every face reads at full brightness in
        any WebXR environment regardless of the scene's ambient level. The{" "}
        <code>ShaderNodeAttribute(attribute_type=&apos;GEOMETRY&apos;)</code>{" "}
        lookup is the same technique used to read the shadow mask in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-raycast-shadow-mask"
          className={lk}
        >
          GN Raycast shadow mask tutorial
        </Link>
        .
      </p>

      <p>
        Outside sources:{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/input/scene/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          Blender Manual — Index Node
        </a>{" "}
        (CC-BY-SA&nbsp;4.0, Blender Documentation Team) — authoritative
        reference for domain evaluation order and the distinction between
        Index at POINT vs FACE vs INSTANCE domain.{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Blender-IO"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          KhronosGroup/glTF-Blender-IO
        </a>{" "}
        (Apache-2.0, Khronos Group) — source for the custom vertex attribute
        naming rule (<code>_TILE_COLOUR</code>) and the domain-to-accessor
        expansion that duplicates face-constant values to per-vertex entries in
        the binary glTF buffer.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-index-face-colour-mosaic",
  title: "GN Index + Modulo — Per-Face Colour for Procedural Mosaic Tiles",
  date: "2026-05-29",
  summary:
    "Use GeometryNodeInputIndex at FACE domain to assign one rainbow hue per quad. Math(MODULO) extracts the column bucket; ShaderNodeCombineColor(HSV) converts it to RGB; StoreNamedAttribute writes it as a FACE-domain tile_colour attribute. No UV, no texture, no bake — hard-edge colour per face, exported as a custom glTF vertex attribute.",
  tags: [
    "blender",
    "geometry-nodes",
    "shading",
    "attributes",
    "webxr",
    "cel-shading",
  ],
  body: GnIndexFaceColourMosaicBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Comfortable building GN trees in Python via bpy. Understand GroupInput/GroupOutput and links.new().",
      "Know what 'domain' means in GN: POINT, FACE, INSTANCE. Covered in the Capture Attribute tutorial.",
      "Familiar with ShaderNodeMath and its operation enum. Used in every GN tutorial in this library.",
      "Blender 5.1 installed. Able to run scripts headlessly with --background --python.",
    ],
    overview:
      "Build a 16×16 quad grid whose GN modifier reads the flat face index (0-255), maps it to a column bucket via Modulo(16), normalises to a hue float via Divide(16), converts to RGB via ShaderNodeCombineColor(HSV), and stores the result as tile_colour at FACE domain. An Emission material reads tile_colour via ShaderNodeAttribute for a zero-cost rainbow mosaic. Export as a Draco-6 GLB — tile_colour travels as the _TILE_COLOUR custom glTF vertex attribute.",
    steps: [
      {
        title:
          "What domain does InputIndex evaluate at — and why it matters here",
        body: "GeometryNodeInputIndex is a field node with no inputs. It outputs a single integer: the current element's index within its domain.\n\nThe domain is not determined by the Index node itself — it is determined by the closest CONSUMER downstream that forces evaluation. In this tree, StoreNamedAttribute runs at FACE domain, so Index evaluates once per face:\n  face 0  → 0\n  face 1  → 1\n  face 2  → 2\n  …\n  face 255 → 255\n\nIf you instead connected Index to a SetPosition node (which operates at POINT domain), it would evaluate once per vertex (289 vertices for a 16×16 quad grid). The same node, different index sequence — because the domain context flows from consumer to producer through the field graph.\n\nThis is why no CaptureAttribute wrapper is needed here: StoreNamedAttribute at FACE domain is already the domain anchor. CaptureAttribute becomes necessary when you need to lock the domain BEFORE a topology change (like a Delete or Subdivide) might reorder element indices downstream.\n\nFace index order for a grid built row by row (as in blueprint.py):\n  col = face_index % GRID_COLS\n  row = face_index // GRID_COLS\nFace 0 is bottom-left, face GRID_COLS-1 is bottom-right, face GRID_COLS is the first face of the second row from the bottom.",
      },
      {
        title: "Build the 16×16 quad grid mesh with bmesh",
        body: "import bpy\nimport bmesh\nfrom mathutils import Vector\n\nGRID_COLS = 16\nGRID_ROWS = 16\nFACE_SIZE = 0.25   # metres per quad edge\nhalf_x = GRID_COLS * FACE_SIZE / 2\nhalf_y = GRID_ROWS * FACE_SIZE / 2\n\nbm = bmesh.new()\nverts = []\nfor r in range(GRID_ROWS + 1):\n    for c in range(GRID_COLS + 1):\n        verts.append(bm.verts.new(\n            Vector((-half_x + c * FACE_SIZE, -half_y + r * FACE_SIZE, 0.0))\n        ))\nbm.verts.ensure_lookup_table()\n\nfor r in range(GRID_ROWS):\n    for c in range(GRID_COLS):\n        v0 = verts[r * (GRID_COLS+1) + c]\n        v1 = verts[r * (GRID_COLS+1) + c + 1]\n        v2 = verts[(r+1)*(GRID_COLS+1) + c + 1]\n        v3 = verts[(r+1)*(GRID_COLS+1) + c]\n        bm.faces.new([v0, v1, v2, v3])\n\nbase_mesh = bpy.data.meshes.new('mosaic_tile_base')\nbm.to_mesh(base_mesh)\nbm.free()\n\ngrid_obj = bpy.data.objects.new('mosaic_tile', base_mesh)\nbpy.context.scene.collection.objects.link(grid_obj)\n\nWhy GRID_COLS×GRID_ROWS and not bpy.ops.mesh.primitive_grid_add:\n  bpy.ops.mesh.primitive_grid_add generates a grid with VERTICES not FACES as\n  the count parameter. A 16×16 FACE grid needs 17×17=289 vertices. Using bmesh\n  directly avoids the vertex-count confusion and makes face ordering explicit.\n  The outer loop is rows (r), the inner loop is columns (c) — this is important\n  because it determines the face index sequence that InputIndex reads.",
      },
      {
        title:
          "Wire the Index → Modulo → Divide → CombineColor field branch",
        body: "gn = bpy.data.node_groups.new('MosaicTileGN', 'GeometryNodeTree')\ngn.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')\ngn.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')\n\nHUE_REPEAT = 16.0   # columns per rainbow cycle\nSAT        = 0.65\nVAL        = 0.88\n\n# InputIndex — field node, no inputs. Outputs INT.\nn_idx            = gn.nodes.new('GeometryNodeInputIndex')\nn_idx.location   = (-750, -200)\n\n# Math(MODULO) — col_bucket = face_index % HUE_REPEAT\n# MODULO on floats in Blender: same as Python's % for positive values.\n# INT input from Index auto-casts to FLOAT. The output is FLOAT 0-15.\nn_mod            = gn.nodes.new('ShaderNodeMath')\nn_mod.operation  = 'MODULO'\nn_mod.location   = (-550, -200)\nn_mod.inputs[1].default_value = HUE_REPEAT\n\n# Math(DIVIDE) — hue = col_bucket / HUE_REPEAT\n# Maps 0-15 → 0.0-0.9375. Never reaches 1.0, so the last hue is near-red\n# (not red itself). This prevents a jarring hue jump between face 15 and\n# face 16 (face 0 of the next row).\nn_div            = gn.nodes.new('ShaderNodeMath')\nn_div.operation  = 'DIVIDE'\nn_div.location   = (-350, -200)\nn_div.inputs[1].default_value = HUE_REPEAT\n\n# ShaderNodeCombineColor (mode='HSV') — converts (H, S, V) → RGB Color.\n# This node is available in Geometry Nodes since Blender 3.3 (it replaced\n# the separate ShaderNodeCombineHSV / ShaderNodeCombineRGB nodes).\n# inputs[0]=H, inputs[1]=S, inputs[2]=V  outputs[0]=Color\nn_hsv            = gn.nodes.new('ShaderNodeCombineColor')\nn_hsv.mode       = 'HSV'\nn_hsv.location   = (-150, -200)\nn_hsv.inputs[1].default_value = SAT\nn_hsv.inputs[2].default_value = VAL\n\n# Link the field branch.\nlk = gn.links.new\nlk(n_idx.outputs[0],  n_mod.inputs[0])   # Index (INT) → Modulo\nlk(n_mod.outputs[0],  n_div.inputs[0])   # column bucket → Divide\nlk(n_div.outputs[0],  n_hsv.inputs[0])   # normalised hue → H\n# n_hsv.outputs[0] (Color) connects to StoreNamedAttribute in the next step.",
      },
      {
        title:
          "Wire the geometry pipe: SetShadeSmooth → StoreNamedAttribute",
        body: "gi = gn.nodes.new('NodeGroupInput');  gi.location = (-600, 0)\ngo = gn.nodes.new('NodeGroupOutput'); go.location  = (500,  0)\n\n# SetShadeSmooth at FACE domain with smooth=False forces hard facet edges.\n# This makes the colour boundaries physically visible in the 3D viewport —\n# without it, EEVEE would smooth-shade the grid and the tile boundaries would\n# blend together visually even though the colours are per-face.\nn_flat               = gn.nodes.new('GeometryNodeSetShadeSmooth')\nn_flat.domain        = 'FACE'\nn_flat.location      = (-400, 0)\nn_flat.inputs[2].default_value = False   # shade_smooth = False\n\n# StoreNamedAttribute — the domain anchor for this tree.\n# data_type='FLOAT_COLOR': 4-channel float (R, G, B, A) stored at FACE domain.\n# 'tile_colour' exports as _TILE_COLOUR in the glTF primitive's attribute dict.\n# During export_apply, the exporter expands face-constant values to per-vertex\n# entries so the accessor element count equals the vertex count, not the face\n# count. In Three.js, all 3-4 vertices of a quad will carry the same RGBA.\nn_store              = gn.nodes.new('GeometryNodeStoreNamedAttribute')\nn_store.data_type    = 'FLOAT_COLOR'\nn_store.domain       = 'FACE'\nn_store.location     = (100, 0)\nn_store.inputs[2].default_value = 'tile_colour'   # Name socket (string)\n\n# Connect CombineColor.Color → StoreNamedAttribute.Value\nlk(n_hsv.outputs[0],    n_store.inputs[3])   # Color → Value\n\n# Geometry pipe\nlk(gi.outputs[0],        n_flat.inputs[0])\nlk(n_flat.outputs[0],    n_store.inputs[0])\nlk(n_store.outputs[0],   go.inputs[0])\n\nmod            = grid_obj.modifiers.new('MosaicTile', 'NODES')\nmod.node_group = gn\n\nVerification with the Spreadsheet editor:\n  Select mosaic_tile in the 3D Viewport, open the Spreadsheet editor,\n  set the domain dropdown to FACE. You should see a 'tile_colour' column\n  with 256 rows of RGBA values cycling through the rainbow. Rows 0-15 will\n  have the same sequence of colours as rows 16-31, 32-47, etc. — one full\n  rainbow per row.",
      },
      {
        title:
          "Build the Emission material with ShaderNodeAttribute at GEOMETRY",
        body: "mat = bpy.data.materials.new('MosaicTileMat')\nmat.use_nodes = True\nnt  = mat.node_tree\nnt.nodes.clear()\n\n# ShaderNodeAttribute reads GN-stored named attributes from the geometry.\n# attribute_type='GEOMETRY' is the correct type for attributes written by\n# StoreNamedAttribute. The alternatives:\n#   'OBJECT'    — reads a custom object property (bpy.data.objects['x']['prop'])\n#   'INSTANCER' — reads from the parent instancer, not the mesh data\n# Neither applies here; GEOMETRY is always correct for GN attributes.\nn_attr                = nt.nodes.new('ShaderNodeAttribute')\nn_attr.attribute_type = 'GEOMETRY'\nn_attr.attribute_name = 'tile_colour'\nn_attr.location       = (-400, 0)\n\n# Use n_attr.outputs['Color'] for RGBA data — this is the raw stored colour.\n# n_attr.outputs['Fac'] carries the Alpha channel as a scalar — useful for\n# greyscale masks (like shadow_mask in the Raycast tutorial) but not needed\n# here where we want full RGBA colour.\nn_emit                = nt.nodes.new('ShaderNodeEmission')\nn_emit.inputs[1].default_value = 1.8   # strength — bright for WebXR without HDR clip\nn_emit.location       = (-150, 0)\n\nn_out                 = nt.nodes.new('ShaderNodeOutputMaterial')\nn_out.location        = (100, 0)\n\nml = nt.links.new\nml(n_attr.outputs['Color'],    n_emit.inputs['Color'])\nml(n_emit.outputs['Emission'], n_out.inputs['Surface'])\n\ngrid_obj.data.materials.append(mat)\n\nWhy Emission instead of Principled BSDF:\n  Principled BSDF in EEVEE Next modulates the base colour by light intensity\n  and angle. In a WebXR scene with no lights, every face would render black.\n  Emission colour is fully light-independent — the tile_colour value appears\n  exactly as stored. This matches the aesthetic of the studio's cel-shading\n  pipeline: colour is a design decision, not a lighting outcome.",
      },
      {
        title: "Export GLB — how FACE domain attributes travel through glTF",
        body: "bpy.ops.export_scene.gltf(\n    filepath                              = str(GLB_OUT),\n    export_format                         = 'GLB',\n    export_apply                          = True,    # evaluates GN modifier stack\n    export_draco_mesh_compression_enable  = True,\n    export_draco_mesh_compression_level   = 6,\n    export_image_format                   = 'WEBP',\n    export_yup                            = True,\n    export_extras                         = True,    # custom attributes included\n)\n\nThe glTF format has no native FACE-domain attribute concept. Every accessor in\na glTF primitive is indexed by vertex. The KhronosGroup/glTF-Blender-IO exporter\nhandles this by duplicating face-constant values to each vertex that belongs to\na face:\n  face 0 → 4 vertices → all 4 carry tile_colour[0]\n  face 1 → 4 vertices → all 4 carry tile_colour[1]\n  …\n\nThe result is that the _TILE_COLOUR accessor has as many entries as there are\nvertices in the evaluated mesh (289 for a 16×16 quad grid), but the values\nfollow a step pattern with no linear ramp.\n\nIn Three.js:\n  const mesh = gltf.scene.getObjectByName('mosaic_tile');\n  const tc   = mesh.geometry.attributes._TILE_COLOUR;\n  // tc.array: Float32Array, 4 floats per vertex\n  // Reading tc at face centre (any of the 4 verts) returns the tile hue.\n\nWith a custom ShaderMaterial you can use _TILE_COLOUR as the diffuse colour\ndirectly — no texture sample needed, O(1) per fragment.\n\nNote on Draco compression and custom attributes:\n  Draco level 6 compresses positions and normals efficiently. Custom vertex\n  attributes (those starting with underscore) are also quantised and compressed\n  by Draco. The hue precision is 8-bit by default — more than sufficient for a\n  16-step palette where adjacent hue values differ by ~6.25% (0.0625).",
      },
    ],
    finalResult:
      "A .blend containing a 16×16 quad grid with a GN modifier (MosaicTileGN) that assigns one distinct rainbow hue per face column via Index → Modulo → Divide → CombineColor(HSV) → StoreNamedAttribute(FACE). An Emission material reads tile_colour via ShaderNodeAttribute for a hard-edge mosaic pattern with no UV or texture. A Draco-6 GLB exports the grid with tile_colour as the _TILE_COLOUR custom glTF vertex attribute, 4 floats per vertex, face-constant values duplicated across each quad's vertices.",
    variations: [
      "Row-based hue instead of column-based: replace Math(MODULO) inputs[0] with Math(FLOOR, Math(DIVIDE, Index, GRID_COLS)). This gives row = floor(face_index / 16), so each full row of 16 faces shares a single hue. Divide by GRID_ROWS to normalise. The grid becomes horizontal rainbow bands instead of vertical stripes.",
      "Diagonal tile pattern: hue = ((col + row) % HUE_REPEAT) / HUE_REPEAT. In GN, compute col=Modulo(Index, COLS), row=Floor(Divide(Index, COLS)), add them, then apply Modulo and Divide. The diagonal offset gives a chevron-like stripe running at 45 degrees across the grid.",
      "Reduce HUE_REPEAT from 16 to 4 for a bold 4-colour quad pattern. The grid becomes 4 repeating colour blocks rather than a smooth rainbow. Increase it to 256 to get one unique hue per face (a dense spectrum). The Modulo node is the only change needed.",
      "Combine with the GN Raycast shadow mask: after StoreNamedAttribute writes tile_colour, add a second StoreNamedAttribute that writes the Raycast Is Hit boolean as shadow_mask at POINT domain. The Emission material can then mix tile_colour with a shadow tint using a ShaderNodeMix driven by ShaderNodeAttribute(shadow_mask). Two GN techniques composited in one material.",
    ],
    troubleshooting: [
      {
        symptom: "All faces are the same colour (solid grey or solid red)",
        cause:
          "StoreNamedAttribute is not connected to GroupOutput — the modifier runs but the output socket shows the unmodified geometry from GroupInput, bypassing the stored attribute.",
        fix:
          "Confirm links.new(n_store.outputs[0], go.inputs[0]). In the Spreadsheet at FACE domain, tile_colour should show 256 distinct RGBA values. If the column is missing entirely, data_type may be wrong — ensure n_store.data_type = 'FLOAT_COLOR'.",
      },
      {
        symptom: "tile_colour shows correct values in Spreadsheet but material is black",
        cause:
          "n_attr.attribute_type is not 'GEOMETRY'. With 'OBJECT' or 'INSTANCER', the lookup fails silently and the node outputs black.",
        fix:
          "Set n_attr.attribute_type = 'GEOMETRY' and n_attr.attribute_name = 'tile_colour' exactly (case-sensitive). In Material Preview mode the grid should immediately show the rainbow. If it remains black, check that grid_obj.data.materials contains MosaicTileMat.",
      },
      {
        symptom: "_TILE_COLOUR is missing from the exported GLB",
        cause:
          "export_apply=False (default). The base mesh has no tile_colour attribute — it is created entirely by the GN modifier evaluation.",
        fix:
          "Set export_apply=True. Use gltf-validator or Three.js to confirm the accessor exists: geometry.attributes._TILE_COLOUR should be present with itemSize=4.",
      },
      {
        symptom: "ShaderNodeCombineColor node not found (bl_idname error)",
        cause:
          "Trying to create the node while the active node tree is not a shader or geometry-nodes tree, OR using the old node name ShaderNodeCombineHSV (removed in Blender 3.3).",
        fix:
          "Ensure the node group was created with type='GeometryNodeTree'. The correct node ID is 'ShaderNodeCombineColor' (unified node since 3.3). If Blender is older than 3.3, use 'ShaderNodeCombineHSV' — but this tutorial targets 5.1 where CombineColor is the only option.",
      },
    ],
  },
  base,
);
