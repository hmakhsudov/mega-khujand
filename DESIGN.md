---
name: MEGA KHUJAND
description: The sales-office model under glass — graphite vitrine, plaster model, brass plates, and a warm light in every window that can still be bought.
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
  brass: "#B08D57"
  brass-hi: "#C09C63"
  brass-lite: "#D8BA84"
  brass-ink: "#76582A"
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
    backgroundColor: "{colors.brass}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.machined}"
    padding: "0 26px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.brass-hi}"
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
    backgroundColor: "{colors.brass}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.plate}"
    padding: "5px 11px"
    height: "28px"
  header-brand:
    backgroundColor: "transparent"
    textColor: "{colors.plaster}"
    rounded: "{rounded.plate}"
    padding: "0 12px"
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
    backgroundColor: "{colors.brass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.plate}"
    height: "34px"
  legend-pin:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.led}"
    size: "26px"
---

# Design System: MEGA KHUJAND

## Overview

**Creative North Star: "The Model Under Glass"**

The site behaves like the sales-office model in its vitrine: a graphite room, a white plaster model of the building, brass plates that name things, and a manager's switch that lights the windows still for sale. Every surface is either the room (dark graphite, where the building is shown at dusk) or the model (cool plaster white, where plans, figures and forms are read). The two alternate down the page; they never blend.

Light carries meaning, not mood. Warm LED yellow appears only where a flat can be bought: lit windows on the real dusk render, status dots, the dot on a pressed key, the free cells of the building grid. Brass is the engraved-metal voice for everything that labels or commits: plates, primary buttons, numbered legend pins, the discount status. Nothing glows, nothing is gradated for atmosphere, nothing is a pill.

Form is machined rather than soft: 3px corners on anything that holds content, 2px on plates and tags, 1px engraved rules as the main structural device, and circles reserved for LEDs and numbered pins. Density is that of a sales tool: tabular figures, compact keys, lists ruled like a lobby directory.

**Key Characteristics:**
- Two materials only: graphite room (#121416) and plaster model (#EEF0EE), alternating by section.
- LED yellow means "available"; brass means "labelled or chosen by the seller".
- Unbounded wide caps for plates, labels and buttons; Unbounded Light for headlines; Manrope for reading and every number.
- Machined 3px corners, 1px rules, circular LEDs; no pills, no gradients, no glow.
- Keys with an LED dot are the single on/off control across filters, form options and consoles.

## Colors

A cool, near-neutral pair of graphite and plaster, with two warm metals doing all the signalling: brass for naming, LED for availability.

### Primary
- **Engraved Brass** (#B08D57): primary buttons, plates (plan captions, map tags, tooltips over the render), numbered legend pins, the discount status and discounted grid cells, the brass frame of the header brand, the 1px rules of the service directory, the active-nav underline. Hover lifts to **Polished Brass** (#C09C63).
- **Brass on Dark** (#D8BA84): brass-toned text and icons on graphite (menu hints, contact icons, plan-box label).
- **Brass Ink** (#76582A): brass-toned text on plaster (link hover, discounted drawer label), chosen for contrast.

### Secondary
- **Window LED** (#FFD58A): the light in a free flat's window. Lit polygons on the dusk facade, free cells on the evening grid, pressed-key dots on dark, the free count in the model console and picker bar.
- **Deep LED** (#F2B85B): the same signal where it must read on plaster: pressed-key and chip dots on light, the price-tag LED on lot cards, the free-status dot, the free-share bar.

### Neutral
- **Vitrine Graphite** (#121416): the room. Header, footer, menu, the model section, dark content bands, price card, drawer foot. The same value is **Ink**, the text colour on plaster, so the room and the type are one material.
- **Podium Graphite** (#1A1D20): panels inside the room: service band, picker bar and side panel, image wells.
- **Room Rules** (rgba(238,240,238,.13) / .26): engraved 1px rules and key outlines on graphite; the stronger value outlines interactive elements.
- **Model Plaster** (#EEF0EE): the page ground and text colour on dark.
- **Plaster in Shadow** (#E3E6E3): plan boards, filter band, sold cells, plan thumbnails.
- **Plaster Face** (#F7F8F7): tiles on the ground: lot cards, keys, spec grids, the form card, the grid side panel.
- **Plaster Rules** (#C9CECB, lighter #D9DDDA): 1px rules and tile borders on plaster; also the unlit LED.
- **Reading Ink** (#3B4144) and **Quiet Ink** (#596164): body copy and secondary text on plaster (the latter at >= 5:1).
- **Oxide Red** (#A8391F): form errors only.

### Named Rules
**The Lit Window Rule.** LED yellow means "this flat can be bought" and nothing else. If an element is not a free or discounted flat, a count of them, or a key that is switched on, it does not get LED.

**The Brass Plate Rule.** Brass is flat engraved metal: solid fill with ink text, or a 1px frame. Never a gradient, sheen or glow.

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
- **Figure** (Manrope 700–800, 14.5–17px, tabular): prices, areas, counts, spec values. Large figures (price card, free count) switch to Unbounded 300.
- **Label** (Unbounded 500, 11px, 0.12–0.14em, uppercase): field and spec labels, plates, statuses, table heads. 11px is the floor for any plate or label text.
- **Button** (Unbounded 500, 11.5px, 0.09em, uppercase; 11px on small buttons).
- **Key** (Manrope 600, 13.5px): text on keys, chips, section buttons.

### Named Rules
**The Engraved Caps Rule.** Wide uppercase is for things that are engraved: plates, labels, buttons, directory names. Headlines are Unbounded Light in sentence case, never caps.

**The Tabular Figures Rule.** Every price, area, floor and count is set in lining tabular numerals so columns and tags align like a price list.

## Layout

Full-width sections with a fluid side gutter (clamp(16px, 3.4vw, 56px)) and a sticky 64px header (58px under 760px). Sections pad vertically by clamp(64px, 11vh, 140px). Section heads are an auto-fit two-column grid: headline left, lead right, bottom-aligned; single column on narrow screens.

Content grids are asymmetric two-column splits (for example 0.95fr/1.35fr for plans, 1.45fr/1fr for materials, 1.6fr/1fr for the site legend) that collapse to one column at 900px. Lot grids auto-fill at a 280px minimum. The building grid page uses a 260–320px sticky side panel beside the board, stacked below 980px. The picker is a full-height stage with a 290–370px side panel from 901px.

The home hero is a pinned scroll clock from 900px (hero height 330vh, stage sticky under the header): the wordmark zooms until the viewer flies through the letters, the plaster fades, the dusk facade settles, free windows light floor by floor from the bottom, then the key console rises. Under 900px or with reduced motion, the plaster card and the model stack without a pin and windows light once on entry.

Rhythm is tight inside components (6px between keys, 10px between actions, 18px card insets) and generous between sections.

## Elevation & Depth

Flat by construction. Depth comes from the two materials (graphite behind, plaster in front), from tiles that sit on a slightly different plaster tone with a 1px rule, and from the lit render itself. There is no resting shadow anywhere.

### Shadow Vocabulary
- **Overlay lift** (`box-shadow: 0 16px 40px rgba(18,20,22,.3)` on the sticky price bar; `-24px 0 60px rgba(18,20,22,.28)` on the lot drawer): only for panels that float over the page. Not for cards.
- **Focus ring on fields** (`box-shadow: 0 0 0 3px rgba(176,141,87,.35)`): a brass ring around a focused input or range box.

### Named Rules
**The Flat Vitrine Rule.** Cards, keys, plates and buttons are flat at rest and on hover; they change fill or rule colour, never elevation. Hover on a tile darkens its 1px rule to ink.

## Shapes

Machined, not soft. Content containers, buttons, keys, inputs and images take a 3px corner. Plates, tags, statuses, grid cells and tooltips take 2px. Circles are reserved for LEDs (7–8px dots), numbered legend pins (26–30px), range thumbs and the form-sent mark. There are no pills.

The 1px rule is the main structural device: rows of lists, the ink rule over a lot card's price, the brass rules of the service directory, table and spec-grid hairlines (spec grids use a 1px gap over a rule-coloured ground). Map tags and tooltips over the render are brass plates with a small square notch turned 45°.

## Components

### Buttons
Engraved plates you press.
- **Shape:** machined corner (3px); 52px tall, 42px small, 56px large.
- **Primary:** solid brass with ink caps text, 26px side padding; hover to polished brass; press nudges down 1px.
- **Outline:** 1px ink frame with ink text on plaster, filling with ink on hover; on graphite the frame is plaster at 80% and fills with plaster on hover.
- **Soft:** plaster-face fill with a plaster rule; on dark, a faint plaster wash with a room rule.
- **Glass:** transparent with a room rule, for secondary actions over the dusk render.
- **Disabled:** 55% opacity; a spinner replaces the label while sending.

### Keys (segments, chips, section buttons, form options)
The console switch: one control for every on/off choice.
- **Style:** plaster-face fill, 1px plaster rule, 3px corner, 42–44px tall, Manrope 600, with a 7–8px LED dot before the label that is unlit (rule grey) when off.
- **Pressed on plaster:** fills ink with plaster text; the dot lights LED.
- **Pressed on graphite:** fills plaster with ink text; the dot lights deep LED.
- **Chips:** stay unfilled when pressed; the frame darkens to ink and the dot lights deep LED.
- **Form contact options** are the same keys in a two-column grid over hidden radios.

### Plates, tags and status
- **Plate:** solid brass, ink Unbounded caps at 11px, 2px corner, 28px min height. Used for plan captions and the discount superscript on page titles.
- **Tag:** 2px corner, 1px rule, 12px Manrope 600; accent tag has a brass rule and brass-ink text; sale tag is solid brass.
- **Status:** a 28px framed caps label with an 8px dot. Free: ink frame, deep-LED dot. Discount: solid brass with an LED dot. Reserved and sold: rule frame, unlit dot.

### Cards / Containers
- **Lot card:** plaster-face tile, 1px plaster rule, 3px corner, 18px insets. Head (flat type in Unbounded 400, area as a tabular figure), meta line, the plan on a centred well, tags, then a price tag: a 1px ink rule and a bold tabular price with an LED dot before it (deep LED when free, brass when discounted, a hollow ring when reserved). Reserved cards dim their plan and head to 58%. Hover or focus darkens the rule to ink; the whole card is one link.
- **Price card:** graphite block, 3px corner, large Unbounded Light price, per-metre figure, brass primary action.
- **Plan board / plan box:** plaster-in-shadow well with a brass plate caption on the home page; graphite box with a brass-lite label on the flat page.
- **Spec grid:** 1px-gap grid of plaster-face cells, caps label over a tabular figure.

### Inputs / Fields
- **Style:** 50px, near-white fill (#FCFCFC), 1px plaster rule, 3px corner, 16px Manrope 600. Labels are Manrope 700 at 13px above the field.
- **Focus:** rule turns ink with a 3px brass ring.
- **Error:** oxide-red rule with a faint red ring; message in oxide red, 12.5px.
- **Range:** a 2px engraved track that fills ink between two brass thumbs with ink borders, paired with boxed numeric inputs.

### Navigation
- **Header:** graphite bar, 64px, 1px room rule below. Brand is a brass-framed plate (1px brass frame, 2px corner, Unbounded 600 caps at 12px) that fills brass on hover. Links are Manrope 600 at 14px in plaster at 80%, full plaster on hover; the current page gets a 2px brass underline. Primary action is a small brass button.
- **Mobile:** under 1100px the links move into a full-screen graphite menu of Unbounded Light rows ruled by room lines, each with a brass-lite caps hint; the current page turns brass-lite.
- **Footer:** graphite, 13px, brand in Unbounded caps, legal note kept visible.

### Lit Model (signature)
The dusk render of the real facade with SVG window polygons over it. Free windows fill with the LED light in screen blend and light bottom-up by floor; hovering a window turns it near-white and raises a brass tag with type, floor, price and a link. The console below holds the count (free total in LED), brass and glass actions, and a row of room-count keys that re-light only matching windows.

### Building Grid (signature)
Floors by stacks in 34px cells (40px on touch) with 4px gaps and 2px corners. It opens in evening mode on a graphite board: free cells are LED, discounted cells brass, reserved cells an LED outline with LED text, sold cells a faint plaster wash with no text. The daytime "scheme" mode uses the same cells on plaster-face. A legend of 16px swatches and a free-share bar in deep LED sit in the side panel.

### Service Directory
A lobby directory on podium graphite: rows separated by 1px brass rules top and bottom, service names in engraved Unbounded caps at 13px, descriptions in Manrope beside them.

### Numbered Legend
Numbered brass pins (26–30px circles with a 2px graphite ring, ink Unbounded numerals) placed on the render and keyed to a ruled list of Unbounded 400 names with Manrope descriptions.

## Do's and Don'ts

### Do:
- **Do** alternate graphite room (#121416) and plaster (#EEF0EE) sections; let the render live in the graphite ones.
- **Do** reserve LED (#FFD58A / #F2B85B) for availability: lit windows, free cells, status and price-tag dots, pressed-key dots, free counts.
- **Do** use brass (#B08D57) as flat solid plates or 1px frames: primary buttons, plates, legend pins, discount status, the brand frame, directory rules.
- **Do** build every on/off control as a key with an LED dot; pressed keys invert (ink on plaster, plaster on graphite).
- **Do** end lot cards with the price tag: 1px ink rule, bold tabular price, status LED.
- **Do** keep corners at 3px for containers and 2px for plates and cells; circles only for LEDs and pins.
- **Do** set plate and label text at 11px minimum in Unbounded caps with 0.12–0.14em tracking.
- **Do** set every figure in Manrope tabular lining numerals.
- **Do** give the pinned hero a stacked, unpinned fallback under 900px and for reduced motion.

### Don't:
- **Don't** use LED yellow for decoration, highlights, hover states or anything that is not a buyable flat or an active switch.
- **Don't** add gradients, sheens, glows or drop shadows to brass, buttons, cards or keys.
- **Don't** use pill shapes or large radii; nothing rounder than 3px except LEDs and pins.
- **Don't** return to the cream, serif and bronze "warm premium" look, or set headlines in a serif or in caps.
- **Don't** open a page on a full-bleed render with a serif headline over it; the render sits inside the letters or inside the graphite model.
- **Don't** set label or plate text below 11px, or use Unbounded for body text.
- **Don't** raise tiles with shadows on hover; change the rule or fill instead.
