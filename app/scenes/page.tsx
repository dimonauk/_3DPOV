import Link from "next/link";

import Footer from "components/layout/footer";
import { sceneCounts } from "lib/scenes";

export const metadata = {
  title: "Scenes",
  description:
    "Every UK creative scene the studio overlaps with — fire art, light painting, VR, AR, motion capture, pixel art, splat and 360 capture, 3D printing, POV LED, projection, holography, jewellery, drones, generative AI, VRM avatars, live performance.",
};

export default function ScenesIndexPage() {
  const counts = sceneCounts();
  const total = counts.length;
  const withWhosWho = counts.filter((c) => c.hasWhosWho).length;

  return (
    <>
      <article className="mx-auto max-w-4xl px-6 py-20 md:py-28">
        <div className="chrome-label">Knowledge base · Scenes</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Scenes.
        </h1>
        <p className="mt-8 max-w-2xl text-chrome-200">
          {total} UK creative scenes the studio overlaps with. Each
          page surfaces the practitioners named in the rolodex, the
          who&rsquo;s-who article that catalogues the scene, and the
          studio&rsquo;s other writing that touches it.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-chrome-300">
          {withWhosWho} of {total} scenes have a who&rsquo;s-who
          article published. The rest are queued; one ships per
          session.
        </p>

        <ul className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {counts.map(({ scene, profileCount, hasWhosWho }) => (
            <li key={scene.slug}>
              <Link
                href={`/scenes/${scene.slug}`}
                className="block rounded-sm border border-warm-black-700 bg-warm-black-900/30 px-4 py-4 transition-colors hover:border-pink-200"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-chrome-100">{scene.label}</span>
                  <span className="chrome-label text-chrome-500">
                    {profileCount} {profileCount === 1 ? "person" : "people"}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-chrome-400">
                  {scene.blurb}
                </p>
                <div className="mt-3 chrome-label text-chrome-500">
                  {hasWhosWho ? (
                    <span className="text-pink-200">Who&rsquo;s-who &rarr;</span>
                  ) : (
                    <span>Who&rsquo;s-who forthcoming</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-16 border-t border-warm-black-800 pt-10">
          <div className="chrome-label">Read first</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/people" className="text-pink-200 hover:underline">
                People &rarr;
              </Link>
            </li>
            <li>
              <Link href="/whoswho" className="text-pink-200 hover:underline">
                Who&rsquo;s-who articles &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/articles/osint-for-finding-your-people"
                className="text-pink-200 hover:underline"
              >
                OSINT for finding your people &rarr;
              </Link>
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}
