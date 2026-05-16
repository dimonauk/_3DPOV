import "server-only";
import { createHash } from "node:crypto";

const DEV_FALLBACK_SALT = "holoflow-dev-only-do-not-ship";

function readSalt(): string {
  const fromEnv = process.env.IP_HASH_SALT;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "IP_HASH_SALT is not set in production. Set it in Vercel project env before deploying.",
    );
  }
  return DEV_FALLBACK_SALT;
}

export function hashIp(ip: string): string {
  const salt = readSalt();
  return createHash("sha256").update(ip + ":" + salt).digest("hex").slice(0, 32);
}
