# `web-speech.ts` — purpose twin

## Role

The zero-config TTS provider. Uses the browser's built-in
`SpeechSynthesis` API. Always available where the browser
supports it (essentially everywhere). The baseline `audio.tts`
provider — what speaks when no other provider is configured.

## Public surface

- `speakWebSpeech(req, options?)` — promise-returning speak.
- `cancelWebSpeech()` — cancel queued + active utterances.
- `pauseWebSpeech()` / `resumeWebSpeech()` — playback control.
- Types: `WebSpeechProviderOptions`.

## Internal

- `pickVoice(name, locale?)` — voice resolution: by exact name,
  then by locale prefix, then the first available voice.

## Depends on

- Browser globals only: `window.speechSynthesis`,
  `SpeechSynthesisUtterance`, `SpeechSynthesisVoice`.

## Does not

- **Does not return an audio buffer.** Web Speech owns synthesis
  and playback internally. `TTSResult.src` is `""` for this
  provider; `duration` is `null`.
- **Does not emit visemes.** Web Speech has no viseme API. The
  `audio.visemes` capability will use a separate provider (or
  approximate from audio energy) when wired.
- **Does not handle voice download.** Browser-supplied voices are
  whatever the OS ships. Some browsers async-load voices; this
  module falls back to the first available if a requested name
  isn't found.

## Bordering files

- `lib/capabilities/audio/tts.ts` — the public capability that
  routes to this provider when `provider: "web-speech"`.
- `lib/state/audio.ts` — slice the capability writes to.
- Future siblings: `tts-providers/elevenlabs.ts`,
  `tts-providers/f5.ts`, `tts-providers/kokoro.ts` — each
  exposing the same `speak(req, options?) => Promise<TTSResult>`
  surface so the entry capability can swap providers by name.
