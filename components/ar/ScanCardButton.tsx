"use client";

/**
 * ScanCardButton — opens the QRScannerSheet on click. Renders as a
 * pill button matching the studio's chrome-label aesthetic. Drop in
 * on any server component that wants to expose the scanner.
 */

import dynamic from "next/dynamic";
import { useState } from "react";

const QRScannerSheet = dynamic(() => import("./QRScannerSheet"), {
  ssr: false,
});

type ScanCardButtonProps = {
  label?: string;
  className?: string;
};

export default function ScanCardButton({
  label = "📷 Scan a card",
  className,
}: ScanCardButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          className ??
          "rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
        }
      >
        {label}
      </button>
      {open && <QRScannerSheet onClose={() => setOpen(false)} />}
    </>
  );
}
