import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WallArraysGeometryOfRooms() {
  return (
    <>
      <p>
        A single waveguide sculpture on a shelf is a record of one
        gesture. A wall array is a record of a thing that
        couldn&rsquo;t be drawn in one gesture at all &mdash; a kata
        that took half an hour, broken into stations the body
        couldn&rsquo;t physically connect; a year of work made
        readable on a wall.
      </p>
      <p>
        Wall arrays are the studio&rsquo;s largest format and the
        most architectural. The same waveguide system, the same
        gestural source, the same SLA-printed body &mdash; but
        composed across a wall as a deliberate layout, with the
        pieces talking to one another.
      </p>

      <p>
        <strong>Scale, not size.</strong>
      </p>
      <p>
        Wall arrays are not made of bigger sculptures. Each piece in
        an array is roughly the same scale as a desktop waveguide
        (palm-scale, lit from within). The array effect comes from
        composition &mdash; the geometry of where they sit relative
        to each other, the negative space between them, the depth
        the wall surface gives them. A nine-piece array on a 2m
        wall reads differently than the same nine pieces in a 1m
        cluster, even though every individual sculpture is identical
        in both arrangements.
      </p>

      <p>
        <strong>The light budget.</strong>
      </p>
      <p>
        Each piece carries its own warm LED at the root of its
        embedded acrylic waveguide. The light runs through the
        channel by total internal reflection and exits where the
        acrylic surface is rough or where the channel kinks. For an
        array, the lighting decision is whether each piece runs at
        the same intensity, or whether intensity is choreographed
        across the array &mdash; some pieces louder, some quieter,
        possibly time-varying to suggest a slow sweep through the
        composition.
      </p>
      <p>
        The studio&rsquo;s default for arrays is to run every piece
        at the same intensity at install, then offer a small DMX
        controller for the owner to fade the array as a whole
        (dimmable from full to ambient-warm) and a "breathe" mode
        (slow sine-wave fade across the array). For commission
        arrays a per-piece programme can be written; this is
        rarely worth the complication for a domestic install, but
        the option is on the table for gallery or commercial sites.
      </p>

      <p>
        <strong>Composition &mdash; rules that aren&rsquo;t.</strong>
      </p>
      <p>
        Wall arrays don&rsquo;t obey the gallery grid. The pieces
        come from different gestures; their trace-densities differ;
        their visual weight is uneven. Mounting them on a
        rectangular grid flattens what should be a chord into a
        line of equal eighth notes. The studio&rsquo;s composition
        rules:
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Read the wall first.</strong> A wall with a window
          on one side has a horizon line built in; the array hangs
          off that line. A blank long wall lets you set the line
          yourself; pick low.
        </li>
        <li>
          <strong>Anchor with the heaviest piece.</strong> The
          biggest trace-density goes roughly two-thirds of the way
          along the dominant axis. Everything else hangs in tension
          to it.
        </li>
        <li>
          <strong>Negative space is content.</strong> The blank wall
          between pieces is not "the place we ran out of
          sculptures." Don&rsquo;t add pieces to fill it; the gaps
          let the lit pieces breathe.
        </li>
        <li>
          <strong>The unlit pieces are part of the array.</strong>{" "}
          Two of every nine pieces, on average, are unlit by
          choice &mdash; the studio mounts them dark, with the
          waveguide channel left empty. They are present without
          being on. They make the lit pieces brighter.
        </li>
      </ul>

      <p>
        <strong>Interaction.</strong>
      </p>
      <p>
        Arrays with proximity sensors are possible and
        already-prototyped at the bench. The studio&rsquo;s standard
        rig uses{" "}
        <a
          href="https://en.wikipedia.org/wiki/Passive_infrared_sensor"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          passive infrared sensors{arrow}
        </a>{" "}
        to detect a viewer approaching within two metres, then
        fades up the nearest pieces and dims the further ones. The
        effect, when it works, is that the array follows the viewer
        across the wall. When it doesn&rsquo;t work the array
        flickers, which is worse than a static array. Interaction
        is optional and adds about 30% to the commission cost; most
        domestic arrays go without.
      </p>

      <p>
        <strong>Installation.</strong>
      </p>
      <p>
        Each piece is hung on a flush wall-mount. Power runs along
        the wall behind the array in a slim channel &mdash; not
        chased into the plaster unless the install is permanent.
        The pieces clip onto the mounts on quarter-turn locks; an
        owner can rearrange the composition over time without
        rewiring. A field record of the original install layout
        ships with the array. Most owners change the layout twice
        in the first year, then settle.
      </p>

      <p>
        <strong>Commission, not catalogue.</strong>
      </p>
      <p>
        Wall arrays are commission-only. The catalogue piece is a
        desktop or sculpture; the array is built around a specific
        space and a specific brief. Write in via the{" "}
        <Link href="/contact?intent=commission" className={ext}>
          contact form
        </Link>{" "}
        with the room, the wall, and what the wall does in your
        life. The conversation goes from there.
      </p>
    </>
  );
}
