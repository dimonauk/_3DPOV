import Link from "next/link";

import type { Entry } from "lib/writing";

export default function SellotapeAndTiltBrush() {
  return (
    <>
      <p>
        Long enough ago that the controllers were prototypes, I was
        standing in a small flat with a head-mounted display weighing
        on my neck, holding a tracked controller that had a roll of
        sellotape and a hex key wrapped around the grip to extend it.
        The tape was not decorative. The tape was a handle. I was
        swinging the controller the way I swung poi &mdash; round my
        wrist, out into the kinesphere, the way you do when twelve
        years of practice has wired the motion into the body before
        the brain &mdash; and inside the headset Tilt Brush was
        drawing a ribbon of light behind the controller as it moved.
      </p>
      <p>
        I looked at the ribbon and thought,{" "}
        <em>this trail should be a real object I can hold</em>.
      </p>
      <p>
        That is the entire seed. Everything the studio now makes
        downstream of poi capture &mdash; the implicit-field melding,
        the marching-cubes pipeline, the resin sculptures, the
        forthcoming VR-POV bezels &mdash; sits on top of that one
        moment of sellotape and stupidity. It took fifteen years to
        get the rest of the stack to catch up with the insight, and
        I want to write down why.
      </p>
      <p>
        The insight itself was small. Gesture in space is already a
        sculptural object. The body knows it. Long-exposure
        photography knows it &mdash; a{" "}
        <a
          href="https://en.wikipedia.org/wiki/Persistence_of_vision"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          persistence-of-vision
          <span className="ml-0.5 text-chrome-500">&nearr;</span>
        </a>{" "}
        photograph of a poi spin is the trail rendered as image, not
        the dancer. Tilt Brush was the first time I saw the trail
        rendered as <em>volume</em>, even if the volume was a thin
        polygonal ribbon and lived only in the headset. The leap is
        small but it is the whole leap: from image, to object. From
        flat photograph, to thing you can put in a hand.
      </p>
      <p>
        I went home and started thinking about how to print one. I
        thought about it for fifteen years.
      </p>
      <p>
        The reason it took fifteen years is that nothing else was
        ready. The controllers I was using were dev kits; the
        consumer{" "}
        <a
          href="https://en.wikipedia.org/wiki/Oculus_Rift_CV1"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          CV1<span className="ml-0.5 text-chrome-500">&nearr;</span>
        </a>{" "}
        and Vive wands that would ship to the rest of the world were
        still ahead, and the tracking that hobbyists could actually
        get hold of was a wired stationary thing tied to a desk. There
        was no sensible way to capture a full poi spin without the
        cable becoming the dance partner. Tilt Brush itself was a{" "}
        <a
          href="https://openbrush.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          closed product
          <span className="ml-0.5 text-chrome-500">&nearr;</span>
        </a>{" "}
        until the open-source community caught it as Open Brush years
        later; you could not get a raw stroke export, and even if you
        could the result was a ribbon mesh, not a sculptural volume.
      </p>
      <p>
        The geometry side was no better. Marching cubes is from 1987
        and is a champ at watertight surfaces, but the path from
        captured trajectory to a printable mesh required either a
        commercial CAD workflow I could not afford or a research-
        grade pipeline I could not assemble alone. Resin printers
        that could actually hold the detail of a thin filament loop
        in real material were still rare and expensive. The AI
        pipeline that now lets me turn a single photograph into a
        depth-bearing mesh in nine seconds did not exist. Not
        partway. Not in worse form. Did not exist.
      </p>
      <p>So I waited. I kept the note. I drilled the poi.</p>
      <p>
        What changed is that the three branches caught up at roughly
        the same time. Body and finger tracking became commodity
        &mdash; an Azure Kinect on the studio bench gives the full
        skeleton at 30 frames per second, and a Leap Motion gives
        every fingertip of both hands. Implicit-surface melding
        became a thing I could run in Python on a 12 GB consumer
        GPU. Resin printers cheap enough for a one-person studio
        got accurate enough to hold the geometry of a poi loop as a
        physical filament, not a suggestion of one. And the AI image
        stack that I now use to turn a single long-exposure
        photograph into a depth-bearing starting point landed in
        2024 and started becoming{" "}
        <Link
          href="/articles/nine-seconds-prompt-to-printable"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          a nine-second pipeline that runs locally
        </Link>
        .
      </p>
      <p>
        The current studio pipeline is the long answer to that
        sellotape moment. A photograph goes in &mdash; either one I
        took of a poi spin under long exposure, or a still I
        synthesised from a captured trajectory &mdash; and gets
        segmented out of its background by SAM2. The mask is voxel-
        traced into a stack of layers. Marching cubes walks the
        stack and pulls a watertight surface. The surface gets
        simplified, scaled to a target size in millimetres, and
        printed in resin. If the piece is meant to be a waveguide
        for an LED &mdash; some of them are &mdash; the geometry is
        adjusted to be hollow with a polished inner channel before
        it goes on the build plate. The{" "}
        <Link
          href="/tutorials/from-photograph-to-object"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          technical walkthrough
        </Link>{" "}
        spells the steps out. The thing that comes off the printer
        is the ribbon Tilt Brush drew, fifteen years late, in a
        material that exists.
      </p>
      <p>
        The forward branch matters as much to me as the back branch.
        The reason the original moment needed sellotape is that the
        controller was the wrong shape for the gesture. It was a
        joypad with tracking glued on. What I actually wanted in my
        hand was a poi &mdash; weighted, balanced, swinging on a
        tether &mdash; with the tracking built in. The studio is
        currently finishing the{" "}
        <Link
          href="/articles/vr-pov-controllers-the-product"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          VR-POV controller bezels
        </Link>{" "}
        that close that loop: a real performance rig that is also a
        tracked VR input, so the gesture-in-space that the body
        already knows how to make becomes a sculptural object inside
        the headset and, if you want it to, a printable object
        afterwards. It is the same insight as the sellotape moment.
        It is the insight shippable.
      </p>
      <p>
        I do not think this counts as a long wait. Twelve years of
        poi practice is the same order of magnitude. Most of the
        useful things in the studio took roughly as long to assemble
        as they took to imagine, and the imagining was the cheap
        part. The fifteen years was not me being patient. It was me
        waiting for the rest of the world to ship the tools, and
        getting on with{" "}
        <Link
          href="/practice"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          the rest of the practice
        </Link>{" "}
        while it did.
      </p>
      <p>
        The sellotape is gone. The hex key got returned to the
        toolbox. The controller went into a drawer and probably
        does not boot any more. The note in the head &mdash;{" "}
        <em>this trail should be a real object</em> &mdash; finally
        has a printer attached to it.
      </p>
      <p>Now I am going to capture a spin.</p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "sellotape-and-tilt-brush",
    title: "Sellotape and Tilt Brush",
    date: "2024-06-18",
    kind: "article",
    excerpt:
      "The poi-into-sculpture line started in a small flat fifteen years ago, with a roll of sellotape wrapped round a prototype VR controller and a trail of light I wanted to hold in my hand. It took the rest of the world fifteen years to ship the tools that catch up to it.",
    Body: SellotapeAndTiltBrush,
    related: [
      {
        href: "/articles/vr-pov-controllers-the-product",
        label: "VR POV Controllers — the Studio's Product",
        note: "The shippable version of the sellotape insight.",
      },
      {
        href: "/articles/nine-seconds-prompt-to-printable",
        label: "Nine Seconds from Prompt to Printable",
        note: "The current pipeline that finally lets the trail become an object.",
      },
      {
        href: "/tutorials/from-photograph-to-object",
        label: "Tutorial — From Photograph to 3D Object",
        note: "The technical walkthrough of the pipeline.",
      },
      {
        href: "/practice",
        label: "Practice — the twelve-year arc",
      },
    ],
    furtherReading: [
      {
        href: "https://openbrush.app/",
        label: "Open Brush",
        note: "Open-source successor to Tilt Brush; the toolchain that finally let strokes be exported.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Oculus_Rift_CV1",
        label: "Oculus Rift CV1 — Wikipedia",
        note: "The first mass-market consumer VR headset; the era this article is set just before.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Persistence_of_vision",
        label: "Persistence of vision — Wikipedia",
        note: "What makes the trail visible to a long-exposure camera in the first place.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Marching_cubes",
        label: "Marching cubes — Wikipedia",
        note: "The 1987 algorithm that does the volume-to-mesh work.",
      },
    ],
  };
