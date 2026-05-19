import type { Metadata } from "next";

import { ConnectDiscordClient } from "./connect-client";

export const metadata: Metadata = {
  title: "The Rookery — connect Discord",
  description:
    "Link your Discord to get the supporter role on the Holo-Flow Studio server. The role tracks your tier — upgrade or downgrade and the colour follows.",
};

export default function DiscordConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ discord?: string; reason?: string }>;
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <div className="chrome-label">Connect Discord</div>
      <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
        Get your colour.
      </h1>

      <div className="mt-8 max-w-xl space-y-5 text-chrome-200">
        <p>
          The Holo&#8209;Flow Studio Discord has a coloured role per
          tier &mdash; Reader+, Member, Patron, Atelier. Link your
          Discord account, accept the invite if you haven&rsquo;t yet,
          and the bot drops your role in within seconds.
        </p>
        <p>
          The link is one-shot: click, bounce through Discord, you land
          back here. We don&rsquo;t store your Discord password or any
          OAuth token afterwards &mdash; the bot does all the role work
          from its own credentials. We only persist your Discord user
          id (so the daily reconciler can find you).
        </p>
      </div>

      <ConnectDiscordClient searchParams={searchParams} />

      <div className="mt-16 max-w-xl space-y-5 text-chrome-300 text-sm">
        <h2 className="text-chrome-100 text-lg">What the role gives you</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Reader+ &mdash; a quiet colour that means &ldquo;long-time
            Dimona supporter.&rdquo; No locked channels; just visible
            recognition.
          </li>
          <li>
            Member &mdash; the supporter channel unlocks; drop alerts
            land in your DMs (opt-in inside Discord).
          </li>
          <li>
            Patron &mdash; the first-refusal-window channel opens; you
            see drops 12h before public.
          </li>
          <li>
            Atelier &mdash; the bench-pass channel, where the studio
            posts work-in-progress from the bench in real time.
          </li>
        </ul>
        <h2 className="text-chrome-100 text-lg pt-4">If something goes wrong</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Role didn&rsquo;t appear?</strong> Make sure
            you&rsquo;ve joined the studio server first &mdash; the bot
            can only assign roles to people who are in the room.
          </li>
          <li>
            <strong>Wrong tier showing?</strong> Try clicking
            &ldquo;Re-sync&rdquo; below. The webhook is usually
            real-time but a manual re-sync forces a fresh read.
          </li>
          <li>
            <strong>Still stuck?</strong> Email
            contact@holoflow.co.uk with your Discord username and your
            Patreon email.
          </li>
        </ul>
      </div>
    </article>
  );
}
