import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function CyclesLightmapBakeWebxrUv2Body() {
  return (
    <>
      <p>
        WebXR on standalone hardware (Meta Quest, Pico, Apple Vision) runs at
        72–120 Hz inside a power envelope measured in watts, not the tens of
        watts available to a desktop Cycles render. Per-frame ray tracing is
        not an option. Lightmapping is the classical solution: run Cycles once,
        freeze the result of all light bounces into a texture, and let the
        real-time renderer look that texture up at O(1) cost per fragment. The
        trade-off is that the light is frozen — a moving sun or a flickering
        lamp requires a rebake. For architecture, props, and most environment
        geometry that trade is favourable.
      </p>
      <p className="mt-3">
        This tutorial is the production bake pipeline for the studio&rsquo;s
        GLB-to-WebXR workflow. The{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-light-probes-sphere-reflection-irradiance-webxr"
          className={lk}
        >
          EEVEE light probes tutorial
        </Link>{" "}
        covers the real-time authoring counterpart — probes that update
        interactively inside Blender but produce no exportable bake data.
        Lightmapping is the step that turns EEVEE&rsquo;s quality preview into
        transferable texture data.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        UV0 vs UV1 — why two UV layers
      </h2>
      <p>
        A single UV map does two incompatible jobs. Material textures tile: the
        same 512 px wood grain repeats across a 4 m floor ten times, and the
        UV islands for the left and right halves of the floor overlap in UV
        space. That tiling is the whole point.
      </p>
      <p className="mt-3">
        Lightmaps cannot tile. The bake operator writes a unique pixel address
        for every face. Two faces sharing the same UV coordinate receive the
        same colour in the lightmap — if they are in different positions with
        respect to the lights, one will be wrong. The lightmap UV
        (&ldquo;UV1&rdquo; in Blender, exported as{" "}
        <code>TEXCOORD_1</code> in glTF) must therefore have <em>zero</em>{" "}
        overlapping islands. Every face must occupy a unique region of the 0–1
        square. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-uv-unwrap-pack-islands-glb"
          className={lk}
        >
          UV Unwrap Pack Islands and GLB tutorial
        </Link>{" "}
        for how glTF-Blender-IO maps UV layer order to TEXCOORD_N — the naming
        convention matters for Three.js to read the correct channel.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Bake type: COMBINED vs alternatives
      </h2>
      <p>
        Blender&rsquo;s Cycles bake exposes several pass types. For a WebXR
        lightmap <code>COMBINED</code> is almost always the right choice: it
        captures direct illumination, indirect (GI) bounces, shadow, and the
        AO contribution in a single bake. The result is a complete lighting
        snapshot.
      </p>
      <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
        <li>
          <strong>COMBINED</strong> — full GI snapshot; use for WebXR where no
          dynamic relighting is needed.
        </li>
        <li>
          <strong>AO</strong> — ambient occlusion only; multiply over albedo in
          the shader for a cheap GI approximation. Useful when bake time is
          constrained.
        </li>
        <li>
          <strong>DIFFUSE</strong> — diffuse colour response without speculars;
          useful for analysing colour bleed in isolation.
        </li>
        <li>
          <strong>SHADOW</strong> — cast shadows only; combine with a dynamic
          base shader for partially static scenes.
        </li>
      </ul>
      <p className="mt-3">
        The complementary technique — baking normals from high-poly sculpts to
        low-poly game meshes via the selected-to-active workflow — is covered
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          texture baking normal and AO tutorial
        </Link>
        . That tutorial&rsquo;s pattern for activating the correct Image
        Texture node before calling <code>bpy.ops.object.bake()</code> is
        identical to the one used here — the operator always writes to the
        selected+active node.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        OIDN denoising on baked results
      </h2>
      <p>
        Baking at 128 samples per pixel produces noisy results — GI bounces
        converge slowly. Raising samples to 512 or 1024 is possible but
        multiplies bake time proportionally. OpenImageDenoise (OIDN) offers a
        better trade: bake at 128 samples, denoise in post. Blender 3.1
        introduced <code>scene.render.bake.use_denoising = True</code>, which
        applies the active denoiser (OIDN or OptiX, set via{" "}
        <code>sc.cycles.denoiser</code>) to each baked image automatically
        before the result is written to the Image Texture node. The setting
        persists in Blender 5.1 and is the recommended bake workflow for
        production.
      </p>
      <pre className="bg-zinc-800 text-zinc-100 text-xs rounded p-3 mt-2 overflow-x-auto">
        {`sc.cycles.denoiser             = "OPENIMAGEDENOISE"
sc.render.bake.use_denoising   = True   # applies after each bake
sc.render.bake.margin          = 4      # px bleed — prevents dark seams
sc.render.bake.margin_type     = "EXTEND"  # flood-fill colour into margin`}
      </pre>
      <p className="mt-3">
        The <code>margin</code> setting is critical and often overlooked.
        Without it, the pixel row at each UV island boundary is uninitialised
        (black). When the GPU bilinearly filters the lightmap texture, those
        black pixels bleed into visible geometry, creating dark seams at UV
        island edges. Four pixels of margin at 512 px is the minimum;
        use 8 px at 1024 px and 16 px at 2048 px. <code>EXTEND</code> fills
        the margin by flood-filling the nearest valid pixel colour outward —
        better than <code>ADJACENT_FACES</code> for islands with very thin
        UV borders.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Per-object vs shared atlas
      </h2>
      <p>
        This blueprint bakes one 512×512 image per mesh object — the simplest
        approach. Each object carries its own lightmap, and Three.js assigns{" "}
        <code>material.lightMap</code> per mesh independently.
      </p>
      <p className="mt-3">
        The production alternative for scenes with many objects is a{" "}
        <strong>shared atlas</strong>: all objects&rsquo; UV1 islands are packed
        into a single 1024×1024 or 2048×2048 image using Blender&rsquo;s{" "}
        <strong>Lightmap Pack</strong> UV operator (
        <code>uv.lightmap_pack(PACK_IN_ONE=True)</code>). Each object is then
        baked sequentially into the same image — since UV islands do not
        overlap, each bake writes to distinct image regions. The result is one
        texture for all geometry, cutting the Three.js draw-call overhead from
        N materials to 1. The trade-off: lower per-object texel density at the
        same image resolution. For large environment scenes (50+ props) the
        reduced draw-call count is worth it. For hero objects with complex
        shadow detail, per-object lightmaps preserve resolution.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        glTF TEXCOORD_1 and Three.js lightMap
      </h2>
      <p>
        The glTF 2.0 specification defines{" "}
        <code>TEXCOORD_N</code> as the Nth UV set in the mesh primitive. The
        Blender glTF exporter writes UV layers in the order they appear in{" "}
        <code>ob.data.uv_layers</code> — <code>UVMap</code> first (TEXCOORD_0),{" "}
        <code>UVLightmap</code> second (TEXCOORD_1) — provided both names are
        standard Blender conventions. Custom names export as additional
        accessors but may not map to standard TEXCOORD slots; keep the names{" "}
        <code>&quot;UVMap&quot;</code> and <code>&quot;UVMap.001&quot;</code>{" "}
        or <code>&quot;UVLightmap&quot;</code> to guarantee the correct slot
        assignment.
      </p>
      <p className="mt-3">
        Three.js <code>MeshStandardMaterial</code> reads the lightmap from the{" "}
        <code>uv1</code> geometry attribute (renamed from <code>uv2</code> in
        Three.js r148). If the loaded GLB shows a black lightmap, check your
        Three.js version:
      </p>
      <pre className="bg-zinc-800 text-zinc-100 text-xs rounded p-3 mt-2 overflow-x-auto">
        {`// Three.js r148+ — TEXCOORD_1 loads into uv1 automatically
mesh.material.lightMap          = baked_texture;
mesh.material.lightMapIntensity = 1.0;

// Older Three.js — may need manual reassignment
geometry.setAttribute('uv2', geometry.getAttribute('uv1'));`}
      </pre>
      <p className="mt-3">
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          batch GLB exporter tutorial
        </Link>{" "}
        shows how to run this export pipeline across a whole scene collection
        automatically — the same <code>export_scene.gltf()</code> call applies
        directly to lightmapped scenes.
      </p>

      <p className="mt-4 text-sm text-zinc-400">
        Sources:{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/render/cycles/baking.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Cycles Baking
        </a>{" "}
        (© Blender Foundation, CC-BY-SA 4.0) ·{" "}
        <a
          href="https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          glTF 2.0 Specification — Texture Coordinates
        </a>{" "}
        (© Khronos Group, Apache-2.0) — related repos:{" "}
        <a
          href="https://github.com/KhronosGroup/glTF"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          KhronosGroup/glTF
        </a>{" "}
        ·{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Sample-Models"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          KhronosGroup/glTF-Sample-Models
        </a>
        .
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "30 min – 1 hour",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: [
        "Blender 5.1 (free, blender.org)",
        "Cycles renderer (CPU or GPU — GPU strongly recommended for 128+ samples)",
        "OpenImageDenoise (bundled with Blender 5.1)",
      ],
      tools: [
        "blueprint.py (builds lightmap_room.blend + lightmap_room.glb)",
        "record.py (renders 120-frame orbit → viewport.mp4)",
        "OBS Studio or Windows Game Bar (screen.mp4)",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py to build the scene and bake",
        body: "Open a terminal in public/library/blends/rendering/cycles-lightmap-bake-webxr-uv2/ and run: blender --background --python blueprint.py. Blender builds the room geometry, unwraps UV0 and UV1 per mesh, creates per-object float images, bakes COMBINED lighting into each, applies OIDN denoising, packs images into lightmap_room.blend, wires the lightmap into each material's Base Color via a Multiply mix, and exports lightmap_room.glb. Bake time on a mid-range GPU (RTX 3060): approximately 2–4 minutes for all five objects at SAMPLES=128.",
      },
      {
        title: "Inspect UV layers in the UV Editor",
        body: "Open lightmap_room.blend. Select the floor mesh, Tab into Edit Mode, select all. Open the UV Editor. In the UV Editor header there is a UV layer dropdown — toggle between 'UVMap' (UV0) and 'UVLightmap' (UV1). UV0 will show compact Smart UV Project islands; UV1 will show the same faces but with slightly larger margins so no two faces share UV space. The absence of any overlapping islands in UV1 is the critical constraint — any overlap would cause two faces to bake into the same pixels, producing a light-leak artefact.",
      },
      {
        title: "Examine the bake node setup in the Shader Editor",
        body: "With the floor selected, open the Shader Editor. You will see two clusters: the original Principled BSDF → Output node, and a pair of Image Texture + UV Map nodes. The cluster labelled 'BAKE_LM' with 'BAKE_LM_UV' (UVLightmap) is the bake target — this node was active when bpy.ops.object.bake() was called, directing the result into lm_floor. There is also a second cluster labelled with the output nodes connecting the lightmap through a Multiply MixRGB into Base Color. Inspect the same setup on wall_n and accent — each points to its own lm_<name> image.",
      },
      {
        title: "Verify the baked images in the Image Editor",
        body: "Switch a panel to Image Editor. From the image dropdown select lm_floor. You should see a baked 512×512 lightmap: the warm top-left glow from key_area, the cooler blue-white from fill_point, and hard contact shadows under the pillar where it rests on the floor. Select lm_pillar — the pillar image should show strong top-face lighting and shadowed sides. Verify all five images are present and non-empty.",
      },
      {
        title: "Render a still to confirm the composite result",
        body: "In camera view (Numpad 0), switch to Rendered mode (Z → 8). You will see the room with baked GI folded into the Base Color via the Multiply node — the walls show a warm-to-cool gradient, the accent block casts a contact shadow gradient onto the floor. Press F12 for a still render. Compare to the same scene rendered WITHOUT the lightmap nodes active — by temporarily disconnecting the Multiply output — to see the difference between raw Cycles GI and the baked approximation.",
      },
      {
        title: "Adjust denoising strength if the bake is noisy",
        body: "If lm_accent shows grain (the accent block receives fewer bounces so noise is visible at 128 samples), increase SAMPLES in blueprint.py and re-run. Alternatively, in Render Properties → Bake, confirm 'Denoise' is ticked. For a further improvement, use OIDN in the Compositor: pipe the baked image through an Image node → Denoise node → Viewer, then 'Save Rendered Image'. OIDN at 128 samples typically achieves quality comparable to 512 samples without denoising.",
      },
      {
        title: "Load the GLB in Three.js and assign the lightMap",
        body: "In your Three.js project: import GLTFLoader, load lightmap_room.glb, traverse children. Each mesh's TEXCOORD_1 is loaded into geometry.attributes.uv1 (Three.js r148+). The embedded lightmap image is available via child.material.map (if Base Color texture) or you may need to extract it from the GLTF's textures array. Assign it: child.material.lightMap = texture; child.material.lightMapIntensity = 1.0. In Three.js r147 and below, the attribute was named 'uv2' — you may need to copy it: geometry.setAttribute('uv2', geometry.getAttribute('uv1')).",
      },
      {
        title: "Screen-record the workflow",
        body: "Follow SCREEN-RECORDING-NOTES.md: OBS window capture 1920×1080, 30 fps, audio off. Cover: UV Editor UV0 vs UV1 comparison → Shader Editor bake node cluster → Image Editor baked lightmap → Render Properties bake settings → Three.js snippet. Save as screen.mp4 to public/library/videos/rendering/cycles-lightmap-bake-webxr-uv2/.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Black lightmap images after baking",
        cause:
          "Most likely cause: the Image Texture node labelled BAKE_LM was not the active node when bake was called, so Blender wrote to nothing. Second possibility: no lights in the scene, or all lights are outside the geometry's Cycles visibility.",
        fix: "In the Shader Editor, select the BAKE_LM node (click it, it turns white border) and confirm it shows as active in the node tree header. Re-run bpy.ops.object.bake(type='COMBINED'). If still black, check that key_area and fill_point are present in the Outliner and not hidden from render (camera icon).",
      },
      {
        symptom: "Dark seams at UV island boundaries in the lightmap",
        cause:
          "The bake margin is too small (0 or 1 px). At texture filtering time the GPU samples beyond the island edge and hits uninitialised black pixels.",
        fix: "Increase sc.render.bake.margin to 8 px for a 512×512 image. Set margin_type to 'EXTEND'. Re-run the bake. For very fine UV islands, also increase the Smart UV Project island_margin to 0.06 or 0.08.",
      },
      {
        symptom: "More than one Image Texture node selected error during bake",
        cause:
          "Multiple Image Texture nodes have their select state True in the same material. The bake operator cannot determine which node to write to.",
        fix: "In the Shader Editor, deselect all nodes (Alt+A), then click only the BAKE_LM node. The _set_bake_node() helper in blueprint.py does this via: for n in tree.nodes: n.select = False — followed by bk.select = True. If running interactively, do the same manually.",
      },
      {
        symptom: "UV1 islands overlap between objects in the shared atlas variant",
        cause:
          "Smart UV Project was called per-object into the same 0–1 UV space without coordinating across objects. Each object's Smart UV Project fills the full 0–1 square independently.",
        fix: "For a shared atlas, select ALL mesh objects → Enter Edit Mode (multi-object mode) → call uv.lightmap_pack(PACK_IN_ONE=True). Lightmap Pack is designed for cross-object island distribution; Smart UV Project is not.",
      },
      {
        symptom: "Three.js lightMap appears black despite correct UV1",
        cause:
          "The lightmap texture was not assigned to material.lightMap, or the geometry attribute name mismatch between Three.js versions.",
        fix: "Confirm geometry.attributes.uv1 exists (Three.js r148+) or geometry.attributes.uv2 (older). Assign: mesh.material.lightMap = texture; mesh.material.lightMapIntensity = 1.0; mesh.material.needsUpdate = true. Also ensure the scene's renderer has outputColorSpace matching the texture's colorSpace.",
      },
    ],
    finalResult:
      "lightmap_room.blend containing five meshes (floor, two walls, pillar, accent block) each with a baked COMBINED lightmap packed as a float image into UV1. lightmap_room.glb with both UV channels (TEXCOORD_0 and TEXCOORD_1) embedded, ready for Three.js MeshStandardMaterial.lightMap assignment. A 120-frame camera orbit encoded as viewport.mp4 demonstrates the frozen GI — warm key-light pools on the floor, cool fill bounce on the walls, contact shadows under the pillar — at Cycles quality with zero per-frame ray-trace cost.",
  },
  {
    slug: "blender-tutorial-cycles-lightmap-bake-webxr-uv2",
    title:
      "Rendering: Cycles Lightmap Baking for WebXR — UV2 Channel, Combined Bake, OIDN Denoising, GLB Export (Blender 5.1)",
    date: "2026-06-20",
    kind: "tutorial",
    excerpt:
      "Pre-bake scene GI into per-object UV2 lightmap textures using Cycles COMBINED pass and OIDN denoising, then export a GLB carrying TEXCOORD_1 for Three.js MeshStandardMaterial.lightMap — eliminating per-frame ray-tracing cost in WebXR at the cost of frozen static lighting.",
    tags: [
      "blender",
      "cycles",
      "lightmap",
      "baking",
      "uv2",
      "texcoord1",
      "webxr",
      "glb",
      "gltf",
      "oidn",
      "denoising",
      "rendering",
      "three-js",
      "performance",
    ],
    Body: CyclesLightmapBakeWebxrUv2Body,
  },
);
