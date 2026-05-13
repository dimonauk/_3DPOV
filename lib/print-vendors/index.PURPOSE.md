# `index.ts` — purpose twin

## Role

The print-vendor registry. One file, one record per partner +
helpers (`listVendors`, `getVendor`, `defaultVendorFor`). Stubs
for partners that are not yet registered hold `null` slots so
the literal-union of `PrintVendorId` stays the source of truth
and TypeScript catches any caller that asks for an unregistered
vendor.

## Public surface

- Re-exports `_base.ts` types.
- `listVendors(): PrintVendor[]` — every registered (non-null)
  vendor. The print-bar uses this to populate a vendor strip if
  more than one is registered.
- `getVendor(id): PrintVendor | undefined` — direct lookup. The
  capability quotes through this.
- `defaultVendorFor(country): PrintVendor` — picks a sensible
  default. v0.1 returns Manchester for everyone; the partner
  table extends this once the registry has more than one live
  entry.

## Internal

- Vendor records are imported by name, then assigned into the
  `vendors` record. Null entries are kept so the literal-union
  stays honest.

## Does not

- **Does not register new vendors at runtime.** This is a
  build-time registry; new partners arrive as new files and a
  new line here.

## Bordering files

- `_base.ts` — types.
- `studio-manchester.ts` — first concrete vendor.
- Future `shapeways.ts`, `sculpteo.ts`, `treatstock.ts` — when
  partner contracts land.
