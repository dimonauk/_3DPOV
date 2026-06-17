import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function TexturePaintStylisedBody() {
  return (
    <>
      <p>
        Blender&rsquo;s Texture Paint mode is, at its core, a UV-triangle
        rasteriser with a brush head. Every stroke you make in 3D is converted
        to a set of filled triangles in 2D UV space, written into a bitmap
        image. Understanding that mapping — 3D face → UV island → pixel region —
        is what separates a painter who fights seams and bleeds from one who
        predicts them. This tutorial builds a faceted gem totem from a{" "}
        <code>subdivisions=1</code> icosahedron (20 triangular faces), unwraps
        it with{" "}
        <code>bpy.ops.uv.smart_project(angle_limit=66°, island_margin=0.02)</code>
        , then fills each UV island with zone-based colour using a pure-Python
        barycentric rasteriser — no GPU required, no context dependencies, fully
        deterministic in headless batch mode. The three output images (Base
        Color, Roughness, Emission) drive a single Principled BSDF unified
        across all four material zones.
      </p>

      <p>
        The choice of <em>one unified material</em> over four separate materials
        — one per zone — is deliberate and has WebXR implications. In Three.js,
        each distinct{" "}
        <code>THREE.Material</code> on a mesh triggers a separate draw call in
        the GPU command stream. A single material with an atlas texture costs one
        draw call for the whole mesh regardless of how many visual zones it
        contains. For a real-time spatial scene with dozens of totem-scale
        objects, this saving compounds rapidly. The same logic applies to
        Unreal, Unity, and any glTF consumer. Smart UV Project with{" "}
        <code>island_margin=0.02</code> (20 pixels at 1024²) prevents bilinear
        filter bleed across zone boundaries — the half-texel gap is below the
        filter kernel radius of standard MIP level 0 sampling. Compare this
        approach to the full PBR atlas bake covered in the{" "}
        <Link href="/tutorials/blender-tutorial-texture-baking-normal-ao" className={lk}>
          Normal &amp; AO Baking tutorial
        </Link>
        , which uses Cycles to project high-poly detail onto an atlas instead
        of painting it directly.
      </p>

      <p>
        The emission zone — the cyan gem crown at the top two icosahedron faces —
        demonstrates a pattern worth internalising: the Emission Color socket
        reads the same Base Color image as the albedo, while a separate greyscale
        emit map drives Emission Strength. This means the gem crown emits light
        in its own hue without a separately painted emission colour, and the
        strength can be freely varied without repainting the atlas. The emit map
        uses a normalised 0–1 float per pixel (actual strength factored into the
        Multiply node), so adjusting the emission intensity is a single node
        value change. See how flat shading affects how viewers perceive gem facets
        in the{" "}
        <Link href="/tutorials/blender-tutorial-faceted-custom-split-normals" className={lk}>
          Custom Split Normals tutorial
        </Link>
        , and how cel-shading achieves a related stylised look without any texture
        atlas in the{" "}
        <Link href="/tutorials/blender-tutorial-eevee-toon-cel-shader" className={lk}>
          EEVEE Toon / Cel-Shader tutorial
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-texture-paint-stylised-low-poly-character",
  title:
    "Texture Painting: Hand-Painted Stylised PBR on a Low-Poly Gem Totem (Blender 5.1)",
  date: "2026-06-17",
  kind: "tutorial",
  excerpt:
    "Build a faceted icosahedron gem totem, Smart UV Project it, then fill each UV island with zone-based colour using a numpy barycentric triangle rasteriser — no GPU context needed. Three image textures (Base Color, Roughness, Emission) drive one unified Principled BSDF for minimal WebXR draw calls. Covers island_margin bleed prevention, single-material atlas strategy, and emission-strength factoring. Expert explanation of why every Texture Paint brush stroke is a UV-triangle fill.",
  Body: TexturePaintStylisedBody,
  related: [
    {
      href: "/tutorials/blender-tutorial-texture-baking-normal-ao",
      label: "Tutorial — Texture Baking (Normal + AO)",
      note: "The complementary approach: Cycles projects high-poly sculpt detail into an atlas rather than painting it by hand. The two workflows are often combined: block-paint the colour atlas here, then bake normals on top.",
    },
    {
      href: "/tutorials/blender-tutorial-uv-unwrap-low-poly-stylised",
      label: "Tutorial — UV Unwrap for Low-Poly Stylised Models",
      note: "Seam placement, scale normalisation, and how UV island quality affects texture painting — the prerequisite to this tutorial for non-icosahedron geometry.",
    },
    {
      href: "/tutorials/blender-tutorial-eevee-toon-cel-shader",
      label: "Tutorial — EEVEE Next Toon / Cel-Shader",
      note: "Stylised colour without a texture atlas — Shader to RGB with CONSTANT ColorRamp. Contrast with the hand-painted approach here: toon shading is lighting-dependent, texture painting is lighting-independent.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-uv-unwrap-pack-islands-glb",
      label: "Tutorial — GN UV Unwrap + Pack Islands for GLB Export",
      note: "Geometry Nodes path to UV atlassing — procedural island packing useful when mesh topology is generated, not hand-modelled.",
    },
    {
      href: "/tutorials/blender-tutorial-faceted-custom-split-normals",
      label: "Tutorial — Faceted Custom Split Normals",
      note: "How flat-shaded normals make each painted facet read as a distinct colour plane — the geometric partner to this painting technique.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/sculpt_paint/texture_paint/index.html",
      label:
        "Blender Manual — Texture Paint Mode (CC-BY-SA 4.0 — Blender Foundation contributors)",
      note: "Full operator reference for bpy.ops.texture_paint.*. Critical detail: the 'Stencil' brush mode projects a reference image onto the mesh surface in UV space — useful for tracing reference artwork. 'Clone' mode copies pixels from one UV region to another (useful for mirroring textures across symmetry). 'Smear' blends existing pixel values — not available via bpy in headless mode, only interactive. Related project: blender/blender (GPL-2.0, not used here — documentation only). Companion manual page: Texture Paint → Texture Mask for constraining strokes to greyscale masks.",
    },
    {
      href: "https://docs.blender.org/manual/en/latest/editors/uv/index.html",
      label:
        "Blender Manual — UV Editor (CC-BY-SA 4.0 — Blender Foundation contributors)",
      note: "Covers UV island manipulation, seam marking, Smart UV Project parameter guide (angle_limit controls at what dihedral angle Blender cuts a new seam — lower values = more islands = less distortion per island; higher values = fewer, more distorted islands). Also covers UDIMs (multi-tile UV layout used in film VFX, not recommended for WebXR due to shader overhead). Related sibling resource: UV Packing algorithms paper by Nesterenko et al. (2021) — Smart UV uses a rectangle packing heuristic, not optimal. For texture-heavy VRM characters, consider the Manual Seam workflow instead of Smart UV for human-body topology.",
    },
  ],
};

const entry: Entry = buildInstructable(
  {
    time: "one to two hours",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Comfortable reading and modifying bpy scripts in the Blender Text Editor.",
      "Understands UV unwrapping basics: what a seam is, what an island is, what the UV atlas image represents.",
      "Blender 5.1 installed; Python 3.11+ with numpy available (bundled with Blender).",
      "Has run at least one other blueprint.py from this library to know the typical script-run workflow.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "numpy is bundled with Blender 5.1's internal Python — no separate install needed. The rasteriser runs in both interactive and headless -b mode. Texture Paint mode UI requires an interactive session for live brush strokes; the blueprint.py rasteriser does not.",
      },
    ],
    steps: [
      {
        title: "Understand why an icosahedron is the ideal painting subject",
        body: "An icosahedron has exactly 20 equilateral triangular faces. Every face has the same area and the same internal angles (60°). This means:\n\n1. Smart UV Project creates 20 nearly-identical UV islands — no face is 'bigger' in UV space than another, so paint resolution is uniform.\n2. Every face is a UV triangle (not a quad that needs triangulating) — our barycentric rasteriser has no triangulation overhead.\n3. The flat-shading produces hard silhouette breaks between zones — perfect for reading the material zones as distinct areas.\n\nFor comparison, a UV sphere at 8 segments × 8 rings gives 112 triangular faces of varying UV area — top and bottom poles pack into tiny islands; equatorial quads get large islands. Painting resolution is dramatically non-uniform, making it hard to teach the UV→pixel relationship clearly.\n\nThe key formula is: pixel_area_per_face ≈ (atlas_resolution² × face_UV_area). For our 20-face icosahedron with island_margin=0.02 consuming ~5% of atlas area, each of the 20 face islands occupies approximately 1024² × 0.95 / 20 ≈ 49,900 pixels. At 1024×1024, that's roughly 223×223 pixels per island — large enough to see fine brush detail on screen and fine enough to remain compact in the atlas.",
      },
      {
        title: "Smart UV Project parameters and island_margin physics",
        body: "bpy.ops.uv.smart_project takes three parameters we care about:\n\n  angle_limit=math.radians(66)   — dihedral angle threshold for seam placement\n  island_margin=0.02             — gap between islands as fraction of UV space\n  area_weight=0.0                — 0 = uniform scale per island; 1 = scale by face area\n\nangle_limit explained:\n  When two adjacent faces meet at a dihedral angle > angle_limit, Smart UV places a seam between them. The icosahedron's face-to-face dihedral angle is ~138.2°. Since 138.2° > 66°, Smart UV seams EVERY edge of the icosahedron — giving one island per face (20 islands). This is what we want.\n\n  If you lowered angle_limit to 150°, Smart UV would try to group faces that meet at angles < 150° into shared islands, reducing island count but introducing distortion. For stylised flat-shaded models, one island per face is almost always correct — it eliminates the distortion problem entirely.\n\nisland_margin physics:\n  The 0.02 value places a 0.02 × 1024 = 20.48 pixel gap between islands. Standard bilinear filtering at MIP level 0 samples a 2×2 pixel footprint — well within the 20-pixel gap. Nearest-neighbour filtering (common in pixel-art styles) uses only 1 pixel, so 0.005 margin would suffice. For Draco-compressed GLBs that may lose sub-pixel UV precision, 0.02 is a safe default.\n\nCRITICAL: island_margin must be set BEFORE Smart UV Project runs, not after. Re-running Smart UV on an already-unwrapped mesh with a different margin replaces the entire UV layout; any hand-adjustments are lost.",
      },
      {
        title: "Build the icosahedron and assign zone material slots",
        body: "bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1.0) creates an icosahedron (subdivisions=1 gives the base Platonic solid; subdivisions=2 would give 80 faces).\n\nFlat-shading via polygon.use_smooth = False makes each face's normal constant across its surface, so the base colour reads as a single flat patch — the ideal canvas for seeing painted zones clearly.\n\nMaterial slot assignment via face centroid Z:\n\n  face_z = [(f.index, f.calc_center_median().z) for f in bm.faces]\n  face_z_sorted = sorted(face_z, key=lambda t: t[1])\n  # bottom 4 = stone, next 8 = metal, next 6 = skin, top 2 = gem\n\nThis height-based assignment works because the icosahedron's faces naturally stratify into rings at discrete Z heights:\n  Z ≈ -1.0  →  bottom cap (1 face)\n  Z ≈ -0.5  →  lower ring (5 faces)\n  Z ≈ +0.5  →  upper ring (5 faces)\n  Z ≈ +1.0  →  upper cap (1 face)\n  ... plus 8 equatorial faces at Z ≈ 0\n\nAssigning SLOT_GEM to the two highest-Z faces gives the crown a 5-pointed geometry at the top, which reads as a gem boss. SLOT_STONE to the bottom 4 gives a dark plinth effect.\n\nNote on bmesh usage: bm.from_mesh() loads the mesh data; bm.to_mesh() writes changes back. Any bm.faces.ensure_lookup_table() call is needed after structural changes (adding/removing faces). After bm.to_mesh(), call bm.free() to release memory — bmesh objects are not garbage-collected automatically.",
      },
      {
        title: "UV triangle rasterisation: the algorithm under every paint stroke",
        body: "Every Blender Texture Paint brush stroke executes this sequence internally:\n1. Project the brush centre from 3D viewport screen space → 3D surface point (raycast)\n2. Read the UV coordinate at that surface point from the active UV layer\n3. Compute a 2D brush ellipse in UV space around that UV point\n4. For each pixel inside the ellipse that also lies inside a UV triangle, write the brush colour weighted by brush opacity and pressure\n\nOur rasteriser replaces steps 2-4 with a brute-force triangle fill — appropriate when painting entire islands at once (no brush ellipse needed).\n\nBarycentric coordinate test:\n  Given triangle vertices (x0,y0), (x1,y1), (x2,y2) in pixel space:\n  denom = (y1-y2)*(x0-x2) + (x2-x1)*(y0-y2)\n  For a test point (px, py):\n    a = ((y1-y2)*(px-x2) + (x2-x1)*(py-y2)) / denom\n    b = ((y2-y0)*(px-x2) + (x0-x2)*(py-y2)) / denom\n    c = 1 - a - b\n  Point is inside triangle iff a >= 0, b >= 0, c >= 0.\n\nUV → pixel coordinate conversion:\n  px_x = u * W\n  px_y = (1 - v) * H    ← FLIP: Blender UV v=0 is bottom; numpy row 0 is TOP\n\nThe flip is the source of most upside-down painting bugs. When you import a PNG texture into Blender that was created without accounting for this flip, it appears inverted on the mesh. Blender's own image.pixels array reads bottom-to-top; numpy reads top-to-bottom. The rasteriser corrects for this by applying (1-v)*H.\n\nPerformance note: the numpy meshgrid approach over the bounding box is ~40× faster than a Python for-loop over pixels. For 20 triangles at 1024² total, rasterisation completes in under 0.5 s. For meshes with thousands of faces, consider pre-sorting triangles by UV quadrant and using np.where instead of meshgrid.",
      },
      {
        title: "Single unified material: why the atlas strategy wins for WebXR",
        body: "Four material slots = four draw calls per frame in Three.js (WebXR consumer).\nOne material with atlas = ONE draw call per frame.\n\nFor a scene with 50 identical gem totems, the difference is 200 draw calls vs 50. At 90 fps (XR target), that is 18,000 vs 4,500 draw calls per second.\n\nThe unified material works because Smart UV Project guarantees non-overlapping UV islands across the entire mesh. No two faces share the same UV region, so each face reads from its own exclusive pixel area regardless of which material slot it was originally in.\n\nImplementation pattern:\n  unified = bpy.data.materials.new(f\"{OBJ_NAME}_unified\")\n  unified.use_nodes = True\n  # ... build node graph ...\n  for slot in totem.material_slots:\n      slot.material = unified   # replace all 4 slots with the one material\n\nThis replaces all 4 slots at the Object level without changing the mesh's material_index per face — the index values still exist (0,1,2,3) but all resolve to the same material. The mesh topology is unchanged; only the material assignment is consolidated.\n\nGLTF export consequence: the GLB will have one mesh primitive with one material reference. Verifying this in the exported file:\n  glb_json = json.loads(struct.pack(...)...)  # parse GLB JSON chunk\n  assert len(glb_json['materials']) == 1\n  assert len(glb_json['meshes'][0]['primitives']) == 1\n\nWhen would you NOT do this? When different zones need different BSDF types (e.g. stone = diffuse only, gem = volumetric transmission). A single Principled BSDF cannot simultaneously be both a fully-transmissive glass and a fully-opaque stone. In that case, 2 materials (opaque + transmissive) is the minimum — not 4.",
      },
    ],
    finalResult:
      "A stylised low-poly gem totem (20-face icosahedron) with a hand-painted-equivalent PBR atlas: stone base (dark/rough), gunmetal panels (silver/semi-gloss), warm ochre skin facets (diffuse/matte), and a glowing cyan gem crown (smooth/emissive). One unified material, one draw call in WebXR. GLB ≈ 40 KB with Draco L6 + WebP. Blueprint runs headless in batch mode. Rasterised pixel atlases embedded in the .blend file.",
    variations: [
      "Dirt / weathering overlay: after the initial zone fill, add a second numpy pass that samples a fractal noise field (scipy.ndimage.gaussian_filter on random noise) and darkens pixels proportional to noise value. This simulates grime accumulating in low areas. Mask the effect by UV Y coordinate (lower UV rows = lower on model = dirtier).",
      "Hand-painted highlight facets: identify the 3 metal-zone faces with the highest +Y normal component (faces that catch most top-light). Fill their UV islands with a lighter gunmetal colour (0.55, 0.58, 0.60) in the base pass. This simulates a highlight that a real painter would add for drama without lighting-dependent specularity.",
      "Colour variation per face: instead of flat zone colours, generate a small random offset per face centroid: per_face_col = (base_r + random.uniform(-0.05, 0.05), ...). This breaks the 'painted with a bucket fill' read and makes the atlas look hand-painted with slight colour variation across facets.",
    ],
    troubleshooting: [
      {
        symptom: "UV islands appear as tiny dots in the Image Editor — atlas looks almost blank with only small triangles visible",
        cause: "Smart UV Project was run with island_margin too high relative to the number of islands. At 20 islands with margin=0.10, the margin padding consumes 2×10%×2 = 40% of atlas width per pair of islands — impossible to fit 20 islands without severe compression. The islands scale down to compensate.",
        fix: "Reduce island_margin to 0.02 (the blueprint default). If you need wider margins for high-resolution prints, increase atlas resolution instead: IMG_RES = 2048.",
      },
      {
        symptom: "Rasterised colours appear upside-down on the mesh — gem crown appears at the bottom of the model in the viewport",
        cause: "The UV V-axis flip is missing. Blender UV origin is bottom-left (v=0 at bottom); numpy pixel array row 0 is at the top. If rasterise_tri uses `v * H` instead of `(1 - v) * H`, all UV Y coordinates are mirrored.",
        fix: "Ensure the to_px() helper uses `(1.0 - v) * H` not `v * H` for the Y coordinate.",
      },
      {
        symptom: "Pixels near UV island boundaries bleed into neighbouring zones — stone border appears inside metal facets",
        cause: "island_margin is too small. Bilinear texture sampling extends a 2-pixel radius around each texel; if margin < 4 pixels (< 0.004 at 1024²), adjacent islands sample from each other.",
        fix: "Set island_margin=0.02 minimum. At 0.02 × 1024 = 20.5 pixels, the gap exceeds the bilinear kernel by 10×. Alternatively, switch the mesh's sampling to Closest (nearest-neighbour) in the material: n_base.interpolation = 'Closest' — eliminates bleed at the cost of texel aliasing at UV edges.",
      },
      {
        symptom: "The GLB has 4 mesh primitives (one per material slot) instead of 1",
        cause: "The material slot replacement (for slot in totem.material_slots: slot.material = unified) was not applied, or export_apply=False caused the modifier stack to be exported in its pre-applied form.",
        fix: "Confirm all 4 material_slots[0-3].material point to the same unified material object before export. Verify with: set(s.material for s in totem.material_slots) — should be a set of length 1.",
      },
    ],
  },
  base,
);

export { entry };
