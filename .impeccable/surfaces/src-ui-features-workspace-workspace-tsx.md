---
version: 1
slug: "src-ui-features-workspace-workspace-tsx"
primary_target: "src/ui/features/workspace/Workspace.tsx"
related_targets: ["src/app/App.tsx","src/styles.css","src/ui/features/workspace/PlotToolbar.tsx"]
---

# Research workspace

Mode: Operate. Audience: genomics researchers inspecting precomputed smartPCA coordinates and preparing figures. Owner approved automatic execution, a plot-first layout, a collapsible population panel, and sample inspection on demand. Keep scientific values, row identity, data/export scopes, and offline archives compatible.

## Direction contract

THESIS: A research atlas whose chart is the working surface. Desktop actions have named controls and progressively disclosed advanced styling. The owner explicitly prefers compact, horizontally scrollable controls on mobile so the chart takes most of the screen.

OWN-WORLD: Botanical atlas margins translated into standard web UI: white chart, deep forest-green header, pale sage supporting surfaces, charcoal system-sans labels, tabular numeric data, fine rules, restrained amber feedback. Population colors remain scientific data encodings.

STORY: Load existing results, navigate and inspect the plot, use the population margin to control visibility, then export exactly the intended figure or rows. Selection and exclusion remain distinct.

FIRST VIEWPORT: A 56px dataset header with Open, Samples, Settings, and Export; a separate axis/search row; one compact navigation toolbar over a white plot; a collapsible 280px population panel outside the chart. On phones and short landscape viewports (width up to 1024px and height up to 480px), use a 48px dataset header, one 49px scrolling axes/search row, one 49px scrolling tool row with all appearance tools inline, and a 24px status row. Keep 44px controls and open populations on demand. At 390 × 844, the chart is 674px tall. Signature interaction: selecting and inspecting a sample carries its identity and inherited population style into the inspector without losing plot context.

FORM: Botanical atlas margin, grounded candidate 6. seed:7159a573b82cdede. The owner's plot-first structure overrides any unrelated catalog topology. The darkroom challenger contributes disciplined state contrast, transit contributes unambiguous data/interaction color roles, and the lexicon contributes a useful information margin; their ornament and navigation are declined. Other challengers lose product clarity and are declined.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

No shipping raster assets are required; the visualization uses computed geometry and standard controls. Accessibility target: WCAG 2.2 AA implementation checks, without a certification claim.
