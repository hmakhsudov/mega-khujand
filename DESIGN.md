---
name: MEGA KHUJAND
description: The sales-office model under glass — graphite vitrine, plaster model, ink-cut plates, and a warm light only in the windows that can still be bought.
colors:
  room: "#121416"
  room-2: "#1A1D20"
  room-line: "rgba(238,240,238,.13)"
  room-line-2: "rgba(238,240,238,.26)"
  plaster: "#EEF0EE"
  plaster-2: "#E3E6E3"
  plaster-3: "#F7F8F7"
  line: "#C9CECB"
  line-2: "#D9DDDA"
  ink: "#121416"
  ink-2: "#3B4144"
  ink-3: "#596164"
  ink-tint: "rgba(18,20,22,.06)"
  led: "#FFD58A"
  led-deep: "#F2B85B"
  danger: "#A8391F"
typography:
  display:
    fontFamily: "Unbounded, 'Arial Black', system-ui, sans-serif"
    fontSize: "100px (SVG wordmark, fitted to the viewport)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-2px"
  headline:
    fontFamily: "Unbounded, 'Arial Black', system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3.5vw, 3.25rem)"
    fontWeight: 300
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  page-title:
    fontFamily: "Unbounded, 'Arial Black', system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 5vw, 4.4rem)"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Unbounded, 'Arial Black', system-ui, sans-serif"
    fontSize: "clamp(1.15rem, 1.7vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Manrope, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "lnum"
  figure:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.01em"
    fontFeature: "lnum, tnum"
  label:
    fontFamily: "Unbounded, 'Arial Black', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.14em"
  button:
    fontFamily: "Unbounded, 'Arial Black', system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.09em"
  key:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: 1.1
rounded:
  plate: "2px"
  machined: "3px"
  led: "50%"
spacing:
  gutter: "clamp(16px, 3.4vw, 56px)"
  header: "64px"
  section: "clamp(64px, 11vh, 140px)"
  key-gap: "6px"
  action-gap: "10px"
  card-inset: "18px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.plaster}"
    typography: "{typography.button}"
    rounded: "{rounded.machined}"
    padding: "0 26px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "#30363A"
    textColor: "{colors.plaster}"
  button-primary-dark:
    backgroundColor: "{colors.plaster}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.machined}"
    padding: "0 26px"
    height: "52px"
  button-primary-dark-hover:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.ink}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.machined}"
    padding: "0 26px"
    height: "52px"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.plaster}"
  button-soft:
    backgroundColor: "{colors.plaster-3}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.machined}"
    padding: "0 26px"
    height: "52px"
  button-soft-hover:
    backgroundColor: "{colors.ink-tint}"
    textColor: "{colors.ink}"
  key:
    backgroundColor: "{colors.plaster-3}"
    textColor: "{colors.ink-2}"
    typography: "{typography.key}"
    rounded: "{rounded.machined}"
    padding: "0 13px"
    height: "42px"
  key-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.plaster}"
  key-dark-pressed:
    backgroundColor: "{colors.plaster}"
    textColor: "{colors.ink}"
  plate:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.plaster}"
    typography: "{typography.label}"
    rounded: "{rounded.plate}"
    padding: "5px 11px"
    height: "28px"
  header-brand:
    backgroundColor: "transparent"
    textColor: "{colors.plaster}"
    height: "38px"
  header:
    backgroundColor: "{colors.room}"
    textColor: "{colors.plaster}"
    height: "64px"
  input:
    backgroundColor: "#FCFCFC"
    textColor: "{colors.ink}"
    rounded: "{rounded.machined}"
    padding: "0 14px"
    height: "50px"
  lot-card:
    backgroundColor: "{colors.plaster-3}"
    textColor: "{colors.ink}"
    rounded: "{rounded.machined}"
    padding: "18px"
  price-card:
    backgroundColor: "{colors.room}"
    textColor: "{colors.plaster}"
    rounded: "{rounded.machined}"
    padding: "clamp(18px, 2.4vw, 26px)"
  grid-cell-free:
    backgroundColor: "{colors.led}"
    textColor: "{colors.ink}"
    rounded: "{rounded.plate}"
    height: "34px"
  grid-cell-sale:
    backgroundColor: "{colors.led}"
    textColor: "{colors.ink}"
    rounded: "{rounded.plate}"
    height: "34px"
  render-pin:
    backgroundColor: "{colors.plaster-3}"
    textColor: "{colors.ink}"
    rounded: "{rounded.led}"
    size: "30px"
  render-pin-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.plaster}"
  legend-num:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.plaster}"
    rounded: "{rounded.led}"
    size: "26px"
  lift-readout:
    backgroundColor: "rgba(18,20,22,.88)"
    textColor: "{colors.plaster}"
    rounded: "{rounded.machined}"
    padding: "10px 14px 12px"
    width: "132px"
  facade-tag:
    backgroundColor: "{colors.plaster-3}"
    textColor: "{colors.ink}"
    rounded: "{rounded.machined}"
    padding: "12px 14px 13px"
    width: "210px"
---

# Design System: MEGA KHUJAND

## Overview

**Creative North Star: "The Model Under Glass"**

The site behaves like the sales-office model in its vitrine: a graphite room, a white plaster model of the building, ink-cut plates that name things, and a manager's switch that lights the windows still for sale. Every surface is either the room (dark graphite, where the building is shown at dusk) or the model (cool plaster white, where plans, figures and forms are read). The two alternate down the page; they never blend.

Light carries meaning, not mood. The only chromatic colour in the system is the warm window light, and it appears only where a flat can be bought: real interior light inside the glass of free flats on the switched-off dusk render, status dots, the dot on a pressed key, the free cells of the building grid. Everything that labels or commits is monochrome: ink on plaster, plaster on graphite. Nothing glows, nothing is gradated for atmosphere, nothing is a pill.

Form is machined rather than soft: 3px corners on anything that holds content, 2px on plates and tags, 1px engraved rules as the main structural device, and circles reserved for LEDs and numbered pins. Density is that of a sales tool: tabular figures, compact keys, lists ruled like a lobby directory. Motion is the vitrine being switched on: renders come up from dark, headings rise from under the plaster, rows and pins arrive in sequence, and the building's lights come on floor by floor. With reduced motion, everything is simply there.

**Key Characteristics:**
- Two materials only: graphite room (#121416) and plaster model (#EEF0EE), alternating by section.
- One chromatic colour: warm window light, which means "available" and nothing else.
- Commitment is monochrome: buttons, plates, pins and badges are ink on plaster and plaster on graphite.
- Unbounded wide caps for plates, labels and buttons; Unbounded Light for headlines; Manrope for reading and every number.
- Machined 3px corners, 1px rules, circular LEDs; no pills, no gradients, no glow.
- Keys with an LED dot are the single on/off control across filters, form options and consoles.

## Colors

A cool, near-neutral pair of graphite and plaster that does all the naming and committing, with a single warm light that does all the signalling.

### Primary
- **Window LED** (#FFD58A): the light in a free flat's window. Free and discounted cells on the building grid, pressed-key dots on plaster, the dot of the discount status, the free count in the model console and picker bar, free-flat marks on the daytime picker view.
- **Deep LED** (#F2B85B): the same signal where it must read on plaster or on a pressed plaster key: chip dots, the price-tag LED on lot cards, the free-status dot, the free-share bar, grid-cell borders on the daytime board.
- The interior light painted onto the dusk render comes from a generated light plate, not from these tokens; it carries the same meaning.

### Neutral
- **Vitrine Graphite** (#121416): the room. Header, footer, menu, the model section, dark content bands, price card, drawer foot, picker. The same value is **Ink**, the text colour on plaster and the fill of every committing element on plaster (primary button, plates, sale tag and status, numbered discs, the selected flat on a key plan), so the room and the type are one material.
- **Podium Graphite** (#1A1D20): panels inside the room: service band, picker bar and side panel, image wells.
- **Room Rules** (rgba(238,240,238,.13) / .26): engraved 1px rules and key outlines on graphite; the stronger value outlines interactive elements and rules the service directory.
- **Model Plaster** (#EEF0EE): the page ground, the text colour on dark, and the fill of committing elements on graphite (primary button, pressed keys).
- **Plaster in Shadow** (#E3E6E3): plan boards, filter band, sold cells, plan thumbnails, hovered rows.
- **Plaster Face** (#F7F8F7): tiles on the ground: lot cards, keys, spec grids, the form card, the grid side panel; also the face of pins and tags laid over a render.
- **Plaster Rules** (#C9CECB, lighter #D9DDDA): 1px rules and tile borders on plaster; also the unlit LED.
- **Reading Ink** (#3B4144) and **Quiet Ink** (#596164): body copy and secondary text on plaster (the latter at >= 5:1).
- **Ink Tint** (rgba(18,20,22,.06)): the faint ink wash of a soft button's pour, a pressed favourite and the attached-lot strip in the form.
- **Oxide Red** (#A8391F): form errors only.

### Named Rules
**The Lit Window Rule.** LED yellow means "this flat can be bought" and nothing else. If an element is not a free or discounted flat, a count of them, or a key that is switched on, it does not get LED.

**The Monochrome Commit Rule.** Buttons, plates, badges and pins are never a third colour. On plaster they are ink with plaster text; on graphite they are plaster with ink text. A discount is marked by shape (an ink corner notch, an ink ring), not by a new hue.

**The Switched-Off Render Rule.** The dusk render is shown with its windows dark. Light is added back only to flats for sale, inside their actual window glass, so the lit windows on the building are the availability data.

**The Two Rooms Rule.** A section is either graphite room or plaster model. Content never sits on a photo-tinted or mid-grey band between them.

## Typography

**Display Font:** Unbounded (with 'Arial Black', system-ui)
**Body Font:** Manrope (with system-ui, Segoe UI, Roboto, Arial)

**Character:** Unbounded's wide geometric caps read as cut lettering on a plate; its Light weight gives headlines an architectural, drawn quality. Manrope is quiet and legible and carries every figure in tabular lining numerals. Both are self-hosted with Cyrillic subsets.

### Hierarchy
- **Display** (Unbounded 800, fitted SVG wordmark, -2px): the MEGA KHUJAND wordmark cut through the plaster in the home hero. One use only.
- **Page title** (Unbounded 300, clamp(2.1rem, 5vw, 4.4rem), 1.0, -0.035em): inner-page H1s; flat H1 is clamp(1.9rem, 4vw, 3.4rem).
- **Headline** (Unbounded 300, clamp(1.75rem, 3.5vw, 3.25rem), 1.08, -0.025em): section H2s, balanced wrap. A step down (clamp(1.45rem, 2.6vw, 2.35rem)) for panel headings.
- **Title** (Unbounded 400, clamp(1.15rem, 1.7vw, 1.5rem), 1.18): card, form and board titles; list-item names at 1–1.2rem.
- **Body** (Manrope 400, 16px, 1.6): running text; leads at 15.5–17px with max 52ch; small print 13px.
- **Figure** (Manrope 700–800, 14.5–17px, tabular): prices, areas, counts, spec values. Large figures (price card, free count, the lift readout's floor number at 34px) switch to Unbounded 300.
- **Label** (Unbounded 500, 11px, 0.12–0.14em, uppercase): field and spec labels, plates, statuses, table heads. 11px is the floor for any plate or label text.
- **Button** (Unbounded 500, 11.5px, 0.09em, uppercase; 11px on small buttons).
- **Key** (Manrope 600, 13.5px): text on keys, chips, section buttons.

### Named Rules
**The Engraved Caps Rule.** Wide uppercase is for things that are engraved: plates, labels, buttons, directory names, the header wordmark. Headlines are Unbounded Light in sentence case, never caps.

**The Tabular Figures Rule.** Every price, area, floor and count is set in lining tabular numerals so columns and tags align like a price list.

## Layout

Full-width sections with a fluid side gutter (clamp(16px, 3.4vw, 56px)) and a sticky 64px header (58px under 760px). Sections pad vertically by clamp(64px, 11vh, 140px). Section heads are an auto-fit two-column grid: headline left, lead right, bottom-aligned; single column on narrow screens.

Content grids are asymmetric two-column splits (for example 0.95fr/1.35fr for plans, 1.45fr/1fr for materials, 1.6fr/1fr for the site legend) that collapse to one column at 900px. Lot grids auto-fill at a 280px minimum. The building grid page uses a 260–320px sticky side panel beside the board, stacked below 980px. The picker is a full-height stage with a 290–370px side panel from 901px.

The home hero is a pinned scroll clock from 900px (hero height 250vh, stage sticky under the header). On load the caption rises in, and while the plaster still covers the stage a few free windows switch on slowly inside the letters ("evening comes"). Scrolling zooms the wordmark toward its thickest stroke until that stroke fills the frame at the computed cover scale; at that moment the plaster is simply gone (no fade, no white flash) and the dusk facade settles from 1.1 to 1. The room dims slightly, then the lights switch on floor by floor from the bottom with a compact lift readout riding the light front, and the key console rises last. Under 900px or with reduced motion, the plaster card and the model stack without a pin and windows light once on entry.

Rhythm is tight inside components (6px between keys, 10px between actions, 18px card insets) and generous between sections.

## Elevation & Depth

Flat by construction. Depth comes from the two materials (graphite behind, plaster in front), from tiles that sit on a slightly different plaster tone with a 1px rule, and from the lit render itself. There is no resting shadow on any tile, button or key; shadows belong only to things that float over the page or over the render.

### Shadow Vocabulary
- **Overlay lift** (`box-shadow: 0 16px 40px rgba(18,20,22,.3)` on the sticky price bar; `-24px 0 60px rgba(18,20,22,.28)` on the lot drawer): panels that float over the page. Not for cards.
- **Render tag lift** (`box-shadow: 0 14px 36px rgba(0,0,0,.4)` on the flat tag over the home facade; `0 10px 28px rgba(0,0,0,.35)` on the picker tooltip): plaster-face tags that hover over a dark render.
- **Lift readout glass** (`backdrop-filter: blur(6px)` over a graphite plate at 88%): the floor readout over the facade; no shadow.

### Named Rules
**The Flat Vitrine Rule.** Cards, keys, plates and buttons are flat at rest and on hover; they change fill or rule colour, never elevation. Hover on a tile darkens its 1px rule to ink.

## Shapes

Machined, not soft. Content containers, buttons, keys, inputs, images and overlay tags take a 3px corner. Plates, tags, statuses, grid cells and tooltips take 2px. Circles are reserved for LEDs (7–8px dots), numbered discs and pins (26–30px), range thumbs, the picker's day marks and the form-sent mark. There are no pills.

The 1px rule is the main structural device: rows of lists, the ink rule over a lot card's price, the strong room rules of the service directory, table and spec-grid hairlines (spec grids use a 1px gap over a rule-coloured ground), the underline of a hovered nav link, the slab lines drawn on the facade and the leader from the lift readout. The flat tag over the facade has a small square notch turned 45°. A discounted grid cell carries a right-angled ink notch in its top-right corner.

## Components

### Buttons
Monochrome plates you press, filled from below like a mould with plaster.
- **Shape:** machined corner (3px); 52px tall, 42px small, 56px large.
- **Primary on plaster:** ink fill with plaster caps text, 26px side padding.
- **Primary on graphite** (dark sections, header, menu, model console, picker, price card, sticky bar, drawer foot, embed): plaster fill with ink caps text. Inside a plaster form card on a dark band it reverts to ink.
- **Hover (the pour):** a fill rises from the bottom edge to full height (background-size over .5s, ease-out): #30363A over ink, white over plaster, ink inside the outline button, an ink tint inside soft, a 10% plaster wash inside glass and soft-on-dark. Press nudges down 1px and scales to .985.
- **Outline:** 1px ink frame with ink text on plaster, poured ink on hover with plaster text; on graphite the frame is plaster at 80% and pours plaster.
- **Soft:** plaster-face fill with a plaster rule; on dark, a faint plaster wash with a room rule.
- **Glass:** transparent with a room rule, for secondary actions over the dusk render.
- **Disabled:** 55% opacity; a spinner replaces the label while sending.
- **Arrow links:** the arrow steps 4px right on hover.

### Keys (segments, chips, section buttons, form options)
The console switch: one control for every on/off choice.
- **Style:** plaster-face fill, 1px plaster rule, 3px corner, 42–44px tall, Manrope 600, with a 7–8px LED dot before the label that is unlit (rule grey) when off.
- **Pressed on plaster:** fills ink with plaster text; the dot lights LED.
- **Pressed on graphite:** fills plaster with ink text; the dot lights deep LED.
- **Chips:** stay unfilled when pressed; the frame darkens to ink and the dot lights deep LED.
- **Form contact options** are the same keys in a two-column grid over hidden radios.

### Plates, tags and status
- **Plate:** solid ink, plaster Unbounded caps at 11px, 2px corner, 28px min height. Used for plan captions and codes; the discount superscript on page titles and the plan viewer's entry mark use the same ink plate.
- **Tag:** 2px corner, 1px rule, 12px Manrope 600; accent tag has a quiet-ink rule and ink text; sale tag is solid ink with plaster text.
- **Status:** a 28px framed caps label with an 8px dot. Free: ink frame, deep-LED dot. Discount: solid ink with plaster text and an LED dot. Reserved and sold: rule frame, unlit dot.
- **Numbered discs:** 26px ink circles with plaster Unbounded numerals in lists and plan rooms; an active legend row turns its disc plaster with a 1px ink ring.

### Cards / Containers
- **Lot card:** plaster-face tile, 1px plaster rule, 3px corner, 18px insets. Head (flat type in Unbounded 400, area as a tabular figure), meta line, the plan on a centred well, tags, then a price tag: a 1px ink rule and a bold tabular price with an LED dot before it (deep LED when free; deep LED inside an ink ring when discounted; a hollow quiet-ink ring when reserved). Reserved cards dim their plan and head to 58%. Hover or focus darkens the rule to ink; the whole card is one link.
- **Price card:** graphite block, 3px corner, large Unbounded Light price, per-metre figure, plaster primary action.
- **Plan board / plan box:** plaster-in-shadow well with an ink plate caption on the home page; graphite box with a plaster label at 80% on the flat page.
- **Spec grid:** 1px-gap grid of plaster-face cells, caps label over a tabular figure.

### Inputs / Fields
- **Style:** 50px, near-white fill (#FCFCFC), 1px plaster rule, 3px corner, 16px Manrope 600. Labels are Manrope 700 at 13px above the field.
- **Focus:** the rule turns ink, with a 3px soft ink ring (rgba(18,20,22,.16)); range thumbs get a 4px ring of the same ink.
- **Error:** oxide-red rule with a faint red ring; message in oxide red, 12.5px.
- **Range:** a 2px engraved track that fills ink between two plaster-face thumbs with 2px ink borders, paired with boxed numeric inputs.

### Navigation
- **Header:** graphite bar, 64px, 1px room rule below. Brand is a plain wordmark with no frame (Unbounded 700 caps at 13px, 0.16em) that dims to 72% on hover. Links are Manrope 600 at 14px in plaster at 80%, full plaster on hover; a 1px plaster underline grows from the left on hover, and the current page holds a 2px underline. Primary action is a small plaster button.
- **Mobile:** under 1100px the links move into a full-screen graphite menu of Unbounded Light rows ruled by room lines, each with a caps hint in plaster at 64%; the current page is underlined (1px, 6px offset).
- **Footer:** graphite, 13px, brand in Unbounded caps, legal note kept visible.

### Lit Model (signature)
The real dusk render with every window switched off, and warm interior light drawn back per flat on a canvas from a transparent light plate. The plate is generated offline by rectifying each facade plane, placing light inside the actual window glass (mullion silhouettes, curtain stripes, per-flat colour temperature, a soft halo), and recording each window's quad per section, floor and stack together with fitted floor bands. Only free flats are lit; light eases in floor by floor.
- **Floor first:** hovering or tapping the facade finds the floor, draws its slab in perspective (1.2px plaster lines at 78% with a 7% plaster wash), dims every other flat's light to 20%, and shows the lift readout beside the floor edge.
- **Lift readout:** a graphite plate at 88% with a strong room-rule border, 3px corner and 6px backdrop blur: the floor number in Unbounded 300 at 34px, "этаж" as a caps label, then the free count and the price from in tabular Manrope. A 24px plaster leader line connects it to the floor; it flips to the other side near the frame edge and shrinks to number and label while riding the hero's light front.
- **Flat tag:** hovering a flat outlines its glass in plaster and raises a plaster-face tag (3px corner, notch, render tag lift) with type and area in caps, floor, number and price, and an underlined link.
- **Console:** the free count in LED, plaster and glass actions, and a row of room-count keys that re-light only matching flats.
- **Picker:** the same module drives the evening view; the day view marks free flats with small LED dots ringed in ink, reserved flats with smaller plaster dots, and sold flats with nothing.

### Building Grid (signature)
Floors by stacks in 34px cells (40px on touch) with 4px gaps and 2px corners. It opens in evening mode on a graphite board: free cells are LED, discounted cells LED with an ink corner notch, reserved cells an LED outline with LED text, sold cells a faint plaster wash with no text. The daytime "scheme" mode uses the same cells on plaster-face with deep-LED borders. Opening a section lights the cells bottom to top. A legend of 16px swatches and a free-share bar in deep LED sit in the side panel.

### Key Plan
The floor's key plan on a plaster-face card: flats as faint ink washes with quiet-ink outlines, darker on hover, and the selected flat filled solid ink with a plaster code.

### Service Directory
A lobby directory on podium graphite: rows separated by strong 1px room rules top and bottom, service names in engraved Unbounded caps at 13px, descriptions in Manrope beside them.

### Numbered Legend
Numbered pins on the render (30px plaster-face discs with a 1px ink rule at 50% and ink Unbounded numerals; ink with plaster numerals and scaled 1.18 when on), keyed to a ruled list of ink discs, Unbounded 400 names and Manrope descriptions.

### Reveal motion
Armed only under prefers-reduced-motion: no-preference and once the script marks the page; without it, everything is visible.
- Headings rise from under the plaster: a clip-path wipe with a .35em lift over 1s.
- Renders switch on from dark: brightness .22 and scale 1.07 settle to normal over 1.5–1.8s.
- List rows rise in sequence at a 70ms stagger, capped at ten; service directory rules draw left to right.
- Numbered pins pop in after their photo (140ms apart) with a one-time ring that expands and fades.
- Catalogue and plan cards stagger in after each render; a new plan sheet lands with its room numbers in sequence; grid cells light bottom to top; material crops zoom on hover.

## Do's and Don'ts

### Do:
- **Do** alternate graphite room (#121416) and plaster (#EEF0EE) sections; let the render live in the graphite ones.
- **Do** reserve LED (#FFD58A / #F2B85B) for availability: lit windows, free cells, status and price-tag dots, pressed-key dots, free counts.
- **Do** make every committing or labelling element monochrome: ink with plaster text on plaster, plaster with ink text on graphite.
- **Do** fill buttons from the bottom on hover (the pour) and press them to .985; never change their colour family.
- **Do** mark a discount by shape (ink corner notch, ink ring, ink badge), keeping the flat's light LED.
- **Do** build every on/off control as a key with an LED dot; pressed keys invert (ink on plaster, plaster on graphite).
- **Do** end lot cards with the price tag: 1px ink rule, bold tabular price, status LED.
- **Do** keep corners at 3px for containers and 2px for plates and cells; circles only for LEDs and pins.
- **Do** set plate and label text at 11px minimum in Unbounded caps with 0.12–0.14em tracking.
- **Do** set every figure in Manrope tabular lining numerals.
- **Do** select on the facade floor first: slab lines, dimmed neighbours, the lift readout, then the flat.
- **Do** give the pinned hero a stacked, unpinned fallback under 900px and make every reveal visible at once with reduced motion.

### Don't:
- **Don't** use LED yellow for decoration, highlights, hover states or anything that is not a buyable flat or an active switch.
- **Don't** bring back brass or any metallic or accent colour for buttons, plates, pins, badges or nav; the user rejected the brass button as generic.
- **Don't** paint light over the render as polygons or a screen-blend wash; light lives inside the real glass, from the light plate.
- **Don't** add gradients, sheens, glows or drop shadows to buttons, cards or keys.
- **Don't** use pill shapes or large radii; nothing rounder than 3px except LEDs and pins.
- **Don't** return to the cream, serif and bronze "warm premium" look, or set headlines in a serif or in caps.
- **Don't** open a page on a full-bleed render with a serif headline over it; the render sits inside the letters or inside the graphite model.
- **Don't** fade or flash the plaster away in the hero; the wordmark zooms until its stroke fills the frame and the plaster is gone.
- **Don't** set label or plate text below 11px, or use Unbounded for body text.
- **Don't** raise tiles with shadows on hover; change the rule or fill instead.
