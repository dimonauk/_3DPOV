import { notFound } from "next/navigation";
import Link from "next/link";

import {
  getLocation,
  listLocations,
} from "lib/holo-walk/locations";
import ARWindowClient from "./ar-window-client";

export async function generateStaticParams() {
  return listLocations().map((l) => ({ id: l.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loc = getLocation(id);
  if (!loc) return { title: "Not found" };
  return {
    title: `${loc.name} — HoloWalk AR`,
    description: `Magic-window AR view of ${loc.name}. Stand at the spot, hold up your phone, watch the light-sculpture appear in place.`,
  };
}

export default async function HoloWalkARPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loc = getLocation(id);
  if (!loc) notFound();

  return (
    <main className="fixed inset-0 bg-warm-black-950">
      <ARWindowClient location={loc} />
      <Link
        href={`/holo-walk/${loc.id}`}
        className="pointer-events-auto fixed right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-warm-black-700 bg-warm-black-950/70 text-chrome-200 backdrop-blur hover:border-pink-200/60 hover:text-pink-200"
        aria-label="Exit AR and return to the sculpture page"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          &times;
        </span>
      </Link>
    </main>
  );
}
