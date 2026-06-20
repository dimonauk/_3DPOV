import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function CompositorKeyingGreenScreenBody() {
  return (
    <>
      <p>
        Chroma keying — pulling a matte from a coloured backdrop — looks simple
        from the outside: &ldquo;make green pixels transparent.&rdquo; Under
        the hood, Blender&apos;s{" "}
        <code>CompositorNodeKeying</code> does something considerably more
        careful. It converts each pixel to YCbCr colour space, where Y is
        luminance (how bright the pixel is) and Cb/Cr are the chroma channels
        (the hue and saturation, separated from brightness). The key colour you
        sample is treated as the centroid of the chroma distribution you want
        to remove. Pixels whose chroma distance from that centroid falls below{" "}
        <code>clip_black</code> become fully transparent; pixels above{" "}
        <code>clip_white</code> become fully opaque; everything between is a
        partial alpha. This matters because human skin tones contain almost no
        green chroma — green is the channel most separated from skin across the
        full range of human complexions, which is why green backdrops produce
        the cleanest mattes. Blue backdrops were preferred in analogue
        compositing (bluescreen) because analogue television had a stronger blue
        channel, but digital cameras have{" "}
        <em>twice as many green photosites</em> in a Bayer sensor pattern,
        giving green the highest signal-to-noise ratio and therefore the cleanest
        separation for digital keying. Compare this with the physical approach to
        foreground isolation — the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-shadow-catcher-holdout-ar-composite"
          className={lk}
        >
          EEVEE Shadow Catcher and Holdout AR composite
        </Link>
        , which isolates a rendered subject against a real-world background by
        rendering the <em>shadow</em> as the matte rather than extracting it
        from colour data.
      </p>

      <p>
        The <strong>despill</strong> step is what separates a competent key from
        an amateur one. Even with a perfect matte, the green backdrop reflects
        green light back onto the subject — particularly on light clothing, hair
        edges, and glass surfaces. Blender&apos;s despill formula is:{" "}
        <code>
          G&prime; = G − despill_factor × (balance × R + (1 − balance) × B)
        </code>
        . At <code>despill_balance = 0.5</code> (neutral), this suppresses
        green by averaging R and B and subtracting a scaled amount; the more
        of the key-coloured green the pixel contains, the more green is
        subtracted. A balance towards 0 leans on the blue channel to define
        &ldquo;what is not green&rdquo;, which suits subjects lit with warm
        incandescent light (where the blue channel is naturally low and should
        not be the reference). A balance towards 1 leans on red, which suits
        subjects shot under cool LED panels. Getting this wrong produces a
        magenta (over-despilled, R+B too dominant) or yellowish (under-despilled,
        G remains) fringe on edges — both highly visible in motion. The colour
        correction pipeline after the key, here using a{" "}
        <code>CompositorNodeColorBalance</code> Lift/Gamma/Gain to add a slight
        blue warmth that matches the virtual space background, is the sister
        technique to the full grade demonstrated in the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-color-grading-rgb-curves-cdl"
          className={lk}
        >
          Compositor colour grading tutorial
        </Link>
        .
      </p>

      <p>
        The <strong>matte refinement chain</strong> — Keying&nbsp;Matte output
        → <code>CompositorNodeDilateErode</code> (mode <code>FEATHER</code>,
        distance&nbsp;−1) → <code>CompositorNodeBlur</code> (Gaussian, 2&nbsp;px)
        → <code>CompositorNodeSetAlpha</code> — addresses the hardest edge case
        in keying: fly-away hair and translucent glass against a bright backdrop.
        The Keying node&apos;s internal feather already softens the boundary, but
        a second pass through DilateErode in FEATHER mode (as opposed to STEP
        mode, which is a hard erosion) blurs the matte perimeter with a cosine
        falloff. This prevents the &ldquo;electric edge&rdquo; artefact where
        the Alpha Over boundary pulses in and out of subpixel precision on
        animated footage. SetAlpha then replaces the keyed image&apos;s embedded
        alpha with this cleaned matte — the two-matte-path architecture means
        you can fine-tune the silhouette independently of the despill colour
        correction. For the Cryptomatte equivalent (isolating by object ID rather
        than colour), see the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-cryptomatte-multilayer-exr"
          className={lk}
        >
          Cryptomatte multi-layer EXR tutorial
        </Link>
        .
      </p>

      <p>
        <strong>AlphaOver premultiplication</strong> is the source of the
        single most common error in Blender compositing: the dark-halo artefact.
        Blender&apos;s Keying node always outputs <em>straight alpha</em>: the
        colour channels contain the raw pixel colour, and the alpha channel is
        separate. Premultiplied alpha stores colour pre-multiplied by alpha
        (pixels at 50% opacity have their colour values halved). The AlphaOver
        node&apos;s <code>premul</code> parameter assumes your foreground is
        premultiplied when set to 1.0 — if your keyed image is straight alpha
        (which it is from the Keying node) and you set <code>premul = 1.0</code>
        , the edge pixels get divided by their own alpha <em>and</em> then
        pre-multiplied again, creating a dark halo at 50%-transparent edges.
        Keep <code>premul = 0.0</code> when working with the Keying node output.
        This is the same straight-alpha discipline enforced in the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-oidn-denoise-cycles-passes"
          className={lk}
        >
          OIDN denoising pipeline
        </Link>
        , where compositing render passes before recombining them requires
        careful attention to which passes are premultiplied (Combined,
        Shadow) and which are not (Albedo, Normal).
      </p>

      <p>
        For <strong>studio tutorial production</strong> — Dimona recording
        Blender walkthroughs against a physical green screen — the pipeline
        extends naturally into the VSE. Record the screen in OBS (Blender
        window source, 1920 × 1080) and separately record the presenter against
        a green backdrop; key the presenter footage in the compositor, composite
        the keyed presenter over the screen recording as the virtual background,
        grade for colour consistency, then assemble titles and cuts in the Video
        Sequence Editor. The full VSE assembly workflow — strip import, colour
        balance on strips, H.264 export — is in the{" "}
        <Link
          href="/tutorials/blender-tutorial-vse-screen-recording-to-tutorial-export"
          className={lk}
        >
          VSE screen-recording to tutorial export tutorial
        </Link>
        . The Keying node described here produces the presenter&apos;s RGBA
        layer; the VSE tutorial handles everything downstream of that output file.
      </p>

      <p>
        <strong>Troubleshooting checklist:</strong> (1)&nbsp;Grey halo — lower{" "}
        <code>clip_black</code> (to 0.01 or less); the fringe is being
        partially keyed but not fully transparent. (2)&nbsp;Subject midtones
        turn transparent — raise <code>clip_white</code> (try 0.90–0.95); the
        Keying node is treating semi-bright subject pixels as backdrop.
        (3)&nbsp;Green tint on skin — increase <code>despill_factor</code>{" "}
        towards 0.9; recalibrate <code>despill_balance</code> by sampling the
        skin tone from the Viewer node and adjusting until the magenta/yellow
        colour cast is neutral. (4)&nbsp;Fringe remains after erosion — increase
        the DilateErode <code>distance</code> magnitude (more negative); also
        check that the physical green backdrop is evenly lit — hotspots
        (overexposed green areas above the key colour saturation) defeat the
        clipping thresholds. (5)&nbsp;Dark halo — confirm{" "}
        <code>ao.premul = 0.0</code>; see the premultiplication note above.
      </p>
    </>
  );
}

const base = {
  slug: "blender-tutorial-compositor-keying-green-screen-despill-tutorial-production",
  title:
    "Compositor — Chroma Key & Despill: Green-Screen Post-Production for Tutorial Videos",
  blurb:
    "Pull a clean matte from a green backdrop using Blender's Keying node — despill, edge erosion, matte blur, AlphaOver — and composite over a virtual replacement background. Built for studio tutorial production workflows.",
  tags: ["blender", "compositing", "keying", "chroma-key", "despill", "green-screen"],
  date: "2026-06-20",
  libraryPath:
    "public/library/blends/compositing/compositor-keying-green-screen-despill-tutorial-production",
  sources: [
    {
      label: "Blender Manual — Keying Node",
      url: "https://docs.blender.org/manual/en/latest/compositing/types/matte/keying.html",
      licence: "CC-BY-SA-4.0",
      author: "Blender Foundation contributors",
    },
    {
      label: "Blender Manual — Compositor Matte Nodes",
      url: "https://docs.blender.org/manual/en/latest/compositing/types/matte/index.html",
      licence: "CC-BY-SA-4.0",
      author: "Blender Foundation contributors",
    },
  ],
  body: CompositorKeyingGreenScreenBody,
} satisfies Parameters<typeof buildInstructable>[0];

export const entry: Entry = buildInstructable(
  {
    troubleshooting: [
      {
        symptom: "Grey or semi-transparent halo around the subject",
        cause:
          "clip_black is too high — partial-alpha edge pixels from the fringe zone are not being fully zeroed.",
        fix:
          "Lower clip_black to 0.01 or 0.005. The Keying node treats any chroma distance below clip_black as fully transparent; raising it trims the alpha ramp too aggressively on the bright side of the gradient edge.",
      },
      {
        symptom: "Subject midtones become transparent during movement",
        cause:
          "clip_white is set too low; subject pixels with moderate green reflection (e.g. a white shirt reflecting backdrop light) have chroma distances that fall inside the semi-transparent zone.",
        fix:
          "Raise clip_white from 0.85 towards 0.90–0.95. Check the backdrop for even illumination — uneven green lighting creates local hotspots that push the clip_white threshold down artificially.",
      },
      {
        symptom: "Green colour cast remains on subject edges after keying",
        cause:
          "despill_factor is insufficient for the amount of backlight bounce hitting the subject.",
        fix:
          "Increase despill_factor towards 0.9 or 1.0. Also check despill_balance: if the subject is lit with warm tungsten (high R, low B), shift balance towards 0 to use B as the reference; if lit with cool LEDs, shift towards 1.",
      },
      {
        symptom: "Dark outline / halo appears in the composited AlphaOver output",
        cause:
          "Premultiplication mismatch. The Keying node outputs straight alpha. With ao.premul=1.0, the AlphaOver node divides edge colours by alpha (straight→premult conversion) then composites — double-processing the already-straight data darkens edges.",
        fix:
          "Set ao.premul = 0.0. If using an external footage file as foreground (e.g. an already-premultiplied EXR from a Cycles render), set ao.premul = 1.0 and wire the footage directly without the Keying node.",
      },
      {
        symptom: "Keying node mute toggle in record.py raises AttributeError",
        cause:
          "Node labels set in blueprint.py must exactly match the string literals used in record.py's next() filter. If blueprint.py was modified after the labels were written, the filter finds no matching node.",
        fix:
          "Verify node labels: in the compositor, select each node and check its Label field in the N-panel (Item tab). Update the string literals in record.py to match.",
      },
    ],
  },
  base,
);
