import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bpy.data.images.new()</code> creates an Image data block whose{" "}
        <code>.pixels</code> property is a flat RGBA float sequence of length{" "}
        <em>width × height × 4</em>. The critical performance trap: assigning
        values element-by-element —{" "}
        <code>img.pixels[i] = v</code> in a loop — triggers a full
        Python-to-C sequence conversion on every single assignment, making the
        total cost O(n²) in the number of pixels. A 512² image has 1 048 576
        floats; the naïve loop takes tens of seconds. The correct approach is to
        build a <code>array.array(&apos;f&apos;, ...)</code> in Python — which
        supports the buffer protocol — fill it entirely in Python, then call{" "}
        <code>img.foreach_set(&apos;pixels&apos;, buf)</code> as a single
        C-level bulk write. The same{" "}
        <code>foreach_set</code> / <code>foreach_get</code> idiom governs mesh
        attribute authoring, explored in depth in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mesh-attributes-foreach-set-gn-data-pipeline"
          className={lk}
        >
          Mesh Attributes: foreach_set tutorial
        </Link>
        , where the same O(n) vs O(n²) distinction applies to vertex position
        and colour buffers.
      </p>

      <p>
        SDF (Signed Distance Field) functions turn a pixel coordinate into a
        signed real number: negative inside the shape, positive outside. A
        filled-circle SDF is{" "}
        <code>d = sqrt((x-cx)²+(y-cy)²) - r</code>; an annular ring is the
        intersection of the outer disc and the inner disc&rsquo;s complement,
        written as{" "}
        <code>max(d_outer, -d_inner)</code>. Inigo Quilez&rsquo;s{" "}
        <a
          href="https://iquilezles.org/articles/distfunctions2d/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          2D SDF Functions
        </a>{" "}
        (MIT licence) is the canonical reference: every primitive in this
        tutorial derives directly from that catalogue. The soft edge comes from
        mapping <em>d</em> through a smooth step (Hermite{" "}
        <em>3t² − 2t³</em>) rather than a bare clamp — the C¹-continuous
        transition eliminates the aliasing that a hard threshold would introduce
        at pixel boundaries. Because SDF shapes are resolution-independent, the
        same function body scales from a 64² thumbnail to a 2048² print
        texture without changing a line of code.
      </p>

      <p>
        Colour space is the invisible variable that silently breaks data
        textures. Setting{" "}
        <code>img.colorspace_settings.name = &apos;Non-Color&apos;</code> tells
        Blender — and the GLTF exporter — that these pixel values are linear
        data, not perceptual colour. Without it, Blender applies an sRGB
        linearisation (approximately a ×2.2 gamma lift) when the texture is
        sampled in any shader or baked. On an SDF mask, that gamma shift darkens
        the transition band and moves the effective edge position inward —
        producing a visibly thicker, softer outline than the script computes.
        The same colour-space discipline governs baked EXR passes in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-cycles-shader-aov-custom-pass-bake-webxr"
          className={lk}
        >
          Cycles Shader AOV tutorial
        </Link>{" "}
        (where AOV VALUE-type passes must also be marked Non-Color) and in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-compositor-nodetree-render-passes-eevee-glb-bake"
          className={lk}
        >
          Compositor Render Passes pipeline
        </Link>
        , which writes 32-bit OpenEXR with the same linear-only requirement.
        The wider AgX colour management context — Look transforms, display
        encoding, and the distinction between a scene-linear working space and
        a data space — is covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scene-color-management-agx-ocio-bake-safe"
          className={lk}
        >
          AgX Colour Management tutorial
        </Link>
        .
      </p>

      <p>
        Packing four SDF masks into atlas quadrants matters for WebXR on mobile
        hardware. The GLTF 2.0 specification allows a material to reference
        multiple textures (base colour, normal, occlusion/roughness/metallic,
        emissive), and the WebGL runtime binds each to a sampler unit. Mobile
        GPUs — particularly those used in standalone XR headsets — have a hard
        limit of 16 combined texture units per draw call (OpenGL ES 3.0
        minimum); some older mobile drivers expose only 8. An atlas that packs
        four data channels into one 512² image consumes one unit rather than
        four, leaving headroom for the albedo, normal, and roughness maps that
        the PBR material also needs. The WebXR shader then reads each mask as{" "}
        <code>texture2D(atlas, uv * 0.5 + offset).r</code> where{" "}
        <code>offset</code> selects the quadrant. The same atlas strategy
        applies to baked normal and AO maps as covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          Texture Baking Normal + AO tutorial
        </Link>
        , where packing AO into the normal map&rsquo;s alpha channel achieves
        the same sampler-unit reduction.
      </p>

      <p>
        The export chain ends with{" "}
        <code>img.file_format = &apos;WEBP&apos;</code>,{" "}
        <code>img.file_settings.quality = 95</code>, and{" "}
        <code>img.save()</code>. Note the API separation:{" "}
        <code>img.file_format</code> and <code>img.file_settings</code> live on
        the Image object and govern direct saves;{" "}
        <code>scene.render.image_settings</code> governs only what F12 writes to
        disk — mixing the two is a common source of unexpected output formats.
        <code>img.save_render()</code> applies colour management on top of the
        pixel buffer (useful for beauty renders), whereas{" "}
        <code>img.save()</code> writes the raw buffer with only the image&rsquo;s
        own colour space tag — correct for data textures.{" "}
        <code>img.pack()</code> embeds the compressed WebP inside the{" "}
        <code>.blend</code> file so the file is self-contained and the GLB
        exporter can pull it without needing an external path. The Blender
        Foundation&rsquo;s{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.Image.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.Image API reference
        </a>{" "}
        (CC-BY-4.0) documents every property used here, including the
        distinction between <code>filepath</code> (display path) and{" "}
        <code>filepath_raw</code> (the path actually passed to the file system).
      </p>
    </>
  );
}

const base = {
  slug: "blender-tutorial-python-bpy-image-pixel-buffer-sdf-texture-atlas-webxr",
  title:
    "Python bpy.types.Image — Pixel Buffer Manipulation: Procedural SDF Texture Atlas for WebXR",
  lede: "Build a four-quadrant SDF shape atlas entirely in Python — foreach_set bulk upload, Non-Color data space, and WebP export — ready for a Three.js DataTexture in WebXR.",
  date: "2026-07-05",
  author: "Holoflow Studio",
  tags: [
    "blender",
    "python",
    "bpy",
    "image",
    "pixel-buffer",
    "sdf",
    "texture-atlas",
    "webxr",
    "webp",
    "scripting",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-bpy-image-pixel-buffer-sdf-texture-atlas-webxr",
    time: "thirty minutes",
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
      "Basic familiarity with material node trees (Image Texture node, Principled BSDF)",
      "Has read the Mesh Attributes foreach_set tutorial or understands the buffer-protocol idiom",
    ],
    steps: [
      {
        title: "Understand bpy.types.Image — the data model and pixel array layout",
        body: "bpy.data.images.new(name, width, height, alpha, float_buffer)\n  → returns an Image data block.\n\nKey properties:\n  .pixels          — flat RGBA float sequence, length = w*h*4\n                     row 0 = BOTTOM row (OpenGL convention — opposite of many image libs)\n  .size            — (width, height) read-only\n  .float_buffer    — True → 32-bit per channel; False → 8-bit (quantised)\n  .colorspace_settings.name — 'sRGB' (default) | 'Non-Color' | 'Linear' | 'Raw'\n  .file_format     — 'WEBP' | 'PNG' | 'OPEN_EXR' | 'TARGA' | ...\n  .file_settings   — object holding format-specific options (.quality for WebP)\n  .filepath_raw    — raw OS path; .filepath is the display-normalised version\n  .is_float        — read-only; True if float_buffer\n  .packed_file     — not None if img.pack() has been called\n\nbpy.data.images.remove(img) — delete the data block from memory.\n\nPitfall: .pixels is a bpy_prop_array, not a Python list.  Iterating it is\nslow and assigning element-by-element triggers a full sequence rebuild on\nevery write.  Always use foreach_set('pixels', buffer) for bulk writes.",
      },
      {
        title: "Build the flat pixel buffer with array.array — the O(n) pattern",
        body: "import array\n\nsize = 512\nbuf = array.array('f', [0.0]) * (size * size * 4)\n\n# The multiplication creates size*size*4 floats pre-allocated.\n# array.array supports the buffer protocol → foreach_set reads it\n# directly via a C memcpy without any Python iteration.\n\n# Fill the buffer in a nested loop:\nfor row in range(size):\n    for col in range(size):\n        idx = (row * size + col) * 4\n        v = compute_mask(col, row)   # your SDF function\n        buf[idx]     = v\n        buf[idx + 1] = v\n        buf[idx + 2] = v\n        buf[idx + 3] = 1.0\n\n# Then upload:\nimg.foreach_set('pixels', buf)\nimg.update()   # signals GPU re-upload\n\n# WHY array.array over a list:\n#   A Python list of 1M floats is a 1M-element array of PyObject* pointers.\n#   array.array stores raw 4-byte IEEE-754 floats contiguously — same layout\n#   as the Image's internal buffer — so foreach_set can memcpy directly.\n#   Using a list adds a Python-object-to-float conversion at the C boundary.\n#\n# WHY NOT numpy:\n#   numpy is not bundled with Blender.  array.array is stdlib.\n#   If numpy IS available (via pip into Blender's Python), you can pass\n#   a contiguous float32 ndarray; foreach_set accepts any buffer-protocol\n#   object.  But array.array is the portable, dependency-free choice.",
      },
      {
        title: "Write SDF primitives — circle, ring, box — with smooth_step anti-aliasing",
        body: "import math\n\ndef sdf_circle(px, py, cx, cy, r):\n    return math.sqrt((px-cx)**2 + (py-cy)**2) - r\n\ndef sdf_ring(px, py, cx, cy, r_outer, r_inner):\n    d = math.sqrt((px-cx)**2 + (py-cy)**2)\n    return max(d - r_outer, r_inner - d)   # intersection = max of two SDFs\n\ndef sdf_box(px, py, cx, cy, hw, hh):\n    dx = abs(px-cx) - hw\n    dy = abs(py-cy) - hh\n    return math.sqrt(max(dx,0)**2 + max(dy,0)**2) + min(max(dx,dy),0)\n    # The max(dx,0)/max(dy,0) part gives the exact distance outside corners.\n    # The min(max(dx,dy),0) part gives the negative distance inside.\n    # Together they handle all 9 regions around the box without conditionals.\n\ndef smooth_step(d, feather):\n    t = max(0.0, min(1.0, 0.5 - d/feather))\n    return t*t*(3.0 - 2.0*t)   # Hermite C1-continuous cubic\n\n# Quadrant atlas packing:\nhalf = size // 2\nfor row in range(size):\n    for col in range(size):\n        px = float(col % half)\n        py = float(row % half)\n        mid = half * 0.5\n        idx = (row*size + col) * 4\n\n        if row >= half and col >= half:\n            d = sdf_circle(px, py, mid, mid, mid*0.72)\n        elif row >= half:\n            d = sdf_ring(px, py, mid, mid, mid*0.72, mid*0.38)\n        elif col < half:\n            d = sdf_box(px, py, mid, mid, mid*0.58, mid*0.58)\n        else:                           # radial gradient — no SDF\n            dist = math.sqrt((px-mid)**2 + (py-mid)**2)\n            d = dist/mid - 1.0          # negative at centre, positive at edge\n\n        v = smooth_step(d, FEATHER)\n        buf[idx:idx+3] = array.array('f', [v,v,v])\n        buf[idx+3] = 1.0\n\n# TROUBLESHOOTING:\n#   Quadrant seams visible: check col%half / row%half modulo;\n#     if FEATHER is large relative to half, soft edges bleed across quadrant\n#     boundaries.  Reduce FEATHER or add a 2px gutter by biasing mid slightly.\n#   Ring is all-black: r_inner > r_outer swaps the max() result;\n#     ensure r_inner < r_outer (e.g. mid*0.38 < mid*0.72).\n#   Box has hard corners: you're using abs(dx)+abs(dy) instead of the Quilez\n#     formula — the sqrt(max²+max²) term is what rounds the corners.",
      },
      {
        title: "Create the Image, set colour space, bulk-upload, pack",
        body: "def create_atlas_image(name, size, feather):\n    if name in bpy.data.images:\n        bpy.data.images.remove(bpy.data.images[name])  # idempotent re-run\n\n    img = bpy.data.images.new(\n        name,\n        width=size,\n        height=size,\n        alpha=True,\n        float_buffer=True,   # 32-bit — SDF smooth edges need >8-bit precision\n    )\n\n    # CRITICAL: set colour space BEFORE foreach_set.\n    # The colour space tag is embedded in the image header when saving.\n    # Changing it after save requires re-saving to take effect on disk.\n    img.colorspace_settings.name = 'Non-Color'\n\n    buf = build_atlas_buffer(size, feather)   # your array.array('f', ...)\n    img.foreach_set('pixels', buf)\n    img.update()   # GPU re-upload; otherwise viewport shows stale texture\n\n    return img\n\n# Pack embeds the compressed image into the .blend file.\n# Required so the GLB exporter can resolve the texture without an external path.\n# After packing, img.packed_file is not None and img.filepath_raw is still set\n# (Blender stores both the external path hint and the embedded data).\nimg.pack()\n\n# Verify:\nprint(img.colorspace_settings.name)  # → 'Non-Color'\nprint(img.is_float)                   # → True\nprint(img.size[:])                    # → [512, 512]\nprint(img.packed_file is not None)    # → True",
      },
      {
        title: "Save as WebP — file_format, file_settings, save() vs save_render()",
        body: "# img.file_format + img.file_settings → direct disk write (img.save())\n# scene.render.image_settings            → F12 render output only\n# NEVER mix the two — you get unexpected format output.\n\ndef save_webp(img, filepath, quality=95):\n    img.filepath_raw = filepath        # raw OS path; use // prefix for blend-relative\n    img.file_format  = 'WEBP'\n    img.file_settings.quality = quality\n    img.save()\n    # img.save() writes the raw pixel buffer with only the colour space tag.\n    # img.save_render(filepath) applies OCIO display transform on top — do NOT\n    # use it for data textures.  It is correct only for beauty render output.\n\n# For EXR (alternative to WebP for lossless float):\n#   img.file_format = 'OPEN_EXR'\n#   img.file_settings.color_depth = '32'\n#   img.file_settings.exr_codec   = 'ZIP'\n#   img.save()\n#\n# For PNG (lossless, 16-bit):\n#   img.file_format = 'PNG'\n#   img.file_settings.color_depth = '16'\n#   img.save()\n#\n# TROUBLESHOOTING:\n#   'RuntimeError: image ... does not have a file path':\n#     img.filepath_raw must be set to an absolute or blend-relative path before save().\n#   Output is sRGB-shifted despite Non-Color:\n#     You called save_render() instead of save() — it applies colour management.\n#   WebP quality has no effect:\n#     img.file_format must be set to 'WEBP' BEFORE setting file_settings.quality;\n#     the settings object switches type with the format.",
      },
      {
        title: "Wire into material node tree, export GLB — and use in Three.js WebXR",
        body: "# Material wiring:\nmat = bpy.data.materials.new('SDF_Atlas_Material')\nmat.use_nodes = True\nnt = mat.node_tree\nfor n in list(nt.nodes): nt.nodes.remove(n)\n\nout  = nt.nodes.new('ShaderNodeOutputMaterial')\nbsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')\ntex  = nt.nodes.new('ShaderNodeTexImage')\ntex.image = img   # img.colorspace_settings already carries Non-Color\n\nnt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])\nnt.links.new(tex.outputs['Alpha'], bsdf.inputs['Alpha'])\nnt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])\nmat.blend_method = 'BLEND'\n\n# GLB export:\nbpy.ops.export_scene.gltf(\n    filepath=GLB_PATH,\n    use_selection=True,\n    export_format='GLB',\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n    export_image_format='WEBP',\n    export_image_quality=95,\n)\n\n# Three.js / WebXR usage:\n# const loader = new THREE.GLTFLoader();\n# loader.load('sdf_atlas_sphere.glb', (gltf) => {\n#   const tex = gltf.scene.children[0].material.map;\n#   // tex is a THREE.CompressedTexture (Draco) + DataTexture (atlas)\n#   // Sample quadrant in a custom shader:\n#   //   vec2 q1_uv = uv * 0.5 + vec2(0.5, 0.5);  // top-right quadrant\n#   //   float circle_mask = texture2D(atlas, q1_uv).r;\n# });\n\n# TROUBLESHOOTING:\n#   GLB atlas is sRGB despite Non-Color flag:\n#     GLB spec mandates sRGB for base-colour textures.  Use the atlas as an\n#     emissive texture (export_image_format='WEBP' still applies) and sample\n#     it in a custom THREE.ShaderMaterial to bypass the sRGB decode path.\n#   Draco decompression missing in browser:\n#     Load THREE.DRACOLoader and call gltfLoader.setDRACOLoader(draco).",
      },
    ],
  },
  base
);
