/**
 * lib/theme/registry.ts — cumulative capability-option registry.
 *
 * The Holoflow theme is a set of independent **axes**, each carrying
 * an enumerated list of **options**. The active selection per axis is
 * what the site renders. Adding a new design = adding a new option to
 * an axis (or adding a new axis entirely) — never deleting an existing
 * option. This is the rule established 2026-05-24.
 *
 * Adding a new option:
 *   1. Append a new key to the axis's `options` array here.
 *   2. Wire its implementation in the matching folder
 *      (e.g. components/holoflow/Background/<key>.tsx for background).
 *   3. Update DEFAULT_SELECTION below if it should be the new default.
 *   4. The /theme page picks it up automatically from the registry.
 *
 * Reading: components call `useTheme()` from `lib/theme/store.ts` and
 * branch on the active selection. Use `optionSpec(axis, key)` if you
 * need the option's display metadata.
 */

export type ThemeOption<Key extends string = string> = {
  /** Stable key persisted to localStorage. */
  key: Key;
  /** Short display label for the /theme page. */
  label: string;
  /** Two-line explanation; HTML/Markdown not allowed. */
  description: string;
  /** Date this option entered the registry (ISO). */
  addedAt: string;
};

export type ThemeAxisDef<Key extends string = string> = {
  /** Stable axis id; used as the localStorage key prefix. */
  id: string;
  /** Display name on the /theme page. */
  label: string;
  /** One-line description of what this axis controls. */
  describes: string;
  options: ReadonlyArray<ThemeOption<Key>>;
};

// ─── BACKGROUND ────────────────────────────────────────────────────────
export type BackgroundKey = "solid" | "dynamic-particles";
export const BACKGROUND: ThemeAxisDef<BackgroundKey> = {
  id: "background",
  label: "Background",
  describes: "What sits behind the page content.",
  options: [
    {
      key: "solid",
      label: "Solid",
      description: "Static warm-black fill. Cheapest, no motion, calmest read.",
      addedAt: "2026-04-01",
    },
    {
      key: "dynamic-particles",
      label: "Dynamic — particle drift",
      description:
        "Canvas particle field with parallax + radial vignette. Adds depth and a live-instrument feel; ~1 MB/s GPU paint.",
      addedAt: "2026-05-24",
    },
  ],
};

// ─── PALETTE ───────────────────────────────────────────────────────────
export type PaletteKey = "kawaii-cyberpunk" | "jewel-tones" | "dimona-pastel";
export const PALETTE: ThemeAxisDef<PaletteKey> = {
  id: "palette",
  label: "Palette",
  describes: "The accent colour family used by chrome labels, dots, and pillars.",
  options: [
    {
      key: "kawaii-cyberpunk",
      label: "Kawaii cyberpunk",
      description: "Pink / mint / lavender on warm-black. The original Holoflow palette.",
      addedAt: "2026-04-01",
    },
    {
      key: "jewel-tones",
      label: "Jewel tones",
      description:
        "Adds gold / teal / coral as pillar accents alongside the kawaii core. Each vertical can own a colour.",
      addedAt: "2026-05-24",
    },
    {
      key: "dimona-pastel",
      label: "Dimona pastel",
      description:
        "50s pastel sci-fi kawaii witchcore: mint #7fffd4 + pink + lilac + gold + ice. Happy cyberpunk, the opposite of Blade Runner.",
      addedAt: "2026-05-24",
    },
  ],
};

// ─── CARD STYLE ────────────────────────────────────────────────────────
export type CardStyleKey = "flat" | "pillar";
export const CARD_STYLE: ThemeAxisDef<CardStyleKey> = {
  id: "cardStyle",
  label: "Card style",
  describes: "How service/feature cards are framed and laid out.",
  options: [
    {
      key: "flat",
      label: "Flat",
      description: "Rounded border, body text, no chrome. Reads as a content tile.",
      addedAt: "2026-04-01",
    },
    {
      key: "pillar",
      label: "Numbered pillar",
      description:
        "01 / 03 prefix, glyph, name, tag list, animated bottom-bar on hover. Reads as a service offering.",
      addedAt: "2026-05-24",
    },
  ],
};

// ─── CURSOR ────────────────────────────────────────────────────────────
export type CursorKey = "default" | "crosshair";
export const CURSOR: ThemeAxisDef<CursorKey> = {
  id: "cursor",
  label: "Cursor",
  describes: "Page-level cursor style.",
  options: [
    {
      key: "default",
      label: "Default",
      description: "System default. Pointer over links, text-caret over inputs.",
      addedAt: "2026-04-01",
    },
    {
      key: "crosshair",
      label: "Crosshair",
      description: "Studio-instrument feel; turns the whole page into a workbench.",
      addedAt: "2026-05-24",
    },
  ],
};

// ─── MARQUEE ───────────────────────────────────────────────────────────
export type MarqueeKey = "off" | "on";
export const MARQUEE: ThemeAxisDef<MarqueeKey> = {
  id: "marquee",
  label: "Capability marquee",
  describes: "Scrolling capability tape under the hero.",
  options: [
    {
      key: "off",
      label: "Off",
      description: "Hero flows straight into the first content section.",
      addedAt: "2026-04-01",
    },
    {
      key: "on",
      label: "On",
      description: "Studio capabilities cycle across the fold; pauses on hover.",
      addedAt: "2026-05-24",
    },
  ],
};

// ─── MOUSE RIPPLES ─────────────────────────────────────────────────────
export type MouseRipplesKey = "off" | "on";
export const MOUSE_RIPPLES: ThemeAxisDef<MouseRipplesKey> = {
  id: "mouseRipples",
  label: "Mouse ripples",
  describes:
    "Faint expanding lavender ring at every click. Studio-instrument feel; needs <ThemeBehaviors /> mounted near the root.",
  options: [
    { key: "off", label: "Off", description: "No click effect.", addedAt: "2026-04-01" },
    { key: "on", label: "On", description: "Lavender ring expands and fades from the click point.", addedAt: "2026-05-24" },
  ],
};

// ─── KEYBOARD KONAMI ───────────────────────────────────────────────────
export type KeyboardKonamiKey = "off" | "on";
export const KEYBOARD_KONAMI: ThemeAxisDef<KeyboardKonamiKey> = {
  id: "keyboardKonami",
  label: "Konami listener",
  describes:
    "↑↑↓↓←→←→BA fires the 'logo' easter egg. Requires easterEggs=on AND <ThemeBehaviors /> mounted.",
  options: [
    { key: "off", label: "Off", description: "No keyboard sequence listener.", addedAt: "2026-04-01" },
    { key: "on", label: "On", description: "Konami sequence shows the logo easter egg.", addedAt: "2026-05-24" },
  ],
};

// ─── EASTER EGGS ───────────────────────────────────────────────────────
export type EasterEggsKey = "off" | "on";
export const EASTER_EGGS: ThemeAxisDef<EasterEggsKey> = {
  id: "easterEggs",
  label: "Easter eggs",
  describes:
    "Hidden floating panels triggered by clicking certain elements. Add entries to the <EasterEggProvider /> registry.",
  options: [
    { key: "off", label: "Off", description: "showEE() calls are no-ops; no panels render.", addedAt: "2026-04-01" },
    { key: "on", label: "On", description: "Clicking egg-enabled elements pops a floating panel.", addedAt: "2026-05-24" },
  ],
};

// ─── SECTION STRIPE ────────────────────────────────────────────────────
export type SectionStripeKey = "flat" | "alternating";
export const SECTION_STRIPE: ThemeAxisDef<SectionStripeKey> = {
  id: "sectionStripe",
  label: "Section stripe",
  describes:
    "Background rhythm between vertically-stacked sections.",
  options: [
    { key: "flat", label: "Flat", description: "All sections share the page background.", addedAt: "2026-04-01" },
    { key: "alternating", label: "Alternating", description: "Sections alternate warm-black-950 / 925 / 875 to create rhythm.", addedAt: "2026-05-24" },
  ],
};

// ─── APP LAYOUT ────────────────────────────────────────────────────────
export type AppLayoutKey = "long-scroll" | "single-page-tabs";
export const APP_LAYOUT: ThemeAxisDef<AppLayoutKey> = {
  id: "appLayout",
  label: "App layout",
  describes:
    "How top-level sections compose on a landing-style page.",
  options: [
    { key: "long-scroll", label: "Long scroll", description: "Sections stack vertically; nav links scroll-anchor.", addedAt: "2026-04-01" },
    { key: "single-page-tabs", label: "Single-page tabs", description: "One section visible at a time; nav links swap which is active.", addedAt: "2026-05-24" },
  ],
};

// ─── CORNER STYLE ──────────────────────────────────────────────────────
export type CornerStyleKey = "square" | "octagonal";
export const CORNER_STYLE: ThemeAxisDef<CornerStyleKey> = {
  id: "cornerStyle",
  label: "Corner style",
  describes:
    "Whether cards and buttons have square / rounded corners (default) or clipped octagonal corners (Dimona-pastel aesthetic).",
  options: [
    { key: "square", label: "Square / rounded", description: "Standard Tailwind rounding.", addedAt: "2026-04-01" },
    { key: "octagonal", label: "Octagonal clip-path", description: "10px corner cuts via clip-path — the Dimona-pastel surface treatment.", addedAt: "2026-05-24" },
  ],
};

// ─── CARD HOVER ────────────────────────────────────────────────────────
export type CardHoverKey = "flat" | "lift-3d";
export const CARD_HOVER: ThemeAxisDef<CardHoverKey> = {
  id: "cardHover",
  label: "Card hover",
  describes: "How cards respond to hover.",
  options: [
    { key: "flat", label: "Flat", description: "Background tint change only.", addedAt: "2026-04-01" },
    { key: "lift-3d", label: "3D lift", description: "Subtle rotateX/Y/translateZ — trading-card feel.", addedAt: "2026-05-24" },
  ],
};

// ─── GLOW EFFECTS ──────────────────────────────────────────────────────
export type GlowEffectsKey = "off" | "on";
export const GLOW_EFFECTS: ThemeAxisDef<GlowEffectsKey> = {
  id: "glowEffects",
  label: "Glow effects",
  describes: "Pulsing box-shadow rings in palette accent colors. Decorative; adds depth.",
  options: [
    { key: "off", label: "Off", description: "No animated shadows.", addedAt: "2026-04-01" },
    { key: "on", label: "On", description: "Cards opt-in via the <Glow /> wrapper or .holoflow-glow-{mint|pink|lilac} class.", addedAt: "2026-05-24" },
  ],
};

// ─── FORM STYLE ────────────────────────────────────────────────────────
export type FormStyleKey = "bordered" | "minimal-line";
export const FORM_STYLE: ThemeAxisDef<FormStyleKey> = {
  id: "formStyle",
  label: "Form style",
  describes: "How input fields are framed.",
  options: [
    { key: "bordered", label: "Bordered", description: "Full border + dark fill — standard.", addedAt: "2026-04-01" },
    { key: "minimal-line", label: "Minimal line", description: "Bottom-border only, transparent fill — the Dimona contact-form style.", addedAt: "2026-05-24" },
  ],
};

// ─── CIRCUIT TRACES ────────────────────────────────────────────────────
export type CircuitTracesKey = "off" | "on";
export const CIRCUIT_TRACES: ThemeAxisDef<CircuitTracesKey> = {
  id: "circuitTraces",
  label: "Circuit traces",
  describes: "Animated SVG traces flowing through the page like PCB current. Decorative overlay.",
  options: [
    { key: "off", label: "Off", description: "No overlay.", addedAt: "2026-04-01" },
    { key: "on", label: "On", description: "Pages can opt-in by mounting <CircuitTraces /> as the first child of <main>.", addedAt: "2026-05-24" },
  ],
};

// ─── REGISTRY ──────────────────────────────────────────────────────────
export const REGISTRY = {
  background: BACKGROUND,
  palette: PALETTE,
  cardStyle: CARD_STYLE,
  cursor: CURSOR,
  marquee: MARQUEE,
  mouseRipples: MOUSE_RIPPLES,
  keyboardKonami: KEYBOARD_KONAMI,
  easterEggs: EASTER_EGGS,
  sectionStripe: SECTION_STRIPE,
  appLayout: APP_LAYOUT,
  cornerStyle: CORNER_STYLE,
  cardHover: CARD_HOVER,
  glowEffects: GLOW_EFFECTS,
  formStyle: FORM_STYLE,
  circuitTraces: CIRCUIT_TRACES,
} as const;

export type Selection = {
  background: BackgroundKey;
  palette: PaletteKey;
  cardStyle: CardStyleKey;
  cursor: CursorKey;
  marquee: MarqueeKey;
  mouseRipples: MouseRipplesKey;
  keyboardKonami: KeyboardKonamiKey;
  easterEggs: EasterEggsKey;
  sectionStripe: SectionStripeKey;
  appLayout: AppLayoutKey;
  cornerStyle: CornerStyleKey;
  cardHover: CardHoverKey;
  glowEffects: GlowEffectsKey;
  formStyle: FormStyleKey;
  circuitTraces: CircuitTracesKey;
};

/** Active default — most recent option per axis. The user can override
 *  via the /theme page; the override persists in localStorage. */
export const DEFAULT_SELECTION: Selection = {
  background: "solid",
  palette: "kawaii-cyberpunk",
  cardStyle: "flat",
  cursor: "default",
  marquee: "off",
  mouseRipples: "off",
  keyboardKonami: "off",
  easterEggs: "off",
  sectionStripe: "flat",
  appLayout: "long-scroll",
  cornerStyle: "square",
  cardHover: "flat",
  glowEffects: "off",
  formStyle: "bordered",
  circuitTraces: "off",
};

/** Look up the metadata for an option by axis id and key. */
export function optionSpec<A extends keyof typeof REGISTRY>(
  axis: A,
  key: Selection[A],
): ThemeOption | undefined {
  const ax = REGISTRY[axis];
  return ax.options.find((o) => o.key === key);
}
