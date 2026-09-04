/**
 * lib/atelier/chambers.ts — Single registry of every /atelier chamber.
 *
 * Source of truth for the atelier index. Categorised by what the
 * operator DOES with the chamber, not by tech stack, per the
 * holoflow-chambers-strategy memory:
 *
 *   "Each chamber starts from a real personal-workflow need …
 *    the public chamber is always a subset of the bench tool, never
 *    a superset."
 *
 * Adding a chamber: append below. Slug = directory name under
 * app/atelier/. Status = "live" when the chamber renders something
 * usable; "placeholder" when it's a stub / awaits bench wiring.
 */

export type ChamberCategory =
  | "make-3d"
  | "paint-and-draw"
  | "ai-generation"
  | "pattern-and-textile"
  | "image-tools"
  | "scene-and-camera";

export const CHAMBER_CATEGORIES: ReadonlyArray<{
  id: ChamberCategory;
  label: string;
  blurb: string;
}> = [
  {
    id: "make-3d",
    label: "Make 3D",
    blurb: "Sculpt, generate, or grow three-dimensional shapes.",
  },
  {
    id: "paint-and-draw",
    label: "Paint + draw",
    blurb: "Direct creative tools — brushstrokes, trails, sprites.",
  },
  {
    id: "ai-generation",
    label: "AI generation",
    blurb: "Models that emit images, video, prompts, garments.",
  },
  {
    id: "pattern-and-textile",
    label: "Pattern + textile",
    blurb: "Surface patterns for the wall and the print bureau.",
  },
  {
    id: "image-tools",
    label: "Image tools",
    blurb: "Quick utilities — resize, strip, pixel, detect.",
  },
  {
    id: "scene-and-camera",
    label: "Scene + camera",
    blurb: "Environments, rigs, evolution, photographic studies.",
  },
];

export type Chamber = {
  slug: string;
  title: string;
  /** One short sentence, plain English, no marketing fluff. What the operator DOES. */
  blurb: string;
  category: ChamberCategory;
  /** "live" = renders something usable. "placeholder" = stub / awaits bench wiring. */
  status: "live" | "placeholder";
  /** Optional: where the bench tool this chamber is the public face of lives. */
  benchSource?: string;
};

export const CHAMBERS: ReadonlyArray<Chamber> = [
  // ---------- Make 3D ----------
  {
    slug: "sculpture-gallery",
    title: "Sculpture Gallery",
    blurb: "Browse the bench's working stock of meshes; spin them in the viewport.",
    category: "make-3d",
    status: "live",
  },
  {
    slug: "mesh-studio",
    title: "Mesh Studio",
    blurb: "The bench's mesh workshop online — pixel art, palette, gallery, firmware shelves.",
    category: "make-3d",
    status: "live",
    benchSource: "apps/holoflow-mesh-studio",
  },
  {
    slug: "voxel-world",
    title: "Voxel World",
    blurb: "Build worlds out of cubes; carve and export.",
    category: "make-3d",
    status: "live",
  },
  {
    slug: "isosurface",
    title: "Isosurface",
    blurb: "Marching-cubes preview — slide a threshold, watch the shell.",
    category: "make-3d",
    status: "live",
  },
  {
    slug: "lithophane",
    title: "Lithophane",
    blurb: "Photo to backlit relief; download the STL.",
    category: "make-3d",
    status: "live",
  },
  {
    slug: "waveguide-forge",
    title: "Waveguide Forge",
    blurb: "Gyroid jewellery and optical waveguides. Light bends through the lattice.",
    category: "make-3d",
    status: "live",
    benchSource: "apps/waveguide-forge",
  },
  {
    slug: "modal-lattice",
    title: "Modal Lattice",
    blurb: "Lattice deformer with four interpolation kernels. Built on a Blender addon's affordances.",
    category: "make-3d",
    status: "live",
    benchSource: "apps/prototypes/modal-lattice-resolution-v2",
  },
  {
    slug: "image-to-mesh",
    title: "Image to Mesh",
    blurb: "Drop an image, get a depth-extruded mesh.",
    category: "make-3d",
    status: "live",
  },
  {
    slug: "image-to-stl",
    title: "Image to STL",
    blurb: "Same shape as image-to-mesh but exporting an STL for the slicer.",
    category: "make-3d",
    status: "live",
  },
  {
    slug: "triposr",
    title: "TripoSR",
    blurb: "Single image to 3D mesh via TripoSR. Drag in a photo, download a GLB.",
    category: "make-3d",
    status: "live",
    benchSource: "engines/TripoSR",
  },
  {
    slug: "cube-composer",
    title: "Cube Composer",
    blurb: "Cubemap-projection 360° composer — face-by-face autoregressive build.",
    category: "make-3d",
    status: "live",
    benchSource: "engines/CubeComposer",
  },
  {
    slug: "trellis",
    title: "TRELLIS",
    blurb: "Text (or text + image) to 3D mesh via Microsoft's TRELLIS. Type a prompt, get a GLB.",
    category: "make-3d",
    status: "live",
    benchSource: "engines/TRELLIS",
  },
  {
    slug: "poi-sculptor",
    title: "Poi Sculptor",
    blurb: "Paint a poi-trail sculpture; export as printable mesh.",
    category: "make-3d",
    status: "live",
  },
  {
    slug: "shape-of-it",
    title: "Shape of It",
    blurb: "Procedural shape compositions — branch, labyrinth, spine, threads.",
    category: "make-3d",
    status: "live",
  },
  {
    slug: "prism-lattice",
    title: "Prism Lattice",
    blurb: "A geodesic sphere of instanced acrylic struts, breathing and cycling through the spectrum.",
    category: "make-3d",
    status: "live",
  },
  {
    slug: "breeding-floor",
    title: "Breeding Floor",
    blurb: "Twelve sculpture genomes per generation. Favourite and breed; the lineage builds underneath.",
    category: "make-3d",
    status: "live",
    benchSource: "evolution_line.py + the SculptureGenome canon",
  },
  {
    slug: "evolution",
    title: "Evolution Suite",
    blurb: "The fourteen stations the bench breeds with — performance gateway, crossbreeding, fitness arena.",
    category: "make-3d",
    status: "live",
  },

  // ---------- Paint + draw ----------
  {
    slug: "silk-brush",
    title: "Silk Brush",
    blurb: "Three-dimensional brush trails. WebXR-ready — step inside the painting.",
    category: "paint-and-draw",
    status: "live",
    benchSource: "apps/silk-brush-canvas",
  },
  {
    slug: "lightpainting-forge",
    title: "Lightpainting Forge",
    blurb: "Photo + segmentation + depth become a marching-cubes light volume.",
    category: "paint-and-draw",
    status: "live",
    benchSource: "apps/lightpainting-forge",
  },
  {
    slug: "light-weaver",
    title: "Light Weaver",
    blurb: "Luminous trails through space. Six shaders — flame, plasma, aurora, mycelium, ink, neon.",
    category: "paint-and-draw",
    status: "live",
    benchSource: "apps/Light_Weiver",
  },
  {
    slug: "sprite-designer",
    title: "Sprite Designer",
    blurb: "Pixel-art editor with palette tools, photo→sprite, onion-skin timeline, GIF / PNG / BMP export.",
    category: "paint-and-draw",
    status: "live",
    benchSource: "apps/sprite-designer",
  },
  {
    slug: "pixelify",
    title: "Pixelify",
    blurb: "Convert any image to pixel-art with palette quantisation.",
    category: "paint-and-draw",
    status: "live",
  },

  // ---------- AI generation ----------
  {
    slug: "imagen",
    title: "Imagen",
    blurb: "Text-to-image via Google's Imagen — same model the bench uses.",
    category: "ai-generation",
    status: "live",
  },
  {
    slug: "image-edit",
    title: "Image Edit",
    blurb: "Reference-image editing — drop two photos, ask Gemini to combine them.",
    category: "ai-generation",
    status: "live",
  },
  {
    slug: "veo",
    title: "Veo",
    blurb: "Text-to-video via Google Veo. Async polling; clip lands when it's ready.",
    category: "ai-generation",
    status: "live",
  },
  {
    slug: "co-drawing",
    title: "Co-Drawing",
    blurb: "Sketch a line, ask Gemini to draw back in the same style. The canvas keeps going.",
    category: "ai-generation",
    status: "live",
    benchSource: "apps/gemini-co-drawing",
  },
  {
    slug: "comfy-layered",
    title: "Comfy Layered",
    blurb: "ComfyUI workflows with named layers. The bench's queue, online.",
    category: "ai-generation",
    status: "live",
    benchSource: "apps/comfy-layered-ai-ui",
  },
  {
    slug: "dollhouse",
    title: "Dollhouse",
    blurb: "1:6-scale miniature-photography prompt composer. Pick character / outfit / action; render via Imagen.",
    category: "ai-generation",
    status: "live",
    benchSource: "apps/prototypes/dollhouse-1",
  },
  {
    slug: "inverse-kata",
    title: "Inverse Kata",
    blurb: "Sketch a trail; the chamber matches it against the named-kata library and the eight Laban Basic Efforts.",
    category: "ai-generation",
    status: "live",
  },
  {
    slug: "flag-loom",
    title: "Flag Loom",
    blurb: "Hang any image as a silk cloth flag; reshape it by dragging vertices. The studio's default image-display surface.",
    category: "paint-and-draw",
    status: "live",
  },
  {
    slug: "lightpaint",
    title: "Lightpaint",
    blurb: "Animated light-painting editor. Drop long-exposure frames, scrub the timeline, export MP4. Phase 1 of the multi-frame compositor.",
    category: "paint-and-draw",
    status: "live",
  },
  {
    slug: "voxel-image",
    title: "Voxel Image",
    blurb: "Each pixel becomes one voxel in 3D space. Plane or sphere layout. Optional pixel-stream animation makes voxels travel to the opposite edge and back.",
    category: "paint-and-draw",
    status: "live",
  },

  // ---------- Pattern + textile ----------
  {
    slug: "pattern-prototype",
    title: "Pattern Prototyper",
    blurb: "Gemini-paired pattern designer for fabric and wall art. Four modes, sketch and refine.",
    category: "pattern-and-textile",
    status: "live",
    benchSource: "apps/prototypes/threadlogic-ai-pattern-prototyper",
  },
  {
    slug: "quilt-designer",
    title: "Quilt Designer",
    blurb: "Traditional quilt blocks composed into wall art. SVG / PNG export, yardage calculator.",
    category: "pattern-and-textile",
    status: "live",
    benchSource: "apps/prototypes/ai-quilting-designer",
  },
  {
    slug: "clothing-reverse",
    title: "Clothing Reverse",
    blurb: "Upload a garment photo, get a sewing-pattern spec back. Pairs with the bureau.",
    category: "pattern-and-textile",
    status: "live",
    benchSource: "apps/clothing-reverse-engineer",
  },

  // ---------- Image tools ----------
  {
    slug: "image-resize",
    title: "Image Resize",
    blurb: "Pillow LANCZOS resize on the bench — width, height, longest-edge, fit modes, format conversion.",
    category: "image-tools",
    status: "live",
  },
  {
    slug: "remove-bg",
    title: "Remove BG",
    blurb: "Background removal — alpha cutout for any image.",
    category: "image-tools",
    status: "live",
  },
  {
    slug: "exif-strip",
    title: "EXIF Strip",
    blurb: "Strip metadata from any image. Privacy quick-fix before publishing.",
    category: "image-tools",
    status: "live",
  },
  {
    slug: "pixeldetector",
    title: "Pixel Detector",
    blurb: "Detect a pixel-art image's native resolution and palette.",
    category: "image-tools",
    status: "live",
  },
  {
    slug: "probe",
    title: "Probe",
    blurb: "Diagnostic probe for the atelier toolchain. Reads what's installed where.",
    category: "image-tools",
    status: "live",
  },
  {
    slug: "print-check",
    title: "Print Check",
    blurb: "Drop a photo; the chamber tells you the largest print size that's safe on the studio's A2 fine-art pipeline, and flags 360 sources for reframing.",
    category: "image-tools",
    status: "live",
  },

  // ---------- Scene + camera ----------
  {
    slug: "procedural-city",
    title: "Procedural City",
    blurb: "Generated urban environments — buildings, ground, traffic.",
    category: "scene-and-camera",
    status: "live",
  },
  {
    slug: "aura-tron",
    title: "Aura-Tron",
    blurb: "Neon-grid landscape backdrop. Synthwave aesthetic, large screen behind the avatar.",
    category: "scene-and-camera",
    status: "live",
  },
  {
    slug: "rig-simulator",
    title: "Rig Simulator",
    blurb: "Multi-camera POV-rig preview. Tune layout before printing the actual rig.",
    category: "scene-and-camera",
    status: "live",
  },
  {
    slug: "cctv-cross-reference",
    title: "CCTV Cross-Reference",
    blurb: "Cross-reference CCTV grabs against splat reconstructions of the same place.",
    category: "scene-and-camera",
    status: "live",
  },
  {
    slug: "algorithms",
    title: "Algorithms",
    blurb: "Catalogue of jewellery + sculpture algorithms with playable examples.",
    category: "scene-and-camera",
    status: "live",
  },
  {
    slug: "shader-station",
    title: "Shader Station",
    blurb:
      "Author GLSL on a textured sphere. 28 seed presets, audio-reactive uniforms, share-via-QR between devices, 2048×1024 equirect PNG export.",
    category: "paint-and-draw",
    status: "live",
    benchSource: "D:/.github/Shadrerapp ShaderEditor (Apache-2.0)",
  },
  {
    slug: "gaze-heatmap",
    title: "Gaze Heatmap",
    blurb:
      "Replay recorded gaze JSON on an equirect canvas. Heatmap / foveal-mask / scanpath modes, dwell-zone clustering, scanpath statistics.",
    category: "image-tools",
    status: "live",
    benchSource: "D:/.github/Shadrerapp GazeHeatmap (Apache-2.0)",
  },
  {
    slug: "wall-piece-designer",
    title: "Wall Piece Designer",
    blurb:
      "Breed a single waveguide wall sculpture via the studio's evolution loop. 12 candidates per generation; mutate / breed / keep the one that holds the room.",
    category: "make-3d",
    status: "live",
    benchSource: "lib/evolution + lib/assets/genomes (studio canon)",
  },
  {
    slug: "wall-array-designer",
    title: "Wall Array Designer",
    blurb:
      "Breed a 9-piece wall array. Shared parent lineage means the tiles read as a rhythm; commissioned as one belt-printed slot.",
    category: "make-3d",
    status: "live",
    benchSource: "lib/evolution + lib/assets/genomes (studio canon)",
  },
  {
    slug: "jewellery-designer",
    title: "Jewellery Designer",
    blurb:
      "Breed a wearable waveguide. Same engine, biased for gem-rich genomes + wearable scale. Pendant / earring / ring mounts.",
    category: "make-3d",
    status: "live",
    benchSource: "lib/evolution + lib/assets/genomes (studio canon)",
  },
];

// ---------- Helpers ----------

export function chambersByCategory(cat: ChamberCategory): ReadonlyArray<Chamber> {
  return CHAMBERS.filter((c) => c.category === cat);
}

export function getChamber(slug: string): Chamber | undefined {
  return CHAMBERS.find((c) => c.slug === slug);
}

export const CHAMBER_COUNT = CHAMBERS.length;
