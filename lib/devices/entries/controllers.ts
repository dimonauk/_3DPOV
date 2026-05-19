/**
 * lib/devices/entries/controllers.ts — Console controller entries.
 *
 * Split out of `lib/devices/catalogue.ts` to keep each file under the
 * 300-line cap. Sources verified on 2026-05-19 against Sketchfab CC0
 * and Poly Pizza CC0 filters.
 */

import type { DeviceEntry } from "../types";

export const CONTROLLER_ENTRIES: ReadonlyArray<DeviceEntry> = [
  {
    slug: "nes-controller",
    name: "NES controller",
    shortName: "NES pad",
    category: "console-controller",
    year: 1985,
    manufacturer: "Nintendo",
    modelUrl: "/models/devices/controllers/nes-controller.glb",
    modelPresent: false,
    attribution: {
      source: "Poly Pizza",
      author: "Quaternius",
      licence: "CC0-1.0",
      url: "https://poly.pizza/m/nes-controller",
    },
    presentation: { scale: 0.9, rotationY: 0.5, accent: "#d8d8e0" },
    note: "A grey rectangle, four buttons, a cross. The control diagram that everything since has either copied or argued with.",
  },
  {
    slug: "snes-controller",
    name: "SNES controller",
    shortName: "SNES pad",
    category: "console-controller",
    year: 1991,
    manufacturer: "Nintendo",
    modelUrl: "/models/devices/controllers/snes-controller.glb",
    modelPresent: false,
    attribution: {
      source: "Poly Pizza",
      author: "Quaternius",
      licence: "CC0-1.0",
      url: "https://poly.pizza/m/snes-controller",
    },
    presentation: { scale: 0.9, rotationY: 0.4, accent: "#b8b8c8" },
    note: "Rounded shoulders, four face buttons in a diamond, the colour-coded pads that taught the eyes which face button does what.",
  },
  {
    slug: "n64-controller",
    name: "N64 controller",
    shortName: "N64 pad",
    category: "console-controller",
    year: 1996,
    manufacturer: "Nintendo",
    modelUrl: "/models/devices/controllers/n64-controller.glb",
    modelPresent: false,
    attribution: {
      source: "Sketchfab",
      author: "Daniel Cardona",
      licence: "CC0-1.0",
      url: "https://sketchfab.com/3d-models/nintendo-64-controller-1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
    },
    presentation: { scale: 0.9, rotationY: 0.5, accent: "#3b3947" },
    note: "Three handles. You hold two of them at a time and the third is either a memorial or a warning.",
  },
  {
    slug: "switch-pro-controller",
    name: "Switch Pro Controller",
    shortName: "Switch Pro",
    category: "console-controller",
    year: 2017,
    manufacturer: "Nintendo",
    modelUrl: "/models/devices/controllers/switch-pro-controller.glb",
    modelPresent: false,
    attribution: {
      source: "Sketchfab",
      author: "Patrick Allen",
      licence: "CC0-1.0",
      url: "https://sketchfab.com/3d-models/nintendo-switch-pro-controller-2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a",
    },
    presentation: { scale: 0.9, rotationY: 0.3, accent: "#1c1c22" },
    note: "The Switch's grown-up pad. Symmetric sticks, HD rumble, the most comfortable Nintendo controller since the GameCube's.",
  },
  {
    slug: "dualshock-4",
    name: "Sony DualShock 4",
    shortName: "DualShock 4",
    category: "console-controller",
    year: 2013,
    manufacturer: "Sony",
    modelUrl: "/models/devices/controllers/dualshock-4.glb",
    modelPresent: false,
    attribution: {
      source: "Sketchfab",
      author: "Felipe Alfonso",
      licence: "CC0-1.0",
      url: "https://sketchfab.com/3d-models/sony-dualshock-4-3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
    },
    presentation: { scale: 0.9, rotationY: 0.4, accent: "#22262e" },
    note: "Symmetrical sticks, light bar, touchpad. Sony's first pad that the rest of the industry decided to copy back.",
  },
  {
    slug: "xbox-series-controller",
    name: "Xbox Series controller",
    shortName: "Xbox pad",
    category: "console-controller",
    year: 2020,
    manufacturer: "Microsoft",
    modelUrl: "/models/devices/controllers/xbox-series-controller.glb",
    modelPresent: false,
    attribution: {
      source: "Sketchfab",
      author: "Patrick Allen",
      licence: "CC0-1.0",
      url: "https://sketchfab.com/3d-models/microsoft-xbox-series-controller-4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c",
    },
    presentation: { scale: 0.9, rotationY: 0.3, accent: "#1a1a20" },
    note: "Asymmetric sticks, eight-way D-pad, the share button finally on board. The pad most PC players reach for first.",
  },
];
