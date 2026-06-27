import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every texture in Blender is ultimately a flat array of floats. The
        <code> bpy.types.Image.pixels</code> property exposes that array
        directly — but touching individual elements one at a time from Python
        is catastrophically slow because each read or write crosses the
        Python-to-C boundary and triggers a property getter or setter. A 512
        × 512 image has 1,048,576 float components; iterating over them naively
        takes 10–30 seconds. The escape hatch is{" "}
        <strong>
          <code>foreach_set(buffer)</code>
        </strong>{" "}
        and its inverse <code>foreach_get(buffer)</code>: single C-level bulk
        copy calls that transfer the entire buffer in milliseconds regardless of
        image size. This tutorial generates a procedural torus-wrapped Voronoi
        pattern in pure Python, writes it to a{" "}
        <code>bpy.data.images.new()</code> datablock in one call, packs the
        result into the .blend file, and wires the image into a Principled BSDF
        material ready for WebXR GLB export.
      </p>
      <p>
        The pixel layout rule that trips everyone up:{" "}
        <strong>Blender follows the OpenGL convention</strong> — the origin is
        the bottom-left corner, rows run upward. Row 0 in the flat buffer is the
        bottom row of the image. Most image editors and PNG files place row 0 at
        the top, so an image that looks correct in Blender&apos;s UV editor
        appears vertically mirrored when opened in Photoshop or GIMP — and vice
        versa. The solution is to generate your pattern with the GL y-axis in
        mind from the start rather than flipping after the fact. Compare this to
        the Cycles-based baking approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          Normal Map &amp; AO Bake tutorial
        </Link>
        : that workflow uses the GPU to bake geometry-derived data into a texture;
        this one generates data entirely in Python, which is slower per pixel but
        gives you arbitrary procedural control with no scene geometry required.
      </p>
      <p>
        The Voronoi generator uses torus-topology distance: when computing the
        distance from a UV coordinate to a cell centre, it wraps the difference
        modulo 1 in both axes, so distances near the 0/1 UV boundary correctly
        reference cell centres on the opposite edge. This guarantees the output
        tiles seamlessly — essential for the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-image-texture-heightmap-terrain"
          className={lk}
        >
          Image Texture Heightmap terrain workflow
        </Link>{" "}
        where the same bitmap is tiled across a large terrain mesh. The
        brightening curve applied to the normalised distance ({" "}
        <code>1 − t^EDGE_BOOST</code>) emphasises cell boundaries, producing
        an appearance close to the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-procedural-marble-veins"
          className={lk}
        >
          Procedural Marble shader
        </Link>
        &apos;s vein network — but baked into a bitmap rather than evaluated at
        render time, which means zero shader cost in Eevee or WebXR.
      </p>
      <p>
        The{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.types.Image.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Python API — bpy.types.Image (Blender Foundation, CC-BY)
        </a>{" "}
        documents the full image datablock API.{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.types.bpy_prop_collection.html#bpy.types.bpy_prop_collection.foreach_set"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy_prop_collection.foreach_set (Blender Foundation, CC-BY)
        </a>{" "}
        is the low-level specification for the bulk transfer call. The sibling
        projects to study are Blender&apos;s own test suite under{" "}
        <code>tests/python/bl_image_save.py</code> and the community reference
        implementation at{" "}
        <a
          href="https://github.com/AcademySoftwareFoundation/openvdb"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          OpenVDB (Apache-2.0, ASWF)
        </a>
        , which underpins Blender&apos;s volume pipeline and follows the same
        bottom-left voxel-origin convention in its 2-D grid slices.
      </p>
      <p>
        For the material, the image is assigned to a{" "}
        <code>ShaderNodeTexImage</code> node connected through a{" "}
        <code>ShaderNodeMapping</code> whose Location socket is keyframed in{" "}
        <code>record.py</code> to scroll the pattern, confirming the tile is
        seamless. The Node tree also includes a low-strength{" "}
        <code>ShaderNodeEmission</code> overlay so the Voronoi edges read
        clearly in Eevee&apos;s material preview without a high-powered area
        light — the same emission trick used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-shader-node-group-batch-material"
          className={lk}
        >
          Shader Node Group Batch Material tutorial
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-image-pixel-buffer-procedural-bake",
  title:
    "Python — Image Pixel Buffer: Procedural Voronoi Bake via foreach_set (Blender 5.1)",
  date: "2026-06-27",
  kind: "tutorial",
  excerpt:
    "Write a 512×512 Voronoi pattern directly into bpy.types.Image.pixels " +
    "using foreach_set — the bulk C-level copy that is ~100× faster than " +
    "per-element assignment. Covers pixel buffer layout (bottom-left origin, " +
    "flat RGBA), Non-Color colour space, torus-wrapped tiling, and wiring " +
    "the result into a Principled BSDF material for WebXR export.",
  Body,
};

export const entry = buildInstructable(
  {
    time: "1–2 hours",
    difficulty: "advanced",
    cost: "free — Blender 5.1 only",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    supplies: {
      materials: [],
      tools: [],
    },
    steps: [
      {
        title: "Create the Image datablock",
        body:
          "bpy.data.images.new(name, width=512, height=512, alpha=False) allocates " +
          "the pixel buffer in Blender's memory but does not populate it — all " +
          "floats default to 0.0. Set img.colorspace_settings.name = 'Non-Color' " +
          "immediately: Non-Color tells the renderer this is data (roughness, " +
          "height, mask) not perceived colour, so no gamma correction is applied. " +
          "Forgetting this causes your Voronoi edges to appear too dark in Cycles " +
          "renders because the renderer un-does a gamma curve that was never there.",
      },
      {
        title: "Generate the Voronoi cell centres",
        body:
          "Scatter NUM_CELLS = 28 random points in [0, 1)² using random.Random(SEED). " +
          "The seed makes the pattern reproducible — the same seed on any machine " +
          "gives the same layout. Store them as a plain Python list of (u, v) tuples. " +
          "Torus-wrap the distance: for each candidate centre, compute " +
          "dx = abs(u − cx); if dx > 0.5: dx = 1 − dx (and same for dy). " +
          "This makes a cell at (0.02, 0.5) correctly attract pixels near (0.98, 0.5) " +
          "across the UV seam, which is required for seamless tiling.",
      },
      {
        title: "Fill the flat RGBA buffer with array.array",
        body:
          "Allocate buf = array.array('f', [0.0]) * (W * H * 4). The 'f' typecode " +
          "produces 32-bit IEEE 754 floats matching Blender's internal pixel format. " +
          "Iterate y from 0 to H-1 (bottom to top in screen space — row 0 is the " +
          "bottom edge). For each pixel compute the F1 Voronoi distance, normalise " +
          "to [0, 1], apply the edge-boost remap, and write four floats starting at " +
          "index (y * W + x) * 4. The alpha channel is always 1.0.",
      },
      {
        title: "Bulk-write with foreach_set and pack",
        body:
          "img.pixels.foreach_set(buf) copies the entire buffer in one C call. " +
          "Call img.update() afterwards to signal to Blender that the data changed " +
          "(omitting this can leave the UV editor showing stale content). " +
          "img.pack() embeds the pixel data in the .blend file so the result " +
          "survives a File → Save without an external PNG file. " +
          "foreach_set accepts any object that supports the buffer protocol — " +
          "array.array('f') and numpy.ndarray of dtype float32 both qualify.",
      },
      {
        title: "Build the material node tree",
        body:
          "Create a fresh material, clear its nodes, and add: TexCoord → Mapping → " +
          "TexImage (with your packed image) → Principled BSDF → Output. The Mapping " +
          "node is named 'UVMapping' so record.py can find it by name to insert " +
          "Location keyframes for the scrolling animation. Add a low-strength " +
          "Emission node (strength 0.15) fed by the same TexImage colour, mixed " +
          "with the BSDF at Fac=0.2, so cell edges glow slightly in Eevee's " +
          "material preview without requiring a bright scene light.",
      },
      {
        title: "Assign to mesh and verify in UV Editor",
        body:
          "sphere.data.materials.append(mat) links the material. Switch the " +
          "viewport to Material Preview mode (Z → Material Preview). Open the " +
          "UV Editor and select hs_voronoi_bake from the image dropdown — you " +
          "should see the Voronoi grid. Move your cursor to the absolute bottom-left " +
          "corner of the image and note the image coordinate readout shows (0, 0). " +
          "That corner corresponds to buf[0] (R), buf[1] (G), buf[2] (B), buf[3] (A) " +
          "in the flat buffer — confirming the bottom-left origin convention.",
      },
    ],
    variations: [
      "NumPy fast path: replace the nested Python loop with " +
        "np.mgrid[0:H, 0:W] to build (H, W, 2) UV coordinate arrays, then " +
        "vectorise the torus distance using np.minimum(np.abs(U - cx), 1 - np.abs(U - cx)). " +
        "The full 512×512 buffer fills in under 0.05 s. Use img.pixels.foreach_set(arr.ravel()) " +
        "where arr has dtype=np.float32 and shape (H, W, 4).",
      "EXR output: set img = bpy.data.images.new(name, W, H, alpha=True, float_buffer=True) " +
        "for 32-bit HDR precision. Change colorspace_settings.name to 'Linear Rec.709'. " +
        "Save via bpy.ops.image.save_as(filepath='//voronoi.exr', copy=True) — " +
        "EXR preserves full float range needed for displacement maps.",
      "Animated texture via bpy.app.handlers: register a frame_change_post handler " +
        "that regenerates the pixel buffer each frame with a time-varying seed offset. " +
        "This drives a live 'shifting cells' effect — expensive (one full generate + " +
        "foreach_set per frame) but feasible for up to ~256×256 at 24 fps on a fast CPU.",
    ],
    troubleshooting: [
      {
        symptom: "Image appears upside-down in external editor but correct in Blender",
        cause:
          "Blender uses a bottom-left origin (OpenGL convention). PNG and most " +
          "image editors use a top-left origin. The same pixel data renders correctly " +
          "in Blender's UV editor and flipped everywhere else.",
        fix:
          "If you need the PNG to look correct externally, flip Y in your generator: " +
          "change the buffer write to use (H - 1 - y) * W + x) * 4 as the row index. " +
          "Do NOT flip when the image stays inside Blender (material texture, height map) " +
          "— flipping would make it wrong there instead.",
      },
      {
        symptom: "foreach_set raises TypeError: expected sequence of floats",
        cause:
          "You passed an array.array with the wrong typecode ('d' for double, 'i' for " +
          "int, etc.) or a list of ints. Blender's pixel buffer requires 32-bit floats.",
        fix:
          "Use array.array('f', ...) — the lowercase 'f' typecode is 32-bit float. " +
          "For NumPy, ensure arr.dtype == np.float32 before calling ravel(). " +
          "A list of Python float values also works but is slower than a typed buffer.",
      },
      {
        symptom: "UV editor shows a plain grey square after foreach_set",
        cause:
          "img.update() was not called, so Blender's GPU texture cache still holds " +
          "the previous (all-zero) data. The pixel buffer in memory is correct but " +
          "the display has not refreshed.",
        fix:
          "Call img.update() immediately after foreach_set. In some Blender builds " +
          "you also need img.gl_load() to force a GPU upload, but update() alone " +
          "is sufficient in 5.1.",
      },
      {
        symptom: "Cell edges appear in unexpected positions after changing NUM_CELLS",
        cause:
          "The MAX_DIST normalisation was computed with the old cell count — or the " +
          "sampling grid used to compute MAX_DIST doesn't represent the worst-case " +
          "distance for the new layout.",
        fix:
          "Re-run the MAX_DIST sampling block after changing NUM_CELLS and SEED. " +
          "Alternatively, use a theoretical upper bound: for N cells on a unit torus " +
          "a safe upper bound is 0.9 / sqrt(N) — larger than the true max for all N≥4.",
      },
    ],
    voiceMode: "aura",
  },
  base,
);
