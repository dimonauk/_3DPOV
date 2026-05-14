/**
 * sanity/schemas/photo.ts — Photograph document type.
 *
 * One-line role: still-image record. Structurally compatible with the
 * canonical `Media` shape in `lib/capabilities/media/library-types.ts`
 * so Sanity-sourced photographs can be lifted into the same `Media`
 * surface the rest of the site reads.
 *
 * # Field mapping (Sanity → Media)
 * - title         → Media.title
 * - slug.current  → Media.id (Sanity-source records use the slug)
 * - kind          → Media.kind (restricted to photo variants)
 * - subject       → Media.subject
 * - capturedAt    → Media.capturedAt
 * - description   → Media.description
 * - tags[]        → Media.tags
 * - image         → Media.url (via Sanity image-url builder)
 * - location.*    → Media.location.*
 * - retired       → Media.retired
 */

import { defineField, defineType } from "sanity";

const MEDIA_SUBJECTS = [
  { title: "Photograph", value: "photograph" },
  { title: "Aerial", value: "aerial" },
  { title: "HoloWalk", value: "holo-walk" },
  { title: "Codex", value: "codex" },
  { title: "Article", value: "article" },
  { title: "Journal", value: "journal" },
  { title: "Tutorial", value: "tutorial" },
  { title: "Product", value: "product" },
  { title: "Rookery", value: "rookery" },
  { title: "Press", value: "press" },
  { title: "Other", value: "other" },
] as const;

const PHOTO_KINDS = [
  { title: "Photo", value: "photo" },
  { title: "Photo (single exposure)", value: "photo-single-exposure" },
] as const;

export default defineType({
  name: "photo",
  title: "Photograph",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "The piece as the studio refers to it.",
      validation: (rule) => rule.required().max(140),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "URL fragment derived from the title.",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "kind",
      title: "Kind",
      type: "string",
      description: "Either a normal photograph or a single-exposure light painting.",
      options: { list: [...PHOTO_KINDS], layout: "radio" },
      initialValue: "photo",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "subject",
      title: "Subject",
      type: "string",
      description: "The surface of the site this photograph belongs to.",
      options: { list: [...MEDIA_SUBJECTS] },
      initialValue: "photograph",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "capturedAt",
      title: "Captured",
      type: "date",
      description: "Date the shutter closed; not the date of upload.",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      description: "Plain-prose caption. Dispassionate, archival.",
      rows: 4,
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      description: "Free-form labels for filtering.",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      description: "The photograph itself. Original master preferred.",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "object",
      description: "Place of capture.",
      fields: [
        defineField({ name: "slug", title: "Slug", type: "string" }),
        defineField({ name: "name", title: "Name", type: "string" }),
        defineField({ name: "lat", title: "Latitude", type: "number" }),
        defineField({ name: "lng", title: "Longitude", type: "number" }),
      ],
    }),
    defineField({
      name: "credit",
      title: "Credit",
      type: "string",
      description: "Attribution string for the photographer or rights holder.",
    }),
    defineField({
      name: "retired",
      title: "Retired",
      type: "boolean",
      description: "Hidden from public lists; file is kept.",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "subject", media: "image" },
  },
});
