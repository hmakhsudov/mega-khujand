---
name: MEGA KHUJAND
description: Sales site for a light-stone residential complex on the Syr Darya embankment; the building itself is the interface.
colors:
  paper: "#F4EFE5"
  sand: "#EAE2D4"
  card: "#F9F5EC"
  well: "#EFE8DA"
  field: "#FCFAF5"
  line: "#DCD2C0"
  line-2: "#E2D9C7"
  line-3: "#E7DFCE"
  line-ctl: "#D8CEBB"
  ink: "#1A1815"
  ink-hover: "#2F2A23"
  ink-2: "#4C463C"
  ink-3: "#5F574B"
  bronze: "#9C7A4D"
  bronze-ink: "#7A5C33"
  bronze-2: "#C9A97E"
  night: "#100F0C"
  night-2: "#141310"
  pine-top: "#255043"
  pine: "#1C4034"
  pine-deep: "#163329"
  gold: "#D2AE79"
  lit-window: "#F2DFB6"
  sale-fill: "#E9D6B3"
  sale-ink: "#553C1B"
  danger: "#9A3A24"
typography:
  display:
    fontFamily: "Prata, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.3rem, 5.6vw, 5rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Prata, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.1rem, 4.4vw, 4.1rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.018em"
  title:
    fontFamily: "Prata, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(1.45rem, 2.4vw, 2.3rem)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.014em"
  body:
    fontFamily: "Manrope, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "lnum"
  lead:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "clamp(15px, 1.15vw, 17.5px)"
    fontWeight: 400
    lineHeight: 1.68
  numeric:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "clamp(18px, 1.4vw, 21px)"
    fontWeight: 600
    lineHeight: 1.14
    letterSpacing: "-0.015em"
    fontFeature: "lnum, tnum"
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.22em"
  control:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "14.5px"
    fontWeight: 600
    lineHeight: 1
rounded:
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "22px"
  xl: "24px"
  pill: "999px"
spacing:
  gutter: "clamp(18px, 3.4vw, 54px)"
  section: "clamp(66px, 11vh, 150px)"
  card-pad: "20px"
  stack-sm: "16px"
  gap-grid: "clamp(12px, 1.3vw, 18px)"
components:
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "52px"
  button-dark-hover:
    backgroundColor: "{colors.ink-hover}"
    textColor: "{colors.paper}"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "52px"
  button-line-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-soft:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "52px"
  button-light:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "52px"
  segment:
    backgroundColor: "#EDE6D9"
    textColor: "{colors.ink-3}"
    rounded: "14px"
    padding: "5px"
  segment-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "10px"
    height: "38px"
  chip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "44px"
  chip-selected:
    backgroundColor: "rgba(201,169,126,.16)"
    textColor: "{colors.ink}"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 15px"
    height: "50px"
  lot-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "20px"
  form-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "clamp(22px, 2.6vw, 34px)"
  service-card:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.paper}"
    padding: "clamp(130px, 19vh, 200px) clamp(22px, 2.4vw, 40px) clamp(34px, 5vh, 58px)"
  status-free:
    backgroundColor: "rgba(201,169,126,.16)"
    textColor: "{colors.bronze-ink}"
    rounded: "15px"
    height: "30px"
  status-sale:
    backgroundColor: "{colors.sale-fill}"
    textColor: "{colors.sale-ink}"
    rounded: "15px"
    height: "30px"
---

# Design System: MEGA KHUJAND

## Overview

**Creative North Star: "The House Read by Its Evening Light"**

The site is built from the building's own materials: cream limestone grounds, sand-coloured alternating scenes, graphite ink, a single bronze accent, and night renders whose lit windows are the only warm glow. A buyer reads the project through its stone, arches and windows, and picks a flat on the facade or the availability grid rather than in a spreadsheet. The system refuses the category's dark "luxury void" as a default ground (night appears only as closing bands, the plan box and the evening theme) and refuses the generic listing grid as the main way in.

Density moves with the job. Persuade scenes on the home page are slow, full-bleed and pinned, with large Prata headlines and photographs cut into organic river, bend, lens and arch silhouettes. Operate surfaces (catalog, flat page, building grid, facade picker) are calm and tight: 1px warm rules, tabular numerals, pill and segmented controls, cards on cream. A drifting foliage-shadow layer (multiply blend) sits behind every page, so even the dense surfaces feel like they stand in a courtyard.

**Key Characteristics:**
- Cream stone and sand grounds; graphite for text and primary actions; bronze as the only accent.
- Prata 400 for every display line; Manrope for everything else, with tabular lining numerals wherever a number is compared.
- Real renders cut by organic clip-path masks (river, bend, lens, arch), never boxed in hard rectangles on Persuade scenes.
- Pill buttons, segmented controls and 1px warm rules; depth from tone, with warm diffuse shadows only on lifted or floating elements.
- Night renders close the story, always carrying a light form card.
- One rAF-driven scroll loop; pinned scenes only at 900px and up, never under reduced motion.

## Colors

A warm, low-chroma stone palette with one metal accent and two deliberate dark worlds (night and pine).

### Primary
- **Graphite Ink** (ink): the headline and primary-action colour. Filled pill buttons, selected segments, checked options, active table rows. Hover deepens to Warm Graphite (ink-hover).

### Secondary
- **Weathered Bronze** (bronze): lines, fills and progress only: the eyebrow rule, range-slider fill, availability bar, service rail, active chapter segment, selected plan thumbnail, focus-ring glow on inputs. It is 3.1 to 3.8:1 on the light grounds, so it never carries text.
- **Bronze Ink** (bronze-ink): the only bronze allowed as text. Lot areas, current nav item, link hover, available status, chapter numbers, focus outline (2px, 3px offset).
- **Pale Bronze** (bronze-2): outlines of active and hovered controls (chips, segments, lot cards, section buttons, free cells on the grid). Its 16% tint is the selected-state fill.

### Tertiary
- **Pine** (pine-top to pine to pine-deep, top-to-bottom gradient): the service cards only. **Pavilion Gold** (gold) draws their line icons and the diamond ornament; body copy on pine is a pale sage.
- **Night** (night, night-2): closing lead bands, the contact finale, footer, the dark plan box on the flat page, and shades over renders. Text on night uses paper at 100/82/68% opacity.
- **Lit Window** (lit-window): the evening theme of the building grid, where available cells glow like windows (soft 12 to 14px bloom) and sold cells fade into the dark facade.

### Neutral
- **Cream Stone** (paper): the page ground and the default scene.
- **Sand** (sand): alternating scenes (atmosphere, plans, panorama, picker stage, 3D stage) and embed placeholders.
- **Card Linen** (card): cards, panels, sidebars, drawers, sticky bar, the lead form card.
- **Plan Well** (well): the recessed ground behind floor plans and plan thumbnails.
- **Field White** (field): text inputs and option pills inside forms.
- **Warm Rules** (line, line-2, line-3, line-ctl): 1px dividers from strongest to faintest; line-ctl borders form controls.
- **Ink 2** (ink-2): running body copy and leads.
- **Ink 3** (ink-3): secondary text, meta, labels, placeholders for UI state. Chosen to hold at least 4.5:1 on every light ground (5.5:1 on sand, 6.5:1 on card).
- **Sale Parchment** (sale-fill with sale-ink): discounted-lot tags, statuses and grid cells. **Danger** (danger): field errors and the form alert only.

### Named Rules
**The Bronze Speaks Through Ink Rule.** Bronze (#9C7A4D) draws lines and fills; any bronze-coloured word uses bronze-ink. If a new bronze element carries text, it is bronze-ink or it is wrong.

**The Retired Greys Rule.** The earlier greys (#9A9083, #A79B84, #8A8073) failed contrast and are retired. Secondary text is ink-3; there is no lighter text grey on light grounds.

**The Night Is a Close Rule.** Night grounds end a story (lead band, contact finale, footer) or frame a drawing (plan box). A light scene is the default; a night section always carries either a real render or a light form card.

## Typography

**Display Font:** Prata 400 (self-hosted, latin + cyrillic), with Georgia and Times New Roman
**Body Font:** Manrope variable 200 to 800 (self-hosted, latin + cyrillic), with system-ui

**Character:** A high-contrast, stone-cut Didone-like serif for names and promises, set against a clean geometric sans that does the operating work. Prata is only ever used at weight 400; emphasis comes from size, not weight.

### Hierarchy
- **Display** (Prata 400, clamp(2.3rem, 5.6vw, 5rem), 0.98): inner-page titles; the hero h1 runs clamp(1.9rem, 3.4vw, 3.6rem) under the wordmark; the service title reaches 6rem at 0.94.
- **Headline** (Prata 400, clamp(2.1rem, 4.4vw, 4.1rem), 1.05, -0.018em): section headlines, balanced wrap. A step down (clamp(1.8rem, 3.6vw, 3.2rem)) serves lead-band and chapter headlines.
- **Title** (Prata 400, clamp(1.45rem, 2.4vw, 2.3rem), 1.12): form-card titles, drawer lot numbers, service card names, lot type (19px on cards). Big figures in stats and free-lot counts are also Prata, with lining numerals.
- **Body** (Manrope 400, 16px, 1.6): running copy. Leads are 15 to 17.5px at 1.68, capped at 48ch; chapter copy caps at 38ch.
- **Numeric** (Manrope 600 to 700, tabular lining): prices, areas, floors, spec values, table cells. Prices never go in Prata except the picker's selected price.
- **Label** (Manrope 600, 11px, 0.14 to 0.22em, uppercase, ink-3): form group names, spec terms, table headers, status pills.
- **Control** (Manrope 600, 13 to 15px): buttons, segments, options.

### Named Rules
**The Tabular Figures Rule.** Every number a buyer compares (price, price per m², area, floor, lot count in a list) sets in lining tabular numerals. Body copy keeps lining proportional numerals.

**The Sixteen-Pixel Field Rule.** Any text input, select or range box is at least 16px on touch widths, so iOS never zooms the form.

## Layout

A fluid gutter (clamp(18px, 3.4vw, 54px)) holds every page edge; there is no fixed max-width container on Persuade scenes, which run full-bleed. Sections breathe on a viewport-relative rhythm (clamp(66px, 11vh, 150px) top and bottom). Section heads and two-column scenes use auto-fit grids with a 300 to 340px minimum, so they fold to one column without breakpoint code. Lot lists auto-fill at a 290px minimum (250px for "similar").

Home-page scenes pin at 900px and up: the hero (250vh), atmosphere chapters (330vh), panorama (130vh) and infrastructure (460vh) use sticky stages driven by one requestAnimationFrame scroll loop. Below 900px and under reduced motion they become ordinary stacked sections. Operate pages use a side panel plus a main board (building grid: 260 to 320px sticky side; picker: 290 to 370px list), collapsing to one column at 980px and 900px. The header nav folds into a full-screen dialog menu below 1200px; on the home page a floating glass pill nav appears once the hero is passed.

Touch targets are at least 44px everywhere; on coarse pointers segments and small chips grow to 44px and grid cells to 40px tall.

## Elevation & Depth

Depth is mostly tonal: cream, sand, card and well stack as four close values separated by 1px warm rules. Shadows are warm (rgb 60,52,38), diffuse and reserved for things that lift or float: a hovered lot card, the floating pill nav and sticky bar, the drawer, the picker frame, a hovered grid cell. On night grounds the form card takes a deeper black shadow. A second depth plane is atmospheric: the foliage layer (six blurred radial blobs, multiply, 26% opacity, 17% on mobile) drifts behind all content on 40 to 62s loops.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 18px 50px rgba(60,52,38,.16)`): pill nav, sticky price bar.
- **Lift** (`box-shadow: 0 16px 36px rgba(60,52,38,.1)`): hovered lot card, together with a 3px rise.
- **Stage** (`box-shadow: 0 24px 60px rgba(60,52,38,.24)`): the facade picker frame.
- **Drawer** (`box-shadow: -30px 0 80px rgba(60,52,38,.24)`): side lot drawer.
- **Form on night** (`box-shadow: 0 30px 80px rgba(0,0,0,.34)`): light form card over a night render.
- **Window glow** (`box-shadow: 0 0 14px rgba(242,223,182,.55)`): available cells in the evening grid.

### Named Rules
**The Flat at Rest Rule.** Cards, panels and boards are flat at rest, separated by tone and a 1px rule. A shadow appears only when something floats (nav, bar, drawer, picker) or responds to a pointer.

## Shapes

Two shape languages meet. UI is soft and rounded: pill buttons and nav (999px), segmented controls with nested radii (14 outer, 10 inner; 26 and 21 in pill variants), 12px fields and chips, 18px lot cards, 22px boards and sidebars, 24px form cards, embeds and plan boards. Photography is organic: renders are clipped by four objectBoundingBox paths defined once per page (river: a wavy band for wide landscape shots; bend: a softly warped rectangle for inner-page headers and chapter images; lens: an irregular oval for inset details and the 404; arch: one sweeping curve across the top of the whole service card row). Rules are 1px, warm, and never dashed.

## Components

### Buttons
Quiet, weighty pills that change colour, never shape.
- **Shape:** full pill (999px); 52px tall, 42px small, 56px large.
- **Primary (dark):** graphite fill, cream text, 600 weight; hover deepens to warm graphite with a soft 26px shadow; press drops 1px.
- **Line:** 1px graphite outline, fills graphite on hover. **Soft:** card fill, warm rule outline, pale bronze outline on hover. **Light:** cream fill for night grounds. **Glass:** translucent cream outline on renders.
- **In the hero:** after the fly-through the dark button inverts to cream and the line button to a cream outline; colour transitions run 0.6s.
- **Link arrow:** 14px 600 text with a ringed 30px icon, 44px tall; the ring turns bronze on hover.

### Segmented controls and chips
- **Segment:** a recessed tray (#EDE6D9, 1px border, 5px padding) of 38px buttons; the selected button fills graphite with cream text. Pill and glass variants float over renders with a 12px blur.
- **Chip (filter toggle):** 44px, 12px radius, card fill, ink-3 text, with a 16px check box. Selected: pale bronze outline, 16% bronze tint, check box fills bronze-ink.
- **Tag:** 12px, 8px radius, line-2 outline. Accent tags use the bronze tint; sale tags use sale parchment.
- **Status pill:** 30px, uppercase 11.5px label with a 7px dot; free is bronze-ink on tint, sale is sale-ink on parchment.

### Cards / Containers
- **Lot card:** 18px radius, card fill, line-2 border, 20px padding. Prata type name with a bronze-ink area at top right, meta line, plan drawing on a centred stage, tags, then a ruled footer with a tabular price and a round favourite toggle. Hover: pale bronze border, 3px rise, lift shadow. Reserved lots dim to 62%. The whole card is one link via a stretched pseudo-element.
- **Price card, spec tiles, spec grid:** card fill, line-2 border, 14 to 18px radius; uppercase label over a 600-weight tabular value.
- **Plan box:** night-2 ground, bronze-tinted rules and tags; the one dark card on light pages.
- **Board and side panel:** card fill, 22px radius, 1px line.

### Inputs / Fields
- **Style:** 50px, field-white fill, line-ctl 1px border, 12px radius, 16px 500 text.
- **Focus:** border turns bronze with a 3px bronze glow (22%) and the fill goes white. Global focus-visible is a 2px bronze-ink outline at 3px offset (a pale gold outline on night).
- **Error:** danger border with a 12% danger ring; message below in 12.5px danger text; form-level alert on a danger tint.
- **Option pills (channel choice):** 40px, 20px radius, field fill; checked fills graphite.
- **Range slider:** two tabular number boxes over a 2px track with a bronze fill and 22px cream thumbs outlined in graphite.

### Navigation
- **Header:** brand in 11.5px tracked caps, centred 13.5px nav, phone and a small dark CTA at the end; current item in bronze-ink; 1px bottom rule. Over the hero it floats transparent and hides during the fly-through.
- **Mobile menu:** full-screen dialog on cream; Prata links (1.55 to 2.2rem) on faint rules with tracked caps counters.
- **Floating pill (home):** glass cream capsule, 16px blur, float shadow; rises from the bottom after the hero; active link on 22% bronze tint; on narrow screens only the CTA and a menu button remain.
- **Sticky bar (flat page):** the same glass capsule with price and actions.

### Wordmark Cut-Out Hero (signature)
A full-bleed cream field with MEGA KHUJAND set in Prata (198px in the SVG, scaled to aspect) as a mask, the night render showing through the letters. Scrolling scales the letters up to 16 times until the camera flies through them into the full render; a shade fades in and the bottom band (h1, subline, handover date, two actions) inverts to cream. Under reduced motion the stage does not pin; the final state is shown.

### Service Cards (signature)
A horizontally snapping row of tall pine cards (pine-top to pine-deep gradient), three to a view on desktop and 84% wide on mobile, cut along the top by the single arch curve. Each carries a gold line icon, a Prata name, a gold rule-diamond-rule ornament, sage copy and a Prata index number. A bronze progress rail and round prev/next buttons (next in graphite) sit below.

### Night Close with Form Card (signature)
A night render at 46% under a left-to-right night gradient; Prata headline and contact rows (48px, cream rules) on the left, a light card-linen form card (24px radius) on the right, stacking on narrow screens. The home contact finale is the same band at full viewport height.

### Availability Grid (signature)
Floors by stacks as 34px cells with 7px radius: available is cream with a pale bronze border, discounted is solid pale bronze, reserved is a bronze hatch, sold is a flat sand block with hidden text. The evening theme turns the board dark and the available cells into lit windows with a warm glow. Arrow, Home/End and PageUp/PageDown move focus; a side drawer opens the lot.

### Facade Picker (signature)
Calibrated polygons over the real render (day and dusk). Day polygons multiply bronze gradients into the facade; dusk polygons screen a warm window glow. Filtering desaturates the render and darkens non-matching windows; the hovered window lifts 3px with a stronger stroke. A glass tooltip, a glass legend and a card-linen list panel complete it.

### Eyebrow Section Label (open decision)
Tracked uppercase 11px bronze-ink text preceded by a 26px bronze rule. It names sections on the home page (architecture, atmosphere, infrastructure, plans, contacts) by the user's explicit request. It conflicts with the craft floor, which bans eyebrows, and the decision is still open with the user. It is recorded so the current build can be read, not as a pattern to extend: do not add eyebrows to new sections or new pages.

## Do's and Don'ts

### Do:
- **Do** keep cream (#F4EFE5) or sand (#EAE2D4) as the ground of every new scene; reach for night only to close a story or frame a drawing.
- **Do** set every compared number (price, area, floor, count) in Manrope with lining tabular numerals.
- **Do** colour bronze text with bronze-ink (#7A5C33) and keep bronze (#9C7A4D) for rules, fills and progress.
- **Do** use ink-3 (#5F574B) as the lightest text on light grounds.
- **Do** cut real renders with the river, bend, lens or arch masks on Persuade scenes, and label stock photos as stock.
- **Do** keep controls as pills and segmented trays with a graphite selected state and pale bronze (#C9A97E) hover and active outlines.
- **Do** keep touch targets at least 44px and form fields at 16px on touch widths.
- **Do** route new motion through the shared rAF scroll loop, pin only at 900px and up, and under reduced motion remove movement while keeping colour and opacity changes.

### Don't:
- **Don't** make a dark "luxury void" the default ground of a page.
- **Don't** use the retired greys (#9A9083, #A79B84, #8A8073) or any text lighter than ink-3 on light grounds.
- **Don't** set prices or data tables in Prata, or set Prata in any weight but 400.
- **Don't** add a second accent hue on light surfaces; pine and gold stay inside the service cards.
- **Don't** add shadows to cards at rest or use cool grey or black shadows on light grounds.
- **Don't** spread the eyebrow label to new sections or pages while its decision is open.
