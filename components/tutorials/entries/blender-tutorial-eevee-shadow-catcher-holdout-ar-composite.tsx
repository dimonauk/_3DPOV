import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function EeveeShadowCatcherBody() {
  return (
    <>
      <p>
        A shadow catcher is a ground plane that receives the shadows cast by hero
        objects but renders its own surface as fully transparent. The alpha channel
        of the output PNG encodes shadow density: 0.0 where the ground is
        unaffected, fractional values where shadows fall. Composite that RGBA image
        over any background photograph and you add only the shadow — never the CG
        ground plane itself. The result is the standard pipeline for AR product
        visualisation, WebXR scene previews, and any shot where a 3-D object must
        land convincingly on a real-world surface.
      </p>

      <p className="mt-3">
        In Blender 5.1 EEVEE Next the entire mechanism is two properties:{" "}
        <code>obj.is_shadow_catcher = True</code> on the ground plane, and{" "}
        <code>scene.render.film_transparent = True</code> to make the world
        background render as alpha zero. EEVEE Next (introduced in Blender 4.2)
        bakes the shadow directly into the beauty pass alpha — no separate shadow
        catcher pass is needed, unlike Cycles which provides a dedicated{" "}
        <code>Shadow Catcher</code> render pass. For this reason the compositor
        node graph is smaller with EEVEE: a single{" "}
        <code>Alpha Over</code> node blends the RGBA render onto a background
        plate. The{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-aov-custom-render-passes"
          className={lk}
        >
          AOV custom render passes tutorial
        </Link>{" "}
        covers the multi-pass anatomy in depth; this tutorial uses EEVEE&rsquo;s
        single-pass approach instead.
      </p>

      <p className="mt-3">
        A holdout object is conceptually distinct from a shadow catcher. Where
        the catcher <em>receives</em> light information, a holdout object{" "}
        <em>punches a matte hole</em>: every pixel it covers is set to{" "}
        (0, 0, 0, 0) regardless of what is behind it. The blueprint uses a
        vertical card behind the hero as a framing holdout, ensuring the background
        plate shows through only inside a controlled crop rectangle. This avoids
        the world-colour fringe that appears at frame edges when{" "}
        <code>film_transparent</code> is on but nothing constrains the visible
        area.
      </p>

      <p className="mt-3">
        Sources:{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/render/cycles/object_settings/visibility.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Object Visibility (Shadow Catcher / Holdout)
        </a>{" "}
        (© Blender Foundation, CC-BY-SA 4.0) ·{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/render/eevee/index.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — EEVEE Next
        </a>{" "}
        (© Blender Foundation, CC-BY-SA 4.0).
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Shadow catcher vs Cycles shadow pass
      </h2>
      <p>
        Cycles users are accustomed to the{" "}
        <Link
          href="/tutorials/blender-tutorial-cycles-light-groups-non-destructive-relight"
          className={lk}
        >
          light groups
        </Link>{" "}
        and render pass system: enable the <em>Shadow Catcher</em> pass in View
        Layer properties, render a multi-layer EXR, and composite in post. EEVEE
        Next bypasses that overhead. The shadow is deposited directly into the
        beauty pass alpha during the single EEVEE render, so you get a usable
        RGBA PNG from a single F12 press. The trade-off is limited per-light
        shadow control: you cannot isolate one light&rsquo;s shadow from another in
        a single EEVEE pass the way the Cycles{" "}
        <Link
          href="/tutorials/blender-tutorial-cycles-light-groups-non-destructive-relight"
          className={lk}
        >
          light group system
        </Link>{" "}
        allows.
      </p>
      <p className="mt-2">
        For cinematic work requiring per-light shadow isolation, use Cycles. For
        rapid AR product renders and WebXR asset previews where one combined shadow
        is sufficient, EEVEE Next&rsquo;s single-pass approach is significantly faster.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Film transparent + image format
      </h2>
      <p>
        <code>scene.render.film_transparent = True</code> causes EEVEE to render
        the world background as alpha 0. All geometry that is not a shadow catcher
        or holdout renders normally with alpha 1. Shadow catcher geometry renders
        as alpha proportional to shadow intensity — a fully occluded area reaches
        alpha 1 (full shadow), a penumbra region has fractional alpha.
      </p>
      <p className="mt-2">
        This only works if the output format preserves the alpha channel.{" "}
        <strong>PNG with Colour Mode RGBA</strong> is the correct choice for still
        frames. For video output, use{" "}
        <code>image_settings.file_format = &apos;OPEN_EXR&apos;</code> with{" "}
        <code>color_mode = &apos;RGBA&apos;</code> — standard MP4/H.264 cannot carry
        meaningful alpha. The{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-oidn-denoise-cycles-passes"
          className={lk}
        >
          OIDN denoising tutorial
        </Link>{" "}
        covers the multi-pass EXR workflow in depth.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Compositor Alpha Over node
      </h2>
      <p>
        The <code>Alpha Over</code> compositor node composites one image on top of
        another using the top image&rsquo;s alpha. With straight alpha (
        <code>premul = 0</code>): every pixel of the background plate is replaced
        by the corresponding pixel of the render where the render&rsquo;s alpha is 1;
        the plates blend proportionally at fractional alpha; the background shows
        completely where alpha is 0. A shadow at 60% alpha coverage mixes 60% of
        the shadow colour with 40% of the background — the result is a natural
        semi-transparent shadow penumbra rather than a hard edge.
      </p>
      <p className="mt-2">
        For WebXR delivery the compositor step happens in the browser, not in
        Blender: the RGBA PNG is loaded as a{" "}
        <code>THREE.MeshBasicMaterial</code> on a billboard plane and placed in
        the Three.js/WebXR scene. The browser&rsquo;s alpha compositing produces the
        same result as Blender&rsquo;s Alpha Over node. The holographic panel shader
        described in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-holographic-panel-emission-fresnel"
          className={lk}
        >
          holographic panel tutorial
        </Link>{" "}
        uses the same billboard-with-alpha approach for its emission plane.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Material considerations for the catcher plane
      </h2>
      <p>
        The shadow catcher material itself does not need a custom node setup — a
        plain white Principled BSDF with roughness 1.0 works. EEVEE ignores the
        material&rsquo;s colour when compositing the shadow, using only the shadow
        intensity sampled from the light. The material matters for soft-probe
        interactions (irradiance volumes, reflection probes), but for a flat ground
        plane in a product viz scene, the default diffuse setup is correct.
      </p>
      <p className="mt-2">
        One exception: if you want the ground to also carry ambient occlusion
        contact shadows (the darkening where the object sits close to the ground),
        enable <code>eevee.use_gtao = True</code> (Ambient Occlusion in EEVEE
        settings). AO from the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-ao-pointiness-edge-highlight"
          className={lk}
        >
          AO + Pointiness edge highlight tutorial
        </Link>{" "}
        is a shader-side approach; EEVEE&rsquo;s GTAO setting is a global post-process
        that deposits contact AO onto all diffuse surfaces including shadow catchers.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Headless bpy API notes
      </h2>
      <p>
        The blueprint avoids <code>bpy.ops.mesh.primitive_plane_add()</code> for
        the shadow catcher and holdout planes, using{" "}
        <code>bmesh.ops.create_grid()</code> instead. The operator requires an
        active 3-D Viewport context present at call time — fragile in background
        mode. The bmesh route creates the mesh data directly, which works reliably
        in <code>blender --background</code>. The{" "}
        <code>is_shadow_catcher</code> and{" "}
        <code>is_holdout</code> properties are set on the object after creation and
        work in background mode without any context override.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "45 min – 1 hour",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: [
        "Blender 5.1 (free, blender.org)",
        "EEVEE Next (default renderer in Blender 5.1)",
      ],
      tools: [
        "blueprint.py (builds ar_composite.blend)",
        "record.py (renders 120-frame gem rotation → viewport.mp4)",
        "OBS Studio or Windows Game Bar (screen.mp4)",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py to build the scene",
        body: "Open a terminal, navigate to public/library/blends/rendering/eevee-shadow-catcher-holdout-ar-composite/, and run: blender --background --python blueprint.py. Blender writes ar_composite.blend with the teal gem hero, shadow catcher ground plane, holdout crop card, three-point lighting rig, and compositor nodes pre-wired.",
      },
      {
        title: "Confirm the shadow catcher flag",
        body: "Open ar_composite.blend. In the viewport, select shadow_catcher_ground. In Object Properties (orange square icon in the Properties panel), scroll to the Visibility section. Confirm the Shadow Catcher checkbox is ticked. This single flag is all EEVEE needs — no material changes required.",
      },
      {
        title: "Confirm film transparent + RGBA output",
        body: "Switch to Render Properties (camera icon). Scroll to the Film section — confirm Transparent is ticked. Scroll down to Output → Format — confirm PNG is selected and Colour Mode is RGBA. If Colour Mode shows RGB, the alpha channel will be discarded and the shadow composite will not work.",
      },
      {
        title: "Render a test frame with F12",
        body: "Press F12. EEVEE Next renders the frame. In the Image Viewer, toggle alpha display: Image menu → Display Alpha → As Is. You should see the teal gem solid, the shadow as a semi-transparent grey shape beneath it, and everywhere else as a transparent checkerboard. The shadow's opacity matches the penumbra of the area light — softer at the edges, denser directly beneath the gem.",
      },
      {
        title: "Inspect the compositor node graph",
        body: "Open the Compositor (switch the editor type in any panel). The graph has four nodes: Render Layers (source), Image (background plate placeholder), Alpha Over (compositing), and Composite (output). The background warm-white plate feeds the bottom input of Alpha Over; the Render Layers output (RGBA) feeds the top input. The Alpha Over output goes to Composite and Viewer.",
      },
      {
        title: "Swap the background plate",
        body: "Click the Image node. In its header, click the image datablock selector and choose Open Image. Load any freely-licensed photograph (a wooden table, a studio backdrop, a floor texture). Press Numpad 0 to align the Viewer, then press Shift+Ctrl+F12 (Render Animation, one frame) to see the gem + shadow composited over the real photograph. The shadow catcher makes the gem appear to rest on the table surface.",
      },
      {
        title: "Explore the holdout crop card",
        body: "Select holdout_surround. It is a vertical plane behind the hero with is_holdout = True. In the render it appears as a transparent rectangle — it punches a hole through the render for all pixels it covers, regardless of what is behind it. Render with F12 to confirm. Useful when you want only a framed window of background visible, with solid black (or composited colour) at the frame edges.",
      },
      {
        title: "Record the turntable",
        body: "Back in the terminal: blender --background ar_composite.blend --python record.py. This renders 120 frames (24 fps, 640×360) of the gem rotating 360°, writing PNGs to the frames/ sub-folder, then encoding to viewport.mp4 via ffmpeg. The moving shadow arc across the transparent ground is the visual proof of the technique.",
      },
      {
        title: "Screen-record the compositor walkthrough",
        body: "Follow SCREEN-RECORDING-NOTES.md: OBS window capture at 1920×1080, 30 fps, audio off. Walk through: Shadow Catcher checkbox in Object Properties → Film Transparent in Render Properties → F12 render with alpha toggle → Compositor node graph → background swap. Save as screen.mp4.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Shadow renders as solid white or grey, no transparency",
        cause:
          "scene.render.film_transparent is False, or the output format is RGB not RGBA. The shadow catcher deposits shadow into the alpha channel — if the alpha is discarded (RGB mode) or the world renders as a solid colour (film_transparent off), the alpha information is lost.",
        fix: "Render Properties → Film → tick Transparent. Output → Format → Colour Mode = RGBA. Re-render.",
      },
      {
        symptom: "is_shadow_catcher attribute not found on object",
        cause:
          "Object type is not MESH. The shadow catcher property is available on mesh objects only. A curve, light, or empty object does not have it.",
        fix: "Convert the ground plane to a mesh (Object → Convert To → Mesh) or use a mesh primitive from the start.",
      },
      {
        symptom: "Shadow appears but the ground plane surface is still visible",
        cause:
          "is_shadow_catcher is True but film_transparent is still False. Without transparent world, EEVEE renders the ground plane's diffuse colour on top of the shadow, making the shadow invisible or merged into the solid surface.",
        fix: "Enable Film → Transparent in Render Properties. With both flags active, the ground surface disappears and only the shadow alpha remains.",
      },
      {
        symptom: "Holdout card shows as black instead of transparent",
        cause:
          "film_transparent is False. The holdout punches a hole to the world background — if the world is not transparent, the hole fills with the world colour (typically dark grey or black).",
        fix: "Enable Film → Transparent. Now the holdout pixels show as (0,0,0,0) — true transparent — and the background plate from the compositor Image node fills in.",
      },
      {
        symptom: "Alpha Over output looks washed-out or double-composited",
        cause:
          "Premultiplied alpha mismatch. The render output is straight alpha but the Alpha Over node's Convert Premultiplied checkbox changes the blending maths.",
        fix: "Set Alpha Over → Convert Premultiplied to off (premul = 0) when the source is PNG straight alpha. Toggle it on only when compositing EXR images that carry premultiplied data.",
      },
    ],
    finalResult:
      "A 1280×720 RGBA PNG of a faceted teal gem crystal floating above a transparent ground, with a soft shadow visible only in the alpha channel. A Compositor Alpha Over node composites the render over any background plate, placing the shadow naturally over the surface. A 120-frame EEVEE viewport rotation (viewport.mp4) shows the shadow arc sweeping across the transparent ground as the gem spins.",
  },
  {
    slug: "blender-tutorial-eevee-shadow-catcher-holdout-ar-composite",
    title:
      "Rendering: EEVEE Next Shadow Catcher + Holdout — AR-Ready Composite Ground Pass (Blender 5.1)",
    date: "2026-06-18",
    kind: "tutorial",
    excerpt:
      "Mark a ground plane as a Shadow Catcher in EEVEE Next, enable Film Transparent, and output a single RGBA PNG where the shadow lives entirely in the alpha channel. A Compositor Alpha Over node composites it over any background photo — the standard pipeline for AR product visualisation and WebXR spatial previews.",
    tags: [
      "blender",
      "eevee",
      "shadow-catcher",
      "holdout",
      "compositing",
      "ar",
      "rendering",
      "product-viz",
      "webxr",
      "alpha",
    ],
    Body: EeveeShadowCatcherBody,
  },
);
