import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = (
  <span className="ml-0.5 text-chrome-500">&nearr;</span>
);

export default function CameraFundamentalsManualExposure() {
  return (
    <>
      <p>
        Most people who pick up a camera leave the mode dial on the
        green square for years. The camera is, by and large, fine with
        that. The pictures are, by and large, fine too &mdash; sharp
        enough, exposed enough, in focus enough, faces in the right
        place. If your photographs are fine and you are content,
        congratulations: this tutorial is not for you. Go in peace; I
        wish you many holidays in the sun.
      </p>
      <p>
        If you have ever set the camera down at the end of a session
        and realised the thing in your head was not the thing on the
        card &mdash; the dusk was greyer than you remembered, the
        candle was a fat blob of white where the flame had been, the
        moving subject was a smear when you wanted a streak and a
        statue when you wanted a moment &mdash; sit down. This rung
        is about that gap. The gap closes when the camera does what
        you tell it instead of what it guesses you want. That means
        manual. That means understanding the three dials before
        anything else.
      </p>

      <p>
        <strong>What you are making.</strong> Not a photograph yet.
        A working internal model of what aperture, shutter, and ISO
        actually do, anchored by a half-day of practical exercises
        with the camera in your hand. You will end this rung able to
        walk into a dim room, pick a setting, take a frame, and have
        it look the way you decided &mdash; not the way the camera
        decided. That is the prerequisite for every photograph in
        the rest of the photography ladder, and absolutely the
        prerequisite for the long-exposure work at the top of it.
      </p>

      <p>
        <strong>Pre-flight: kit check.</strong>
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>A camera with a manual mode</strong> &mdash; the M
          on the dial. DSLR, mirrorless, even some bridge cameras
          and the better phone apps. Anything that lets you fix
          aperture, shutter, and ISO independently. If your camera
          only offers P / A / S, you can still follow most of this,
          but you will hit a ceiling at the long-exposure rung. The
          studio uses Canon and Sony bodies; the principles are
          identical across brands.
        </li>
        <li>
          <strong>A lens with a working aperture ring or
          electronic aperture control.</strong> Any kit lens is
          fine. Fixed-aperture lenses (the cheaper end of mirrorless
          zooms) make the exposure-triangle practice harder, not
          impossible.
        </li>
        <li>
          <strong>An SD card with space for fifty RAW frames</strong>
          &mdash; about 1.5 GB on a typical APS-C body, more on
          full-frame. You will shoot more than you think.
        </li>
        <li>
          <strong>A subject that does not move.</strong> A still life
          on a windowsill, a stack of books, a houseplant. The point
          of this rung is to vary the camera while the world holds
          still.
        </li>
        <li>
          <strong>Daylight, and a darkened room.</strong> You need
          both. Mid-morning by a window first; later, a room with the
          blinds down.
        </li>
        <li>
          A tripod if you have one. Not required, but helpful for the
          slow-shutter exercises later.
        </li>
      </ul>

      <p>
        <strong>The three dials.</strong> The camera writes an image
        by collecting photons for a measured length of time through a
        hole of a measured size, then amplifying the result by a
        measured amount. Those three measurements are{" "}
        <strong>aperture</strong>,{" "}
        <strong>shutter</strong>, and{" "}
        <strong>ISO</strong>. Every photograph balances them. The
        balance is the photograph; everything else is taste.
      </p>

      <p>
        <strong>Aperture &mdash; the hole.</strong> A ring of metal
        blades inside the lens that opens and closes. Wide open lets
        a lot of light in; stopped down lets less in. The number on
        the dial is the{" "}
        <a
          href="https://www.cambridgeincolour.com/tutorials/camera-exposure.htm"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          f-stop{arrow}
        </a>{" "}
        &mdash; counterintuitively, a smaller number means a wider
        hole. f/1.8 is wide; f/16 is narrow. The reason it inverts is
        that f-stops are a ratio (focal length over diameter of the
        hole), and the ratio gets larger as the hole shrinks. The
        camera's manual doesn't dwell on this; I am telling you now
        so you don't have to discover it the slow way.
      </p>
      <p>
        Aperture also controls{" "}
        <strong>depth of field</strong> &mdash; how much of the scene
        falls into focus. Wide aperture (small number, f/1.8) =
        narrow depth of field, dreamy backgrounds, one eyelash sharp
        and the other slightly soft. Narrow aperture (large number,
        f/16) = deep field, everything from foreground to horizon
        crisp at once. The exposure-triangle toy at{" "}
        <Link href="/atelier/exposure-triangle" className={ext}>
          /atelier/exposure-triangle
        </Link>{" "}
        (in preparation) shows this trade-off live; until it ships,
        the cleanest static reference is Cambridge in Colour, linked
        above and again at the foot of this rung.
      </p>

      <p>
        <strong>Shutter &mdash; the time.</strong> A pair of curtains
        (or an electronic equivalent on mirrorless) that opens and
        closes. The duration is measured in seconds and fractions of
        a second: 1/2000 is brief enough to freeze a hummingbird's
        wingbeat; 1/60 is roughly the slowest you can hand-hold a
        standard lens without smearing; 15 seconds is the studio's
        usual light-painting shutter; 30 seconds is the longest most
        cameras manage without going into bulb mode. Each doubling
        of shutter time doubles the light. That doubling is called a
        <strong> stop</strong>.
      </p>
      <p>
        Shutter also controls{" "}
        <strong>motion rendering</strong>. A short shutter freezes
        movement; a long shutter blurs it. Both can be right; both
        can be wrong. The studio's whole light-painting practice
        exists because the long shutter lets the swept gesture of a
        rig become a single luminous trail. Without that exposure
        time, the photograph is no longer of a gesture at all.
      </p>

      <p>
        <strong>ISO &mdash; the gain.</strong> How much the sensor
        amplifies the signal it has collected. ISO 100 is the studio
        baseline &mdash; cleanest image, least noise, used for
        anything destined for print. ISO 800 is fine for most
        well-lit indoor work. ISO 3200 and up is the territory of
        last resort &mdash; usable on a modern full-frame body, ugly
        on most APS-C, frankly horrible on a phone. The cleaner the
        image, the lower the ISO; the dimmer the scene, the more you
        have to compromise.
      </p>
      <p>
        Each doubling of ISO is also a stop &mdash; ISO 200 captures
        twice the signal of ISO 100. So the three dials measure the
        same currency in different units, and any photograph you can
        take at one combination, you can take at another combination
        that is one stop different on two of the three. f/4 + 1/60 +
        ISO 100 is the same exposure as f/2.8 + 1/125 + ISO 100, or
        as f/4 + 1/125 + ISO 200. This is{" "}
        <a
          href="https://en.wikipedia.org/wiki/Reciprocity_(photography)"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          reciprocity{arrow}
        </a>
        , and once it clicks you will stop guessing.
      </p>

      <p>
        <strong>The exercises.</strong> A half-day, your camera, a
        still life, a notebook. Take the lens cap off and the brain
        on.
      </p>

      <p>
        <strong>Exercise 1: aperture priority, in your head.</strong>{" "}
        Camera on manual. ISO at 100. Shutter at 1/60. Now walk the
        aperture from its widest setting to its narrowest, taking a
        frame at each whole f-stop. f/1.8, f/2.8, f/4, f/5.6, f/8,
        f/11, f/16 &mdash; or wherever your lens starts and ends.
        Don't worry that the frames get darker; that is the point.
        Pull them up on a screen afterwards and look at two things:
        the background behind your still life, and the brightness.
        The background goes from a soft blur to a crisp tableau; the
        brightness halves every step. You have just witnessed two
        full octaves of trade-off in one column of pictures.
      </p>

      <p>
        <strong>Exercise 2: shutter priority, in your head.</strong>{" "}
        Open the curtains a touch &mdash; let some daylight in. ISO
        at 100, aperture at f/8 (a compromise that keeps the lens
        sharp on most kit). Now walk the shutter from 1/1000 down to
        1 second, doubling each step. The frames brighten as you go;
        somewhere around 1/15 or so they'll start being too bright
        for f/8 + ISO 100 in daylight. That ceiling is informative.
        It tells you that on a sunny day, with the cheap lens stopped
        down, you cannot use a long shutter without something else
        helping you &mdash; a neutral-density filter, a darker room,
        or just nightfall. The studio's light-painting work happens
        in darkness for this reason. The shutter wants 15 seconds;
        the world has to be dim enough to let it have them.
      </p>

      <p>
        <strong>Exercise 3: ISO at the extremes.</strong> Same still
        life. ISO 100, expose correctly &mdash; whatever combination
        does that today. Now bracket the ISO: keep aperture and
        shutter fixed, walk ISO from 100 up to whatever your body's
        maximum is. The frames get brighter and noisier as you go;
        the noise lives mostly in the shadows. Pull the frames up at
        100% magnification and look at a dark patch. The grain is
        the cost. Now you know what ISO 6400 looks like on your
        specific camera; you will not need to wonder again.
      </p>

      <p>
        <strong>Exercise 4: matching the in-camera meter.</strong>{" "}
        Half-press the shutter; the meter scale at the bottom of the
        viewfinder shows -2 / -1 / 0 / +1 / +2. Camera says 0 means
        the camera thinks the exposure is correct &mdash; for a
        scene whose average tone is mid-grey. The camera will be
        wrong about anything that isn't mid-grey: snow, black cats,
        sunsets, dim rooms, candle-lit interiors. The meter is a
        starting point, not an oracle. Trust it; verify it; override
        it when it lies. The override is +1 or +2 if the scene is
        brighter than mid-grey (snow, white wall), or -1 to -2 if
        darker (night street, fire poi).
      </p>

      <p>
        <strong>Manual focus.</strong> Autofocus is excellent and you
        should use it most of the time. There are two situations in
        which autofocus will fail: very low light (the contrast it
        needs to lock isn't there), and long-exposure work (the
        scene goes dark the moment you turn the room lights down,
        and there is no contrast left to lock on at all). Both
        situations matter for the photography ladder. Practise
        manual focus now, when it doesn't cost you anything. Switch
        the lens to MF, look through the viewfinder or the rear
        screen, turn the focus ring, watch the still-life sharpen
        and soften. Most modern bodies offer focus-peaking &mdash; a
        coloured overlay on the in-focus edges. Turn it on. The
        muscle memory of nudging the ring while watching the peak
        bloom is the prerequisite for every dark-room exposure you
        will ever set up.
      </p>

      <p>
        <strong>RAW vs JPEG.</strong> A JPEG is the camera's
        processed interpretation of the scene &mdash; baked white
        balance, baked contrast, baked sharpening, 8 bits per
        channel, locked-in choices. A RAW file is the sensor's
        actual readings, untouched, 12 or 14 bits per channel,
        enormous (between 20 and 60 MB per frame on a typical
        camera), and editable months later without quality loss.
        Shoot RAW. Always. Always always. The 1.5 GB of card space
        the daylight exercises cost you is the cheapest insurance
        in the photography world. JPEG decisions you regret are
        unrecoverable; RAW decisions you regret are a slider away.
      </p>
      <p>
        Most cameras offer a RAW+JPEG mode that writes both. If you
        share to social platforms or send to family immediately, set
        that mode and keep the RAW for later. If you only edit at the
        desk, switch to RAW only and process every frame yourself.
        The studio's archive is RAW; the prints are RAW-derived; the
        web JPEGs are exports. The RAW is the source of truth.
      </p>

      <p>
        <strong>White balance.</strong> A small but useful
        complication. The camera tries to guess the colour of the
        light source so it can render whites as white &mdash;
        tungsten bulbs (warm), daylight (neutral), shade (cool),
        fluorescent (greenish). If you shoot RAW, this guess is a
        non-binding suggestion; you can override it later for free.
        If you shoot JPEG, the guess is baked in. Set the body to
        AWB (auto) and forget about it for now; the long-exposure
        rung will revisit this when you start dealing with mixed
        light sources (city sodium-vapour streetlamps + your own
        LED poi + ambient sky-blue at dusk &mdash; three sources, no
        single right white balance, the photograph has to negotiate).
      </p>

      <p>
        <strong>Without scrolling back: what is reciprocity?</strong>{" "}
        (Answer in the next paragraph. Try first.)
      </p>
      <p>
        Reciprocity is the rule that two photographs taken at
        equivalent stops on different combinations of the three
        dials produce the same exposure. Halving the shutter,
        opening the aperture by one stop, and lowering ISO by one
        stop are interchangeable units of the same currency. Once
        you can think in stops fluently, you have stopped chasing
        the meter and started directing the image.
      </p>

      <p>
        <strong>What good looks like, at the end of this rung.</strong>{" "}
        You can walk into any indoor space and, within thirty
        seconds, set a working exposure that doesn't surprise you on
        the back of the camera. You can identify which dial to move
        when the photograph isn't the one you wanted. You shoot RAW
        without thinking about it. You can focus manually under bad
        light and trust the result. You have at least one set of
        bracketed frames sitting on a drive that you can refer back
        to when the long-exposure rung asks for &ldquo;f/8, ISO 100,
        fifteen seconds&rdquo; &mdash; you'll know what each of
        those three numbers is doing, why this combination, and what
        you'd reach for instead if the scene needed a wider depth of
        field or a quieter sensor.
      </p>

      <p>
        <strong>What bad looks like.</strong> A drive of JPEGs from
        Auto mode that you can't recover. White-blown highlights
        where the camera tried to expose for a mid-grey wall behind
        a window. Faces missed because autofocus latched on to the
        nearest high-contrast edge instead of the eye. Motion smear
        from a hand-held 1/8-second shutter you didn't realise was
        that slow. The studio has shot all of these. The lesson is
        not to fear them; the lesson is to recognise them within a
        second of looking at the frame, and to know which dial to
        turn.
      </p>

      <p>
        <strong>What next.</strong> The long-exposure ladder begins
        properly with the camera on a tripod, in a dark room, with
        a single source of moving light. The studio's tutorial on{" "}
        <Link
          href="/tutorials/your-first-long-exposure"
          className={ext}
        >
          your first long-exposure light painting
        </Link>{" "}
        is the next rung &mdash; same camera, same dials, fifteen
        seconds of darkness and a torch. The question it opens with
        is the one this rung leaves you holding:{" "}
        <em>
          if the room is dark and the meter is lying, what shutter
          time should I pick &mdash; and how do I know before I take
          the frame?
        </em>{" "}
        That is the next aha; the answer is in the next paragraph of
        the next rung, but only after you've sat with the question
        for a moment.
      </p>
      <p>
        Pick a day this week. Block out a morning. Take the
        exercises in order. The whole thing is four hours including
        coffee.
      </p>
    </>
  );
}

/**
 * Colocated entry record — Photography ladder, Rung 1.
 */
export const entry: Entry = {
  slug: "camera-fundamentals-manual-exposure",
  title: "Camera Fundamentals — Manual Exposure",
  date: "2026-05-26",
  kind: "tutorial",
  excerpt:
    "Aperture, shutter, ISO, the exposure triangle, manual focus, RAW vs JPEG. Everything the camera needs before a single long exposure ever happens.",
  Body: CameraFundamentalsManualExposure,
  related: [
    {
      href: "/atelier/exposure-triangle",
      label: "Atelier — Exposure Triangle (in preparation)",
      note: "Three sliders, live image. Move aperture, watch depth of field; move shutter, watch motion render; move ISO, watch the grain.",
    },
    {
      href: "/tutorials/your-first-long-exposure",
      label: "Tutorial — Your First Long-Exposure Light Painting",
      note: "The next rung. Tripod, dark room, fifteen seconds, one torch.",
    },
    {
      href: "/tutorials/calibrating-the-imageprograf-pro-1100",
      label: "Tutorial — Calibrating the Canon imagePROGRAF PRO-1100",
      note: "Where the RAW pipeline ends — on archival paper, soft-proofed, signed.",
    },
    {
      href: "/practice",
      label: "Practice — Stage I, the camera",
    },
  ],
  furtherReading: [
    {
      href: "https://www.cambridgeincolour.com/tutorials/camera-exposure.htm",
      label: "Camera Exposure — Cambridge in Colour",
      note: "The canonical reference for aperture / shutter / ISO. Read the full series; each tutorial is short and densely diagrammed.",
    },
    {
      href: "https://en.wikipedia.org/wiki/Exposure_value",
      label: "Exposure value — Wikipedia",
      note: "EV as a single number for the three-dial combination. Useful once you can think in stops.",
    },
    {
      href: "https://en.wikipedia.org/wiki/Reciprocity_(photography)",
      label: "Reciprocity (photography) — Wikipedia",
      note: "The mathematical core of the exposure triangle. Read once, return to when long exposures start failing in unexpected ways.",
    },
    {
      href: "https://www.dpreview.com/glossary/exposure/stopping-down",
      label: "Stopping down — DPReview glossary",
      note: "Crisp glossary entry for the stop-down term you will encounter every day from here on.",
    },
    {
      href: "https://www.youtube.com/@seantuckerphoto",
      label: "Sean Tucker — photography YouTube channel",
      note: "Quietly thoughtful long-form video. His position on composites aligns with the studio's single-exposure ethic.",
    },
    {
      href: "https://en.wikipedia.org/wiki/Raw_image_format",
      label: "Raw image format — Wikipedia",
      note: "Why RAW exists; what the difference is between Bayer arrays and the demosaiced image; the bit-depth point spelled out.",
    },
  ],
};
