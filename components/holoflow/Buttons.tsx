/**
 * BtnPrimary / BtnGhost / BtnIcon — Holoflow button vocabulary.
 *
 * Primary: solid gold on warm-black. Ghost: text-only with hover-underline.
 * Icon: square bordered for HUD-style controls.
 */

import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

type BtnBase = { children: ReactNode };
type AsButton = BtnBase & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };
type AsLink = BtnBase & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
type Props = AsButton | AsLink;

const PRIMARY = "inline-block bg-gold-400 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-warm-black-950 transition-colors hover:bg-gold-300 disabled:opacity-50";
const GHOST = "inline-block border-b border-warm-black-700 pb-0.5 font-mono text-[11px] uppercase tracking-[0.18em] text-chrome-400 transition-colors hover:border-chrome-300 hover:text-chrome-100 disabled:opacity-50";

function render(cls: string, p: Props) {
  if ("href" in p && p.href) {
    const { href, children, ...rest } = p;
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }
  const { children, type = "button", ...rest } = p as AsButton;
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}

export function BtnPrimary(p: Props) { return render(PRIMARY, p); }
export function BtnGhost(p: Props) { return render(GHOST, p); }
