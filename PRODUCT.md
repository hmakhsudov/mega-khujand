# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Plain static HTML, one shared `css/site.css` with the design tokens, and a small vanilla JS file per page; no framework and no build step (decided when the production build started; this replaces the earlier Astro choice). Pages: `index.html`, `flats.html`, `flat.html`, `building.html`, `picker.html`. All lot data comes from one file, `js/data.js`. Fonts are self-hosted. The 3D facade page was removed at the user's request. The original `.dc.html` design references live in `design-reference/`. Deploy target: not decided.

## Users

- **Primary: local Khujand families** moving up to a premium home in their own city. They can visit the showroom and see the site in person, and they choose a specific flat for a household that will live in it.
- **Secondary, lighter weight: diaspora returnees.** Tajiks working abroad who buy for their return, often deciding from a distance.
- **Secondary, lighter weight: local professionals** who want a prestige address by the river.

Investors buying to rent out are not a confirmed audience. The rental-management service in the designs is a placeholder, not a reason to target them.

## Product Purpose

The sales site for MEGA KHUJAND, a residential complex (ЖК) on the Syr Darya embankment in Khujand, Tajikistan. Buyers use it to understand the project (location, architecture, courtyards, service), browse and filter flats, find a flat on the building grid (шахматка) or directly on the facade render, and study a flat's plan and price. Success is a qualified conversation with sales about a specific flat: a phone call, a WhatsApp/Telegram chat, or a showroom visit.

## Positioning

Confirmed differentiators that other new buildings in Khujand cannot claim:

- **On the Syr Darya embankment**, with the river, promenade and park at the doorstep. The exact walking time in the designs ("5 minutes") is not verified.
- **Car-free private courtyards**: enclosed yards with gardens and play areas, and cars kept out.
- **A managed building**: concierge and building management, which is rare in the local market. Which services are offered is not confirmed; see Capabilities and Constraints.
- **Architecture and materials**: light stone facades, arched rhythm, deep balconies.

## Operating Context

- Sales happen through three channels: a phone call, a WhatsApp/Telegram chat with a sales manager, and an in-person showroom visit. The site's lead form (name, +992 phone, preferred channel, optional flat) asks the sales team to reach the buyer through one of those channels. Where the form submits is not decided yet (`leadEndpoint` in `js/data.js`); there is no CRM.
- Local families can come in person. Returnees abroad depend on the phone and messengers.
- Prices are in somoni (TJS, "смн").
- Lot data (availability, areas, prices, statuses) will come from the sales team. The source format (CRM export, spreadsheet) is not decided. The designs currently generate lots with a deterministic generator.

## Capabilities and Constraints

**Surfaces in the approved designs** (see `README.md` for the handoff notes):

1. Home: the lit model (available flats lit on the dusk facade), plans, materials, the site and courtyard legends, service, and contacts.
2. Flats catalog: filters for rooms, floor, area, price, building and finish; tile and row views; sorting.
3. Building grid (шахматка): корпус → секция → стояк → этаж, with lot statuses and penthouses on the top floor.
4. Flat page: plan, specifications, room areas, price, lead actions, similar flats.
5. Facade picker: flats highlighted as polygons over the real render, calibrated to the window grid in `calibration/cal-FINAL.json`, with day and dusk views.

**Constraints**

- Russian only. No Tajik or English versions are planned.
- Every «Оставить заявку» action leads to the lead form, which records the buyer's preferred channel (call, WhatsApp, Telegram, showroom visit). Until `leadEndpoint` is set, the form only simulates sending; it must be connected before launch.
- Legal notes in the designs must stay: «Изображения носят информационный характер» (images are for information only), areas are per the project and may differ from BTI measurements, and prices are preliminary and must be confirmed with sales.

**Placeholders.** Every project fact in the designs is unconfirmed and stays as it is for now. Future work must not present any of these as real or add new figures:

- handover date ("IV квартал 2026")
- building structure: 3 buildings, 9 sections and the lots generated from them in `js/data.js` (currently 832, of which 365 on sale), with their statuses and areas
- base price of ~9,400 TJS/m² and every price derived from it
- the six named services (24/7 concierge, rental management, cleaning, valet parking, storage, guest apartments)
- ceiling height ("от 3,1 м"), the walking distance to the river, flat counts
- phone number `+992 44 600 00 00`
- showroom location ("на набережной", on the embankment)

**Not built yet:** a real lot-data feed, a connected lead endpoint, and real messenger handles.

**Terminology:** ЖК (residential complex); корпус (building); секция (section); стояк (a vertical stack of flats in the same position, one per floor); этаж (floor); шахматка (availability grid by stack and floor); лот (flat for sale); комнатность (room count: студия, 1, 2, 3, пентхаус); отделка (finish: без отделки, предчистовая, с отделкой — bare shell, pre-finish, finished); lot statuses свободна, со скидкой, забронирована, продана (available, discounted, reserved, sold); сдача (handover).

## Brand Commitments

- Name: **MEGA KHUJAND**.
- Language: Russian.
- Voice (inferred from the approved design copy, not separately confirmed): calm, concrete and sensory; it speaks through light, stone, water and quiet ("Дом, который узнают по вечернему свету", "Тишина начинается сразу за аркой") rather than superlatives.

## Evidence on Hand

- **Real project renders**, in `media/renders/`: `facade-night-hero.jpg`, `facade-day-hero-plaza.jpg`, `facade-day-corner-detail.jpg`, `facade-night-dusk-elevation.jpg`, `retail-storefront-boutiques.jpg`, `retail-arcade-entrance.jpg`, `courtyard-playground-aerial-render.jpg`, `courtyard-playground-collage.jpg`. `aerial-river-2560.jpg` arrived with the redesign and its source is not confirmed.
- **Stock and mood photos**, in `media/*.jpg` at the top level: carried over from the first site and not of this project (the original design brief calls them stock). Never present them as MEGA KHUJAND.
- **Floor plans**, in `media/plans/*.svg`: generated placeholders, not real drawings. They are replaced one-for-one by filename.
- **Facade calibration**, in `calibration/cal-FINAL.json`: maps the window grid on the renders. The lots assigned to those windows are placeholders.
- **Missing, and not to be invented:** the developer's name and profile, architects, testimonials, awards, press, construction progress, permits or legal documents, real prices, availability, handover date, phone number, showroom address, and messenger handles.

## Product Principles

1. **Families first.** The primary buyer is a Khujand household choosing where it will live. What a family needs to choose a flat (plan, room areas, floor, view, courtyard, price) comes before lifestyle gloss. Returnees and professionals are served on the same paths, not by separate ones.
2. **Lead with the honest edge.** The embankment, car-free courtyards, the managed building, and the stone-and-arch architecture carry the story. Do not claim anything that cannot be shown.
3. **No fabricated facts.** Until the sales team confirms them, every date, count, price, distance and service is a placeholder. Keep placeholders easy to swap and never add new figures or proof.
4. **The real building is the interface.** Flats are chosen on the building itself (facade picker, шахматка) and shown in real renders, not in stock imagery.
5. **Every path ends with a person.** Conversion means a call, a messenger chat, or a showroom visit about a specific flat, never a form that goes nowhere.
