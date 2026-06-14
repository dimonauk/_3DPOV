import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function CompositorKeyingGreenScreenDespillBody() {
  return (
    <>
      <p>
        Chroma keying works in the opponent-colour domain, not in RGB.  When
        you set the Keying node&apos;s <code>screen_color</code> to chrome
        green (roughly 0.0&thinsp;0.7&thinsp;0.0 in scene-linear sRGB), the
        node converts each pixel to a single scalar that measures how much it
        &ldquo;looks like&rdquo; that target hue — accounting for luminance
        variance so that a dark green shadow reads as screen even when its
        absolute RGB values are far from the pure key colour.  The resulting
        floating-point matte (0&thinsp;=&thinsp;definite foreground,
        1&thinsp;=&thinsp;definite background) is thresholded by{" "}
        <strong>Clip Black</strong> and <strong>Clip White</strong> into a soft
        alpha: the narrow zone between them is where hair, ears, and fine cloth
        live, and calibrating those two values is the entirety of keying craft.
      </p>
      <p className="mt-3">
        Two artefacts demand separate fixes after the raw matte is correct.
        First: <strong>green spill</strong> — photons bounce off the screen
        surface and contaminate the subject&apos;s near edges with a sickly
        green tint.  The Keying node&apos;s built-in Despill uses the{" "}
        <code>screen_balance</code> parameter (the relative weight of Red vs
        Blue as the opponent axis) to estimate what the contaminated pixels
        should look like without the green contamination, then blends toward
        that estimate at a rate set by <code>despill_factor</code>.  Second:{" "}
        <strong>matte fringe</strong> — the key boundary is imprecise along
        geometrically flat-shaded edges, leaving a one-or-two-pixel green
        outline.  <code>dilate_distance</code> set to &minus;2 shrinks the
        matte inward past that fringe; <code>blur_post</code> feathers the
        new boundary so it blends rather than clips.
      </p>
      <p className="mt-3">
        This pipeline is essential for compositing 3D renders against real
        photography (shot on a green screen) or for separating render layers
        more aggressively than Cryptomatte allows — for example, when you need
        to replace the environment behind a rendered character without access to
        separate render passes.  See the{" "}
        <Link href="/tutorials/blender-tutorial-compositor-cryptomatte-multilayer-exr" className={lk}>
          Cryptomatte + Multi-Layer EXR tutorial
        </Link>{" "}
        for the preferred approach when you control the full render pipeline;
        use Keying when you only have the final image.  The{" "}
        <Link href="/tutorials/blender-tutorial-eevee-light-linking-character-rig" className={lk}>
          three-light character rig tutorial
        </Link>{" "}
        covers how to position the key and fill lights to minimise screen spill
        in the first place — the best despill is the one you don&apos;t need.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        The Keying node compositor chain
      </h2>
      <p>
        The blueprint wires five nodes:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 mt-2 overflow-x-auto whitespace-pre">
{`Render Layers ──▶ [Keying] Image ──▶ [Alpha Over] ──▶ Composite
                         │                  ▲
                         Matte ──▶ MatteViewer
RGB (new bg) ────────────────────▶ [Alpha Over]`}
      </pre>
      <p className="mt-3">
        The <code>Alpha Over</code> node places the keyed foreground
        (Keying → Image, already premultiplied) over a flat deep-navy RGB
        constant that simulates a new scene environment.  The MatteViewer lets
        you isolate the raw greyscale alpha to diagnose fringe artefacts
        without affecting the composite output.  In Python:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 mt-2 overflow-x-auto whitespace-pre">
{`scene.use_nodes = True
nt = scene.node_tree
nt.nodes.clear()

rl     = nt.nodes.new('CompositorNodeRLayers')
keying = nt.nodes.new('CompositorNodeKeying')
bg     = nt.nodes.new('CompositorNodeRGB')
ao     = nt.nodes.new('CompositorNodeAlphaOver')
comp   = nt.nodes.new('CompositorNodeComposite')

# Screen colour — set in scene-linear (not gamma-corrected)
keying.screen_color    = (0.0, 0.70, 0.0)

# Inner / outer matte thresholds
keying.clip_black      = 0.20  # below → foreground (opaque)
keying.clip_white      = 0.85  # above → background (transparent)

# Opponent-colour axis: 0.5 = equal Red / Blue weighting
keying.screen_balance  = 0.5

# Despill: remove screen-bounce contamination from foreground edges
keying.despill_factor  = 0.80
keying.despill_balance = 0.50

# Edge refinement
keying.blur_pre           = 1   # smooth screen noise before keying
keying.blur_post          = 2   # feather the resolved alpha
keying.dilate_distance    = -2  # shrink matte to lose green fringe
keying.edge_kernel_radius = 3

bg.outputs[0].default_value = (0.04, 0.09, 0.28, 1.0)
ao.inputs[0].default_value  = 1.0  # Factor = full composite

lk = nt.links
lk.new(rl.outputs['Image'],     keying.inputs['Image'])
lk.new(bg.outputs[0],           ao.inputs[1])            # background
lk.new(keying.outputs['Image'], ao.inputs[2])            # keyed fg
lk.new(ao.outputs['Image'],     comp.inputs['Image'])`}
      </pre>
      <p className="mt-3">
        The Keying node is also available in Blender 5.1&apos;s GPU compositor
        (Preferences → Compositing → Mode: GPU); behaviour and parameters are
        identical.  Compare the full compositing pipeline from the{" "}
        <Link href="/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping" className={lk}>
          Glare + Film Grain + Tone Map tutorial
        </Link>{" "}
        to see how the Keying node slots into a broader post chain, or the{" "}
        <Link href="/tutorials/blender-tutorial-compositor-oidn-denoise-cycles-passes" className={lk}>
          OIDN Denoise tutorial
        </Link>{" "}
        to understand how render passes feed into the compositor more generally.
      </p>
      <p className="mt-3">
        The outside reference for the node&apos;s parameters is the{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/compositing/types/matte/keying.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Keying Node
        </a>{" "}
        (CC-BY-SA 4.0, Blender Foundation).  For compositor Python scripting
        patterns see{" "}
        <a
          href="https://github.com/njanakiev/blender-scripting"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          njanakiev/blender-scripting
        </a>{" "}
        (MIT, Nicolas Janakiev); related projects in that repo include material
        scripting patterns and geometry automation that pair well with
        compositor automation.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-compositor-keying-green-screen-despill",
  title:
    "Compositor — Keying Node: Chroma Key, Despill & Edge Matte (Blender 5.1)",
  date: "2026-06-14",
  kind: "tutorial",
  excerpt:
    "Remove a green-screen backdrop using Blender 5.1's Compositor Keying node: configure Clip Black/White thresholds, Despill to fix screen-bounce contamination, and dilate/blur edge refinement — with full bpy compositor tree setup.",
  Body: CompositorKeyingGreenScreenDespillBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath: "blends/compositing/compositor-keying-green-screen-despill",
    time: "one focused session",
    difficulty: "intermediate",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    prerequisites: [
      "Comfortable running Python scripts from Blender's Text Editor (Alt+P)",
      "Basic familiarity with the Compositing workspace and Use Nodes toggle",
      "Understanding of the Render Layers node and compositor output routing",
    ],
    steps: [
      {
        title: "Run blueprint.py and render the green-screen scene",
        body: `Open Blender 5.1 — File › New › General. Open the Text Editor (Shift+F11), paste blueprint.py, and press Alt+P.\n\nThe script creates Suzanne in front of a large green emission plane, adds a warm area key light, and adds a secondary green point light (SpillLight) positioned at the screen side. The spill light simulates the real-world phenomenon where screen photons bounce onto the subject's near edges — without it the despill parameter has no visible effect to correct.\n\nPress F12. Cycles renders at 64 samples. After the render completes, the compositor activates automatically (scene.render.use_compositing = True was set). The result shows Suzanne composited over the deep-navy background — green plane is gone, replaced by the RGB constant from the Alpha Over node.\n\nVerify: Suzanne's right ear should show a clean edge without a green outline. If you see a green fringe, the dilate_distance or clip_white values need adjustment — see troubleshooting below.`,
      },
      {
        title: "Inspect the compositor node tree",
        body: `Switch to the Compositing workspace. You will see five nodes:\n\n  Render Layers → Keying → Alpha Over → Composite\n                 Matte  → MatteViewer\n  RGB (bg) ─────────────→ Alpha Over\n\nClick the Keying node and inspect its Properties panel. Note the five parameter groups:\n\n1. Screen Balance (0.5) — which non-green channel anchors the opponent axis\n2. Clip Black (0.20) / Clip White (0.85) — inner/outer matte thresholds\n3. Despill Factor (0.80) + Despill Balance (0.50)\n4. Edge: Blur Pre (1), Blur Post (2), Dilate Distance (−2), Edge Kernel Radius (3)\n\nOpen a UV/Image Editor panel (Shift+F10). In the Render Result slot, switch to the Viewer attached to the MatteViewer node. The greyscale image shows the raw alpha mask: white = foreground (Suzanne), black = background (green plane), grey zone = soft edge transition around the ear outline and fur detail.`,
      },
      {
        title: "Calibrate Clip Black and Clip White",
        body: `In the compositor Keying node, drag Clip Black from 0.20 down to 0.0. Press F12 to re-render. Suzanne's body disappears into the background — clip_black too low means even pixels that look slightly like foreground get classified as background.\n\nDrag Clip Black back up to 0.45. Re-render. The ears and outline are now clipped hard — the soft zone has collapsed. This is clip_black too high: you are pushing the threshold into territory that belongs to the foreground, sacrificing soft-edge quality for a tighter matte.\n\nReset to 0.20. Now drag Clip White from 0.85 up to 1.0. Re-render. A subtle green halo appears at the boundary — the soft zone has widened and some background pixels are now being included. Drag Clip White down to 0.65. The matte hardens and fine edges get cut. Reset to 0.85.\n\nThe productive range for a well-lit screen is approximately Clip Black 0.15–0.25 and Clip White 0.80–0.90. Wider gap = softer edges + more risk of spill. Narrower gap = cleaner background removal + loss of fine detail.`,
      },
      {
        title: "Test Despill and edge refinement",
        body: `Set Despill Factor to 0.0 and re-render. Look at Suzanne's right ear (the SpillLight side): you should see a faint green tint in the bright areas closest to the screen plane. This is uncompensated screen spill. Drag Despill Factor to 1.0 — the tint is overcorrected and that side of the face looks slightly magenta. Reset to 0.80 for balanced correction.\n\nNow change Dilate Distance from −2 to 0. Re-render. A one-to-two-pixel green outline appears on the ear edges and the jaw — the matte has grown back to its unprocessed boundary, which still clips the green fringe region. Change to −4: the ears start to clip. −2 is the sweet spot for this scene.\n\nFinally, change Blur Post from 2 to 0. The matte edge becomes aliased — hard pixel-step transitions. Change to 5: the edge feathers into the background naturally but loses sharpness. 2 matches 1080p pixel density for a 50 mm lens from 5 m.`,
      },
      {
        title: "Add a Garbage Matte to protect problem areas",
        body: `The Keying node's Garbage Matte input (socket index 1) marks pixels that are definitely background — the key never attempts to classify them as foreground, even if their colour happens to match the subject. This is essential for scenes where part of the set shares the screen colour, or where dark shadows on the screen surface produce near-zero matte values.\n\nIn the Compositing workspace, add a new Ellipse Mask node (Add › Mask › Ellipse Mask). Set Width=1.0, Height=1.0 (full frame). Add a Scale node set to RELATIVE with X=0.5, Y=0.7 to create a mask that covers only the centre area where Suzanne appears. Invert the mask (Math › Subtract from 1.0) to mark everything outside the ellipse as background.\n\nWire this inverted mask into Keying.inputs['Garbage Matte']. Re-render. The corners of the frame are now unconditionally transparent, even if any stray green-screen edge crept into those pixels during the render.`,
      },
    ],
    finalResult:
      "A Blender 5.1 compositor chain that isolates a foreground subject from a green-screen backdrop using the Keying node, removes screen spill via despill, refines the matte edge with dilate + blur, and composites the result over a new background — fully scripted via bpy with expert parameter explanations.",
    variations: [
      "Blue-screen key: change KEY_SCREEN_COLOR to (0.0, 0.0, 0.9) and the SpillLight colour to (0.2, 0.2, 1.0). Blue keys are preferred in stage environments where talent wears green clothing. Screen Balance may need adjusting to 0.35 (Red-dominant) since blue screens tend to produce more red-channel opponent signal.",
      "Replace the flat RGB background with a gradient: add a CompositorNodeTexGradient node (gradient_type='SPHERICAL'), wire through a ColorRamp (dark centre, lighter rim), and connect to Alpha Over input 1 instead of the RGB constant. This gives the composited result the look of an environment-lit studio void, matching Holoflow's atelier aesthetic.",
      "Chain Keying into the Glare pipeline for composited VFX: wire Alpha Over → Glare node (FOG_GLOW, threshold=0.70, size=7) → Composite. Any bright highlights on Suzanne (specular, rim light) bloom after compositing, making the subject appear to belong to the new background's lighting environment. See the Glare + Film Grain + Tone Map tutorial for full parameter reference.",
    ],
    troubleshooting: [
      {
        symptom: "Keying node output is entirely transparent — Suzanne disappears",
        cause:
          "screen_color is set to a value that matches the subject (e.g. if Suzanne's albedo is (0.7, 0.3, 0.15) and screen_color was accidentally set to (0.7, 0.0, 0.0), red-channel matching would key out the face). Also check clip_black: if it is >= clip_white the matte thresholds cross and the entire image collapses to transparent.",
        fix: "Verify screen_color matches the green emission plane colour exactly (0.0, 0.70, 0.0). In the Keying node properties, confirm clip_black < clip_white with a gap of at least 0.3. Use the MatteViewer node to see the raw matte: Suzanne's face should appear bright white, the green plane black.",
      },
      {
        symptom: "Green fringe remains on Suzanne's ear edge after keying",
        cause:
          "dilate_distance is 0 or positive, leaving the matte boundary at the colour-transition point rather than inside it. The one-to-two pixel zone around any hard edge retains partial green-plane colour.",
        fix: "Lower dilate_distance to −2 or −3. Combine with increasing blur_post by 1 to feather the new boundary softly. If the fringe persists, also increase edge_kernel_radius from 3 to 5 — a larger kernel detects the full width of the colour transition and the keyer can target it more precisely.",
      },
      {
        symptom: "Despill turns Suzanne's right ear an unnatural magenta",
        cause:
          "despill_factor is too high (close to 1.0) or despill_balance is set to 0 (pure Red replacement). Removing the full green contamination and replacing it entirely with Red produces a pinkish cast on pixels that genuinely had neutral or warm colour before the spill light was added.",
        fix: "Lower despill_factor to 0.6–0.75. Set despill_balance to 0.5 so the replacement evenly weights Red and Blue. If the SpillLight energy is very high in the scene, reduce it at source: the best despill is minimal green contamination to begin with.",
      },
      {
        symptom:
          "The Alpha Over node produces a black halo instead of a clean composite",
        cause:
          "The Keying node outputs premultiplied alpha (RGB already multiplied by A). If the Alpha Over node's Premul checkbox is ticked, it un-premultiplies the alpha a second time, which subtracts luminance from edge pixels and produces a dark fringe.",
        fix: "In the Alpha Over node, ensure Premul (Convert Premultiplied) is OFF (unchecked). Also verify ao.inputs[0].default_value = 1.0 — Factor = 0 would suppress the entire composite. If a black rim persists, add a Dilate/Erode node (Type=Dilate, Distance=1) on the Matte output, feed that into Alpha Over as a custom Factor to slightly grow the opaque region.",
      },
    ],
  },
  base,
);

export { entry };
