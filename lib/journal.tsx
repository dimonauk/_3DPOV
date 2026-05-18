import { entry as elevenMammothsInThreeHoursEntry } from "components/journal/entries/eleven-mammoths-in-three-hours";
import { entry as fireOnTheOxoBeachEntry } from "components/journal/entries/fire-on-the-oxo-beach";
import { entry as firstLightEntry } from "components/journal/entries/first-light";
import { entry as leakeStreetEntry } from "components/journal/entries/leake-street";
import { entry as onTheApparatusEntry } from "components/journal/entries/on-the-apparatus";
import { entry as onTheBenchYearTenEntry } from "components/journal/entries/on-the-bench-year-ten";
import { entry as splatsFromTheCamerasOutsideEntry } from "components/journal/entries/splats-from-the-cameras-outside";
import { entry as theBenchInHttpsEntry } from "components/journal/entries/the-bench-in-https";
import { entry as theBusAtFourEntry } from "components/journal/entries/the-bus-at-four";
import { entry as theChainAtCanaryWharfEntry } from "components/journal/entries/the-chain-at-canary-wharf";
import { entry as theFirstWallArrayEntry } from "components/journal/entries/the-first-wall-array";
import { entry as theFleetUpdateMiniFiveProEntry } from "components/journal/entries/the-fleet-update-mini-five-pro";
import { entry as theNightTheCameraWasRightEntry } from "components/journal/entries/the-night-the-camera-was-right";
import { entry as theNightTheFontsCameBackEntry } from "components/journal/entries/the-night-the-fonts-came-back";
import { entry as theQuestionTheCameraAnsweredEntry } from "components/journal/entries/the-question-the-camera-answered";
import { entry as theWeekBeforeEntry } from "components/journal/entries/the-week-before";
import { entry as theYellowBridgeTimelapseEntry } from "components/journal/entries/the-yellow-bridge-timelapse";
import { entry as whyNightEntry } from "components/journal/entries/why-night";
import { entry as yearOneFireEntry } from "components/journal/entries/year-one-fire";
import { Entry, sortByDateDescending } from "./writing";

const ENTRIES: Entry[] = [
  theBusAtFourEntry,
  whyNightEntry,
  theChainAtCanaryWharfEntry,
  theYellowBridgeTimelapseEntry,
  leakeStreetEntry,
  fireOnTheOxoBeachEntry,
  firstLightEntry,
  onTheApparatusEntry,
  theQuestionTheCameraAnsweredEntry,
  theNightTheCameraWasRightEntry,
  onTheBenchYearTenEntry,
  yearOneFireEntry,
  theFirstWallArrayEntry,
  theFleetUpdateMiniFiveProEntry,
  theWeekBeforeEntry,
  elevenMammothsInThreeHoursEntry,
  theNightTheFontsCameBackEntry,
  splatsFromTheCamerasOutsideEntry,
  theBenchInHttpsEntry,
];

export const journal: Entry[] = sortByDateDescending(ENTRIES);

export function getJournalEntry(slug: string): Entry | undefined {
  return journal.find((e) => e.slug === slug);
}
