/**
 * Gemini video-understanding client.
 *
 * Aura's eyes route to Gemini for any video pass. The model has
 * native video input — flat or equirectangular — and the studio's
 * watcher loop uses it for the seeing half of the watch / read
 * split.
 *
 * No SDK; the REST endpoints are stable enough that a fetch
 * wrapper is cleaner than another dependency.
 *
 * Required env:
 *   GOOGLE_AI_API_KEY — generative-language API key.
 *                       https://aistudio.google.com/apikey
 */

const FILES_UPLOAD_BASE =
  "https://generativelanguage.googleapis.com/upload/v1beta/files";

const GENERATE_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

// gemini-2.5-pro: highest video understanding quality as of 2026-Q1.
// gemini-2.5-flash for cheaper / faster passes.
export const GEMINI_MODEL = "gemini-2.5-pro";

type UploadedFile = {
  /** The opaque file URI to reference in generateContent. */
  uri: string;
  /** The MIME the Files API stored the file under. */
  mimeType: string;
  /** When this file expires (Gemini retains uploads for ~48 hours). */
  expirationTime: string;
};

/**
 * Upload a video to Gemini's Files API by URL.
 *
 * The server-side route fetches the public Blob URL and streams it
 * to the Files endpoint. Files API holds the asset for ~48 hours,
 * which is plenty for the watch-then-read pass.
 */
export async function uploadVideoFromUrl(
  videoUrl: string,
  displayName: string,
): Promise<UploadedFile> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not set. Add it to Vercel env vars.",
    );
  }

  // Fetch the video off the storage URL.
  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) {
    throw new Error(
      `Failed to fetch source video at ${videoUrl}: ${videoRes.status}`,
    );
  }
  const videoBytes = await videoRes.arrayBuffer();
  const contentType =
    videoRes.headers.get("content-type") ?? "video/mp4";
  const sizeBytes = videoBytes.byteLength;

  // Two-step: start upload, then upload bytes.
  const startRes = await fetch(
    `${FILES_UPLOAD_BASE}?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(sizeBytes),
        "X-Goog-Upload-Header-Content-Type": contentType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: { display_name: displayName },
      }),
    },
  );
  if (!startRes.ok) {
    const txt = await startRes.text();
    throw new Error(`Files API start failed: ${startRes.status} ${txt}`);
  }
  const uploadUrl = startRes.headers.get("x-goog-upload-url");
  if (!uploadUrl) {
    throw new Error("Files API did not return an upload URL.");
  }

  const finishRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(sizeBytes),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: videoBytes,
  });
  if (!finishRes.ok) {
    const txt = await finishRes.text();
    throw new Error(`Files API upload failed: ${finishRes.status} ${txt}`);
  }
  const fileMeta = (await finishRes.json()) as {
    file: {
      uri: string;
      mimeType: string;
      expirationTime: string;
      state: string;
    };
  };

  return {
    uri: fileMeta.file.uri,
    mimeType: fileMeta.file.mimeType,
    expirationTime: fileMeta.file.expirationTime,
  };
}

/**
 * Generate a cold-eye reading against an uploaded file.
 *
 * The prompt is the watcher prompt (WATCH_PROMPT_FLAT or
 * WATCH_PROMPT_360). The model returns JSON conforming to the
 * schema in the prompt; the caller parses it.
 */
export async function generateColdEyeReading(
  fileUri: string,
  mimeType: string,
  prompt: string,
): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not set. Add it to Vercel env vars.",
    );
  }

  const res = await fetch(
    `${GENERATE_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                fileData: {
                  mimeType,
                  fileUri,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      }),
    },
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini generate failed: ${res.status} ${txt}`);
  }

  const body = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) {
    throw new Error("Gemini returned no text in the candidate response.");
  }
  return text;
}

export type ColdEyeReading = {
  medium: string;
  segments: Array<{
    ts: string;
    frame: string;
    motion: string;
    light: string;
    sound: string | null;
    human: string | null;
    /** Only set for 360 readings. */
    position?: string;
  }>;
  across: string;
};

export function parseColdEyeReading(raw: string): ColdEyeReading {
  // Gemini occasionally wraps JSON in a code fence even with
  // responseMimeType set; strip defensively.
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(cleaned) as ColdEyeReading;
}
