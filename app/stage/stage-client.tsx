"use client";

/**
 * app/stage/stage-client.tsx — root client component for /stage.
 *
 * Reads the `?room=<slug>` URL parameter, looks up the matching room
 * config from lib/stage/rooms.ts, and hands it to <Stage>. Renders a
 * small room-picker overlay and an XR enter button.
 *
 * This page is the reference surface for the Stage infrastructure —
 * the simplest possible composition of the primitives. Real surfaces
 * (a HoloWalk sculpture viewer, a per-card backdrop, the Aura chat
 * mount) will all instantiate <Stage room={...}> with their own
 * RoomConfig and skip this page's chrome entirely.
 */

import { use, useMemo, useState } from "react";

import { Stage } from "components/stage/Stage";
import { getRoom, ROOM_SLUGS, ROOMS } from "lib/stage/rooms";

type Props = {
  searchParamsPromise: Promise<{ room?: string }>;
};

export default function StageClient({ searchParamsPromise }: Props) {
  // Next 15: searchParams arrives as a Promise even on Client Component
  // pages. React.use() unwraps it without triggering the dynamic-API
  // enumeration warning that fires when you read .room directly.
  const sp = use(searchParamsPromise);
  const initialSlug = sp.room ?? "studio";

  const [slug, setSlug] = useState<string>(initialSlug);
  const room = useMemo(() => getRoom(slug), [slug]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-warm-black-950 text-chrome-200">
      <Stage room={room} xr className="absolute inset-0" />

      {/* Header — title + room picker (HTML, on top of the Canvas) */}
      <header className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-sm border border-warm-black-700 bg-warm-black-900/70 px-3 py-1.5 font-mono text-[0.6rem] text-chrome-200 backdrop-blur-sm">
            HOLOFLOW STAGE
          </div>
          <RoomPicker slug={slug} onSelect={setSlug} />
        </div>
        <div className="rounded-sm border border-warm-black-700 bg-warm-black-900/70 px-3 py-1.5 font-mono text-[0.6rem] text-chrome-300 backdrop-blur-sm">
          {room.name}
        </div>
      </header>

      {/* Footer — tip text */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 text-[0.6rem]">
        <span className="rounded-sm border border-warm-black-800 bg-warm-black-900/60 px-2 py-1 font-mono text-chrome-500 backdrop-blur-sm">
          drag to orbit · scroll to zoom · enter VR to step inside
        </span>
        <span className="rounded-sm border border-warm-black-800 bg-warm-black-900/60 px-2 py-1 font-mono text-chrome-500 backdrop-blur-sm">
          {room.avatar?.url ?? "no avatar"}
        </span>
      </footer>
    </main>
  );
}

function RoomPicker({
  slug,
  onSelect,
}: {
  slug: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-1 rounded-sm border border-warm-black-700 bg-warm-black-900/70 p-1 backdrop-blur-sm"
      role="group"
      aria-label="Stage room"
    >
      {ROOM_SLUGS.map((s) => {
        const name = ROOMS[s]!.name;
        const isCurrent = slug === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onSelect(s)}
            className={
              isCurrent
                ? "rounded-sm bg-pink-200/20 px-2 py-1 font-mono text-[0.6rem] text-pink-100"
                : "rounded-sm px-2 py-1 font-mono text-[0.6rem] text-chrome-400 hover:text-chrome-200"
            }
            title={name}
            aria-label={`Switch to ${name} room`}
            aria-current={isCurrent ? "page" : undefined}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
