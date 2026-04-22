export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const SITE_NAME = "The Neo-London Chrono-Protocol";
export const SITE_TAGLINE = "Archive and gallery of the Neo-London Chrono-Protocol.";
