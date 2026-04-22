import type { MetadataRoute } from "next";
import { getCollections } from "@/lib/collections";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths = [
    "",
    "/protocol",
    "/collections",
    "/shop",
    "/shop/certificate",
    "/shop/shipping",
  ];

  const base: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: p === "" ? 1 : 0.6,
  }));

  const collectionPaths = getCollections().flatMap((c) => [
    {
      url: `${SITE_URL}/collections/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/shop/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
  ]);

  return [...base, ...collectionPaths];
}
