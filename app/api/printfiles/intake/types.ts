/**
 * app/api/printfiles/intake/types.ts — Inbound webhook body shape.
 *
 * Mirrors Resend Inbound's JSON envelope. Fields are typed loosely
 * because the transport can drift slightly between regions/versions;
 * the route hardens to a single shape on the way in.
 */

export type ResendInboundAttachment = {
  filename?: string;
  content_type?: string;
  contentType?: string;
  /** Base64-encoded bytes. Resend Inbound caps each attachment at
   *  ~25 MB; we apply our own cap on top. */
  content?: string;
  content_base64?: string;
  size?: number;
};

export type ResendInboundBody = {
  from?: { email?: string; name?: string };
  to?: Array<{ email?: string }>;
  subject?: string;
  text?: string;
  html?: string;
  attachments?: ResendInboundAttachment[];
  /** RFC 822 Message-ID, for threading. */
  message_id?: string;
  headers?: Record<string, string>;
};
