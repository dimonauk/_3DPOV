/**
 * app/atelier/dollhouse/dollhouse/bible.ts — Inlined subset of the
 * doll-character bible: characters + their wardrobes, action verbs,
 * rooms with lighting, aesthetic modes (Toycore / Real world / Noir),
 * shot framings, and the shared cinematic style block appended to
 * every prompt.
 *
 * Original lived in `D:/The_Hangar/apps/prototypes/dollhouse-1/
 * data/dollData.ts`. Extracted from dollhouse-client.tsx per
 * ARCHITECTURE.md Rule 1.
 */

export type Character = {
  id: string;
  name: string;
  archetype: string;
  subject: string; // The visual descriptor that goes into the prompt.
  wardrobe: string[];
};

export const CHARACTERS: Character[] = [
  {
    id: "DOLLY",
    name: "Dolly Peterson",
    archetype: "The Iron Butterfly",
    subject:
      "Miss Bears, a vintage vinyl fashion doll with glossy pink hair, articulation joints visible, beehive hairdo",
    wardrobe: [
      "Baby Blue Organza Dress",
      "Pink Angora Cardigan",
      "Black Funeral Dress",
      "Tactical Turtleneck",
    ],
  },
  {
    id: "THEO",
    name: "Mayor Theodore 'Jim' Bear",
    archetype: "The Anchor",
    subject:
      "Mayor Theo, a large stuffed teddy bear in formal civic dress, soft mohair fur, hand-stitched eyes",
    wardrobe: [
      "Red Velvet Waistcoat",
      "Mayor Sash",
      "Tweed Jacket with Patches",
      "Pajamas",
    ],
  },
  {
    id: "K17",
    name: "Unit K-17 'Kit'",
    archetype: "The Architect",
    subject:
      "Unit K-17, a small porcelain-shelled robotic kitten with exposed wire braid and faintly glowing optics",
    wardrobe: [
      "Good Girl Pinafore",
      "Naked Chassis",
      "Cyber-Goth Mesh",
      "Disguise Kit",
    ],
  },
];

export type Action = { id: string; label: string; promptSuffix: string };

export const ACTIONS: Action[] = [
  {
    id: "act_01",
    label: "Maintains perimeter (gardening)",
    promptSuffix:
      "holding gardening shears, aggressively pruning a rose bush",
  },
  {
    id: "act_02",
    label: "Scans for entropy (cleaning)",
    promptSuffix:
      "holding a feather duster like a baton, scanning the room intensely",
  },
  {
    id: "act_03",
    label: "Serves tea (de-escalation)",
    promptSuffix:
      "holding a silver tea tray with perfect posture, smiling too widely",
  },
  {
    id: "act_04",
    label: "Constructs the Doll (engineering)",
    promptSuffix:
      "soldering a wire into a small wooden mannequin, focused expression",
  },
  {
    id: "act_05",
    label: "System purge (weeping)",
    promptSuffix: "sitting on the floor, head in hands, weeping silently",
  },
];

export type Room = {
  id: string;
  name: string;
  floor: string;
  lighting: string;
};

export const ROOMS: Room[] = [
  {
    id: "B1_01",
    name: "The Workshop (The Bridge)",
    floor: "Undercroft",
    lighting: "Filament Bulb, Industrial Glare",
  },
  {
    id: "L01_02",
    name: "The Living Room (The Kill Box)",
    floor: "Stage",
    lighting: "Golden Hour Sunbeams, Dust Motes",
  },
  {
    id: "L01_04",
    name: "The Kitchen (The Lab)",
    floor: "Stage",
    lighting: "Fluorescent Strip, Sterile",
  },
  {
    id: "L02_01",
    name: "Master Bedroom (Cyber-Boudoir)",
    floor: "Quarters",
    lighting: "Neon Pink/Blue, LED Strips",
  },
];

export type Mode = {
  id: "texture" | "optical" | "kinetic";
  name: string;
  base: string;
  neg: string;
};

export const MODES: Mode[] = [
  {
    id: "texture",
    name: "Toycore — texture fidelity",
    base: "A photorealistic macro close-up. Visible mold lines, fingerprints on glossy surfaces, uneven mohair fur. Tactile fabric textures.",
    neg: "smooth cgi, cartoon, illustration, drawing",
  },
  {
    id: "optical",
    name: "Real world — optical physics",
    base: "Cinematic medium shot. Tilt-shift photography effect to emphasize scale. Chromatic aberration, dust motes floating in air. Sharp focus on eyes, blurred ears.",
    neg: "flat focus, digital art, vector",
  },
  {
    id: "kinetic",
    name: "Noir — kinetic weight",
    base: "High-grain 35mm film stock, Technicolor Noir palette. Sharp shadows, single-source spotlighting. Psychological thriller atmosphere.",
    neg: "bright, cheerful, low contrast, digital clean",
  },
];

export type Shot = { id: string; label: string; prompt: string };

export const SHOTS: Shot[] = [
  {
    id: "wide",
    label: "Wide / establishing",
    prompt: "Cinematic wide angle establishing shot",
  },
  {
    id: "medium",
    label: "Medium / portrait",
    prompt: "Medium shot, waist up, standard portrait focal length",
  },
  {
    id: "closeup",
    label: "Close-up / detail",
    prompt: "Extreme close-up macro detail, shallow depth of field",
  },
  {
    id: "overhead",
    label: "God's eye (top down)",
    prompt: "Top-down overhead view, flat lay composition",
  },
  {
    id: "low",
    label: "Hero (low angle)",
    prompt: "Low angle looking up, imposing perspective, heroic framing",
  },
];

export const STYLE_BLOCK =
  "Shot on ARRI Alexa 65 with a 100mm Macro Lens, extremely shallow depth of field, soft bokeh. 1:6 Scale miniature world. Materials: Translucent Vinyl Skin with subsurface scattering, Synthetic Nylon Hair (high gloss), Dusty Mohair Fur. Photorealistic, 8k resolution, cinematic color grading --style raw";
