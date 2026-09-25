---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["flats.html","flat.html","building.html","picker.html","facade-3d.html"]
---

# MEGA KHUJAND — sales site (production build of the approved references)

## Scope and mode
Six static pages, plain HTML + css/site.css + vanilla JS, no build step. Established world: the approved `.dc.html` references (now in `design-reference/`) are the visual authority; this build keeps their language and raises hierarchy, conversion, data truth, accessibility and performance. No variants.
- `index.html` — Persuade. `flats.html`, `building.html`, `picker.html` — Operate. `flat.html` — Operate with a Persuade close. `facade-3d.html` — Experience, embedded in home.

## Audience, job, action
Local Khujand families first; returnees and local professionals on the same paths. Job: understand the project, find a specific flat, talk to a person. Action: lead form (name, +992 phone, call / WhatsApp / Telegram / showroom visit, optional lot), phone.

## Page plans (what each block does for the buyer)
- Home: hero names the place and the promise and offers "Выбрать квартиру" + "Записаться на показ" at first paint; architecture proves material and gives the handover date; stats are computed from data.js and end in a live "в продаже" line with a catalog link; 3D fragment is click-to-load; facade picker embed lets a buyer point at a window; atmosphere / panorama / infrastructure sell the courtyard, river and daily life (stock photos labelled); plans show real counts and price-from per type and deep-link to the filtered catalog; service is placeholder copy; contacts close with the form.
- Catalog: filters (rooms, price, area, floor, building, finish, terrace / river / corner / free, favourites), cards and rows, empty state, URL-synced state.
- Flat: status, price, plan, specs, room areas, similar lots, lead form with this lot prefilled, sticky bar; invalid id → recovery page.
- Building grid: keyboard grid (arrows / Home / End / PageUp / PageDown), drawer dialog, same lots as everywhere.
- Picker: facade polygons from the same lots; arrow-key navigation; "Забронировать" → `flat.html?id=…#lead`.

## Direction contract
THESIS: The building itself is the interface — a buyer reads the project through its own light stone, arches and lit windows, and picks a flat on the facade, not in a spreadsheet. Refuses the category's dark "luxury void" and the generic listing grid.
OWN-WORLD: Cream stone #F4EFE5 and sand #EAE2D4 grounds, graphite #1A1815 ink and actions, bronze #9C7A4D / #7A5C33 as the only accent, pine-green service cards, night renders for closes. Prata display, Manrope UI with tabular numerals. Organic river / bend / lens masks on photographs, a drifting foliage-shadow layer, pill controls, 1px warm rules.
STORY: See the house at night through its name → trust the material and the date → see what is on sale and at what price → point at a window → leave a request for that flat.
FIRST VIEWPORT: Full-bleed cream field with MEGA KHUJAND cut out of it in Prata, the night render glowing through the letters; bottom band: h1 "Дом, который узнают по вечернему свету" + subline left, handover date and the two actions right (primary "Выбрать квартиру"). Scrolling flies through the letters into the full render; the same h1 and actions stay, inverted to cream.
FORM: Incumbent composition from the approved references (established world, user pinned "no variants"); no concept roll — seed: none (established-world extension).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open decisions
All project facts are placeholders (PRODUCT.md); lead endpoint not connected; site URL for canonical / OG unknown.
