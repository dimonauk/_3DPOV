/**
 * app/atelier/devices/page.tsx — OSS device gallery.
 *
 * Direction (Dimona, 2026-05-19): "fold in open source glb files for
 * games consoles and controlers and vr headsets ajd controllers etc".
 *
 * The Princess assembles a small gallery of hardware that has changed
 * the studio's mind about what a console is — four rows of plinths,
 * each row a category: consoles, console controllers, VR headsets, VR
 * controllers. Every model open source, every attribution checked.
 *
 * Server component. The R3F scene is in
 * `components/devices/DeviceGalleryScene.tsx` (client) and carries the
 * WebXR session button + dual-mode camera rigs via SceneStage. The
 * catalogue list below the scene is `DeviceCard`, also server-rendered.
 *
 * Sister surface: the sculpture wing at
 * `/atelier/sculpture-gallery`. Same shell, different register.
 */
import Link from "next/link";

import Footer from "components/layout/footer";
import { DeviceCard } from "components/devices/DeviceCard";
import { DeviceGalleryScene } from "components/devices/DeviceGalleryScene";
import { IssueBand } from "components/luxe/IssueBand";
import {
  CATEGORY_ORDER,
  categoryLabel,
  devicesByCategory,
  listDevices,
} from "lib/devices/catalogue";

export const metadata = {
  title: "Device gallery — open-source GLB models of consoles and VR kit",
  description:
    "Game consoles, console controllers, VR headsets, and VR controllers as CC0 (or properly-attributed CC-BY) GLB models on plinths. Orbit on a monitor or walk it in a headset.",
};

const issueLabel = () => {
  const now = new Date();
  const month = now
    .toLocaleString("en-GB", { month: "long" })
    .toUpperCase();
  return `${month} ${now.getUTCFullYear()}`;
};

export default function DevicesPage() {
  const all = listDevices();
  const issue = issueLabel();
  const totalCount = all.length;
  const presentCount = all.filter((d) => d.modelPresent).length;
  const cc0Count = all.filter((d) =>
    d.attribution.licence.startsWith("CC0"),
  ).length;

  return (
    <>
      <article className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <IssueBand
          label="ATELIER"
          issue="ISSUE 06"
          date={issue}
          publisher="HOLOFLOW STUDIO"
        />

        <header className="mt-8 mb-10 flex flex-col gap-4">
          <div className="chrome-label">Atelier &middot; Device gallery</div>
          <h1 className="font-display text-5xl leading-[0.95] md:text-6xl">
            A small gallery of the hardware that taught us what a console is.
          </h1>
          <p className="max-w-2xl text-lg text-chrome-200 italic">
            The Princess assembles a small gallery of hardware that has
            changed the studio&rsquo;s mind about what a console is. Every
            model open source, every attribution checked. Four rows on
            plinths &mdash; consoles, console controllers, VR headsets, VR
            controllers &mdash; arranged in chronological order across each
            row.
          </p>
          <p className="max-w-2xl text-sm text-chrome-400">
            Orbit on a monitor; walk the rows in a headset. Hover a piece
            for the placard with year, manufacturer, and the licence chip
            for its model.
          </p>
        </header>

        <section className="w-full">
          <DeviceGalleryScene height="76vh" />
        </section>

        <section className="mt-16 grid grid-cols-1 gap-6 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-6 text-sm text-chrome-300 md:grid-cols-3">
          <div>
            <div className="chrome-label text-chrome-400">Catalogue</div>
            <p className="mt-2 font-display text-2xl text-chrome-100">
              {totalCount} entries
            </p>
            <p className="mt-1 text-xs text-chrome-500">
              across {CATEGORY_ORDER.length} categories
            </p>
          </div>
          <div>
            <div className="chrome-label text-chrome-400">Licence</div>
            <p className="mt-2 font-display text-2xl text-chrome-100">
              {cc0Count} CC0
            </p>
            <p className="mt-1 text-xs text-chrome-500">
              {totalCount - cc0Count} CC-BY (attributed in each card)
            </p>
          </div>
          <div>
            <div className="chrome-label text-chrome-400">GLBs on disk</div>
            <p className="mt-2 font-display text-2xl text-chrome-100">
              {presentCount}/{totalCount}
            </p>
            <p className="mt-1 text-xs text-chrome-500">
              the rest fall back to category-tinted primitives
            </p>
          </div>
        </section>

        {CATEGORY_ORDER.map((category) => {
          const slice = devicesByCategory(category);
          if (slice.length === 0) return null;
          return (
            <section key={category} className="mt-20">
              <header className="flex items-baseline justify-between gap-4 border-b border-warm-black-800 pb-3">
                <h2 className="font-display text-3xl">
                  {categoryLabel(category)}
                </h2>
                <span className="chrome-label text-chrome-400">
                  {slice.length} entr{slice.length === 1 ? "y" : "ies"}
                </span>
              </header>

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {slice.map((entry) => (
                  <DeviceCard key={entry.slug} entry={entry} />
                ))}
              </div>
            </section>
          );
        })}

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">What sits behind the rows</div>
          <p className="mt-3">
            The scene is React Three Fiber under our WebXR-first
            SceneStage wrapper &mdash; WebGPU when the device offers it,
            WebGL 2 otherwise, the same scene graph in both. Plinths,
            spots, and placards mirror the sculpture wing; the catalogue
            is a plain data file at{" "}
            <code className="text-pink-200">lib/devices/catalogue.ts</code>;
            the layout is a pure function in{" "}
            <code className="text-pink-200">
              lib/devices/gallery-layout.ts
            </code>
            . Drop a new GLB under{" "}
            <code className="text-pink-200">public/models/devices/</code>{" "}
            and flip <code className="text-pink-200">modelPresent</code> to
            true; the gallery picks it up on the next reload.
          </p>
          <p className="mt-3">
            The sister wing &mdash; editioned studio sculptures &mdash;
            sits at{" "}
            <Link
              href="/atelier/sculpture-gallery"
              className="text-pink-200 underline underline-offset-4"
            >
              /atelier/sculpture-gallery
            </Link>
            . Sourcing notes and rejected candidates live in{" "}
            <Link
              href="/docs/oss-device-models"
              className="text-pink-200 underline underline-offset-4"
            >
              docs/OSS-DEVICE-MODELS.md
            </Link>
            .
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
