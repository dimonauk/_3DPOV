import { tutorials } from "lib/tutorials";

import { buildFeed } from "lib/feed/atom";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  return buildFeed({
    section: "Tutorials",
    description:
      "Hands-on walkthroughs from the studio bench. Emulators, light painting, splat capture, the long-exposure ritual.",
    entries: tutorials,
    selfPath: "/tutorials/feed.xml",
  });
}
