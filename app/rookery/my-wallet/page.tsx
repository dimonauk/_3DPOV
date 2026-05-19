import type { Metadata } from "next";

import { MyWalletClient } from "./my-wallet-client";

export const metadata: Metadata = {
  title: "The Rookery — your wallet",
  description:
    "What the studio knows about you: tier, Patreon link state, Discord link state, edition entitlements. The honest read-out.",
};

export default function MyWalletPage({
  searchParams,
}: {
  searchParams: Promise<{ patreon?: string; discord?: string; reason?: string }>;
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <div className="chrome-label">Your wallet</div>
      <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
        Honest read-out.
      </h1>

      <div className="mt-8 max-w-xl space-y-5 text-chrome-200">
        <p>
          One screen. The studio&rsquo;s view of you &mdash; tier,
          Patreon link, Discord link, any edition holds. Same data the
          back-of-house sees. Nothing hidden.
        </p>
      </div>

      <MyWalletClient searchParams={searchParams} />
    </article>
  );
}
