# Architectural Analysis: PCA Views

## 1. Overview & Current File/Module Structure

PCA Views is a client-side genomics visualization web application designed to parse, explore, customize, and export smartPCA (`.evec`) eigenvector data.

### Module Inventory & Responsibilities
- **Entry & Bootstrap**:
  - `src/main.tsx`: Mounts React application into `#root`.
  - `src/App.tsx`: Top-level application shell. Manages file dropzone events, global modal help dialog, and switches between empty/upload state and active workspace.
- **Data Ingestion & Workers**:
  - `src/hooks/useDataset.ts`: Orchestrates file selection, 50MB file size checks, Web Worker instantiation, error dismissal, and synthetic example dataset loading.
  - `src/workers/evec.worker.ts`: Web Worker parsing `.evec` text off the main thread.
  - `src/domain/parseEvec.ts`: Strict parser validating `.evec` header lines (`#eigvals:`), tab/space delimiters, numeric PC coordinates, and duplicate row identifiers.
  - `src/domain/example.ts`: Generates a synthetic 3-population eigenvector dataset.
- **Domain Models & Computation**:
  - `src/domain/types.ts`: Core data structures (`Sample`, `Population`, `Dataset`).
  - `src/domain/viewState.ts`: 587-line monolith containing domain types (`PlotSettings`, `PopulationStyle`, `SampleStyle`, `ViewState`), the comprehensive `viewReducer`, marker style calculators (`populationAppearance`, `markerAppearance`, `renderedMarker`), and sample filtering.
  - `src/domain/plotModel.ts`: Converts application domain state into Plotly traces, convex hull path shapes, regression lines, and centroid/sample annotations.
  - `src/domain/geometry.ts`: Algorithmic geometry routines: Monotone chain 2D convex hull, centroid calculation, ordinary least squares regression, and padded coordinate ranges.
  - `src/domain/colors.ts`: Categorical palette definitions (`classic`, `pastel`, `solid`, `neon`, `muted`, `earth`), hex blending/shading, fallback algorithmic color generators, and chart background contrast calculations.
  - `src/domain/metadata.ts`: Parser for optional `.eval` spectrum files and eigenvalue percentage-of-variance formatters.
  - `src/domain/viewport.ts`: Fractional cursor zoom mathematics and delta-pixel mousewheel normalization.
  - `src/domain/archive.ts`: Serializes state and dataset into a self-contained HTML offline bundle; reads `#pca-archive` DOM payloads.
  - `src/domain/export.ts`: CSV generator (`samplesToCsv`) with formula-injection guard and blob download trigger.
  - `src/domain/imageExport.ts`: Pure image bounding-box mathematics and layout placement engine for rendered exports.
- **UI Components & Visualization**:
  - `src/components/Workspace.tsx`: 514-line central coordinator managing workspace toolbar, axes bar, search, layout toggles, popover states, modal dialogs, status bar, and responsive maximize views.
  - `src/components/PcaPlot.tsx`: 926-line monolithic visualization component wrapping Plotly. Manages dynamic renderer selection, internal layout hit-testing, pointer down/move/up tracking, long-press timer, pinch-to-zoom gestures, mousewheel coalescing, and offscreen canvas snapshot capture.
  - `src/components/PlotTools.tsx`: Toolbar buttons for zoom, pan, lasso, selection, marker sizing, opacity cycling, hulls, regressions, and connectors.
  - `src/components/Legend.tsx`: Collapsible dock showing population items, swatch icons, visibility toggles, filtering, search, and context menu triggers.
  - `src/components/PopulationEditor.tsx`: Popover editor for individual population styling (color, marker shape, fill/hollow treatment, hull, regression, labels).
  - `src/components/PointInspector.tsx`: Popover inspector for individual sample points (red boundary mark, shape override, size, color, callout labels).
  - `src/components/SettingsDialog.tsx`: 775-line tabbed modal covering Chart, Markers, Labels, Legend, Hover, Geometry, and Variance settings.
  - `src/components/ExportPanel.tsx`: Modal dialog for PNG and interactive HTML export with live canvas-composed preview.
  - `src/components/composePng.tsx`: Utility blending Plotly plot bitmap with canvas 2D legend and headings using `react-dom/server`.
  - `src/components/SampleTable.tsx`: Paginated table view for inspecting individual coordinates and selecting points.
  - `src/components/UploadPanel.tsx` & `AppHeader.tsx`: Empty state landing card and global application header bar.
  - `src/components/StyleControls.tsx`, `ColorControl.tsx`, `MarkerSwatch.tsx`, `MarkerShapePicker.tsx`, `Popover.tsx`, `Dialog.tsx`: UI primitives and popover cards.
- **Styling**:
  - `src/styles.css`: 2,227-line flat stylesheet containing all global, layout, component, popover, modal, and responsive styles.
- **Build Infrastructure**:
  - `build/archivePlugin.ts`: Vite plugin using `esbuild` to compile a standalone IIFE bundle (`archive-runtime.json`) for self-contained offline HTML distribution.

---

## 2. Coupling and Fragmentation

### 2.1 Unwanted Tight Coupling
1. **Plotly Internals Leaked into Core UI (`PcaPlot.tsx`)**:
   `PcaPlot.tsx` directly accesses private Plotly properties:
   - `_fullLayout.xaxis.l2p`: Internal coordinate-to-pixel projection used for custom point hit testing.
   - `_fullLayout.xaxis._offset`, `_fullLayout.xaxis._length`: Internal canvas offsets for pointer and pinch gestures.
   - `_fullLayout.xaxis.range`, `_fullLayout.yaxis.range`: Internal axis spans.
   *Impact*: Any minor Plotly patch or version bump that renames internal properties immediately breaks hit testing, point selection, context menus, touch zoom, and wheel zoom without compile-time warnings.
2. **Export System Bound to DOM and Canvas Elements**:
   - `capturePng` in `PcaPlot.tsx` imperatively injects a hidden DOM node (`left: -20000px`), calls `api.current.newPlot`, scrapes rendered DOM elements (`target.querySelectorAll('.xtick text, .ytick text')`), queries bounding rects, and tears down the DOM.
   - This ties export capabilities strictly to an active interactive DOM window, preventing clean headless rendering or unit testing.
3. **Plotly Schema Permeating Domain Layer**:
   `plotModel.ts` directly creates `Data[]`, `Shape[]`, and `Annotations[]` conforming to Plotly's specific JSON schema. The domain layer is coupled directly to the rendering vendor rather than producing a clean, engine-agnostic visualization specification.

### 2.2 Unnecessary Fragmentation
1. **Export Pipeline Fragmented Across Five Files**:
   Export features are needlessly split between:
   - `src/domain/export.ts` (CSV stringification)
   - `src/domain/imageExport.ts` (placement geometry math)
   - `src/components/composePng.tsx` (Canvas 2D composition, misplaced in `components/`)
   - `src/components/ExportPanel.tsx` (UI modal)
   - `src/domain/archive.ts` (HTML archive packaging)
   There is no single cohesive export service.
2. **Style & Shape Resolution Fragmented Across the Stack**:
   The logic for determining a point's final visual representation (color, hollow vs filled, outline mode, outline width, size) is scattered across:
   - `viewState.ts` (`populationAppearance`, `markerAppearance`, `renderedMarker`)
   - `plotModel.ts` (annotation sizing, font sizing fallback chains)
   - `PopulationEditor.tsx` (marker treatment interpretation)
   - `PointInspector.tsx` (local sample override resolution)
   - `MarkerSwatch.tsx` (SVG swatch rendering)
   There is no single Style Resolver module.
3. **Geometry Recalculation in View Components**:
   `Legend.tsx` lines 52-68 recalculates `convexHull` directly inside component render functions for the currently hovered population, rather than consuming precomputed geometry from the plot model.

---

## 3. Inconsistent Patterns

### 3.1 Naming Inconsistencies
| Concept | Current Variants Across Files | Recommended Standard |
|---|---|---|
| Population / Group | `population`, `populations`, `allPopulations`, `groupLabels`, `groupLabelSize`, `groupLabelStyle`, `groupLabelConnector`, `FID` | **Group** (internally normalized) or **Population** (domain model), consistently applied. |
| Sample / Point | `sample`, `samples`, `points`, `point`, `resetPoint`, `toggleMark`, `IID` | **Sample** for data identity, **Point** for visual scatter representation. |
| Boundary / Outline | `outlineWidth`, `outlineMode`, `outlineColor`, `boundary width`, `boundary opacity`, `outline opacity` | **Outline** across all controls and state properties. |

### 3.2 State Management & Data Flow Inconsistencies
- **Dual State Architecture**:
  The application maintains plot view state in a reducer (`viewReducer`), but holds UI and interaction states in more than 15 separate `useState` and `useRef` hooks across `Workspace.tsx` and `PcaPlot.tsx`.
- **Action Granularity**:
  Some reducer actions accept full batch arrays (`{ type: "allPopulations", names, patch }`), while others mutate single keys (`{ type: "point", key, patch }`), and others trigger global side-effects (`{ type: "markers", names, value }` which rewrites both population symbols and plot settings simultaneously).
- **Map Mutation Patterns**:
  In `viewReducer`, state objects use `new Map(state.populations)` with shallow clones. However, nested object styles inside maps are shared references, meaning mutations to inner style objects could produce subtle rendering bugs if not strictly overwritten.

### 3.3 Styling Inconsistencies
- **Monolithic CSS with Specificity Wars**:
  `src/styles.css` is 2,227 lines with zero modular scoping. Generic element rules (e.g. `button:hover:not(:disabled)`) have historically collided with custom button classes (e.g. `.settings-done`, `.primary-export`), turning dark buttons white on hover.
- **Scattered & Arbitrary Breakpoints**:
  Media queries are defined at `500px`, `540px`, `640px`, `700px`, `800px`, `900px`, `1024px`, and `1350px` without a unified breakpoint system. React hooks (`useIsMobile(640)`, `useIsTablet(641, 1024)`) do not match all CSS media query thresholds.
- **Mixed Design Tokens**:
  A handful of CSS custom properties (`--accent`, `--muted`, `--line`) coexist with over 40 hardcoded hex color values (`#222`, `#fff`, `#f1f2f3`, `#e0e0e0`, `#cbd5e1`, `#374151`, `#1f2328`, `#696969`, `#4e4e4e`).

### 3.4 Error Handling Inconsistencies
- Errors are raised via strings in some places (`throw new Error(...)`), handled via local component state in others (`error` in `Workspace`, `error` in `PcaPlot`, `error` in `SettingsDialog`, `error` in `ExportPanel`), and swallowed silently in workers or touch listeners with empty `catch {}`. There is no central error reporting or user notification pipeline.

---

## 4. Dead Code, Duplicated Logic & Unused Dependencies

1. **`react-dom/server` in Client-Side Bundle**:
   `composePng.tsx` imports `renderToStaticMarkup` from `react-dom/server` solely to render the `MarkerSwatch` SVG component to an XML string, convert it to a Blob, and draw it on a 2D canvas. This pulls server-rendering machinery into the client bundle when direct Canvas 2D path rendering or a clean SVG string helper is much smaller, faster, and synchronous.
2. **Dual Plotly Distribution Dependencies**:
   `package.json` installs both `plotly.js-basic-dist-min` (1.1 MB) and `plotly.js-gl2d-dist-min` (1.6 MB). While intended to conditionally use SVG for $\le 5,000$ points and WebGL for larger datasets, maintaining both distributions creates duplicate vendor chunks and complex runtime loader switches.
3. **Repeated Symbol Open/Hollow Transformation Logic**:
   The string transformation logic `symbol.endsWith("-open")` and `symbol.replace(/-open$/, "")` is duplicated across 8 separate files (`viewState.ts`, `plotModel.ts`, `PopulationEditor.tsx`, `PointInspector.tsx`, `MarkerSwatch.tsx`, `StyleControls.tsx`, `PlotTools.tsx`, `imageExport.ts`).
4. **Redundant Axis Variance Math**:
   Variance percentage calculations are duplicated between `src/domain/metadata.ts` (`axisTitle`) and `src/components/AppHeader.tsx`.

---

## 5. Architectural Loopholes & Hidden Failure Modes

1. **Unbounded Asynchronous Render Queue in `PcaPlot.tsx`**:
   `queue.current` chains promises (`queue.current = queue.current.then(...)`). If a render throws or rejects, subsequent calls attached to `.then()` can stall or fail to render without clearing the queue.
2. **Coordinate Cache Desynchronization**:
   In `PcaPlot.tsx`, `renderedAxes.current` is stored in a `useRef` to track which axes are currently displayed on the canvas. If React re-renders with new PC axes before the Plotly async promise resolves, incoming click and hit-test events evaluate coordinates against the wrong PC dimensions.
3. **Global State Evaluation at Import Time (`archive.ts`)**:
   `export const embeddedArchive = readArchive();` executes DOM queries (`document.getElementById("pca-archive")`) immediately when the module is imported. This creates hidden side effects, causes testing hurdles in non-DOM environments, and prevents multi-instance execution.
4. **Row Index Identity (`key: number`)**:
   `Sample.key` is defined as the zero-based row index from parsing. If datasets are ever sorted, filtered, or merged, map lookups into `state.points.get(sample.key)` fail or attach customizations to the wrong biological sample.
5. **Offscreen DOM Scraping for Layout Bounding Boxes**:
   `capturePng` relies on rendering a live Plotly chart into a hidden DOM element (`left: -20000px`) and scraping CSS classes `.xtick text` and `.ytitle` using `getBoundingClientRect()`. In headless environments or during automated rendering, `getBoundingClientRect()` returns zeros, breaking layout calculation.

---

## 6. Prioritized Issue Matrix: Broken/Fragile vs. Inelegant

| Priority | Category | Issue Description | Consequence |
|---|---|---|---|
| **P0 - Critical** | Fragile | Reliance on private Plotly internal properties (`_fullLayout.xaxis.l2p`, `_offset`, `_length`) for hit testing and touch gestures. | Breaking change on any Plotly upgrade; erratic behavior on non-standard DPI screens. |
| **P0 - Critical** | Fragile | Offscreen DOM insertion and bounding-box scraping for image export. | Fails in headless browsers, background tabs, or test environments; DOM leaks if errors occur. |
| **P0 - Critical** | Fragile | Asynchronous `queue.current` in `PcaPlot.tsx` with race conditions on rapid axis switching. | Visual glitches, dropped frames, stale coordinate projections, unhandled promise rejections. |
| **P1 - High** | Architecture | Style resolution scattered across domain, reducer, and five separate UI components. | Inconsistent styling rules, hard-to-maintain overrides, duplicate suffix-checking logic. |
| **P1 - High** | Architecture | Monolithic `styles.css` (2,227 lines) without CSS modules or design tokens. | Frequent CSS specificity collisions, style bleeding, unmaintainable media queries. |
| **P1 - High** | Architecture | Giant multi-responsibility components (`PcaPlot`: 926 lines, `SettingsDialog`: 775 lines, `Workspace`: 514 lines). | Difficult to test, hard to reason about, high cognitive overhead. |
| **P2 - Medium** | Inelegant | `react-dom/server` included in client bundle for Canvas legend rendering. | Unnecessary bundle weight and async blob overhead in export pipeline. |
| **P2 - Medium** | Inelegant | Inconsistent terminology (`population` vs `group`, `boundary` vs `outline`, `sample` vs `point`). | Confusing API surface and developer friction. |
| **P2 - Medium** | Inelegant | `embeddedArchive` executing global DOM query on module evaluation. | Hidden side effects on module load. |
| **P3 - Low** | Inelegant | Redundant percentage formatting logic between `metadata.ts` and `AppHeader.tsx`. | Minor duplication, low risk. |

---

## 7. Next Steps: Target Architecture Preview

To resolve these architectural issues cleanly, the rebuild should establish:
1. **A Core Domain & Data Layer**: Strictly typed dataset models, robust file parsers, and a single, pure **Style Engine & Inheritance Resolver** (Sample overrides $\to$ Group overrides $\to$ Global defaults).
2. **Decoupled Plot Specification Layer**: A clean visualization abstraction producing pure chart specifications, completely isolated from vendor-specific rendering code.
3. **Dedicated Rendering Engine**: Encapsulate Plotly behind a robust adapter with standard public APIs, clean event boundaries, and robust hit-testing without private property hacking.
4. **Unified Export Service**: A single export subsystem handling PNG composition (direct Canvas 2D without `react-dom/server`), CSV generation, and self-contained HTML archiving.
5. **Modern Component & Design System**: Modular CSS with consistent design tokens, unified breakpoints, and thin, single-responsibility UI components.
