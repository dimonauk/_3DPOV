import {
  kataMoves,
  getLabanCorner,
  type KataMove,
} from "lib/assets/flow-arts";
import UsedIn from "components/atelier/used-in";

function MoveRow({ move }: { move: KataMove }) {
  const corner = getLabanCorner(move.labanEffort);
  return (
    <li className="border-b border-warm-black-800/60 py-3 last:border-b-0">
      <div className="grid grid-cols-[1fr_auto] gap-3 md:grid-cols-[1.5fr_3fr_auto]">
        <div>
          <h4 className="text-chrome-100">{move.name}</h4>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-chrome-500">
            {move.slug}
          </p>
        </div>
        <p className="hidden text-sm text-chrome-300 md:block">
          {move.notes}
        </p>
        <div className="flex items-center gap-2 self-start">
          {corner ? (
            <span
              className="inline-block h-3 w-3 rounded-full ring-1 ring-warm-black-700"
              style={{ backgroundColor: corner.hexColor }}
              aria-hidden
            />
          ) : null}
          <span className="font-mono text-xs text-chrome-300">
            {move.labanEffort}
          </span>
          <span className="font-mono text-xs text-chrome-500">
            {(move.durationMs / 1000).toFixed(1)}s
          </span>
        </div>
      </div>
      <UsedIn kind="kata-move" slug={move.slug} />
    </li>
  );
}

export default function KataMoveList() {
  return (
    <ul className="border-y border-warm-black-800">
      {kataMoves.map((move) => (
        <MoveRow key={move.slug} move={move} />
      ))}
    </ul>
  );
}
