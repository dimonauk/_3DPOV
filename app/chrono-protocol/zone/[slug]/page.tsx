import Link from "next/link";
import { notFound } from "next/navigation";

import Footer from "components/layout/footer";
import { getMode } from "lib/chrono-protocol";
import {
  CONSTRUCT_LABEL,
  CONSTRUCT_TINT,
} from "lib/chrono-protocol/dialogue";
import {
  BASE_TUNNEL_SPEED,
  getZoneBySlug,
  getZoneSlugs,
  zoneTunnelSpeed,
} from "lib/chrono-protocol/zones";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getZoneSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const zone = getZoneBySlug(slug);
  if (!zone) return { title: "Zone not found" };
  return {
    title: `Chrono-Protocol &middot; ${zone.name}`,
    description: `${zone.billing}. ${zone.description.slice(0, 160)}`,
  };
}

export default async function ZoneBriefingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const zone = getZoneBySlug(slug);
  if (!zone) notFound();

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">
          Chrono-Protocol &middot; Zone briefing
        </div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          {zone.name}
        </h1>
        <p className="mt-2 text-lg text-chrome-300">{zone.billing}</p>

        <section className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Stat label="Difficulty" value={zone.difficulty.toUpperCase()} />
          <Stat
            label="Tunnel speed"
            value={`${zoneTunnelSpeed(zone).toFixed(1)} u/s`}
            sub={`base ${BASE_TUNNEL_SPEED} x ${zone.tunnelSpeedMultiplier}`}
          />
          <Stat
            label="Encounter modes"
            value={`${zone.activeModes.length} of 5`}
          />
        </section>

        <section className="mt-10 prose-gallery text-chrome-200">
          <p>{zone.description}</p>
        </section>

        <section className="mt-10">
          <div className="chrome-label mb-3 text-pink-200">
            Active modes
          </div>
          <div className="flex flex-wrap gap-2">
            {zone.activeModes.map((slug) => {
              const mode = getMode(slug);
              if (!mode) return null;
              return (
                <div
                  key={slug}
                  className="rounded-sm border px-3 py-2"
                  style={{
                    borderColor: mode.hexColor,
                    background: `${mode.hexColor}14`,
                  }}
                >
                  <div
                    className="chrome-label font-mono"
                    style={{ color: mode.hexColor }}
                  >
                    {mode.name}
                  </div>
                  <div className="mt-1 text-xs text-chrome-300">
                    {mode.function}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <div className="chrome-label mb-3 text-pink-200">
            Enemy roster
          </div>
          <ol className="divide-y divide-warm-black-800 border-y border-warm-black-800">
            {zone.enemies.map((enemy) => {
              const weakness = getMode(enemy.weakness);
              return (
                <li key={enemy.slug} className="py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <div
                        className="chrome-label"
                        style={{ color: enemy.color }}
                      >
                        Enemy &middot; {enemy.hp} hp
                      </div>
                      <h3 className="mt-1 text-xl text-chrome-100">
                        {enemy.name}
                      </h3>
                    </div>
                    {weakness ? (
                      <span
                        className="rounded-sm border px-2 py-1 font-mono text-xs"
                        style={{
                          borderColor: weakness.hexColor,
                          color: weakness.hexColor,
                          background: `${weakness.hexColor}14`,
                        }}
                      >
                        weakness: {weakness.name}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 max-w-prose text-sm text-chrome-300">
                    {enemy.description}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>

        {zone.boss ? (
          <section className="mt-10 rounded-sm border border-pink-200/40 bg-pink-200/5 p-5">
            <div className="chrome-label text-pink-200">
              Boss &middot; {zone.boss.hp} hp
            </div>
            <h3 className="mt-2 text-2xl text-chrome-100">
              {zone.boss.name}
            </h3>
            <p className="mt-2 max-w-prose text-sm text-chrome-200">
              {zone.boss.description}
            </p>
            {(() => {
              const weakness = getMode(zone.boss.weakness);
              if (!weakness) return null;
              return (
                <p className="mt-3 font-mono text-xs text-chrome-300">
                  Weakness:{" "}
                  <span style={{ color: weakness.hexColor }}>
                    {weakness.name}
                  </span>{" "}
                  &middot; {weakness.function}
                </p>
              );
            })()}
          </section>
        ) : (
          <section className="mt-10 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5">
            <div className="chrome-label text-chrome-500">No boss</div>
            <p className="mt-2 text-sm text-chrome-300">
              Tutorial zone &mdash; the boss slot lands in a later wave.
              The Safehouse is meant to feel like a safe walk.
            </p>
          </section>
        )}

        <section className="mt-10">
          <div className="chrome-label mb-3 text-pink-200">
            Narrating constructs
          </div>
          <div className="flex flex-wrap gap-3">
            {zone.narrators.map((c) => (
              <div
                key={c}
                className="rounded-sm border px-3 py-2"
                style={{
                  borderColor: CONSTRUCT_TINT[c],
                  background: `${CONSTRUCT_TINT[c]}14`,
                }}
              >
                <div
                  className="chrome-label font-mono"
                  style={{ color: CONSTRUCT_TINT[c] }}
                >
                  {CONSTRUCT_LABEL[c]}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5">
          <div className="chrome-label text-chrome-500">
            Splat backdrop
          </div>
          {zone.hasSplat && zone.splatSlug ? (
            <p className="mt-2 text-sm text-chrome-300">
              A SHARP-rendered splat for this zone is available in the{" "}
              <Link
                href={`/play/neo-london/zone/${zone.splatSlug}`}
                className="text-pink-200 underline underline-offset-4"
              >
                splat library
              </Link>
              . The runner will use it as the tunnel skybox once the
              backdrop loader is wired (Wave 5).
            </p>
          ) : (
            <p className="mt-2 text-sm text-chrome-300">
              No splat yet for this zone. The wireframe pass runs
              against the plain dark backdrop until the SHARP pipeline
              captures it. Track the capture queue at{" "}
              <Link
                href="/play/neo-london"
                className="text-pink-200 underline underline-offset-4"
              >
                /play/neo-london
              </Link>
              .
            </p>
          )}
        </section>

        <section className="mt-10 flex flex-wrap gap-3">
          <Link
            href={`/chrono-protocol/run?zone=${zone.slug}`}
            className="inline-flex items-center gap-2 rounded-sm border border-pink-200/40 bg-pink-200/5 px-4 py-2 text-sm text-pink-200 transition-colors hover:bg-pink-200/10"
          >
            Begin run &rarr;
          </Link>
          <Link
            href="/chrono-protocol/hub"
            className="inline-flex items-center gap-2 rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-4 py-2 text-sm text-chrome-200 transition-colors hover:text-pink-200"
          >
            &larr; Back to HUB
          </Link>
        </section>
      </article>
      <Footer />
    </>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-3">
      <div className="chrome-label text-chrome-500">{label}</div>
      <div className="mt-1 font-mono text-lg text-chrome-100">{value}</div>
      {sub ? (
        <div className="chrome-label mt-1 text-chrome-500">{sub}</div>
      ) : null}
    </div>
  );
}
