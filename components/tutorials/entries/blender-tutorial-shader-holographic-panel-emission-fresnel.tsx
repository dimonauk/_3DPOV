import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ShaderHolographicPanelBody() {
  return (
    <>
      <p>
        A holographic interface panel earns its read through a specific optical
        lie: the panel face is nearly invisible, but every structural line in
        the UI glows, and the silhouette rim glows brighter still.  No real
        display works this way — it is a convention borrowed from science
        fiction concept art, formalised by the observation that thin-film
        displays and LCD polarisers genuinely do exhibit higher transmission
        and edge diffraction at grazing angles.  In Blender 5.1 that convention
        maps cleanly to three shader signals layered over a near-zero-alpha
        base, all living in a single Principled BSDF material.
      </p>

      <p>
        The first signal is the hex grid.  Voronoi Texture in{" "}
        <strong>DISTANCE_TO_EDGE</strong> mode outputs 0 at every cell
        boundary and rises toward roughly 0.6 at each centroid.  Inverting
        that (1 − distance) gives a spiked function that peaks at cell
        boundaries.  A CONSTANT-interpolation ColorRamp acts as a hard
        threshold: everything below the spike tip is black, everything above
        is white — a razor-thin luminous line at each cell edge.  Voronoi
        Randomness = 0.0 gives a perfect honeycomb; increasing it organically
        distorts the cells toward soft blobs.  Compare the cell-boundary
        approach here with the cell-interior colouring in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-dual-mesh-voronoi-cell-sphere"
          className={lk}
        >
          Voronoi cell sphere tutorial
        </Link>
        , which uses F1 (nearest-centroid distance) to shade each cell's
        interior — the two modes are complementary.
      </p>

      <p>
        The second signal is the scan-line layer.  Wave Texture in BANDS mode
        with Y direction produces a sinusoidal pattern that varies with the V
        component of the UV coordinate — horizontal stripes on an upright
        panel.  A second CONSTANT ColorRamp keeps only the peak of each wave
        cycle (the top ~15 % of amplitude) as a bright stripe; the rest is
        black.  A Mapping node&apos;s Y Location carries a frame-driver expression{" "}
        <code>frame * SCROLL_SPEED</code>, shifting the UV phase each frame
        so the stripes scroll upward — the signature &ldquo;data flowing through
        the interface&rdquo; visual.  The Distortion parameter on the Wave node
        adds slight turbulence so adjacent stripes are not perfectly parallel,
        which reads as analogue interference rather than a rigid raster.
      </p>

      <p>
        The third signal is the Fresnel node.  It evaluates the angle between
        the surface normal and the incoming camera ray: 0 when the panel faces
        directly toward the viewer, rising to 1 at the silhouette edge where
        the ray grazes the surface.  A{" "}
        <strong>Multiply Add</strong> Math node converts this to a multiplier{" "}
        <code>(1 + FRESNEL_BOOST × fresnel)</code>, which is always ≥ 1.0 and
        peaks at the rim.  This multiplier gates both the Emission Strength and
        the Alpha socket simultaneously: where the panel edge faces away, the
        hex lines and scan stripes glow extra-bright and the panel becomes
        opaque — the spatial equivalent of a display whose brightness and
        contrast both increase at glancing incidence.  The{" "}
        <Link href="/atelier" className={lk}>
          Atelier spatial viewer
        </Link>{" "}
        exposes exactly this behaviour when a WebXR user moves close to a
        holographic UI element: the rim brightens as they orbit past the edge.
      </p>

      <p>
        The alpha pipeline accumulates three contributors.  A base constant
        (~0.05) keeps the panel itself faintly visible as a substrate.  The
        combined hex + scan mask multiplied by 0.55 makes the panel semi-opaque
        wherever a line is glowing.  The Fresnel value multiplied by 0.40
        makes the rim solid.  These sum and clamp to [0, 1]: at the edge, alpha
        ≈ 1.0; at the face over a glowing line, alpha ≈ 0.6; at the face
        between lines, alpha ≈ 0.05.  The scene behind the panel is almost
        fully visible through the dark areas, which is what gives the
        &ldquo;projected in space&rdquo; quality rather than the flat-card look of a
        simple tinted quad.
      </p>

      <p>
        EEVEE-Next transparency requires{" "}
        <code>mat.surface_render_method = &apos;FORWARD&apos;</code> in Blender 5.1.
        The legacy <code>blend_method = &apos;BLEND&apos;</code> from EEVEE 3.x still
        exists as a compatibility alias but the canonical path for sorted alpha
        in EEVEE-Next is the <code>surface_render_method</code> enum.  Setting{" "}
        <code>shadow_method = &apos;NONE&apos;</code> suppresses shadow casting — a
        holographic projection illuminates nothing, and a shadow beneath it
        would look like a physical object resting on the floor.  For the
        full glass-plus-refraction comparison, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence"
          className={lk}
        >
          Principled Transmission + Iridescence tutorial
        </Link>
        {" "}— that material uses <code>Transmission Weight</code> for
        physically correct refraction, while this holographic panel uses Alpha
        with the <code>FORWARD</code> surface method for designed transparency
        that makes the grid glow the dominant visual event.
      </p>

      <p>
        For GLB export, Blender&apos;s bundled glTF-IO add-on (Apache-2.0) writes{" "}
        <code>KHR_materials_emissive_strength</code> automatically whenever
        Emission Strength exceeds 1.0 on a Principled BSDF.  This preserves the
        above-unity value in Three.js (r150+) where it maps to{" "}
        <code>MeshPhysicalMaterial.emissiveIntensity</code>.  Without the
        extension, glTF 2.0 core clamps all emissive channels to [0, 1] and
        the panel looks uniformly dim.  The extension specification is
        maintained by the Khronos Group under Apache-2.0 at{" "}
        <a
          href="https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_emissive_strength"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          KhronosGroup/glTF
        </a>
        ; the exporter implementation lives in{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Blender-IO"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          KhronosGroup/glTF-Blender-IO
        </a>
        .  Related sibling projects include KhronosGroup/glTF-Sample-Assets
        (reference models, Apache-2.0) and KhronosGroup/UnityGLTF (Unity
        importer, MIT), both of which exercise the extension at different
        runtime targets.  The Atelier viewer supports{" "}
        <code>emissiveIntensity</code> natively, so a holographic panel
        exported from this blueprint will render with Bloom-equivalent glow in
        the WebXR scene without any post-process configuration.  For
        constructing the scene around it, the indirect lighting approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-irradiance-sphere-probe"
          className={lk}
        >
          EEVEE-Next Irradiance Volume tutorial
        </Link>{" "}
        is the correct way to let the panel&apos;s emissive light spill onto
        surrounding geometry in a baked EEVEE scene.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-shader-holographic-panel-emission-fresnel",
  title:
    "Shader — Holographic Interface Panel: Emission + Fresnel + Voronoi Hex Grid + Animated Scan Lines",
  date: "2026-06-12",
  kind: "tutorial",
  excerpt:
    "Procedural holographic UI panel: Voronoi DISTANCE_TO_EDGE for hex cell boundaries, Wave BANDS with animated UV scroll for scan lines, Fresnel node multiplier for silhouette rim amplification, EEVEE-Next surface_render_method FORWARD for sorted alpha. KHR_materials_emissive_strength preserves above-unity glow in GLB for WebXR. Blender 5.1.",
  Body: ShaderHolographicPanelBody,
};

export const entry = buildInstructable(
  {
    time: "50 minutes",
    difficulty: "intermediate",
    cost: "free — Blender 5.1 (EEVEE-Next), no add-ons",
    supplies: {
      materials: [
        "Blender 5.1 with EEVEE-Next renderer",
        "blueprint.py from public/library/blends/shading/shader-holographic-panel-emission-fresnel/",
      ],
      tools: [
        "3D Viewport › Rendered shading mode (Z → Rendered)",
        "Shader Editor (Shift-F3 or header dropdown)",
        "Properties › Material › Settings panel",
        "Render Properties › Effects › Bloom",
        "Scripting workspace (to run blueprint.py)",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py and examine the panel in Rendered mode",
        content: `Open Blender 5.1.  Switch to the Scripting workspace, click Open, and
load blueprint.py.  Click Run Script.  Switch to the Layout workspace, set the
3D Viewport to Rendered shading mode (Z → Rendered, or the sphere icon in the
viewport header).

You should see a dark teal panel with a bright cyan hex grid and horizontal
scan lines scrolling upward.  The panel silhouette should have a visibly
brighter rim halo — the Fresnel edge glow.  Bloom adds a soft halo around
the brightest crossings where a scan line overlaps a hex edge.

If the panel appears solid (no transparency) check that Render Properties →
Effects → Bloom is enabled.  If the panel alpha is not working, check that
the Material Settings panel shows Surface Render Method = Forward.

Press Space to play the animation (frame 1–150) and watch the scan lines
scroll.  The camera also arcs slowly to the right, sweeping the Fresnel glow
across the silhouette as the viewing angle changes.`,
      },
      {
        title: "Walk the node graph: hex grid branch",
        content: `Select holo_panel_main.  Open the Shader Editor (Shift-F3 or change an
area's editor type).  You will see the full holographic node graph.

Follow the hex grid branch from left to right:
  Texture Coordinate (UV) → Voronoi Texture

  Voronoi settings:
    Dimensions: 2D  (uses only X and Y of the UV — depth is irrelevant)
    Feature: Distance to Edge
    Scale: 9.0  (≈9 cells across the UV width)
    Randomness: 0.08  (near-honeycomb but not perfectly rigid)

  The Distance output is 0 exactly at every cell boundary.  Connect this to
  a Viewer node temporarily to see the raw distance field — dark at edges,
  bright at centroids.

  Math (Subtract): inputs[0]=1.0, inputs[1]=distance
    Inverts the distance: now 1 at edges, ~0.4 at centroids.

  ColorRamp (CONSTANT interpolation):
    Stop 0: position 0.0, black
    Stop 1: position 0.87, WHITE  ← this is the threshold
    Stop 2: position 1.0, white
  With CONSTANT mode the ramp snaps rather than blends: 0–0.87 is black,
  0.87–1.0 is white.  Because the inverted spike peaks at exactly 1.0 only
  at cell edges, only the narrow region above 0.87 lights up — the hex line.

  Increase Scale to 20: more cells, same line width.  Increase Randomness to
  0.8: cells deform into irregular polygons while the line width stays constant.
  The threshold (0.87) is the independent line-width control.`,
      },
      {
        title: "Walk the node graph: scan-line branch",
        content: `The scan-line branch runs parallel to the hex branch.

  Texture Coordinate (UV) → Mapping node (holo_scan_mapping)

  The Mapping node's Y Location socket carries a driver:
    frame * 0.0045
  This adds 0.0045 UV units to V each frame → scan lines scroll upward
  at roughly 2 stripe-heights per second at 24 fps.

  To see the driver: click the Mapping node's Y Location socket, then
  open the Drivers panel (right-click → Edit Driver) to confirm the expression.
  Change 0.0045 to 0.009 to double the scroll speed.

  Mapping → Wave Texture:
    Type: Bands
    Direction: Y  (bands vary with V → horizontal stripes)
    Scale: 18.0  (18 wave cycles per UV unit = 18 scan lines per panel height)
    Distortion: 0.25  (slight lateral wobble in each line)

  ColorRamp (CONSTANT), same threshold technique as the hex ramp:
    Stop 0: 0.0, black
    Stop 1: 0.85, white  ← scan line duty cycle = 1.0 - 0.85 = 15%
    Only the top 15% of the sine wave amplitude triggers the bright stripe.

  Reduce scale to 5: wide spacing between scan lines.  Increase to 40: dense
  raster effect.  Change the Distortion to 2.0: the lines become wavy arcs,
  suggesting signal interference rather than clean data rows.`,
      },
      {
        title: "Walk the node graph: Fresnel amplification",
        content: `The Fresnel branch sits below the hex and scan branches.

  Fresnel node:
    IOR: 1.42  (glass-like; the exact value shifts the angle at which glow begins)
    Normal: unconnected (uses geometry normal automatically)
    Output Fac: 0 at panel face, 1 at silhouette edge

  Math (Multiply Add):
    A = Fresnel Fac  (connected)
    B = 2.2  (FRESNEL_EMIT_BOOST constant)
    C = 1.0  (base value so output is always ≥ 1.0)
    Result = A × B + C → ranges from 1.0 (face-on) to 3.2 (silhouette edge)

  This multiplier connects to the second input of the pattern-multiply node:

  Math (ADD, clamped) — hex_mask + scan_mask → combined_mask [0,1]
  Math (MULTIPLY)     — combined_mask × fresnel_amplifier → amplified_mask
  Math (MULTIPLY)     — amplified_mask × 4.5 → Principled BSDF Emission Strength

  The result: at the panel face, Emission Strength = pattern × 4.5 (no boost).
  At the rim, Emission Strength = pattern × 3.2 × 4.5 ≈ pattern × 14.4.
  The rim is more than three times brighter per line element than the face.

  Increase FRESNEL_EMIT_BOOST (the 2.2 constant on Multiply Add) to 5.0:
  the rim becomes intensely over-bright while the face stays controlled.
  Set it to 0: uniform brightness — no edge distinction, reads as a flat texture.`,
      },
      {
        title: "Inspect the alpha pipeline",
        content: `The alpha accumulator is the bottom branch of the graph.

  Three signals converge:
    1. BASE_ALPHA = 0.05 (hard-coded constant input to the first ADD node)
    2. combined_mask × PATTERN_ALPHA_MIX (0.55) → patt_alpha node
    3. Fresnel Fac × FRESNEL_ALPHA_BOOST (0.40) → fres_alpha node

  ADD: BASE_ALPHA + patt_alpha → intermediate
  ADD (clamped): intermediate + fres_alpha → final Alpha socket on Principled BSDF

  Test by plugging the Alpha output into a MixShader to preview it in isolation:
    - Add a Transparent BSDF node (pure transparency)
    - Add a Diffuse BSDF node with white colour
    - MixShader Fac = your computed alpha
    - Surface of the output = MixShader
    - Look at the panel from exactly front-on: you should see only faint
      lines and a bright rim strip at the very edge.

  Key insight: the alpha and the emission strength are driven by the SAME
  combined_mask × Fresnel signal.  This means you can only see through the
  panel exactly where it is not glowing — the dark areas between lines are
  transparent windows.  This is the property that makes holographic panels
  feel "projected in space" rather than painted on a card.`,
      },
      {
        title: "EEVEE-Next material settings and Bloom",
        content: `Select holo_panel_main.  Open Properties → Material (sphere icon).
Scroll to the Settings section.

  Surface Render Method: Forward
    This is the EEVEE-Next (4.2+) replacement for blend_method = 'BLEND'.
    Without it, Alpha < 1.0 is silently ignored and the panel renders solid.
    In Cycles, this property has no effect — Cycles uses Path Tracing and
    evaluates the Alpha socket natively.

  Shadow Mode: None
    A holographic projection casts no physical shadow.  Set to Opaque to
    see what the shadow would look like (a flat opaque card shadow) — then
    set back to None.

  Backface Culling: Off
    Allows the material to render on both faces.  Necessary for WebXR where
    the viewer can orbit past the panel edge and see the reverse side.

Open Properties → Render (camera icon).  Scroll to Effects → Bloom:
  Toggle Bloom off: the scan lines and hex grid are visible as flat colour
  but have no halo.  Toggle back on: the Bloom Threshold (0.8) means any
  pixel with combined emission above 0.8 gets a radial glow — triggering
  on the scan/hex intersections and strongly on the silhouette rim.
  Increase Bloom Radius to 12: the halo becomes a wide soft cloud around
  the panel.  Reduce to 2: tight bright highlights only at intersections.`,
      },
      {
        title: "Export the panel as GLB and verify emissive strength",
        content: `File → Export → glTF 2.0.  In the export dialog:
  Format: GLB
  Include → Materials: ticked
  Transform → Apply: ticked (applies the non-uniform scale on holo_panel_main)
  Compression → Draco: ticked (Blender's bundled Draco; level 6 for studio standard)
  Image format: WebP

Click Export glTF 2.0.

Open the exported .glb in a browser using a model-viewer embed or
https://gltf-viewer.donmccurdy.com.  The hex and scan lines should glow
with the original brightness because KHR_materials_emissive_strength was
applied automatically (check the raw JSON in the GLB: open it in a hex
editor or use a glTF validator — look for the extension name in the
materials array).

The alpha blending mode in the exported glTF material JSON will read:
  "alphaMode": "BLEND"
This matches the FORWARD render method and allows Three.js to render the
panel with sorted transparency.  If the panel renders opaque in the
browser, the export dialog may have applied Transform → Apply incorrectly
causing the mesh normals to flip; re-export with Apply unchecked as a test.`,
      },
    ],
    finalResult:
      "A Blender 5.1 holographic interface panel material using three emissive signal layers — Voronoi hex grid, animated scan lines, and Fresnel rim amplification — over a near-transparent base. Panel is nearly invisible face-on, semi-opaque at glowing lines, and fully opaque at the silhouette edge. EEVEE-Next surface_render_method FORWARD for sorted alpha, shadow_method NONE, KHR_materials_emissive_strength in the exported GLB for WebXR Three.js compatibility.",
    variations: [
      "Colour scheme variants: replace the single cyan EMISSIVE_COLOUR with a Mix node driven by a Noise Texture — different frequency regions of the panel glow in different hues (cyan at hex grid, amber at scan lines). Feed the noise into a ColorRamp mapping (0=cyan, 0.5=green, 1=amber) and multiply this colour into the Emission Color socket alongside the strength. The result looks like a multi-spectrum frequency display.",
      "Damage / corruption effect: add a third Voronoi lookup in SMOOTH_F1 mode (nearest centroid distance, smooth variant) to produce large irregular patches. Run these through a GREATER_THAN Math node (threshold ~0.6) to create irregular 'dead panel' regions. Multiply the combined hex+scan mask by (1 − dead_regions): lines disappear in dead zones and the panel appears damaged — useful for dystopian scene-setting or glitch transitions.",
      "Physical frame border: add a Wireframe modifier to a duplicated copy of the panel mesh (Thickness = 0.012 m, Use Replace = True). Apply a separate pure Emission material with no alpha to the wireframe object. The wireframe traces the panel's four edges as solid bright bars while the main panel interior uses the holographic transparency. This is the standard Holoflow spatial-UI assembly for panels that need a clear border distinguishing them from the background in all lighting conditions.",
    ],
    troubleshooting: [
      {
        symptom: "Panel renders as a solid white or teal card — no transparency",
        cause:
          "Surface Render Method is not set to Forward. In Blender 5.1 (EEVEE-Next), the legacy blend_method = 'BLEND' alone is insufficient — the canonical property is mat.surface_render_method = 'FORWARD'. If the panel was created in an older Blender version and the material migrated, the surface_render_method may be absent or set to 'DEFERRED', which does not support alpha blending.",
        fix: "In the Properties panel → Material → Settings, set Surface Render Method to Forward. In Python: mat.surface_render_method = 'FORWARD'. If the setting does not appear, confirm the active render engine is EEVEE (not Cycles or Workbench): Properties → Render → Render Engine → EEVEE.",
      },
      {
        symptom: "No edge glow — the rim does not brighten relative to the panel face",
        cause:
          "The Fresnel node is computing correctly but the MULTIPLY_ADD output is feeding into a node that clamps or normalises it before reaching the Emission Strength socket. A common mistake is connecting the Fresnel Fac directly to the Emission Strength rather than through the amplifier math chain, giving a flat 0–1 range rather than the intended 1.0–3.2 boost.",
        fix: "Check the Math node chain: Fresnel Fac → MULTIPLY_ADD (A×B+C where B=2.2, C=1.0) → output should be 1.0 to 3.2. Verify this node's output goes to the MULTIPLY node that multiplies it by the combined pattern mask. If the MULTIPLY_ADD is missing, insert it: the direct path Fresnel Fac × pattern gives a 0–1 range rather than the boosted 1.0–3.2 range required for the rim effect.",
      },
      {
        symptom: "Scan lines are not scrolling during animation playback",
        cause:
          "The driver on the Mapping node's Y Location is not evaluating. This can happen if the .blend file was opened with Drivers Auto-Execution disabled (a security setting for untrusted files). Blender disables Python drivers from files not on the trusted path.",
        fix: "In the top bar, look for a yellow warning banner reading 'Python scripts disabled in this file'. Click Allow Execution. Alternatively: Edit → Preferences → Save & Load → Blend Files → Trusted Source. Re-open the blend file, or manually trigger driver evaluation with bpy.context.evaluated_depsgraph_get().update() in the Python console. The driver expression 'frame * 0.0045' is safe pure-float arithmetic with no external calls.",
      },
    ],
  },
  base,
);

export { entry };
