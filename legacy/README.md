# PCA Views

A compact, browser-only viewer for smartPCA / EIGENSOFT `.evec` files, with a classic monochrome interface. Upload a file, choose any two PCs, and explore samples with zoom, pan, population filters, and sample search.

## Run locally

Requires Node.js 22.12+ (or a newer supported LTS version).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. No server, database, accounts, or API keys are needed. File parsing runs in a Web Worker; coordinates and identifiers remain in browser memory. Refreshing clears the session. The built-in example is generated synthetic data.

## Plot tools

The plot fills the workspace. File name, sample/population/PC counts, and selected eigenvalues are in the top bar; its information button shows every eigenvalue and any parsing warnings.

- **Navigate:** mouse-wheel zoom at the cursor, pan, box zoom, zoom buttons, fit visible samples, reset all axes, crosshairs, and fullscreen. Cursors follow the active tool: grab/grabbing for pan, magnifier for box zoom, crosshair for box selection, and a lasso for freehand selection.
- **Select:** box/lasso select samples, mark selected rows with red boundaries, export selected coordinates, and clear selection.
- **Legend:** click a population to show/hide it. Right-click or use its three-dot button to edit color, shape, filled/hollow/mixed treatment, varied-shape presets, and population label style. Size, separate fill/boundary opacity, outline color/width, label size/color/opacity, point labels, and hull opacity are in collapsible More sections. Hulls, regression, isolation, and resetting are available. Hidden populations remain listed with a strikethrough and Hidden indicator.
- **Individual samples:** left-click a dot to toggle its red mark. Right-click to edit its shape, size, fill color, and outline (plot default, darker fill, black, or custom color). The editor also supports independent filled/hollow treatment, boundary width and opacity, and a draggable IID label with its own style, connector, color, size, and opacity. Editing does not mark the sample automatically. Overrides survive population edits, filtering, axis changes, and PNG export. Reset this sample restores its inherited appearance and clears its mark. These interactions work in every tool mode, even with hover disabled.
- **Plot settings:** six palettes adapted from the older viewer, lighter classic fills, filled/hollow circles or shapes, darker or black outlines with adjustable width, point size/opacity, grayscale, grid, standard chart ratios, equal axis units, on/off hover with checkbox-selected values, sample/population/full labels, draggable plain, background, or boxed group labels with independent centroid connectors, hull opacity, global hulls/regression, title/subtitle, and reset styles.
- **Data:** search samples/populations and open the paginated sample table from the upper-left toolbar.
- **Export:** a dedicated dialog shows an automatic PNG preview. Add a title and subtitle with independent font size/weight, place the legend around the plot frame in 1–6 columns (left/right aligned to its top edge; top/bottom centered on the frame), adjust its font/row/column spacing, and add a box boundary. The captured plot keeps its exact pixel proportions, zoom, and marker/label styles; headings and legend add space outside it. Download the preview as PNG, filtered coordinates as CSV, or the complete interactive session as a single HTML file.

Repeated clicks cycle marker fill/boundary opacity, point label content, chart ratios, and population labels (off → plain → background → boxed). Population label connectors have a separate toggle. One hull icon cycles off → 5% → 10% → 15% → 30% → 50% → 75% → off; two-point groups get a connecting line instead of a hull. Palette, marker shapes, and sizes live in settings. Hover has one on/off toolbar button; its IID, FID, and coordinate values are chosen with checkboxes in settings and displayed without field prefixes.

Tools are grouped by interaction, zoom, markers, labels/geometry, view/hover, settings, and data/export. Plot settings opens with **Chart**, followed by Markers, Labels, Legend, Hover, Geometry, and Variance. Chart controls include tick text size, axis line thickness presets (0.5, 1, 1.25, 1.5, 1.75, 2), axis title size/weight, background colors with adaptive grid contrast, and ratio thumbnails. Ratios include Full span, 1:1, 16:9, 4:3, 3:2, 4:5, and 9:16. All group label styles are draggable and retain positions for each PC pair. Context editors support Tab/Shift+Tab and Escape. The compact legend floats over the full-width plot; its search field opens from its search icon. Its gear opens Legend settings; visibility is toggled beside sample search in the second bar.

Defaults are IID-only hover, 12 px tick text, 1.25 px axis lines, 14 px axis titles, Full span, and the Solid palette. Datasets with up to eight populations start with filled circles; larger datasets start with filled shapes. **Plot settings → Reset to defaults** restores default styles, visibility, axes, zoom, and label positions for the loaded dataset. **Reset styles** changes appearance while keeping the current view and hidden populations.

### Single-file interactive archives

Choose **Export → Download interactive HTML**, then open the downloaded file directly in a browser. It contains the full dataset, eigenvalues, population and individual styles, hidden groups, filters, marked/selected rows, dragged label positions, axis pair/ranges, settings, and PNG export options. Individual IID label positions and chart backgrounds are retained too. Reset to defaults is available inside the archived viewer without discarding its data. Both plot renderers, the viewer code, and CSS are embedded, so no server, CDN, or internet connection is needed. Zoom, settings, editing, CSV/PNG export, loading another `.evec`, and exporting a revised HTML file remain available. The embedded viewer adds roughly 3.5 MB before the dataset. Hidden populations are included so recipients can show them again. To save later edits, download another HTML archive; the browser cannot rewrite the original file automatically.

The tools take behavioral inspiration from [Vahaduo g25views](https://github.com/vahaduo/g25views) and the local smartPCA viewer. G25's separate base/projected controls are represented as controls over the imported populations; the app reads already computed `.evec` coordinates and does not perform G25 reprojection.

See [the comparison with the older viewer](docs/REFERENCE_COMPARISON.md) for useful next additions: proximity multi-hover and pasted coordinates.

## Input format

```text
#eigvals: 12.4 8.6 4.2
Sample_01  0.012 -0.034 0.006 Group_A
Sample_02  0.025 -0.019 0.011 Group_B
```

Rows must have an ID, two or more finite numeric coordinates, and a single population token, separated by spaces or tabs. The final token is always the population, including numeric population labels. IDs and population names cannot contain whitespace. Blank lines and `#` comments are accepted; the `#eigvals:` header is optional. All rows must have the same PC count; an eigenvalue header must match that count. Scientific notation, Fortran `D` exponents, CRLF, and UTF-8 BOM are supported.

Invalid files are rejected with a useful error without replacing the currently loaded dataset. Duplicate IDs are retained as separate rows and reported in a warning. Without a header, a missing population token cannot always be distinguished from a numeric population label; supply standard smartPCA output.

Axis titles include percentages when eigenvalues are available. An `.evec` header can contain only the saved leading PCs, so the displayed percentages use the sum of the loaded eigenvalues by default. The axis stays concise, for example `PC1 (20.85%)`; the Variance settings explain the denominator. In Plot settings → Variance, import a matching `.eval` file and choose “Use this as the full spectrum” if it contains all eigenvalues, or supply the sum of all eigenvalues under Total variance. Axes then show total variance explained, for example `PC1 (12.50%)`. Missing or invalid variance information leaves plain PC labels.

Hover uses **IID = sample ID** and **FID = population/group label**, both read directly from the `.evec` file. Select any combination of IID, FID, and PC coordinates with checkboxes in Plot settings → Hover. No FID upload is needed.

## Deploy on GitHub Pages

1. Create a GitHub repository and push this project to its `main` branch.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. Run the **Deploy PCA Views to GitHub Pages** workflow, or push another commit to `main`.

The included workflow runs tests, builds the static application, and publishes only `dist/`. Vite uses relative asset paths, so account sites, repository sites, and custom domains work without hardcoding a repository name. If your default branch has another name, update `deploy.yml` accordingly.

Raw `*.evec` files are ignored by Git and are outside the public assets directory. The provided local `smartPCA.evec` remains untouched and is not included in the build. Do not place private files in `public/`, since Vite copies that directory to the published site.

Deployment follows [Vite's static deployment guidance](https://vite.dev/guide/static-deploy.html). Plot interaction uses the [Plotly.js API](https://plotly.com/javascript/).

## Architecture

```text
src/domain/       Parser, view reducer, geometry, plot model, palettes, CSV export
src/workers/      Background file-reading and parsing entry point
src/hooks/        Dataset loading lifecycle, errors, worker cleanup
src/components/   Plot adapter, toolbar, interactive legend, point editor, table
src/App.tsx       Application shell and upload flow
src/styles.css    Shared visual tokens and responsive component styles
src/test/         Parser, geometry, reducer, plot model, and export tests
e2e/              Browser interaction tests
```

The plot and table receive the same filtered samples and selection state. Row identity is independent of sample names. Plotly is isolated behind `PcaPlot` and a small imperative interface for zoom/fit/reset/export. Its SVG renderer is lazy-loaded for datasets up to 5,000 samples; larger datasets use a separately loaded WebGL renderer. Both are bundled locally, not fetched from a CDN. Wheel, toolbar zoom, resize, and chart updates share a serialized queue to preserve the viewport during edits. New import formats should produce the same `Dataset` shape rather than mixing parsing into UI components. See [NOTES.md](NOTES.md) for extension points and limits.

## Validate

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests cover file loading and validation, plot dimensions, both directions of mouse-wheel zoom, axis changes, context menus, population colors/hulls/hiding, independent point marks, box/lasso selection, panning, display tools, exports, and mobile overflow. Pull requests run all these checks through GitHub Actions.
