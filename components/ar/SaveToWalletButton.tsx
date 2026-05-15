"use client";

/**
 * SaveToWalletButton — single button that toggles the card's
 * presence in the visitor's local wallet (localStorage). No network
 * call, no auth. The button reads the current wallet state on mount
 * + listens for the 'holoflow:wallet:changed' event so other tabs /
 * other instances stay in sync.
 */

import { useEffect, useState } from "react";
import {
  addToWallet,
  isInWallet,
  removeFromWallet,
  type WalletCard,
} from "lib/wallet/storage";

type Props = {
  card: Omit<WalletCard, "savedAt">;
  primary?: string;
  textOnBrand?: string;
};

export default function SaveToWalletButton({
  card,
  primary = "#FF6FB5",
  textOnBrand = "#FFFFFF",
}: Props) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const refresh = () => setSaved(isInWallet(card.slug));
    refresh();
    window.addEventListener("holoflow:wallet:changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("holoflow:wallet:changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [card.slug]);

  const toggle = () => {
    if (saved) {
      removeFromWallet(card.slug);
    } else {
      addToWallet(card);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`stw-btn ${saved ? "stw-btn-on" : ""}`}
        onClick={toggle}
        aria-pressed={saved}
      >
        {saved ? "✓ In your wallet" : "💾 Save to wallet"}
      </button>
      <style jsx>{`
        .stw-btn {
          background: transparent;
          color: inherit;
          border: 1px solid currentColor;
          padding: 0.5rem 1rem;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          opacity: 0.8;
          transition: all 0.15s ease;
        }
        .stw-btn:hover {
          opacity: 1;
        }
        .stw-btn-on {
          background: ${primary};
          color: ${textOnBrand};
          border-color: ${primary};
          opacity: 1;
        }
      `}</style>
    </>
  );
}
