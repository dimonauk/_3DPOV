# Photograph catalogue — seed release

Nine editions to launch the `photographs` collection. Copy corrected to
reflect the actual capture techniques: single long exposures of
persistence-of-vision LED arrays and traditional light painting,
without compositing.

## How to add these in Shopify

Two paths:

**(A) Bulk import** — upload `docs/holoflow-photographs.csv` via
Shopify admin → Products → Import. Creates all 9 products with their
27 variants in one pass. After import, open each product and upload
the actual high-res image as media (the CSV doesn't include images).
Publishing to "Holo-Flow Web" channel is automatic because
`Published: TRUE` in the CSV.

**(B) Manual** — paste each block below into a new product in Shopify
admin. Slower but easier to tweak per product. Either way, the tag
list is what drives the gallery, the edition info panel, and the field
record — so copy the tags exactly.

## Common fields (apply to every product)

- **Vendor**: Holo-Flow Studio
- **Product type**: Photograph
- **Status**: Active
- **Collections**: the `Photographs` collection (auto-assigned via the `photo-print` tag when the collection is set to `tag equals photo-print`)
- **Publishing**: tick **Online Store** and **Holo-Flow Web**
- **Inventory tracking**: untick "Track quantity" (editions are enforced by edition-number line in description + manually marking sold-out)
- **Variants**: three per product — A3 Hahnemühle Photo Rag, A2 Hahnemühle Photo Rag, A2 Canson Baryta (use the prices below)

## Tag vocabulary

Tags drive everything — the collection, the edition-info panel, the field record metadata. Use them consistently.

| Tag                  | Effect                                                                     |
| -------------------- | -------------------------------------------------------------------------- |
| `photo-print`        | product joins the `photographs` collection and gets the edition info panel |
| `edition-NN`         | declares edition size (`edition-25` → "Edition of 25 + 2 AP")              |
| `method-traditional` | technique label: "Traditional light painting"                              |
| `method-led-pov`     | technique label: "Persistence-of-vision LED array"                         |
| `method-drone-led`   | technique label: "Drone-mounted LED system"                                |
| `loc-SLUG`           | field record location (hyphens to spaces, auto-titled)                     |
| `hour-HH-MM`         | field record hour (`hour-23-14` → "23:14")                                 |
| `date-YYYY-MM-DD`    | field record date (auto-formatted)                                         |

A product can carry multiple method tags if it combines techniques (common in mixed exposures).

---

## 01 — Pass I — Valley Under Moving Cloud

- **Handle**: `pass-i-valley-under-moving-cloud`
- **Tags**: `photo-print, edition-25, method-traditional, method-led-pov, pass, landscape`
- **Description**:

> Three lit passes along a stretch of open ground, a sky that refused
> to hold still. The pixel-green trail on the left is a
> persistence-of-vision LED array's outbound arc — one column of image
> data rendered per frame as the rig moved. The orange fire-tipped loop
> on the right is the return, made with traditional fire poi. Between
> them, a valley that carried the weight of one long gesture before the
> clouds took it back.

- **Variants**:
  - A3 · Hahnemühle Photo Rag 308 — **£180**
  - A2 · Hahnemühle Photo Rag 308 — **£320**
  - A2 · Canson Infinity Baryta Prestige II 340 — **£360**

---

## 02 — Corona I — Twenty Revolutions, In Registration

- **Handle**: `corona-i-twenty-revolutions`
- **Tags**: `photo-print, edition-30, method-led-pov, corona, ring`
- **Description**:

> Twenty revolutions of a magenta persistence-of-vision LED array, each
> column of image data programmed ahead and written into physical space
> by the rig's rotation. Held against the same horizon across the whole
> exposure. What the camera captured in one frame is twenty iterations
> of the same pattern, physically present as light for the duration of
> the shutter. No compositing. The ring is what it looks like to stand
> inside the studio's rig when it is running hot and true.

- **Variants**:
  - A3 · Hahnemühle Photo Rag 308 — **£160**
  - A2 · Hahnemühle Photo Rag 308 — **£300**
  - A2 · Canson Infinity Baryta Prestige II 340 — **£340**

---

## 03 — Corona II — Fourteen Petals, Dusk

- **Handle**: `corona-ii-fourteen-petals`
- **Tags**: `photo-print, edition-30, method-led-pov, corona, ring`
- **Description**:

> A looser variant of the Corona protocol. Fourteen passes of the same
> persistence-of-vision LED array, the rig held less rigidly — lamps
> drifting a degree off-plane each revolution. What's lost in symmetry
> is given back in flame. The magenta field behind the ring is
> long-exposure bleed from the rig's idle frames, not compositing.

- **Variants**: same as Corona I.

---

## 04 — Field Record IV — Grid Convergence, City Edge

- **Handle**: `field-record-iv-grid-convergence`
- **Tags**: `photo-print, edition-25, method-led-pov, method-traditional, field-record, urban, manchester`
- **Description**:

> Two light-painting techniques overlaid in a single exposure. The teal
> lattice on the ground is a persistence-of-vision LED array carried
> low, parallel to the turf, rendering a pre-programmed grid pattern
> column by column as the rig moved. The pink halos overhead are
> traditional hand-held LED wand passes. Both techniques live in the
> same photograph because both happened in the same seventeen-second
> exposure. The towers on the far horizon place you on the Manchester
> perimeter at around 23:00.

- **Variants**:
  - A3 · Hahnemühle Photo Rag 308 — **£180**
  - A2 · Hahnemühle Photo Rag 308 — **£320**
  - A2 · Canson Infinity Baryta Prestige II 340 — **£360**

---

## 05 — Gathering I — Festival, Early Hours

- **Handle**: `gathering-i-festival-early-hours`
- **Tags**: `photo-print, edition-15, method-led-pov, festival, gathering`
- **Description**:

> The rings are kata. The small figures standing inside them are not
> composited — they are image data, programmed frame by frame into a
> persistence-of-vision LED array, rendered into physical space by the
> rig's pass during the exposure. For the duration of the shutter, the
> figures were physically present as light in the same field as the
> camera. When the shutter closed, only the photograph remained. The
> rings and the figures were captured whole, in one frame, at the edge
> of a festival dawn.

- **Variants**:
  - A3 · Hahnemühle Photo Rag 308 — **£220**
  - A2 · Hahnemühle Photo Rag 308 — **£380**
  - A2 · Canson Infinity Baryta Prestige II 340 — **£420**

---

## 06 — Burst I — Deceleration, Open Ground

- **Handle**: `burst-i-deceleration`
- **Tags**: `photo-print, edition-25, method-led-pov, burst, kata-interrupted`
- **Description**:

> A persistence-of-vision LED array decelerating through the end of a
> revolution. The pixelated rain on the left is the rig writing one
> column of image data per millisecond as it slowed — time made
> visible as a spatial gradient. The camera didn't catch the gesture;
> it caught the braking.

- **Variants**:
  - A3 · Hahnemühle Photo Rag 308 — **£180**
  - A2 · Hahnemühle Photo Rag 308 — **£320**
  - A2 · Canson Infinity Baryta Prestige II 340 — **£360**

---

## 07 — Instrument I — The Rig Visible

- **Handle**: `instrument-i-the-rig-visible`
- **Tags**: `photo-print, edition-20, method-led-pov, instrument, panoramic, 360`
- **Description**:

> A 360° capture of a single long revolution of the studio's
> persistence-of-vision LED rig, taken from ground level looking up.
> The pink band is the rig's own arc-trace through the sky; the
> orange is where the LEDs warmed on the way back down. The small
> object in the foreground is the rig's controller unit, deliberately
> left in frame. The one photograph in the series that documents the
> apparatus as well as its output.

- **Variants**:
  - A3 · Hahnemühle Photo Rag 308 — **£220**
  - A2 · Hahnemühle Photo Rag 308 — **£380**
  - A2 · Canson Infinity Baryta Prestige II 340 — **£420**

---

## 08 — Crossing I — Two Hands, One Exposure

- **Handle**: `crossing-i-two-hands`
- **Tags**: `photo-print, edition-20, method-led-pov, method-traditional, crossing, duet`
- **Description**:

> Two techniques, one exposure. The red and cyan burst on the left is
> a persistence-of-vision LED array caught mid-revolution. The bright
> white arc on the right is a traditional hand-held wand passing
> through the frame at the same moment. They look unrelated. They
> were executed within arm's reach of each other, in the same dark,
> in the same breath. Two lineages of light painting holding hands
> across one photograph.

- **Variants**:
  - A3 · Hahnemühle Photo Rag 308 — **£200**
  - A2 · Hahnemühle Photo Rag 308 — **£350**
  - A2 · Canson Infinity Baryta Prestige II 340 — **£390**

---

## 09 — Firebird — Foreshore at Low Tide

- **Handle**: `firebird-foreshore-low-tide`
- **Tags**: `photo-print, edition-15, method-traditional, coastal, figure-eight, firebird`
- **Description**:

> Traditional light painting, performed against a low-tide beach at
> early dusk. Two hand-held LED wands running staggered colour
> programs — red on one, green on the other — in a sustained
> figure-eight kata. The bird shape is not a design. It is what the
> figure-eight draws when the sand is flat enough to be an accomplice
> and the weather is willing to hold. The head faced the sun.

- **Variants**:
  - A3 · Hahnemühle Photo Rag 308 — **£240**
  - A2 · Hahnemühle Photo Rag 308 — **£400**
  - A2 · Canson Infinity Baryta Prestige II 340 — **£440**

---

## After import — checklist

1. Create the `Photographs` collection in Shopify, handle
   `photographs`, type **Automated**, condition **"Product tag equals photo-print"**, publishing tick **Holo-Flow Web**.
2. For each product, upload the full-resolution image from your local
   archive (the iPad uploads into the chat are compressed previews —
   do not use those for print).
3. Set real field-record tags per product (`loc-…`, `hour-…`,
   `date-…`) from your shoot logs — the descriptions above reference
   time and place; keep the metadata honest.
4. Visit `/photographs` and `/product/<handle>` to verify rendering.
5. When an edition sells through, mark the product **Out of stock** →
   the tile still shows but with a "Sold out" label. Do not re-open
   the edition. Do not reprint.
