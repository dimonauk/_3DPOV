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
import { entry as emulatorTutorialRetroarchEntry } from "components/tutorials/entries/emulator-tutorial-retroarch";
import { entry as emulatorTutorialMesenEntry } from "components/tutorials/entries/emulator-tutorial-mesen";
import { entry as emulatorTutorialDolphinEntry } from "components/tutorials/entries/emulator-tutorial-dolphin";
import { entry as emulatorTutorialMameEntry } from "components/tutorials/entries/emulator-tutorial-mame";
import { entry as emulatorTutorialPcsx2Entry } from "components/tutorials/entries/emulator-tutorial-pcsx2";
import { entry as emulatorTutorialDosboxXEntry } from "components/tutorials/entries/emulator-tutorial-dosbox-x";
import { entry as instructableDemoEntry } from "components/tutorials/entries/instructable-demo";
import { entry as tutorialDragonScaleWallReliefEntry } from "components/tutorials/entries/tutorial-dragon-scale-wall-relief";
import { Entry, sortByDateDescending } from "./writing";

const ENTRIES: Entry[] = [
  emulatorTutorialRetroarchEntry,
  emulatorTutorialMesenEntry,
  emulatorTutorialDolphinEntry,
  emulatorTutorialMameEntry,
  emulatorTutorialPcsx2Entry,
  emulatorTutorialDosboxXEntry,
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
  instructableDemoEntry,
  tutorialDragonScaleWallReliefEntry,
];

export const tutorials: Entry[] = sortByDateDescending(ENTRIES);

export function getTutorial(slug: string): Entry | undefined {
  return tutorials.find((e) => e.slug === slug);
}
