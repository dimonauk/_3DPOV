/**
 * lib/emulator/systems.ts — Registry of in-browser emulator systems.
 *
 * The Holoflow /emulator/[system] route renders an EmulatorJS embed
 * for each entry. The `coreSlug` matches EmulatorJS's `EJS_core`
 * naming so the embed knows which WASM core to load. See
 * https://emulatorjs.org/docs/systems for the canonical list.
 *
 * `biosRequired` reflects whether the user also needs to provide a
 * BIOS dump from their own console (the studio never hosts BIOS
 * files; a separate file-picker handles BIOS when required).
 *
 * `acceptExtensions` is the file-picker filter for ROMs.
 */

export type EmulatorSystem = {
  /** URL slug. */
  slug: string;
  /** EmulatorJS core slug (`EJS_core`). */
  coreSlug: string;
  /** Human-readable system name. */
  label: string;
  /** Manufacturer + era one-liner. */
  manufacturer: string;
  /** Whether the user must also supply a BIOS dump. */
  biosRequired: boolean;
  /** Accepted ROM file extensions. */
  acceptExtensions: string[];
  /** Order group for the picker. */
  group:
    | "nintendo-home"
    | "nintendo-handheld"
    | "sega"
    | "sony"
    | "atari"
    | "arcade"
    | "computer"
    | "other";
};

export const SYSTEMS: EmulatorSystem[] = [
  // Nintendo home
  {
    slug: "nes",
    coreSlug: "nes",
    label: "NES / Famicom",
    manufacturer: "Nintendo, 1983",
    biosRequired: false,
    acceptExtensions: [".nes", ".fds", ".unif", ".unf"],
    group: "nintendo-home",
  },
  {
    slug: "snes",
    coreSlug: "snes",
    label: "SNES / Super Famicom",
    manufacturer: "Nintendo, 1990",
    biosRequired: false,
    acceptExtensions: [".smc", ".sfc", ".swc", ".fig"],
    group: "nintendo-home",
  },
  {
    slug: "n64",
    coreSlug: "n64",
    label: "Nintendo 64",
    manufacturer: "Nintendo, 1996",
    biosRequired: false,
    acceptExtensions: [".n64", ".v64", ".z64"],
    group: "nintendo-home",
  },

  // Nintendo handheld
  {
    slug: "gb",
    coreSlug: "gb",
    label: "Game Boy",
    manufacturer: "Nintendo, 1989",
    biosRequired: false,
    acceptExtensions: [".gb"],
    group: "nintendo-handheld",
  },
  {
    slug: "gbc",
    coreSlug: "gb",
    label: "Game Boy Color",
    manufacturer: "Nintendo, 1998",
    biosRequired: false,
    acceptExtensions: [".gbc"],
    group: "nintendo-handheld",
  },
  {
    slug: "gba",
    coreSlug: "gba",
    label: "Game Boy Advance",
    manufacturer: "Nintendo, 2001",
    biosRequired: false,
    acceptExtensions: [".gba"],
    group: "nintendo-handheld",
  },
  {
    slug: "nds",
    coreSlug: "nds",
    label: "Nintendo DS",
    manufacturer: "Nintendo, 2004",
    biosRequired: false,
    acceptExtensions: [".nds"],
    group: "nintendo-handheld",
  },

  // Sega
  {
    slug: "segamd",
    coreSlug: "segaMD",
    label: "Mega Drive / Genesis",
    manufacturer: "Sega, 1988",
    biosRequired: false,
    acceptExtensions: [".md", ".gen", ".smd", ".bin"],
    group: "sega",
  },
  {
    slug: "segams",
    coreSlug: "segaMS",
    label: "Master System",
    manufacturer: "Sega, 1985",
    biosRequired: false,
    acceptExtensions: [".sms"],
    group: "sega",
  },
  {
    slug: "segagg",
    coreSlug: "segaGG",
    label: "Game Gear",
    manufacturer: "Sega, 1990",
    biosRequired: false,
    acceptExtensions: [".gg"],
    group: "sega",
  },
  {
    slug: "segacd",
    coreSlug: "segaCD",
    label: "Sega CD / Mega-CD",
    manufacturer: "Sega, 1991",
    biosRequired: true,
    acceptExtensions: [".bin", ".cue", ".iso", ".chd"],
    group: "sega",
  },
  {
    slug: "sega32x",
    coreSlug: "sega32x",
    label: "Sega 32X",
    manufacturer: "Sega, 1994",
    biosRequired: false,
    acceptExtensions: [".32x", ".bin"],
    group: "sega",
  },
  {
    slug: "segasaturn",
    coreSlug: "segaSaturn",
    label: "Sega Saturn",
    manufacturer: "Sega, 1994",
    biosRequired: true,
    acceptExtensions: [".bin", ".cue", ".iso", ".chd"],
    group: "sega",
  },

  // Sony
  {
    slug: "psx",
    coreSlug: "psx",
    label: "PlayStation",
    manufacturer: "Sony, 1994",
    biosRequired: true,
    acceptExtensions: [".bin", ".cue", ".iso", ".chd", ".pbp"],
    group: "sony",
  },

  // Atari
  {
    slug: "atari2600",
    coreSlug: "atari2600",
    label: "Atari 2600",
    manufacturer: "Atari, 1977",
    biosRequired: false,
    acceptExtensions: [".a26", ".bin"],
    group: "atari",
  },
  {
    slug: "atari5200",
    coreSlug: "atari5200",
    label: "Atari 5200",
    manufacturer: "Atari, 1982",
    biosRequired: true,
    acceptExtensions: [".a52", ".bin"],
    group: "atari",
  },
  {
    slug: "atari7800",
    coreSlug: "atari7800",
    label: "Atari 7800",
    manufacturer: "Atari, 1986",
    biosRequired: false,
    acceptExtensions: [".a78", ".bin"],
    group: "atari",
  },
  {
    slug: "lynx",
    coreSlug: "lynx",
    label: "Atari Lynx",
    manufacturer: "Atari, 1989",
    biosRequired: true,
    acceptExtensions: [".lnx", ".lyx"],
    group: "atari",
  },
  {
    slug: "jaguar",
    coreSlug: "jaguar",
    label: "Atari Jaguar",
    manufacturer: "Atari, 1993",
    biosRequired: false,
    acceptExtensions: [".j64", ".jag"],
    group: "atari",
  },

  // Arcade + other
  {
    slug: "arcade",
    coreSlug: "arcade",
    label: "Arcade (MAME 2003-plus)",
    manufacturer: "Various, 1970s onwards",
    biosRequired: false,
    acceptExtensions: [".zip"],
    group: "arcade",
  },
  {
    slug: "3do",
    coreSlug: "3do",
    label: "3DO",
    manufacturer: "Panasonic / Goldstar / Sanyo, 1993",
    biosRequired: true,
    acceptExtensions: [".bin", ".cue", ".iso", ".chd"],
    group: "other",
  },
  {
    slug: "colecovision",
    coreSlug: "coleco",
    label: "ColecoVision",
    manufacturer: "Coleco, 1982",
    biosRequired: true,
    acceptExtensions: [".col"],
    group: "other",
  },
  {
    slug: "pce",
    coreSlug: "pce",
    label: "TurboGrafx-16 / PC Engine",
    manufacturer: "NEC, 1987",
    biosRequired: false,
    acceptExtensions: [".pce"],
    group: "other",
  },
];

export function getSystem(slug: string): EmulatorSystem | undefined {
  return SYSTEMS.find((s) => s.slug === slug);
}

export function systemsByGroup(): Record<EmulatorSystem["group"], EmulatorSystem[]> {
  return SYSTEMS.reduce(
    (acc, s) => {
      (acc[s.group] ||= []).push(s);
      return acc;
    },
    {} as Record<EmulatorSystem["group"], EmulatorSystem[]>,
  );
}

export const GROUP_LABELS: Record<EmulatorSystem["group"], string> = {
  "nintendo-home": "Nintendo (home consoles)",
  "nintendo-handheld": "Nintendo (handhelds)",
  sega: "Sega",
  sony: "Sony",
  atari: "Atari",
  arcade: "Arcade",
  computer: "Home computers",
  other: "Other",
};
