---
name: Ví Riêng
description: A hand-painted Vietnamese eatery price board for tracking personal spending.
colors:
  men: "#0f4c3a"
  men-dam: "#0a382b"
  men-sau: "#082e23"
  men-phim: "#11553f"
  men-vien: "#2e6b55"
  men-sun: "#cfe0d2"
  men-dam-sun: "#b2c9b8"
  men-sau-sun: "#a2bdaa"
  men-phim-sun: "#dceade"
  men-vien-sun: "#5f8269"
  son-nga: "#f2e8d5"
  muc-sun: "#0b3325"
  muted: "#c2dcce"
  muted-sun: "#2a5544"
  accent: "#edc948"
  accent-sun: "#6e4c00"
  accent-foreground: "#3a2e00"
  negative: "#c9301a"
  negative-sun: "#b32d12"
  negative-foreground: "#ffffff"
  the: "#e8dcc4"
  the-sun: "#fffcf2"
  the-muc: "#1a1714"
  c1: "#edc948"
  c2: "#3ed6b5"
  c3: "#ff7a9c"
  c4: "oklch(0.78 0.13 265)"
  c5: "oklch(0.76 0.14 320)"
  c6: "#b9ac96"
typography:
  display:
    fontFamily: "Oswald, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(52px, 6vw, 88px)"
    fontWeight: 600
    lineHeight: 0.86
    letterSpacing: "-0.035em"
  display-compact:
    fontFamily: "Oswald, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(38px, 9vw, 52px)"
    fontWeight: 600
    lineHeight: 0.86
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Oswald, ui-sans-serif, system-ui, sans-serif"
    fontSize: "27px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
  keypad:
    fontFamily: "Oswald, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 500
    lineHeight: 1
  amount:
    fontFamily: "Oswald, ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    letterSpacing: "normal"
  body:
    fontFamily: "Oswald, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.4
  body-sm:
    fontFamily: "Oswald, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
  label:
    fontFamily: "Roboto Mono, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.2em"
    textTransform: "uppercase"
rounded:
  none: "0rem"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "28px"
  gutter-mobile: "16px"
  gutter-desktop: "28px"
components:
  button-record:
    backgroundColor: "{colors.negative}"
    textColor: "{colors.negative-foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    height: "58px"
    padding: "0 16px"
  button-record-disabled:
    backgroundColor: "{colors.men-phim}"
    textColor: "{colors.muted}"
    rounded: "{rounded.none}"
    height: "58px"
  keypad-key:
    backgroundColor: "{colors.men-phim}"
    textColor: "{colors.son-nga}"
    typography: "{typography.keypad}"
    rounded: "{rounded.none}"
    height: "58px"
  keypad-key-unit:
    backgroundColor: "{colors.men-phim}"
    textColor: "{colors.accent}"
    rounded: "{rounded.none}"
    height: "58px"
  price-tag:
    backgroundColor: "{colors.the}"
    textColor: "{colors.the-muc}"
    rounded: "{rounded.none}"
    padding: "10px 12px 12px"
  price-tag-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.none}"
    padding: "10px 12px 12px"
  input-field:
    backgroundColor: "{colors.men-sau}"
    textColor: "{colors.son-nga}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    height: "46px"
    padding: "0 14px"
  nav-item:
    textColor: "{colors.muted}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    height: "44px"
    padding: "0 14px"
  nav-item-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.none}"
    height: "44px"
---

# Design System: Ví Riêng

## Overview

**Creative North Star: "Bảng Giá Quán" — the hand-painted eatery price board**

This is a sheet of enamelled iron hanging on a Vietnamese eatery wall: moss-green vitreous ground, ivory stencil paint, paper price tags strung on wire. The interface is not a set of cards arranged on a neutral page. It is one continuous painted surface, and the numbers are painted onto it. Structure is read through gaps between painted blocks and through the weight of the paint itself, never through rounded containers, drop shadows, or outlined boxes.

The system is built for one act: recording a purchase in five seconds while standing in a shop. Everything follows from that. The numeric keypad is always present rather than hidden behind a sheet or a dialog, the leading number is large enough to read across a room, and every supporting label shrinks to a mono whisper so the number owns the screen. Hierarchy is built from extreme size contrast, not from borders or elevation.

Two themes describe the same physical object under two lighting conditions, not a palette and its inversion. Dark is the board indoors; light is the board in sunlight. In both, the enamel green is still the ground and the ivory paint is still the figure. This figure/ground polarity is the load-bearing invariant of the whole system: an earlier attempt that flipped light mode to dark ink on pale green stopped being a board and became a generic light app with a green tint.

**Key Characteristics:**
- Enamel green owns 40%+ of every screen as a field, never as an accent
- Zero border-radius anywhere; structure reads through gaps and painted blocks
- One enormous number against tiny mono labels; hierarchy by size contrast alone
- Two themes, one object: ivory stays the figure in both
- Capture is always on screen, never behind a layer
- Depth from paint thickness and chipped edges, never from shadow or blur

## Colors

A single committed enamel green field, with ivory paint as the figure, turmeric yellow for income and selection, and vermilion reserved for the act of recording and for overspending.

### Primary
- **Enamel Green** (`men`): The board itself, and the app background. This is the field, not an accent; it occupies roughly 40% or more of every screen. Its sunlit counterpart (`men-sun`) is the same board bleached by years outdoors — pale enamel carrying dark ink.
- **Recessed Enamel** (`men-dam`): Wells pressed into the board — the capture column, the keypad zone, the left navigation column. One step darker than the ground in dark mode, and correspondingly darker in light mode.
- **Deepest Well** (`men-sau`): The deepest recess, used for the live amount display and every text input. This is where the typed numeral sits.
- **Key Face** (`men-phim`): The face of a keypad key. Notably it is *lighter* than the ground in light mode and only slightly lighter in dark, so keys read as raised paint rather than as holes.
- **Wire** (`men-vien`): Hairlines, the hanging wire the price tags dangle from, the dotted leader, and the scrollbar thumb. Never used as a container outline.

### Secondary
- **Turmeric Yellow** (`accent`): Income amounts, the selected category tag, the active navigation item, the brand mark, the caret, and text selection. Income and selection are deliberately the same signal.
- **Vermilion** (`negative`): The record button and the over-budget state, and nothing else. It is the only hot color in the world and marks either the primary action or a breach.

### Neutral
- **Paint** (`son-nga` dark / `muc-sun` light): All primary text and the big number — the figure of the composition. Ivory `#f2e8d5` on the indoor board; ink `#0b3325` on the sun-bleached one. The role is constant, the value flips with polarity.
- **Chalk** (`muted`): Mono labels, secondary lines, inactive navigation. A measured floor, not a taste value.
- **Tag Paper** (`the`) and **Tag Ink** (`the-muc`): The hanging paper price tags — the only surfaces in the system that are not enamel, which is exactly why categories read as physical objects clipped onto the board.

### Category Hues
`c1`–`c6` carry user category colors. These hues were preserved verbatim from the previous design so that existing user data did not change color across the redesign.

**Category colors are never used as text on a light ground.** They are user-chosen from a fixed six-color chart palette, and the lighter ones (teal, turmeric) measure near 1:1 against bleached enamel. A category's color is therefore allowed only in solid blocks, dots, tag fills, and the caret — surfaces that carry no text — while the typed numeral always keeps the theme's ink color. This is why selecting a category tints the amount well's *ground* and edge block rather than the numeral itself.

### Named Rules

**The Field Rule.** The enamel green is a ground, not an accent. It must occupy roughly 40% or more of any screen. A layout that reduces green to a header bar or a button fill has left this world.

**The Same Board Rule.** Light mode is the *same board* under different light, never a different product. Dark mode is the board indoors: deep enamel, ivory paint. Light mode is that board weathered outdoors: the enamel has bleached pale and the painted lettering has darkened to ink. Both are recognisably one object — the wire, the tags, the leader lines, the zero radius, the paint texture are identical. What changes is the light on it.

**The Polarity Rule.** The two themes deliberately have *opposite* figure/ground polarity, and this is the correction of an earlier mistake worth recording. Three attempts kept ivory paint as the foreground in light mode, which capped the enamel at L≈.14 — still a dark green. The themes measured 2.54× apart and users read them as "two shades of dark green". Forcing one polarity across both themes is what caused it: with pale text, the ground can never get bright.

Light mode now inverts: ink `#0b3325` on bleached enamel `#cfe0d2`, L .712 vs .056 — **12.8× brighter**, unmistakable at a glance. Two consequences follow, and both are load-bearing:
- **Recesses invert too.** In dark mode a well is *darker* than the ground; in light mode it is also darker, but the key faces are *lighter* than the ground rather than darker. Depth is always "away from the ground", never a fixed direction.
- **Texture blend inverts.** `.men-mat` uses white noise with `overlay`/`soft-light` on dark, and `multiply` on light (see globals.css). White noise over a pale ground is invisible; the grain must darken to read as worn enamel.

**The Measured Floor Rule.** Every text color here was contrast-measured against the *brightest point of the enamel gradient* (#14604A in dark), not against the flat token. Dark chalk sits at 5.15:1 on the dark gradient peak; light ink at 10.07:1 and light chalk at 6.14:1 on the bleached ground. These are floors. Do not lower any of them without re-measuring against the gradient peak.

**The Hot Color Rule.** Vermilion means record-or-breach. It is never lightened in light mode — `#c9301a` dark / `#b32d12` light, both holding above 5:1 against white — because a pale primary action reads as disabled.

**The Three Signal Rule.** Over-budget is never signalled by color alone. It carries color, the word ("Vượt hạn mức" / "Đã vượt"), and a change in bar direction and fill, simultaneously.

## Typography

**Display Font:** Oswald (with `ui-sans-serif`, `system-ui`, sans-serif)
**Label/Mono Font:** Roboto Mono (with `ui-monospace`, monospace)

**Character:** Oswald is a condensed grotesque with sign-painter lineage — it looks like lettering brushed onto a board, and it carries full Vietnamese diacritics, which is a hard constraint and disqualifies most condensed display faces. Roboto Mono handles every measurement label. There is no separate body face; Oswald sets everything that is not a label.

### Hierarchy
- **Display** (600, `clamp(52px, 6vw, 88px)`, line-height .86, tracking -.035em): The leading "còn tiêu được" number. One per screen. Tabular figures.
- **Display Compact** (600, `clamp(38px, 9vw, 52px)`): The same number on mobile, stepped down one notch specifically to buy vertical room for the keypad.
- **Headline** (600, 27px, line-height 1, tracking -.01em): The month title on the board column.
- **Keypad** (500, 26px): Numeric key faces. Unit keys (`k`, `tr`) drop to 19px/600 in turmeric to separate them from digits.
- **Amount** (600, 19px, tabular): The price at the end of every board row.
- **Body** (400, 16px): Transaction names and item text.
- **Label** (mono, 500, 11px, tracking .2em, uppercase, chalk): Every measurement label, day heading, section heading, and metadata line.

### Named Rules

**The One Number Rule.** Exactly one number per screen is allowed to be huge. Hierarchy is built from the gap between that number and the 11px mono labels around it, not from rules, boxes, or weights in between.

**The Label Floor Rule.** Measurement labels are 11px mono, uppercase, .2em tracking — one canonical treatment carried by the `.nhan-do` utility. 11px is a floor, never smaller, and the tracking is a single value across the entire app. Mixed tracking for the same role is drift, not system.

## Layout

The app is a single board, not a page of cards. There is no shared sidebar or topbar chrome; the main capture screen builds its own two columns, and the four secondary screens share a left column.

**Desktop (≥768px):** Two fixed columns. The capture column is 360px (400px at ≥1280px) and holds the brand, the leading number, the category tags, the amount well, the keypad, and the record button. The remaining width is the price board: a month header, horizontal navigation, a hairline, the scrolling day-grouped rows, and a ledger total pinned at the bottom behind a 2px ivory rule. The board area scrolls independently so the total stays visible.

**Mobile (<768px):** The columns stack and *invert order*. The board sits on top, the capture column below, so the keypad lands within thumb reach as soon as the app opens. The leading number switches to its compact variant purely to make that fit. A mobile header sits above and a five-item tab bar below.

**Rhythm:** Gutters are 16px on mobile and 28px on desktop. Vertical rhythm runs on a 4px base, clustering at 8/12/16/28px. The keypad is a 4-column grid with an 8px gap and 58px-tall keys; its sixteenth cell is the income/expense toggle. Blocks are separated by gap, not by dividers — the few hairlines that exist mark structural seams (nav underline, ledger total) rather than boxing content.

**The Reach Rule.** Capture is never placed behind a sheet, dialog, or a "+" button. On mobile the keypad must remain within thumb reach on open. This replaced a previous design where capture lived behind a sheet, and reintroducing that layer would undo the redesign.

## Elevation & Depth

**There are no shadows in this system.** Not ambient, not offset, not on hover. There is no blur and no backdrop-filter. Depth comes from three physical devices instead:

1. **Tonal recession.** Four enamel steps (`men` → `men-dam` → `men-sau`) read as areas pressed into the board, with `men-phim` sitting slightly proud as a raised key face.
2. **Painted texture.** A two-layer procedural surface on `.men-mat`: isotropic fractal-noise grain for enamel speckle (opacity .055, overlay) and x-stretched turbulence reading as directional brush drag (baseFrequency `0.9 0.012`, opacity .05, soft-light). Both are held at very low opacity so they never erode measured contrast.
3. **Chipped edge.** `.mep-men` marks the seam where two enamel areas meet with an uneven vertical gradient of varying thickness — deliberately not a border, because real enamel has thick and thin spots rather than a ruled line.

**The No Shadow Rule.** Surfaces never lift off the board, because they are painted onto it. Depth is tonal and textural. A drop shadow, a soft glow, or a blurred backdrop anywhere in this world is a defect.

**Known substitution:** the enamel texture is *procedural* (inline SVG `feTurbulence`), not a produced raster. This was recorded by the finish review as a partial material solution and an accepted substitution — not as a solved problem, and not as something to improve by further tuning noise parameters. An agent with image-generation capability should replace it with a real painted-enamel raster.

## Shapes

**`--radius: 0rem`. There is no border-radius anywhere in this world**, including the brand mark, the price tags, the keys, the buttons, and the inputs. Every form is a rectangle of paint.

Borders are near-absent as well. Where a line is needed it is a 1px hairline in wire green marking a structural seam, or the 2px ivory rule above the ledger total. Containers are not outlined; they are distinguished by tonal fill and by the gap around them. The one non-rectangular gesture in the system is the dotted leader (`.duong-cham`) — a repeating radial-gradient dot row on a 6px pitch, drawn as a background rather than a border-bottom so the dots stay round and clear of the text baseline.

**The No Outline Rule.** Never box content in a border to group it. Grouping is done with gaps, tonal fill, and painted blocks. A 1px hairline is permitted only to mark a structural seam.

## Dependencies

**embla-carousel-react** (8.6.0) drives the horizontal category-tag strip, and only that. It was added after a hand-written `scrollLeft` drag hook proved rough: writing scroll position on every pointer event gives no momentum, no frame sync, and a dead stop on release.

Configured as a *strip*, not a slideshow: `dragFree: true` (no paging), `containScroll: 'trimSnaps'` (rests flush at both ends), `skipSnaps: true`. shadcn's Carousel wrapper is deliberately **not** used — it ships ‹ › buttons and its own shell, while these tags must hang from the wire in the board's own vocabulary. Only the drag engine is borrowed.

Two things the library does not handle and the component must:
- **Drag vs. click.** Every tag is a category button. Embla does not suppress the click that follows a drag, so `DaiTheGia` tracks a `scroll` flag between `pointerDown` and `pointerUp` and cancels the click in a capture-phase handler. Without it, dragging the strip selects whatever tag is under the cursor on release.
- **Padding belongs on the track, not the viewport.** Embla measures the viewport to compute its scroll limit; horizontal padding there makes it under-measure and the strip settles past its own edge, leaving a gap after the last tag.

## Components

### Buttons
- **Shape:** Hard rectangles, no radius, no border.
- **Record (primary):** Vermilion ground with white text, 58px tall, 17px uppercase at .04em tracking, labelled with the actual amount and category ("GHI 45.000Đ · ĂN UỐNG") rather than a generic verb. Disabled state falls back to the key-face green with chalk text and states what is missing ("Gõ số tiền" / "Chọn danh mục").
- **Hover / Active:** Brightness filter only (`brightness(1.1)` hover, `.95` active) over 120ms. No translation, no shadow, no radius change.
- **Press:** A 0.99 scale tap on the record button and 0.97 on keypad keys, suppressed under `prefers-reduced-motion`.

### Chips (price tags)
- **Style:** Paper tags in tag-paper cream with dark ink, hanging from a 1px wire, each with a 3px vertical wire stub connecting it upward to the rail. Name at 13px, month total at 15px semibold, a 8px category color square at the leading edge.
- **State:** Selected floods the whole tag to turmeric with dark ink and sets `aria-pressed`. Selection is a full fill, never an outline or a checkmark.

### Cards / Containers
There are no cards. Regions are plain flex sections with no radius, no border, and no shadow; the `GlassCard` export is a legacy filename that now returns an unstyled section. Region identity comes from tonal fill (`men-dam` for the capture and nav columns) and from the surrounding gap. Internal padding is 16px on mobile, 28px on desktop.

### Inputs / Fields
- **Style:** Deepest-well green fill, no border, no radius, 46–52px tall, 14px horizontal padding.
- **Focus:** A 2px inset turmeric ring (`focus-visible` only). No glow, no border shift, no outline offset.
- **Amount well:** The signature input. It is a well, not a field: an 11px mono "CHI"/"THU" label on the left, the typed numeral right-aligned at 38px, and a 3px pulsing caret.

### Navigation
Text labels only, never glyph icons. Desktop is a vertical list of 44px rows in the left column; the main screen uses a horizontal row instead. Active state is a full turmeric block with dark ink, inactive is chalk text that hovers to ivory over an 8% ivory wash. Mobile is a five-item bottom tab bar, 52px tall, with the same full-block active treatment and no "+" action button — the main screen *is* the capture screen.

### The Board Row (signature)
The single transaction-display unit for the entire app, replacing the three separate row variants of the previous design. It is a price-board line: an 8px category color square, the item name at 16px, a dotted leader stretching to fill the space, optional mono metadata (category · time, desktop only), and the price at 19px tabular. Expenses are written as plain prices; only income carries a `+` sign and turmeric color, because a price board does not write negative numbers.

### The Leading Number (signature)
The "còn tiêu được" display: an 11px mono label naming the state and month, then the number at display scale, then a supporting line and a 9px progress bar. Two behaviors define it:

- **Live subtraction.** As an amount is typed on the keypad, the capture block lifts the pending value and this number falls in real time, so a purchase is seen eating into the remaining budget before it is committed. Exponential ease-out from the already-visible value over 300ms — never a fade-in from empty — and suppressed under `prefers-reduced-motion`.
- **Honest empty state.** With no budget set, it does not invent a "remaining" figure; it switches to "đã tiêu tháng này" and offers a link to set one.

### The Category Flood (signature)
Selecting a category floods its color through the entire amount area: the well tints to a 22% `color-mix` of the category color, the typed numeral takes that color, the caret takes that color, and an 8px solid block paints the well's leading edge. The 8px block is deliberately a painted block, not a colored left border — colored left borders above 1px are refused by the craft floor.

## Do's and Don'ts

### Do:
- **Do** let enamel green hold 40%+ of every screen as a field.
- **Do** keep `--radius: 0rem`; every shape is a rectangle of paint.
- **Do** build hierarchy from size contrast — one huge number against 11px mono labels.
- **Do** set every measurement label as 11px mono, uppercase, .2em tracking (the `.nhan-do` role).
- **Do** keep ivory paint as the foreground in both themes.
- **Do** re-measure contrast against the brightest point of the enamel gradient, not the flat token, before changing any text color.
- **Do** signal over-budget with color, word, and shape together.
- **Do** keep the keypad on screen and within thumb reach on mobile.
- **Do** express selection as a full flood of color, not an outline or a checkmark.
- **Do** use text labels for navigation.

### Don't:
- **Don't** add border-radius to anything.
- **Don't** add drop shadows, soft glows, blur, or backdrop-filter; depth is tonal and textural.
- **Don't** raise the light-mode enamel value on its own — it is a measured ceiling, and exceeding it forces dark ink and destroys the figure/ground polarity.
- **Don't** lighten vermilion in light mode; a pale primary action reads as disabled.
- **Don't** box content in borders to group it; use gaps, tonal fill, and painted blocks.
- **Don't** put capture behind a sheet, dialog, or "+" button.
- **Don't** signal any state by color alone.
- **Don't** use glyph icons for navigation.
- **Don't** introduce a second display face; Oswald must carry Vietnamese diacritics and most condensed alternatives do not.
- **Don't** mix tracking values for the same label role.
- **Don't** reintroduce bento card grids, donut charts, or the money-source concept — all were removed in this redesign.
