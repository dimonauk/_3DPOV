import { entry as buildingAPovLedRigEntry } from "components/tutorials/entries/building-a-pov-led-rig";
import { entry as calibratingTheImageprografPro1100Entry } from "components/tutorials/entries/calibrating-the-imageprograf-pro-1100";
import { entry as editioningASingleExposureEntry } from "components/tutorials/entries/editioning-a-single-exposure";
import { entry as from360ToSplatEntry } from "components/tutorials/entries/from-360-to-splat";
import { entry as fromJamcamToMeshEntry } from "components/tutorials/entries/from-jamcam-to-mesh";
import { entry as fromPhotographToObjectEntry } from "components/tutorials/entries/from-photograph-to-object";
import { entry as lightingAWaveguideObjectEntry } from "components/tutorials/entries/lighting-a-waveguide-object";
import { entry as programmingPovFramesEntry } from "components/tutorials/entries/programming-pov-frames";
import { entry as spinningFirePoiSafelyEntry } from "components/tutorials/entries/spinning-fire-poi-safely";
import { entry as yourFirstLongExposureEntry } from "components/tutorials/entries/your-first-long-exposure";
import { Entry, sortByDateDescending } from "./writing";

const ENTRIES: Entry[] = [
  yourFirstLongExposureEntry,
  buildingAPovLedRigEntry,
  fromPhotographToObjectEntry,
  spinningFirePoiSafelyEntry,
  programmingPovFramesEntry,
  lightingAWaveguideObjectEntry,
  calibratingTheImageprografPro1100Entry,
  from360ToSplatEntry,
  fromJamcamToMeshEntry,
  editioningASingleExposureEntry,
];

export const tutorials: Entry[] = sortByDateDescending(ENTRIES);

export function getTutorial(slug: string): Entry | undefined {
  return tutorials.find((e) => e.slug === slug);
}
