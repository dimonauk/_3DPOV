import { useMemo, useState } from "react";

import { STATIC_INVENTORY } from "../inventory-data";

export function GalleryTab() {
  const [filter, setFilter] = useState("");
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return STATIC_INVENTORY;
    return STATIC_INVENTORY.map((g) => ({
      ...g,
      items: g.items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.what.toLowerCase().includes(q) ||
          i.path.toLowerCase().includes(q),
      ),
    })).filter((g) => g.items.length > 0);
  }, [filter]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl text-chrome-100">Hangar inventory</h2>
          <p className="mt-2 max-w-2xl text-sm text-chrome-400">
            Every tool installed on the bench, categorised. The paths
            are local to the studio rig; useful if you&rsquo;ve cloned
            the same monorepo and want to find where a tool lives.
          </p>
        </div>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="filter…"
          className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-xs text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200/60 focus:outline-none md:w-64"
        />
      </header>

      {filtered.map((group) => (
        <section key={group.category}>
          <h3 className="chrome-label mb-3 border-b border-warm-black-800 pb-2 text-chrome-400">
            {group.category}
          </h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {group.items.map((item) => (
              <div
                key={item.path}
                className="rounded-sm border border-warm-black-800 bg-warm-black-900/60 p-3"
              >
                <div className="text-sm text-chrome-100">{item.name}</div>
                <div className="mt-1 text-xs text-chrome-400">{item.what}</div>
                <div className="mt-1.5 truncate font-mono text-[10px] text-chrome-500">
                  {item.path}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
