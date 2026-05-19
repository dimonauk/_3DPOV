import { journal } from "lib/journal";

import { buildFeed } from "lib/feed/atom";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  return buildFeed({
    section: "Journal",
    description:
      "Workshop notes, field-notes, intimate first-person entries from the studio bench.",
    entries: journal,
    selfPath: "/journal/feed.xml",
  });
}
