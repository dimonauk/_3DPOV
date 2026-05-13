# `studio-manchester.ts` — purpose twin

## Role

The first concrete entry in the print-vendor registry. A
plausible-but-mocked Salford drop-ship farm with six materials,
four scale bands, and four finish levels. The print-bar uses
this vendor as its default until the real partner contracts
land and the Stripe wave wires live partner APIs in.

## Public surface

- Default export `studioManchester: PrintVendor`.
- Material catalogue covers the three printable buckets named
  in the brief — resin (grey + clear), PLA, nylon — plus the
  premium edition path (sintered stainless + bronze).
- Scale bands match the brief vocabulary (palm / desktop /
  shelf / wall) with concrete millimetre bounds.

## Internal

- Prices are plausible v0.1 estimates: 0.18 £/cm³ for PLA up
  to 4.10 £/cm³ for sintered bronze, scaled by the scale-band
  multiplier (palm 1× → wall 14×). Finish surcharges are flat:
  raw 0, sanded £12, polished £38, painted £55.
- Lead time is 5 print-days + 2 ship-days, shipsFrom
  Manchester.
- Every finish × material combination is whitelisted explicitly
  in `material.finishes`; the bar filters dropdown options
  against that list to keep impossible quotes off-screen.

## Does not

- **Does not call any partner API.** v0.1 is hand-curated; the
  quote function computes purely from this table.
- **Does not list every material the studio could ever offer.**
  This is a minimum-viable bench: enough variety for the bar to
  feel real without claiming capabilities the studio cannot
  fulfil.
- **Does not encode tax.** The bar shows the gross piece price;
  VAT + shipping arrive at checkout (Stripe wave).

## Bordering files

- `_base.ts` — the typed contract this vendor satisfies.
- `index.ts` — the registry this file ships into.
- `lib/capabilities/commerce/print-order.ts` — the consumer.
