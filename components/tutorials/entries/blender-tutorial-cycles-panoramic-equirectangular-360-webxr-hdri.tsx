import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A standard Blender camera captures a frustum — a cone of view bounded
        by field-of-view angle and near/far clip. A panoramic equirectangular
        camera captures a <em>sphere</em>: every direction from the camera
        origin is sampled and projected onto the image using longitude as X and
        latitude as Y. The result is the same format as a globe map — and it is
        exactly what three.js, WebXR runtimes, and the glTF IBL extension expect
        when you hand them an environment map.
      </p>

      <p>
        This tutorial builds the full pipeline in one Python script: scene
        construction, camera configuration, Cycles render settings, OIDN
        compositor denoising with albedo+normal feature passes, and EXR output.
        The same{" "}
        <code>blueprint.py</code> can be run against any Blender scene — swap
        in your studio environment and bake a custom HDRI for any WebXR space.
        For the opposing direction (loading an HDRI as an environment probe
        into Blender), see the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-sky-nishita-sun-position-hdri-rig"
          className={lk}
        >
          Sky Nishita + HDRI Rig tutorial
        </Link>
        ; for denoising Cycles stills without panoramic projection, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-oidn-denoise-cycles-passes"
          className={lk}
        >
          OIDN Denoise Compositor tutorial
        </Link>
        .
      </p>

      <p>
        <strong>The 2:1 aspect ratio is not optional.</strong> Equirectangular
        projection maps 360° of longitude across the full image width and 180°
        of latitude across the full image height. A 1:1 canvas squashes the
        sphere into a half-sphere; any other ratio produces a non-conformal
        projection that WebXR runtimes will stretch incorrectly at the poles.
        4096×2048 is the production standard; 2048×1024 for preview.
      </p>

      <p>
        <strong>Camera placement is equally strict.</strong> The camera must sit
        at the exact scene origin (or the intended probe point) with no rotation.
        IBL shaders in the WebXR runtime reconstruct lighting by sampling the
        environment texture in world space from the surface normal direction —
        they assume the camera was at the origin of the scene coordinate system.
        A camera 2 m to the side of the origin produces a map whose lighting
        answers the question &ldquo;what does the scene look like from 2 m
        off-centre?&rdquo; — which is a valid artistic capture but a broken
        lighting probe. Use the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-light-probes-sphere-reflection-irradiance-webxr"
          className={lk}
        >
          EEVEE Light Probes tutorial
        </Link>{" "}
        for multi-probe grid setups where multiple capture positions are needed.
      </p>

      <p>
        The OIDN denoiser becomes dramatically better when fed albedo and normal
        passes alongside the noisy combined image. These passes give the neural
        network feature buffers — stable surface colour and orientation that the
        denoiser uses as anchors while reconstructing the noisy lighting signal.
        At 128 samples, a Combined-only denoise produces passable results; with
        albedo+normal the quality matches 512–1024 samples. The compositor
        wiring is three links: <code>Render Layers → DiffCol</code> into{" "}
        <code>Denoise → Albedo</code>, and{" "}
        <code>Render Layers → Normal</code> into{" "}
        <code>Denoise → Normal</code>. Both passes must be enabled in{" "}
        <strong>View Layer Properties → Passes</strong> before rendering —
        forgetting this is the most common cause of a grey albedo input that
        disables the feature guidance silently.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-cycles-panoramic-equirectangular-360-webxr-hdri",
  title:
    "Cycles Panoramic Equirectangular Camera — 360° HDR Environment Map for WebXR",
  date: "2026-06-28",
  kind: "tutorial",
  excerpt:
    "Capture a full-sphere 360° HDRI from any Blender scene using a Cycles panoramic camera, denoise with OIDN albedo+normal feature passes, and export EXR for use as a three.js / WebXR environment map and IBL probe.",
  Body,
};

export const entry: Entry = buildInstructable(
  {
    time: "an afternoon",
    difficulty: "intermediate",
    cost: "free (Blender 5.1 + OIDN bundled)",
    supplies: {
      materials: [
        "Blender 5.1 with Cycles engine",
        "blueprint.py from this library entry",
        "Any .blend scene to capture",
      ],
      tools: [
        "bpy.data.cameras — camera data API",
        "bpy.types.CompositorNodeDenoise — OIDN compositor node",
        "bpy.ops.render.render — render trigger",
        "UV Editor — for inspecting EXR output",
        "three.js RGBELoader — for WebXR consumption",
      ],
    },
    steps: [
      {
        title: "Create the panoramic camera",
        body: `The camera data type is set in Python via cam_data.type = 'PANO'.
After that, cam_data.panorama_type = 'EQUIRECTANGULAR' selects the projection.
Latitude and longitude limits are set in radians — a common mistake is passing
degrees directly, which silently captures a tiny sliver of the sphere.

In the UI: Camera Properties → Type → Panoramic → Panorama Type → Equirectangular.
Leave all latitude/longitude limits at their defaults (full sphere) unless you
deliberately want a partial capture (e.g. upper hemisphere only for a sky cap).

Place the camera at the intended probe origin. For a ground-level room capture,
(0, 0, 1.6) is eye-level. For an aerial capture, raise Z to the drone height.
Clear all rotation — the panoramic projection is direction-only, not frustum-based,
so the camera rotation does not define what is "forward" in the same way a
perspective camera does.`,
        code: `import bpy, math

cam_data = bpy.data.cameras.new("pano_cam")
cam_data.type          = 'PANO'
cam_data.panorama_type = 'EQUIRECTANGULAR'

# Full sphere — bpy takes radians, not degrees
cam_data.latitude_min  = math.radians(-90)
cam_data.latitude_max  = math.radians( 90)
cam_data.longitude_min = math.radians(-180)
cam_data.longitude_max = math.radians( 180)

cam_obj          = bpy.data.objects.new("pano_cam", cam_data)
cam_obj.location = (0.0, 0.0, 1.6)
# No rotation — camera origin is the probe point

bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj`,
      },
      {
        title: "Configure Cycles render for 360° output",
        body: `Resolution is non-negotiable: exactly 2:1 aspect ratio. 4096×2048 for
production renders, 2048×1024 for quick preview iterations. Any other ratio
produces a non-conformal map.

128 samples is the floor for OIDN-assisted renders — drop below this and the
denoiser does not have enough energy estimates to work from. For indoor scenes
with complex indirect lighting, use 256. Outdoor sky-dominant scenes can
get away with 64.

The render output should always be 32-bit EXR. The HDR dynamic range is what
makes the HDRI useful for image-based lighting — a tonemapped 8-bit JPEG
outputs correct colour only within the camera's exposure range, clipping the
bright sky and crushing the shadowed ground that the IBL shader needs to light
surfaces correctly.`,
        code: `scene = bpy.context.scene
scene.render.engine            = 'CYCLES'
scene.render.resolution_x      = 4096
scene.render.resolution_y      = 2048
scene.render.resolution_percentage = 100
scene.cycles.samples           = 128
scene.cycles.use_denoising    = True
scene.cycles.denoiser          = 'OPENIMAGEDENOISE'

# Enable albedo + normal passes for feature-guided OIDN
vl = scene.view_layers["ViewLayer"]
vl.use_pass_diffuse_color = True   # Albedo
vl.use_pass_normal        = True

scene.render.image_settings.file_format = 'OPEN_EXR'
scene.render.image_settings.color_depth = '32'
scene.render.image_settings.exr_codec   = 'ZIP'
scene.render.filepath = "//renders/pano_360.exr"`,
      },
      {
        title: "Wire the OIDN compositor denoiser",
        body: `The compositor Denoise node accepts three inputs: Image (the noisy combined
render), Albedo (the diffuse colour pass), and Normal (the surface normal pass).
Without albedo and normal wired in, OIDN runs in "combined-only" mode — it
still denoises but has no feature guidance, which smears fine edge detail and
destroys specular hot spots at low sample counts.

The HDR checkbox on the Denoise node is critical for HDRI capture. Without it,
the denoiser internally clamps values to [0,1] before processing, destroying
the over-exposed sky pixels that carry the most lighting information for the
IBL shader.

After denoising, a Hue/Sat/Value node with Value set to 0.9 trims the extreme
highlights slightly. This prevents specular surfaces in the WebXR scene from
blowing out — three.js applies its own tone mapping on top of the HDRI, and
over-bright inputs double the exposure.`,
        code: `scene.use_nodes = True
tree  = scene.node_tree
nodes = tree.nodes
links = tree.links
nodes.clear()

rl      = nodes.new('CompositorNodeRLayers')
denoise = nodes.new('CompositorNodeDenoise')
hsv     = nodes.new('CompositorNodeHueSat')
out     = nodes.new('CompositorNodeComposite')
fout    = nodes.new('CompositorNodeOutputFile')

denoise.use_hdr = True                 # preserve HDR range

# Feature-guided denoising — albedo and normal as anchors
links.new(rl.outputs['Image'],   denoise.inputs['Image'])
links.new(rl.outputs['DiffCol'], denoise.inputs['Albedo'])
links.new(rl.outputs['Normal'],  denoise.inputs['Normal'])

# Trim highlights before WebXR consumption
hsv.inputs['Value'].default_value = 0.90
links.new(denoise.outputs['Image'], hsv.inputs['Image'])
links.new(hsv.outputs['Image'],     out.inputs['Image'])

fout.base_path = "//renders/"
fout.file_slots[0].path = "pano_360_#####"
fout.format.file_format = 'OPEN_EXR'
fout.format.color_depth = '32'
links.new(hsv.outputs['Image'], fout.inputs['Image'])`,
      },
      {
        title: "Load in three.js / WebXR",
        body: `three.js reads Radiance HDR (.hdr) and EXR files via RGBELoader and
EXRLoader respectively. RGBELoader is more widely supported in older WebXR
runtimes; EXR is higher precision. For WebXR production, convert the EXR to
HDR in Blender's Image Editor (Image → Save As → Radiance HDR) or via the
Compositor's File Output node with format RADIANCE_HDR.

The key three.js configuration: set renderer.toneMapping to
ACESFilmicToneMapping (or AgX in three.js r160+) and renderer.toneMappingExposure
to 1.0 before assigning the environment. The PMREMGenerator pre-filters the
equirectangular map into a cubemap mipmap chain that the renderer can sample
efficiently during real-time IBL calculations.

For @react-three/drei, the Environment component handles PMREMGenerator
internally — you only need to pass the file path. The background prop also
renders the raw equirectangular as the scene sky.`,
        code: `// three.js (vanilla)
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import * as THREE from 'three'

renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.0

const pmrem = new THREE.PMREMGenerator(renderer)
pmrem.compileEquirectangularShader()

new RGBELoader().load('/hdri/pano_360.hdr', (hdrTex) => {
  const envMap = pmrem.fromEquirectangular(hdrTex).texture
  scene.environment = envMap  // IBL on all PBR materials
  scene.background  = envMap  // visible skybox
  hdrTex.dispose()
  pmrem.dispose()
})

// @react-three/drei (React)
// <Environment files="/hdri/pano_360.hdr" background />`,
      },
      {
        title: "Inspect and validate the output",
        body: `Open the rendered EXR in Blender's UV Editor (Image → Open → select the EXR).
A correct equirectangular capture shows:
- The horizon running as a horizontal band across the vertical centre
- The sky occupying the top half
- The ground occupying the bottom half
- Poles appearing as horizontal smears at the top and bottom edges

If the scene appears mirrored left-right, the longitude convention is inverted.
Check that longitude_min = math.radians(-180) and longitude_max = math.radians(180)
(not the reverse). three.js RGBELoader handles the conventional left-to-right
longitude order; an inverted map produces a scene where the sun rises in the west.

Validate the HDR range by switching the UV Editor's exposure slider (View panel).
Dragging exposure down should reveal detail in the sky highlights, and dragging
up should reveal detail in shadowed ground. If the image is uniformly grey at
all exposures, the EXR was accidentally converted to 8-bit during compositor output.`,
        code: `# Quick Python validation — check pixel range in the rendered EXR
import bpy
img = bpy.data.images.load("//renders/pano_360.exr")
pixels = list(img.pixels[:])
max_val = max(pixels)
min_val = min(p for p in pixels if p > 0)
print(f"EXR range: {min_val:.4f} → {max_val:.2f}")
# A valid HDRI should have max_val well above 1.0 (sky highlights)
# and min_val close to 0.0 (deep shadow)`,
      },
    ],
    troubleshooting: [
      {
        symptom: "Seam visible at the left/right edge of the panoramic render",
        cause:
          "Camera is not at the scene origin. Any translation of the panoramic camera creates a parallax discontinuity at the ±180° longitude boundary.",
        fix: "Move the camera to (0, 0, CAMERA_Z) with zero rotation. The panoramic projection is purely directional from a point — it has no notion of 'facing direction' the way a perspective camera does.",
      },
      {
        symptom: "OIDN denoiser produces no visible improvement",
        cause:
          "The Denoise node's use_hdr checkbox is unchecked, causing values to be clamped before processing, or the albedo and normal passes are not connected to the Denoise node's Albedo and Normal inputs.",
        fix: "Enable use_hdr on the Denoise node. Confirm that Diffuse Color and Normal passes are enabled in View Layer Properties, and that the Render Layers node's DiffCol and Normal outputs are wired to the Denoise node.",
      },
      {
        symptom: "three.js scene is overexposed when using the HDRI",
        cause:
          "The HDRI was rendered at the correct exposure for Blender's viewport but three.js applies its own tone mapping on top, compounding the exposure.",
        fix: "Reduce the HSV Value multiplier in the compositor from 0.9 to 0.5–0.7, or lower renderer.toneMappingExposure in three.js. The two systems must be calibrated together for the HDRI — Blender's output exposure plus the WebXR renderer's tone mapping exposure are multiplicative.",
      },
      {
        symptom: "Black poles or incorrect polar distortion",
        cause:
          "latitude_min and latitude_max were set in degrees rather than radians, capturing a tiny fraction of the sphere near the equator.",
        fix: "Always wrap degree values in math.radians(): cam_data.latitude_min = math.radians(-90). The bpy API accepts float values in radians for all angle properties — there is no degree input variant.",
      },
    ],
  },
  base,
);
