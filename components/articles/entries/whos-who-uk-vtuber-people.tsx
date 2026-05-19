import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkVtuberPeople() {
  return (
    <>
      <p>
        A VTuber is a body before they are a stream. The audience meets
        the body first &mdash; the avatar that loads in OBS, the way the
        ears twitch, the eye shape, the silhouette &mdash; and only then
        the voice and the personality and the chat. So the most honest
        way to index the UK end of the scene is by body-form, not by
        agency or by platform. A demon and a wolfgirl can both stream
        from a London bedroom and both have a public URL; one of them
        will read more like the UK side of an American agency, the
        other more like an indie demoscene. The body tells you which.
      </p>

      <p>
        Defining &ldquo;UK VTuber&rdquo; gets fuzzy fast. Many of the
        biggest English-language VTubers stream from Britain without
        being affiliated with any British agency, often through
        American or Japanese corporate structures (Hololive, NIJISANJI,
        the former VShojo). Some are British by birth and stream from
        elsewhere. The studio&rsquo;s rule for this index: include
        anyone who has publicly identified as British or as based in
        Britain, with a public URL to back the claim. Where the public
        identification is partial, the entry says so.
      </p>

      <p>
        Adjacent studio pieces:{" "}
        <Link href="/articles/aura-the-body" className={ext}>
          Aura the Body
        </Link>{" "}
        on the studio&rsquo;s own avatar practice;{" "}
        <Link
          href="/articles/vr-as-psychological-system"
          className={ext}
        >
          VR as a Psychological System
        </Link>{" "}
        on what a body in VR is doing;{" "}
        <Link
          href="/articles/whos-who-uk-vr-people"
          className={ext}
        >
          Who&rsquo;s Who &mdash; UK VR people
        </Link>{" "}
        for the rigging-side of the scene.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Body-form one &mdash; the humanoid demon
      </h2>

      <p>
        Horns, tail or both; otherwise human-proportioned; the
        body-form that defines the indie / VShojo register more than
        any other. UK practitioners in this form lean toward soft
        Live2D rigs with strong personality animation rather than full
        3D body tracking.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Veibae</strong> &mdash; independent VTuber from
          England. Debuted as a virtual YouTuber in April 2020.
          Affiliated with VShojo April 2021 to April 2023, then back
          to independent. Half-English, half-Polish by self-account;
          accent reads variously to different audiences, which has
          become a running joke. One of the most-viewed female VTubers
          globally during peak periods.{" "}
          <a
            href="https://www.twitch.tv/veibae/about"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            twitch.tv/veibae{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://virtualyoutuber.fandom.com/wiki/Veibae"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wiki entry{arrow}
          </a>
        </li>
        <li>
          <strong>Apricot the Lich (&ldquo;Froot&rdquo;)</strong>
          {" "}&mdash; English VTuber and illustrator. Debuted 27
          November 2020 as part of the first VShojo generation;
          remained with VShojo until the 2025 collapse. Streams on
          Twitch &mdash; gaming, singing, art. The persona is a lich;
          the rigging is soft Live2D with a long-running art practice
          behind the model.{" "}
          <a
            href="https://www.twitch.tv/apricot"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            twitch.tv/apricot{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Body-form two &mdash; the soft-rigged variety streamer
      </h2>

      <p>
        Humanoid, no demon / animal features; the body-form most
        suited to a long-running variety streaming career. The UK
        bench here is older than the demon-girl wave and sometimes
        gets forgotten in coverage because it predates the term
        &ldquo;VTuber&rdquo; entering English-language Twitch
        vocabulary.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Mira Pink</strong> &mdash; female English-language
          VTuber, debuted 28 February 2018. One of the earliest
          English-language VTubers, predating the post-2020 boom.
          Independent, no agency, Twitch-based variety streaming
          (gaming + just-chatting). Listed here as an early UK-scene
          anchor; the model is Live2D in the classic kawaii register.{" "}
          <a
            href="https://www.twitch.tv/mirapink"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            twitch.tv/mirapink{arrow}
          </a>{" "}
          &middot;{" "}
          <a
            href="https://virtualyoutuber.fandom.com/wiki/Mira_Pink"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wiki entry{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Body-form three &mdash; the full-body VRChat performer
      </h2>

      <p>
        Streamed via VRChat with full-body tracking, the avatar moving
        with the streamer rather than as a chest-up bust. This is the
        body-form furthest from the Live2D mainstream; the streamer
        treats the avatar as a physical instrument, not a portrait.
        Several of the most-watched VTubers in this category are not
        UK based (Filian is North America), but the form is well
        represented in the UK VRChat community.
      </p>

      <p className="mt-6">
        The studio&rsquo;s honest position: this section is currently
        understaffed in the index. UK-based full-body VRChat VTubers
        exist &mdash; they perform at meets, run private worlds, and
        appear on each other&rsquo;s streams &mdash; but the
        public-URL discipline of this who&rsquo;s-who means the entries
        only land when the streamer has a stable Twitch / YouTube
        identity to link to. Reader corrections welcome via the
        studio&rsquo;s contact page.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Body-form four &mdash; the agency-trained idol body
      </h2>

      <p>
        Tightly designed full-3D model rigs, agency-issued, multiple
        outfits, lip-sync on hardware-tracker calibration, often with
        their own music production. The UK presence in this category
        is via the English-language branches of the Japanese giants
        (Hololive English, NIJISANJI EN) and is genuinely difficult to
        verify by location &mdash; the talents are largely
        pseudonymous and the agencies tend not to publish the
        residential country of their performers. The studio&rsquo;s
        position is to flag this as a gap rather than to speculate.
      </p>

      <p className="mt-6">
        Where a Hololive or NIJISANJI talent has openly self-identified
        as British &mdash; on stream or in an interview &mdash; they
        belong in the relevant body-form section above with the
        verifying URL. None of the Hololive English roster has cleanly
        public-URL-verified UK residence at the time of this article;
        Watson Amelia&rsquo;s nationality has been the subject of fan
        speculation but no public self-identification of UK residence
        could be confirmed.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Body-form five &mdash; the rigger, model-builder, and the
        people who never appear
      </h2>

      <p>
        The body-form that never streams: the people who make the
        bodies. Live2D riggers, 3D modellers, VRoid customisers,
        Unity / VRChat avatar engineers. The UK has a genuine craft
        scene around the rigging side of VTubing, much of it
        commissioned through VGen and direct Twitter / Bluesky
        requests rather than through agency contracts.
      </p>

      <p className="mt-6">
        Public-URL discipline keeps this section short on the article
        page itself &mdash; most UK riggers publish through commission
        platforms rather than through their own portfolios, and the
        commission platforms do not surface country-of-residence in a
        verifiable way. The closest stable UK-side reference for the
        rigging craft is the VRChat creators&rsquo; documentation,
        which the UK avatar scene draws from heavily.{" "}
        <a
          href="https://creators.vrchat.com/avatars/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          creators.vrchat.com/avatars{arrow}
        </a>
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Honest gaps and the verification problem
      </h2>

      <p>
        VTubing is a pseudonymous form. Most performers do not publish
        their physical residence, and the few who do can revoke that
        identification at any time. The studio&rsquo;s rule for this
        index &mdash; public-URL verification &mdash; produces a
        shorter list than the actual UK scene. That is the right
        trade-off. A who&rsquo;s-who that names performers based on
        leak, fan-wiki inference or face-reveal speculation would not
        be honest, and the studio is not willing to host one.
      </p>

      <p className="mt-6">
        The corollary: if you are a UK-based VTuber who would like to
        be added to this index, the studio&rsquo;s threshold is one
        public URL where you have self-identified as based in
        Britain. That can be a Twitch panel, a Carrd, a self-typed
        bio on the wiki, a stream archive. The contact page is on the
        site. The index will refresh on the same cadence as the rest.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        On bodies and on the screens that hold them
      </h2>

      <p>
        Every VTuber body is a constraint object. Live2D constrains
        the model to chest-up planar puppetry with limited rotation;
        VRoid + VRChat constrains to humanoid bone hierarchies and
        the avatar dynamics system; the high-end commercial rigs
        (Hololive, NIJISANJI) constrain through agency style guides
        and audition-process selection. The body the UK scene chooses
        is partly a fashion question and partly a constraint-budget
        question. The studio&rsquo;s position on bodies as constraint
        objects &mdash; including the studio&rsquo;s own Aura body
        &mdash; sits in{" "}
        <Link href="/articles/aura-the-body" className={ext}>
          Aura the Body
        </Link>{" "}
        and the broader argument in{" "}
        <Link href="/articles/the-eight-kingdoms" className={ext}>
          The Eight Kingdoms
        </Link>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sibling who&rsquo;s-whos
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <Link
            href="/articles/whos-who-uk-vr-people"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK VR people
          </Link>
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-motion-capture"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK motion capture
          </Link>
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-vr-sculpting-people"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK VR sculpting + virtual painting
          </Link>
        </li>
        <li>
          <Link
            href="/articles/whos-who-uk-3d-mesh-people"
            className={ext}
          >
            Who&rsquo;s Who &mdash; UK 3D mesh people
          </Link>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sources / further reading
      </h2>

      <p className="mt-2 text-sm text-chrome-400">
        Every external URL touched in research, grouped by domain.
      </p>

      <h3 className="mt-6 text-lg text-chrome-100">
        Streamer and performer pages
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://www.twitch.tv/veibae/about"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            twitch.tv/veibae &mdash; about{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.twitch.tv/apricot"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            twitch.tv/apricot &mdash; Froot{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.twitch.tv/mirapink"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            twitch.tv/mirapink{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">
        Community references
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://virtualyoutuber.fandom.com/wiki/Veibae"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            virtualyoutuber wiki &mdash; Veibae{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://virtualyoutuber.fandom.com/wiki/Mira_Pink"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            virtualyoutuber wiki &mdash; Mira Pink{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.virtualhumans.org/human/apricot"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            virtualhumans.org &mdash; Apricot{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://virtualyoutuber.fandom.com/wiki/VShojo"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            virtualyoutuber wiki &mdash; VShojo agency{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/VShojo"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wikipedia &mdash; VShojo{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://virtualyoutuber.fandom.com/wiki/Filian"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            virtualyoutuber wiki &mdash; Filian (referenced, NA-based){arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">
        Rigging and avatar craft
      </h3>
      <ul className="mt-2 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://creators.vrchat.com/avatars/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            creators.vrchat.com/avatars &mdash; the avatar
            documentation{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://creators.vrchat.com/avatars/creating-your-first-avatar/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            creators.vrchat.com &mdash; first avatar guide{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://vroid.com/en/studio"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            vroid.com &mdash; VRoid Studio{arrow}
          </a>
        </li>
      </ul>
    </>
  );
}

/**
 * Who's-who of UK-based VTubers and the wider UK VTuber scene in the
 * `taxonomy-of-bodies` format from docs/CONTENT-MILL.md. Organised by
 * avatar body-form rather than by agency. Strict public-URL
 * verification discipline — agency-only performers without public UK
 * residence identification are flagged as a gap rather than guessed.
 */
export const entry: Entry = {
  slug: "whos-who-uk-vtuber-people",
  title: "Who's Who — UK VTubers, by the body they wear",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "A VTuber is a body before they are a stream. A who's-who of UK-based VTubers and the UK side of the scene, sorted by avatar body-form — humanoid demon, soft-rigged variety, full-body VRChat performer, agency idol, and the riggers who never appear.",
  Body: WhosWhoUkVtuberPeople,
  related: [
    {
      href: "/articles/aura-the-body",
      label: "Aura the Body",
      note: "The studio's own avatar practice.",
    },
    {
      href: "/articles/vr-as-psychological-system",
      label: "VR as a Psychological System",
      note: "What a body in VR is doing to the wearer.",
    },
    {
      href: "/articles/the-eight-kingdoms",
      label: "The Eight Kingdoms",
      note: "The studio's taxonomy of bodies.",
    },
    {
      href: "/articles/whos-who-uk-vr-people",
      label: "Who's Who — UK VR people",
      note: "Sibling index for the broader VR scene.",
    },
    {
      href: "/articles/whos-who-uk-motion-capture",
      label: "Who's Who — UK motion capture",
      note: "Sibling index — the bodies-on-stage equivalent.",
    },
    {
      href: "/articles/whos-who-uk-3d-mesh-people",
      label: "Who's Who — UK 3D mesh people",
      note: "Sibling index for the mesh-side of avatar building.",
    },
  ],
  furtherReading: [
    {
      href: "https://creators.vrchat.com/avatars/",
      label: "VRChat — Avatars documentation",
      note: "The reference the UK avatar craft scene draws from heavily.",
    },
    {
      href: "https://vroid.com/en/studio",
      label: "VRoid Studio",
      note: "Pixiv's free humanoid avatar builder. The on-ramp for the body-form-four idol body.",
    },
    {
      href: "https://virtualyoutuber.fandom.com/",
      label: "Virtual YouTuber Wiki",
      note: "Fan-maintained index. Useful for cross-checking debut dates and agency history.",
    },
  ],
};
