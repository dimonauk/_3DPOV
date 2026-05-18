/**
 * lib/printfarm/index.ts — provider registry.
 *
 * One env var (`PRINTFARM_PROVIDER`) selects which provider the
 * intake pipeline forwards orders to. v1 ships with `manual` only;
 * future providers (treatstock, slant3d, craftcloud) register
 * themselves here and become available without surface-code changes.
 */

import "server-only";

import { createLogger } from "lib/log";

import { manualProvider } from "./manual";
import type { PrintfarmProviderModule } from "./_base";

import type { PrintfarmProvider } from "lib/printfiles/types";

const log = createLogger("printfarm.registry");

/** Every implemented provider. */
const REGISTRY: Record<string, PrintfarmProviderModule> = {
  manual: manualProvider,
  // Stubs for future providers — when their impl lands, drop the file
  // in this dir and register here. The intake pipeline will pick them
  // up automatically when PRINTFARM_PROVIDER is set to the new id.
  //
  // treatstock: treatstockProvider,
  // slant3d:    slant3dProvider,
  // craftcloud: craftcloudProvider,
};

/**
 * Resolve the active provider from env. Defaults to `manual` when
 * `PRINTFARM_PROVIDER` is unset OR set to a provider we don't have
 * an implementation for yet. The fallback is loud so misconfiguration
 * shows up in logs.
 */
export function resolveProvider(): PrintfarmProviderModule {
  const env = (process.env.PRINTFARM_PROVIDER ?? "manual").trim().toLowerCase();
  const provider = REGISTRY[env];
  if (provider) return provider;
  log.warn("unknown PRINTFARM_PROVIDER, falling back to manual", { env });
  return REGISTRY["manual"]!;
}

export function listProviders(): PrintfarmProviderModule[] {
  return Object.values(REGISTRY);
}

export type { ForwardResult, PrintfarmProviderModule } from "./_base";
export type { PrintfarmProvider };
