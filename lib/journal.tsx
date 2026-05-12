import FirstLight from "components/journal/entries/first-light";
import OnTheApparatus from "components/journal/entries/on-the-apparatus";
import TheQuestionTheCameraAnswered from "components/journal/entries/the-question-the-camera-answered";
import { Entry, sortByDateDescending } from "./writing";

const ENTRIES: Entry[] = [
  {
    slug: "first-light",
    title: "First Light",
    date: "2026-05-12",
    kind: "journal",
    excerpt:
      "First flight of the LED-modified airframes. The platform is flying; the technique is not consistent yet.",
    Body: FirstLight,
  },
  {
    slug: "on-the-apparatus",
    title: "On the Apparatus",
    date: "2026-05-10",
    kind: "journal",
    excerpt:
      "A working set, not a portfolio. The kit currently on the bench, in the workshop, and in the air.",
    Body: OnTheApparatus,
  },
  {
    slug: "the-question-the-camera-answered",
    title: "The Question the Camera Answered",
    date: "2026-05-05",
    kind: "journal",
    excerpt:
      "Twelve years in. On how a long exposure made the gesture visible to everyone — and what the studio became next.",
    Body: TheQuestionTheCameraAnswered,
  },
];

export const journal: Entry[] = sortByDateDescending(ENTRIES);

export function getJournalEntry(slug: string): Entry | undefined {
  return journal.find((e) => e.slug === slug);
}
