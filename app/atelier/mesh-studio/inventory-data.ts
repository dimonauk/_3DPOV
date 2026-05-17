/**
 * app/atelier/mesh-studio/inventory-data.ts — Static data registries
 * for the Pixelorama-extension preview + the Hangar tool inventory.
 *
 * Extracted from mesh-studio-client.tsx. Pure data; no React.
 * The operator edits these to add a new tool or a new extension —
 * touching one file instead of scrolling past 800 lines of UI.
 */

export const PIXELORAMA_EXTENSIONS_PREVIEW: ReadonlyArray<{
  id: string;
  category: string;
  what: string;
  featured?: boolean;
}> = [
  {
    id: "Voxelorama",
    category: "3D",
    what: "Generate 3D voxel meshes from layered pixel art. Export to .obj for the sculpture pipeline.",
    featured: true,
  },
  {
    id: "Skeletor",
    category: "Animation",
    what: "Bone-rig pixel sprites. Hand-keyframed animation without redrawing every cell.",
    featured: true,
  },
  {
    id: "LospecPaletteImporter",
    category: "Palette",
    what: "Pull any palette from lospec.com directly into the swatches panel.",
    featured: true,
  },
  { id: "PixelLab", category: "Filter", what: "Procedural pixel art filters: outlines, dithering presets, palette snap." },
  { id: "FrameTagger", category: "Animation", what: "Name + colour-code frame ranges for cleaner export." },
  { id: "TileEditor", category: "Tiles", what: "Auto-tile mode for terrain sprites." },
  { id: "AsepriteImport", category: "I/O", what: "Read .aseprite files directly." },
  { id: "PNG-strip-split", category: "I/O", what: "Split horizontal spritesheets into one PNG per frame." },
];

export const STATIC_INVENTORY: ReadonlyArray<{
  category: string;
  items: ReadonlyArray<{ name: string; what: string; path: string }>;
}> = [
  {
    category: "Pixel art pipeline",
    items: [
      { name: "pixeldetector", what: "Detect grid-aligned pixel art", path: "D:\\The_Hangar\\tools\\pixeldetector" },
      { name: "Image-to-Pixel", what: "Convert any image to pixel art", path: "D:\\The_Hangar\\tools\\Image-to-Pixel" },
      { name: "ComfyUI-PixelArt-Detector", what: "ComfyUI custom node for sprite output", path: "engines\\comfyui\\custom_nodes\\ComfyUI-PixelArt-Detector" },
    ],
  },
  {
    category: "3D / mesh",
    items: [
      { name: "voxel2mesh", what: "Voxel grid → mesh", path: "tools\\voxel2mesh" },
      { name: "mesh-voxelization", what: "Mesh → voxel grid", path: "tools\\mesh-voxelization" },
      { name: "nii2mesh", what: "NIfTI volume → mesh + niimath QEM", path: "tools\\nii2mesh" },
      { name: "softxels", what: "Soft voxel physics", path: "tools\\softxels" },
      { name: "webgpu-marching-cubes", what: "GPU-accelerated marching cubes", path: "tools\\webgpu-marching-cubes" },
      { name: "lithophane", what: "Image → relief STL (used by the lithophane chamber)", path: "tools\\lithophane" },
      { name: "image-to-stl", what: "Alt image-to-STL pipeline", path: "tools\\image-to-stl" },
    ],
  },
  {
    category: "Image AI",
    items: [
      { name: "InstantMesh", what: "Image → 3D mesh (alt to TRELLIS)", path: "tools\\InstantMesh" },
      { name: "Unique3D", what: "Image → 3D (mesh + texture)", path: "tools\\Unique3D" },
      { name: "AutoSeg-SAM2", what: "Automatic segmentation with SAM2", path: "tools\\AutoSeg-SAM2" },
      { name: "astro-stacker", what: "Star trail / starscape image stacking", path: "tools\\astro-stacker" },
    ],
  },
  {
    category: "Audio reactivity",
    items: [
      { name: "aubio-beat-osc", what: "Aubio beat → OSC (for live LED sync)", path: "tools\\aubio-beat-osc" },
      { name: "audio-reactive-led-strip", what: "FFT → LED strip in real time", path: "tools\\audio-reactive-led-strip" },
    ],
  },
  {
    category: "Drone show",
    items: [
      { name: "skybrush-server", what: "Drone formation server", path: "drone_show\\skybrush-server" },
      { name: "studio-blender", what: "Blender plugin for choreographing drone shows", path: "drone_show\\studio-blender" },
    ],
  },
  {
    category: "POV firmware",
    items: [
      { name: "ImagePainting", what: "BMP → POV LED stick firmware", path: "firmware\\drone_pov\\ImagePainting" },
      { name: "Lightpainter2", what: "POV light painting firmware (v2)", path: "firmware\\drone_pov\\Lightpainter2" },
      { name: "pov-library", what: "POV core library", path: "firmware\\drone_pov\\pov-library" },
      { name: "light-stick", what: "Generic light stick firmware", path: "firmware\\drone_pov\\light-stick" },
      { name: "LumiFur_Controller", what: "Drone LED controller", path: "firmware\\drone_pov\\LumiFur_Controller" },
    ],
  },
  {
    category: "AI 3D — ComfyUI nodes",
    items: [
      { name: "ComfyUI-3D-Pack", what: "Meta-suite for TRELLIS / Hunyuan / TripoSG", path: "engines\\comfyui\\custom_nodes\\ComfyUI-3D-Pack" },
      { name: "ComfyUI-TRELLIS2", what: "Dedicated TRELLIS.2 wrapper", path: "engines\\comfyui\\custom_nodes\\ComfyUI-TRELLIS2" },
    ],
  },
];
