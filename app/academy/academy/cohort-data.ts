/**
 * app/academy/academy/cohort-data.ts — The six pastel students,
 * the three daily pairings, and the date-derived rotation index
 * for the Charming Academy cohort.
 *
 * Sourced from D:\The_Hangar\apps\charming-academy\
 * APP_ARCHITECTURE.md §02. Authored, not generated — these are
 * canon. Extracted from academy-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

export type CohortMember = {
  name: string;
  pastel: string;
  pastelSwatch: string; // tailwind-compatible HSL
  ocean: [number, number, number, number, number]; // O, C, E, A, N
  specialty: string;
  role: string;
};

export const COHORT: CohortMember[] = [
  {
    name: "Dolly",
    pastel: "Baby Pink",
    pastelSwatch: "#fbcfe8",
    ocean: [0.8, 0.5, 0.9, 0.9, 0.3],
    specialty: "Receptivity and warmth",
    role: "The heart — little sister and future store manager",
  },
  {
    name: "Bunny",
    pastel: "Powder Blue",
    pastelSwatch: "#bfdbfe",
    ocean: [0.4, 0.9, 0.3, 0.7, 0.2],
    specialty: "Stillness and observation",
    role: "The navigator",
  },
  {
    name: "Pip",
    pastel: "Butter Cream",
    pastelSwatch: "#fef3c7",
    ocean: [0.6, 0.6, 0.9, 0.8, 0.5],
    specialty: "Delight as discipline",
    role: "The spark",
  },
  {
    name: "Trixie",
    pastel: "Mint",
    pastelSwatch: "#bbf7d0",
    ocean: [0.3, 0.95, 0.4, 0.6, 0.2],
    specialty: "Posture and precision",
    role: "The instrument",
  },
  {
    name: "Boo",
    pastel: "Lavender",
    pastelSwatch: "#ddd6fe",
    ocean: [0.9, 0.5, 0.2, 0.7, 0.4],
    specialty: "Ritual and ceremony",
    role: "The archivist",
  },
  {
    name: "Tilly",
    pastel: "Peach",
    pastelSwatch: "#fed7aa",
    ocean: [0.7, 0.4, 0.85, 0.6, 0.6],
    specialty: "Wit and mischief",
    role: "The narrator",
  },
];

// Daily-pairing logic from APP_ARCHITECTURE.md §02. Rotates weekly;
// this static block is the canon — the live rotation would come from
// a date-derived index. For now we read today's pairing into the
// shell so the visitor sees the protocol in motion.

export const PAIRINGS: { pair: [string, string]; note: string }[] = [
  { pair: ["Bunny", "Pip"], note: "Cool stillness paired with warm delight." },
  {
    pair: ["Trixie", "Boo"],
    note: "Structural — precision walking with mystery.",
  },
  {
    pair: ["Tilly", "Dolly"],
    note: "Wit narrating the world for the little sister.",
  },
];

export function todaysPairingIndex(): number {
  // Monday=0..Sunday=6, then mod 3. Stable across the day; rotates
  // through the three pairs across the week.
  const day = new Date().getDay();
  return (((day + 6) % 7) % 3); // shift so Mon=0
}
