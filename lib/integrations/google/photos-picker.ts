/**
 * lib/integrations/google/photos-picker.ts — Google Photos Picker API.
 *
 * # 2025 reality (re-stated)
 * The Photos Library API's broad-read scopes (photoslibrary.readonly
 * etc.) were deprecated on 31 March 2025. Apps no longer get unrestricted
 * read access to a user's library. The **Picker API** is the supported
 * replacement: the app creates a picker session, the user opens Google's
 * own modal, selects the items, then the app polls the session and
 * fetches the selected mediaItems.
 *
 * Endpoint base: https://photospicker.googleapis.com/v1
 *
 * Surface in this file:
 *   - createPickerSession(accessToken)
 *   - pollPickerSession(accessToken, sessionId)
 *   - deletePickerSession(accessToken, sessionId)
 *   - listSelectedMediaItems(accessToken, sessionId, pageToken?)
 *
 * Download lives in `./photos-picker-download.ts` to keep this file
 * focused on the session lifecycle.
 */

import "server-only";

const PICKER_BASE = "https://photospicker.googleapis.com/v1";

export type PickerSession = {
  id: string;
  pickerUri: string;
  pollingConfig?: {
    pollInterval?: string; // e.g. "5s"
    timeoutIn?: string; // e.g. "1800s"
  };
  mediaItemsSet?: boolean;
  expireTime?: string; // RFC3339
};

export type PickedMediaFile = {
  baseUrl: string;
  mimeType: string;
  filename: string;
  mediaFileMetadata?: {
    width?: number;
    height?: number;
    cameraMake?: string;
    cameraModel?: string;
    photoMetadata?: Record<string, unknown>;
    videoMetadata?: { fps?: number; processingStatus?: string };
  };
};

export type PickedMediaItem = {
  id: string;
  createTime?: string;
  type: "PHOTO" | "VIDEO" | "TYPE_UNSPECIFIED";
  mediaFile: PickedMediaFile;
};

export type PollResult = {
  mediaItemsSet: boolean;
  session: PickerSession;
};

export type ListPickedItemsResult = {
  mediaItems: PickedMediaItem[];
  nextPageToken?: string;
};

function bearerHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function ensureOk(res: Response, op: string): Promise<void> {
  if (res.ok) return;
  const text = await res.text().catch(() => "");
  throw new Error(
    `photos-picker[${op}]: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 400)}` : ""}`,
  );
}

/**
 * Create a new picker session. Returns the session id + the URI the
 * operator's browser should open to pick items.
 */
export async function createPickerSession(
  accessToken: string,
): Promise<PickerSession> {
  const res = await fetch(`${PICKER_BASE}/sessions`, {
    method: "POST",
    headers: bearerHeaders(accessToken),
    body: JSON.stringify({}),
    cache: "no-store",
  });
  await ensureOk(res, "createPickerSession");
  return (await res.json()) as PickerSession;
}

/**
 * Poll the picker session. When the user finishes picking,
 * `mediaItemsSet === true` and the items are queryable via
 * listSelectedMediaItems().
 */
export async function pollPickerSession(
  accessToken: string,
  sessionId: string,
): Promise<PollResult> {
  const res = await fetch(
    `${PICKER_BASE}/sessions/${encodeURIComponent(sessionId)}`,
    {
      method: "GET",
      headers: bearerHeaders(accessToken),
      cache: "no-store",
    },
  );
  await ensureOk(res, "pollPickerSession");
  const session = (await res.json()) as PickerSession;
  return { session, mediaItemsSet: Boolean(session.mediaItemsSet) };
}

/**
 * Tell Google we're done with this session. Frees server-side state.
 * Best-effort: callers may ignore failure.
 */
export async function deletePickerSession(
  accessToken: string,
  sessionId: string,
): Promise<void> {
  const res = await fetch(
    `${PICKER_BASE}/sessions/${encodeURIComponent(sessionId)}`,
    {
      method: "DELETE",
      headers: bearerHeaders(accessToken),
      cache: "no-store",
    },
  );
  // 200 or 204 are fine; 404 is also fine (already gone).
  if (!res.ok && res.status !== 404) {
    await ensureOk(res, "deletePickerSession");
  }
}

/**
 * List the user's picked media items for a session. The Picker API
 * paginates with `nextPageToken` like every other Google list endpoint.
 */
export async function listSelectedMediaItems(
  accessToken: string,
  sessionId: string,
  pageToken?: string,
  pageSize = 100,
): Promise<ListPickedItemsResult> {
  const params = new URLSearchParams({
    sessionId,
    pageSize: String(pageSize),
  });
  if (pageToken) params.set("pageToken", pageToken);
  const res = await fetch(`${PICKER_BASE}/mediaItems?${params.toString()}`, {
    method: "GET",
    headers: bearerHeaders(accessToken),
    cache: "no-store",
  });
  await ensureOk(res, "listSelectedMediaItems");
  const data = (await res.json()) as {
    mediaItems?: PickedMediaItem[];
    nextPageToken?: string;
  };
  return {
    mediaItems: data.mediaItems ?? [],
    nextPageToken: data.nextPageToken,
  };
}

/**
 * Walk all pages of a session's picked items into a single array.
 * Hard-caps at `maxItems` to keep memory bounded.
 */
export async function listAllSelectedMediaItems(
  accessToken: string,
  sessionId: string,
  maxItems = 500,
): Promise<PickedMediaItem[]> {
  const out: PickedMediaItem[] = [];
  let pageToken: string | undefined;
  // Safety: cap at 50 pages even if the API misbehaves.
  for (let i = 0; i < 50; i += 1) {
    const page = await listSelectedMediaItems(accessToken, sessionId, pageToken);
    out.push(...page.mediaItems);
    if (out.length >= maxItems) {
      return out.slice(0, maxItems);
    }
    if (!page.nextPageToken) return out;
    pageToken = page.nextPageToken;
  }
  return out;
}
