import YourFirstLongExposure from "components/tutorials/entries/your-first-long-exposure";
import { Entry, sortByDateDescending } from "./writing";

const ENTRIES: Entry[] = [
  {
    slug: "your-first-long-exposure",
    title: "Your First Long-Exposure Light Painting",
    date: "2026-05-06",
    kind: "tutorial",
    excerpt:
      "A beginner walkthrough. Camera, place, tool, frame, shutter, gesture. The first photograph is always the same.",
    Body: YourFirstLongExposure,
  },
];

export const tutorials: Entry[] = sortByDateDescending(ENTRIES);

export function getTutorial(slug: string): Entry | undefined {
  return tutorials.find((e) => e.slug === slug);
}
