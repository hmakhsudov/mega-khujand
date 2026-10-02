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

**Terminology:** the site names flat types by room count as the developer's sheets do (1-комнатная = kitchen + one living room; 2-комнатная = kitchen + living room + bedroom), never by bedroom count. ЖК (residential complex); корпус (building); секция (section); стояк (a vertical stack of flats in the same position, one per floor); этаж (floor); шахматка (availability grid by stack and floor); лот (flat for sale); комнатность (room count: студия, 1, 2, 3, пентхаус); отделка (finish: без отделки, предчистовая, с отделкой — bare shell, pre-finish, finished); lot statuses свободна, со скидкой, забронирована, продана (available, discounted, reserved, sold); сдача (handover).

## Brand Commitments

- Name: **MEGA KHUJAND**.
- Language: Russian.
- Voice (inferred from the approved design copy, not separately confirmed): calm, concrete and sensory; it speaks through light, stone, water and quiet ("Дом, который узнают по вечернему свету", "Тишина начинается сразу за аркой") rather than superlatives.

## Evidence on Hand

- **Real project renders**, in `media/renders/`: `facade-night-hero.jpg`, `facade-day-hero-plaza.jpg`, `facade-day-corner-detail.jpg`, `facade-night-dusk-elevation.jpg`, `retail-storefront-boutiques.jpg`, `retail-arcade-entrance.jpg`, `courtyard-playground-aerial-render.jpg`, `courtyard-playground-collage.jpg`. `aerial-river-2560.jpg` arrived with the redesign and its source is not confirmed.
- **Stock and mood photos**, in `media/*.jpg` at the top level: carried over from the first site and not of this project (the original design brief calls them stock). Never present them as MEGA KHUJAND.
- **Real floor plans**, in `media/plans/src/*.pdf`: the developer's plan sheets (ArchiCAD), 15 received: А-1…А-8 (typical floor 3–7) and Б-1…Б-7 (typical floor 3–6). Each series has its own typical floor with its own key plan, and every flat on both key plans has a sheet. The letter is the block (per the architect, Oct 2026). Blocks Б and В share the same typical floors; there are no В sheets, so the site shows Б and В together. Where the blocks stand relative to each other is not known. Each gives the plan code, room count (комнатность: "1-х/2-х комнатная"), total area including balconies, the numbered room schedule, the entrance, the flat's place on the typical-floor key plan, and a furnished 3D top view. Extracted by `tools/plans-extract.py` into `js/plans-data.js`; the sheets contain spelling slips (Гостинная, Спальная) that the site corrects.
- **Placeholder floor plans**, in `media/plans/*.svg`: generated, used only by the demo lots (catalog, grid, flat page) until lots carry real plan codes.
- **Facade calibration**, in `calibration/cal-FINAL.json`: maps the window grid on the renders. The lots assigned to those windows are placeholders.
- **Facade light**, from `tools/facade-light.py`: the dusk render rectified plane by plane, with hand-marked window columns (one per stack) and fitted floor rows. It yields a version of the render with the baked-in lit windows switched off, a transparent plate of warm interior light for every window, and `js/facade-light.js` (window quads and floor bands). The light is synthesised, not rendered by the architects; which flats it marks as free is placeholder data.
- **Plaster model of the typical floors**, from `tools/model-floor.py` → `tools/model-render.py` → `tools/model-pack.py`: one plate per typical floor (А, floors 3–7; Б, floors 3–6), with walls, windows, doors, balconies, stairs and lifts read from the vector key plans in the plan sheets, rendered in Blender (Cycles) as a white plaster model. Furniture follows the furnished 3D views in the same sheets and is placed by hand, so it is illustrative. All 15 flats are furnished and lit. Where the blocks stand relative to each other is not known, so the plates are shown as separate models ("Блок А · этажи 3–7", "Блоки Б и В · этажи 3–6"), never side by side and never labelled with a корпус.
- **Missing, and not to be invented:** the developer's name and profile, architects, testimonials, awards, press, construction progress, permits or legal documents, real prices, availability, handover date, phone number, showroom address, and messenger handles.

## Product Principles

1. **Families first.** The primary buyer is a Khujand household choosing where it will live. What a family needs to choose a flat (plan, room areas, floor, view, courtyard, price) comes before lifestyle gloss. Returnees and professionals are served on the same paths, not by separate ones.
2. **Lead with the honest edge.** The embankment, car-free courtyards, the managed building, and the stone-and-arch architecture carry the story. Do not claim anything that cannot be shown.
3. **No fabricated facts.** Until the sales team confirms them, every date, count, price, distance and service is a placeholder. Keep placeholders easy to swap and never add new figures or proof.
4. **The real building is the interface.** Flats are chosen on the building itself (facade picker, шахматка) and shown in real renders, not in stock imagery.
5. **Every path ends with a person.** Conversion means a call, a messenger chat, or a showroom visit about a specific flat, never a form that goes nowhere.
