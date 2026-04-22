import { Resend } from "resend";

export type OrderEmailPayload = {
  to: string;
  subject: string;
  html: string;
  bcc?: string;
};

let client: Resend | null = null;

function getResend(): Resend | null {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client = new Resend(key);
  return client;
}

export async function sendOrderEmail(p: OrderEmailPayload): Promise<
  { sent: true; id: string } | { sent: false; reason: string }
> {
  const resend = getResend();
  const from = process.env.ORDER_FROM_EMAIL ?? "studio@chrono-protocol.example";
  if (!resend) {
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }
  const { data, error } = await resend.emails.send({
    from,
    to: p.to,
    bcc: p.bcc,
    subject: p.subject,
    html: p.html,
  });
  if (error || !data) {
    return { sent: false, reason: error?.message ?? "unknown error" };
  }
  return { sent: true, id: data.id };
}

export function renderOrderEmailHtml(args: {
  customerName: string | null;
  workTitle: string;
  workCode: string;
  amountGBP: number;
  orderRef: string;
}): string {
  const name = args.customerName ?? "friend";
  return `
<!doctype html>
<html>
  <body style="font-family: ui-serif, Georgia, serif; color:#0b0b0d; background:#efece4; padding:32px;">
    <div style="font-family: ui-monospace, monospace; text-transform:uppercase; letter-spacing:0.2em; font-size:11px; color:#5a5a5c;">
      CP-Archive · Acquisition confirmed
    </div>
    <h1 style="font-weight:300; font-size:28px; margin-top:16px;">Thank you, ${name}.</h1>
    <p style="line-height:1.6;">
      You have acquired <strong>${args.workTitle}</strong> (${args.workCode}).
      The studio has received your order and will prepare the work for
      dispatch within 3&ndash;5 working days.
    </p>
    <p style="font-family: ui-monospace, monospace; font-size:13px;">
      Order reference: <strong>${args.orderRef}</strong><br/>
      Total: <strong>£${args.amountGBP}</strong>
    </p>
    <p style="line-height:1.6;">
      You will receive a second email with tracking when the work ships.
      Your certificate of authenticity &mdash; signed, numbered, embossed &mdash;
      travels with the work.
    </p>
    <p style="font-family: ui-monospace, monospace; text-transform:uppercase; letter-spacing:0.2em; font-size:10px; color:#5a5a5c; margin-top:48px;">
      The Neo-London Chrono-Protocol
    </p>
  </body>
</html>`.trim();
}
