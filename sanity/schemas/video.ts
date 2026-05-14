/**
 * sanity/schemas/video.ts — Video document type.
 *
 * One-line role: clip record (MP4 / WebM / MOV). Structurally compatible
 * with the canonical `Media` shape — `kind` is fixed to `"video"` on
 * lift; this schema doesn't expose `kind` because every record here is a
 * video by definition.
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

export default defineType({
  name: "video",
  title: "Video",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "The clip as the studio refers to it.",
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
      name: "subject",
      title: "Subject",
      type: "string",
      description: "The surface of the site this clip belongs to.",
      options: { list: [...MEDIA_SUBJECTS] },
      initialValue: "photograph",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "capturedAt",
      title: "Captured",
      type: "date",
      description: "Date the clip was filmed.",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      description: "Plain-prose caption.",
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
      name: "file",
      title: "File",
      type: "file",
      description: "The video file itself. MP4 / WebM / MOV.",
      options: { accept: "video/*" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "poster",
      title: "Poster",
      type: "image",
      description: "Still frame shown before play. Optional.",
      options: { hotspot: true },
    }),
    defineField({
      name: "durationSeconds",
      title: "Duration (seconds)",
      type: "number",
      description: "Playback length in seconds. Optional.",
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
      name: "retired",
      title: "Retired",
      type: "boolean",
      description: "Hidden from public lists; file is kept.",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "subject", media: "poster" },
  },
});
