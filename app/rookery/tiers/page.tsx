// `Footer` is rendered by `app/rookery/layout.tsx`.
import Link from "next/link";
import { tiers, PRICING_STATUS, type Tier } from "lib/rookery/tiers";
import { TierJoinButton } from "components/rookery/tier-join-button";

export const metadata = {
  title: "The Rookery — tiers",
  description:
    "Three ways to be on the perch. Two recurring, one founding. The door fee covers hosting and acts as the bouncer; bigots won't work with me. Dimona Dougherty, Holo-Flow Studio, Salford.",
};

export default function RookeryTiersPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">
          What it costs to be on the perch
        </div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Tiers.
        </h1>

        <div className="mt-8 max-w-xl space-y-5 text-chrome-200">
          <p>
            Three options. Two of them recurring &mdash; the standing-room
            ticket at &pound;6 and the back-the-studio-harder one at
            &pound;12 &mdash; and one founding-member one-shot at
            &pound;75 that buys lifetime access while the gate is still
            open. Same room either way. No separate premium channel,
            because the whole point is that everyone&rsquo;s in the
            conversation.
          </p>
          <p>
            The gate is being wired up through Stripe and isn&rsquo;t
            live yet. Everyone who is signed in right now is on a
            founding-member basis until then; the numbers below are the
            shape of the door fee, set so the place pays for its own
            electricity and the bouncer does its work. When the gate
            closes, the Fledge tier closes with it.
          </p>
        </div>

        <div className="mt-16 space-y-10">
          {tiers.map((tier) => (
            <TierCard key={tier.slug} tier={tier} />
          ))}
        </div>

        <section className="mt-20 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label">The rest of the Rookery</div>
          <p className="mt-3 text-chrome-300">
            For the front door,{" "}
            <Link
              href="/rookery"
              className="text-pink-200 underline underline-offset-4"
            >
              the perch
            </Link>
            . For the longer letter on how the place is built and why
            the door has a cover charge,{" "}
            <Link
              href="/rookery/about"
              className="text-pink-200 underline underline-offset-4"
            >
              About the Rookery
            </Link>
            .
          </p>
        </section>
      </article>
    </>
  );
}

function TierCard({ tier }: { tier: Tier }) {
  const isFledge = tier.slug === "fledge";
  const cadenceLabel =
    tier.cadence === "recurring" ? "Recurring" : "One-time";

  return (
    <section
      className={`rounded-sm border ${
        isFledge
          ? "border-pink-200/40 bg-warm-black-900/60"
          : "border-warm-black-800 bg-warm-black-900/30"
      } p-8`}
    >
      {isFledge ? (
        <div className="chrome-label mb-4 text-pink-200">
          Founding member &middot; while the gate is open
        </div>
      ) : null}

      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="text-3xl text-chrome-100">{tier.name}</h2>
        <span
          data-pricing={PRICING_STATUS}
          className="text-2xl text-pink-200"
        >
          {tier.price}
        </span>
      </div>

      <div className="mt-3 chrome-label text-chrome-500">
        {cadenceLabel}
      </div>

      <p className="mt-5 max-w-prose text-chrome-200">{tier.blurb}</p>

      <ul className="mt-6 space-y-2 border-l-2 border-warm-black-800 pl-5 text-chrome-300">
        {tier.includes.map((line, i) => (
          <li key={`${tier.slug}-inc-${i}`}>{line}</li>
        ))}
      </ul>

      {tier.caveat ? (
        <p className="mt-6 max-w-prose text-sm text-chrome-300">
          {tier.caveat}
        </p>
      ) : null}

      <TierJoinButton
        tier={tier.slug}
        label={
          isFledge
            ? `Become a Fledge — £75 once`
            : `Join the ${tier.name} — ${tier.price}`
        }
      />
    </section>
  );
}
