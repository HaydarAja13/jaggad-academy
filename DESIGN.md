---
name: "JAGGAD Academy Public"
description: "A confident learning desk shaped by editorial clarity, cool white space, and decisive deep maroon."
colors:
  primary-maroon: "#660810"
  primary-light: "#8c101a"
  primary-hover: "#9b111b"
  primary-deep: "#58070e"
  ink: "#171316"
  copy: "#67555c"
  cool-white: "#fbfcff"
  soft-field: "#f7f3f4"
  white: "#ffffff"
  divider: "#ded4d7"
  field-border: "#d8cdd1"
typography:
  display:
    fontFamily: "Chillax, Synonym, sans-serif"
    fontSize: "clamp(2.8rem, 4.5vw, 4.25rem)"
    fontWeight: 800
    lineHeight: 0.96
    letterSpacing: "-0.04em"
  display-compact:
    fontFamily: "Chillax, Synonym, sans-serif"
    fontSize: "clamp(2.6rem, 8vw, 2.8rem)"
    fontWeight: 800
    lineHeight: 0.96
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Chillax, Synonym, sans-serif"
    fontSize: "clamp(2.2rem, 3.2vw, 3.25rem)"
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Chillax, Synonym, sans-serif"
    fontSize: "clamp(1.2rem, 1.6vw, 1.45rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  product-price:
    fontFamily: "Chillax, Synonym, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
  related-product-title:
    fontFamily: "Synonym, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Synonym, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  lead:
    fontFamily: "Synonym, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(1rem, 1.25vw, 1.08rem)"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Synonym, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  sm: "6px"
  field: "10px"
  surface: "16px"
  xl: "24px"
  pill: "9999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
  "12": "3rem"
  "20": "5rem"
  "24": "6rem"
components:
  button-primary:
    backgroundColor: "{colors.primary-maroon}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "13px 20px"
    height: "54px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "13px 20px"
    height: "54px"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
    height: "50px"
  button-light:
    backgroundColor: "{colors.white}"
    textColor: "{colors.primary-maroon}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
    height: "50px"
  field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "13px 15px"
    height: "52px"
  maroon-panel:
    backgroundColor: "{colors.primary-maroon}"
    textColor: "{colors.white}"
    rounded: "{rounded.surface}"
    padding: "clamp(30px, 4vw, 48px)"
  floating-navigation:
    backgroundColor: "{colors.white}"
    textColor: "{colors.primary-maroon}"
    rounded: "{rounded.pill}"
    padding: "6px 8px 6px 16px"
    height: "60px"
---

# Design System: JAGGAD Academy Public

## Overview

**Creative North Star: "The Confident Consultation Desk"**

JAGGAD's public world feels like a capable human desk inside a modern learning studio: direct, composed, and ready to help. Large editorial questions and statements establish confidence; generous cool-white space gives them room; one deep-maroon mass concentrates attention on the next useful action.

The system is expressive without becoming decorative. Chillax brings memorable authority to display copy, Synonym keeps Indonesian body content approachable, and orderly dividers replace generic grids of floating cards. Public About and Contact surfaces share this world; admin screens and product-specific campaign identities sit outside it.

**Key Characteristics:**

- Cool-white and soft rose-white fields with near-black editorial ink.
- Deep maroon used as a concentrated mass, not ambient decoration.
- Bold, tightly tracked Chillax display type paired with calm Synonym body copy.
- Generous split layouts that stack in the same reading order on smaller screens.
- Gently rounded 16px surfaces and fully pill-shaped actions.
- Thin warm dividers, simple line icons, and restrained state motion.

## Colors

The palette is nearly neutral until JAGGAD maroon takes over a decisive action or information surface.

### Primary

- **Deep JAGGAD Maroon** (#660810): The brand's decisive color for primary actions, active states, large purpose panels, and selected display emphasis.
- **Lifted Maroon** (#8c101a to #9b111b): The brighter brand steps for hover states and occasional secondary red emphasis.
- **Dark Maroon** (#58070e): A deeper tonal layer used inside an already-maroon composition, never as a competing accent.

### Neutral

- **Editorial Ink** (#171316): Primary headings and high-emphasis text; softer and warmer than absolute black.
- **Warm Copy** (#67555c): Long-form explanations and supporting text on light fields.
- **Cool White** (#fbfcff): First-view fields and calm page framing.
- **Soft Rose Field** (#f7f3f4): Alternating sections that need separation without becoming cards.
- **Pure White** (#ffffff): Form surfaces, the floating navigation shell, and inverse text against maroon.
- **Warm Divider** (#ded4d7): Rules between timeline, topic, and direct-contact rows.
- **Field Border** (#d8cdd1): Quiet input definition before interaction.

### Named Rules

**The Maroon Mass Rule.** Use Deep JAGGAD Maroon as one clear action or surface mass; do not scatter it across decorative cards, gradients, and badges on the same view.

**The Quiet Field Rule.** Separate major sections with Cool White, Soft Rose Field, and thin warm dividers before reaching for another container.

## Typography

**Display Font:** Chillax (with Synonym and sans-serif fallbacks)  
**Body Font:** Synonym (with system sans-serif fallbacks)

**Character:** Chillax is broad, geometric, and confident enough to carry oversized Indonesian headlines. Synonym is quieter and highly readable, keeping product explanations and human guidance warm rather than corporate.

### Hierarchy

- **Display** (extra-bold, fluid 2.8rem–4.25rem desktop and 2.6rem–2.8rem compact, 0.96 line-height): First-view questions and defining statements, usually balanced and limited to roughly 13 characters per line when the composition allows.
- **Headline** (extra-bold, fluid 2.2rem–3.25rem, 1.04 line-height): Section openings and major calls to action.
- **Title** (bold, fluid 1.2rem–1.45rem, 1.2 line-height): Topic rows, labels inside feature structures, and compact component headings.
- **Lead** (regular, fluid 1rem–1.08rem, 1.65–1.7 line-height): Hero introductions shared by Home, Products, About, and Contact.
- **Body** (regular, 1rem, about 1.7 line-height): Explanations, guidance, and public product copy; keep reading measures near 52–68 characters.
- **Label** (semi-bold, 1rem, 1.5 line-height): Form labels, buttons, navigation, and short metadata.

### Named Rules

**The Display-Body Split Rule.** Chillax carries hierarchy and personality; Synonym carries instructions, detail, and trust. Do not use display type for long paragraphs.

**The One-Size Floor Rule.** Public interactive labels and secondary text stay at 16px or larger; hierarchy comes from weight, rhythm, and display scale rather than tiny copy.

## Layout

Public pages use a centered 1280px container with 24px side padding. Major sections breathe at roughly 104px vertically on desktop, compress to 88px around tablet widths, and settle near 72px on mobile. First views begin below the floating 60px navigation with additional clear space.

Desktop compositions favor unequal two-column grids: one side establishes the idea, the other carries proof, imagery, a list, or a decisive maroon surface. Gaps are generous and fluid, typically 48–128px. At 880px or 767px, depending on the content, those grids become a single column; paired form fields also collapse and primary actions can stretch full width. The 430px and 820px validated views preserve the same semantic reading order as desktop.

**The Stack Without Reordering Rule.** On narrow screens, preserve copy, action, and supporting surface order from the document; responsive design changes width and rhythm, not the story.

## Elevation & Depth

The system is flat through most reading sections. Depth is reserved for the floating navigation, primary buttons, image or maroon hero surfaces, and the white form surface; all use diffuse maroon-tinted shadows rather than gray card stacks. Dividers and tonal fields carry ordinary structure.

### Shadow Vocabulary

- **Floating Navigation** (`0 10px 32px rgba(45, 20, 29, 0.12)`): Keeps the pill-shaped header separate from the page while remaining light.
- **Primary Action** (`0 12px 28px rgba(102, 8, 16, 0.2)`): Supports a decisive maroon action without producing a neon glow.
- **Feature Mass** (`0 24px 60px rgba(55, 30, 38, 0.16)`): Gives large image and maroon hero surfaces one controlled lift.
- **Form Surface** (`0 18px 48px rgba(55, 30, 38, 0.11)`): Separates a focused task from its soft field.

### Named Rules

**The Earned Depth Rule.** Reading structures stay flat; shadows appear only when a control floats, a task needs focus, or a signature mass must separate from the field.

## Shapes

Sixteen-pixel corners define substantial public surfaces: hero visuals, maroon panels, purpose blocks, and forms. Ten-pixel corners belong to fields and compact mobile navigation rows. Calls to action, navigation shells, active navigation items, and compact badges use a full pill. Thin borders remain warm and quiet; the system avoids ornate clipping and competing silhouettes.

**The Sixteen-Pixel Surface Rule.** Use 16px for meaningful public containers and full pills for actions; introduce another radius only when the control scale already establishes it.

## Components

### Buttons

- **Shape:** Fully pill-shaped with a 50–54px minimum height and 20px horizontal padding.
- **Primary:** Deep maroon with white text; may pair one simple line icon with a directional arrow.
- **Hover / Focus:** Lift by 1–2px, move to Lifted Maroon, and use a restrained maroon-tinted shadow. A 3px translucent maroon outline with visible offset marks keyboard focus. Remove translation for reduced-motion users.
- **Secondary:** White with Editorial Ink and a quiet warm border; hover changes border and text to maroon.
- **Inverse:** White on maroon for the primary action inside a maroon mass; a transparent white-bordered ghost can sit beside it.

### Cards / Containers

- **Corner Style:** Gently rounded substantial surfaces (16px).
- **Background:** White or Deep JAGGAD Maroon; Soft Rose Field belongs to full-width section bands rather than isolated cards.
- **Shadow Strategy:** Flat by default; use Feature Mass or Form Surface depth only for the documented roles.
- **Border:** Prefer row dividers and tonal separation to enclosing every item.
- **Internal Padding:** Fluid 30–48px for signature panels and 28–48px for task surfaces.

### Product Detail Pages

- Product media itself is always 16:9. When its desktop container must match a taller purchase summary, center the untouched 16:9 image inside a near-black cinematic frame so the extra height becomes deliberate top-and-bottom bars; mobile collapses back to the image's native 16:9 height.
- Product-detail hierarchy uses the established display scale only for the product title; supporting section titles use the documented Title scale and body copy remains 16px.
- Related products reuse catalog content and controls. On wide screens use a shallow horizontal card that can fill the available column without becoming an oversized vertical tile; return to the catalog card stack on mobile.
- Product-detail body text, labels, prices, metadata, and related-product copy never render below 16px; 16px is the public-interface floor used by the global `xs`, `sm`, and `base` tokens.
- When the purchase summary sits beside product media, both surfaces share one row height. Related products use a horizontal editorial card on wide screens so a short list still occupies the section deliberately; it returns to the catalog card stack on mobile.

### Inputs / Fields

- **Style:** White field, Editorial Ink, quiet warm border, 10px corners, 52px minimum height, and a persistent 16px label.
- **Focus:** Darken the border toward maroon and add a subtle 3px maroon halo while retaining the explicit focus outline.
- **Error / Disabled:** Preserve readable labels and field boundaries; disabled actions remain visibly present with reduced opacity and a non-interactive cursor.

### Navigation

The public navigation floats in a white pill with a soft plum shadow. Links use 16px Synonym, 44px minimum targets, pill hover fills, and a maroon-tinted active state. At 960px and below, links collapse behind a 44px menu control and open in a separate 16px rounded white surface; the brand and menu control remain visible.

### Direct Information Panel

A large 16px rounded maroon panel groups high-value contact or purpose information. Rows use white line icons, muted-white labels, solid-white values, and translucent white dividers. Make the whole row interactive when it has a destination; a small diagonal arrow moves only on hover.

### Structured Row List

Timelines, topics, missions, and compact proof structures use aligned rows with one icon, year, or statistic column and one text column. Thin warm dividers create cadence without turning every entry into an icon card.

## Do's and Don'ts

### Do:

- **Do** let one oversized Chillax statement establish each major public surface.
- **Do** use a single deep-maroon mass to concentrate the most useful action or information.
- **Do** preserve 16px text and 44px minimum interactive targets across responsive states.
- **Do** stack multi-column stories in their existing semantic order on tablet and mobile.
- **Do** use simple line icons, dividers, and generous whitespace to organize supporting detail.

### Don't:

- **Don't** replace structured rows with a generic directory of repeated icon cards.
- **Don't** spread maroon evenly across every heading, badge, border, and surface.
- **Don't** add shadows to ordinary reading sections or every container.
- **Don't** use Chillax for paragraphs, dense instructions, or form input copy.
- **Don't** reorder content for responsive layouts or hide direct actions behind decorative interaction.
