import { articles } from "lib/articles";

import { buildFeed } from "lib/feed/atom";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  return buildFeed({
    section: "Articles",
    description:
      "Long-form pieces from Holoflow Studio. The studio's tradeoffs, the lineage of the work, the who's-who of UK creative scenes.",
    entries: articles,
    selfPath: "/articles/feed.xml",
  });
}
