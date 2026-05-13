/**
 * lib/evolution/stations.ts — The 14-station evolution suite, as a
 * typed data file.
 *
 * Source: D:\The_Hangar\Dolly_OS\src\components\evolution\. The
 * Hangar codebase has 18 numbered stations; this catalogue tracks the
 * 14 the studio addresses by name on the public site. The remaining
 * four (S1 Species Labs, S3 Evolution Chamber, S8 Manufacturing
 * Bridge, S9 Export Studio, S11 Fabrication Suite) live on the bench
 * and aren't surfaced here.
 *
 * The numbers are not sequential because the Hangar codebase reserves
 * IDs for stations that may or may not graduate; the studio publishes
 * the working subset.
 */

export type EvolutionStationKind =
  | "ingress" // signal in
  | "breeding" // genome operations
  | "fitness" // scoring / selection
  | "studio" // manual sculpting
  | "narrative" // story / culture
  | "archive" // persistence
  | "physics" // optics / fabrication
  | "live" // installation / performance
  | "hub" // routing
  | "gardener"; // culling / mosaic

export type EvolutionStation = {
  /** Hangar station number — e.g. "S0", "S6", "S14". Not strictly sequential. */
  id: string;
  /** Numeric value for sort + diagram positioning. */
  order: number;
  /** Human-readable name. */
  name: string;
  /** Hangar source filename. */
  sourceFile: string;
  /** Functional category. */
  kind: EvolutionStationKind;
  /** One-sentence purpose. */
  purpose: string;
  /** Stations this one typically feeds into. */
  feedsInto: string[];
};

export const evolutionStations: EvolutionStation[] = [
  {
    id: "S0",
    order: 0,
    name: "Performance Gateway",
    sourceFile: "S0_PerformanceGateway.tsx",
    kind: "ingress",
    purpose:
      "The capture stage. A live gesture, a photograph, or a sequencer recording enters the suite here; the gateway turns the signal into a starting genome.",
    feedsInto: ["S2", "S5"],
  },
  {
    id: "S2",
    order: 2,
    name: "Crossbreeding",
    sourceFile: "breeding/S2_Crossbreeding.tsx",
    kind: "breeding",
    purpose:
      "Genome operations. Uniform crossover between two parents, Gaussian mutation, optional LLM-advisor suggestion. The genetic-algorithm engine room.",
    feedsInto: ["S4", "S12"],
  },
  {
    id: "S4",
    order: 4,
    name: "Fitness Arena",
    sourceFile: "fitness/S4_FitnessArena.tsx",
    kind: "fitness",
    purpose:
      "Scoring + tournament selection. Each candidate is scored on the kingdom-specific fitness function; the top survivors return upstream for further breeding.",
    feedsInto: ["S2", "S7"],
  },
  {
    id: "S5",
    order: 5,
    name: "Freeform Lab",
    sourceFile: "sculptor/S5_FreeformLab.tsx",
    kind: "studio",
    purpose:
      "Manual sculpting. The studio overrides the engine here &mdash; pulling vertices, painting genes, breaking the rules the breeder follows.",
    feedsInto: ["S7"],
  },
  {
    id: "S6N",
    order: 6,
    name: "Narrative Lab",
    sourceFile: "S6_NarrativeLab.tsx",
    kind: "narrative",
    purpose:
      "Biographical geometry. A specimen is annotated with the story of its lineage: parent genomes, mutation history, commission notes, cultural origin.",
    feedsInto: ["S7", "S14"],
  },
  {
    id: "S6F",
    order: 6.5,
    name: "Megalith Forge",
    sourceFile: "forge/S6_MegalithForge.tsx",
    kind: "studio",
    purpose:
      "Architectural-scale forging. Specimens are scaled up to building geometry; the same genome the bench prints at 25 mm can be deployed at five metres.",
    feedsInto: ["S11"],
  },
  {
    id: "S7",
    order: 7,
    name: "Vault Explorer",
    sourceFile: "vault/S7_VaultExplorer.tsx",
    kind: "archive",
    purpose:
      "Circular archive. Every saved genome is browseable by lineage, kingdom, fitness, or commission. The studio's persistent memory of what the engine has accepted.",
    feedsInto: ["S15"],
  },
  {
    id: "S10",
    order: 10,
    name: "Waveguide Optics",
    sourceFile: "optics/S10_WaveguideOptics.tsx",
    kind: "physics",
    purpose:
      "Total-internal-reflection simulation. Candidate meshes are evaluated for waveguide performance &mdash; the optical fitness the kingdom uses for diffuse-glow pendants.",
    feedsInto: ["S4"],
  },
  {
    id: "S12",
    order: 12,
    name: "Morphogenetic Crucible",
    sourceFile: "crucible/S12_MorphogeneticCrucible.tsx",
    kind: "breeding",
    purpose:
      "Barycentric blend between three or more parents. The high-dimensional cousin of S2; the operator paints the blend weights and the crucible interpolates.",
    feedsInto: ["S4"],
  },
  {
    id: "S14",
    order: 14,
    name: "Live Installation",
    sourceFile: "S14_LiveInstallation.tsx",
    kind: "live",
    purpose:
      "Auto-evolving arena for public installation. The engine runs continuously, audience response is the fitness function, the gallery becomes a selection chamber.",
    feedsInto: ["S15"],
  },
  {
    id: "S15",
    order: 15,
    name: "Genome Archive",
    sourceFile: "S15_GenomeArchive.tsx",
    kind: "archive",
    purpose:
      "Searchable phylogeny. Specimens, lineages, generation graphs; the database the studio uses to ask which genome had which ancestor.",
    feedsInto: ["S18"],
  },
  {
    id: "S17",
    order: 17,
    name: "HoloFlow Hub",
    sourceFile: "S17_HoloFlow_Hub.tsx",
    kind: "hub",
    purpose:
      "Central command. The router that addresses any other station by name; status indicators for the population, the queue, the GPU.",
    feedsInto: ["S0", "S2", "S4", "S5", "S7", "S10", "S12", "S14", "S15"],
  },
  {
    id: "S18",
    order: 18,
    name: "Mosaic Wall",
    sourceFile: "mosaic/S18_MosaicWall.tsx",
    kind: "gardener",
    purpose:
      "7&times;7 grid view of the current population. The vintage genetic-art idiom &mdash; many small thumbnails the operator clicks to promote or kill.",
    feedsInto: ["S19"],
  },
  {
    id: "S19",
    order: 19,
    name: "Morphological Gardener",
    sourceFile: "S19_MorphoGardener.tsx",
    kind: "gardener",
    purpose:
      "144-cell culling array. The largest mosaic in the suite; mass selection across a generation at once.",
    feedsInto: ["S4"],
  },
];

export function getStation(id: string): EvolutionStation | undefined {
  return evolutionStations.find((s) => s.id === id);
}

export const stationKindColours: Record<EvolutionStationKind, string> = {
  ingress: "#ff69b4",
  breeding: "#00ffff",
  fitness: "#ffd700",
  studio: "#e6e6fa",
  narrative: "#4b0082",
  archive: "#008080",
  physics: "#00ff7f",
  live: "#ff4500",
  hub: "#ffffff",
  gardener: "#cd853f",
};
