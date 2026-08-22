import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnImageTextureHeightmapBody() {
  return (
    <>
      <p>
        Blender&rsquo;s Geometry Nodes system can sample any image pixel-by-pixel
        at each mesh vertex — mapping world-space XY position to UV coordinates
        and reading luminance via the{" "}
        <strong>Image Texture node</strong>. This gives you authored control that
        noise displacement cannot: you design the ridge, export real-world
        elevation data, or hand-paint a greyscale mask, and the GN modifier
        displaces the terrain to match exactly. No bake step, no UV unwrap, no
        vertex group — just a live modifier that updates when you swap the image.
      </p>
      <p className="mt-3">
        This tutorial pairs directly with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-set-position-noise-displacement"
          className={lk}
        >
          GN Set Position noise displacement tutorial
        </Link>{" "}
        — the same Set Position Offset pattern applies, but the height source
        shifts from a Noise Texture to an Image Texture. The{" "}
        <Link
          href="/tutorials/blender-tutorial-geometry-nodes-low-poly-terrain"
          className={lk}
        >
          original low-poly terrain tutorial
        </Link>{" "}
        covers the noise variant end-to-end; read it first if you have not
        built a GN displacement modifier before. The elevation colour ramp
        in the material builds on the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge"
          className={lk}
        >
          Store Named Attribute → Shader bridge tutorial
        </Link>
        : the GN tree writes a per-vertex{" "}
        <code>height</code> float via Store Named Attribute, and the material
        reads it back with the Attribute node. The GLB export pipeline — Draco
        level 6, applied modifiers, custom accessors — is covered in full by the{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
          Blender → Site Asset Pipeline
        </Link>
        .
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Why image instead of noise?
      </h3>
      <p>
        Noise terrain is infinite and stateless — every tile regenerates from
        maths, which is great for endless worlds but terrible when you need a
        specific peak silhouette or a designed game level. A heightmap is a
        contract: this greyscale PNG represents THIS terrain, reproducibly,
        from any software that can read a PNG. The workflow below accepts{" "}
        <a
          href="https://polyhaven.com"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Poly Haven CC0 terrain textures
        </a>
        , USGS elevation exports, hand-painted Krita files, and the
        synthesised test image the blueprint generates when no PNG is available.
        All are greyscale — luminance 0.0 = valley floor, 1.0 = summit.
        16-bit PNGs work without conversion; Blender normalises pixel values to
        [0, 1] internally.
      </p>
      <p>
        The authoritative reference is the{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/texture/image.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual Image Texture node (Geometry Nodes)
        </a>{" "}
        (CC-BY-SA 4.0 · Blender Documentation Team), which documents every
        interpolation mode and extension setting in 5.1.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        UV remap: world position → image coordinates
      </h3>
      <p>
        The grid spans <code>[-GRID_SIZE/2, +GRID_SIZE/2]</code> in X and Y.
        The Image Texture node expects UV in <code>[0, 1]²</code>. Two Math
        node pairs per axis bridge the gap:
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# Per axis (X shown; Y is identical):
u = position.x / GRID_SIZE + 0.5

# For GRID_SIZE = 10, position.x range = [-5, +5]:
#   -5 / 10 + 0.5 = 0.0   ← left edge of image
#    0 / 10 + 0.5 = 0.5   ← image centre
#   +5 / 10 + 0.5 = 1.0   ← right edge of image

# GN node chain:
Position → SeparateXYZ → X
  → Math(DIVIDE,   GRID_SIZE) → Math(ADD, 0.5) → U
Position → SeparateXYZ → Y
  → Math(DIVIDE,   GRID_SIZE) → Math(ADD, 0.5) → V
CombineXYZ(U, V, 0) → Image Texture.Vector`}</pre>
      <p>
        This mapping puts grid corners on image corners exactly — no bleeding,
        no padding, no margin. If you want the image to tile across the terrain
        at half-scale, change the DIVIDE value from{" "}
        <code>GRID_SIZE</code> to <code>GRID_SIZE / 2</code> and set Image
        Texture extension to <code>REPEAT</code>.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Image Texture node in a GN tree
      </h3>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# In Python, inside a GeometryNodeTree:
n_img = ng.nodes.new("GeometryNodeImageTexture")
n_img.image         = hm_img         # bpy.types.Image reference
n_img.interpolation = "Linear"       # "Closest" for pixelated look

# Color output → SeparateXYZ to extract R channel (grayscale R = G = B)
n_rgb = ng.nodes.new("ShaderNodeSeparateXYZ")
ng.links.new(n_img.outputs["Color"], n_rgb.inputs["Vector"])
# n_rgb.outputs["X"] is now the luminance value [0, 1]`}</pre>
      <p>
        The <code>Color</code> output from an Image Texture node is a three-float
        vector. For greyscale images R=G=B, so SeparateXYZ&rsquo;s X output is the
        luminance value. This is cheaper than a Separate Color node and works
        identically for greyscale data. For RGBA images the Alpha channel is
        available on the separate <code>Alpha</code> output.
      </p>
      <p>
        The <code>interpolation</code> setting controls how sub-pixel sampling
        is handled. <code>Linear</code> (bilinear) smooths between pixels —
        correct for terrain height data. <code>Closest</code>
        (nearest-neighbour) snaps to the nearest pixel, which gives a
        deliberately stepped, voxel-like look. <code>Cubic</code> (bicubic)
        overshoots slightly at sharp transitions and can create artefacts on
        terrain; avoid it unless you know the source image has soft gradients.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Set Position via Offset — touch only Z
      </h3>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# Scale luminance → metres
n_mul.operation = "MULTIPLY"
n_mul.inputs[1].default_value = HEIGHT_SCALE   # 2.5 m peak-to-trough

# Build a Z-only vector — XY unchanged because Offset adds to existing position
n_off = ng.nodes.new("ShaderNodeCombineXYZ")
n_off.inputs["X"].default_value = 0.0
n_off.inputs["Y"].default_value = 0.0
ng.links.new(n_mul.outputs["Value"], n_off.inputs["Z"])

# Set Position.Offset adds to the current vertex position
ng.links.new(n_off.outputs["Vector"], n_spos.inputs["Offset"])`}</pre>
      <p>
        Using the <strong>Offset</strong> socket rather than the{" "}
        <strong>Position</strong> socket is critical. If you wire into Position,
        you must supply a complete (X, Y, Z) world position — the original XY
        from the grid is discarded and must be reconstructed. Using Offset adds
        only the Z component and leaves XY exactly where bmesh placed them.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Flat faceting order matters
      </h3>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# CORRECT order in the GN tree:
Set Position (displace vertices) → Set Shade Smooth (compute normals on displaced mesh)

# WRONG order — this is a silent bug:
Set Shade Smooth (compute normals on FLAT grid) → Set Position (move vertices, normals stay flat)

# In Python:
n_smt = ng.nodes.new("GeometryNodeSetShadeSmooth")
n_smt.domain = "FACE"
n_smt.inputs["Shade Smooth"].default_value = False   # False = flat shading

ng.links.new(n_spos.outputs["Geometry"], n_str.inputs["Geometry"])   # store attr
ng.links.new(n_str.outputs["Geometry"],  n_smt.inputs["Geometry"])   # then flat shade
ng.links.new(n_smt.outputs["Geometry"],  n_out.inputs["Geometry"])`}</pre>
      <p>
        Blender computes per-face normals at the moment the Set Shade Smooth
        node executes. If it runs on the pre-displaced grid, every face normal
        points straight up (0, 0, 1) and the flat-shading trick produces a
        uniform-lit plane regardless of how dramatic the displacement is. Place
        Set Shade Smooth last in the chain, after Set Position and Store Named
        Attribute, so normals are computed from the actual tilted triangles.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Shader: elevation colour via named attribute
      </h3>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# GN side: write height [0,1] to each vertex
n_str = ng.nodes.new("GeometryNodeStoreNamedAttribute")
n_str.domain    = "POINT"
n_str.data_type = "FLOAT"
n_str.inputs["Name"].default_value = "height"

# Shader side: read it back with Attribute node
n_attr = nt.nodes.new("ShaderNodeAttribute")
n_attr.attribute_type = "GEOMETRY"
n_attr.attribute_name = "height"       # exact match, case-sensitive

# n_attr.outputs["Fac"] → ColorRamp → Principled BSDF Base Color
#   0.0 → deep blue   (ocean floor)
#   0.45 → forest green (midland)
#   1.0 → sandy white (summit)`}</pre>
      <p>
        The Attribute node&rsquo;s <code>Fac</code> output is the correct socket
        for a FLOAT attribute — it gives you a plain scalar. The{" "}
        <code>Color</code> output wraps the float as (value, value, value, 1)
        which works but adds unnecessary channel duplication. The elevation
        ramp uses three stops — ocean blue, midland green, summit white — to
        mimic a topographic map colour scheme.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Replacing the synthetic heightmap
      </h3>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# Instead of calling _build_heightmap(), load your own PNG:
import bpy
hm = bpy.data.images.load("/absolute/path/to/elevation.png")
hm.colorspace_settings.name = "Non-Color"  # heightmaps are data, not sRGB
hm.pack()                                  # embed in .blend

# Then pass to the GN tree:
_build_gn_tree(hm)`}</pre>
      <p>
        Set <code>colorspace_settings.name = "Non-Color"</code> on any image
        used as data (heights, masks, normal maps). Without this Blender applies
        sRGB gamma correction to the pixel values, which compresses highlights
        and causes peaks to displace less than valleys — a very confusing
        artefact. The synthetic image built by <code>_build_heightmap()</code>{" "}
        sets its colour space automatically; external PNGs default to sRGB and
        must be corrected manually.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Failure modes
      </h3>
      <p>
        <strong>Terrain is completely flat</strong> — the Image Texture node is
        not evaluating. Check that <code>n_img.image</code> is not{" "}
        <code>None</code>: run{" "}
        <code>print(ng.nodes["GeometryNodeImageTexture"].image)</code> in the
        Python console. If None, the image was removed from{" "}
        <code>bpy.data.images</code> — call <code>hm.pack()</code> before
        closing the file.
      </p>
      <p>
        <strong>Peaks look squashed</strong> — colour space is sRGB on the
        heightmap image. Open the image in the Image Editor, open the N panel →
        Image tab, and set Colour Space to Non-Color. The displacement will
        jump immediately.
      </p>
      <p>
        <strong>UV offset: terrain shifts sideways from image</strong> — the
        ADD node value (0.5) is correct only for a centred grid. If you moved
        the terrain object in Object Mode without applying the transform, the
        world-space XY no longer maps to [−5, +5]. Apply transforms first:{" "}
        <code>Object → Apply → All Transforms</code>.
      </p>
      <p>
        <strong>
          <code>height</code> attribute missing after export
        </strong>{" "}
        — check that <code>export_attributes=True</code> was passed. The
        attribute appears in THREE.js as{" "}
        <code>geometry.attributes[&apos;_HEIGHT&apos;]</code> (Blender
        uppercases custom attribute names in the glTF accessor name). Without
        the flag the accessor is silently omitted; the GLB geometry is correct
        but the elevation float is gone. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge"
          className={lk}
        >
          Named Attribute → glTF bridge tutorial
        </Link>{" "}
        for the full THREE.js import pattern.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-image-texture-heightmap-terrain",
  title:
    "Geometry Nodes — Image Texture Heightmap: Greyscale PNG to Displaced Terrain with Flat Faceting (Blender 5.1)",
  date: "2026-06-19",
  kind: "tutorial",
  excerpt:
    "Displace a 64 × 64 quad grid from a greyscale PNG heightmap using the Geometry Nodes Image Texture node in Blender 5.1: map world XY to UV, sample luminance, scale to HEIGHT_SCALE metres via Set Position Offset, store normalised height as a named attribute for elevation colour ramp, and force flat shading after displacement. Exports as GLB with a _HEIGHT Float32BufferAttribute for THREE.js custom terrain shaders.",
  Body: GnImageTextureHeightmapBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Geometry Nodes basics: group inputs/outputs, socket linking, running a GN modifier. The low-poly terrain tutorial (noise displacement) covers the Set Position Offset pattern this tutorial extends to image data.",
      "Shader Editor basics: Principled BSDF, ColorRamp, Attribute node. The Store Named Attribute tutorial shows the full GN-to-shader data bridge that this tutorial's elevation ramp depends on.",
      "Blender 5.1. The Image Texture node in GN requires 3.6+. The NodeTreeInterface API (iface.new_socket) requires 4.0+. No extensions needed.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "GeometryNodeImageTexture added in 3.6. In 5.1 the interpolation values are 'Linear', 'Closest', 'Cubic' — note capitalisation. The .image property assignment syntax (n_img.image = hm_img) is stable across 4.x–5.x.",
      },
    ],
    steps: [
      {
        title: "Synthesise or load the heightmap image",
        body:
          "The heightmap is any greyscale image where 0.0 = lowest point and 1.0 = highest.\n\n  # Synthesised from three sine octaves (no file dependency):\n  img = bpy.data.images.new('hs_heightmap', width=256, height=256, alpha=False)\n  px  = [0.0] * (256 * 256 * 4)\n  for row in range(256):\n      for col in range(256):\n          u = col / 255;  v = row / 255\n          h  = 0.50 * math.cos((u-0.5)*math.pi) * math.cos((v-0.5)*math.pi)\n          h += 0.30 * math.cos((u*2 + v*1.5 - 0.8) * math.pi * 1.5)\n          h += 0.20 * math.sin(u*math.pi*5 + 0.7) * math.cos(v*math.pi*4 - 0.3)\n          h  = max(0.0, min(1.0, (h + 1.0) * 0.5))\n          i  = (row * 256 + col) * 4\n          px[i] = px[i+1] = px[i+2] = h;  px[i+3] = 1.0\n  img.pixels.foreach_set(px)\n  img.update()\n  img.pack()   # embed in .blend; without pack() image is lost on save+reload\n\n  # OR load your own PNG (Poly Haven terrain, USGS, Krita export):\n  img = bpy.data.images.load('/path/to/elevation.png')\n  img.colorspace_settings.name = 'Non-Color'   # data image, not sRGB\n  img.pack()\n\nimg.pack() is mandatory before running the GN tree. The modifier evaluates on\ndepsgraph update — if the image is unpacked and the file path is relative to a\n.blend that has not been saved yet, the modifier reads all-black pixels and the\nterrain stays flat. pack() embeds the pixel data directly in memory/blend file.",
      },
      {
        title: "Create the grid mesh",
        body:
          "  # bmesh.ops.create_grid: size = half-extent, so size=5.0 spans [-5, +5] in XY\n  me = bpy.data.meshes.new('terrain_heightmap')\n  bm = bmesh.new()\n  bmesh.ops.create_grid(\n      bm,\n      x_segments = 64,   # 64 segments = 65 vertices per axis = 4 096 quads\n      y_segments = 64,\n      size       = 5.0   # half of GRID_SIZE (10 m)\n  )\n  bm.to_mesh(me)\n  bm.free()\n\n  obj = bpy.data.objects.new('terrain_heightmap', me)\n  bpy.context.collection.objects.link(obj)\n\nWHY 64 × 64 SEGMENTS?\n  At a 10 m grid that gives 0.156 m vertex spacing — fine enough to capture\n  detail from a 256-pixel heightmap (1 pixel per 0.039 m = every 2.5 vertices\n  samples a different pixel at the terrain scale). Doubling to 128 × 128\n  gives 4× the vertex count (16 385 vertices) for diminishing visual return\n  unless the heightmap resolution also doubles.\n\nWHY NOT subdivide a plane with bpy.ops?\n  bmesh.ops.create_grid is context-independent — it runs without an active\n  object or edit mode, which keeps the script safe to run headlessly or from\n  a batch pipeline without UI setup overhead.",
      },
      {
        title: "Build the GN displacement tree",
        body:
          "  ng = bpy.data.node_groups.new('HS_ImgHeightmap', 'GeometryNodeTree')\n  iface = ng.interface\n  iface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')\n  iface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')\n\n  nodes = ng.nodes;  links = ng.links\n\n  n_in  = nodes.new('NodeGroupInput');  n_in.location  = (-900, 0)\n  n_out = nodes.new('NodeGroupOutput'); n_out.location = ( 900, 0)\n\n  # UV remap chain\n  n_pos = nodes.new('GeometryNodeInputPosition')\n  n_sep = nodes.new('ShaderNodeSeparateXYZ')\n  links.new(n_pos.outputs['Position'], n_sep.inputs['Vector'])\n\n  # X axis: divide by GRID_SIZE then add 0.5\n  n_du = nodes.new('ShaderNodeMath'); n_du.operation = 'DIVIDE'\n  n_du.inputs[1].default_value = 10.0       # GRID_SIZE\n  n_au = nodes.new('ShaderNodeMath'); n_au.operation = 'ADD'\n  n_au.inputs[1].default_value = 0.5\n  links.new(n_sep.outputs['X'], n_du.inputs[0])\n  links.new(n_du.outputs['Value'], n_au.inputs[0])\n\n  # Y axis: same\n  n_dv = nodes.new('ShaderNodeMath'); n_dv.operation = 'DIVIDE'\n  n_dv.inputs[1].default_value = 10.0\n  n_av = nodes.new('ShaderNodeMath'); n_av.operation = 'ADD'\n  n_av.inputs[1].default_value = 0.5\n  links.new(n_sep.outputs['Y'], n_dv.inputs[0])\n  links.new(n_dv.outputs['Value'], n_av.inputs[0])\n\n  # Pack UV into a vector\n  n_uvw = nodes.new('ShaderNodeCombineXYZ')\n  n_uvw.inputs['Z'].default_value = 0.0\n  links.new(n_au.outputs['Value'], n_uvw.inputs['X'])\n  links.new(n_av.outputs['Value'], n_uvw.inputs['Y'])\n\n  # Image Texture\n  n_img = nodes.new('GeometryNodeImageTexture')\n  n_img.image         = hm_img      # the bpy.types.Image we built/loaded\n  n_img.interpolation = 'Linear'\n  links.new(n_uvw.outputs['Vector'], n_img.inputs['Vector'])\n\n  # Extract R channel from Color output (grayscale: R=G=B)\n  n_rgb = nodes.new('ShaderNodeSeparateXYZ')   # Color treated as vector\n  links.new(n_img.outputs['Color'], n_rgb.inputs['Vector'])\n\n  # Scale to metres\n  n_mul = nodes.new('ShaderNodeMath'); n_mul.operation = 'MULTIPLY'\n  n_mul.inputs[1].default_value = 2.5    # HEIGHT_SCALE\n  links.new(n_rgb.outputs['X'], n_mul.inputs[0])\n\n  # Z-only offset vector\n  n_off = nodes.new('ShaderNodeCombineXYZ')\n  n_off.inputs['X'].default_value = 0.0\n  n_off.inputs['Y'].default_value = 0.0\n  links.new(n_mul.outputs['Value'], n_off.inputs['Z'])\n\n  # Set Position via Offset\n  n_spos = nodes.new('GeometryNodeSetPosition')\n  links.new(n_in.outputs['Geometry'],    n_spos.inputs['Geometry'])\n  links.new(n_off.outputs['Vector'],     n_spos.inputs['Offset'])\n\n  # Store height [0,1] for the elevation colour shader\n  n_str = nodes.new('GeometryNodeStoreNamedAttribute')\n  n_str.domain    = 'POINT'\n  n_str.data_type = 'FLOAT'\n  n_str.inputs['Name'].default_value = 'height'\n  links.new(n_rgb.outputs['X'],          n_str.inputs['Value'])\n  links.new(n_spos.outputs['Geometry'],  n_str.inputs['Geometry'])\n\n  # Set Shade Smooth LAST — flat normals on displaced triangles\n  n_smt = nodes.new('GeometryNodeSetShadeSmooth')\n  n_smt.domain = 'FACE'\n  n_smt.inputs['Shade Smooth'].default_value = False\n  links.new(n_str.outputs['Geometry'],   n_smt.inputs['Geometry'])\n  links.new(n_smt.outputs['Geometry'],   n_out.inputs['Geometry'])",
      },
      {
        title: "Apply the modifier and build the elevation material",
        body:
          "  mod = obj.modifiers.new('ImageHeightmap', 'NODES')\n  mod.node_group = tree\n\n  ma = bpy.data.materials.new('HM_Terrain')\n  ma.use_nodes = True\n  nt = ma.node_tree\n  nt.nodes.clear()\n\n  n_attr = nt.nodes.new('ShaderNodeAttribute')\n  n_attr.attribute_type = 'GEOMETRY'\n  n_attr.attribute_name = 'height'    # exact match to StoreNamedAttribute\n\n  # Topographic colour ramp — three stops\n  n_ramp = nt.nodes.new('ShaderNodeValToRGB')\n  n_ramp.color_ramp.interpolation = 'EASE'\n  n_ramp.color_ramp.elements[0].position = 0.0\n  n_ramp.color_ramp.elements[0].color    = (0.02, 0.05, 0.18, 1)  # deep blue\n  n_ramp.color_ramp.elements[1].position = 1.0\n  n_ramp.color_ramp.elements[1].color    = (0.90, 0.88, 0.82, 1)  # sandy white\n  midstop = n_ramp.color_ramp.elements.new(0.45)\n  midstop.color = (0.12, 0.28, 0.06, 1)                            # forest green\n\n  n_bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')\n  n_bsdf.inputs['Roughness'].default_value = 0.85\n  n_out_m = nt.nodes.new('ShaderNodeOutputMaterial')\n\n  nt.links.new(n_attr.outputs['Fac'],   n_ramp.inputs['Fac'])\n  nt.links.new(n_ramp.outputs['Color'], n_bsdf.inputs['Base Color'])\n  nt.links.new(n_bsdf.outputs['BSDF'],  n_out_m.inputs['Surface'])\n  obj.data.materials.append(ma)\n\nWHY Fac OUTPUT NOT Color?\n  For a FLOAT domain attribute, Fac gives the scalar directly (range 0–1).\n  The Color output gives (value, value, value, 1.0) — it works but wastes\n  three channels and the ColorRamp receives a grey input that happens to map\n  correctly. Use Fac for clarity and to avoid accidental channel confusion\n  when the data type changes.",
      },
      {
        title: "Verify attribute, export GLB, and use in THREE.js",
        body:
          "  # Verify the named attribute is present on the evaluated mesh\n  bpy.context.view_layer.update()\n  dg       = bpy.context.evaluated_depsgraph_get()\n  eval_me  = obj.evaluated_get(dg).data\n  names    = [a.name for a in eval_me.attributes]\n  assert 'height' in names, f'Missing! Present: {names}'\n  print('height range:',\n        min(d.value for d in eval_me.attributes['height'].data),\n        '→',\n        max(d.value for d in eval_me.attributes['height'].data))\n\n  # GLB export with applied modifier and custom attribute\n  bpy.ops.export_scene.gltf(\n      filepath='terrain_heightmap.glb',\n      export_format='GLB',\n      export_apply=True,           # bake displacement into vertex positions\n      export_attributes=True,      # emit 'height' as _HEIGHT accessor\n      export_image_format='WEBP',\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n  )\n\n  // THREE.js — after GLTFLoader:\n  loader.load('terrain_heightmap.glb', (gltf) => {\n    const mesh = gltf.scene.children[0];\n    const geo  = mesh.geometry;\n    // Blender uppercases attribute names in glTF accessor names:\n    const height = geo.attributes['_HEIGHT'];   // Float32BufferAttribute\n    console.log(height.array.length);           // 4225 (65 × 65 vertices)\n    // Drive a custom ShaderMaterial uniform from height values:\n    mesh.material = new THREE.ShaderMaterial({\n      vertexShader: `\n        attribute float _HEIGHT;\n        varying float vHeight;\n        void main() {\n          vHeight = _HEIGHT;\n          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n        }`,\n      fragmentShader: `\n        varying float vHeight;\n        void main() {\n          gl_FragColor = vec4(mix(vec3(0.02,0.05,0.18), vec3(0.9,0.88,0.82), vHeight), 1.0);\n        }`,\n    });\n  });\n\nDraco level 6 compresses the 4 225-vertex float3 buffer by ~70% with no\nperceptible quality loss at terrain scale. The _HEIGHT Float32 accessor adds\n~17 KB uncompressed (4 225 floats × 4 bytes); Draco encodes it as an integer\nattribute with quantisation matched to the float range.",
      },
    ],
  },
  base,
);
