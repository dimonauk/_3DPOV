/**
 * /admin/targeting — Match studio content to rolodex people.
 *
 * Operator enters: title + primary scene + tags. The page scores
 * every rolodex person against the content and surfaces the
 * top matches with their score + reasons + outreach links.
 *
 * Pure server component — reads `lib/people/registry.ts` + scores
 * via `lib/admin/targeting.ts`. No external calls, no spawned
 * processes. Fast.
 *
 * Future: pair with `docs/OUTREACH-EMAILS.md` templates so each
 * row has a one-click "draft email" button.
 */

import Link from "next/link";

import { target } from "lib/admin/targeting";
import type { ProfileScene } from "lib/people/types";

import { ADMIN_TARGETING_STYLES } from "./styles";

const ALL_SCENES: ProfileScene[] = [
  "fire-art",
  "light-painting",
  "vr",
  "ar",
  "motion-capture",
  "pixel-art",
  "vrm",
  "pov",
  "led-programming",
  "projection",
  "holography",
  "jewellery",
  "drones",
  "generative-ai",
  "splat-360",
  "3d-printing",
  "performance",
];

function parseScenes(raw: string | string[] | undefined): ProfileScene[] {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : raw.split(",");
  return list
    .map((s) => s.trim() as ProfileScene)
    .filter((s) => ALL_SCENES.includes(s));
}

function parseTags(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : raw.split(",");
  return list.map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Targeting — operator",
  robots: { index: false, follow: false },
};

export default async function TargetingPage({
  searchParams,
}: {
  searchParams: Promise<{
    title?: string;
    primary?: string;
    scenes?: string;
    tags?: string;
  }>;
}) {
  const params = await searchParams;
  const title = params.title ?? "";
  const primary = (params.primary ?? "") as ProfileScene | "";
  const scenes = parseScenes(params.scenes);
  const tags = parseTags(params.tags);

  const hasInput =
    title.length > 0 && primary.length > 0 && ALL_SCENES.includes(primary as ProfileScene);

  const hits = hasInput
    ? target({
        title,
        primaryScene: primary as ProfileScene,
        scenes: scenes.length > 0 ? scenes : [primary as ProfileScene],
        tags,
      })
    : [];

  return (
    <div className="tg-root">
      <header className="tg-header">
        <h1>Targeting</h1>
        <p>
          Match a piece of studio content against the rolodex. The
          page scores every public profile by shared scenes + tags
          and surfaces the highest-overlap people first.
        </p>
        <p className="tg-hint">
          Use the matches to pull the right outreach template from{" "}
          <code>docs/OUTREACH-EMAILS.md</code> and personalise per
          person.
        </p>
      </header>

      <form className="tg-form" method="GET">
        <label className="tg-row">
          <span className="tg-label">Content title</span>
          <input
            type="text"
            name="title"
            defaultValue={title}
            placeholder="e.g. Belt-printed wall reliefs at the Hive"
          />
        </label>
        <label className="tg-row">
          <span className="tg-label">Primary scene</span>
          <select name="primary" defaultValue={primary}>
            <option value="">(select)</option>
            {ALL_SCENES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="tg-row">
          <span className="tg-label">Secondary scenes (comma-sep)</span>
          <input
            type="text"
            name="scenes"
            defaultValue={scenes.join(", ")}
            placeholder="e.g. 3d-printing, light-painting"
          />
        </label>
        <label className="tg-row">
          <span className="tg-label">Tags (comma-sep)</span>
          <input
            type="text"
            name="tags"
            defaultValue={tags.join(", ")}
            placeholder="e.g. belt-printer, foreshore, manchester"
          />
        </label>
        <button type="submit" className="tg-run">
          Find matches
        </button>
      </form>

      {hasInput && (
        <section className="tg-results">
          <div className="tg-results-title">
            {hits.length} match{hits.length === 1 ? "" : "es"} for &ldquo;
            {title}&rdquo;
          </div>
          {hits.length === 0 ? (
            <p className="tg-empty">
              No rolodex matches. Either the rolodex needs more
              entries in this scene, or this piece is so off-axis
              that none of the studio&rsquo;s peers overlap.
            </p>
          ) : (
            <ul className="tg-hits">
              {hits.map((h) => (
                <li key={h.profile.id}>
                  <div className="tg-hit-head">
                    <span className="tg-hit-name">
                      <Link href={`/people/${h.profile.id}`}>
                        {h.profile.name}
                      </Link>
                    </span>
                    <span className="tg-hit-score">{h.score}</span>
                  </div>
                  <div className="tg-hit-meta">
                    {h.profile.location} · {h.profile.role}
                  </div>
                  <div className="tg-hit-reasons">
                    {h.reasons.join(" · ")}
                  </div>
                  <div className="tg-hit-links">
                    <a
                      href={h.profile.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      site &rarr;
                    </a>
                    <Link href={`/people/${h.profile.id}`}>
                      profile &rarr;
                    </Link>
                    <Link href={`/agents/${h.profile.id}`}>
                      agent &rarr;
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx global>{ADMIN_TARGETING_STYLES}</style>
    </div>
  );
}
