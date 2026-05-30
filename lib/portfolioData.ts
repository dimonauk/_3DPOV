// lib/portfolioData.ts
// Portfolio, Projects, and Client Work structure
// All image src values are Cloudinary public_ids (no domain needed)

export const portfolioImages = [
  // 40 best light paintings + 360 captures — varied tone, not linear sequence
  { id: 1, src: "portfolio/light-painting-antispin-3petal-blue", alt: "3-petal antispin, blue LED", category: "light-painting" },
  { id: 2, src: "portfolio/aerial-360-heritage-site-overview", alt: "Heritage site aerial 360", category: "aerial-360" },
  { id: 3, src: "portfolio/waveguide-sculpture-finished-pink", alt: "Waveguide sculpture, finished SLA print", category: "sculpture" },
  { id: 4, src: "portfolio/light-painting-inspin-cardioid-lavender", alt: "Cardioid inspin, lavender LED", category: "light-painting" },
  { id: 5, src: "portfolio/wall-art-cr30-hex-tile-01", alt: "CR-30 belt printer wall art, hex tile", category: "wall-art" },
  { id: 6, src: "portfolio/light-painting-antispin-5petal-cyan", alt: "5-petal antispin, cyan accent", category: "light-painting" },
  { id: 7, src: "portfolio/osmo-360-ground-capture-park", alt: "Osmo 360 ground capture, park setting", category: "aerial-360" },
  { id: 8, src: "portfolio/light-painting-wheel-plane-multicolor", alt: "Wheel-plane buzzsaw, multicolor", category: "light-painting" },
  { id: 9, src: "portfolio/waveguide-sculpture-segmentation-preview", alt: "Light painting → SAM3 segmentation → 3D", category: "sculpture" },
  { id: 10, src: "portfolio/aerial-360-avata-fov-interior", alt: "Avata 360 interior capture, wide FOV", category: "aerial-360" },
  { id: 11, src: "portfolio/light-painting-isolation-golden-hour", alt: "Pure isolation, golden hour", category: "light-painting" },
  { id: 12, src: "portfolio/heritage-site-360-scan-complete", alt: "Heritage site complete 360 scan", category: "aerial-360" },
  { id: 13, src: "portfolio/light-painting-trefoil-knot-amber", alt: "Trefoil knot (2:3), amber LED", category: "light-painting" },
  { id: 14, src: "portfolio/wall-art-cr30-dragon-scale-relief", alt: "CR-30 dragon scale relief tile", category: "wall-art" },
  { id: 15, src: "portfolio/waveguide-sculpture-sla-translucent", alt: "SLA waveguide, translucent resin", category: "sculpture" },
  { id: 16, src: "portfolio/light-painting-compound-3-4-knot", alt: "Compound knot (3:4), multicolor", category: "light-painting" },
  { id: 17, src: "portfolio/aerial-360-drone-flight-path-visible", alt: "Avata 360 mid-flight, light trails", category: "aerial-360" },
  { id: 18, src: "portfolio/light-painting-cinquefoil-2-5-purple", alt: "Cinquefoil knot (2:5), purple LED", category: "light-painting" },
  { id: 19, src: "portfolio/wall-art-parametric-phyllotaxis-grid", alt: "CR-30 phyllotaxis parametric grid", category: "wall-art" },
  { id: 20, src: "portfolio/waveguide-sculpture-caustic-test", alt: "Waveguide caustic projection test", category: "sculpture" },
  { id: 21, src: "portfolio/light-painting-pl-to-ss-transition", alt: "Plane to sphere transition", category: "light-painting" },
  { id: 22, src: "portfolio/aerial-360-monument-valley-style", alt: "Monument Valley aerial coverage", category: "aerial-360" },
  { id: 23, src: "portfolio/light-painting-figure-8-knot", alt: "Figure-8 knot (3:5)", category: "light-painting" },
  { id: 24, src: "portfolio/wall-art-interlocking-hexagons", alt: "Interlocking hexagon pattern", category: "wall-art" },
  { id: 25, src: "portfolio/waveguide-sculpture-embedded-led", alt: "Waveguide with embedded LED cavity", category: "sculpture" },
  { id: 26, src: "portfolio/light-painting-double-helix", alt: "Double helix pattern", category: "light-painting" },
  { id: 27, src: "portfolio/aerial-360-interior-full-sphere", alt: "Full 360 interior sphere", category: "aerial-360" },
  { id: 28, src: "portfolio/light-painting-rose-curve", alt: "Rose curve pattern", category: "light-painting" },
  { id: 29, src: "portfolio/wall-art-chain-mail-relief", alt: "3D chain mail relief", category: "wall-art" },
  { id: 30, src: "portfolio/waveguide-sculpture-multi-layer", alt: "Multi-layer waveguide stack", category: "sculpture" },
  { id: 31, src: "portfolio/light-painting-lissajous-3-2", alt: "Lissajous pattern (3:2)", category: "light-painting" },
  { id: 32, src: "portfolio/aerial-360-urban-canyon", alt: "Urban canyon 360 capture", category: "aerial-360" },
  { id: 33, src: "portfolio/light-painting-epicycloid", alt: "Epicycloid pattern", category: "light-painting" },
  { id: 34, src: "portfolio/wall-art-fibonacci-spiral", alt: "Fibonacci spiral relief", category: "wall-art" },
  { id: 35, src: "portfolio/waveguide-sculpture-color-gradient", alt: "Color gradient through waveguide", category: "sculpture" },
  { id: 36, src: "portfolio/light-painting-hypocycloid", alt: "Hypocycloid pattern", category: "light-painting" },
  { id: 37, src: "portfolio/aerial-360-landscape-wide", alt: "Landscape 360 wide view", category: "aerial-360" },
  { id: 38, src: "portfolio/light-painting-torus-knot-7-2", alt: "Torus knot (7:2)", category: "light-painting" },
  { id: 39, src: "portfolio/wall-art-fractal-tree", alt: "Fractal tree pattern", category: "wall-art" },
  { id: 40, src: "portfolio/waveguide-sculpture-finished-display", alt: "Finished waveguide in display setup", category: "sculpture" },
];

export const projects = [
  {
    slug: "antispin-flowers",
    title: "Antispin Flowers — Poi Light Pattern Studies",
    description: "A series of light paintings using poi antispin patterns (1:-2 through 1:-6). Each image captures a single full poi closure at 12+ second exposure, revealing the complete flower geometry in LED light.",
    images: [
      { id: 1, src: "projects/antispin-flowers/3petal-blue-long-exposure", alt: "3-petal antispin, blue LED, long exposure" },
      { id: 2, src: "projects/antispin-flowers/4petal-lavender-twilight", alt: "4-petal antispin, lavender, twilight" },
      { id: 3, src: "projects/antispin-flowers/5petal-cyan-accent", alt: "5-petal antispin, cyan accent" },
      { id: 4, src: "projects/antispin-flowers/6petal-multicolor-sequence", alt: "6-petal antispin, color sequence" },
      { id: 5, src: "projects/antispin-flowers/7petal-golden-hour", alt: "7-petal antispin, golden hour" },
      { id: 6, src: "projects/antispin-flowers/detail-close-up-petal", alt: "Close-up detail, petal definition" },
      { id: 7, src: "projects/antispin-flowers/full-frame-composition", alt: "Full frame composition" },
      { id: 8, src: "projects/antispin-flowers/variant-exposure-long", alt: "Long exposure variant" },
      { id: 9, src: "projects/antispin-flowers/variant-exposure-short", alt: "Short exposure variant" },
      { id: 10, src: "projects/antispin-flowers/color-study-01", alt: "Color study 01" },
      { id: 11, src: "projects/antispin-flowers/color-study-02", alt: "Color study 02" },
      { id: 12, src: "projects/antispin-flowers/documentary-setup", alt: "Setup documentation" },
    ],
  },
  {
    slug: "aerial-360-reconstructions",
    title: "Aerial 360 Reconstructions — Avata 360 Heritage Capture",
    description: "Multi-pass Avata 360 captures at heritage sites and installations. Reconstructed into navigable 3D Gaussian splat spaces using nerfstudio + iPad LiDAR mesh anchoring.",
    images: [
      { id: 1, src: "projects/aerial-360/heritage-site-01-overview", alt: "Heritage site, south elevation overview" },
      { id: 2, src: "projects/aerial-360/heritage-site-01-detail-facade", alt: "Heritage site, facade detail pass" },
      { id: 3, src: "projects/aerial-360/installation-interior-360-sphere", alt: "Installation interior, full 360 sphere" },
      { id: 4, src: "projects/aerial-360/garden-aerial-orbit", alt: "Garden aerial orbit, multiple passes" },
      { id: 5, src: "projects/aerial-360/splat-reconstruction-01", alt: "Gaussian splat reconstruction 01" },
      { id: 6, src: "projects/aerial-360/splat-reconstruction-02", alt: "Gaussian splat reconstruction 02" },
      { id: 7, src: "projects/aerial-360/lidar-mesh-anchor-detail", alt: "LiDAR mesh anchor detail" },
      { id: 8, src: "projects/aerial-360/multi-pass-coverage-map", alt: "Multi-pass coverage map" },
      { id: 9, src: "projects/aerial-360/navigation-path-preview", alt: "Navigation path preview" },
      { id: 10, src: "projects/aerial-360/detail-window-capture", alt: "Detail window capture" },
      { id: 11, src: "projects/aerial-360/ground-reference-photo", alt: "Ground reference photo" },
      { id: 12, src: "projects/aerial-360/final-splat-viewer", alt: "Final splat viewer screenshot" },
    ],
  },
  {
    slug: "waveguide-sculptures",
    title: "Light Painting → Waveguide Sculpture — The Forge Pipeline",
    description: "The complete LightPainting Forge pipeline: light painting photograph → SAM3 segmentation → marching cubes voxelisation → STL mesh → SLA print. Before/after + finished sculptures.",
    images: [
      { id: 1, src: "projects/waveguide-sculptures/source-light-painting-01", alt: "Original light painting capture" },
      { id: 2, src: "projects/waveguide-sculptures/segmentation-mask-01", alt: "SAM3 segmentation output" },
      { id: 3, src: "projects/waveguide-sculptures/3d-splat-preview-01", alt: "3D Gaussian splat preview" },
      { id: 4, src: "projects/waveguide-sculptures/stl-mesh-wireframe-01", alt: "STL mesh, wireframe view" },
      { id: 5, src: "projects/waveguide-sculptures/finished-print-01-translucent", alt: "Finished SLA print, translucent resin" },
      { id: 6, src: "projects/waveguide-sculptures/finished-print-01-detail", alt: "Finished print, close detail" },
      { id: 7, src: "projects/waveguide-sculptures/caustic-projection-test", alt: "Caustic projection through finished sculpture" },
      { id: 8, src: "projects/waveguide-sculptures/pipeline-stage-voxel", alt: "Voxelisation stage detail" },
      { id: 9, src: "projects/waveguide-sculptures/marching-cubes-output", alt: "Marching cubes mesh output" },
      { id: 10, src: "projects/waveguide-sculptures/print-orientation-diagram", alt: "Print orientation diagram" },
      { id: 11, src: "projects/waveguide-sculptures/support-structure-removed", alt: "After support structure removal" },
      { id: 12, src: "projects/waveguide-sculptures/final-installation-photo", alt: "Final installation photograph" },
    ],
  },
  {
    slug: "urban-light-walks",
    title: "Urban Light Walks — City Poi Light Painting",
    description: "Light painting series in urban environments: parks, streets, architectural spaces. Osmo 360 long-exposure captures of poi spinning with LED arrays in city settings.",
    images: [
      { id: 1, src: "projects/urban-light-walks/peckham-park-antispin", alt: "Peckham Park, antispin flower" },
      { id: 2, src: "projects/urban-light-walks/warehouse-district-isolation", alt: "Warehouse district, isolation pattern" },
      { id: 3, src: "projects/urban-light-walks/street-corner-night-capture", alt: "Street corner, full night, multicolor LED" },
      { id: 4, src: "projects/urban-light-walks/architectural-framing", alt: "Architectural framing study" },
      { id: 5, src: "projects/urban-light-walks/park-monument-backdrop", alt: "Park monument backdrop" },
      { id: 6, src: "projects/urban-light-walks/underpass-neon-study", alt: "Underpass neon study" },
      { id: 7, src: "projects/urban-light-walks/building-reflection-capture", alt: "Building reflection capture" },
      { id: 8, src: "projects/urban-light-walks/street-art-interaction", alt: "Street art interaction" },
      { id: 9, src: "projects/urban-light-walks/bridge-overpass", alt: "Bridge overpass series" },
      { id: 10, src: "projects/urban-light-walks/rooftop-cityscape", alt: "Rooftop cityscape" },
      { id: 11, src: "projects/urban-light-walks/night-market-ambient", alt: "Night market ambient" },
      { id: 12, src: "projects/urban-light-walks/fountain-plaza-evening", alt: "Fountain plaza evening" },
    ],
  },
  {
    slug: "wall-art-chronicles",
    title: "Wall Art Chronicles — CR-30 Belt Printer Evolution",
    description: "Wall art evolution from the parametric CR-30 belt printer system. Density-field algorithms generating tile patterns: hex grids, dragon scales, phyllotaxis, chain mail, and algorithmic variations.",
    images: [
      { id: 1, src: "projects/wall-art/cr30-hex-tile-01", alt: "Hex grid tile, standard relief" },
      { id: 2, src: "projects/wall-art/cr30-dragon-scale-01", alt: "Dragon scale relief, high density" },
      { id: 3, src: "projects/wall-art/cr30-chain-mail-4in1", alt: "Chain mail 4-in-1 pattern" },
      { id: 4, src: "projects/wall-art/cr30-phyllotaxis-grid", alt: "Phyllotaxis golden angle grid" },
      { id: 5, src: "projects/wall-art/installed-wall-array-01", alt: "Installation: 6-tile wall array" },
      { id: 6, src: "projects/wall-art/close-detail-honeycomb", alt: "Close detail, honeycomb pattern" },
      { id: 7, src: "projects/wall-art/lighting-study-shadow-play", alt: "Lighting study, shadow play" },
      { id: 8, src: "projects/wall-art/parametric-variation-01", alt: "Parametric variation 01" },
      { id: 9, src: "projects/wall-art/parametric-variation-02", alt: "Parametric variation 02" },
      { id: 10, src: "projects/wall-art/multi-tile-installation", alt: "Multi-tile installation photo" },
      { id: 11, src: "projects/wall-art/color-variant-set", alt: "Color variant set" },
      { id: 12, src: "projects/wall-art/algorithm-density-heat-map", alt: "Algorithm density heat map" },
    ],
  },
  {
    slug: "heritage-documentation",
    title: "Heritage Documentation — 360° Site Capture",
    description: "Professional heritage site documentation using DJI Osmo 360 and Avata 360. Full-sphere captures with Gaussian splat reconstruction for museums, historical sites, and cultural institutions.",
    images: [
      { id: 1, src: "projects/heritage/museum-interior-360-overview", alt: "Museum interior, 360 overview" },
      { id: 2, src: "projects/heritage/museum-artifact-detail-zone", alt: "Museum artifact detail, close capture" },
      { id: 3, src: "projects/heritage/historical-building-exterior", alt: "Historical building exterior facade" },
      { id: 4, src: "projects/heritage/site-reconstruction-splat-preview", alt: "Site reconstruction, Gaussian splat preview" },
      { id: 5, src: "projects/heritage/archive-documentation-setup", alt: "Archive documentation setup" },
      { id: 6, src: "projects/heritage/multi-room-connection-path", alt: "Multi-room connection path" },
      { id: 7, src: "projects/heritage/artifact-360-rotation-capture", alt: "Artifact 360 rotation capture" },
      { id: 8, src: "projects/heritage/ground-floor-layout-map", alt: "Ground floor layout map" },
      { id: 9, src: "projects/heritage/upper-gallery-overview", alt: "Upper gallery overview" },
      { id: 10, src: "projects/heritage/conservation-detail-photo", alt: "Conservation detail photo" },
      { id: 11, src: "projects/heritage/outdoor-grounds-360", alt: "Outdoor grounds 360 capture" },
      { id: 12, src: "projects/heritage/final-splat-viewer-interface", alt: "Final splat viewer interface" },
    ],
  },
];

export const clientWork = {
  categories: [
    {
      slug: "heritage-documentation",
      name: "Heritage Documentation",
      description: "Professional 360° capture + Gaussian splat reconstruction for museums, historical sites, and cultural institutions. DJI Osmo 360 + iPad LiDAR mesh anchoring.",
      images: [
        { id: 1, src: "client-work/heritage/site-01-exterior-overview", alt: "Site exterior, full 360 overview" },
        { id: 2, src: "client-work/heritage/site-01-interior-main-hall", alt: "Interior main hall, 360 sphere" },
        { id: 3, src: "client-work/heritage/site-01-detail-architectural", alt: "Architectural detail, close zone" },
        { id: 4, src: "client-work/heritage/site-02-complete-capture", alt: "Second site, complete capture sequence" },
        { id: 5, src: "client-work/heritage/museum-artifacts-360", alt: "Museum artifacts 360 coverage" },
        { id: 6, src: "client-work/heritage/splat-reconstruction-interior", alt: "Splat reconstruction, interior" },
        { id: 7, src: "client-work/heritage/grounds-and-exterior", alt: "Grounds and exterior documentation" },
        { id: 8, src: "client-work/heritage/final-web-viewer", alt: "Final web viewer interface" },
      ],
    },
    {
      slug: "commercial-video",
      name: "Commercial Video Production",
      description: "B2B testimonial video, event documentation, installation capture. Professional video production for technical services and commercial clients.",
      images: [
        { id: 1, src: "client-work/video/testimonial-frame-01", alt: "Video production still, testimonial" },
        { id: 2, src: "client-work/video/event-documentation-01", alt: "Event capture, wide shot" },
        { id: 3, src: "client-work/video/installation-opening-01", alt: "Installation opening, documentation" },
        { id: 4, src: "client-work/video/product-demo-01", alt: "Product demo footage" },
        { id: 5, src: "client-work/video/interview-setup-01", alt: "Interview setup and lighting" },
        { id: 6, src: "client-work/video/b2b-presentation-frame", alt: "B2B presentation frame" },
        { id: 7, src: "client-work/video/timelapse-sequence-01", alt: "Timelapse sequence" },
        { id: 8, src: "client-work/video/finished-edit-thumbnail", alt: "Finished edit thumbnail" },
      ],
    },
  ],
};

// Helper function to get all images across portfolio + all projects
export function getAllPortfolioImages() {
  const projectImages = projects.flatMap((p) => p.images);
  return [...portfolioImages, ...projectImages];
}

// Helper to get a single project by slug
export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

// Helper to get a single client work category by slug
export function getClientCategory(slug: string) {
  return clientWork.categories.find((c) => c.slug === slug);
}
