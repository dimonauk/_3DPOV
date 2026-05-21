import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function TextureBakingNormalAoBody() {
  return (
    <>
      <p>
        Texture baking is the technique of transferring surface detail from one
        mesh onto another by casting rays between them and recording what the
        high-detail surface looks like from the low-detail surface&rsquo;s
        perspective. The result is a texture that the low-poly mesh can sample
        at render time to reproduce the visual complexity of the high-poly
        original — without carrying its vertex count. In Blender 5.1, baking
        requires <strong>Cycles</strong> (EEVEE Next does not support it) and
        uses the{" "}
        <strong>selected-to-active</strong> model: the high-poly is{" "}
        <em>selected</em> (it is the ray source), the low-poly is{" "}
        <em>active</em> (it receives the bake). The direction is fixed — you
        cannot reverse it without swapping the selection/active state. The
        low-poly must also carry a{" "}
        <strong>UV map</strong>, because baking writes into UV space, not world
        space; without UVs the operator will error immediately. See the{" "}
        <Link href="/tutorials/blender-tutorial-uv-unwrap-low-poly-stylised" className={lk}>
          UV unwrap for low-poly stylised meshes tutorial
        </Link>{" "}
        for the seam-placement and island-packing decisions that affect bake
        quality.
      </p>

      <p>
        The single most consequential setting in the Blender bake workflow is
        one that receives almost no documentation: the{" "}
        <strong>active Image Texture node</strong> in the material. The bake
        operator does not write to a filepath or a named image — it writes to
        whichever Image Texture node in the active material is simultaneously{" "}
        <code>selected</code> and set as <code>nodes.active</code>. If no such
        node is uniquely selected and active, the bake either errors or writes
        to the wrong image silently. The blueprint addresses this with a small
        helper that clears all node selections, selects the target node, sets
        it active, then calls the operator. This pattern works for every bake
        type (NORMAL, AO, DIFFUSE, EMIT) without changing any other setting.
        The complementary per-geometry technique &mdash; computing flat normals
        at the mesh level without a texture &mdash; is covered in the{" "}
        <Link href="/tutorials/blender-tutorial-faceted-custom-split-normals" className={lk}>
          custom split normals tutorial
        </Link>
        ; baking and custom normals solve the same visual problem from opposite
        directions (texture vs topology).
      </p>

      <p>
        Two colour-space decisions determine whether the baked maps are
        mathematically correct. First: bake target images must use{" "}
        <strong>Non-Color</strong> colour space, not sRGB. A tangent-space
        normal map encodes XYZ vectors packed into RGB channels as{" "}
        <code>(x+1)/2</code>. If Blender applies sRGB gamma decode (≈ 2.2
        power) during import, every packed vector is corrupted — the surface
        appears to catch light from the wrong directions, and the error is
        invisible in the Info panel. Set{" "}
        <code>img.colorspace_settings.name = &quot;Non-Color&quot;</code>{" "}
        before the bake, not after. Second: between the Image Texture node and
        the <code>Principled BSDF</code>&rsquo;s Normal input,{" "}
        <strong>a Normal Map node is mandatory</strong>. The Normal Map node
        decodes the packed{" "}
        <code>[0,1]³</code> RGB back to signed{" "}
        <code>[-1,1]³</code> XYZ tangent-space vectors. Wiring the Image
        Texture colour directly into Principled.Normal bypasses this decoding
        and produces a blue-tinted plastic appearance with no normal influence.
        This incorrect wiring is the most common beginner mistake in baking
        tutorials. The export pipeline for getting the baked GLB into Three.js
        is described in the{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
          Blender-to-site asset pipeline
        </Link>
        . The flat-shading counterpart (no bake, no UV) is covered in the{" "}
        <Link href="/tutorials/blender-tutorial-flat-shaded-faceted-normals" className={lk}>
          flat-shaded faceted normals tutorial
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-texture-baking-normal-ao",
  title:
    "Texture Baking: Normal Map + AO from High-Poly to Low-Poly in Blender 5.1",
  date: "2026-05-21",
  kind: "tutorial",
  excerpt:
    "How to bake tangent-space normal maps and ambient occlusion from a displaced high-poly sphere onto a UV-unwrapped low-poly target using Cycles selected-to-active baking in Blender 5.1, with correct Non-Color image setup and Normal Map node wiring for GLB export.",
  Body: TextureBakingNormalAoBody,
  related: [
    {
      href: "/tutorials/blender-tutorial-uv-unwrap-low-poly-stylised",
      label: "UV unwrap for low-poly stylised meshes — prerequisite",
    },
    {
      href: "/tutorials/blender-tutorial-faceted-custom-split-normals",
      label: "Custom split normals — normal control without baking",
    },
    {
      href: "/tutorials/blender-tutorial-flat-shaded-faceted-normals",
      label: "Flat-shaded faceted normals + cel-shading",
    },
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Blender → site asset pipeline",
    },
  ],
};

export const entry = buildInstructable(
  {
    time: "60 minutes",
    difficulty: "intermediate",
    prerequisites: [
      "Comfortable running Python scripts from the Blender Scripting workspace",
      "Understands UV maps — what islands and seams are (see the UV unwrap tutorial)",
      "Familiar with the Shader Editor: adding nodes, connecting sockets",
      "Has Cycles available (CPU path is fine; GPU not required)",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Cycles renderer required for baking. EEVEE Next is used only for the record.py preview render.",
      },
    ],
    steps: [
      {
        title:
          "Understand the selected-to-active model before touching any settings",
        body: "Open a fresh Blender scene. Add two overlapping UV spheres at the same position — one with a Subdivision Surface modifier (high-poly), one without (low-poly). Select the high-poly first (Shift+click), then Shift+click the low-poly to add it to the selection, then click the low-poly again without Shift to make it active (highlighted brighter). In the Render Properties → Bake panel, enable 'Selected to Active'. This is the model: selected objects (one or many) cast rays toward the active object's surface; the active object is where the bake result lands.\n\nThe extrusion distance is how far the rays are cast outward from the low-poly surface before looking for the high-poly. It must be large enough to span the gap between the two meshes at their furthest separation point. If the extrusion is too small, some ray-casts miss the high-poly entirely and produce bright-pink error pixels in the baked map. If it is too large, rays can punch through to the back face of the high-poly and bake the wrong surface. For a sphere with 0.12 m amplitude displacement, an extrusion of 0.18 m (50% margin above peak displacement) works cleanly.",
      },
      {
        title: "Build the high-poly source with bmesh + live Subsurf modifier",
        body: "Using bmesh.ops.create_uvsphere() with u_segments=32 and v_segments=16 produces 992 quads. After bm.normal_update(), each v.normal is a smooth per-vertex average normal — accurate enough to bias the sinusoidal displacement along the surface rather than globally along Z.\n\n  for v in bm_h.verts:\n      offset = AMPLITUDE * math.sin(FREQ * v.co.x) * math.cos(FREQ * v.co.y)\n      v.co  += v.normal * offset\n\nThis gives a waved, organic surface. After converting to a mesh with bm.to_mesh(), add a SUBSURF modifier at levels=2. The bake operator reads the evaluated (post-modifier) mesh from the depsgraph automatically — do NOT apply the modifier. Applying it would collapse the detail into the mesh data and prevent Blender from computing smooth normals correctly during the bake.",
      },
      {
        title: "UV-unwrap the low-poly target with Smart UV Project",
        body: "The low-poly mesh must have a UV map before baking — the bake writes colour values into UV space, not world space. Without a UV map the operator raises 'No active image found in material' (confusingly, because Blender can't resolve where to write the pixels).\n\nSwitch to Edit Mode on the low-poly, select all, and run Smart UV Project with angle_limit=66° and island_margin=0.01. This produces a mosaic of flat-angle islands that avoids stretch across the 8×8 sphere geometry. For a production asset you would replace Smart UV Project with a cylindrical unwrap plus manual pole seams: one vertical seam from top to bottom, pack the two mirrored hemispheres as separate islands. The manual approach halves the number of islands and gives cleaner island boundaries, which reduces texel bleed at bake resolution.\n\nbpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.01)\n\nThis is the same seam philosophy discussed in the UV unwrap tutorial — the bake quality is directly proportional to how efficiently the UV layout uses the texture space.",
      },
      {
        title: "Create Non-Color bake target images and select the right node",
        body: "Create two images in bpy.data.images:\n\n  img_n = bpy.data.images.new('normal_baked', width=TEX_SIZE, height=TEX_SIZE)\n  img_a = bpy.data.images.new('ao_baked',     width=TEX_SIZE, height=TEX_SIZE)\n  img_n.colorspace_settings.name = 'Non-Color'\n  img_a.colorspace_settings.name = 'Non-Color'\n\nThe Non-Color assignment must happen before the bake, not after. If you create the image in sRGB and bake into it, then switch to Non-Color, Blender will re-decode the stored pixel data and double-corrupt it.\n\nIn the material node tree, create an Image Texture node for each target. The bake operator writes to whichever Image Texture node is both selected (node.select = True) and active (nodes.active = that node). Every other Image Texture node must be deselected. The blueprint's _bake() helper manages this:\n\n  for nd in nodes:\n      nd.select = False\n  target_node.select = True\n  nodes.active       = target_node\n  bpy.ops.object.bake(type=bake_type)\n\nCall this helper once for 'NORMAL' (pointing at the normal image node), then again for 'AO' (pointing at the AO image node). The selection/active state resets between calls.",
      },
      {
        title:
          "Wire the Normal Map node between Image Texture and Principled BSDF",
        body: "After baking, connect the nodes:\n\n  links.new(tex_n.outputs['Color'], nrm.inputs['Color'])\n  links.new(nrm.outputs['Normal'],  pbsdf.inputs['Normal'])\n\nThe Normal Map node (ShaderNodeNormalMap) decodes the packed [0,1]³ RGB back to the signed [-1,1]³ tangent-space XYZ that Blender's shading engine expects. The Strength input controls how much the decoded normal deviates from the interpolated mesh normal — 1.0 is full effect. Values above 1.0 amplify the surface detail beyond what was baked; values below 1.0 blend toward the mesh's own normal.\n\nIf you connect the Image Texture Color directly to Principled.Normal without the Normal Map node, the shading engine receives values in [0,1]³ and interprets them as direction vectors pointing forward and slightly rightward — the surface appears lit identically from all angles with no normal-map influence, and the albedo has a blue-grey cast from the neutral normal colour (128,128,255 ≈ 0.5, 0.5, 1.0).\n\nThe AO map is multiplied against the base colour albedo using a MixRGB node in MULTIPLY mode. AO values of 1.0 (white) leave the albedo unchanged; values below 1.0 (grey to black in the crevices) darken it, simulating the shadow of occluded ambient light.",
      },
      {
        title: "Save textures as PNG, pack into the blend, export GLB",
        body: "After both bake passes:\n\n  img.filepath_raw = str(OUT_DIR / f'{name}.png')\n  img.file_format  = 'PNG'\n  img.save()\n  img.pack()   # embed into the .blend\n\nThe save() call writes the pixels to disk as a standalone PNG for inspection. pack() embeds the same data into the .blend file so the scene is portable without the external PNGs. For the GLB export:\n\n  bpy.ops.export_scene.gltf(\n      export_materials    = 'EXPORT',\n      export_image_format = 'WEBP',\n      ...\n  )\n\nexport_materials='EXPORT' is the flag that triggers texture export — without it the materials are exported but their Image Texture nodes are omitted. export_image_format='WEBP' transcodes both baked PNGs to WebP inside the GLB, saving ~40% over PNG for typical normal and AO content. Draco mesh compression is independent of texture compression; both can be enabled simultaneously.\n\nVerify in Don McCurdy's glTF Viewer: expand Meshes → lp_target → Primitives [0] and confirm NORMAL (normalTexture) and the AO accessor are present. In Three.js, load with GLTFLoader — the normal map is automatically applied to the MeshStandardMaterial.normalMap property.",
      },
    ],
    finalResult:
      "A GLB containing an 8×8 low-poly sphere (128 triangles, Draco-compressed) with a 512×512 WebP tangent-space normal map and 512×512 WebP AO map baked from a sinusoidal-displaced, Catmull-Clark-subdivided high-poly source. The normal map responds correctly to directional lighting in EEVEE Next, Cycles, and Three.js MeshStandardMaterial. The source .blend retains both the high-poly and low-poly objects, packed images, and full material graph for iterative re-baking.",
    variations: [
      "Bake DIFFUSE instead of NORMAL to capture the colour of a painted high-poly texture onto the low-poly: change type='DIFFUSE' and set bk.pass_filter = {'COLOR'} (omitting direct/indirect lighting contributions). This is useful when the high-poly has a painted vertex colour or procedural material that you want to transfer as a flat albedo texture.",
      "Multi-material bake: add two materials to the low-poly (face-assigned via bmesh.faces[i].material_index), one for a metallic region and one for a ceramic region. Run bake with a Roughness bake type to transfer per-region surface roughness from the high-poly material into a Roughness map. The normal map bake workflow is identical; only type and the active image node change.",
      "Increase TEX_SIZE to 2048 and BAKE_SAMPLES to 64 for production quality. At 2048 the AO map shows fine crevice detail; at 64 samples the noise is imperceptible without denoising. Add scene.cycles.use_denoising = True and set scene.cycles.denoiser = 'OPTIX' (GPU) or 'OPENIMAGEDENOISE' (CPU) to clean up the AO pass further.",
    ],
    troubleshooting: [
      {
        symptom:
          "Bake produces bright pink or cyan patches scattered across the baked map",
        cause:
          "Ray misses: cage_extrusion is smaller than the gap between the low-poly surface and the high-poly at those points. Common when displacement amplitude exceeds the extrusion distance.",
        fix: "Increase EXTRUSION to at least 1.5× the peak displacement amplitude. In the blueprint, AMPLITUDE = 0.12 and EXTRUSION = 0.18 (1.5× margin). If pink patches persist, enable bk.use_cage = True and assign a cage object that envelops both meshes.",
      },
      {
        symptom:
          "bpy.ops.object.bake() raises 'No active image found in material'",
        cause:
          "Either no Image Texture node is active in the material tree, or the node is present but not set as nodes.active (only node.select = True is not sufficient).",
        fix: "Confirm that nodes.active is set to the Image Texture node explicitly, not just node.select = True. Both must be set. Print nodes.active.name and target_node.name to the console to verify they match before the bake call.",
      },
      {
        symptom:
          "Normal map has no visible effect — surface looks flat and unlit correctly",
        cause:
          "The Image Texture Color is connected directly to Principled BSDF Normal input without a Normal Map node in between.",
        fix: "Insert a ShaderNodeNormalMap node between the Image Texture Color output and Principled.Normal. The Normal Map node is mandatory — it decodes packed [0,1]³ RGB to signed [-1,1]³ XYZ tangent vectors. Without it, the shader receives the neutral normal colour (≈ 0.5, 0.5, 1.0) as a direction vector, which points almost straight out of every face regardless of the baked content.",
      },
      {
        symptom: "Baked normal map appears washed-out or has wrong hue",
        cause:
          "Image colorspace_settings.name was left on 'sRGB' (the default for new images). Blender applies gamma decode to the stored pixel data on load, corrupting the packed XYZ vectors.",
        fix: "Set img_n.colorspace_settings.name = 'Non-Color' before the bake. If the bake has already run in sRGB, delete the image, recreate with Non-Color, and re-bake.",
      },
    ],
  },
  base,
);
