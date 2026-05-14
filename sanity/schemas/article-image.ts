/**
 * sanity/schemas/article-image.ts — Inline article illustration.
 *
 * One-line role: figure-with-caption record attached to a single article
 * by slug. Reader-side `getInlineImagesByArticleSlug` collects all
 * illustrations for a given article in capture order.
 */

import { defineField, defineType } from "sanity";

export default defineType({
  name: "articleImage",
  title: "Article image",
  type: "document",
  fields: [
    defineField({
      name: "articleSlug",
      title: "Article slug",
      type: "string",
      description: "Slug of the article this illustration belongs to.",
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
      name: "order",
      title: "Order",
      type: "number",
      description: "Sort order within the article. Lower comes first.",
      initialValue: 0,
    }),
  ],
  preview: {
    select: { title: "alt", subtitle: "articleSlug", media: "image" },
  },
});
