/**
 * sanity/sanity-shim.d.ts — Type shim for the optional `sanity` package.
 *
 * One-line role: minimal ambient declarations of the few `sanity`
 * exports this scaffold references, so the project type-checks before
 * the operator installs the Studio core.
 *
 * # Posture
 * Scaffold-only. Real types from the actual `sanity` package supersede
 * these shims once it's installed (TypeScript prefers module-resolution
 * matches over ambient declarations). Do NOT extend this shim with
 * Studio internals — when the operator installs `sanity`, you want the
 * real types in play, not a shadow surface that drifts.
 */

declare module "sanity" {
  // Loosely typed — accepts any defineConfig / defineType / defineField
  // call. The real package's types replace these once installed.

  /** Minimal shim of the rule-builder fluent API used in our schemas. */
  export interface SanityRule {
    required(): SanityRule;
    max(limit: number): SanityRule;
    min(limit: number): SanityRule;
    error(message?: string): SanityRule;
    warning(message?: string): SanityRule;
    custom<T = unknown>(
      fn: (value: T) => true | string | Promise<true | string>,
    ): SanityRule;
  }

  /** Minimal shim of a field definition. */
  export interface SanityFieldDefinition {
    name: string;
    title?: string;
    type: string;
    description?: string;
    fields?: SanityFieldDefinition[];
    of?: unknown[];
    options?: Record<string, unknown>;
    initialValue?: unknown;
    rows?: number;
    validation?: (rule: SanityRule) => SanityRule;
  }

  /** Minimal shim of a document/type definition. */
  export interface SanityTypeDefinition {
    name: string;
    title?: string;
    type: string;
    fields?: SanityFieldDefinition[];
    of?: unknown[];
    preview?: { select: Record<string, string> };
  }

  export function defineConfig(config: unknown): unknown;
  export function defineType<T extends SanityTypeDefinition>(type: T): T;
  export function defineField<T extends SanityFieldDefinition>(field: T): T;
  export type StudioProps = Record<string, unknown>;
}

declare module "sanity/structure" {
  export function structureTool(options?: unknown): unknown;
}
