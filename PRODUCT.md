# PCA Views

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary users are genomics researchers preparing analyses and publication figures. They already have computed principal component coordinates and need to inspect samples and populations, refine a figure, and export the intended data or a shareable interactive session.

This audience and publication workflow were confirmed by the project owner during initialization.

## Product Purpose

Make existing smartPCA / EIGENSOFT results easy to explore, annotate, customize, and share in a browser.

A successful session lets a researcher load an `.evec` file, inspect any pair of principal components, distinguish relevant samples and populations, make deliberate presentation or inclusion changes, and export a figure or dataset that accurately reflects those choices. Interactive HTML archives preserve the session for offline review and further editing.

The viewer reads precomputed PCA results. It does not calculate PCA or perform G25 reprojection.

## Positioning

PCA Views combines smartPCA-compatible input, population and individual sample editing, coordinate exports, and a self-contained interactive HTML archive in a client-only workflow. Using the viewer requires no account, database, API key, or application backend.

The value is the combination of scientific inspection, figure preparation, and portable interactive sharing with local data processing.

## Operating Context

- Researchers bring `.evec` files from an existing PCA run. An optional matching `.eval` file or a known total variance supplies a more complete variance denominator.
- The main workflow is load → choose PC axes → navigate and inspect → filter, mark, exclude, or edit groups/styles → export.
- Population controls, the sample table, point inspection, settings, and export are parts of one dataset session.
- The web interface supports desktop and mobile layouts. The application can be served as static files; exported interactive HTML can be opened directly without an internet connection.
- Session data lives in browser memory. Refreshing clears an ordinary session. Users preserve work by downloading an archive and save subsequent archive edits by exporting another file.
- A generated synthetic example supports exploration before a researcher loads their own data.

## Capabilities and Constraints

### Scientific data and terminology

- `.evec` rows contain a sample ID, at least two finite PC coordinates, and one population token. IDs and population tokens cannot contain whitespace. Population labels may be numeric.
- The eigenvalue header is optional. PC dimensions must be consistent across rows; a supplied header must match the number of saved PCs.
- IID means the sample ID. FID means the population/group label supplied in the file; no separate FID upload is required.
- Duplicate sample IDs are retained as distinct rows and reported. Selection, marks, edits, and exclusions must continue to distinguish those rows.
- Population and group describe the same grouping concept in this product. A sample is a data row; its point/marker is its visual representation.
- Axis percentages must identify a defensible variance denominator. With only leading eigenvalues available, the default denominator is the sum of loaded eigenvalues. A matching full spectrum or explicit total can support total-variance percentages. Invalid variance information must not produce misleading percentages.
- Group reassignment is an explicit sample edit. Retain the original dataset and keep edits distinguishable from its source values.

### Exploration and figure preparation

- Support PC-pair selection, zoom, pan, fit/reset, sample/population search, population visibility, and box/lasso selection.
- Marks, selection, population visibility, and explicit sample exclusion are different states. Excluded samples do not contribute to active plot geometry such as centroids and hulls.
- Provide population-level and individual sample styles, labels, hulls, and regression overlays. Sample overrides take precedence over population styles and global defaults.
- Export PNG figures with configurable headings and legend placement, CSV coordinates, smartPCA `.evec` data, and interactive HTML sessions.
- Distinguish exports of visible/filtered samples, selected samples, and all rows. Preserve edited group assignments and numeric values in the appropriate data exports.
- Current all-row exports annotate explicitly excluded samples with an `_excluded` population suffix. This is export metadata, not an automatic source-file mutation.
- Do not imply a specific physical print DPI merely from a pixel-size multiplier.

### Privacy, portability, and reliability

- Browser-only processing, numeric integrity, and offline interactive archives are established constraints confirmed during initialization.
- Sample identifiers and coordinates remain on the user's device during normal use. Do not introduce uploads, remote analysis, accounts, or server persistence without revisiting that product constraint.
- Source files remain unchanged. An invalid import must show a useful error and preserve the currently loaded dataset.
- Interactive archives must embed the dataset and necessary runtime and retain the view, edits, styles, inclusion state, and relevant export options. Loading another dataset must start a fresh dataset session.
- The current implementation has a 50 MB `.evec` input guard. This is an implementation limit, not a verified maximum-capacity or performance claim.

## Brand Commitments

The existing product name is **PCA Views**.

Use factual scientific terminology and distinguish viewing/editing precomputed results from calculating new results. Do not add unsupported claims of statistical validation, institutional endorsement, publication acceptance, or data security certification.

No new aesthetic direction, palette, typography, or brand replacement was selected during initialization.

## Evidence on Hand

- `README.md`: documented input format, workflows, session handling, exports, and static-hosting setup. Some UI inventory and architecture descriptions need reconciliation with the active implementation.
- `src/ui/components/dialogs/HelpModal.tsx`: existing in-product explanations and terminology.
- `src/core/parsers/example.ts`: generated synthetic demonstration data; it is not a real cohort or an analysis result.
- `src/core/parsers/`, `src/state/`, and `src/services/export/`: implemented parsing, editing, visibility, and export behavior.
- `src/test/` and `e2e/`: automated behavioral evidence. Passing tests do not establish correctness for every dataset, browser, or device.
- `legacy/`: historical implementation/reference material. Prefer the active application's behavior and verified fixes when sources disagree.

No customer testimonials, institutional endorsements, clinical use claims, or published performance benchmarks have been established in this initialization.

## Product Principles

1. Preserve scientific meaning: keep numeric values, row identity, group assignments, and variance interpretation accurate.
2. Keep data processing local and make offline sharing a complete workflow.
3. Make edits explicit and traceable to the original dataset; keep inclusion, visibility, selection, and marking understandable.
4. Let researchers move efficiently from inspection to an accurate figure or coordinate export.
5. Verify behavior in the active application and downloaded artifacts before presenting it as a product guarantee.

## Open Product Decisions

- A formal accessibility conformance target and any researcher-specific assistive-technology requirements have not been established.
- A supported browser/device matrix and validated dataset-size/performance targets remain to be defined.
- Undo history, optional session persistence, new input formats, and additional analysis methods are future decisions, not current product promises.
- No marketing, pricing, licensing, or commercial positioning changes were requested in this initialization.

## Visual reference and workspace preference

The owner explicitly selected commit `4dfd9238410fc9f22af9c5e05290460b1eba79e4` as the visual reference for both desktop and mobile, superseding the later forest/sage redesign and enlarged controls. Restore the compact black/grey interface, original header and integrated toolbar, all tools visible on desktop, horizontally scrolling tools on mobile, and the floating legend. Preserve the refactored feature modules, rendering/export boundaries, data integrity, and correctness fixes. New UI work should match that reference rather than introducing a new visual world.
