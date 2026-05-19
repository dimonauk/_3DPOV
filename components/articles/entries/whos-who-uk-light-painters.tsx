import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkLightPainters() {
  return (
    <>
      <p>
        The UK has a quiet but unusually deep bench of people who
        make pictures by waving lights at a camera in the dark. The
        ones who do it well do not look like a single school. They
        look like a tool cupboard. One has a programmable LED bar in
        a case in the boot; one has a pocket full of fibre-optic
        brushes; one has a length of electroluminescent wire wound on
        a spool. The signatures are the tools. The tools are the
        sections of this article.
      </p>

      <p>
        The fire-arts who&rsquo;s-who is a separate piece &mdash;{" "}
        <Link
          href="/articles/whos-who-uk-fire-art-photographers"
          className={ext}
        >
          Who&rsquo;s Who &mdash; UK fire art photographers
        </Link>{" "}
        &mdash; and the overlaps with that scene are real but small;
        most of the people below do not work with combustion. They
        work with electricity, glass, phosphor, plastic and a long
        shutter. The reading order is by light source, not by
        postcode, because the craft sorts that way more honestly.
        Where a painter sits across several tools, the entry lives in
        the section their signature work most clearly belongs to, and
        the overlaps are noted in the prose.
      </p>

      <p>
        The same brief applies as the fire piece: real people, public
        URLs, no invented credits, no claimed mentorships of the
        studio unless verifiable. The point of an index like this is
        to send the reader to the working artist&rsquo;s own page, not
        to keep them on this one.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Those who paint with torches
      </h2>

      <p>
        The classic. Handheld LED torches, Maglites, head-torches; the
        Picasso-on-the-pier school, kept alive by the people who
        understood early that the light source itself does not have
        to be visible in the frame &mdash; only the trace it leaves.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Ian Hobson</strong> &mdash; Tyneside. Veteran light
          painter, ex-neuropharmacology, publishing as
          lightpainting.org.uk since the analogue era. Works straight
          out of camera, no digital compositing. Equal parts torch,
          EL wire, Pixelstick and improvised tools, but the
          straight-torch portraits and landscapes are the bedrock of
          his practice.{" "}
          <a
            href="http://lightpainting.org.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            lightpainting.org.uk{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.facebook.com/people/Lightpaintingorguk/100063919682159/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Facebook portfolio{arrow}
          </a>
        </li>
        <li>
          <strong>David Gilliver</strong> &mdash; Aberdeen-born, based
          on Guernsey. Glasgow School of Art Fine Art Photography
          graduate, working in long-exposure light painting for more
          than a decade. Torch, glow stick and orb tool work, often
          set against the cliffs and bunkers of the Channel Islands.
          Writes a self-published step-by-step light-painting e-book
          and teaches regular night-photography workshops on Guernsey.
          See also the lineage piece at{" "}
          <Link href="/articles/lineage-marey-to-now" className={ext}>
            Marey to Now
          </Link>
          .{" "}
          <a
            href="https://davidgilliver.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            davidgilliver.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://davidgilliver.com/portfolio/light-painting/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            light-painting portfolio{arrow}
          </a>
        </li>
        <li>
          <strong>Phill Fisher</strong> &mdash; Devizes, Wiltshire.
          Fell into the craft by accident in 2014 &mdash; an old DSLR,
          a 30-second exposure, a torch walked through the frame.
          Works in-camera with no editing, photographs ruins,
          memorials and statues at night, and has expanded into
          drone-mounted light painting alongside the handheld torch
          work.{" "}
          <a
            href="https://www.flickr.com/photos/131334074@N04/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Flickr portfolio{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.instagram.com/phill_fisher/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Instagram{arrow}
          </a>
        </li>
        <li>
          <strong>LED Eddie (Neale Smithies)</strong> &mdash; Woking.
          Active on Flickr since 2009, a long-running British
          torchlight and rotating-rig practitioner whose camera-
          rotation technique has been cited as a teaching reference by
          others in the community.{" "}
          <a
            href="https://www.flickr.com/photos/lededdie/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            LED Eddie on Flickr{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.facebook.com/Led.Eddie"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Facebook{arrow}
          </a>
        </li>
        <li>
          <strong>Diana Goss</strong> &mdash; Southsea. Creative
          portrait and event photographer (MSc ARPS) who has taught
          night photography and light painting at Portsmouth
          University and on tour around the country. Useful pointer
          when the question is &ldquo;who teaches this within reach of
          the south coast&rdquo;.{" "}
          <a
            href="http://www.notmagnum.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            notmagnum.co.uk{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Those who paint with pixelsticks
      </h2>

      <p>
        The Pixelstick (Bitbanger Labs, 2014) put a programmable bar
        of 198 LEDs into a tripod-portable case and changed the kind
        of image a single long exposure could carry. You load a
        bitmap onto an SD card and walk the bar through the frame at
        a steady pace; the camera reads what the eye cannot. The UK
        adopted it quickly.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Nicholas Goodden (Nico)</strong> &mdash; London.
          Urban photographer working across street, graffiti and
          commercial; an early UK adopter of the Pixelstick in 2013
          for creative urban portrait and brand work. Has done
          commissioned Pixelstick content for Citro&euml;n, Beavertown
          and Peugeot. The London Pixelstick page on his site is one
          of the clearer technical writeups any beginner can read.{" "}
          <a
            href="https://www.nicholasgooddenphotography.co.uk/london-light-painting"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            London light painting gallery{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.nicholasgooddenphotography.co.uk/london-blog/pixelstick-light-painting-photography-london"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Pixelstick writeup{arrow}
          </a>
        </li>
        <li>
          <strong>Ian Hobson</strong> &mdash; Tyneside. Cross-listed
          from the torch section because the Pixelstick UK story
          starts with him: in early 2014 he received one of the first
          production models and wrote the in-depth review that the
          rest of the British community read first.{" "}
          <a
            href="https://lightpaintingphotography.com/light-painting-photography/pixelstick-review-by-ian-hobson/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Pixelstick review{arrow}
          </a>
        </li>
        <li>
          <strong>Dan Whitaker</strong> &mdash; UK. Long-exposure
          photographer working with car-trail, star-trail, steel wool
          and programmable LEDs; an early UK member of the Light
          Painting World Alliance, with extensive desert-landscape
          Pixelstick / programmable-LED work shot on LPWA
          expeditions.{" "}
          <a
            href="https://www.instagram.com/_d.whit_/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Instagram{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="http://lpwa.pro/event/88"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            LPWA event listing{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Those who paint with EL wire and electroluminescent material
      </h2>

      <p>
        Electroluminescent wire is a thin copper wire coated in
        phosphor that glows when alternating current is run through
        it. It is the cheap end of the toolkit and the most
        expressive when used well, because it bends, loops and traces
        in ways no rigid bar can.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Mark Boot</strong> &mdash; London-born (1965),
          lecturing at De Montfort University since 2001. A sculptor
          first and a photographer second; works EL wire and LEDs
          into expanded-polystyrene forms to make the wire the
          structure rather than the trace. The work crosses from
          long-exposure photography into installation.{" "}
          <a
            href="https://www.markboot.co.uk/el-wire-sculptures"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            EL Wire Sculptures{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.markboot.co.uk/read-me"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            About{arrow}
          </a>
        </li>
        <li>
          <strong>Chris Benbow (Nocturne)</strong> &mdash; UK.
          Started light painting in 2006, publishes as Noctography.
          Writes the standard British tutorial set on EL wire, light
          stencils, orbs, domes and steel wool &mdash; the technical
          ladder anyone starting out reads first.{" "}
          <a
            href="https://www.noctography.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            noctography.co.uk{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://lightpaintingphotography.com/light-painting-tutorials/chris-benbow/el-wire-tutorial/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            EL wire tutorial{arrow}
          </a>
        </li>
        <li>
          <strong>Sola (Peter Medlicott)</strong> &mdash; Birmingham.
          Working as Sola since 2006 and credited as the pioneer of
          landscape light graffiti. Uses EL wire alongside torches and
          handheld LEDs; the work is straight out of camera, in the
          tradition of analogue darkroom restraint &mdash; the
          principle outlined in{" "}
          <Link href="/articles/colour-without-pigment" className={ext}>
            Colour Without Pigment
          </Link>{" "}
          and adjacent to the studio&rsquo;s position on{" "}
          <Link href="/articles/the-caustic-disc" className={ext}>
            light as optical material
          </Link>
          .{" "}
          <a
            href="https://www.solalightart.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            solalightart.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://lightbombing.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            lightbombing.com{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Those who paint with fibre-optic brushes
      </h2>

      <p>
        A fibre-optic brush is a small handheld bundle of strands fed
        by an LED at the root; the strands diffuse the light along
        their length and only show as illuminated at the tips. The
        result reads in a long exposure as a whisky-stroke or a
        wisp. It is the closest of any tool to a literal painter&rsquo;s
        brush, and it suits portraiture.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Tim Gamble</strong> &mdash; Manchester. Award-winning
          long-exposure light artist working since 2013; UK brand
          ambassador for Light Painting Brushes (the US fibre-optic
          and acrylic-paddle system). Produces complex worlds in a
          kitchen-table-sized footprint, exposures from one minute to
          half an hour, 99% in-camera.{" "}
          <a
            href="https://lightpaintingbrushes.com/pages/tim-gamble"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Tim Gamble &mdash; Light Painting Brushes{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.stockportps.org.uk/programme/presentations/544-light-painting-with-tim-gamble"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Stockport PS lecture listing{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.redeye.org.uk/opinion/redeye-talent-tim-gamble"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Redeye Talent profile{arrow}
          </a>
        </li>
        <li>
          <strong>Rigu (UK stockist)</strong> &mdash; not an artist but
          the British supplier the practice flows through; Rigu is
          the UK stockist for Light Painting Brushes, which is how a
          fibre-optic brush kit actually gets into a British
          photographer&rsquo;s hand without three weeks of US customs.
          The studio includes the supplier because the supply chain
          is part of the scene.{" "}
          <a
            href="https://rigu.co.uk/light-painting"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Rigu &mdash; light painting{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Those who paint with refracted and lens-less light
      </h2>

      <p>
        A small, dignified family of one: not light painting in the
        torch-in-the-dark sense, but light painting in its literal
        sense &mdash; the photograph is made by the path of a single
        beam through transparent material onto film. No camera lens.
        The image is the refraction.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Alan Jaras</strong> &mdash; St Helens, Merseyside.
          Retired optical microscopist who turned the optics tools of
          a scientific career into an artistic practice. The
          &ldquo;refractograph&rdquo; technique uses formed glass and
          plastic as the lens, the camera body as a darkroom, and
          analogue 35mm film as the receiver. Strictly no digital. An
          International Photography Awards winner. The closest UK
          analogue to the studio&rsquo;s own position on{" "}
          <Link href="/articles/the-caustic-disc" className={ext}>
            optical-pattern photography
          </Link>
          .{" "}
          <a
            href="http://www.iwantyoumagazine.com/alan-jaras/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Profile interview{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.photoawards.com/winner/zoom.php?eid=8-55154-13"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            IPA 2013 winner page{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Those who paint at landscape scale &mdash; drone-light and rig
      </h2>

      <p>
        The newest tool category, and the one that broke the British
        light-painting scene open to a wider audience. Mount a
        controllable LED on a drone, program the flight path, leave
        the shutter open for the duration of the orbit, and the
        landscape itself becomes the canvas.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Reuben Wu</strong> &mdash; Liverpool-born (1975),
          Sheffield Hallam industrial-design graduate, founder member
          of Ladytron, now based in Chicago. Came on drone-LED
          light painting on an automotive shoot in 2015 and has built
          the &ldquo;Lux Noctis&rdquo; and &ldquo;Light Storm&rdquo;
          series around it. National Geographic photographer since
          2022; the August Stonehenge cover used the same technique on
          a British monument. British by birth and training; listed
          here for that reason with the diaspora caveat noted.{" "}
          <a
            href="https://reubenwu.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            reubenwu.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://en.wikipedia.org/wiki/Reuben_Wu"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Wikipedia entry{arrow}
          </a>
        </li>
        <li>
          <strong>Phill Fisher</strong> &mdash; Devizes. Cross-listed
          from the torch section; his drone-light painting of
          Wiltshire ruins and monuments is the UK-resident
          counterpart to Wu&rsquo;s landscape-scale practice, at a
          smaller and more local register.{" "}
          <a
            href="https://lumecube.com/blogs/ambassador/phill-fisher"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Lume Cube ambassador profile{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Those who paint with projectors &mdash; light onto buildings
      </h2>

      <p>
        Architectural projection is light painting at a different
        scale: the brush is a Christie or Barco, the canvas is a
        cathedral fa&ccedil;ade, and the exposure is not a shutter but
        the running time of a piece. The UK festival circuit treats
        this work as light art on equal footing with handheld
        practice, and these are the artists who carry that side of
        the field.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Ross Ashton</strong> &mdash; London. Creative
          director of The Projection Studio, founded 2010; trained in
          France in son et lumi&egrave;re before bringing
          architectural mapping into the British public-realm canon.
          AV Professional of the Year 2019. Guinness World Record
          holder for Face Britain. Cathedral- and castle-scale
          projection is his standing work.{" "}
          <a
            href="https://www.rossashton.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            rossashton.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://theprojectionstudio.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The Projection Studio{arrow}
          </a>
        </li>
        <li>
          <strong>NOVAK</strong> &mdash; Newcastle upon Tyne. Award-
          winning creative studio specialising in projection mapping
          and motion design. Their 195 Piccadilly piece for Lumiere
          London 2016 used the BAFTA archive as the source material
          for a fa&ccedil;ade animation. Regulars at Lumiere Durham,
          Lumiere London, Lumiere Derry-Londonderry, Edinburgh
          International Festival and Light Night Leeds.{" "}
          <a
            href="https://www.novak.uk/about"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            novak.uk{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Those who paint with the maximalist toolkit &mdash; many
        sources at once
      </h2>

      <p>
        A small section for the artists whose signature is not a tool
        but an arsenal. They will use a torch, an EL wire, a brush, a
        bar and an orb in a single exposure, and the picture reads
        because the elements are choreographed rather than thrown.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Michael Bosanko</strong> &mdash; Cardiff. Light
          painter and photographer over a decade in. Camera set to
          long exposure, lights moved through the air in real space,
          no compositing &mdash; portraiture, landscape and
          commercial. Writes features for the digital-camera press
          and accepts commissions worldwide.{" "}
          <a
            href="http://www.michaelbosanko.com/clientspublished"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Clients / Published{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.bookastreetartist.com/michael-bosanko"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Book a Street Artist listing{arrow}
          </a>
        </li>
        <li>
          <strong>Gim Liu (Gimagery)</strong> &mdash; UK &amp; Hong
          Kong. Commercial photographer, long-exposure specialist and
          author of <em>A Beginner&rsquo;s Guide to After Dark
          Photography with Gimagery</em> (2022). The book sets out
          five distinct light-painting techniques &mdash; words, light
          trails, steel wool, outlining, trajectory &mdash; two of
          which he calls his own invention. The maximalist&rsquo;s
          textbook for the UK.{" "}
          <a
            href="https://www.gimagery.net/store/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            gimagery.net &mdash; store{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.thetablereadmagazine.co.uk/photographer-interview-gim-liu/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Table Read interview{arrow}
          </a>
        </li>
        <li>
          <strong>Rosetta Whitehead</strong> &mdash; Brighton. Long-
          exposure light painter with a background in holography;
          surreal in-camera imagery without Photoshop. The
          holography-trained eye is rare in this field and shows in
          the work.{" "}
          <a
            href="https://www.rosettawhitehead.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            rosettawhitehead.com{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Those who paint with installation &mdash; light as the object
      </h2>

      <p>
        Adjacent territory: not a long-exposure photograph but the
        light-art installation itself, where the picture reads in
        real time and is seen by a public on foot. The Lumiere
        festival circuit has built this category into a recognised UK
        discipline; one indicative example each.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Bruce Munro</strong> &mdash; Wiltshire. British
          artist with an international large-scale light-installation
          practice; <em>Field of Light</em>, first realised in the
          field behind his family home in Wiltshire, has been
          re-exhibited at Waddesdon, Salisbury Cathedral and
          internationally for twenty-five years and counting. Light
          as the material of the work rather than the subject of a
          photograph &mdash; a counterpart to{" "}
          <Link
            href="/articles/why-the-pendant-glows-from-the-inside"
            className={ext}
          >
            Why the Pendant Glows from the Inside
          </Link>{" "}
          at landscape scale.{" "}
          <a
            href="https://www.brucemunro.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            brucemunro.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Mick Stephenson</strong> &mdash; UK. Self-taught,
          ex-builder, now a full-time light artist. Won Lumiere&rsquo;s
          BRILLIANT prize in 2011. Best known for the{" "}
          <em>Litre of Light</em> projects: thousands of recycled
          plastic bottles lit with LEDs, reassembled into the rose
          window of Durham Cathedral cloisters (Lumiere Durham 2015),
          reworked for Lumiere London 2018, and across Enchanted
          Parks, Kendal Calling, Sunderland illuminations and
          E-Luminate Cambridge.{" "}
          <a
            href="https://www.mickstephenson.net/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            mickstephenson.net{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.artichoke.uk.com/artist/mick-stephenson/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Artichoke Trust profile{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Those who teach the craft
      </h2>

      <p>
        Where to actually learn, with verifiable public listings. The
        practitioner sections above have several teachers folded in
        already &mdash; David Gilliver, Diana Goss, Tim Gamble, Gim
        Liu and Chris Benbow all run workshops, lectures or
        published tutorial sets &mdash; and the dedicated providers
        below are the open-class entry points.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>36exp Photographers&rsquo; School</strong> &mdash;
          London. Two-hour evening light-painting workshop meeting at
          Highgate Tube Station; tutor-led small groups, lights
          supplied, principles plus orbs, electric smoke and wave
          forms. Open class, no portfolio required.{" "}
          <a
            href="https://www.36exp.co.uk/light-painting-workshop/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            36exp light-painting workshop{arrow}
          </a>
        </li>
        <li>
          <strong>DSLR Photography Courses</strong> &mdash; London.
          Three-hour intensive on painting with light using LED light
          gadgets, in the dedicated night-photography programme.{" "}
          <a
            href="https://www.dslrphotographycourses.com/courses-and-workshops/night-low-light-photography-course"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Night and low-light course{arrow}
          </a>
        </li>
        <li>
          <strong>Photoion School of Photography</strong> &mdash;
          London. Night-photography workshop using the Golden Jubilee
          Bridge and Westminster as locations, includes painting-with-
          light segments.{" "}
          <a
            href="https://www.photoion.co.uk/workshops/night-photography-workshop-london/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Night photography workshop{arrow}
          </a>
        </li>
        <li>
          <strong>The Photography Project</strong> &mdash; Bristol.
          Low-light and night-photography workshop on Bristol
          Harbourside: traffic-light trails, painting with light,
          long-exposure colour.{" "}
          <a
            href="https://www.thephotographyproject.co.uk/photography-workshops/low-light-night-photography-workshop/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Low-light workshop{arrow}
          </a>
        </li>
        <li>
          <strong>Zestlight Photography</strong> &mdash; Northumbria /
          North East. Light-painting workshop covering doodling,
          light trails and wire wool &mdash; the latter overlaps with{" "}
          <Link
            href="/articles/whos-who-uk-fire-art-photographers"
            className={ext}
          >
            the fire-arts piece
          </Link>
          .{" "}
          <a
            href="https://www.zestlightphotography.co.uk/photography-workshops"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            zestlightphotography.co.uk &mdash; workshops{arrow}
          </a>
        </li>
        <li>
          <strong>Chocolate Films Workshops</strong> &mdash; UK-wide,
          schools-and-groups focus. Half-day and full-day light-
          painting workshops aimed at education settings; teaches
          shutter speed, ISO and aperture through the doing of the
          work.{" "}
          <a
            href="https://www.chocolatefilmsworkshops.co.uk/light-painting"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            chocolatefilmsworkshops.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>David Gilliver workshops</strong> &mdash; Guernsey.
          One-to-one and small-group light-painting and night-
          photography teaching with twelve-plus years of running
          time. The dedicated practitioner-led option.{" "}
          <a
            href="https://davidgilliver.com/workshops/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            davidgilliver.com/workshops{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where to find the scene live
      </h2>

      <p>
        Light painting in the UK has fewer fixed monthly meets than
        the fire-arts scene, but the festival calendar is firm.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Lumiere</strong> &mdash; Durham (biennial),
          previously London and Derry-Londonderry. The single largest
          UK light-art event, produced by Artichoke Trust. The
          architectural-projection and installation artists above all
          appear here in rotation.{" "}
          <a
            href="https://www.lumiere-festival.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            lumiere-festival.com{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.artichoke.uk.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Artichoke Trust{arrow}
          </a>
        </li>
        <li>
          <strong>Light Up Lancaster</strong> &mdash; Lancaster,
          annual autumn light festival.{" "}
          <a
            href="https://lightuplancaster.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            lightuplancaster.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Enchanted Parks</strong> &mdash; Gateshead.
          NewcastleGateshead winter light festival in Saltwell Park.{" "}
          <a
            href="https://www.newcastlegateshead.com/whats-on/enchanted-parks"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Enchanted Parks{arrow}
          </a>
        </li>
        <li>
          <strong>Light Night Leeds</strong> &mdash; Leeds, annual
          October light-art event in the city centre.{" "}
          <a
            href="https://lightnightleeds.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            lightnightleeds.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>WeShine Portsmouth</strong> &mdash; Portsmouth
          winter light festival; Mick Stephenson and others on the
          programme.{" "}
          <a
            href="https://www.weshineportsmouth.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            weshineportsmouth.co.uk{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Who is missing from this list
      </h2>

      <p>
        The same brief applies as the fire-arts piece. The studio
        listed only people whose work is verifiable by a working
        public URL on a domain they (or a credited publisher)
        control. Private Instagram-only accounts, dead Flickr links
        and friend-of-a-friend attributions were left out. Several
        active UK Flickr light-painters fell off the list for that
        reason rather than for lack of skill, and the editor would
        rather they wrote in with a public link than the studio
        invent one. Some borderline cases &mdash; Reuben Wu (British,
        Chicago-based), Stephen Knight (UK-born, Brisbane-based) and
        Patrick Rochon (Canadian, internationally relevant) &mdash;
        are either noted in-place with their diaspora caveat or
        omitted; Rochon and Jason D Page are the major non-UK names
        in the worldwide canon and worth following separately for
        anyone working in this field.
      </p>

      <p>
        If you light-paint in the UK under a public byline and you
        are not here, the editor reads the inbox. A link to a public
        gallery is the entire qualification.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Closing
      </h2>

      <p>
        The studio&rsquo;s interest in this taxonomy is not academic.
        Long-exposure light painting is one of the few honest
        photographic disciplines left in which the picture is made
        almost entirely at the picture-taking stage; the print is
        just the receipt. The paper choice for those prints is a
        whole other discussion in{" "}
        <Link
          href="/articles/the-right-paper-for-a-light-painting"
          className={ext}
        >
          The Right Paper for a Light Painting
        </Link>
        ; the lineage that brought us here is laid out in{" "}
        <Link href="/articles/lineage-marey-to-now" className={ext}>
          Marey to Now
        </Link>
        ; the London hubs where some of these traces get made are in{" "}
        <Link href="/articles/london-360-walking" className={ext}>
          London 360 Walking
        </Link>
        . And the eye behind much of the studio&rsquo;s archive of
        long-exposure work belongs to{" "}
        <Link href="/articles/jon-the-photographer" className={ext}>
          Jon the Photographer
        </Link>{" "}
        &mdash; light-painting alongside the fire poi when the LFS
        beach meets the full moon.
      </p>

      <p>
        Sibling who&rsquo;s-who pieces in the series:
      </p>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link
            href="/articles/whos-who-uk-fire-art-photographers"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK fire art photographers
          </Link>
        </li>
        <li>
          <Link href="/articles/whos-who-uk-vr-people" className={ext}>
            Who&rsquo;s Who &mdash; UK VR people
          </Link>
        </li>
        <li>
          <Link href="/articles/whos-who-uk-ar-people" className={ext}>
            Who&rsquo;s Who &mdash; UK AR people
          </Link>
        </li>
      </ul>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 *
 * Inclusion rule: a working public URL on a domain the artist (or a
 * credited publisher / festival / supplier) controls. Stock-agency
 * and festival credit pages count. Private Instagram accounts and
 * dead Flickr links do not.
 *
 * Structure is by light source / tool, not by city — deliberate
 * variation from the fire-arts who's-who, which is by geography. The
 * series alternates structures to keep the reader awake across the
 * set.
 *
 * Borderline UK cases (Reuben Wu — Liverpool-born, Chicago-based;
 * Stephen Knight — UK-born, Brisbane-based) are noted in-place with
 * the diaspora caveat. International references (Rochon, Jason D
 * Page, Hannu Huhtamo, JanLeonardo) are mentioned as off-list canon
 * but not entered as UK practitioners.
 */
export const entry: Entry = {
  slug: "whos-who-uk-light-painters",
  title:
    "Who's Who — UK light painters, by the light source they paint with",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "An index of UK light painters and light artists — torch, Pixelstick, EL wire, fibre-optic brush, refracted light, drone-light, projection and installation. Sorted by the tool, not the postcode. Real people, verified URLs. Sibling to the UK fire-arts who's-who.",
  Body: WhosWhoUkLightPainters,
  related: [
    {
      href: "/articles/whos-who-uk-fire-art-photographers",
      label: "Who's Who — UK fire art photographers",
      note: "The sibling piece, sorted by city.",
    },
    {
      href: "/articles/jon-the-photographer",
      label: "Jon the Photographer",
      note: "The eye behind much of the studio's long-exposure archive.",
    },
    {
      href: "/articles/the-right-paper-for-a-light-painting",
      label: "The Right Paper for a Light Painting",
      note: "Paper choices for the printed receipts of this work.",
    },
    {
      href: "/articles/lineage-marey-to-now",
      label: "Marey to Now",
      note: "The photographic lineage these practitioners stand inside.",
    },
    {
      href: "/articles/london-360-walking",
      label: "London 360 Walking",
      note: "The London hubs where some of these traces get made.",
    },
    {
      href: "/articles/colour-without-pigment",
      label: "Colour Without Pigment",
      note: "Light as colour material rather than dye.",
    },
    {
      href: "/articles/the-caustic-disc",
      label: "The Caustic Disc",
      note: "Light and optics — the territory Alan Jaras's refractography sits inside.",
    },
    {
      href: "/articles/why-the-pendant-glows-from-the-inside",
      label: "Why the Pendant Glows from the Inside",
      note: "Light-from-within — a small-scale counterpart to Bruce Munro's landscape installations.",
    },
  ],
  furtherReading: [
    {
      href: "http://lightpainting.org.uk/",
      label: "Ian Hobson — lightpainting.org.uk",
      note: "The UK reference point. Read this first.",
    },
    {
      href: "https://davidgilliver.com/",
      label: "David Gilliver Photography",
      note: "Glasgow-trained, Guernsey-based; workshops listed.",
    },
    {
      href: "https://www.noctography.co.uk/",
      label: "Nocturne (Chris Benbow) — Noctography",
      note: "The standard British tutorial set for the craft.",
    },
    {
      href: "https://www.solalightart.com/",
      label: "Sola Light Art (Peter Medlicott)",
      note: "Pioneer of landscape light graffiti, Birmingham.",
    },
    {
      href: "https://lightpaintingbrushes.com/pages/tim-gamble",
      label: "Tim Gamble — Light Painting Brushes",
      note: "Manchester. UK brand ambassador, fibre-optic-brush practice.",
    },
    {
      href: "https://www.gimagery.net/store/",
      label: "Gimagery — store (incl. After Dark Photography book)",
      note: "Gim Liu's beginner's textbook for the UK.",
    },
    {
      href: "https://lpwa.pro/",
      label: "Light Painting World Alliance",
      note: "The international network UK practitioners join.",
    },
    {
      href: "https://www.lumiere-festival.com/",
      label: "Lumiere Festival",
      note: "The UK's largest light-art festival, biennial, Durham.",
    },
    {
      href: "https://rigu.co.uk/light-painting",
      label: "Rigu — light painting supplies",
      note: "UK stockist for Light Painting Brushes and adjacent tools.",
    },
  ],
};
