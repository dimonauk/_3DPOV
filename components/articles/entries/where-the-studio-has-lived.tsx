import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhereTheStudioHasLived() {
  return (
    <>
      <p>
        Before there was a holoflow.co.uk there were a dozen other
        places the writing lived. A practice accumulates its words on
        whatever platform was convenient at the time. Mine did.
      </p>
      <p>
        The studio is twelve years old as a poi practice and roughly
        six as a thing that publishes. In that span the tutorials,
        the build logs, the rambling forum posts, the gist with a
        single .ino file pinned to it, the pen with the colour-wheel
        demo I used to test palettes &mdash; all of them landed
        wherever I was reading at the time. I never sat down and
        chose a publishing platform. I sat down to solve a problem,
        wrote the solution into whichever box was already open in
        another tab, and moved on. The result, six years in, is a
        small archipelago of the studio&rsquo;s thinking spread
        across five or six services, several of which have changed
        hands or shape since I posted to them.
      </p>
      <p>
        This site is the consolidation. Not a takedown of the older
        versions &mdash; they were where the writing lived when it
        lived, and the communities around them are real and good
        &mdash; but a single re-telling, in one voice, cross-
        referenced properly, on infrastructure the studio owns.
      </p>

      <p>
        <strong>Where the writing has lived.</strong>
      </p>
      <p>The roll call, with rough framings of what each was for.</p>
      <p>
        <a
          href="https://makezine.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          The Make: ecosystem{arrow}
        </a>{" "}
        and the wider maker-community circuit. This is where the
        long-form build logs went &mdash; the ones with a parts list
        at the top and a finished thing at the bottom. There used to
        be a community I knew as Makerverse in that orbit; the
        domain now points at an industrial-parts sourcing service,
        which is a useful demonstration of why the studio
        doesn&rsquo;t trust platform names to outlive the writing on
        them. The maker-tutorial register, the thing the community
        taught me to write in, is alive and well; the specific
        addresses have moved.
      </p>
      <p>
        <a
          href="https://codepen.io/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          CodePen{arrow}
        </a>{" "}
        is where the small front-end sketches went. Palette
        explorers, colour-wheel demos, a couple of attempts at
        animating a poi-trail in SVG before I knew enough to do it
        properly. CodePen is excellent at being a place to put a
        single self-contained interactive thing on the internet, and
        I still recommend it for that.
      </p>
      <p>
        <a
          href="https://github.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          GitHub{arrow}
        </a>{" "}
        is where the code went, and where most of the proto-
        tutorials lived as READMEs. Gists for one-file utilities;
        repos for the firmware projects; the occasional rambling
        explanation pinned to a commit message because it was easier
        than opening a separate document. The code is still there.
        Some of it still works.
      </p>
      <p>
        <a
          href="https://www.instructables.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Instructables{arrow}
        </a>{" "}
        is where the proper step-by-step builds went. Photograph
        after photograph, numbered steps, parts list with vendor
        links, the lot. Instructables rewards a particular register
        &mdash; patient, illustrated, paced for a beginner &mdash;
        that I learned to write in and still respect. A few of my
        early rig builds went up there in that format.
      </p>
      <p>
        And then the long tail. Reddit threads where I answered the
        same question about Hall-effect sensors four times in
        eighteen months. The flow-arts forums where the early
        firmware ideas got beaten into shape by people more
        experienced with the discipline than I was. Hackaday comment
        sections. A blog I kept on a different domain for a year and
        then let lapse. The occasional reply on a Discord that, with
        hindsight, should have been an article.
      </p>

      <p>
        <strong>Why the consolidation, then.</strong>
      </p>
      <p>Three reasons, in order of weight.</p>
      <p>
        <em>Voice consistency.</em> When the writing is scattered
        across five platforms over six years, the version of me
        writing one year and the version writing another sound like
        different people. They&rsquo;re not &mdash; they&rsquo;re
        the same practice at different stages &mdash; but the
        register drifts because each platform pulled me toward its
        own house style. Instructables wanted patient and
        illustrated. Reddit wanted defensive. GitHub READMEs wanted
        terse. The studio&rsquo;s actual voice is none of those.
        Pulling the writing home means it can sound like the studio
        sounds.
      </p>
      <p>
        <em>Cross-referencing.</em> A tutorial on building a POV rig
        sits next to an article on{" "}
        <Link href="/articles/why-i-build-my-own-rigs" className={ext}>
          why I build my own rigs
        </Link>{" "}
        and a journal entry on the bench it got built on. On the old
        platforms those three things were on three different
        services and a reader would have had to find each one from
        scratch. Here they link to each other, with notes on why the
        link is there. The cross-reference is the product.
      </p>
      <p>
        <em>Sovereignty.</em> The studio&rsquo;s working position is
        that{" "}
        <Link href="/articles/what-the-studio-wont-do" className={ext}>
          no platform should hold work the studio can&rsquo;t replace
        </Link>
        . Makerverse-the-community becoming Makerverse-the-
        industrial-parts-store inside six years is not a hypothetical;
        it&rsquo;s the kind of thing that actually happens. The
        writing here lives in a repository on disk first and a
        website second. If the website moves, the writing moves with
        it; if a third party decides the URL points somewhere else
        now, the writing keeps existing.
      </p>

      <p>
        <strong>What the older versions still are.</strong>
      </p>
      <p>
        Useful. The Instructables community in particular has a
        depth of patient illustrated build-logging that this site
        will never replicate, and anyone learning to make their
        first weird thing should still go there. CodePen is still
        the right home for a front-end sketch. GitHub is where the
        actual code has to live, because it&rsquo;s code. Reddit
        and the flow-arts forums taught me what I needed to know to
        get the rigs working in the first place. None of those are
        going away from my reading list.
      </p>
      <p>
        The older versions of the studio&rsquo;s own writing are
        still out there too, scattered through those services under
        whichever handles I was using at the time. I&rsquo;m not
        chasing them down to delete them. They&rsquo;re a record of
        how I was thinking then, and there are worse things in the
        world than a build log that&rsquo;s aged. If you find one
        and it disagrees with the version on this site, this site
        is current.
      </p>

      <p>
        <strong>What the retelling is, what it isn&rsquo;t.</strong>
      </p>
      <p>
        The{" "}
        <Link href="/tutorials" className={ext}>
          tutorials section
        </Link>{" "}
        is a retelling, not a re-upload. The workflows have been
        refined; the rigs have been through several revisions; the
        firmware has had bugs found and fixed and found again. The
        version you read here is what the bench currently runs.
        Where an older platform version exists, it stands as the
        snapshot of how the studio was thinking then. The version
        on holoflow.co.uk is how the studio is thinking now, with
        every cross-reference into{" "}
        <Link
          href="/articles/on-the-shoulders-of-open-source"
          className={ext}
        >
          the open-source code the practice rests on
        </Link>{" "}
        and into{" "}
        <Link href="/articles/the-familiar" className={ext}>
          how the studio is actually run
        </Link>{" "}
        wired up properly.
      </p>
      <p>
        I&rsquo;m grateful to every platform on the list above. The
        community at Make: taught me how to write a build log.
        Instructables taught me to number my steps. GitHub taught me
        that a README is a kind of essay. CodePen taught me that a
        tiny self-contained demo will get a point across faster than
        a paragraph. The flow-arts forums taught me to swing the
        thing before I tried to write about it. None of that goes
        away because the consolidated version lives here now.
      </p>
      <p>
        If you find a tutorial of mine on one of those services and
        it tells you something different from the tutorial on this
        one, trust this one. The bench moves; the writing catches
        up; the older version is an artefact of where I used to be
        standing. That&rsquo;s how a practice works.
      </p>
      <p>Right. Back to the bench.</p>
    </>
  );
}
