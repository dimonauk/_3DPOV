# Federation — ActivityPub skeleton

This is the minimum viable scaffolding to let Mastodon, Pixelfed, and other Fediverse clients find the studio at `@studio@holoflow.co.uk` and follow it. New articles, journal entries, and tutorials get mapped to ActivityPub Notes and surfaced through the outbox.

This is a skeleton, not a conformant implementation. The end state of this round of work:

- WebFinger resolves the `@studio` handle to the actor URL.
- The actor document at `/users/studio` is a valid Service with a public key.
- The outbox is a paginated `OrderedCollection` of `Create(Note)` activities built from the existing entry registry.
- The inbox accepts Follow / Undo Follow and 202s them, but does not persist followers or send Accept activities back.
- The publish path (`lib/federation/publish.ts`) builds the right Create activity for a new entry, but does not sign or deliver it.

What's deliberately left for the next pass is called out in TODO comments in each route and module.

## Why no Fedify

The plan was to use `@fedify/fedify` + `@fedify/next`. After looking at how Fedify's Next adapter wraps the request lifecycle (it expects to own the route handlers via `integrateFederation`), the call was to ship a hand-rolled skeleton instead. The Next 15.6 canary + Turbopack + the project's heavy webpack config make adapters risky; a six-file plain-TS skeleton ships clean and stays inside patterns the rest of the codebase already uses (App Router route handlers, `force-dynamic`, no extra deps).

The upgrade path is open. Each route handler is thin enough that a later session can swap it for `federation.fetch(req, ...)` once the Fedify integration is proven safe against this canary stack.

## Files

- `lib/federation/actor.ts` — actor identity, URL builders, env-backed key reader.
- `lib/federation/notes.ts` — pure Entry → Note / Create mappers.
- `lib/federation/publish.ts` — outgoing-activity stub (builds, doesn't deliver).
- `app/.well-known/webfinger/route.ts` — discovery endpoint.
- `app/.well-known/nodeinfo/route.ts` — NodeInfo pointer.
- `app/nodeinfo/2.0/route.ts` — NodeInfo 2.0 document.
- `app/users/[handle]/route.ts` — actor document.
- `app/users/[handle]/inbox/route.ts` — inbound activities (Follow, Undo).
- `app/users/[handle]/outbox/route.ts` — paginated public posts.

## Provisioning the keys

The actor signs activities with an RSA 2048-bit key pair. The public half ships in the actor document; the private half stays in environment variables. The actor route returns 503 with a pointer to this doc when the env vars are missing.

Generate the pair once on a trusted machine:

```bash
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in private.pem -out public.pem
```

Then set both in Vercel (Project → Settings → Environment Variables):

- `FEDIVERSE_ACTOR_PUBLIC_KEY` — paste the contents of `public.pem`.
- `FEDIVERSE_ACTOR_PRIVATE_KEY` — paste the contents of `private.pem`.

Vercel's UI mangles real newlines in env values; the reader in `lib/federation/actor.ts` accepts either real newlines or `\n` escapes, so either paste form works.

Rotate by generating a new pair, updating both env vars in the same deploy, and accepting that followers will need to refetch the actor doc before signed activities verify again.

## Manual smoke test

Once keys are provisioned:

```
curl -i 'https://holoflow.co.uk/.well-known/webfinger?resource=acct:studio@holoflow.co.uk'
curl -i -H 'accept: application/activity+json' https://holoflow.co.uk/users/studio
curl -i -H 'accept: application/activity+json' https://holoflow.co.uk/users/studio/outbox
curl -i -H 'accept: application/activity+json' 'https://holoflow.co.uk/users/studio/outbox?page=1'
```

From a Mastodon account, search for `@studio@holoflow.co.uk` and the actor should appear with the entries on the profile. Following works (Follow lands in the inbox) but the studio won't push new Creates yet — that's the next chunk of work.

## What's stubbed for the next pass

- **HTTP signature verification on the inbox.** Currently any POST gets a 202. The verification routine needs to fetch the sender's actor doc, pull `publicKey.publicKeyPem`, and verify per draft-cavage-http-signatures-12 (the Mastodon flavour).
- **Follower persistence.** The inbox handler doesn't store who followed. Needs a small KV-backed store (Upstash Redis is already a dependency) keyed by actor id with the inbox URL alongside.
- **Accept on Follow.** A successful Follow should trigger a signed Accept activity to the follower's inbox.
- **Outbound HTTP signing.** `publishCreate` builds the right Create activity but doesn't sign or deliver. Wire `keys.privateKeyPem` into a signing routine over (request-target), host, date, digest.
- **Publish hook.** Once delivery works, call `publishCreate(entry)` at the moment a new entry lands — most sensibly from a content-tooling script rather than per-request.
- **Followers / following collections.** The actor doc advertises `/users/studio/followers` and `/users/studio/following` URLs, but those routes don't exist yet.
