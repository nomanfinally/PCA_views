# Refactor changelog

## Approved scope

The owner approved automatic execution of every phase and a plot-first workspace with a collapsible population panel and sample inspection on demand. The discovery report was delivered before application edits. Scientific data formats, row identity, source-versus-edited groups, and offline archives remain compatibility requirements. No runtime or development dependency was added. The external foundation repository and `legacy/` were not changed.

## Step 1 — Tests of the active implementation

Migrated behavioral fixtures from superseded `domain` modules onto active `core`, `state`, `plot`, and export services. A small test-only fixture composes the production specification and mapper; it does not duplicate their logic. Tests now reflect actual default alpha and per-sample font arrays. Removed the superseded `src/components/` and `src/domain/` implementations, about 6,800 lines.

Verification: 150 unit tests passed after migration and the production build passed. Later removed eight tests that only exercised handwritten copies of UI handlers or checked that an unused hook existed. Actual cyclers, settings resumability, responsiveness, and keyboard flows remain covered by browser interactions.

## Step 2 — Functional consistency and export ownership

- Percentage primitives display human percentages and convert back to fractions, with matching bounds and steps.
- Sample group edits preserve table pagination. Inclusion labels describe explicit exclusions accurately; workspace status separately reports visibility.
- Sample style previews use the same population ordinal as the figure. Hull availability respects exclusions and the two-point fallback.
- Effective group lookup uses row keys. The header reflects edited groups and the footer counts exclusions explicitly.
- PNG capture propagates requested scale, invalidates captures when scale changes, and checks actual output pixel limits.
- Decoded image caching uses weak ownership. Replaced and final preview URLs are revoked, and failed previews clear stale downloadable images.

Verification: unit/build checkpoints passed. Browser tests cover group edits, geometry, separate alpha controls, figure/legend composition, repeated image settings, and numeric/archive integrity. New tests exercise human percentages, pagination after edits, and nested Escape.

## Step 3 — Immutable derivations

Added `state/datasetIndex.ts` for cached row lookup, population ordinals, and lazy axis ranges. Weak keys let datasets and their indexes be collected after session replacement. Range callers receive copies. `useVisibleSamples` depends on dataset, search, exclusions, and hidden population names rather than the complete view state.

Verification: two new unit tests cover duplicate IDs, non-positional row keys, cache identity, and independent returned ranges. The suite passed 152 tests at this checkpoint. Existing axis, filtering, and SVG/WebGL browser tests continue to exercise output behavior. Geometry caching remains a measured follow-up; no blanket speedup is claimed.

## Step 4 — Renderer boundary and scheduling

Moved vendor-specific image-figure preparation into `plot/adapters/plotly/imageFigure.ts`. Canvas composition no longer imports the concrete mapper. Gestures request a live plot box through an injected interface. Hit testing calls the adapter's projection API and checks current axes; private Plotly layout access stays inside the adapter.

Pending presentation redraws now replace obsolete queued specifications. Viewport changes, resize, flush, and capture form ordering barriers. Static export uses Plotly's figure-image path without an extra manual plot construction. File download transport moved to `services/files/download.ts`, with compatible exports retained from CSV services.

Verification: build and 152-test unit checkpoint passed; added regression assertions for redraw coalescing and viewport-command order. Browser checks passed SVG/WebGL anchored wheel zoom, appearance edits during navigation, selection, dragged labels, PNG fidelity, and interactive HTML reopening. The offline WebGL export timeout observed at baseline passed in the redesigned full run.

## Step 5 — Feature modules and plot-first interface

Moved the application and loading lifecycle to `src/app/`. Moved screens into `ui/features/{workspace,populations,samples,settings,export,upload}`. Existing component barrels forward to the feature modules. Split settings into seven section components; extracted axis/search controls from the workspace. Retired the unused older responsive hook. Cleaned unused imports and feature-local bindings.

Replaced the long equal-weight icon strip with named navigation/selection tools and an Appearance disclosure. Header actions keep Samples, Settings, and Export discoverable. Desktop populations occupy a dedicated margin outside the chart; mobile starts with the panel closed. Selection actions float without changing chart dimensions. The empty state includes actual synthetic example coordinates and clear local-file guidance. CSS now has explicit token, foundation, workspace, editor, and dialog/surface ownership; accumulated important overrides were removed.

Modal dialogs use a body portal and make the workspace inert. Keyboard traps account for nested visual layers; palette Escape closes only the palette. Focus return captures the invoking control before React autofocus commits. Toolbar navigation supports arrow keys and Home/End. The population inspector remains non-modal.

Verification: production builds passed throughout module moves and the redesign. Desktop, 390px mobile, open panels, settings, empty and export states were inspected. The full intermediate browser run passed 32 of 33; the remaining obsolete toolbar-count assertion was updated to the new status location. New interaction tests exposed and prompted a real autofocus/focus-return fix. Final results and independent review follow below.

## Step 6 — CI, current documentation, and review

Added pull-request unit/build/Chromium checks and a deployment browser gate. Failure artifacts are retained for review. Replaced speculative architecture documentation with the actual dependency boundaries and updated README workflows. The original discovery snapshot remains in the plan, clearly distinguished from execution results.

Final verification: **146 unit tests passed** across 23 files; **37 of 37 Chromium browser scenarios passed**; production TypeScript/Vite/archive-runtime build passed. `git diff --check` passed. Static relative-import inspection found no circular imports, unresolved relative source imports, or private Plotly layout reads outside the adapter. No new dependencies, external foundation edits, or `legacy/` changes.

The final full browser run covers both renderers, offline SVG/WebGL reopening and PNG export, numerical precision, source/edited groups, visibility/exclusions, selection, labels, keyboard ownership, stable pagination, actual percentage semantics, mobile layout, palette target dimensions/focus/selection, and export-tab navigation. The lower unit-test count reflects retiring eight tests of copied handlers/unused-hook existence after adding four meaningful cache/renderer/export tests; it does not indicate eight dropped scientific regressions.

Impeccable's one explicit detector pass reported `[]`. Independent review requested three material fixes: Export contrast, palette geometry/targets/focus, and export-tab semantics. Removed conflicting legacy important overrides, enlarged and squared palette targets with separate focus/selection indicators, and implemented linked tabs with arrow/Home/End navigation. Recaptured eleven desktop/mobile/landscape states. The reviewer scored **all three fixes resolved**, disposition **ship**, in `.impeccable/review/finish-verdict.md`; that verdict covers the fix list, not universal accessibility certification. The remaining important declarations serve reduced-motion preferences and vendor cursor overrides.

A controlled before/after model benchmark used 10,000 synthetic samples and 50 populations, four warmups and 20 interleaved builds per implementation in one Node process. Median spec+mapper time was **30.30ms before, 29.23ms after**, with overlapping ranges (25.05–46.82ms and 22.78–47.32ms). This small difference is not a substantial end-to-end speedup. The specific reductions in repeated indexing, bounds, filtering invalidation, and obsolete redraw work remain the rationale. Method and results: `.impeccable/review/model-benchmark.json`.

Design tokens and component guidance are persisted in `DESIGN.md` and `.impeccable/design.json`. Local hook consent and caches are ignored by Git; shared settings, the current feature-path surface brief, and review evidence remain available.

## Explicit follow-ups and limits

- Independent hull/regression caching requires measured input invalidation; current caching covers indexes and bounds.
- Imported archives still have light runtime validation. A strict schema/migration pass should be isolated with malformed and historical archive fixtures.
- The sample table and individual inspector can be decomposed further when new features justify it. The workspace still owns session orchestration; the current pass reduces distinct concerns without introducing a new state framework.
- The large local Plotly bundles still produce build chunk-size notices. They support offline archives and remain lazy in hosted use.
- Chromium automation and screenshot review do not establish universal browser/GPU compatibility or WCAG certification. Physical mobile and screen-reader testing remain valuable.

## Mobile correction — restore compact scrolling controls

The owner reported that the redesigned mobile controls consumed too much chart space and explicitly requested the earlier scrolling arrangement. Replaced wrapped controls with a compact 48px dataset header, 49px axes/search row, 49px tool row, and 24px status row. These are horizontal scroll containers rather than extra rows; every plot appearance action remains inline and reachable. Tools keep 44×44px targets, names for assistive technology, pressed states, and arrow/Home/End navigation. The same compact arrangement applies at widths up to 640px, and at widths up to 1024px when height is at most 480px.

New phone and short-landscape sessions start with populations closed; archive visibility and subsequent user choices remain preserved. The desktop toolbar retains its Appearance disclosure. Numeric/data handling, exports, palette/dialog fixes, and the modular architecture remain intact.

At 390×844 the chart is now 674px tall instead of 564px: 110px more plotting space, about 80% of viewport height. At 320×568 it is 398px; at 844×390 it spans the full width and is 220px tall. The document itself does not scroll horizontally. Evidence is in `.impeccable/review/mobile-restore/`.

Added browser coverage for chart height, every toolbar target's size and row position, on-demand populations, keyboard scrolling, scrolled search/settings access, desktop resize, and synthesized Chromium touch swipes that reveal tools without activating them. Targeted checks: eight passed. Final verification: **146 unit tests passed, 41 of 41 Chromium browser scenarios passed, and the production build passed**. The browser run includes existing offline SVG/WebGL archive and PNG assertions. Gestures were synthesized through Chromium touch input; no physical phone or Safari validation is claimed. Focused review and design documentation are recorded alongside the captures.

## User-pinned presentation rollback — desktop and mobile

The owner rejected the redesigned density and colours and named `4dfd9238410fc9f22af9c5e05290460b1eba79e4` as the visual reference. This supersedes both the forest/sage redesign and its later enlarged mobile scrolling controls.

Restored that commit's header, empty state, integrated toolbar, directly visible tool groups, compact responsive rules, floating legend, and black/grey accents. Restored Samples Table, Settings, and Export to the toolbar. Styles remain separated by layer and preserve the reference cascade order. The original commit was rendered separately from an isolated temporary checkout; paired reference/restored screenshots and layout measurements are in `.impeccable/review/classic-restore/`.

Measured reference and restored chart bounds match: 1440×895 at (0,80) on a 1440×1000 desktop, 390×721 at (0,104) on a 390×844 phone, 320×445 at (0,104) on a 320×568 phone, and 844×237 at (0,128) in 844×390 landscape. No core, state, plot adapter, service, worker, or application-loading module was rolled back. Feature folders, extracted axes, split settings, indexes/caches, redraw ordering, exact numeric export, original/edited archive state, preview resource cleanup, and focus ownership remain intact.

Small retained correctness differences from the historical UI: the grid control is an actual visible control; exclusion/inclusion labels and counts are truthful; the lasso uses a conventional crosshair; selection actions do not resize an in-progress gesture; nested palettes preserve focus; maximize retains floating axes and a restore control. The palette keeps its corrected target geometry and export tabs keep their accessible semantics. These are not a renewed redesign.

Independent reference review: **ship**, with no material fidelity or introduced visual-regression findings across all 20 paired captures. Unit verification: **146 tests passed**; production build passed. The full browser run passed 42 of 43 scenarios and exposed a keyboard Home scroll issue at 844px: focus reached the first tool but native scrolling left it partly clipped. The toolbar now explicitly reveals the focused tool and scrolls Home to the start. All six targeted viewport, touch, desktop-density, and maximize/restore tests passed after that correction; the final full run then passed **43 of 43 browser scenarios**. The final production build and whitespace check also passed. Results are recorded in `.impeccable/review/classic-restore/verification.json`.

The user-pinned reference supersedes earlier design guidance, including large touch targets and forest/sage styling. DESIGN.md and its machine-readable sidecar describe the restored monochrome system. The reference's small controls and dense typography are intentional restoration choices, not a claim of universal accessibility conformance. Chromium synthetic touch tests do not replace physical-device or Safari testing.
