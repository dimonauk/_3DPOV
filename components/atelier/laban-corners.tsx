import { labanCorners } from "lib/assets/flow-arts";

export default function LabanCorners() {
  return (
    <div className="overflow-x-auto rounded-sm border border-warm-black-800">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-[0.65rem] uppercase tracking-[0.2em] text-chrome-500">
            <th className="border-b border-warm-black-800 px-3 py-3"></th>
            <th className="border-b border-warm-black-800 px-3 py-3">
              Effort
            </th>
            <th className="border-b border-warm-black-800 px-3 py-3">
              Space
            </th>
            <th className="border-b border-warm-black-800 px-3 py-3">
              Weight
            </th>
            <th className="border-b border-warm-black-800 px-3 py-3">
              Time
            </th>
            <th className="border-b border-warm-black-800 px-3 py-3">
              Flow
            </th>
            <th className="border-b border-warm-black-800 px-3 py-3">
              Width
            </th>
          </tr>
        </thead>
        <tbody>
          {labanCorners.map((corner) => (
            <tr
              key={corner.name}
              className="border-b border-warm-black-800/60 last:border-b-0"
            >
              <td className="px-3 py-3">
                <span
                  className="inline-block h-4 w-4 rounded-full ring-1 ring-warm-black-700 align-middle"
                  style={{ backgroundColor: corner.hexColor }}
                  aria-hidden
                />
              </td>
              <td className="px-3 py-3 font-mono text-chrome-100">
                {corner.name}
              </td>
              <td className="px-3 py-3 text-chrome-300">
                {corner.space}
              </td>
              <td className="px-3 py-3 text-chrome-300">
                {corner.weight}
              </td>
              <td className="px-3 py-3 text-chrome-300">
                {corner.time}
              </td>
              <td className="px-3 py-3 text-chrome-300">
                {corner.flow}
              </td>
              <td className="px-3 py-3 font-mono text-chrome-400">
                {corner.trailWidth.toFixed(3)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
