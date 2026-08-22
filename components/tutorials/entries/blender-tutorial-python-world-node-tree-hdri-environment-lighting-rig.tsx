import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every Blender scene has a World data-block, and every World data-block can
        carry a node tree — the same graph paradigm as material shading, applied to
        the infinite sphere surrounding the scene.  Most artists wire this by hand
        in the Shader Editor, but the bpy API exposes the same node tree for
        scripting.  Build the graph once in Python and you can swap HDRIs, rotate
        the sun, adjust atmospheric density, and sync a Sun lamp, all in a single
        function call — essential for batch-rendering pipelines, headless asset
        builds, and the Holoflow WebXR export chain.
      </p>

      <p className="mt-4">
        Blueprint.py builds two rig variants.  <strong>HDRI mode</strong> wires a{" "}
        <code>ShaderNodeTexEnvironment</code> through a{" "}
        <code>ShaderNodeMapping</code> (Z rotation = azimuth offset) into a{" "}
        <code>ShaderNodeBackground</code>.  <strong>Sky mode</strong> drops the
        texturing chain entirely and uses{" "}
        <code>ShaderNodeTexSky</code> in Nishita mode — the analytical atmospheric
        scattering model from the 1993 Nishita et al. SIGGRAPH paper.  For the
        hand-crafted version of the Nishita shader, see the{" "}
        <Link href="/tutorials/blender-tutorial-shader-sky-nishita-sun-position-hdri-rig" className={lk}>
          Nishita Sky Shader tutorial
        </Link>
        ; this tutorial is its scripted counterpart.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Five traps that every world-tree scripter hits
      </h2>
      <p className="mt-2">
        First: <code>world.use_nodes = True</code> must be called before any
        access to <code>world.node_tree</code>.  Without it the tree is{" "}
        <code>None</code> and any attribute access hard-crashes.  Second:{" "}
        <code>ShaderNodeTexCoord.Generated</code> is the correct output socket for
        environment mapping — it returns the normalised world-dome direction.  Using
        <code>.Object</code> or <code>.Normal</code> gives object-local coordinates
        and the HDRI tiles or clamps rather than wrapping the sky.  Third:{" "}
        <code>ShaderNodeTexEnvironment</code> requires an image block:{" "}
        <code>node.image = bpy.data.images.load(path)</code>.  Passing a raw
        filepath string to the Color socket silently does nothing.  Fourth: mist
        settings are on <code>scene.world.mist_settings</code> (a{" "}
        <code>MistSettings</code> struct), not on the node tree — and enabling the
        Mist render pass is a third, separate toggle on the{" "}
        <code>ViewLayer</code>.  Fifth: <code>sky_node.sun_direction</code> is a
        unit vector in Blender world space (<code>+Z</code> up, <code>+Y</code>{" "}
        north, <code>+X</code> east) and is keyframeable directly via{" "}
        <code>sky_node.keyframe_insert(&quot;sun_direction&quot;, frame=N)</code>.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        The JSON export bridge for WebXR
      </h2>
      <p className="mt-2">
        glTF 2.0 carries no environment map in its base specification.  Three.js
        and WebXR runtimes can consume one via{" "}
        <code>THREE.PMREMGenerator</code>, but the data has to arrive separately —
        typically as a side-loaded <code>.hdr</code> and a metadata JSON.  Blueprint
        therefore writes <code>world_rig_export.json</code> containing the sky type,
        sun direction as both a unit vector and (elevation, azimuth) in degrees, air
        density, dust density, HDRI filename, azimuth offset, strength, and mist
        envelope.  The Holoflow Three.js renderer reads this sidecar to reconstruct
        a matching IBL without any human re-entry of values — the Blender author
        and the WebXR runtime share a single source of truth.  For the EEVEE probe
        baking side of this pipeline, see the{" "}
        <Link href="/tutorials/blender-tutorial-eevee-light-probes-sphere-reflection-irradiance-webxr" className={lk}>
          EEVEE Light Probes + Irradiance tutorial
        </Link>
        .  For the mist-pass compositor workflow that consumes the fog envelope,
        see{" "}
        <Link href="/tutorials/blender-tutorial-compositor-mist-pass-z-depth-defocus-atmospheric" className={lk}>
          Compositor Mist Pass + Z-Depth Defocus
        </Link>
        .
      </p>

      <p className="mt-4">
        The reverse of this pipeline — capturing an equirectangular HDRI from a
        Blender scene to use as input — is in the{" "}
        <Link href="/tutorials/blender-tutorial-cycles-panoramic-equirectangular-360-webxr-hdri" className={lk}>
          Cycles 360° Equirectangular HDRI tutorial
        </Link>
        .  For the custom render engine that triggers a GLB export on F12 and
        inherits the EEVEE world lighting set up here, see{" "}
        <Link href="/tutorials/blender-tutorial-python-bpy-render-engine-webxr-snapshot" className={lk}>
          Python Custom Snapshot Render Engine
        </Link>
        .  CC0 HDRI source for testing:{" "}
        <a
          href="https://polyhaven.com/hdris"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Poly Haven HDRI library
        </a>{" "}
        (Greg Zaal et al., CC0).  Related project:{" "}
        <a
          href="https://github.com/Poly-Haven/Public-Asset-Packs"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Poly Haven Public Asset Packs
        </a>
        .  Blender Foundation World API reference:{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.World.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.World — Blender 5.1 API
        </a>{" "}
        (CC BY-SA 4.0).
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-world-node-tree-hdri-environment-lighting-rig",
  title:
    "Python — World Node Tree: HDRI + Nishita Sky Lighting Rig (Blender 5.1)",
  date: "2026-07-04",
  kind: "tutorial",
  excerpt:
    "Build and configure Blender's World node tree entirely via bpy: wire an HDRI environment map with azimuth rotation, or a Nishita sky with animated sun direction, sync a Sun lamp to match, configure mist distance-fog, and export a JSON sidecar so the Holoflow Three.js WebXR renderer can load a matching IBL without manual re-entry.",
  Body,
};

export const entry = buildInstructable(
  {
    time: "one afternoon",
    difficulty: "intermediate",
    cost: "free — Blender 5.1, this script, and optionally a CC0 HDRI from polyhaven.com",
    supplies: {
      materials: [
        "Blender 5.1 (EEVEE Next or Cycles renderer)",
        "blueprint.py from this library entry",
        "record.py for the viewport render",
        "(optional) a CC0 HDRI .hdr file from polyhaven.com/hdris",
      ],
      tools: [
        "Blender Text Editor (Shift+F11)",
        "Shader Editor set to World type",
        "World Properties panel (globe icon)",
        "Terminal or file browser to inspect world_rig_export.json",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py and verify the node tree",
        body:
          "Open a new Blender 5.1 session.  In the Text Editor, open blueprint.py and press Run Script.\n\n" +
          "In the console at the bottom you should see:\n" +
          "  [HoloflowWorldRig] JSON → /path/to/world_rig_export.json\n" +
          "  [HoloflowWorldRig] Rig applied.\n\n" +
          "Switch the Shader Editor type dropdown to World.  The node graph should show:\n" +
          "  ShaderNodeTexSky → ShaderNodeBackground → ShaderNodeOutputWorld\n\n" +
          "If the Shader Editor still shows the default gradient, the World dropdown at the top\n" +
          "of the Editor is showing the wrong data-block — click it and select 'HoloflowWorldRig'.",
      },
      {
        title: "Inspect the five wiring decisions",
        body:
          "With the World node graph visible, work through the five traps noted in the tutorial:\n\n" +
          "1. use_nodes: open Python console, run `print(bpy.data.worlds['HoloflowWorldRig'].use_nodes)` → True.\n" +
          "   Manually set it False and run `print(bpy.data.worlds['HoloflowWorldRig'].node_tree)` → None.\n" +
          "   Set it back to True before continuing.\n\n" +
          "2. TexCoord socket: uncomment the HDRI branch (set HDRI_PATH to any .hdr and re-run).\n" +
          "   In the World node graph, click the TexCoord node — note the link is from 'Generated',\n" +
          "   not 'Object' or 'Normal'.  Rewire to 'Object', view the viewport — the HDRI distorts.\n" +
          "   Rewire back to 'Generated'.\n\n" +
          "3. Sky direction: hover over the sun_direction XYZ fields in the TexSky node.\n" +
          "   Python console: `import math; n = bpy.data.worlds['HoloflowWorldRig'].node_tree.nodes['Sky Texture']`\n" +
          "   `print(n.sun_direction)` → should match the (sin/cos) vector for az=215°, el=28°.",
      },
      {
        title: "Read the mist settings and enable the Mist pass",
        body:
          "Switch to Properties → World (globe icon) → Mist.\n" +
          "Start should be 4.0 m, Depth 14.0 m, Falloff Quadratic.\n\n" +
          "These come from scene.world.mist_settings — confirm in Python console:\n" +
          "  ms = bpy.context.scene.world.mist_settings\n" +
          "  print(ms.start, ms.depth, ms.falloff)\n\n" +
          "Switch to Properties → View Layer → Passes → Data → check 'Mist'.\n" +
          "blueprint.py already sets `view_layer.use_pass_mist = True` for all view layers,\n" +
          "so this checkbox should already be ticked.\n\n" +
          "Add a Camera (Shift+A → Camera), position it at (6, -8, 4).  Set scene.camera = camera.\n" +
          "In Render Properties, enable Compositor.  In the Compositor, add a Render Layers node\n" +
          "and route the Mist output to a Viewer node — a greyscale depth gradient should appear.",
      },
      {
        title: "Animate the sun arc and inspect the FCurves",
        body:
          "In the Python console, animate the Nishita sky sun from elevation 5° to 70°:\n\n" +
          "  import math\n" +
          "  nt = bpy.data.worlds['HoloflowWorldRig'].node_tree\n" +
          "  sky = next(n for n in nt.nodes if n.type == 'TEX_SKY')\n" +
          "  az = math.radians(215)\n" +
          "  for frame, el_deg in [(1, 5), (120, 70)]:\n" +
          "      bpy.context.scene.frame_set(frame)\n" +
          "      el = math.radians(el_deg)\n" +
          "      sky.sun_direction = (-math.sin(az)*math.cos(el), math.cos(az)*math.cos(el), math.sin(el))\n" +
          "      sky.keyframe_insert('sun_direction', frame=frame)\n\n" +
          "Scrub the timeline in the viewport — the sky colour shifts from warm sunrise pink\n" +
          "to cool midday blue.  Open the Graph Editor, select the World node tree's action:\n" +
          "  bpy.data.worlds['HoloflowWorldRig'].node_tree.animation_data.action\n" +
          "You should see three FCurves (X, Y, Z components of sun_direction).",
      },
      {
        title: "Inspect the JSON sidecar and plan the WebXR match",
        body:
          "Open world_rig_export.json in a text editor (written to the same folder as the .blend).\n\n" +
          "Sky mode output example:\n" +
          "  {\n" +
          "    'mode': 'sky',\n" +
          "    'strength': 1.0,\n" +
          "    'sky': {\n" +
          "      'sky_type': 'NISHITA',\n" +
          "      'sun_elevation': 28.0,\n" +
          "      'sun_azimuth': 215.0,\n" +
          "      'air_density': 1.0,\n" +
          "      'dust_density': 0.5\n" +
          "    },\n" +
          "    'mist': { 'start': 4.0, 'depth': 14.0, 'falloff': 'QUADRATIC' }\n" +
          "  }\n\n" +
          "In Three.js, the WebXR renderer loads this JSON, then:\n" +
          "  1. Fetches the matching HDRI from assets/hdri/<filename>.hdr\n" +
          "  2. Calls pmremGenerator.fromEquirectangular(texture) to build IBL\n" +
          "  3. Sets scene.environment = envMap and scene.background = envMap\n" +
          "  4. Positions a DirectionalLight at the sun_azimuth/elevation angles\n" +
          "  5. Applies a FogExp2 using mist.depth for atmospheric distance\n\n" +
          "The Blender render and the WebXR preview should match to within EEVEE's\n" +
          "rasterisation approximation of sky IBL.",
      },
    ],
    finalResult:
      "A reusable Python module that builds Blender's World node tree programmatically — HDRI mode with azimuth rotation or Nishita sky mode with sun direction, mist settings, and a Sun lamp sync. Exports world_rig_export.json so the Holoflow Three.js WebXR renderer can reconstruct matching IBL and atmospheric fog from the same parameters without manual re-entry.",
    variations: [
      "Sunset gradient tint: after build_sky_world(), insert a MixRGB node between the TexSky Color output and the Background Color input. Wire a ColorRamp (peach → deep blue) driven by the sky_node sun_direction Z component. Blend factor 0.15–0.3 adds a warm horizon fill that Nishita undersells at low elevations, matching cinematic sky references.",
      "HDRI day/night crossfade: build two worlds (day_world, night_world). Add a MixShader between them inside a single combined world. Wire a driver from a custom scene property 'time_of_day' (0=midnight, 0.5=noon) to the Mix factor. Animate the property and both worlds crossfade — no duplicate scene setup needed.",
      "Volume fog column: add a ShaderNodeBackground with a dark, low-emission colour to the World Output Volume input. Set world.use_nodes = True and wire a ShaderNodeVolumeAbsorption into the Volume socket. This adds physical fog density to the world volume, visible in Cycles path tracing as depth-dependent colour absorption — thicker = darker grey, like a marine layer.",
    ],
    troubleshooting: [
      {
        symptom: "world.node_tree is None even after running blueprint.py",
        cause:
          "world.use_nodes was False when the script accessed node_tree. Possible cause: the script ran on a world object different from the one assigned to scene.world.",
        fix:
          "Confirm the world assignment: `print(bpy.context.scene.world.name)` should print 'HoloflowWorldRig'. If not, bpy.data.worlds.get(WORLD_NAME) returned None because an earlier purge removed it. Re-run blueprint.py from scratch in a clean session.",
      },
      {
        symptom: "EEVEE viewport shows a plain white background, no sky colour",
        cause:
          "EEVEE Next requires a viewport draw call to update the world background. The node tree was built correctly but the viewport has not refreshed.",
        fix:
          "Toggle viewport shading between Solid and Material Preview (Z key) to force a redraw. Alternatively: scene.world.node_tree.nodes.update() followed by bpy.ops.wm.redraw_timer(type='DRAW_WIN_SWAP', iterations=1).",
      },
      {
        symptom: "sun_direction keyframe insert raises AttributeError",
        cause:
          "sky_node.keyframe_insert('sun_direction') requires an active Action context. If the world has no animation_data yet, the first keyframe_insert silently creates it — but it can fail if Blender's context has no scene or frame set.",
        fix:
          "Ensure bpy.context.scene.frame_set(frame) is called before each keyframe_insert. If running headless (--background), add `bpy.context.scene.frame_set(1)` at the very start of the script to establish a valid frame context.",
      },
      {
        symptom: "world_rig_export.json not found after running blueprint.py",
        cause:
          "The .blend file has not been saved yet. bpy.path.abspath('//...') resolves the // relative to the .blend file location; if the file is unsaved, // resolves to a temporary path that may not be writable.",
        fix:
          "Save the .blend first (Ctrl+S → choose a path), then re-run blueprint.py. Or change EXPORT_JSON to an absolute path: '/tmp/world_rig_export.json'.",
      },
    ],
  },
  base,
);
