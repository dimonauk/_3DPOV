"use client";

/**
 * app/cards/mine/[slug]/settings/settings/payload-reference.tsx —
 * Static "what each delivery looks like" reference section: headers
 * pre block, body pre block, signing-verification copy.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1.
 */

export function PayloadReference({ slug }: { slug: string }) {
  return (
    <section className="st-section">
      <h2>Payload reference</h2>
      <p className="st-help">
        Each delivery is an HTTPS POST with these headers:
      </p>
      <pre className="st-code">
{`Content-Type: application/json
x-holoflow-signature: sha256=<hex hmac>
x-holoflow-timestamp: <unix-ms>
x-holoflow-event: lead_capture
x-holoflow-card: ${slug}`}
      </pre>
      <p className="st-help">And this JSON body:</p>
      <pre className="st-code">
{`{
  "event": "lead_capture",
  "card": { "slug": "${slug}", "name": "..." },
  "occurredAt": "ISO-8601",
  "data": {
    "name": "Visitor's name (optional)",
    "email": "them@example.com",
    "message": "Optional message",
    "src": "batch-1" // their ?src= tag
  }
}`}
      </pre>
      <p className="st-help">
        To verify:{" "}
        <code>
          signature == "sha256=" + hmacSHA256(secret, timestamp + "." + body)
        </code>
        . Compare with constant-time. Reject if the timestamp is more than
        ~5 minutes old to prevent replay.
      </p>
    </section>
  );
}
