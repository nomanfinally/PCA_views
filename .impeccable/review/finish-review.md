disposition: fix

Inputs: code-led grounded direction; no approved comp, decision comp, or catalog QUALITY BAR card exists for candidate 6. Review uses the textual contract. No browser was used; functional test results do not establish visual quality or accessibility certification.

## persistence

Pass for the review stage. PRODUCT.md and the workspace surface contract exist. The recorded FORM reference is `seed:7159a573b82cdede`, corroborated by the supplied handoff. DESIGN.md and its token sidecar are the subsequent documenter handoff for this replacement world. There are no required shipping raster assets.

Evidence: all nine supplied captures were opened and are valid: desktop.png (1440×1000), mobile.png (390×844), empty-desktop.png, empty-mobile.png, settings-desktop.png, settings-landscape.png (844×390), palette-desktop.png, populations-mobile.png, and export-mobile.png. Each contains its named surface, with no blank or failed-loading capture. The empty mobile surface intentionally continues below its scrollable viewport. Detector evidence is `[]` in detector.json. Source sampling covered the workspace/header, settings, export, sample inspector, modal/popover, color picker, keyboard trap, and shared CSS. Error, hover, keyboard-focus, inspector, and sample-table states were not supplied as captures and receive no visual certification here.

## fidelity

| Element / promise | Assessment | Evidence |
| --- | --- | --- |
| TYPE | Match | System sans, compact task labels, clear empty-state heading, and tabular scientific figures fit the Operate contract. The system font is expressly appropriate to this task surface. |
| MATERIAL | Match | Fine rules, plain controls, and computed chart geometry express the atlas margin without simulated paper, decorative illustration, or invented physical material. |
| GROUND | Match | White plot, deep forest header, and pale sage support surfaces visibly match OWN-WORLD. |
| THESIS | Match | The desktop chart dominates; population controls occupy a narrow outer margin. Advanced controls recede behind Appearance and Settings. |
| OWN-WORLD | Match with craft defect | Forest/sage hierarchy is consistent; the Export foreground is contradicted by the surviving white override, producing the contrast finding below. Population colors remain data encodings. |
| STORY | Match in captured scope | Open, axes, navigation, populations, and export remain discoverable. Mobile retains the chart and opens populations as a sheet. The sample-inspection signature is supported by sampled source but lacks a supplied rendered inspector state; inheritance and editing behavior remain the build thread's behavioral verification scope. |
| FIRST VIEWPORT | Acceptable adaptation | The desktop header is 60px instead of the contract's 56px; this does not diminish plot priority. At 390px the actions use familiar icons with accessible names in source and axes/search wrap, serving the confirmed mobile requirement. The 280px desktop margin becomes a sheet as promised. |
| FORM | Match | Candidate 6 botanical atlas is implemented through chart-first geometry and restrained margins. No competing catalog topology or decorative challenger language has displaced the confirmed structure. |

## ceiling

The restrained Operate direction is reached in composition: the chart receives the available area, populations stay legible, and landscape settings retain their close and completion controls. No ornamental device is owed by the absent catalog card. A rebuild would discard a suitable structure without addressing the actual defects.

Craft-floor assessment: no material banned scaffold, kicker, gradient lettering, glyph-icon substitution, invented illustration, or costume typography appears in the supplied views. Shared CSS themes selection, caret, reduced motion, and focus rings. The floor is not yet met because Export contrast fails and palette buttons lose their authored shape, adequate target spacing, and unselected focus indicator. Export's tab semantics also leave the active mode unannounced. The screenshots do not substantiate a full keyboard, contrast, or WCAG conformance claim.

## material_fixes

1. **F1 — Export foreground contrast.** `src/ui/styles/editors.css:15` and `:37` force white text over the lime background from `src/ui/styles/workspace.css:91`; desktop.png and mobile.png show white Export lettering/icon on `#d9eb9d`, approximately **1.29:1**. Acceptance: remove or reconcile the conflicting cascade so every enabled default/hover/focus/active header Export state has text contrast ≥4.5:1 and an identifiable icon; intended `#1c3b2d` on `#d9eb9d` gives approximately 9.53:1. Recapture the same desktop/mobile surfaces after checking actual computed colors.
2. **F2 — Palette shape, targets, and keyboard focus.** `src/ui/primitives/ColorPicker.tsx:426` onward requests 18×18px swatch buttons with 4px grid gaps, while `src/ui/styles/foundations.css:37` supplies a 36px minimum height; palette-desktop.png consequently shows narrow vertical ovals. Adjacent horizontal target centers are only 22px apart, and inline `outline: none` on unselected swatches suppresses the shared focus outline. Acceptance: use deliberate undistorted swatch geometry, targets at least 24×24px (or valid equivalent spacing), a visible keyboard focus indicator distinct from the selected-color indication, and palette dimensions/positioning that keep every row and custom-color control reachable at 390×844 and 844×390. Verify keyboard selection and focus restoration with the existing trap; preserve color values and native input behavior. Supply the updated palette capture plus focused/mobile palette evidence.
3. **F3 — Export mode semantics.** `src/ui/features/export/ExportDialog.tsx:282` declares a tablist whose children are ordinary buttons, with no tab roles, selected state, or associated tabpanel. Acceptance: implement a complete keyboard-operable tab pattern (`role=tab`, `aria-selected`, named/linked panels, roving focus and arrow/Home/End navigation), or replace the tablist with a correctly named button group that explicitly exposes the current mode. The active mode and changed content must be understandable without visual color; maintain horizontal reachability on mobile. Verify all three modes and preserve export scope/contents.

## keep

Keep the white plot as the working surface, forest header, sage population margin, collapsible mobile population sheet, named task controls, and scientific distinctions between source/edit values, visibility, selection, marking, and exclusion; do not alter scientific values, local processing, formats, or offline archive behavior while fixing these three items.
