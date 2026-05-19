/**
 * lib/federation/notes.ts — Pure mappers from Entry → ActivityPub
 * Note + Create activity.
 *
 * Kept side-effect-free so the outbox route and the publish stub can
 * both call the same transform. No HTTP signing here — that lives in
 * lib/federation/publish.ts.
 */
import { SITE_URL } from "lib/feed/atom";
import type { Entry } from "lib/writing";

import { actorUrls } from "./actor";

const PUBLIC_AUDIENCE = "https://www.w3.org/ns/activitystreams#Public";

function pathFor(entry: Entry): string {
  switch (entry.kind) {
    case "article":
      return `/articles/${entry.slug}`;
    case "journal":
      return `/journal/${entry.slug}`;
    case "tutorial":
      return `/tutorials/${entry.slug}`;
  }
}

export function noteUrl(entry: Entry): string {
  return `${SITE_URL}${pathFor(entry)}`;
}

export function noteId(entry: Entry): string {
  // Use a stable per-entry id distinct from the alternate URL so
  // implementations can dedupe even if the canonical URL changes.
  return `${noteUrl(entry)}#ap-note`;
}

function isoFromDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toISOString();
}

/** ActivityStreams Note for a single entry. */
export type ApNote = {
  "@context": "https://www.w3.org/ns/activitystreams";
  id: string;
  type: "Note";
  attributedTo: string;
  to: string[];
  cc: string[];
  published: string;
  url: string;
  content: string;
  summary: string | null;
  tag: Array<{ type: "Hashtag"; href: string; name: string }>;
};

export function buildNote(entry: Entry): ApNote {
  const urls = actorUrls();
  const url = noteUrl(entry);
  const summary = entry.excerpt?.trim() || null;
  // Body content as HTML — Mastodon strips most tags but keeps <p>
  // and <a>. Keep it minimal: title as link + excerpt paragraph.
  const titleEscaped = escapeHtml(entry.title);
  const excerptEscaped = entry.excerpt ? escapeHtml(entry.excerpt) : "";
  const content = excerptEscaped
    ? `<p><a href="${url}">${titleEscaped}</a></p><p>${excerptEscaped}</p>`
    : `<p><a href="${url}">${titleEscaped}</a></p>`;

  return {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: noteId(entry),
    type: "Note",
    attributedTo: urls.id,
    to: [PUBLIC_AUDIENCE],
    cc: [urls.followers],
    published: isoFromDate(entry.date),
    url,
    content,
    summary,
    tag: [
      {
        type: "Hashtag",
        href: `${SITE_URL}/${entry.kind}s`,
        name: `#${entry.kind}`,
      },
    ],
  };
}

export type ApCreate = {
  "@context": "https://www.w3.org/ns/activitystreams";
  id: string;
  type: "Create";
  actor: string;
  to: string[];
  cc: string[];
  published: string;
  object: ApNote;
};

export function buildCreate(entry: Entry): ApCreate {
  const note = buildNote(entry);
  const urls = actorUrls();
  return {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${noteId(entry)}#create`,
    type: "Create",
    actor: urls.id,
    to: note.to,
    cc: note.cc,
    published: note.published,
    object: note,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
