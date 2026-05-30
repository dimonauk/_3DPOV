/**
 * KeyboardHint — tiny mono badge for the konami code / shortcut hint.
 * Pairs with the konami theme axis; the actual key listener is wired
 * by KonamiListener when the axis is on.
 */

export function KeyboardHint({ code, title = "Type me" }: { code: string; title?: string }) {
  return (
    <span
      title={title}
      className="hidden cursor-default font-mono text-[0.42rem] uppercase tracking-[0.1em] text-chrome-500 md:inline"
    >
      {code}
    </span>
  );
}
