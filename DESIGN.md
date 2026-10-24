---
name: PCA Views
description: The compact black and grey viewer restored from the owner-selected reference.
colors:
  accent: "#222222"
  ink: "#363636"
  secondary-ink: "#555555"
  muted-ink: "#696969"
  paper: "#ffffff"
  header: "#f7f7f7"
  support: "#fafafa"
  hover: "#f2f2f2"
  selected: "#e8e8e8"
  line: "#e5e5e5"
  field-border: "#d0d7de"
  strong-border: "#bcbcbc"
  focus: "#777777"
  action-hover: "#374151"
  action-active: "#111827"
typography:
  title:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "14px"
    fontWeight: 620
    letterSpacing: "-0.35px"
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "12px"
  control:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "11px"
    fontWeight: 500
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "10px"
  numeric-editor:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "11px"
rounded:
  legend: "2px"
  control: "3px"
  mobile-legend: "4px"
spacing:
  compact: "4px"
  control-gap: "6px"
  small: "8px"
  medium: "12px"
  large: "16px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "29px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
    textColor: "{colors.paper}"
  button-primary-active:
    backgroundColor: "{colors.action-active}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "#1f2328"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "29px"
  button-toolbar:
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.control}"
    size: "29px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "27px"
    padding: "0 6px"
  navigation-settings:
    backgroundColor: "{colors.support}"
    padding: "12px 0"
    width: "150px"
  badge-example:
    backgroundColor: "#f0f0f0"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.control}"
    padding: "3px 5px"
  floating-legend:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.legend}"
    width: "202px"
---

# Design System: PCA Views

## Overview

**Creative North Star: "The Compact Research Viewer"**

The owner selected commit `4dfd9238410fc9f22af9c5e05290460b1eba79e4` as the exact desktop and mobile visual authority. Black and grey chrome, Arial labels, fine rules, small controls, and a white full-width chart restore that implementation. This replaces the later forest/sage visual system and enlarged controls.

The interface is a dense scientific working surface. Population colors encode data; neutral interface colors communicate actions and state. Preserve the newer feature boundaries, scientific correctness, keyboard behavior, rendering, and export implementation while extending this restored visual system.

**Key Characteristics:**

- Compact Arial interface with a black brand tile and light grey header.
- Integrated toolbar with every desktop tool directly available.
- Full-width white chart and a floating population legend.
- Two-row mobile toolbar with horizontal tool scrolling.

Authority: [src/styles.css](src/styles.css) imports [tokens](src/ui/tokens/tokens.css) → [foundations](src/ui/styles/foundations.css) → [workspace](src/ui/styles/workspace.css) → [editors](src/ui/styles/editors.css) → [surfaces](src/ui/styles/surfaces.css) → [compatibility](src/ui/styles/compatibility.css). Later overrides and component styles matter. [PRODUCT.md](PRODUCT.md) and the [workspace brief](.impeccable/surfaces/src-ui-features-workspace-workspace-tsx.md) record the approved reference and scope.

## Colors

### Primary

Accent is the black brand tile, ordinary primary action, and neutral interaction accent. Primary hover and active retain white text. Reusable dark/Done buttons retain their existing dark token family; their default uses action-active.

### Neutral

Paper is the chart, fields, and desktop legend. Header and support distinguish chrome and settings navigation. Ink, secondary ink, and muted ink establish hierarchy; line and field borders divide compact controls. Selected grey identifies active tools. Focus uses the final compatibility override.

**The Encoding Rule.** Keep scientific population colors separate from interface tokens; preserve names, counts, marker shapes, visibility, and selection cues alongside color.

Scientific palettes and deterministic overflow colors remain in [palettes.ts](src/core/color/palettes.ts). The [ColorPicker](src/ui/primitives/ColorPicker.tsx) chooser and recent/custom colors are data style controls. Existing warning, error, exclusion, and marking colors retain their meanings. Sidecar tonal ramps are synthesized panel previews, not new production palettes.

## Typography

Arial is the main interface family. The reusable Button primitive retains its declared system sans token; numeric editors retain the monospace token. No downloaded font is required. The brand title reduces to (13px) on phones. Secondary labels range from (8px) to (11px). The original empty heading is (23px), reducing to (19px) on phones.

**The Numeric Alignment Rule.** Use tabular figures for aligned coordinates and counts; preserve meaningful precision and identifiers.

## Layout

The app fills the dynamic viewport with a fixed header, integrated toolbar, flexible chart, and fixed footer. Desktop dimensions are header (42px), toolbar (38px), footer (25px), and icon buttons (29px). Samples Table leads the tool row; Settings and Export remain toolbar tools. All desktop tools are directly available, with no Appearance disclosure.

At widths up to (1024px), axes/search occupy the first toolbar row and tools scroll horizontally on the second. At widths up to (640px), the header is (38px), toolbar (66px), footer (19px), and tool icons (24px). Tablet headers may wrap. Keep the original compact targets; enlarged targets would change the approved composition.

Verified chart bounds from paired reference/restored captures:

| Viewport | Chart | Chart top |
| --- | --- | --- |
| 1440 × 1000 | 1440 × 895 | 80 |
| 390 × 844 | 390 × 721 | 104 |
| 320 × 568 | 320 × 445 | 104 |
| 844 × 390 | 844 × 237 | 128 |

The desktop legend floats upper-right at its recorded width and reserves no sidebar. On phones it floats lower-right at (250px), bounded to viewport width and (48vh) height. Floating selection actions must not resize the chart. Preserve the maximize/restore path.

## Elevation & Depth

Most surfaces are flat, separated by fine rules. Floating editors use `0 9px 32px #33333324`; settings use `0 12px 50px #0003`; the mobile legend uses `0 4px 20px rgba(0, 0, 0, 0.22)`. Modal backdrops retain (2px) blur. The palette keeps its existing shadow and portal ownership. Shadow and motion records live in the sidecar.

## Shapes

Controls use compact corners; the desktop legend is nearly square and the mobile legend slightly rounded. Fine one-pixel borders define fields and dialogs. Scientific marker shapes remain data encodings. Preserve the palette's minimum (24px) swatch geometry and viewport clamping.

## Components

Buttons use the recorded compact variants, grey hover/pressed states, and neutral visible focus. The final general focus outline is (2px) with (2px) offset. Numeric editors also retain their existing blue border/glow; this local state does not define a new UI accent.

Fields remain white and compact. Axis selectors are (27px) on desktop and (24px) in compact layouts. Search uses a quiet border and compact text. Hover, focus, disabled, and selected states follow the effective cascade.

Settings retain a centered dialog, left tab list, scrollable panel, and footer actions. The settings rail narrows to (94px) below (540px). Active tabs use a dark left rule and grey background. Preserve settings/export tab semantics, keyboard navigation, focus restoration, and nested Escape ownership.

The floating legend keeps compact rows, scientific markers, names, counts, visibility controls, and per-population editing. Hidden labels retain their strike-through cue. The synthetic Example badge is informational and hidden on phones.

The original empty upload surface retains its faint grid, eyebrow, numerical hints, upload action, and example action. This composition is explicitly included in the owner-selected reference.

Feature code remains under [workspace](src/ui/features/workspace/), [populations](src/ui/features/populations/), [samples](src/ui/features/samples/), [settings](src/ui/features/settings/), [export](src/ui/features/export/), and [upload](src/ui/features/upload/). Visual restoration does not merge these boundaries.

## Do's and Don'ts

- **Do** match the selected reference across desktop, phone, small, and landscape viewports.
- **Do** preserve the white full-width chart, integrated tools, floating legend, and original empty surface.
- **Do** retain truthful scientific state, palette geometry, tab semantics, focus ownership, and offline exports.
- **Don't** reintroduce forest/sage chrome, a permanent legend sidebar, an Appearance drawer, or enlarged controls.
- **Don't** recolor scientific populations to match interface chrome or conflate hidden, marked, selected, and excluded samples.
- **Don't** treat reference fidelity or passing focused checks as whole-app accessibility certification.

Evidence: all 20 paired captures and the independent [ship review](.impeccable/review/classic-restore/finish-review.md) cover reference fidelity and introduced visual regressions. Documentation validation checks local structure and token references; it does not establish WCAG conformance or a complete browser/device guarantee.
