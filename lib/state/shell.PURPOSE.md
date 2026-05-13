# `shell.ts` — purpose twin

## Role

The shared state-bus for the workshop shell's three collapsible
panels (left navigator, right inspector, bottom terminal). Persists
panel open/closed booleans to `localStorage` via zustand's
`persist` middleware so a returning visitor sees the workshop they
left.

Migrated from the previous module-scope load/save helpers at
`lib/shell/state.ts`. The panel state was the last shared state
living outside `lib/state/`; this brings it into the slice
convention.

## Public surface

- `useShellStore` — React hook for components.
- `shellStore` — headless alias.
- `defaultShellState` — back-compat export for any caller that
  inspected the previous module's default constant.
- Types: `PanelKey`, `ShellState`, `ShellActions`.

## Internal

- `initial: ShellState` — empty default (all panels closed).
- `persist` config:
  - `name: "holoflow-shell-v1"` — the localStorage key. Versioned
    so a schema change can bump v1 → v2 without confusing returning
    visitors.
  - `storage` — SSR-safe wrapper. Returns a no-op storage during
    server render; falls back to `window.localStorage` in the
    browser.
  - `partialize` — persists only `open` (the toggleable state),
    not actions.

## Depends on

- `zustand` + `zustand/middleware` — `create`, `persist`,
  `createJSONStorage`.

## Does not

- **Does not own terminal lines.** The rolling activity feed and
  user echo lines remain in `components/shell/shell-context.tsx`
  because they're transient + tied to React lifecycle (line-id
  counters, scroll-to-bottom). A future migration could move
  them to a `lib/state/shell-terminal.ts` slice; for v0.1 they
  stay where they are.
- **Does not own keyboard shortcuts.** Toggle bindings live in
  the panel components.
- **Does not handle multi-tab synchronisation.** zustand's persist
  doesn't broadcast across tabs by default. If two tabs are open
  and one toggles a panel, the other won't update until reload.
  Acceptable for v0.1.

## Plug surface

- **State plugs (write):** `localStorage["holoflow-shell-v1"]`.
- **Type plugs:** input `PanelKey`; no return.
- **Dependency plugs:** none.

## Bordering files

- `components/shell/shell-context.tsx` — consumer that reads
  this slice and exposes a higher-level `useShell()` hook plus
  terminal-lines state.
- `components/shell/panel-tab.tsx` — imports the `PanelKey` type.
- `components/shell/left-panel.tsx`, `right-panel.tsx`,
  `bottom-terminal.tsx`, `workshop-shell.tsx` — go through
  `useShell()` (which goes through this slice). They don't
  import this file directly.
