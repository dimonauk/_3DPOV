import { z } from "zod";

const WorkBase = {
  editionSize: z.number().int().positive(),
  dimensions: z.string().min(1),
  glb: z.string().startsWith("/").optional(),
};

const PlateSchema = z.object({
  type: z.literal("plate"),
  ...WorkBase,
  priceGBP: z.number().int().positive(),
  paper: z.string().min(1),
});

const WaveguideSchema = z.object({
  type: z.literal("waveguide"),
  ...WorkBase,
  priceGBP: z.number().int().positive(),
  material: z.string().min(1),
  ledSpec: z.string().min(1),
  powerDraw: z.string().min(1),
});

const SculptureSchema = z.object({
  type: z.literal("sculpture"),
  ...WorkBase,
  priceGBP: z.number().int().positive(),
  material: z.string().min(1),
  base: z.string().optional(),
});

const ArraySchema = z.object({
  type: z.literal("array"),
  ...WorkBase,
  material: z.string().min(1),
  panelDimensions: z.string().min(1),
  options: z
    .array(
      z.object({
        panels: z.number().int().positive(),
        priceGBP: z.number().int().positive(),
      })
    )
    .min(1),
});

export const WorkSchema = z.discriminatedUnion("type", [
  PlateSchema,
  WaveguideSchema,
  SculptureSchema,
  ArraySchema,
]);

export const CollectionFrontmatterSchema = z.object({
  code: z.string().regex(/^CP-\d{3}$/, "code must be CP-### (e.g. CP-001)"),
  title: z.string().min(1),
  kata: z.string().min(1),
  location: z.string().min(1),
  coordinates: z.string().min(1),
  hour: z.string().min(1),
  performedOn: z.string().min(1),
  tint: z.string().regex(/^#[0-9a-fA-F]{6}$/, "tint must be a 6-digit hex colour"),
  plateRef: z.string().min(1),
  heroCaption: z.string().min(1),
  work: WorkSchema,
});

export type CollectionFrontmatter = z.infer<typeof CollectionFrontmatterSchema>;
