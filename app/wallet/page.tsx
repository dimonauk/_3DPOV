"use client";

/**
 * /wallet — visitor's personal wallet of saved cards.
 *
 * Pure client component, reads from localStorage via lib/wallet/storage.
 * Lists every saved card with a quick-launch link into its AR
 * experience. Lets the user remove cards, export the wallet as JSON,
 * import a wallet JSON, and clear everything.
 *
 * The studio never sees this data. The wallet is private to the
 * browser/device.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  listWallet,
  removeFromWallet,
  exportWalletAsJson,
  importWalletFromJson,
  type WalletCard,
} from "lib/wallet/storage";

export default function WalletPage() {
  const [cards, setCards] = useState<WalletCard[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const refresh = () => setCards(listWallet());
    refresh();
    window.addEventListener("holoflow:wallet:changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("holoflow:wallet:changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const flashToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const downloadWallet = () => {
    const blob = new Blob([exportWalletAsJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `holoflow-wallet-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5_000);
    flashToast("Wallet downloaded.");
  };

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      const r = importWalletFromJson(text);
      if (r.ok) flashToast(`Added ${r.added} new card${r.added === 1 ? "" : "s"}.`);
      else flashToast("Couldn't read that wallet file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  if (!mounted) {
    return (
      <div className="wallet-root">
        <h1 className="wallet-title">Your wallet</h1>
        <div className="wallet-empty">Loading…</div>
        <style jsx>{baseStyles}</style>
      </div>
    );
  }

  return (
    <div className="wallet-root">
      <header className="wallet-header">
        <div>
          <h1 className="wallet-title">Your wallet</h1>
          <p className="wallet-sub">
            {cards.length === 0
              ? "Cards you save are kept here, on this device only. Holo-Flow never sees them."
              : `${cards.length} card${cards.length === 1 ? "" : "s"} saved on this device. Never sent anywhere.`}
          </p>
        </div>
        <div className="wallet-actions">
          <Link href="/cards" className="wallet-action">
            Browse cards →
          </Link>
          {cards.length > 0 && (
            <button onClick={downloadWallet} className="wallet-action">
              ⬇ Export wallet
            </button>
          )}
          <label className="wallet-action wallet-import">
            ⬆ Import
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={onImportFile}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </header>

      {cards.length === 0 ? (
        <div className="wallet-empty">
          <div className="wallet-empty-emoji">🪪</div>
          <div className="wallet-empty-text">
            No cards saved yet. Scan a Holo-Flow card or visit one and tap
            the “Save to wallet” button — it’ll show up here.
          </div>
          <Link href="/cards" className="wallet-cta">
            See the library →
          </Link>
        </div>
      ) : (
        <ul className="wallet-grid">
          {cards.map((card) => (
            <li key={card.slug} className="wallet-card">
              <Link
                href={`/c/${card.slug}`}
                className="wallet-card-link"
                style={
                  {
                    "--prim": card.primary ?? "#FF6FB5",
                    "--sec": card.secondary ?? "#B488E0",
                  } as React.CSSProperties
                }
              >
                <div className="wallet-card-grad" />
                <div className="wallet-card-content">
                  <div className="wallet-card-name">{card.name}</div>
                  {card.role && <div className="wallet-card-role">{card.role}</div>}
                  <div className="wallet-card-meta">
                    Saved {new Date(card.savedAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
              <button
                onClick={() => removeFromWallet(card.slug)}
                className="wallet-card-remove"
                aria-label="Remove from wallet"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {toast && <div className="wallet-toast">{toast}</div>}

      <style jsx>{baseStyles}</style>
    </div>
  );
}

const baseStyles = `
  .wallet-root {
    max-width: 1100px;
    margin: 0 auto;
    padding: 3rem 1.5rem 5rem;
  }
  .wallet-header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }
  .wallet-title {
    font-size: 2.25rem;
    font-weight: 700;
    margin: 0;
  }
  .wallet-sub {
    margin: 0.5rem 0 0;
    opacity: 0.7;
    font-size: 0.95rem;
    max-width: 36rem;
  }
  .wallet-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .wallet-action {
    display: inline-block;
    padding: 0.6rem 1.1rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: inherit;
    text-decoration: none;
    background: transparent;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .wallet-import {
    cursor: pointer;
  }
  .wallet-empty {
    text-align: center;
    padding: 4rem 2rem;
    border: 1px dashed rgba(255, 255, 255, 0.2);
    border-radius: 1rem;
  }
  .wallet-empty-emoji {
    font-size: 3.5rem;
    margin-bottom: 1rem;
  }
  .wallet-empty-text {
    opacity: 0.75;
    max-width: 30rem;
    margin: 0 auto 1.5rem;
    line-height: 1.5;
  }
  .wallet-cta {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    color: inherit;
    text-decoration: none;
    font-weight: 600;
  }
  .wallet-grid {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
  }
  .wallet-card {
    position: relative;
  }
  .wallet-card-link {
    display: block;
    text-decoration: none;
    color: inherit;
    position: relative;
    height: 180px;
    border-radius: 1rem;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .wallet-card-grad {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--prim), var(--sec));
    opacity: 0.6;
  }
  .wallet-card-content {
    position: absolute;
    inset: 0;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    z-index: 1;
  }
  .wallet-card-name {
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1.2;
  }
  .wallet-card-role {
    font-size: 0.8rem;
    opacity: 0.9;
    margin-top: 0.2rem;
  }
  .wallet-card-meta {
    font-size: 0.7rem;
    opacity: 0.65;
    margin-top: 0.5rem;
  }
  .wallet-card-remove {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 2;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    font-size: 0.8rem;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  .wallet-card:hover .wallet-card-remove {
    opacity: 1;
  }
  .wallet-toast {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 0.7rem 1.3rem;
    border-radius: 999px;
    font-size: 0.85rem;
    z-index: 99;
  }
`;
