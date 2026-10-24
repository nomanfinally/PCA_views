---
name: PCA Views
description: A restrained research atlas for inspecting precomputed PCA results.
colors:
  forest-header: "#153f30"
  forest-accent: "#235b3e"
  forest-hover: "#17452e"
  forest-active: "#103722"
  forest-tint: "#e4efe5"
  export-lime: "#d9eb9d"
  export-lime-hover: "#e6f3be"
  export-ink: "#1c3b2d"
  paper: "#ffffff"
  sage-surface: "#f4f7f3"
  sage-hover: "#e9f0e9"
  sage-controls: "#f0f5f1"
  sage-preview: "#edf3e9"
  border: "#d6e0d7"
  border-strong: "#afbeb1"
  ink: "#24392c"
  ink-secondary: "#475e4e"
  ink-muted: "#5c6e60"
  header-ink: "#f6fcf8"
  charcoal-button: "#1f2328"
  charcoal-hover: "#374151"
  charcoal-active: "#111827"
  tool-selected: "#e0eee6"
  tool-selected-ink: "#19563a"
  warning-paper: "#fff8df"
  warning-ink: "#604817"
  error-paper: "#fff1ee"
  error-ink: "#8c2922"
typography:
  display:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1.16
    letterSpacing: "-0.03em"
  title:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "17px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  section:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.25
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "14px"
  control:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "13px"
    fontWeight: 500
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "12px"
  numeric-editor:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "11px"
rounded:
  compact: "3px"
  control: "5px"
  button: "6px"
  floating: "8px"
  drop-target: "10px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.charcoal-button}"
    textColor: "{colors.paper}"
    rounded: "{rounded.compact}"
    padding: "0 12px"
  button-primary-hover:
    backgroundColor: "{colors.charcoal-hover}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.button}"
    padding: "7px 11px"
  button-header-export:
    backgroundColor: "{colors.export-lime}"
    textColor: "{colors.export-ink}"
    rounded: "{rounded.compact}"
    padding: "0 12px"
  button-header-export-hover:
    backgroundColor: "{colors.export-lime-hover}"
    textColor: "{colors.export-ink}"
  button-toolbar:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.button}"
    padding: "7px 11px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "6px 9px"
  navigation-settings:
    backgroundColor: "{colors.sage-surface}"
    padding: "12px"
    width: "156px"
  badge-example:
    rounded: "{rounded.compact}"
    padding: "3px 6px"
  card-upload:
    backgroundColor: "{colors.sage-preview}"
    rounded: "{rounded.drop-target}"
    padding: "28px"
  population-row:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px"
  inspector:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.floating}"
    padding: "14px"
    width: "300px"
---

# Design System: PCA Views

## Overview

**Creative North Star: "The Research Atlas"**

A quiet scientific working surface: forest green frames white plotting paper, with pale sage margins for tools and population information. Fine borders, compact controls, and explicit labels give the data the strongest visual presence. The botanical reference lives in the palette and margin structure; the interface uses familiar web controls and no ornamental imagery.

The interface supports deliberate inspection and figure preparation. Scientific colors belong to samples and populations; interface colors communicate actions and state. System sans typography serves the operating interface, with aligned numeric data and compact monospace editors. No raster assets or approved image composition are part of this system.

**Key Characteristics:**

- White plotting paper and sage supporting surfaces.
- Forest framing, restrained lime export emphasis, and fine structural rules.
- Compact named actions; desktop Appearance disclosure and horizontal tool scrolling on phones and short landscape screens.
- Scientific color and row identity preserved across inspection and export.

Authority: the effective cascade in [src/styles.css](src/styles.css), [tokens.css](src/ui/tokens/tokens.css), [foundations.css](src/ui/styles/foundations.css), [editors.css](src/ui/styles/editors.css), [workspace.css](src/ui/styles/workspace.css), and [surfaces.css](src/ui/styles/surfaces.css), plus component inline styles. Import order is tokens → foundations → editors → workspace → surfaces. Later styles and selector specificity matter: the original gray token declarations alone do not describe the shipped world. Product constraints come from [PRODUCT.md](PRODUCT.md); the workspace composition remains in its [surface brief](.impeccable/surfaces/src-ui-features-workspace-workspace-tsx.md).

## Colors

The palette is low saturation around the chart, with stronger color reserved for actions, feedback, and scientific encoding. The frontmatter records effective values; it does not reproduce every retained legacy variable or every data swatch. Sidecar tonal ramps are synthesized OKLCH preview strips for the design panel, not production tokens or scientific palettes.

### Primary

- **Forest header** frames the dataset and major actions. Header text uses the light header ink; secondary metadata is a softer pale green.
- **Forest accent**, hover, active, and tint supply links, general keyboard focus, native checkbox accents, and supporting interaction state.
- **Export lime** highlights the header's Export action with dark export ink. Hover and focus retain that dark foreground while using the lighter lime variant.
- **Charcoal button**, hover, and active are the implemented ordinary primary/Done button family. They use white text. They are distinct from the forest interaction accent and lime header Export.

### Neutral

- **Paper** is the default chart and field surface.
- **Sage surface** is the page, population dock, settings rail, and footer ground; **sage controls** separates axes/search from the plot; **sage preview** supports upload and export previews.
- **Border** separates surfaces; **border strong** outlines fields. **Ink**, **ink secondary**, and **ink muted** establish content hierarchy.
- **Tool selected** and **tool selected ink** identify the current tool, with a visible border as an additional cue.

### Feedback and scientific encoding

Amber notice paper with warning ink signals import feedback; warm error paper with error ink signals errors. Feedback must retain readable text and a meaningful message.

Population colors are scientific encodings, not extra brand accents. The six categorical sequences (`classic`, `pastel`, `solid`, `neon`, `muted`, `earth`), deterministic overflow colors, and classic tint adjustment live in [palettes.ts](src/core/color/palettes.ts). The default is `solid`. The 80-color chooser and custom recent colors in [ColorPicker.tsx](src/ui/primitives/ColorPicker.tsx) are editable data/style choices, not UI role tokens. Never recolor them to make the interface look more uniformly green.

**The Encoding Rule.** Keep UI state colors separate from scientific palette assignments; show names, counts, visibility text, and selection/focus treatments alongside color.

## Typography

The interface uses the system sans stack recorded in the frontmatter; no webfont download is required. Numeric fields use the recorded monospace stack, and coordinate/table/count values use tabular figures where specified in [foundations.css](src/ui/styles/foundations.css). Do not infer that every Plotly label inherits the interface font: [plotlyMapper.ts](src/plot/adapters/plotly/plotlyMapper.ts) supplies figure sizes/colors without a global font family, while [canvasComposer.ts](src/services/export/canvasComposer.ts) explicitly draws export headings and legends in Arial.

The implemented hierarchy is a compact app scale: brand title (17px), section headings (14px), modal headings (13px, weight 600), body (14px), named controls/table rows (13px), and secondary labels/counts (12px). Empty-state introduction copy uses a larger heading (36px, shrinking to 29px on mobile) and explanatory copy (15px, line height 1.75; 14px on mobile). This empty-state size is not a mandate for new operating screens.

**The Numeric Alignment Rule.** Use tabular figures for aligned measurements and counts, preserve meaningful coordinate precision, and keep identifiers readable without changing their underlying values.

Legacy editor rules still produce some smaller helper text and gray labels, including 9px helper copy outside settings. These are observed exceptions, not a recommended type scale for future features.

## Layout

The operating shell fills the dynamic viewport (100dvh), uses a vertical flex structure, and contains overflow within chart, docks, tables, and dialogs. The chart flexes into remaining space with zero minimum flex dimensions; it is not placed inside a decorative card. Optional chart aspect ratios fit within the chart container rather than forcing page overflow.

The desktop workspace has a header (minimum 60px; padding 10px 20px), axes/search row (10px 20px), toolbar (7px 20px), flexible chart, and status row (minimum 34px; 7px 20px). The dock is 280px wide by default; left/right positions use an outside margin, and top/bottom positions use a full-width strip capped at 200px. Compact scrolling layouts use a 48px header, 49px axes/search and toolbar strips, and a 24px status row.

Use the recorded spacing scale for repeated gaps and padding. Compact controls also use 3px, 5px, 6px, 7px, 9px, and 10px optical adjustments already present in source; this is a practical rhythm rather than a strict universal grid.

Responsive behavior is defined by both [breakpoints.ts](src/ui/tokens/breakpoints.ts) and CSS:

| Threshold          | Implemented behavior                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| At or below 1100px | Hide toolbar hint/sample metadata; reduce horizontal header padding to 12px and dock width to 250px.                                                                                                                                                                                                                                                                                                            |
| At or below 1024px | Offer compact maximize behavior; hide status hint; reduce empty-state spacing. Hook tablet range is 641–1024px; desktop begins at 1025px.                                                                                                                                                                                                                                                                       |
| At or below 768px  | Export dialog stacks preview and options, scrolls format tabs, and wraps footer controls.                                                                                                                                                                                                                                                                                                                       |
| At or below 640px  | Mobile category; header, axes/search, and toolbar stay on single horizontally scrolling rows, with 44px action targets and all advanced tools inline. Settings tabs remain a scrolling horizontal rail. The population dock becomes a fixed sheet 8px from the sides, bottom 42px, maximum 60dvh, with 44px population rows. Fresh mobile sessions start with the dock closed. |
| At or below 1024px wide and 480px high | Short landscape screens use the same compact scrolling controls. Fresh sessions start with the population dock closed; restored archive dock choices remain authoritative. |
| At or below 540px  | Retained settings rules further compact controls and rail button padding; inspect alongside the later 640px horizontal-rail override rather than treating this as a separate layout system.                                                                                                                                                                                                                     |

**The Chart Space Rule.** On phones and short landscape screens, preserve chart height with native horizontal scrolling for header actions, axes/search, and every plot tool. Keep these rows unwrapped and advanced tools inline, with 44px action targets and accessible names.

With the population dock closed, the verified chart occupies the full viewport width and measures 674px high at 390×844, 398px at 320×568, and 220px at 844×390. These are observed layout checks, not fixed chart heights. See [mobile layout measurements](.impeccable/review/mobile-restore/layout-metrics.json).

The sample table remains horizontally scrollable (mobile minimum table width 620px). At mobile sizes the inspector uses `min(300px, calc(100vw - 16px))`, left 8px, bottom 40px, and bounded height. The empty state changes from two columns (maximum 1180px, 72px gap) to one column at 640px; its page padding decreases from 56px 40px to 28px 20px. See [workspace.css](src/ui/styles/workspace.css) and [surfaces.css](src/ui/styles/surfaces.css).

## Elevation & Depth

Structural surfaces are flat and separated by tone and a single fine rule. Shadows identify floating tools, sample inspection, selection actions, and modal layers; they do not decorate the chart or population rows.

- Floating editor and inspector shadow: `0 14px 32px #193c282b`.
- Desktop Appearance panel: `0 12px 28px #173b3024`; mobile dock: `0 12px 32px #173b3033`.
- Floating selection actions: `0 8px 20px #173b3024`.
- Modal: `var(--shadow-modal)`, currently `0 24px 48px -12px rgba(0, 0, 0, 0.25)`.
- Color palette: `0 4px 20px rgba(0, 0, 0, 0.15)`.

The modal backdrop is translucent dark ink (`rgba(17, 24, 39, 0.45)`) without blur. Actual layers include toolbar 12, selection actions 20, inspector 25, mobile dock 30, popover 50, modal 100, notices 200, drop overlay 250, and portaled palette 99999. Retained z-index token names do not all match actual component layering; consult the active component before extending an overlay.

**The Floating Layer Rule.** Reserve shadows for content floating above the working surface, and preserve keyboard focus and dismissal order when adding a layer.

Motion is brief control feedback: button/picker transitions use 120–150ms easing, swatches use 100ms, and busy spinners rotate over 1 second. The global reduced-motion query reduces animation and transition duration to 0.01ms and restores automatic scrolling. No entrance spectacle is part of this system.

## Shapes

Controls use small softened corners: ordinary buttons (6px), fields and rows (5px), compact primary actions and modal shells (3px), floating editors (8px), and the upload target (10px). Color swatches and scientific circle markers are round. Single-pixel borders and restrained dashed upload outlines establish boundaries; rounded card stacks are not the workspace's spatial model.

## Components

### Buttons and tools

Ordinary native buttons have minimum height 36px and padding 7px 11px. Icon buttons are 36px square. Primary/Done declarations retain a compact nominal height (29px), but the inherited 36px minimum remains effective; upload primary increases to 42px and compact scrolling header/tool controls to 44px. Primary is charcoal at rest, slate on hover, deep charcoal when active; the header Export variant is lime with dark lettering. General disabled controls use opacity 0.48; the reusable Button primitive uses 0.45 and disables pointer events. The reusable `.btn-primary`/Done family still uses important legacy dark tokens; do not assume its default is the native primary's charcoal. See [Button.tsx](src/ui/primitives/Button.tsx), tokens, and editor styles.

General focus is a 2px forest outline offset 3px. The reusable Button primitive uses a 2px offset. Active plot tools use a sage fill, dark green text, and border, plus `aria-pressed`. Native `<details>` exposes the named Appearance controls on desktop. Compact scrolling layouts show every advanced action inline in the toolbar; icon-first controls retain accessible names and titles.

### Fields

Fields are white with the strong border, minimum height 36px, 6px 9px padding, and 5px corners. Native checkbox/radio defaults are 18px, with smaller retained editor overrides. Search combines a bordered wrapper, inline icon, and borderless input. Numeric editors retain a specific blue focus border/glow from [editors.css](src/ui/styles/editors.css); that legacy exception is not a new system accent.

### Population dock and sample inspector

Population rows carry an actual data marker, a truncating name, tabular count, visibility state, and a separate options action. Desktop rows have a 38px minimum; mobile rows increase to 44px and options actions to 40px. Hidden rows include struck-through names and an explicit hidden label. Dock open/close remains a layout control, independent of population visibility.

The sample inspector is a bounded white floating surface (300px, 14px padding, 8px corners) that retains sample ID, group, coordinates, and inherited/overridden style context. Fine rules separate identity, exclusion, and styling. Inspection, marking, selection, hiding populations, and exclusion remain visibly distinct. See [LegendDock.tsx](src/ui/features/populations/LegendDock.tsx), [LegendRow.tsx](src/ui/features/populations/LegendRow.tsx), and [PointInspector.tsx](src/ui/features/samples/PointInspector.tsx).

### Dialogs and tabs

[Modal.tsx](src/ui/primitives/Modal.tsx) portals a labeled `aria-modal` dialog to the body, makes the application root inert, and uses a 16px backdrop gutter, maximum 90vh, minimum 56px header, scrollable body, and 3px shell corners. Settings requests 880px width, Export 1000px, Samples 1160px; each has an explicit viewport cap. Inline shell sizing takes precedence over stylesheet declarations; do not copy obsolete CSS modal dimensions as the effective result.

[useKeyboardTrap.ts](src/ui/hooks/useKeyboardTrap.ts) selects the top active layer by z-index, traps Tab/Shift+Tab, handles Escape, and restores the connected trigger. The initial focus is the current tab when available, otherwise the first control. Backdrop clicks close modals; [Popover.tsx](src/ui/primitives/Popover.tsx) also closes on outside interaction while exempting portaled child pickers and clamps placement to an 8px viewport gutter.

Settings uses a 156px sage navigation rail on desktop and a horizontally scrolling rail on mobile. Selected sections use a sage fill and dark green text. Its arrow keys move focus and Enter/Space activates the focused tab. Export tabs activate and move focus with Left/Right/Home/End, expose `aria-selected`, use roving tab stops, and name their corresponding panels. Preserve these different implemented activation models when extending each dialog. See [SettingsDialog.tsx](src/ui/features/settings/SettingsDialog.tsx) and [ExportDialog.tsx](src/ui/features/export/ExportDialog.tsx).

### Color and shape pickers

The color picker has a textual hex trigger, circular active swatch, and portaled dialog. The palette is at most 344px wide, keeps an 8px viewport gutter, and scrolls within viewport height. Eight rows of ten round swatches use a four-pixel gap and at least 24px square targets; custom swatches are 28px. Selection uses an inset dark-green ring while keyboard focus uses the separate outer forest outline. Escape closes the top palette first and returns focus to its trigger. Recent custom colors are local style preferences, not stored sample data. Shape options use a seven-column grid of 28px targets, 4px gap/corners, and an enclosing focus treatment. Source: [ColorPicker.tsx](src/ui/primitives/ColorPicker.tsx), [ShapePicker.tsx](src/ui/primitives/ShapePicker.tsx), and surface styles.

### Upload and data containers

The upload target uses a dashed border, pale sage fill, 28px padding (20px mobile), and a clear file action. The synthetic preview uses computed SVG geometry. Tables use sticky sage headers, 10px 12px cells, fine row rules, right-aligned numeric cells, and a scrollable bounded container. The small outlined EXAMPLE badge labels synthetic data; it is an informational tag, not a filtering chip or a general marketing badge.

## Do's and Don'ts

### Do:

- **Do** extend the white chart, sage support surfaces, forest framing, and fine-rule hierarchy using effective source tokens.
- **Do** keep data markers, identifiers, counts, edit state, visibility, selection, and exclusion understandable together.
- **Do** verify focus, keyboard navigation, nested Escape, viewport clamping, and trigger restoration when extending dialogs or palettes.
- **Do** preserve browser-only data processing and offline archive functionality when adding visual features.
- **Do** inspect mobile portrait and landscape alongside desktop, especially palette, dock, settings, and export overflow.

### Don't:

- **Don't** reuse a scientific population color as the only signal for an interface action or state.
- **Don't** introduce ornamental raster assets, decorative chart cards, or unrelated typography into the implemented atlas world.
- **Don't** copy superseded gray tokens, tiny legacy helper text, or numeric-editor blue focus as a new default design rule.
- **Don't** alter scientific values or row identity to simplify the display, or conflate hidden, selected, marked, and excluded samples.
- **Don't** describe passing focused checks as whole-app WCAG certification. The [finish verdict](.impeccable/review/finish-verdict.md) resolves its three-item fix list; it does not establish global conformance.
