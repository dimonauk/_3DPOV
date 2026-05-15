"use client";

/**
 * QRScannerSheet — opens a fullscreen modal with the camera feed,
 * scans for QR codes via @nimiq/qr-scanner, and routes Holo-Flow card
 * URLs straight into the card landing. Anything else: shows the
 * decoded text with options to open externally or copy.
 *
 * Implementation notes:
 *
 *   - qr-scanner is the @nimiq library — single-purpose, WASM-free,
 *     uses a Web Worker for decoding so it doesn't hitch the
 *     render thread. ~12 KB gzipped.
 *   - Permission flow: camera is only requested when the user opens
 *     the sheet. On cancel, the stream stops cleanly.
 *   - URL routing: scans matching /^https?:\/\/(www\.)?holoflow\.co\.uk\/c\//
 *     trigger an instant Next.js router push to the relative path,
 *     so you stay inside the SPA. External URLs need explicit user
 *     consent (a click on the "Open" button) — we never auto-
 *     navigate off-site from a scanned QR.
 *   - Scan history: keeps the last 5 scans in component state, so a
 *     user who scans the wrong card can step back without rescanning.
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   <button onClick={() => setOpen(true)}>Scan a card</button>
 *   {open && <QRScannerSheet onClose={() => setOpen(false)} />}
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ScannerStatus = "starting" | "scanning" | "denied" | "no-camera" | "error";

type ScannedItem = {
  data: string;
  at: number;
  isHoloflowCard: boolean;
  cardPath?: string;
  isUrl: boolean;
};

const HOLOFLOW_CARD_RE = /^https?:\/\/(www\.)?holoflow\.co\.uk\/c\/([a-z0-9-]+)/i;

export default function QRScannerSheet({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<unknown>(null); // QrScanner instance
  const router = useRouter();
  const [status, setStatus] = useState<ScannerStatus>("starting");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScannedItem[]>([]);
  const [autoRoute, setAutoRoute] = useState(true);

  // Latest scan ref so we can dedupe rapid consecutive reads of the
  // same code (QrScanner emits ~5 per second for a held-still target).
  const lastDataRef = useRef<string | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    const video = videoRef.current;
    if (!video) return;

    (async () => {
      try {
        const { default: QrScanner } = await import("qr-scanner");
        if (cancelled) return;

        // Feature-detect camera support before requesting.
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          setStatus("no-camera");
          return;
        }

        const scanner = new QrScanner(
          video,
          (result: { data: string }) => {
            const now = Date.now();
            // Dedupe: same code within 1.5s = ignore.
            if (
              lastDataRef.current === result.data &&
              now - lastTimeRef.current < 1500
            ) {
              return;
            }
            lastDataRef.current = result.data;
            lastTimeRef.current = now;

            const data = result.data;
            const match = data.match(HOLOFLOW_CARD_RE);
            const isHoloflowCard = !!match;
            const cardPath = match ? `/c/${match[2]}` : undefined;
            const isUrl = /^https?:\/\//i.test(data);

            const item: ScannedItem = {
              data,
              at: now,
              isHoloflowCard,
              cardPath,
              isUrl,
            };
            setHistory((h) => [item, ...h].slice(0, 5));

            if (autoRoute && cardPath) {
              // Holo-Flow card — route inside the app. Use SPA push so
              // we don't drop into a full page reload.
              router.push(cardPath);
              onClose();
            }
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: "environment",
            maxScansPerSecond: 8,
            returnDetailedScanResult: true,
          },
        );

        scannerRef.current = scanner;

        try {
          await scanner.start();
          if (cancelled) {
            scanner.stop();
            scanner.destroy();
            return;
          }
          setStatus("scanning");
        } catch (err) {
          const e = err as { name?: string; message?: string };
          if (
            e.name === "NotAllowedError" ||
            e.name === "PermissionDeniedError"
          ) {
            setStatus("denied");
          } else if (
            e.name === "NotFoundError" ||
            e.name === "OverconstrainedError"
          ) {
            setStatus("no-camera");
          } else {
            setStatus("error");
            setError(e.message ?? "Camera unavailable");
          }
        }
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError((err as Error).message ?? "Scanner failed to load");
      }
    })();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current as
        | { stop?: () => void; destroy?: () => void }
        | null;
      try {
        scanner?.stop?.();
        scanner?.destroy?.();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    };
  }, [autoRoute, onClose, router]);

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => undefined);
    }
  };

  return (
    <div className="qrs-root" role="dialog" aria-label="QR scanner">
      <div className="qrs-header">
        <div className="qrs-title">Scan a card</div>
        <button onClick={onClose} className="qrs-close" aria-label="Close">
          ✕
        </button>
      </div>

      <div className="qrs-viewport">
        <video ref={videoRef} className="qrs-video" playsInline muted />
        {status === "scanning" && (
          <div className="qrs-hint">
            Point the camera at a Holo-Flow card or any QR code.
          </div>
        )}
        {status === "starting" && (
          <div className="qrs-state">Starting camera…</div>
        )}
        {status === "denied" && (
          <div className="qrs-state">
            Camera access was denied. Re-allow it in your browser settings.
          </div>
        )}
        {status === "no-camera" && (
          <div className="qrs-state">No camera available on this device.</div>
        )}
        {status === "error" && (
          <div className="qrs-state">
            Scanner couldn’t start.
            {error ? <div className="qrs-err">{error}</div> : null}
          </div>
        )}
      </div>

      <div className="qrs-controls">
        <label className="qrs-toggle">
          <input
            type="checkbox"
            checked={autoRoute}
            onChange={(e) => setAutoRoute(e.target.checked)}
          />
          Auto-open Holo-Flow cards on scan
        </label>
      </div>

      {history.length > 0 && (
        <div className="qrs-history" aria-label="Recent scans">
          <div className="qrs-history-label">Recent scans</div>
          {history.map((item, i) => (
            <div key={`${item.at}-${i}`} className="qrs-item">
              <div className="qrs-item-label">
                {item.isHoloflowCard
                  ? `Holo-Flow card • ${item.cardPath}`
                  : item.isUrl
                    ? "External URL"
                    : "Text"}
              </div>
              <div className="qrs-item-data">{item.data}</div>
              <div className="qrs-item-actions">
                {item.cardPath && (
                  <button
                    className="qrs-item-btn"
                    onClick={() => {
                      router.push(item.cardPath!);
                      onClose();
                    }}
                  >
                    Open card →
                  </button>
                )}
                {item.isUrl && !item.cardPath && (
                  <a
                    className="qrs-item-btn"
                    href={item.data}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open externally ↗
                  </a>
                )}
                <button
                  className="qrs-item-btn qrs-item-btn-small"
                  onClick={() => copyToClipboard(item.data)}
                >
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .qrs-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          background: #0a0a0f;
          color: white;
        }
        .qrs-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .qrs-title {
          font-weight: 700;
          font-size: 1.1rem;
        }
        .qrs-close {
          background: rgba(255, 255, 255, 0.08);
          color: white;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 1rem;
          cursor: pointer;
        }
        .qrs-viewport {
          position: relative;
          flex: 1;
          min-height: 0;
          background: black;
          overflow: hidden;
        }
        .qrs-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .qrs-hint {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.6);
          padding: 0.5rem 1rem;
          border-radius: 999px;
          font-size: 0.85rem;
          backdrop-filter: blur(8px);
          text-align: center;
          max-width: 90%;
        }
        .qrs-state {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          padding: 1rem 1.5rem;
          background: rgba(0, 0, 0, 0.55);
          border-radius: 0.5rem;
          font-size: 0.95rem;
          text-align: center;
          max-width: 28rem;
        }
        .qrs-err {
          margin-top: 0.5rem;
          color: #ff8585;
          font-size: 0.8rem;
        }
        .qrs-controls {
          padding: 0.75rem 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: #131318;
        }
        .qrs-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .qrs-history {
          max-height: 40vh;
          overflow-y: auto;
          padding: 0.75rem 1.25rem;
          background: #0f0f14;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .qrs-history-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          opacity: 0.5;
          margin-bottom: 0.5rem;
        }
        .qrs-item {
          padding: 0.6rem 0.8rem;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .qrs-item-label {
          font-size: 0.75rem;
          opacity: 0.65;
          margin-bottom: 0.2rem;
        }
        .qrs-item-data {
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
          font-size: 0.8rem;
          word-break: break-all;
          margin-bottom: 0.5rem;
        }
        .qrs-item-actions {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }
        .qrs-item-btn {
          background: rgba(255, 255, 255, 0.08);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.35rem 0.7rem;
          border-radius: 999px;
          font-size: 0.75rem;
          cursor: pointer;
          text-decoration: none;
        }
        .qrs-item-btn-small {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}
