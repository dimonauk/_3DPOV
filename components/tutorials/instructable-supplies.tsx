/**
 * instructable-supplies.tsx — Supplies, software, and dependencies bands.
 */
import type {
  InstructableDependency, InstructableSoftware, InstructableSupplies,
  InstructableSupply, InstructableSupplier,
} from "lib/tutorials/types";

export function SuppliesBand({ supplies, bomDownloadHref }: { supplies: InstructableSupplies; bomDownloadHref?: string }) {
  return (
    <div className="instructable__band">
      <h2 className="instructable__band-title">Approved supplies</h2>
      <div className="instructable__supplies">
        {supplies.materials && supplies.materials.length > 0 && <SupplyList title="Approved materials"    items={supplies.materials} />}
        {supplies.tools      && supplies.tools.length      > 0 && <SupplyList title="Approved tools"       items={supplies.tools}     />}
        {supplies.provisions && supplies.provisions.length > 0 && <SupplyList title="Provisions (optional)" items={supplies.provisions} />}
      </div>
      {bomDownloadHref && (
        <div className="instructable__bom">
          <a href={bomDownloadHref} className="instructable__bom-link" download>Download bill of materials (.csv)</a>
          <span className="instructable__bom-note">One row per supplier; materials, tools, provisions, software, dependencies.</span>
        </div>
      )}
    </div>
  );
}

function SupplyList({ title, items }: { title: string; items: InstructableSupply[] }) {
  return (
    <div>
      <h3 className="instructable__supply-list-title">{title}</h3>
      <ul className="instructable__supply-list">
        {items.map((item, i) => <SupplyItem key={i} item={item} />)}
      </ul>
    </div>
  );
}

function SupplyItem({ item }: { item: InstructableSupply }) {
  const nameNode = item.url
    ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="instructable__supply-link">{item.name}</a>
    : <span>{item.name}</span>;
  return (
    <li className="instructable__supply">
      <span>
        {nameNode}
        {item.quantity  && <span className="instructable__supply-quantity"> · {item.quantity}</span>}
        {item.isOptional && <span className="instructable__supply-optional">optional</span>}
        {item.note       && <span className="instructable__supply-note"> — {item.note}</span>}
      </span>
      {item.suppliers && item.suppliers.length > 0 && (
        <ul className="instructable__suppliers">
          {item.suppliers.map((s, i) => <SupplierRow key={i} supplier={s} />)}
        </ul>
      )}
    </li>
  );
}

function SupplierRow({ supplier }: { supplier: InstructableSupplier }) {
  return (
    <li className="instructable__supplier">
      <a href={supplier.url} target="_blank" rel="noopener noreferrer" className="instructable__supplier-link">{supplier.name}</a>
      {supplier.sku   && <span className="instructable__supplier-sku"> · {supplier.sku}</span>}
      {supplier.price && <span className="instructable__supplier-price"> · {supplier.price}</span>}
    </li>
  );
}

export function SoftwareBand({ items }: { items: InstructableSoftware[] }) {
  return (
    <div className="instructable__band">
      <h2 className="instructable__band-title">Software the aspirant installs first</h2>
      <ul className="instructable__software">
        {items.map((s, i) => (
          <li key={i} className="instructable__software-item">
            <div className="instructable__software-head">
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="instructable__software-link">{s.name}</a>
              {s.version && <span className="instructable__software-version"> · {s.version}</span>}
              {s.cost    && <span className="instructable__software-cost"> · {s.cost}</span>}
            </div>
            {s.platforms && s.platforms.length > 0 && <div className="instructable__software-platforms">{s.platforms.join(" / ")}</div>}
            {s.note && <p className="instructable__software-note">{s.note}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DependenciesBand({ items }: { items: InstructableDependency[] }) {
  return (
    <div className="instructable__band">
      <h2 className="instructable__band-title">Dependencies</h2>
      <ul className="instructable__deps">
        {items.map((d, i) => (
          <li key={i} className="instructable__dep">
            {d.url ? <a href={d.url} target="_blank" rel="noopener noreferrer" className="instructable__dep-link"><code>{d.name}</code></a> : <code>{d.name}</code>}
            {d.version && <span className="instructable__dep-version"> @ <code>{d.version}</code></span>}
            <span className="instructable__dep-registry"> · {d.registry ?? "package"}</span>
            {d.purpose && <span className="instructable__dep-purpose"> — {d.purpose}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
