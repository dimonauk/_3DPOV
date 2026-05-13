// `Footer` is rendered by `app/rookery/layout.tsx`.
import Link from "next/link";

export const metadata = {
  title: "About the Rookery",
  description:
    "A small letter from the bench. How the Rookery is built, who it's for, and why the door has a cover charge — Dimona Dougherty, Holo-Flow Studio, Salford.",
};

export default function RookeryAboutPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28 prose-gallery">
        <div className="chrome-label">A small letter from the bench</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          About the Rookery.
        </h1>

        <div className="mt-12 space-y-6 text-chrome-200">
          <p>
            I&rsquo;m Dimona. I make the work on this site and I run
            the Rookery. This is the letter that explains how it&rsquo;s
            built and why it&rsquo;s built that way.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">What it is</h2>
          <p>
            The Rookery is a small subscription community attached to
            the studio. Threaded posts, append-only, signed-in. You
            read what other members write, you write back, you start
            your own threads when you&rsquo;ve got something to say.
            There&rsquo;s a feed of recent activity on the{" "}
            <Link
              href="/rookery"
              className="text-pink-200 underline underline-offset-4"
            >
              main page
            </Link>{" "}
            and individual thread pages for the conversations
            themselves. That&rsquo;s the whole of the moving part.
          </p>
          <p>
            The name comes from the bird. A rookery is the noisy,
            clever colony of rooks that share a tall tree and gossip
            across the branches; rooks lay eggs, the eggs hatch, the
            fledglings work out their wings, and one day they fly. I
            like that as a shape for what happens when people who care
            about a craft find each other. You come in green, you stick
            around long enough to feather out, you take what you needed
            and either stay or go make your own work elsewhere. Both
            are good outcomes.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">Who&rsquo;s there</h2>
          <p>
            Anyone willing to subscribe. The Rookery isn&rsquo;t a
            niche. It&rsquo;s the people who would read{" "}
            <Link
              href="/journal"
              className="text-pink-200 underline underline-offset-4"
            >
              the journal
            </Link>{" "}
            anyway plus the people who&rsquo;d email me if there were
            a more obvious way to do it. Light-painting photographers.
            Belt-printer hobbyists. Flow-arts practitioners who want
            to nerd out about wick weight. Sculpture people. The
            occasional curious stranger who wandered in off an article
            about pixel-art-to-STL and stayed because the kit talk was
            good. Collectors. Makers. People who want to compare notes
            on the rig.
          </p>
          <p>
            I am a trans woman. The studio is run by a trans woman;
            the Rookery is a community a trans woman built; the door
            is one a trans woman put up. Naming this plainly because
            the gate&rsquo;s mechanics depend on it &mdash; the cheque
            at the door is doing trans-acceptance work that would
            otherwise fall on me to do by hand. Saying so is
            architectural, not personal. It&rsquo;s still a community
            of people who care about the work. It&rsquo;s still run by
            the person who made the work. The work is the thing.
            Naming who runs it is the door doing its job.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">Why subscription</h2>
          <p>Three reasons. Listed in honest order.</p>
          <p>
            <strong>One: the cover charge is the bouncer.</strong>{" "}
            Every free community I&rsquo;ve ever been in or run spends
            most of its moderation hours filtering out people who never
            had any business being there. The Rookery is run by a
            trans woman &mdash; me. Anyone willing to send me a few
            pound a month has, by paying, demonstrated they don&rsquo;t
            hate me for being trans. That&rsquo;s a meaningful filter.
            It doesn&rsquo;t require vibes-checking anyone at the door;
            it doesn&rsquo;t require a pledge to sign; it doesn&rsquo;t
            require anyone to perform their allyship for me.{" "}
            <strong>Bigots won&rsquo;t work with me.</strong> The
            cheque does the sorting that moderators in free communities
            do by hand. The Rookery&rsquo;s door handles itself.
          </p>
          <p>
            <strong>Two: it pays for itself.</strong> Hosting, the
            moderation hours, the Stripe fees, the bits of
            infrastructure that need to keep ticking. The Rookery is
            not a revenue play; it&rsquo;s a community that covers its
            own electricity. The price is set so that&rsquo;s true and
            nothing more.
          </p>
          <p>
            <strong>Three: it makes the place quieter on purpose.</strong>{" "}
            People who pay for a thing read it more carefully than
            people who don&rsquo;t. The Rookery posts I get back will
            be better because the people writing them paid to be in
            the room. That&rsquo;s not gatekeeping; it&rsquo;s
            calibration.
          </p>
          <p>
            <strong>There is no free trial.</strong> If the price is
            wrong for you right now, the rest of the site stays free
            and the journal goes nowhere. The Rookery is the part you
            join when you&rsquo;ve decided you&rsquo;re in.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            Why this and not Discord
          </h2>
          <p>
            Discord is brilliant if what you want is a permanently-on
            chat firehose with a thousand half-rooms and a notification
            overload. The Rookery is the opposite shape. It&rsquo;s
            threaded, it&rsquo;s append-only, it moves at the pace of
            a journal rather than the pace of a group chat. Threads
            stay legible because there&rsquo;s no edit-and-delete loop
            blurring them. The signal-to-noise is engineered into the
            format rather than into the moderation. Same reason
            I&rsquo;m not on Slack and not running a Discourse
            instance: I&rsquo;d rather have a small slow forum than a
            big fast one.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            What you&rsquo;ll find there
          </h2>
          <p>
            Threads. Kit talk &mdash; printers, cameras, poi heads,
            LED rigs, software. Cross-references back into the journal
            and the tutorials when something on the site catches a
            member&rsquo;s eye. Field-record posts when people are out
            shooting. Honest write-ups of failures. The occasional
            argument about what counts as a single exposure, settled
            by whoever wrote it best. Members who have been here a
            while introducing themselves to members who just joined.
            The texture of a small workshop community that meets at a
            long table.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            What you won&rsquo;t find there
          </h2>
          <p>
            A chat firehose. A free trial. Anonymous trolling &mdash;
            every account is signed in and posts are attributed. A
            pledge to sign on the way in. Moderation theatre. A
            &ldquo;verified members&rdquo; badge system. Promotional
            posts from third parties. Engagement metrics. A
            leaderboard. The Rookery is intentionally boring in the
            ways that internet communities have been loud lately, and
            intentionally interesting in the ways they&rsquo;ve
            stopped being.
          </p>

          <h2 className="mt-12 text-2xl text-chrome-100">
            Where it is in its life
          </h2>
          <p>
            The Rookery exists. You can sign in and read it now. The
            subscription gate is being wired up; everyone who arrived
            before the gate is on a founding-member basis and will be
            honoured as such when the gate closes. Stripe handles the
            payments when the time comes. I run the rest of it. The
            shape of the door fee &mdash; the three options that the
            gate will offer &mdash; lives on the{" "}
            <Link
              href="/rookery/tiers"
              className="text-pink-200 underline underline-offset-4"
            >
              tiers page
            </Link>{" "}
            already, for anyone who wants to see it before the gate
            goes up.
          </p>
          <p className="mt-10 text-chrome-300">
            If you&rsquo;ve read this far, the door&rsquo;s open.{" "}
            &mdash; Dimona
          </p>
          <p>
            <Link
              href="/rookery"
              className="chrome-label text-pink-200 underline-offset-4 hover:underline"
            >
              To the perch &rarr;
            </Link>
          </p>
        </div>
      </article>
    </>
  );
}
