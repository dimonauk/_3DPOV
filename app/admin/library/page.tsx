/**
 * app/admin/library/page.tsx — Operator media table.
 *
 * Server-renders the current page of `mediaList()` filtered by URL
 * search params. Each row gets a retire toggle + a delete button —
 * both of which POST through the small client child component
 * (`row-actions.tsx`). Filter UI is plain GET form: no state, just
 * URL params, refresh-friendly.
 *
 * If admin Firebase isn't configured we catch the throw and render a
 * helpful "set the env var" stub instead of exploding.
 */

import Link from "next/link";
import { mediaList } from "lib/capabilities/media/library";
import type {
  Media,
  MediaKind,
  MediaPage,
  MediaQuery,
  MediaSource,
  MediaSubject,
} from "lib/capabilities/media/library-types";
import { RowActions } from "./row-actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Library — operator console",
  robots: { index: false, follow: false },
};

const SUBJECTS: MediaSubject[] = [
  "photograph",
  "aerial",
  "holo-walk",
  "codex",
  "article",
  "journal",
  "tutorial",
  "product",
  "rookery",
  "press",
  "other",
];

const KINDS: MediaKind[] = [
  "photo",
  "photo-single-exposure",
  "video",
  "360-photo",
  "360-video",
  "sbs-stereo-mp4",
  "usdz",
  "glb",
  "ply",
  "audio",
  "pdf",
  "other",
];

const SOURCES: MediaSource[] = [
  "vercel-blob",
  "google-photos",
  "google-drive",
  "sanity",
  "public-static",
];

type SearchParams = {
  subject?: string;
  kind?: string;
  source?: string;
  tag?: string;
  cursor?: string;
  includeRetired?: string;
};

function asEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined {
  if (!value) return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toISOString().slice(0, 16).replace("T", " ");
  } catch {
    return iso;
  }
}

function thumbFor(media: Media): string {
  return media.variants?.thumbnail ?? media.url;
}

function NotConfigured() {
  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-12 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header className="border-b border-warm-black-700 pb-4">
          <span className="chrome-label text-chrome-400">Operator · library</span>
          <h1 className="mt-2 text-2xl uppercase tracking-[0.18em] text-chrome-100">
            Firebase Admin not configured
          </h1>
        </header>
        <p className="text-sm leading-relaxed text-chrome-300">
          Set <code className="text-pink-200">FIREBASE_ADMIN_SERVICE_ACCOUNT</code> in
          Vercel env (Production + Preview + Development). Paste the JSON-
          stringified service-account key from Firebase Console → Project
          Settings → Service accounts → &ldquo;Generate new private key&rdquo;.
        </p>
        <p className="text-xs leading-relaxed text-chrome-400">
          For local development: <code className="text-pink-200">vercel env pull .env.local</code>
          {" "}after the env var is set in the project.
        </p>
        <a
          href="/admin"
          className="chrome-label text-chrome-500 hover:text-pink-200"
        >
          ← Console
        </a>
      </div>
    </main>
  );
}

export default async function AdminLibraryPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await props.searchParams;

  const query: MediaQuery = {
    limit: 50,
    includeRetired: params.includeRetired === "1",
  };
  const subject = asEnum(params.subject, SUBJECTS);
  if (subject) query.subject = subject;
  const kind = asEnum(params.kind, KINDS);
  if (kind) query.kind = kind;
  const source = asEnum(params.source, SOURCES);
  if (source) query.source = source;
  if (params.tag) query.tag = params.tag;
  if (params.cursor) query.cursor = params.cursor;

  let page: MediaPage;
  let listError: string | null = null;
  try {
    page = await mediaList(query);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/FIREBASE_ADMIN_SERVICE_ACCOUNT|firebase-admin/i.test(message)) {
      return <NotConfigured />;
    }
    page = { items: [] };
    listError = message;
  }

  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-12 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex items-center justify-between border-b border-warm-black-700 pb-4">
          <div className="flex flex-col gap-1">
            <span className="chrome-label text-chrome-400">Operator · library</span>
            <h1 className="text-2xl uppercase tracking-[0.18em] text-chrome-100">
              Media catalogue
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/upload"
              className="chrome-label text-chrome-500 hover:text-pink-200"
            >
              + Upload
            </Link>
            <a
              href="/admin"
              className="chrome-label text-chrome-500 hover:text-pink-200"
            >
              ← Console
            </a>
          </div>
        </header>

        <form
          method="get"
          className="grid grid-cols-1 gap-3 rounded-sm border border-warm-black-700 bg-warm-black-950 p-4 md:grid-cols-5"
        >
          <FilterSelect
            name="subject"
            label="Subject"
            value={params.subject ?? ""}
            options={SUBJECTS}
          />
          <FilterSelect
            name="kind"
            label="Kind"
            value={params.kind ?? ""}
            options={KINDS}
          />
          <FilterSelect
            name="source"
            label="Source"
            value={params.source ?? ""}
            options={SOURCES}
          />
          <label className="flex flex-col gap-1">
            <span className="chrome-label text-chrome-500">Tag</span>
            <input
              type="text"
              name="tag"
              defaultValue={params.tag ?? ""}
              className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-xs text-chrome-100 focus:border-pink-200 focus:outline-none"
            />
          </label>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.2em] text-chrome-400">
              <input
                type="checkbox"
                name="includeRetired"
                value="1"
                defaultChecked={params.includeRetired === "1"}
                className="accent-pink-300"
              />
              Inc. retired
            </label>
            <button
              type="submit"
              className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-pink-200 hover:bg-pink-200/20"
            >
              Filter
            </button>
          </div>
        </form>

        {listError ? (
          <p className="rounded-sm border border-pink-300/40 bg-pink-300/10 p-3 text-xs text-pink-200">
            {listError}
          </p>
        ) : null}

        {page.items.length === 0 ? (
          <p className="text-xs leading-relaxed text-chrome-500">
            Nothing matches. Try widening the filters or check that media has
            been uploaded.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-warm-black-700">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-warm-black-700 bg-warm-black-900/60 text-chrome-400">
                  <Th>Thumb</Th>
                  <Th>Kind</Th>
                  <Th>Subject</Th>
                  <Th>Source</Th>
                  <Th>Title</Th>
                  <Th>Uploaded</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((media) => (
                  <tr
                    key={media.id}
                    className="border-b border-warm-black-800 align-top"
                  >
                    <Td>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbFor(media)}
                        alt={media.title ?? media.id}
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-sm border border-warm-black-700 object-cover"
                        loading="lazy"
                      />
                    </Td>
                    <Td>{media.kind}</Td>
                    <Td>{media.subject}</Td>
                    <Td>{media.source}</Td>
                    <Td>
                      <div className="flex max-w-[18rem] flex-col gap-1">
                        <span className="text-chrome-100">
                          {media.title ?? "(untitled)"}
                        </span>
                        <a
                          href={media.url}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-[0.6rem] text-chrome-500 hover:text-pink-200"
                        >
                          {media.url}
                        </a>
                      </div>
                    </Td>
                    <Td>{formatDate(media.uploadedAt)}</Td>
                    <Td>
                      {media.retired ? (
                        <span className="chrome-label text-pink-300">Retired</span>
                      ) : (
                        <span className="chrome-label text-mint-300">Live</span>
                      )}
                    </Td>
                    <Td>
                      <RowActions
                        mediaId={media.id}
                        retired={Boolean(media.retired)}
                      />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {page.nextCursor ? (
          <div className="flex justify-end">
            <Link
              href={{
                pathname: "/admin/library",
                query: { ...params, cursor: page.nextCursor },
              }}
              className="chrome-label text-chrome-400 hover:text-pink-200"
            >
              Next →
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: readonly string[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="chrome-label text-chrome-500">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-xs text-chrome-100 focus:border-pink-200 focus:outline-none"
      >
        <option value="">(any)</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-[0.6rem] uppercase tracking-[0.22em]">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-3 text-chrome-200">{children}</td>;
}
