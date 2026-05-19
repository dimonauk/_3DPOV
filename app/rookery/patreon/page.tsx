import type { Metadata } from "next";

import { ConnectPatreonClient } from "./connect-client";

export const metadata: Metadata = {
  title: "The Rookery — connect Patreon",
  description:
    "Link your Patreon to unlock the supporter side of the perch — early-view drops, the bench dispatches, and the AT bench-pass once it's wired. Reader+ for legacy /dimonauk supporters is recognised automatically.",
};

export default function PatreonConnectPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <div className="chrome-label">Connect Patreon</div>
      <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
        Link the perch.
      </h1>

      <div className="mt-8 max-w-xl space-y-5 text-chrome-200">
        <p>
          Click the button below. You&rsquo;ll land on Patreon, where you
          confirm you&rsquo;re happy to share your tier and your
          membership state with Holo&#8209;Flow Studio. You bounce back
          here, your account picks up whichever tier you&rsquo;re on, and
          the supporter-side surfaces light up.
        </p>
        <p>
          If you&rsquo;ve been on the personal page at
          patreon.com/dimonauk and not the studio one, you&rsquo;ll be
          recognised as <em>reader+</em> &mdash; same email on both
          sides is all it needs.
        </p>
        <p className="text-pink-200">
          You don&rsquo;t need to pledge on the studio Patreon to read
          the site &mdash; this is for the supporter-only layer
          (early-view, bench dispatches, the AT bench-pass when that
          wave lands).
        </p>
      </div>

      <ConnectPatreonClient />

      <div className="mt-16 max-w-xl space-y-5 text-chrome-300 text-sm">
        <h2 className="text-chrome-100 text-lg">What you&rsquo;re sharing</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Your Patreon email and full name (read-only; we don&rsquo;t
            email you from Patreon&rsquo;s side &mdash; that&rsquo;s
            Patreon&rsquo;s own thing).
          </li>
          <li>
            Whether you&rsquo;re an active patron and which tier
            you&rsquo;re on.
          </li>
          <li>
            Lifetime support total, so we can recognise long-time
            supporters when the AT bench-pass eligibility check runs.
          </li>
        </ul>
        <h2 className="text-chrome-100 text-lg pt-4">What we don&rsquo;t see</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Your card details. Those never leave Patreon.</li>
          <li>
            What you support on other creators&rsquo; pages, except
            insofar as Patreon&rsquo;s API tells us you&rsquo;re a
            patron somewhere (used only to grant reader+).
          </li>
          <li>Anything you post on Patreon. None of that is fetched.</li>
        </ul>
      </div>
    </article>
  );
}
