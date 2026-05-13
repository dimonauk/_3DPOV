/**
 * Rookery onboarding email sequence.
 *
 * Three emails sent after a member subscribes: Day 0 (welcome), Day 3
 * (orientation), Day 7 (gentle nudge to post). All three are written
 * in Dimona first-person workshop register — the maker shaking the
 * visitor's hand. Aura voice is wrong for these; the visitor has just
 * read /rookery and /rookery/about, both of which are Dimona speaking,
 * and the inbox shouldn't suddenly switch narrator.
 *
 * Each entry has a plain-text fallback and a minimal HTML version.
 * No images. No tracking pixels. No marketing wrapping.
 *
 * The delayDays field is data, not a scheduler — a real sender needs
 * a job runner (cron or BullMQ-style queue) to honour the delays. See
 * app/api/rookery/onboarding/README.md for the schedule story.
 */

export type RookeryEmailSlug = "welcome" | "orient" | "perch";

export type RookeryEmail = {
  slug: RookeryEmailSlug;
  /** Days after subscription this email is sent. */
  delayDays: number;
  subject: string;
  /** Plain-text fallback, line-broken naturally. */
  text: string;
  /** Rich HTML for clients that render it. */
  html: string;
};

const HTML_WRAPPER_OPEN =
  '<div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; max-width: 600px; color: #1a1a1a; line-height: 1.6;">';
const HTML_WRAPPER_CLOSE = "</div>";

const FOOTER_TEXT =
  "Holo-Flow Studio · Salford · holoflow.co.uk · This email was sent because you joined The Rookery. To stop receiving these, reply 'stop'.";

const FOOTER_HTML =
  '<p style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #6b6b6b;">Holo-Flow Studio &middot; Salford &middot; holoflow.co.uk &middot; This email was sent because you joined The Rookery. To stop receiving these, reply &lsquo;stop&rsquo;.</p>';

function wrapHtml(paragraphs: string[]): string {
  const body = paragraphs.map((p) => `<p>${p}</p>`).join("\n  ");
  return `${HTML_WRAPPER_OPEN}\n  ${body}\n  ${FOOTER_HTML}\n${HTML_WRAPPER_CLOSE}`;
}

// ---------------------------------------------------------------------------
// Day 0 — Welcome
// ---------------------------------------------------------------------------

const WELCOME_TEXT = `Hello — Dimona here.

You've subscribed to the Rookery. Thank you. The door's now open whenever you want it; the link is /rookery and it'll be there from any page on holoflow.

A few practical bits before I let you go.

The Rookery is threaded and append-only. You read what's there, you post when you've got something to say, you reply on a thread when someone else has said something you want to answer. It moves at the pace of a journal, not the pace of a chat room. If you're used to Discord, the pacing will feel slow at first — that's the point.

Every post is attributed to your signed-in account. Nobody is anonymous in here. You can edit your display name in your account settings if you'd like to be Something Else, but Something Else is still the same account as you.

I'm in there too. I read everything. I reply when I have something useful to add and stay quiet when I don't. You'll see me around.

Go and have a look. I'll write you again in a few days with the tour. — Dimona

—
${FOOTER_TEXT}`;

const WELCOME_HTML = wrapHtml([
  "Hello &mdash; Dimona here.",
  "You&rsquo;ve subscribed to the Rookery. Thank you. The door&rsquo;s now open whenever you want it; the link is /rookery and it&rsquo;ll be there from any page on holoflow.",
  "A few practical bits before I let you go.",
  "The Rookery is threaded and append-only. You read what&rsquo;s there, you post when you&rsquo;ve got something to say, you reply on a thread when someone else has said something you want to answer. It moves at the pace of a journal, not the pace of a chat room. If you&rsquo;re used to Discord, the pacing will feel slow at first &mdash; that&rsquo;s the point.",
  "Every post is attributed to your signed-in account. Nobody is anonymous in here. You can edit your display name in your account settings if you&rsquo;d like to be Something Else, but Something Else is still the same account as you.",
  "I&rsquo;m in there too. I read everything. I reply when I have something useful to add and stay quiet when I don&rsquo;t. You&rsquo;ll see me around.",
  "Go and have a look. I&rsquo;ll write you again in a few days with the tour. &mdash; Dimona",
]);

// ---------------------------------------------------------------------------
// Day 3 — Where to start
// ---------------------------------------------------------------------------

const ORIENT_TEXT = `Hello again. You've had the Rookery for a few days. Here's what I'd point at if you were a friend who'd just joined.

The journal. Field-notes from the bench, mostly. Year One Fire is the piece about how I learned poi without a teacher. First Light is the first published frame. On the Bench Year Ten is where the practice is now. The journal is what most of the Rookery's threads end up cross-referencing.

The tutorials. Two long ones I'd point at first — Building a POV LED Rig and From Photograph to Object. Both are how-to in the proper sense: brick on brick, no skipped steps. If you have questions on either, the Rookery is the right place to ask them; I'll see them.

Recent threads. Have a scroll through what's already on the perch. Reply to one of them before you start your own — it'll get you in the rhythm faster. Threads with a few replies already on them are easier to wade into than empty ones.

Your first post. When you're ready. Don't worry about it being a manifesto. The Rookery posts that land best are short and specific — a question, a kit observation, a thing you tried this week, a frame you're proud of. The room rewards specificity more than polish.

Take your time. I'm not going anywhere. — Dimona

—
${FOOTER_TEXT}`;

const ORIENT_HTML = wrapHtml([
  "Hello again. You&rsquo;ve had the Rookery for a few days. Here&rsquo;s what I&rsquo;d point at if you were a friend who&rsquo;d just joined.",
  "<strong>The journal.</strong> Field-notes from the bench, mostly. Year One Fire is the piece about how I learned poi without a teacher. First Light is the first published frame. On the Bench Year Ten is where the practice is now. The journal is what most of the Rookery&rsquo;s threads end up cross-referencing.",
  "<strong>The tutorials.</strong> Two long ones I&rsquo;d point at first &mdash; Building a POV LED Rig and From Photograph to Object. Both are how-to in the proper sense: brick on brick, no skipped steps. If you have questions on either, the Rookery is the right place to ask them; I&rsquo;ll see them.",
  "<strong>Recent threads.</strong> Have a scroll through what&rsquo;s already on the perch. Reply to one of them before you start your own &mdash; it&rsquo;ll get you in the rhythm faster. Threads with a few replies already on them are easier to wade into than empty ones.",
  "<strong>Your first post.</strong> When you&rsquo;re ready. Don&rsquo;t worry about it being a manifesto. The Rookery posts that land best are short and specific &mdash; a question, a kit observation, a thing you tried this week, a frame you&rsquo;re proud of. The room rewards specificity more than polish.",
  "Take your time. I&rsquo;m not going anywhere. &mdash; Dimona",
]);

// ---------------------------------------------------------------------------
// Day 7 — The perch
// ---------------------------------------------------------------------------

const PERCH_TEXT = `A week in. By now you've probably read more than you've written, which is the right way round.

This is the gentle nudge. If you've been waiting for the right moment to post your first thread, this email is the right moment. The Rookery gets better the more members write into it, and the new threads are usually the best ones — fresh eyes asking the question nobody had quite framed yet.

A few prompts if you want one:

A piece of kit you've been thinking about. A frame from your last shoot. A question about something on the site. A thing you've failed at recently that you'd like a second opinion on. The thing you joined the Rookery to talk about that nobody in your life understands.

Sign in, hit '+ Start a thread', say something true. I'll see it.

Welcome to the perch. — Dimona

—
${FOOTER_TEXT}`;

const PERCH_HTML = wrapHtml([
  "A week in. By now you&rsquo;ve probably read more than you&rsquo;ve written, which is the right way round.",
  "This is the gentle nudge. If you&rsquo;ve been waiting for the right moment to post your first thread, this email is the right moment. The Rookery gets better the more members write into it, and the new threads are usually the best ones &mdash; fresh eyes asking the question nobody had quite framed yet.",
  "A few prompts if you want one:",
  "A piece of kit you&rsquo;ve been thinking about. A frame from your last shoot. A question about something on the site. A thing you&rsquo;ve failed at recently that you&rsquo;d like a second opinion on. The thing you joined the Rookery to talk about that nobody in your life understands.",
  "Sign in, hit &lsquo;+ Start a thread&rsquo;, say something true. I&rsquo;ll see it.",
  "Welcome to the perch. &mdash; Dimona",
]);

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const ROOKERY_EMAILS: RookeryEmail[] = [
  {
    slug: "welcome",
    delayDays: 0,
    subject: "You’re in the Rookery.",
    text: WELCOME_TEXT,
    html: WELCOME_HTML,
  },
  {
    slug: "orient",
    delayDays: 3,
    subject: "What to read, what to post.",
    text: ORIENT_TEXT,
    html: ORIENT_HTML,
  },
  {
    slug: "perch",
    delayDays: 7,
    subject: "The perch is yours.",
    text: PERCH_TEXT,
    html: PERCH_HTML,
  },
];

export const ROOKERY_EMAIL_SLUGS: ReadonlyArray<RookeryEmailSlug> = [
  "welcome",
  "orient",
  "perch",
];

export function getRookeryEmail(
  slug: RookeryEmailSlug,
): RookeryEmail | undefined {
  return ROOKERY_EMAILS.find((e) => e.slug === slug);
}

export function isRookeryEmailSlug(value: unknown): value is RookeryEmailSlug {
  return (
    typeof value === "string" &&
    (ROOKERY_EMAIL_SLUGS as ReadonlyArray<string>).includes(value)
  );
}
