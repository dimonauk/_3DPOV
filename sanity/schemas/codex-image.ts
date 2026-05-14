/**
 * sanity/schemas/codex-image.ts — Codex apparatus image.
 *
 * One-line role: figure-with-caption record attached to a codex entry by
 * slug. Codex entries are the catalogue of apparatus, capture, and
 * commerce terms; each can carry one or more annotated images.
 */

import { defineField, defineType } from "sanity";

export default defineType({
  name: "codexImage",
  title: "Codex image",
  type: "document",
  fields: [
    defineField({
      name: "codexSlug",
      title: "Codex slug",
      type: "string",
      description: "Slug of the codex entry this image belongs to.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "text",
      description: "Figure caption shown below the image.",
      rows: 2,
      validation: (rule) => rule.max(280),
    }),
    defineField({
      name: "alt",
      title: "Alt text",
      type: "string",
      description: "Description for screen readers; the image as words.",
      validation: (rule) => rule.required().max(280),
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      description: "The illustration itself.",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sources",
      title: "Sources",
      type: "array",
      description: "External references that document the apparatus.",
      of: [
        {
          type: "object",
          name: "source",
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              validation: (rule) => rule.required().max(140),
            }),
            defineField({
              name: "url",
              title: "URL",
              type: "url",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: "label", subtitle: "url" } },
        },
      ],
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description: "Sort order within the codex entry. Lower comes first.",
      initialValue: 0,
    }),
  ],
  preview: {
    select: { title: "alt", subtitle: "codexSlug", media: "image" },
  },
});
