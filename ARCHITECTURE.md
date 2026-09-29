# Target Architecture: PCA Views

## 1. Architectural Principles & Separation of Concerns

The redesigned architecture establishes four strictly bounded layers with unidirectional dependencies:

```
[Presentation Layer: UI Components & Primitives]
                     │
                     ▼
[Application & State Layer: ViewState, Actions, Selectors]
                     │
                     ▼
[Domain & Specification Layer: Models, Style Engine, PlotSpec, Export]
                     │
                     ▼
[Infrastructure & Adapters: Plotly Adapter, Web Worker, File IO]
```

### Layer Responsibilities

1. **Core Domain (`src/core/`)**:
   Pure, deterministic business logic with zero framework or UI dependencies. Contains data models (`Dataset`, `Sample`, `Population`), math/geometry engines (`convexHull`, `regression`, `viewport`), color algorithms (`palettes`, `contrast`), and streaming parsers (`evec`, `eval`).
   _Justification_: Keeping domain logic strictly pure enables headless execution in Web Workers, effortless unit testing, and complete freedom from browser or React lifecycle quirks.
2. **Style Engine (`src/core/style/`)**:
   A unified cascading resolution engine that computes the final visual manifestation of any point or group:
   $$\text{Sample Override} \longrightarrow \text{Population Override} \longrightarrow \text{Global Settings Default}$$
   _Justification_: Consolidating style evaluation into a single pure pipeline replaces redundant string hacks (`-open`) scattered across eight files with a deterministic, testable source of truth.
3. **Plot Specification & Renderer Abstraction (`src/plot/`)**:
   An engine-agnostic visualization specification (`PlotSpec`). An adapter (`adapters/plotly/`) maps this spec to Plotly calls. Interaction managers (pinch, wheel, hit testing) operate on standard canvas viewport coordinates without touching private Plotly internals.
   _Justification_: Decoupling visualization specification from rendering vendor isolates the application from Plotly breaking changes and enables future canvas/WebGL migrations without touching UI code.
4. **Export Service (`src/services/export/`)**:
   A unified subsystem handling high-resolution PNG image composition, CSV data export, and self-contained interactive HTML archive generation.
   _Justification_: Merging previously disconnected export scripts eliminates `react-dom/server` overhead in the client bundle and ensures identical styling between on-screen and exported figures.
5. **State & Selectors (`src/state/`)**:
   Clean separation between persistent plot/view state (stored in a typed reducer) and ephemeral UI state (dialog visibility, active tabs, search strings). Selectors memoize derived data (`filteredSamples`, `visiblePopulations`, `statusMetrics`).
   _Justification_: Disentangling view state from ephemeral component state prevents unnecessary re-render cascades and eliminates the need for giant coordinator components with dozens of ad-hoc hooks.
6. **Design System & Presentation (`src/ui/`)**:
   Thin, single-responsibility React components backed by a design system of tokens (colors, spacing, typography, z-index) and atomic primitives (`Button`, `Slider`, `Popover`, `Modal`).
   _Justification_: Tokenizing the UI prevents specificity collisions, enforces accessible contrast across all buttons, and aligns mobile/tablet/desktop breakpoints consistently.

---

## 2. Directory Structure & Module Boundaries

```
src/
├── core/                         # Pure domain logic (no React, no Plotly)
│   ├── models/                   # Typed entities
│   │   ├── dataset.ts            # Dataset, Sample, Population
│   │   └── settings.ts           # PlotSettings, defaults, options
│   ├── parsers/                  # File format parsing & validation
│   │   ├── parseEvec.ts          # smartPCA .evec parser
│   │   └── parseSpectrum.ts      # .eval eigenvalue parser
│   ├── geometry/                 # Algorithmic geometry
│   │   ├── hull.ts               # Monotone chain convex hull
│   │   ├── regression.ts         # Least squares linear regression
│   │   └── viewport.ts           # Range padding, fractional zoom, wheel math
│   ├── color/                    # Color science & palettes
│   │   ├── palettes.ts           # Categorical palettes
│   │   ├── contrast.ts           # Lightness & background contrast
│   │   └── colorUtils.ts         # Hex/RGBA parsing, alpha, shading
│   └── style/                    # Unified style resolution engine
│       ├── symbols.ts            # Marker symbols, shapes, filled/hollow rules
│       └── styleResolver.ts      # Sample -> Population -> Global cascade
│
├── plot/                         # Visualization abstraction & rendering
│   ├── spec/                     # Pure visualization specification
│   │   ├── plotSpec.ts           # Types: traces, shapes, annotations, layout
│   │   └── buildPlotSpec.ts      # Transforms (Dataset, ViewState) -> PlotSpec
│   ├── gestures/                 # Canvas interaction math & gesture recognizers
│   │   ├── hitTest.ts            # High-performance point hit testing
│   │   ├── pinchZoom.ts          # Two-finger pinch-to-zoom coordinator
│   │   └── wheelZoom.ts          # Coalesced wheel zoom handler
│   └── adapters/plotly/          # Concrete Plotly adapter
│       ├── plotlyLoader.ts       # Vendor chunk loader
│       └── plotlyRenderer.ts     # Lifecycle: mount, react, relayout, purge
│
├── services/                     # Application services
│   ├── export/                   # Export subsystem
│   │   ├── csvExport.ts          # Formula-safe CSV serialization
│   │   ├── canvasComposer.ts     # Pure Canvas 2D PNG composer (no react-dom/server)
│   │   └── archiveService.ts     # Self-contained HTML archive packaging
│   └── worker/                   # Web Worker communications
│       ├── evec.worker.ts        # Off-thread parsing worker
│       └── workerClient.ts       # Typed worker client promise wrapper
│
├── state/                        # Application state management
│   ├── viewState.ts              # ViewState interface & initial state
│   ├── viewReducer.ts            # Atomic, strongly-typed state transitions
│   ├── viewActions.ts            # Action union types & action creators
│   └── viewSelectors.ts          # Memoized derived state (filtered samples, metrics)
│
├── ui/                           # Presentation components & design system
│   ├── tokens/                   # Design system tokens & CSS variables
│   │   ├── tokens.css            # Colors, spacing, fonts, radii, elevations
│   │   └── breakpoints.ts        # Shared breakpoint constants (mobile, tablet, desktop)
│   ├── hooks/                    # Presentation hooks
│   │   ├── useResponsive.ts      # Unified mobile/tablet/desktop detection
│   │   └── useKeyboardTrap.ts    # Accessible modal focus management
│   ├── primitives/               # Reusable atomic UI elements
│   │   ├── Button.tsx            # High-contrast accessible buttons (default, primary, icon)
│   │   ├── Slider.tsx            # Range slider with value badge
│   │   ├── ColorPicker.tsx       # Color input with palette swatches
│   │   ├── ShapePicker.tsx       # Accessible marker symbol selector
│   │   ├── Popover.tsx           # Floating card with viewport boundary clamping
│   │   └── Modal.tsx             # Accessible dialog container with backdrop
│   ├── components/               # Composite feature components
│   │   ├── header/               # AppHeader & dataset summary
│   │   ├── toolbar/              # PlotToolbar, tool groups, custom SVG icons
│   │   ├── legend/               # LegendDock, LegendRow, population actions
│   │   ├── plot/                 # PcaPlotCanvas wrapper
│   │   ├── inspectors/           # PopulationEditor, PointInspector
│   │   ├── dialogs/              # SettingsDialog (modular tabs), ExportDialog, SampleTableDialog
│   │   └── upload/               # UploadDropzone & example loader card
│   └── styles/                   # Modular stylesheets matching components
│       ├── base.css              # Reset, typography, layout fundamentals
│       ├── toolbar.css           # Workspace toolbar styling
│       ├── legend.css            # Legend dock styling
│       ├── plot.css              # Canvas & plot container styling
│       ├── dialogs.css           # Modal & popover styling
│       └── responsive.css        # Responsive layouts & compact floating bars
│
├── App.tsx                       # Root view router (Empty vs Workspace)
└── main.tsx                      # Mount point
```

---

## 3. Data Flow & Communication Patterns

The entire system follows a **strictly unidirectional** data flow:

```
[User Action] (Click, Pinch, Keyboard, Upload)
     │
     ▼
[Action Dispatcher] (viewReducer)
     │
     ▼
[New ViewState]
     │
     ├─────────────► [Selectors] (filteredSamples, visibleGroups)
     │                     │
     ▼                     ▼
[Style Engine & PlotSpec Builder] (Pure transformation)
     │
     ▼
[PlotSpec] (Abstract visualization specification)
     │
     ├─────────────► [Plotly Adapter] (Renders canvas/WebGL)
     │
     └─────────────► [Canvas Export Composer] (Renders offline PNG)
```

### Module Communication Rules

1. **Components never mutate state directly**: All modifications flow through typed `dispatch(action)`.
2. **Components never compute raw styles**: Components request visual properties from `StyleResolver`, which evaluates the Sample $\to$ Population $\to$ Global cascade.
3. **No direct Plotly imports in UI components**: Only `adapters/plotly/` is permitted to import Plotly. Components receive plot events (`onPointClick`, `onSelect`, `onViewportChange`) through engine-agnostic callbacks.
4. **Export uses PlotSpec, not live DOM**: Image export creates an offscreen canvas directly using `PlotSpec` and `Canvas2D`, never injecting dummy DOM elements at `left: -20000px`.
5. **No global DOM queries on import**: Archive reading is wrapped in an explicit service call (`archiveService.getEmbeddedArchive()`), removing hidden side effects during module load.

---

## 4. State Management Architecture

### ViewState vs. Ephemeral UI State

State is partitioned into two distinct categories:

#### A. Persistent Plot State (Managed by `viewReducer`)

This represents everything needed to reproduce the plot exactly (and serialize to an interactive HTML archive):

- `axes`: Selected horizontal ($X$) and vertical ($Y$) principal components.
- `settings`: Global `PlotSettings` (palette, marker preset, size, opacity, outline width/mode/opacity, grid, label modes, label sizes, aspect ratio, legend layout, axis formatting).
- `populations`: Map of per-population overrides (`PopulationStyle`).
- `samples`: Map of per-sample overrides (`SampleStyle`).
- `selectedSampleKeys`: Set of currently highlighted sample identifiers.
- `spectrum`: Optional `.eval` eigenvalues for custom variance calculation.

#### B. Ephemeral UI State (Managed locally where appropriate)

Transient interaction state that should not pollute plot serialization:

- Active modal / popover (`settingsDialog`, `exportDialog`, `sampleTable`, `helpDialog`, `activeInspector`).
- Active inspector anchor coordinate `{ x, y }`.
- Legend search query and show-hidden filter toggle.
- Table pagination current page.
- Maximize plot view toggle on compact screens.

_Justification_: Isolating plot state ensures archives contain exactly what is needed without leaking transient UI state, while preventing UI interactions (e.g. typing in a search box) from triggering full visualization rebuilds.

---

## 5. Standardized Terminology & Conventions

To eliminate ambiguity across the codebase, the following terms are codified:

| Standard Term  | Scope             | Definition                                                               | Deprecated / Replaced Terms               |
| -------------- | ----------------- | ------------------------------------------------------------------------ | ----------------------------------------- |
| **Population** | Biological entity | Grouping label from the `.evec` file (e.g., `YRI`, `CEU`).               | `group`, `FID`, `fam`                     |
| **Sample**     | Biological entity | An individual specimen row with ID and PC coordinates.                   | `IID`, `row`                              |
| **Point**      | Visual entity     | The rendered graphical marker representing a sample on canvas.           | `dot`, `marker` (when referring to point) |
| **Marker**     | Visual entity     | The shape and treatment of a point (e.g., circle, square).               | `symbol`, `shape`                         |
| **Outline**    | Visual entity     | The border stroke around a marker or callout box.                        | `boundary`, `stroke`                      |
| **Treatment**  | Visual entity     | Whether a marker is `filled`, `hollow`, or `mixed`.                      | `style`, `type`                           |
| **Callout**    | Visual entity     | Text label with optional leader connector line pointing to a coordinate. | `annotation`, `label connector`           |

---

## 6. Design System & CSS Token Strategy

The monolithic `styles.css` is replaced with an organized, tokenized architecture:

### 1. Token Definitions (`tokens.css`)

- **Color Palettes**: Neutral grays (`--color-surface-0` through `--color-surface-900`), brand accents (`--color-accent`, `--color-accent-hover`), text tiers (`--color-text-primary`, `--color-text-secondary`, `--color-text-muted`), and semantic alerts (`--color-danger`, `--color-warning`).
- **Typography**: System font stack, strictly bounded font-size scale (`10px`, `11px`, `12px`, `14px`, `16px`, `20px`, `24px`), font weights (`400`, `500`, `600`, `700`).
- **Spacing Scale**: 4px base grid (`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`).
- **Z-Index Scale**: Explicit layering scale (`--z-plot: 1`, `--z-controls: 10`, `--z-dock: 20`, `--z-popover: 50`, `--z-modal: 100`, `--z-toast: 200`).

### 2. Unified Responsive Breakpoints (`breakpoints.ts`)

```ts
export const BREAKPOINTS = {
  mobileMax: 640,
  tabletMin: 641,
  tabletMax: 1024,
  desktopMin: 1025,
} as const;
```

CSS media queries and React responsive hooks strictly adhere to these three breakpoints, eliminating the eight scattered thresholds.

### 3. Accessible Button & Contrast Guarantee

- Button classes explicitly define default, hover, focus-visible, active, and disabled states.
- Dark buttons (`.btn-primary`, `.btn-dark`, `.btn-done`) always maintain `--color-text-inverse: #ffffff` on all hover and active states.
- Interactive elements receive consistent 2px focus rings (`outline-offset: 2px`).

---

## 7. Build, Verification & Migration Order

To overhaul the architecture safely without breaking existing workflows or regressions, the rebuild will proceed in strict dependency order:

1. **Step 1: Core Foundation & Domain Models** (`src/core/models/`, `parsers/`, `geometry/`, `color/`)
   - Pure TypeScript, 100% unit-tested against existing tests.
2. **Step 2: Style Engine & Symbol Resolution** (`src/core/style/`)
   - Complete 3-tier style resolution cascade with filled/hollow rules.
3. **Step 3: Plot Specification & Abstraction** (`src/plot/spec/`, `plot/gestures/`)
   - Engine-agnostic plot model builder and clean gesture recognition without private Plotly property hacking.
4. **Step 4: Concrete Plotly Adapter** (`src/plot/adapters/plotly/`)
   - Encapsulated lifecycle, responsive resizing, and canvas rendering.
5. **Step 5: Unified Export Subsystem** (`src/services/export/`)
   - Pure Canvas 2D PNG composer without `react-dom/server`, CSV exporter, HTML archive serializer.
6. **Step 6: State Architecture & Reducer** (`src/state/`)
   - Clean typed reducer, actions, and selectors.
7. **Step 7: Design System Tokens & Base Primitives** (`src/ui/tokens/`, `src/ui/primitives/`)
   - Accessible buttons, inputs, sliders, popovers, modals.
8. **Step 8: Feature Components & Application Shell** (`src/ui/components/`, `App.tsx`)
   - Header, toolbar, legend dock, inspector popovers, settings dialog tabs, export dialog.
9. **Step 9: Test Suite & End-to-End Verification**
   - Full Vitest test suite and Playwright verification confirming zero regressions.
