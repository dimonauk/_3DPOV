/**
 * sanity/schemas/pano-360.ts — 360 panorama document type.
 *
 * One-line role: equirectangular still record. Structurally compatible
 * with the canonical `Media` shape; lifts as `kind: "360-photo"`.
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
  name: "pano360",
  title: "360 Panorama",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "The panorama as the studio refers to it.",
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
      description: "The surface of the site this panorama belongs to.",
      options: { list: [...MEDIA_SUBJECTS] },
      initialValue: "holo-walk",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "capturedAt",
      title: "Captured",
      type: "date",
      description: "Date the panorama was photographed.",
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
      name: "equirectImage",
      title: "Equirectangular image",
      type: "image",
      description: "Full 2:1 equirectangular master.",
      options: { hotspot: false },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "heading",
      title: "Initial yaw (heading, degrees)",
      type: "number",
      description: "Initial horizontal angle the viewer faces on load.",
      initialValue: 0,
    }),
    defineField({
      name: "pitch",
      title: "Initial pitch (degrees)",
      type: "number",
      description: "Initial vertical angle the viewer faces on load.",
      initialValue: 0,
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
    select: { title: "title", subtitle: "subject", media: "equirectImage" },
  },
});
