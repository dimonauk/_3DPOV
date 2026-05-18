/**
 * app/cards/mine/[slug]/settings/settings/types.ts — Wire shapes +
 * event registry for the owner-facing webhook settings page.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1.
 */

export type LogEntry = {
  id: string;
  event: string;
  ok: boolean;
  status: number | null;
  attempts: number;
  error: string | null;
  at: number;
};

export type WebhookState = {
  webhookUrl: string;
  secretSet: boolean;
  webhookEvents: string[];
};

export const ALL_EVENTS: Array<{ key: string; label: string }> = [
  { key: "lead_capture", label: "Lead capture" },
  { key: "view", label: "Card view" },
  { key: "ar_launch", label: "AR launch" },
  { key: "hand_lock", label: "Hand lock" },
  { key: "webxr", label: "WebXR session" },
  { key: "vcard_download", label: "vCard download" },
  { key: "recording", label: "AR recording" },
];
