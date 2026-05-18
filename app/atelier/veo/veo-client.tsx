"use client";

/**
 * app/atelier/veo/veo-client.tsx — Veo 3 chamber UI with polling.
 *
 * Veo is async: the start call returns a jobId, then we poll
 * `/api/ai/google/generate-video/<jobId>` every 5s until the response
 * is `done: true`. The progress UI is a wall-clock counter (no
 * percentage available from the API), capped at 4 minutes before we
 * tell the visitor to give up.
 *
 * On success, the video bytes come back inline as a base64 data URL.
 * We blob it, autoplay it in-page, and push a `kind: "video"` entry
 * into the atelier recent-outputs ring so a sibling chamber can pick
 * it up.
 *
 * The visitor's BYO API key (if any) goes in `X-Visitor-Google-Key`
 * on both the start request and every poll. Never logged.
 *
 * Orchestrator only. Types + poll constants in veo/types.ts;
 * data-URL helpers in data-url.ts; job state machine + handlers in
 * use-veo-job.ts; prompt + advanced + aspect/duration form in
 * prompt-form.tsx; running/error/ready panels in result-panels.tsx.
 * Per ARCHITECTURE.md Rule 1.
 */

import { useState } from "react";

import GoogleAiSettings from "components/atelier/google-ai-settings";
import { useActiveChamber } from "lib/state/atelier-hooks";
import { useGoogleAiKeyStore } from "lib/state/google-ai-key";

import { PromptForm } from "./veo/prompt-form";
import { ResultPanels } from "./veo/result-panels";
import { useVeoJob } from "./veo/use-veo-job";

export default function VeoClient() {
  useActiveChamber("veo");

  const job = useVeoJob();
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const mode = useGoogleAiKeyStore((s) => s.mode);
  const hasKey = useGoogleAiKeyStore((s) => s.key.trim().length > 0);

  return (
    <div className="flex flex-col gap-8">
      {/* Header row: quota mode badge + settings gear */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-2">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
          Quota:{" "}
          <span className="text-chrome-100">
            {mode === "byo" && hasKey ? "your AI Studio key" : "studio (2/hr)"}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="rounded-sm border border-warm-black-700 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-300 transition-colors hover:border-pink-200/60 hover:text-pink-200"
          aria-label="Open Google AI quota settings"
        >
          ⚙ Settings
        </button>
      </section>

      <PromptForm
        prompt={job.prompt}
        setPrompt={job.setPrompt}
        negativePrompt={job.negativePrompt}
        setNegativePrompt={job.setNegativePrompt}
        showAdvanced={job.showAdvanced}
        setShowAdvanced={job.setShowAdvanced}
        aspectRatio={job.aspectRatio}
        setAspectRatio={job.setAspectRatio}
        durationSeconds={job.durationSeconds}
        setDurationSeconds={job.setDurationSeconds}
        generateAudio={job.generateAudio}
        setGenerateAudio={job.setGenerateAudio}
        enhancePrompt={job.enhancePrompt}
        setEnhancePrompt={job.setEnhancePrompt}
        output={job.output}
        onGenerate={() => void job.onGenerate()}
      />

      <ResultPanels
        output={job.output}
        elapsedSec={job.elapsedSec}
        onOpenSettings={() => setSettingsOpen(true)}
        onDownload={job.onDownload}
      />

      <GoogleAiSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
