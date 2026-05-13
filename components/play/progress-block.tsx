"use client";

import { useEffect, useState } from "react";
import { playLevels } from "lib/play";
import {
  defaultProgress,
  loadProgressLocal,
  passedLevelCount,
  unlockedLevels,
  type PlayerProgress,
} from "lib/play/state";
import { useAuth } from "components/auth/auth-provider";

/**
 * ProgressBlock — the player-progress strip at the top of /play.
 *
 * For a signed-in visitor it reads progress (local for now; Firestore
 * once /api/play/progress is wired). For an anonymous visitor the
 * block does not render — the rest of the page does not depend on it,
 * and the block would lie about the player having any state to track.
 */

export function ProgressBlock() {
  const { user, loading } = useAuth();
  const [progress, setProgress] = useState<PlayerProgress | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setProgress(null);
      return;
    }
    // TODO: fetch /api/play/progress when firebase-admin is wired;
    // until then localStorage is the canonical store for the player's
    // session-spanning progress.
    setProgress(loadProgressLocal());
  }, [user, loading]);

  if (loading) return null;
  if (!user) return null;

  const p = progress ?? defaultProgress();
  const passed = passedLevelCount(p);
  const unlocked = unlockedLevels(p).length;
  const locked = playLevels.length - passed - unlocked;

  return (
    <section className="mt-10 rounded-sm border border-pink-200/40 bg-pink-200/[0.03] p-5">
      <div className="chrome-label mb-3 text-pink-200">
        Your progress
      </div>
      <dl className="grid grid-cols-3 gap-4 text-center">
        <div>
          <dt className="chrome-label text-chrome-500">Passed</dt>
          <dd className="mt-1 text-2xl text-chrome-100">{passed}</dd>
        </div>
        <div>
          <dt className="chrome-label text-chrome-500">Unlocked</dt>
          <dd className="mt-1 text-2xl text-chrome-100">{unlocked}</dd>
        </div>
        <div>
          <dt className="chrome-label text-chrome-500">Locked</dt>
          <dd className="mt-1 text-2xl text-chrome-400">{locked}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs italic text-chrome-500">
        Reads from local progress until the Firestore backend is wired.
        Numbers stay at the default until the level structure is
        enforced.
      </p>
    </section>
  );
}
